use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use jupiter_cpi::*;

// use anchor_lang::solana_program::clock;
// use std::convert::TryInto;
// use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    pub ticket: Account<'info, Ticket>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub system_program: Program<'info, System>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

pub fn claim(ctx: Context<Claim>) -> Result<()> {
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;

    // Ensure can only withdraw once a day
    require!(ticket.time_elapsed(), ErrorCode::WithdrawTooEarly);

    // Calculate balance that can be witdhrawn
    let claimable = ticket.claim_amount();

    // Update withdraw date to now
    ticket.update_claim_date();

    // Transfer SPL balance calculated

    // Invoke SPL to transfer
    Ok(())
}
