use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetSwap<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner @ErrorCode::NotTicketOwner)]
    pub ticket: Account<'info, Ticket>,
}

pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;
    ticket.swap_price = sell_price;
    Ok(())
}
