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
// use metaplex_token_metadata::EDITION;


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

    #[account(mut, has_one = mint)]
    pub nft_account: Box<Account<'info, TokenAccount>>,
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>, 

    // NFT stuff
    nft_mint: Account<'info, Mint>,
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

    fn verify(&self) -> Result<()> {
        // Verify NFT token account
        if self.nft_token_account.owner != self.buyer.key() {
            return Err(ErrorCode::InvalidNFTAccountOwner.into());
        }
        if self.nft_token_account.mint != self.nft_mint.key() {
            return Err(ErrorCode::InvalidNFTAccountMint.into());
        }
        if self.nft_token_account.amount != 1 {
            return Err(ErrorCode::InvalidNFTAccountAmount.into());
        }

        // Verify NFT Mint
        // let expected_master_edition_key = get_master_edition(&self.nft_mint)?;
        // if expected_master_edition_key != self.nft_master_edition_account.key() {
        //     return Err(ErrorCode::InvalidMasterEdition.into());
        // }
        if self.nft_master_edition_account.data_is_empty() {
            return Err(ErrorCode::InvalidMasterEdition.into());
        }

        // Verify NFT metadata
        let metadata = Metadata::from_account_info(&self.nft_metadata_account)?;
        if metadata.mint != self.nft_mint.key() {
            return Err(ErrorCode::InvalidMetadata.into());
        }

        // metadata emptiness check
        // if metadata.data.is_empty() {
        //     return Err(ErrorCode::InvalidMetadata.into());
        // }

        // Verify NFT creator
        // let expected_creator_key = get_expected_creator()?; // Replace with your expected creator key
        // if !metadata.data.creators.iter().any(|creator| creator.address == expected_creator_key && creator.verified) {
        //     return Err(ErrorCode::InvalidCreator.into());
        // }

        Ok(())
    }
}


// const EDITION: &str = "edition";

// fn get_master_edition(nft_mint: &Account<Mint>) -> Result<Pubkey> {
//     let seeds = [
//         metaplex_token_metadata::PREFIX.as_bytes(),
//         metaplex_token_metadata::program::id().as_ref(),
//         nft_mint.key.as_ref(),
//         EDITION.as_bytes(),
//     ];
//     let (key, _) = Pubkey::find_program_address(&seeds, &metaplex_token_metadata::program::id());
//     Ok(key)
// }

// fn get_expected_creator() -> Result<Pubkey> {
//     // Replace with the actual pubkey string of your expected creator
//     let creator_pubkey_string = "HyWarRXn1Wu5wHMhcypLSQ9QRkjiuytfMkazNRuV3caA";
//     Pubkey::from_str(creator_pubkey_string)
// }

// PDA for acceptable mints
// Extra cut for deposit which goes on to make LP in raydium

// below reusable code needs to be abstracted away between both purchase types

pub fn gated_buy_bond(ctx: Context<GatedBuy>, _lockup_idx: u32, ibo_idx: u64, stable_amount_liquidity: u64) -> Result<()> {    


    // Check that the caller is the owner


    Ok(())
}

