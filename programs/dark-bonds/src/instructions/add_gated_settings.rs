use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, lockup_idx: u32)]
pub struct AddGatedSettings<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(mut, seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()], bump)]
    pub lockup: Account<'info, Lockup>,
    #[account(
        init,
        seeds = ["gate".as_bytes(), ibo.key().as_ref(), &ibo.gate_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub gate: Account<'info, GatedSettings>,
    pub system_program: Program<'info, System>,
}

// Need to feed acounts to set in within th gate
// TODO first or second argument is redundant
pub fn add_gated_settings(
    ctx: Context<AddGatedSettings>,
    _ibo_idx: u32,
    _lockup_idx: u32,
    gate_option: u8,
    accounts: Vec<Pubkey>
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let gate_settings: &mut Account<GatedSettings> = &mut ctx.accounts.gate;

    msg!("\nsetting gate option of: {:?}", gate_option);

    // Set the type
    gate_settings.set_type(gate_option);

    // Load remaining accounts to a gate
    gate_settings.load_accounts(accounts);

    // Increment individuall gate counter
    // Gate is not a part of the IBO, so it has its own counter
    ibo.gate_counter += 1;

    Ok(())
}
