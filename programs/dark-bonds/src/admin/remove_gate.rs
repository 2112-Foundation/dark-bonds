use crate::errors::errors::ErrorCode;
use crate::common::*;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, lockup_idx: u32)]
pub struct RemoveGatedSettings<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.actions.gate_addition == false @ErrorCode::IboGatedSettingsLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(
        seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()],
        bump
    )]
    pub lockup: Account<'info, Lockup>,
    #[account(        
        mut,
        close = admin,      
        seeds = [GATE_SEED.as_bytes(), ibo.key().as_ref(), &ibo.lockup_counter.to_be_bytes()],       
        bump
    )]
    pub gate: Account<'info, Gate>,
    pub system_program: Program<'info, System>,
}

pub fn remove_gate(
    _ctx: Context<RemoveGatedSettings>,
    _ibo_idx: u32,
    _lockup_idx: u32
) -> Result<()> {
    Ok(())
}
