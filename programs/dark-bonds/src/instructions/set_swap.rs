use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetSwap<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner @ErrorCode::NotBondOwner)]
    pub bond: Account<'info, Bond>,
}

pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
    let bond: &mut Account<Bond> = &mut ctx.accounts.bond;
    bond.swap_price = sell_price;
    Ok(())
}