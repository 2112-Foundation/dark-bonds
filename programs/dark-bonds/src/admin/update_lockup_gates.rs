use crate::common::errors::BondErrors;
use crate::common::*;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct UpdateGates<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // TODO wrong error code
    #[account(
        mut, 
        has_one = admin, 
        seeds = [
            IBO_SEED.as_bytes(),  
            &ibo.index.to_be_bytes()
        ],
        bump = ibo.bump,
        constraint = ibo.actions.gate_modification @BondErrors::IboLockupsLocked
    )]
    pub ibo: Account<'info, Ibo>,
    #[account(mut, seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &lockup.index.to_be_bytes()], bump)]
    pub lockup: Account<'info, Lockup>,
    #[account(
        mut, 
        seeds = [MAIN_SEED.as_bytes()], bump = main.bump
    )]
    pub main: Account<'info, Main>,
    pub system_program: Program<'info, System>,
}

// Need to feed acounts to set in within th gate
// TODO first or second argument is redundant
pub fn update_lockup_gates(
    ctx: Context<UpdateGates>,
    gates_add: Vec<u32>,
    gates_remove: Vec<u32>
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let main: &mut Account<Main> = &mut ctx.accounts.main;
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;

    // Loop over gates to add and update allowed lockups
    for gate in gates_add {
        lockup.add_gate(gate);
    }
    for gate in gates_remove {
        lockup.remove_gate(gate);
    }

    // Take SOL fee for adding a gate
    take_fee(
        &main.to_account_info(),
        &ctx.accounts.admin,
        ((main.admin_fees.gate_addition_fee as f64) / 10.0) as u64,
        0
    )?;

    Ok(())
}
