use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct RemoveLockup<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(        
        mut,
        close = admin,      
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &ibo.lockup_counter.to_be_bytes()],         
        bump
    )]
    pub lockup: Account<'info, Lockup>,
    pub system_program: Program<'info, System>,
}

pub fn remove_lockup(_ctx: Context<RemoveLockup>) -> Result<()> {
    Ok(())
}