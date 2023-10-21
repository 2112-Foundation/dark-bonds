use crate::errors::errors::ErrorCode;
use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct AddLockUp<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::IboRatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(
        init,
        seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &ibo.lockup_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub lockup: Account<'info, Lockup>,
    #[account(mut, seeds = [MASTER_SEED.as_bytes()], bump)]
    pub master: Account<'info, Master>,
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
    let master: &mut Account<Master> = &mut ctx.accounts.master;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    // Take SOL fee for adding a lockup
    take_fee(&master.to_account_info(), &ctx.accounts.admin, master.admin_fees.lockup_fee, 0)?;

    // Ensure APY and lockup duration are non-zero
    msg!("lockup duration: {:?}", lockup_duration);
    require!(lockup_duration >= SECONDS_IN_A_DAY, ErrorCode::LockupDurationUnderDay);
    require!(lockup_apy >= 0.0, ErrorCode::LockupZeroApy);
    lockup.period = lockup_duration;
    lockup.apy = lockup_apy;

    // Set additional settings
    lockup.mature_only = mature_only;
    lockup.purchase_period = purchase_period;

    // Increment available lockups counter
    ibo.lockup_counter += 1;
    Ok(())
}
