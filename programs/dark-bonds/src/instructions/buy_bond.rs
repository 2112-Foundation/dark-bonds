use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
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
    pub lockup: Account<'info, LockUp>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub system_program: Program<'info, System>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

pub fn buy_bond(ctx: Context<BuyBond>, stable_amount_liquidity: u64) -> Result<()> {    
    let buyer: &mut Signer = &mut ctx.accounts.buyer;
    let lockup: &Account<LockUp> = &ctx.accounts.lockup;
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    // Transfer users liquid to our addreess

    // Prior ensure that the lock-up PDA provided has been derived from this Ibo account TODO

    // Cacluclate total amount to be netted over the whole lock-up period
    let total_gains: u64 = lockup.get_total_gain(stable_amount_liquidity);
    let maturity_stamp: i64 = lockup.get_maturity_stamp();

    msg!("total_gains: {:?}",total_gains);
    msg!("maturity_stamp: {:?}",maturity_stamp);

    // Create a new bond instance PDA
    ticket.new(buyer.key(), maturity_stamp, total_gains);

    // Increment bond counter
    ibo.ticket_counter += 1;

    Ok(())
}

// Add option vested programable NFT presale from a mint
// Can be traded before
