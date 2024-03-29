use crate::common::errors::BondErrors;
use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddLockUp<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut, 
        has_one = admin, 
        seeds = [
            IBO_SEED.as_bytes(),  
            ibo.aces.as_ref()
        ],
        bump = ibo.bump,
        constraint = ibo.actions.lockup_modification @BondErrors::IboLockupsLocked
    )]
    pub ibo: Account<'info, Ibo>,
    #[account(
        init,
        seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &ibo.lockup_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub lockup: Account<'info, Lockup>,
    #[account(mut, seeds = [MAIN_SEED.as_bytes()], bump = main.bump)]
    pub main: Account<'info, Main>,
    pub system_program: Program<'info, System>,
}

pub fn add_lockup(
    ctx: Context<AddLockUp>,
    lockup_duration: i64,
    lockup_apy: u64,
    mature_only: bool,
    limit: u64,
    principal_ratio: u16,
    purchase_period: PurchasePeriod
) -> Result<()> {
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;
    let main: &mut Account<Main> = &mut ctx.accounts.main;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    // Take SOL fee for adding a lockup
    take_fee(&main.to_account_info(), &ctx.accounts.admin, main.admin_fees.lockup_fee, 0)?;

    // Ensure APY and lockup duration are non-zero
    msg!("lockup duration: {:?}", lockup_duration);
    require!(lockup_duration >= SECONDS_IN_A_DAY, BondErrors::LockupDurationUnderDay);
    require!(lockup_apy > 0, BondErrors::LockupZeroApy);
    lockup.period = lockup_duration;
    lockup.apy = lockup_apy; // TODO check correctens

    // Set additional settings
    lockup.mature_only = mature_only;
    lockup.purchase_period = purchase_period;
    lockup.bump = *ctx.bumps.get("lockup").unwrap();
    lockup.index = ibo.lockup_counter;

    // If set to some value, set principal ratio
    if principal_ratio > 0 {
        lockup.principal_ratio = Some(principal_ratio);
    } else {
        lockup.principal_ratio = None;
    }

    // Set total limit
    if limit > 0 {
        lockup.limit = Some(limit);
    }

    // Increment available lockups counter
    ibo.lockup_counter += 1;
    Ok(())
}
