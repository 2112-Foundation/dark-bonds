use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct AddLockUp<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub ibo: Account<'info, IBO>,
    pub lock_up: Account<'info, LockUp>,
    pub main_ibo: Account<'info, Master>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub system_program: Program<'info, System>,
}

pub fn add_lockup(ctx: Context<AddLockUp>, lock_up_duration: i64, lock_up_apy: f64) -> Result<()> {
    let admin: &mut Signer = &mut ctx.accounts.admin;
    let lock_up: &mut Account<LockUp> = &mut ctx.accounts.lock_up;

    Ok(())
}
