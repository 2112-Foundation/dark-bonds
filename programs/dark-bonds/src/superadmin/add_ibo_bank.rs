use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token::Token };

use crate::state::*;
use crate::common::*;

pub fn add_ibo_bank(ctx: Context<AddIboBank>) -> Result<()> {
    ctx.accounts.ibo_bank.index = ctx.accounts.main.next_ibo_bank_counter;
    ctx.accounts.ibo_bank.bump = *ctx.bumps.get("ibo_bank").unwrap();
    ctx.accounts.main.next_ibo_bank_counter += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct AddIboBank<'info> {
    #[account(mut)]
    pub kang: Signer<'info>,
    #[account(mut, seeds = [MAIN_SEED.as_bytes()], bump = main.bump)]
    pub main: Account<'info, Main>,
    #[account(
        init,
        seeds = [IBO_BANK_SEED.as_bytes(), &main.next_ibo_bank_counter.to_be_bytes()],
        bump,
        payer = kang,
        space = MAX_PDA_SIZE - 50
    )]
    pub ibo_bank: Account<'info, IboBank>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
