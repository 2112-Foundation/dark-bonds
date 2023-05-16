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

use super::common::purchase_mechanics;

#[derive(Accounts)]
#[instruction(lockup_idx: u32)]
pub struct BuyBond<'info> {
    
    #[account(mut)]
    pub buyer: Signer<'info>,    
    #[account(        
        init,      
        seeds = ["ticket".as_bytes(), ibo.key().as_ref(),  &ibo.ticket_counter.to_be_bytes()], 
        bump,      
        payer = buyer, 
        space = 400
    )]    
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    
    #[account(                
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(),  &lockup_idx.to_be_bytes()], 
        bump,      
        constraint = lockup.gate_counter == 0 @ErrorCode::RestrictedLockup
    )]    
    pub lockup: Account<'info, LockUp>,

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

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>, 
}

// PDA for acceptable mints
// Extra cut for deposit which goes on to make LP in raydium

pub fn buy_bond(ctx: Context<BuyBond>, _lockup_idx: u32, ibo_idx: u64, stable_amount_liquidity: u64) -> Result<()> {    

    purchase_mechanics(  
        &ctx.accounts.buyer,
        &ctx.accounts.lockup,
        &mut ctx.accounts.ibo,
        &mut ctx.accounts.ticket,
        &mut ctx.accounts.ibo_ata,
        &mut ctx.accounts.ticket_ata,
        &mut ctx.accounts.buyer_ata,
        &mut ctx.accounts.recipient_ata,
        &ctx.accounts.token_program,
        &ctx.program_id,
        ibo_idx,
        stable_amount_liquidity
    )?;    

    Ok(())
}





