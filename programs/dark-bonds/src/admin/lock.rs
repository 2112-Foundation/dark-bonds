use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Lock<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin @ErrorCode::IboNotdmin)]
    pub ibo: Account<'info, Ibo>,
}

// TODO: This isnt tested for now

// Any invocation after first time will fail on the PDA seeds macthing
// Needs to take the whole struct and set it
pub fn lock(ctx: Context<Lock>, actions: PermittedAction) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    ibo.actions.update_permissions(&actions);
    Ok(())
}
