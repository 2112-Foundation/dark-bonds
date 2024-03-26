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
        seeds = [
            IBO_SEED.as_bytes(),  
            ibo.aces.as_ref()
        ],
        bump = ibo.bump,
        constraint = ibo.actions.gate_modification @BondErrors::IboLockupsLocked
    )]
    pub ibo: Account<'info, Ibo>,
    #[account(
        mut, 
        seeds = [
            LOCKUP_SEED.as_bytes(), 
            ibo.key().as_ref(), 
            &lockup.index.to_be_bytes()
        ], 
        bump = lockup.bump
    )]
    pub lockup: Account<'info, Lockup>,
    #[account(
        init,
        seeds = [GATE_SEED.as_bytes(), ibo.key().as_ref(), &ibo.gate_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub gate: Account<'info, Gate>,
    #[account(mut, seeds = [MAIN_SEED.as_bytes()], bump = main.bump)]
    pub main: Account<'info, Main>,
    pub system_program: Program<'info, System>,
}

pub fn add_gate(ctx: Context<AddGate>, gate_settings: Vec<GateType>) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let gate: &mut Account<Gate> = &mut ctx.accounts.gate;
    let main: &mut Account<Main> = &mut ctx.accounts.main;
    gate.load_gate_lock(gate_settings);
    ibo.gate_counter += 1;

    // Take SOL fee for adding a gate
    take_fee(&main.to_account_info(), &ctx.accounts.admin, main.admin_fees.gate_addition_fee, 0)?;
    Ok(())
}
