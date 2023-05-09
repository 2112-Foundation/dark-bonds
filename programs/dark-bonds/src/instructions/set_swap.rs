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
pub struct SetSwap<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    // This needs to be init (along with counter checks)
    pub ticket: Account<'info, Ticket>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
    let seller: &mut Signer = &mut ctx.accounts.trader;
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;

    // Set price they want this to be sold at
    ticket.swap_price = sell_price;

    Ok(())
}
