use crate::state::*;
use crate::common::*;
use crate::common::errors::BondErrors;
use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u64)]
pub struct UpdateRate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [IBO_SEED.as_bytes(), &ibo_idx.to_be_bytes()],
        bump,        
        has_one = admin
    )]
    pub ibo: Account<'info, Ibo>,

    // Checks for correct main account provided
    #[account(               
        mut, 
        seeds = [MASTER_SEED.as_bytes()], 
        bump,       
    )]
    pub master: Account<'info, Master>,
}

pub fn update_rate(ctx: Context<UpdateRate>, fixed_exchange_rate: u64) -> Result<()> {
    let admin: &Signer = &mut ctx.accounts.admin;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let master: &mut Account<Master> = &mut ctx.accounts.master;

    // Transfer lamports to the master recipient account for updating ibo
    take_fee(
        &master.to_account_info(),
        &admin,
        ((master.admin_fees.ibo_creation_fee as f64) / 10.0) as u64,
        0
    )?;

    // Assert it can be done
    require!(ibo.actions.exchange_rate_change == true, BondErrors::IboRateLocked);
    ibo.fixed_exchange_rate = fixed_exchange_rate;

    Ok(())
}
