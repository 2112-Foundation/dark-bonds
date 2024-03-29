use crate::common::errors::BondErrors;
use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct RemoveLockup<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut, 
        has_one = admin, 
        seeds = [
            IBO_SEED.as_bytes(), 
            &ibo.aces.as_ref()
        ],
        bump = ibo.bump,        
        constraint = ibo.actions.lockup_modification @BondErrors::IboLockupsLocked
    )]
    pub ibo: Account<'info, Ibo>,
    #[account(        
        mut,
        close = admin,      
        seeds = [
            LOCKUP_SEED.as_bytes(), 
            ibo.key().as_ref(), 
            &ibo.lockup_counter.to_be_bytes()
        ],         
        bump
    )]
    pub lockup: Account<'info, Lockup>,
    pub system_program: Program<'info, System>,
}

pub fn remove_lockup(_ctx: Context<RemoveLockup>) -> Result<()> {
    Ok(())
}
