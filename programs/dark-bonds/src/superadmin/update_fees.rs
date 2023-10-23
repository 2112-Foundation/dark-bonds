use crate::state::*;
use crate::errors::errors::ErrorCode;
use crate::common::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateFees<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(mut, seeds = [MASTER_SEED.as_bytes()], bump)]
    pub master: Account<'info, Master>,
    pub system_program: Program<'info, System>,
}

// Any invocation after first time will fail on the PDA seeds macthing
pub fn update_fees(
    ctx: Context<UpdateFees>,
    // Admin creation fees
    ibo_creation_fee: u64,
    lockup_fee: u64,
    gate_addition_fee: u64,
    // Cuts
    purchase_cut: u64,
    resale_cut: u64,
    // User fees
    bond_claim_fee: u64,
    bond_purchase_fee: u64,
    bond_split_fee: u64
) -> Result<()> {
    let master: &mut Account<Master> = &mut ctx.accounts.master;
    require!(
        ibo_creation_fee > 0 && lockup_fee > 0 && gate_addition_fee > 0,
        ErrorCode::NonZeroFees
    );

    // Set ibo admin fees
    master.admin_fees.ibo_creation_fee = ibo_creation_fee;
    master.admin_fees.lockup_fee = lockup_fee;
    master.admin_fees.gate_addition_fee = gate_addition_fee;

    // Set cuts
    master.cuts.purchase_cut = purchase_cut;
    master.cuts.resale_cut = resale_cut;

    // Ser user fees
    master.user_fees.bond_claim_fee = bond_claim_fee;
    master.user_fees.bond_purchase_fee = bond_purchase_fee;
    master.user_fees.bond_split_fee = bond_split_fee;

    Ok(())
}
