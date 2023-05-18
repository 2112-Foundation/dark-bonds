use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ Mint, Token, TokenAccount},
};

use metaplex_token_metadata::state::Metadata;
use super::common::purchase_mechanics;

#[derive(Accounts)]
#[instruction(lockup_idx: u32)]
pub struct GatedBuy<'info> {
    
    #[account(mut)]
    pub buyer: Signer<'info>,    
    #[account(        
        init,      
        seeds = ["bond".as_bytes(), ibo.key().as_ref(),  &ibo.bond_counter.to_be_bytes()], // TODO add counter
        bump,      
        payer = buyer, 
        space = 400
    )]    
    pub bond: Account<'info, Bond>,
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    
    #[account(                
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(),  &lockup_idx.to_be_bytes()], // TODO add counter
        bump,              
    )]    
    pub lockup: Account<'info, Lockup>,

    // // TODO needs to be derived off the lockup counter
    #[account(mut)]
    pub gate: Account<'info, Gate>,
    // purchse token
    // Provided ATA has to be same mint as the one set in ibo // TODO need same for normal buy
    #[account(mut, token::mint = ibo.liquidity_token, token::authority = buyer)]
    pub buyer_ata: Box<Account<'info, TokenAccount>>,    
    #[account(mut)] 
    pub recipient_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub master_recipient_ata: Box<Account<'info, TokenAccount>>, // Matches specified owner and mint

    // bond token    
    #[account(mut)]
    pub ibo_ata: Box<Account<'info, TokenAccount>>,
    // Check for bond substitution attack
    #[account(mut, token::authority = bond)]
    pub bond_ata: Box<Account<'info, TokenAccount>>,       


    pub token_program: Program<'info, Token>,
    // pub associated_token_program: Program<'info, AssociatedToken>,
    // pub rent: Sysvar<'info, Rent>,
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


// TODO possibly checking data from GATE against an account provided by the user
// rather then reading it from the metaplex account

impl<'info> GatedBuy<'info> {
    fn verify(&self, mint_key: Pubkey, master_key: Pubkey, creator_key: Pubkey) -> Result<()> {

        let metadata = Metadata::from_account_info(&self.nft_metadata_account)?;
        // Verify NFT token account
        // Check if the owner of the token account is the buyer
        // if self.nft_token_account.owner != self.buyer.key() {
        //     return Err(ErrorCode::InvalidNFTAccountOwner.into());
        // }
        // // Check if the mint of the token account is the mint provided
        // if self.nft_token_account.mint != self.mint.key() {
        //     return Err(ErrorCode::InvalidNFTAccountMint.into());
        // }
        // // Check if the amount in the token account is exactly 1 (as expected for an NFT)
        // if self.nft_token_account.amount != 1 {
        //     return Err(ErrorCode::InvalidNFTAccountAmount.into());
        // }
    
        // Verify NFT Mint
        // Check if the master edition account key matches the provided master key
        if master_key != self.nft_master_edition_account.key() {
            return Err(ErrorCode::InvalidMasterEdition.into());
        }

        // metadata.data.

        // Check if the master edition account contains any data
        if self.nft_master_edition_account.data_is_empty() {
            return Err(ErrorCode::InvalidMasterEdition.into());
        }
    
        // Print the master key and the master edition account key for debugging purposes
        msg!("master_key: {:?}", master_key);
        msg!("nft_master_edition_account: {:?}", self.nft_master_edition_account.key());
    
        // Verify NFT metadata
        // Extract the metadata from the metadata account and check if its mint matches the provided mint
        // let metadata = Metadata::from_account_info(&self.nft_metadata_account)?;
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
                creator.address == creator_key && creator.verified
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

pub fn buy_bond_gated(ctx: Context<GatedBuy>, _lockup_idx: u32, ibo_idx: u64, stable_amount_liquidity: u64) -> Result<()> {    
       
    // Check that the caller is the owner of the desired NFT
    let gate = ctx.accounts.gate.clone();
    ctx.accounts.verify(gate.mint_key, gate.master_key, gate.creator_key)?;    

    purchase_mechanics(  
        &ctx.accounts.buyer,
        &ctx.accounts.lockup,
        &mut ctx.accounts.ibo,
        &mut ctx.accounts.bond,
        &mut ctx.accounts.ibo_ata,
        &mut ctx.accounts.bond_ata,
        &mut ctx.accounts.buyer_ata,
        &mut ctx.accounts.recipient_ata,
        &mut ctx.accounts.master_recipient_ata,
        &ctx.accounts.token_program,
        &ctx.program_id,
        ibo_idx,
        stable_amount_liquidity
    )?;
    
    Ok(())
}

