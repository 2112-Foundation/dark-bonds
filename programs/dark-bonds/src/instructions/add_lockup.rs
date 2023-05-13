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
    #[account(mut, has_one = admin, constraint = ibo.locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(        
        init,      
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &ibo.lockup_counter.to_be_bytes()], 
        bump,      
        payer = admin, 
        space = 400
    )]    
    pub lockup: Account<'info, LockUp>,        
    pub system_program: Program<'info, System>,
}

pub fn add_lockup(ctx: Context<AddLockUp>, lock_up_duration: i64, lock_up_apy: f64) -> Result<()> {    
    let lockup: &mut Account<LockUp> = &mut ctx.accounts.lockup;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    msg!("\nsetting APY of: {:?}", lock_up_apy);

    // Set these lockup values
    lockup.period = lock_up_duration;
    lockup.apy = lock_up_apy;

    // Increment counter
    ibo.lockup_counter += 1;
    Ok(())
}
