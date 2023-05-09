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
    pub ibo: Account<'info, IBO>,
    pub lock_up: Account<'info, LockUp>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub system_program: Program<'info, System>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

pub fn buy_bond(
    ctx: Context<BuyBond>,
    stable_amount_liquidity: u64,
    lock_up_period: u8, // needs to be counter of the lock-up period PDA
) -> Result<()> {
    let buyer: &mut Signer = &mut ctx.accounts.buyer;
    let lock_up: &mut Account<LockUp> = &mut ctx.accounts.lock_up;
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;

    // Prior ensure that the lock-up PDA provided has been derived from this IBO account TODO

    // Cacluclate total amount to be netted over the whole lock-up period
    let total_gains = lock_up.get_total_gain(stable_amount_liquidity);

    // Create a new bond instance PDA
    ticket.create(buyer.key(), lock_up.get_maturity_stamp());

    // Fixed dark price is set in the account for this bond

    // Ensure that it is a correct currency

    // calcualte DARK to increment

    // Transfer USDC to us

    // add to dark_bond_balance

    // Increment total DARK bond ticket calculator

    // Write toal DARK and owner to the new ticket
    // Transfer that dark to it

    // Need to assemble all the necessery accounts

    // Need to create swapleg struct

    Ok(())
}

// Add option vested programable NFT presale from a mint
// Can be traded before
