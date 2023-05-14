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

const SECONDS_YEAR: f64 = 31536000.0;

#[derive(Accounts)]
#[instruction(lockup_idx: u32)]
pub struct BuyBond<'info> {
    
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
        seeds = ["gated_lockup".as_bytes(), ibo.key().as_ref(),  &lockup_idx.to_be_bytes()], // TODO add counter
        bump,              
    )]    
    pub gated_lockup: Account<'info, GatedLockUp>,

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
}

impl<'info> BuyBond<'info> {
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
}

// PDA for acceptable mints
// Extra cut for deposit which goes on to make LP in raydium

// below reusable code needs to be abstracted away between both purchase types

pub fn gated_buy_bond(ctx: Context<BuyBond>, _lockup_idx: u32, ibo_idx: u64, stable_amount_liquidity: u64) -> Result<()> {    





    Ok(())
}

