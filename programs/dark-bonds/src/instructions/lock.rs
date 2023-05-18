use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Lock<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin @ErrorCode::NotIBOAdmin)]
    pub ibo: Account<'info, Ibo>,
}

// Any invocation after first time will fail on the PDA seeds macthing
pub fn lock(ctx: Context<Lock>, lock_withdraws: bool, lock_lockup_addition: bool) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    if lock_withdraws {
        msg!("locking lockup");
        ibo.lockups_locked = true;
    }
    if lock_lockup_addition {
        msg!("locking withdraws");
        ibo.withdraws_locked = true;
    }
    Ok(())
}