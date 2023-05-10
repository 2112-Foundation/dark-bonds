use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Lock<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin)]
    pub ibo: Account<'info, Ibo>,
}

// Any invocation after first time will fail on the PDA seeds macthing
pub fn lock(ctx: Context<Lock>) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    // TODO not sure if admin is needed tbh at all
    ibo.locked = true;
    Ok(())
}
