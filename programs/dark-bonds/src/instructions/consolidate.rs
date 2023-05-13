use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Consolidate<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    // This needs to be init (along with counter checks)
    pub ticket1: Account<'info, Ticket>,
    pub ticket2: Account<'info, Ticket>,
}

pub fn consolidate(ctx: Context<Consolidate>, sell_price: u64) -> Result<()> {
    let seller: &mut Signer = &mut ctx.accounts.trader;
    let ticket1: &mut Account<Ticket> = &mut ctx.accounts.ticket1;
    let ticket2: &mut Account<Ticket> = &mut ctx.accounts.ticket2;

    // Set price they want this to be sold at
    // ticket.swap_price = sell_price;

    Ok(())
}
