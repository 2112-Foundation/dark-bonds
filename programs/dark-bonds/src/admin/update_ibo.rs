use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u64, description: String, link: String)]
pub struct UpdateIbo<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [
            IBO_SEED.as_bytes(), 
            &ibo.index.to_be_bytes()
        ],
        bump = ibo.bump,        
        has_one = admin
    )]
    pub ibo: Account<'info, Ibo>,

    // Checks for correct main account provided
    #[account(               
        mut, 
        seeds = [MAIN_SEED.as_bytes()], 
        bump = main.bump,       
    )]
    pub main: Account<'info, Main>,
}

// Pre launch and post launch
pub fn update_ibo(
    ctx: Context<UpdateIbo>,
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
    let main: &mut Account<Main> = &mut ctx.accounts.main;

    // Transfer lamports to the main recipient account for updating ibo
    take_fee(
        &main.to_account_info(),
        &admin,
        ((main.admin_fees.ibo_creation_fee as f64) / 10.0) as u64,
        0
    )?;

    // Fill out details of the new Ibo
    // TODO need ensure what locking does
    ibo.fixed_exchange_rate = fixed_exchange_rate;
    ibo.admin = admin.key();
    ibo.recipient_address = recipient;
    ibo.swap_cut = swap_cut as u64;
    ibo.end_date = end_date;

    // Set additional details for buyers
    ibo.descriptin = description;
    ibo.link = link;

    // These can't change if it already started
    // Potentially counter at zero too
    if Clock::get().unwrap().unix_timestamp < ibo.live_date {
        ibo.live_date = live_date;
        ibo.liquidity_token = liquidity_token;
        ibo.underlying_token = underlying_token;
    }

    Ok(())
}
