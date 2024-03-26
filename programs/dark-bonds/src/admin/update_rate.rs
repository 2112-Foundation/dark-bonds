use crate::state::*;
use crate::common::*;
use crate::common::errors::BondErrors;
use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct UpdateRate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [
            IBO_SEED.as_bytes(),  
            &ibo.aces.as_ref()
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

pub fn update_rate(ctx: Context<UpdateRate>, fixed_exchange_rate: u64) -> Result<()> {
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

    // Assert it can be done
    require!(ibo.actions.exchange_rate_change == true, BondErrors::IboRateLocked);
    ibo.fixed_exchange_rate = fixed_exchange_rate;

    Ok(())
}
