use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_lang::solana_program::clock;
use std::convert::TryInto;
use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};

#[derive(Accounts)]
pub struct BuyBond<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    pub ticket: Account<'info, Ticket>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub system_program: Program<'info, System>,
}

// PDA for acceptable mints

pub fn buy_bond(ctx: Context<BuyBond>, sol_amount: u64, stable_amount: u64) -> Result<()> {
    let mut dark_bond_balance = 0;

    // Get price USD to DARK price from switchboard

    // Ensure that it is a correct currency

    if sol_amount > 0 {

        // Get price USD to SOL price from switchboard

        // Swap SOL for USDC

        // Transfer USDC to us

        // calculate DARK to increment

        // add to dark_bond_balance
    }

    if stable_amount > 0 {

        // calcualte DARK to increment

        // Transfer USDC to us

        // add to dark_bond_balance
    }

    // Increment total DARK bond ticket calculator

    // Write toal DARK and owner to the new ticket
    // Transfer that dark to it

    Ok(())
}
