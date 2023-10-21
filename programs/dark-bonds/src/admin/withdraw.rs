use crate::errors::errors::ErrorCode;
use crate::common::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ self, Token, TokenAccount, Transfer },
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin @ErrorCode::IboNotdmin)]
    pub ibo: Account<'info, Ibo>,
    #[account(               
        mut, 
        seeds = [MASTER_SEED.as_bytes()], 
        bump,       
    )]
    pub master: Account<'info, Master>, // TODO do that everwyehre where master is used

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

// Check it is defo not the underlying bond (so recompoisers cant steal bond after getting liquidity)
// but can be done after the period is over

pub fn withdraw(ctx: Context<Withdraw>, withdraw_amount: u64, ibo_idx: u64) -> Result<()> {
    let ibo_ata: &mut Account<TokenAccount> = &mut ctx.accounts.ibo_ata;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let master: &mut Account<Master> = &mut ctx.accounts.master;

    // If trying to withdraw underlying asset and withdraw for that have been marked as locked
    if ibo_ata.mint == ibo.underlying_token && ibo.withdraws_locked {
        // Assert deadline has expired
        require!(Clock::get().unwrap().unix_timestamp >= ibo.end_date, ErrorCode::WithdrawLocked);
    }

    let master_ibo_address = master.key().clone();

    // Get the bump
    let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &[IBO_SEED.as_bytes(), master_ibo_address.clone().as_ref(), &ibo_idx.to_be_bytes()],
        &ctx.program_id
    );

    // Get the seeds
    let seeds = &[
        IBO_SEED.as_bytes(),
        master_ibo_address.as_ref(),
        &ibo_idx.to_be_bytes(),
        &[bump],
    ];

    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
            from: ibo_ata.to_account_info(),
            to: ctx.accounts.recipient_ata.to_account_info(),
            authority: ibo.to_account_info(),
        }).with_signer(&[seeds]),
        withdraw_amount
    )?;

    Ok(())
}