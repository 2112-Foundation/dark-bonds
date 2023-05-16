use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

use metaplex_token_metadata::state::Metadata;


use super::common::buy_common;

const SECONDS_YEAR: f64 = 31536000.0;

#[derive(Accounts)]
#[instruction(lockup_idx: u32)]
pub struct GatedBuy<'info> {
    
    #[account(mut)]
    pub buyer: Signer<'info>,    
    #[account(        
        init,      
        seeds = ["ticket".as_bytes(), ibo.key().as_ref(),  &ibo.ticket_counter.to_be_bytes()], // TODO add counter
        bump,      
        payer = buyer, 
        space = 400
    )]    
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    
    #[account(                
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(),  &lockup_idx.to_be_bytes()], // TODO add counter
        bump,              
    )]    
    pub lockup: Account<'info, LockUp>,

    // TODO needs to be derived off the lockup counter
    #[account(mut)]
    pub gate: Account<'info, Gate>,
    // purchse token
    // Provided ATA has to be same mint as the one set in ibo
    #[account(mut, token::mint = ibo.stablecoin, token::authority = buyer)]
    pub buyer_ata: Box<Account<'info, TokenAccount>>,    
    #[account(mut)] 
    pub recipient_ata: Box<Account<'info, TokenAccount>>,

    // bond token    
    #[account(mut)]
    pub ibo_ata: Box<Account<'info, TokenAccount>>,
    // Check for ticket substitution attack
    #[account(mut, token::authority = ticket)]
    pub ticket_ata: Box<Account<'info, TokenAccount>>,       

    // #[account(mut, has_one = mint)]
    // pub nft_account: Box<Account<'info, TokenAccount>>,
    // pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>, 

    // NFT stuff
    mint: Account<'info, Mint>,
    #[account(mut, has_one = mint)]
    nft_token_account: Account<'info, TokenAccount>,
    /// CHECK:
    nft_metadata_account: AccountInfo<'info>,
    /// CHECK:
    nft_master_edition_account: AccountInfo<'info>,
}

impl<'info> GatedBuy<'info> {
    // fn transfer_liquidity(&self, from_ata: &Account<'info, TokenAccount>, to_ata: &Account<'info, TokenAccount>, auth: &Signer<'info>) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
    fn transfer_liquidity(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.buyer_ata.to_account_info(),
                to: self.recipient_ata.to_account_info(),
                authority: self.buyer.to_account_info(),
            },
        )
    }

    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ibo_ata.to_account_info(),
                to: self.ticket_ata.to_account_info(),
                authority: self.ibo.to_account_info(),
            },
        )
    }

    fn verify(&self, mint_key: Pubkey, master_key: Pubkey, creator_key: Pubkey) -> Result<()> {
        // Verify NFT token account
        // Check if the owner of the token account is the buyer
        if self.nft_token_account.owner != self.buyer.key() {
            return Err(ErrorCode::InvalidNFTAccountOwner.into());
        }
        // Check if the mint of the token account is the mint provided
        if self.nft_token_account.mint != self.mint.key() {
            return Err(ErrorCode::InvalidNFTAccountMint.into());
        }
        // Check if the amount in the token account is exactly 1 (as expected for an NFT)
        if self.nft_token_account.amount != 1 {
            return Err(ErrorCode::InvalidNFTAccountAmount.into());
        }
    
        // Verify NFT Mint
        // Check if the master edition account key matches the provided master key
        if master_key != self.nft_master_edition_account.key() {
            return Err(ErrorCode::InvalidMasterEdition.into());
        }
        // Check if the master edition account contains any data
        if self.nft_master_edition_account.data_is_empty() {
            return Err(ErrorCode::InvalidMasterEdition.into());
        }
    
        // Print the master key and the master edition account key for debugging purposes
        msg!("master_key: {:?}", master_key);
        msg!("nft_master_edition_account: {:?}", self.nft_master_edition_account.key());
    
        // Verify NFT metadata
        // Extract the metadata from the metadata account and check if its mint matches the provided mint
        let metadata = Metadata::from_account_info(&self.nft_metadata_account)?;
        if metadata.mint != self.mint.key() {
            return Err(ErrorCode::InvalidMetadata.into());
        }
    
        // Check if the metadata contains any data
        // if metadata.data.is_empty() {
        //     return Err(ErrorCode::InvalidMetadata.into());
        // }
    
        // Verify NFT creator
        // Check if there's any creator in the metadata that matches the provided creator key and is verified
           if !metadata.data.creators.iter().any(|creator_vec| {
            if let Some(creator) = creator_vec.first() {
                creator.address == creator_key // && creator.verified
            } else {
                false
            }
        }) {
            return Err(ErrorCode::InvalidCreator.into());
        }
        
        Ok(())
    }
    
}

// PDA for acceptable mints
// Extra cut for deposit which goes on to make LP in raydium

// below reusable code needs to be abstracted away between both purchase types

pub fn gated_buy_bond(ctx: Context<GatedBuy>, _lockup_idx: u32, ibo_idx: u64, stable_amount_liquidity: u64) -> Result<()> {    

  
    // let gate: &Account<Gate> = &ctx.accounts.gate;
    let gate = ctx.accounts.gate.clone();
    

    msg!("gate.master_key: {:?}",gate.master_key);

    let mint_key = gate.mint_key;
    let master_key = gate.master_key;
    let creator_key = gate.creator_key;
    


    // Check that the caller is the owner of the desired NFT
    ctx.accounts.verify(gate.mint_key.clone(), gate.master_key.clone(), gate.creator_key.clone())?;


    let buyer: &Signer = &ctx.accounts.buyer;
    let lockup: &Account<LockUp> = &ctx.accounts.lockup;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo; 
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;

    let ibo_ata: &mut Account<TokenAccount> = &mut ctx.accounts.ibo_ata;
    let ticket_ata: &mut Account<TokenAccount> = &mut ctx.accounts.ticket_ata;
    let buyer_ata: &mut Account<TokenAccount> = &mut ctx.accounts.buyer_ata;
    let recipient_ata: &mut Account<TokenAccount> = &mut ctx.accounts.recipient_ata;
    let token_program: &Program<Token> = &ctx.accounts.token_program;
    let program_id = &ctx.program_id;




    buy_common(buyer, lockup, ibo, ticket, ibo_ata, ticket_ata, buyer_ata, recipient_ata, token_program, program_id, ibo_idx, stable_amount_liquidity)?;

    msg!("Fucking passed it");
    Ok(())
}

