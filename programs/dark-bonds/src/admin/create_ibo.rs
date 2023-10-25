use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(description: String, link: String)]
pub struct CreateIBO<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // Must be derived from the latest counter
    #[account(
        init,
        seeds = [IBO_SEED.as_bytes(), &master.ibo_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = IBO_BASE_SIZE + PRE + description.len() + link.len()
    )]
    pub ibo: Account<'info, Ibo>,

    // Checks for correct main account provided
    #[account(               
        mut, 
        seeds = [MASTER_SEED.as_bytes()], 
        bump,       
    )]
    pub master: Account<'info, Master>, // TODO do that everwyehre
    pub system_program: Program<'info, System>,
}

pub fn create_ibo(
    ctx: Context<CreateIBO>,
    description: String,
    link: String,
    fixed_exchange_rate: u64,
    live_date: i64,
    end_date: i64,
    swap_cut: u32,
    liquidity_token: Pubkey,
    underlying_token: Pubkey,
    recipient: Pubkey
) -> Result<()> {
    let admin: &Signer = &mut ctx.accounts.admin;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let master: &mut Account<Master> = &mut ctx.accounts.master;

    // Take SOL fee for creating the IBO
    take_fee(&master.to_account_info(), &admin, master.admin_fees.ibo_creation_fee, 0)?;

    // Fill out details of the new Ibo
    ibo.live_date = live_date;
    ibo.fixed_exchange_rate = fixed_exchange_rate;
    ibo.liquidity_token = liquidity_token;
    ibo.underlying_token = underlying_token;
    ibo.admin = admin.key();
    ibo.recipient_address = recipient;
    ibo.swap_cut = swap_cut as u64;
    ibo.end_date = end_date;

    // Set additional details for buyers
    ibo.descriptin = description;
    ibo.link = link;

    // Counter is incremebted for Ibo counter
    master.ibo_counter += 1;

    // Set permitted actions
    ibo.actions = PermittedAction::new();
    Ok(())
}

// TODO a check for SOL being transfered
