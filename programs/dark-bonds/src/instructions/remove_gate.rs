use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
#[instruction(ibo_idx: u32, lockup_idx: u32)]
pub struct RemoveGate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::GatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(                    
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()], 
        bump,              
    )]    
    pub lockup: Account<'info, Lockup>,    
    #[account(        
        mut,
        close = admin,      
        seeds = ["gate".as_bytes(), ibo.key().as_ref(), lockup.key().as_ref(), &lockup.gate_counter.to_be_bytes()],       
        bump
    )]    
    pub gate: Account<'info, Gate>,       
    pub system_program: Program<'info, System>,
}

pub fn remove_gate(_ctx: Context<RemoveGate>,_ibo_idx: u32, _lockup_idx: u32) -> Result<()> {    
    Ok(())
}