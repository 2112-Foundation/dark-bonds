use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct BuySwap<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    // This needs to be init (along with counter checks)
    pub ticket: Account<'info, Ticket>,

    // For look up of trying to pay in the correct mint
    pub ibo: Account<'info, Ibo>,
    // Need ATA of buyer and seller and mint

    // #[account(mut,
    //     token::mint = mint,
    //     token::authority = vault,
    // )]
    // pub seller_ata: Account<'info, TokenAccount>,
    // #[account(mut)]
    // pub buyer_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub matre: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn buy_swap(ctx: Context<BuySwap>) -> Result<()> {
    let buyer: &mut Signer = &mut ctx.accounts.trader;
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    // Assert sale price is not-zero

    // Transfer sell price base stable coin to the ATA of the owner

    Ok(())
}
