use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct CreateIBO<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // This needs to be init (along with counter checks)
    pub ibo: Account<'info, IBO>,

    pub main_ibo: Account<'info, Master>,
    // Need PDA of the to be derived of some shared register which is incremented
    pub system_program: Program<'info, System>,
}

// Extra cut for deposit which goes on to make LP in raydium
pub fn create_ibo(
    ctx: Context<CreateIBO>,
    fixed_exchange_rate: u64,
    live_date: i64,
    stablecoin: Pubkey,
) -> Result<()> {
    let admin: &Signer = &mut ctx.accounts.admin;
    let ibo: &mut Account<IBO> = &mut ctx.accounts.ibo;
    let main_ibo: &mut Account<Master> = &mut ctx.accounts.main_ibo;

    // Counter is incremebted for IBO counter
    main_ibo.ibo_counter += 1;

    // Fill out details of the new IBO
    ibo.new(fixed_exchange_rate, live_date, stablecoin, admin.key());

    Ok(())
}
