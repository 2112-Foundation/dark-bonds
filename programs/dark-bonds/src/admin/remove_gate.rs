use crate::common::errors::BondErrors;
use crate::common::*;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct RemoveGatedSettings<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut, 
        has_one = admin, 
        seeds = [
            IBO_SEED.as_bytes(),  
            &ibo.index.to_be_bytes()
        ],
        bump = ibo.bump,
        constraint = ibo.actions.gate_modification == false @BondErrors::IboGatedSettingsLocked
    )]
    pub ibo: Account<'info, Ibo>,
    #[account(
        seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &lockup.index.to_be_bytes()],
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

pub fn remove_gate(_ctx: Context<RemoveGatedSettings>) -> Result<()> {
    Ok(())
}
