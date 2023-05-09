use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use jupiter_cpi::*;

// use anchor_lang::solana_program::clock;
// use std::convert::TryInto;
// use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct InitIBOMaster<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub main_ibo: Account<'info, MainIBO>,
    pub system_program: Program<'info, System>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

// Any invocation after first time will fail on the PDA seeds macthing
pub fn init_ibo_master(ctx: Context<InitIBOMaster>, cut: u64) -> Result<()> {
    let superadmin: &Signer = &mut ctx.accounts.superadmin;
    let main_ibo: &mut Account<MainIBO> = &mut ctx.accounts.main_ibo;

    main_ibo.init_main_ibo(&superadmin.key(), &cut);
    // Invoke SPL to transfer
    Ok(())
}
