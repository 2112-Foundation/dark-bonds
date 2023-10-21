use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, lockup_idx: u32)]
pub struct UpdateGates<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::IboRatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(mut, seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()], bump)]
    pub lockup: Account<'info, Lockup>,
    pub system_program: Program<'info, System>,
}

// Need to feed acounts to set in within th gate
// TODO first or second argument is redundant
pub fn update_gates(
    ctx: Context<UpdateGates>,
    gates_add: Vec<u32>,
    gates_remove: Vec<u32>
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;

    // Loop over gates to add and update allowed lockups
    for gate in gates_add {
        lockup.add_gate(gate);
    }
    for gate in gates_remove {
        lockup.remove_gate(gate);
    }

    Ok(())
}
