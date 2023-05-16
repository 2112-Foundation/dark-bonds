use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // TODO check for caller being admin
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,

    // purchse token
    // Provided ATA has to be same mint as the one set in ibo
    // #[account(mut, token::mint = ibo.stablecoin, token::authority = buyer)]
    #[account(mut)]
    pub ibo_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub recipient_ata: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

// Liqudity bond can be withdrawn any time
// Bond token can only be withdrawn after IBO has ended (whatver edned means)

pub fn withdraw_liquidity(ctx: Context<Withdraw>, amount: Pubkey) -> Result<()> {
    // Check it is defo not the underlying bond (so recompoisers cant steal bond after getting liquidity)

    Ok(())
}
