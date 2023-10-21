use crate::errors::errors::ErrorCode;
use crate::common::*;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, lockup_idx: u32)]
pub struct AddGate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::IboRatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(mut, seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()], bump)]
    pub lockup: Account<'info, Lockup>,
    #[account(
        init,
        seeds = [GATE_SEED.as_bytes(), ibo.key().as_ref(), &ibo.gate_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub gate: Account<'info, Gate>,
    pub system_program: Program<'info, System>,
}

pub fn add_gate(
    ctx: Context<AddGate>,
    _ibo_idx: u32,
    _lockup_idx: u32,
    gate_settings: Vec<GateType>
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let gate: &mut Account<Gate> = &mut ctx.accounts.gate;
    gate.load_gate_lock(gate_settings);
    ibo.gate_counter += 1;
    Ok(())
}
