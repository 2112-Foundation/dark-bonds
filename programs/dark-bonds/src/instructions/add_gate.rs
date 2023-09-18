use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, lockup_idx: u32)]
pub struct AddGate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()], bump)]
    pub lockup: Account<'info, Lockup>,
    #[account(
        init,
        seeds = ["gate".as_bytes(), ibo.key().as_ref(), &ibo.gate_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub gate: Account<'info, Gate>,
    pub system_program: Program<'info, System>,
}

// Need to feed acounts to set in within th gate
// TODO first or second argument is redundant
pub fn add_gate(
    ctx: Context<AddGate>,
    _ibo_idx: u32,
    _lockup_idx: u32,
    mint_key: Pubkey,
    creator_key: Pubkey,
    master_key: Pubkey
) -> Result<()> {
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;
    let gate: &mut Account<Gate> = &mut ctx.accounts.gate;

    gate.master_key = master_key;
    gate.creator_key = creator_key;
    gate.mint_key = mint_key;

    msg!("master_key: {:?}", master_key);
    msg!("creator_key: {:?}", creator_key);
    msg!("mint_key: {:?}", mint_key);

    // Increment individuall gate counter
    lockup.gate_counter += 1;

    Ok(())
}
