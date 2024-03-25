use crate::common::errors::BondErrors;
use crate::common::*;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct AddGate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // TODO the error is for rates, not for the addition of a gate
    #[account(
        mut, 
        has_one = admin, 
        seeds = [IBO_SEED.as_bytes(),  &ibo.index.to_be_bytes()],
        bump = ibo.bump,
        constraint = ibo.actions.gate_modification @BondErrors::IboLockupsLocked
    )]
    pub ibo: Account<'info, Ibo>,
    #[account(mut, seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &lockup.index.to_be_bytes()], bump)]
    pub lockup: Account<'info, Lockup>,
    #[account(
        init,
        seeds = [GATE_SEED.as_bytes(), ibo.key().as_ref(), &ibo.gate_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub gate: Account<'info, Gate>,
    #[account(mut, seeds = [MASTER_SEED.as_bytes()], bump = master.bump)]
    pub master: Account<'info, Master>,
    pub system_program: Program<'info, System>,
}

pub fn add_gate(ctx: Context<AddGate>, gate_settings: Vec<GateType>) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let gate: &mut Account<Gate> = &mut ctx.accounts.gate;
    let master: &mut Account<Master> = &mut ctx.accounts.master;
    gate.load_gate_lock(gate_settings);
    ibo.gate_counter += 1;

    // Take SOL fee for adding a gate
    take_fee(
        &master.to_account_info(),
        &ctx.accounts.admin,
        master.admin_fees.gate_addition_fee,
        0
    )?;
    Ok(())
}
