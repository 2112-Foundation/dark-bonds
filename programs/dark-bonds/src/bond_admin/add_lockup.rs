use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct AddLockUp<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(
        init,
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &ibo.lockup_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub lockup: Account<'info, Lockup>,
    pub system_program: Program<'info, System>,
}

pub fn add_lockup(
    ctx: Context<AddLockUp>,
    lockup_duration: i64,
    lockup_apy: f64,
    mature_only: bool,
    purchase_period: PurchasePeriod
) -> Result<()> {
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    msg!("\nsetting APY of: {:?}", lockup_apy);

    // Set these lockup values
    lockup.period = lockup_duration;
    lockup.apy = lockup_apy as i64;
    lockup.mature_only = mature_only;

    // Set purchase period
    lockup.purchase_period = purchase_period;

    // Increment counter
    ibo.lockup_counter += 1;
    Ok(())
}
