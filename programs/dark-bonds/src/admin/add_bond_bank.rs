use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token::Token };

use crate::state::*;
use crate::common::*;

pub fn add_bond_bank(ctx: Context<AddBondBank>) -> Result<()> {
    ctx.accounts.bond_bank.index = ctx.accounts.ibo.next_bond_bank_counter;
    ctx.accounts.bond_bank.bump = *ctx.bumps.get("bond_bank").unwrap();
    ctx.accounts.ibo.next_bond_bank_counter += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct AddBondBank<'info> {
    #[account(mut)]
    pub kang: Signer<'info>,

    #[account(mut, seeds = [IBO_SEED.as_bytes(), ibo.aces.as_ref()], bump = ibo.bump)]
    pub ibo: Account<'info, Ibo>,

    #[account(
        init,
        seeds = [
            BOND_BANK_SEED.as_bytes(),
            ibo.key().as_ref(),
            &ibo.next_bond_bank_counter.to_be_bytes(),
        ],
        bump,
        payer = kang,
        space = MAX_PDA_SIZE - 50
    )]
    pub bond_bank: Account<'info, BondBank>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
