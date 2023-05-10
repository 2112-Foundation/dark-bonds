use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use jupiter_cpi::*;

use anchor_lang::solana_program::clock;
use std::convert::TryInto;
use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct BuyBond<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    // This needs to be init (along with counter checks)
    pub ticket: Account<'info, Ticket>,
    pub ibo: Account<'info, Ibo>,
    pub lockup: Account<'info, LockUp>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub system_program: Program<'info, System>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

pub fn buy_bond(ctx: Context<BuyBond>, stable_amount_liquidity: u64) -> Result<()> {
    let buyer: &mut Signer = &mut ctx.accounts.buyer;
    let lockup: &mut Account<LockUp> = &mut ctx.accounts.lockup;
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;

    // Transfer users liquid to our addreess

    // Prior ensure that the lock-up PDA provided has been derived from this Ibo account TODO

    // Cacluclate total amount to be netted over the whole lock-up period
    let total_gains = lockup.get_total_gain(stable_amount_liquidity);

    // Create a new bond instance PDA
    ticket.new(buyer.key(), lockup.get_maturity_stamp(), total_gains);

    Ok(())
}

// Add option vested programable NFT presale from a mint
// Can be traded before
