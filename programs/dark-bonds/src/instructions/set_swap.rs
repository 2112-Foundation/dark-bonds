use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetSwap<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    // This needs to be init (along with counter checks)
    #[account(mut, has_one = owner)]
    pub ticket: Account<'info, Ticket>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
    // Set price they want this to be sold at
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;
    ticket.swap_price = sell_price;
    Ok(())
}
