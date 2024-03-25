use crate::state::*;
use crate::common::errors::BondErrors;
use crate::common::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(init, seeds = [MAIN_SEED.as_bytes()], bump, payer = superadmin, space = 450)]
    pub main: Account<'info, Main>,
    pub system_program: Program<'info, System>,
}

// Any invocation after first time will fail on the PDA seeds macthing
pub fn init_master(
    ctx: Context<Init>,
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
    let superadmin: &Signer = &mut ctx.accounts.superadmin;
    let main: &mut Account<Main> = &mut ctx.accounts.main;

    main.admin = superadmin.key();
    main.master_recipient = superadmin.key();
    main.bump = *ctx.bumps.get("main").unwrap();

    require!(
        ibo_creation_fee > 0 && lockup_fee > 0 && gate_addition_fee > 0,
        BondErrors::NonZeroFees
    );

    // Set ibo admin fees
    main.admin_fees.ibo_creation_fee = ibo_creation_fee;
    main.admin_fees.lockup_fee = lockup_fee;
    main.admin_fees.gate_addition_fee = gate_addition_fee;

    // Set cuts
    main.cuts.purchase_cut = purchase_cut;
    main.cuts.resale_cut = resale_cut;

    // Ser user fees
    main.user_fees.bond_claim_fee = bond_claim_fee;
    main.user_fees.bond_purchase_fee = bond_purchase_fee;
    main.user_fees.bond_split_fee = bond_split_fee;

    Ok(())
}
