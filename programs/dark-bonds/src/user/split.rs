use crate::common::errors::BondErrors;
use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;

use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

#[derive(Accounts)]
pub struct Split<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    // Only owner can split
    #[account(mut, has_one = owner @BondErrors::BondNotBondOwner)]
    pub bond: Account<'info, Bond>,
    #[account(mut)]
    pub bond_ata_old: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub bond_ata_new: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        seeds = [BOND_SEED.as_bytes(), ibo.key().as_ref(), &ibo.bond_counter.to_be_bytes()], // TODO add counter
        bump,
        payer = owner,
        space = 400
    )]
    pub new_bond: Account<'info, Bond>,
    #[account(               
        mut, 
        seeds = [MASTER_SEED.as_bytes()], 
        bump,       
    )]
    pub master: Account<'info, Master>, // TODO do that everwyehre
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
impl<'info> Split<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.bond_ata_old.to_account_info(),
            to: self.bond_ata_new.to_account_info(),
            authority: self.bond.to_account_info(),
        })
    }
}

pub fn split(
    ctx: Context<Split>,
    percent_new: u16,
    ibo_address: Pubkey,
    bond_idx: u32
) -> Result<()> {
    let bond: &mut Account<Bond> = &mut ctx.accounts.bond;
    let new_bond: &mut Account<Bond> = &mut ctx.accounts.new_bond;
    let owner: &Signer = &mut ctx.accounts.owner;
    let master: &mut Account<Master> = &mut ctx.accounts.master;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    let percent_new_fraction: f64 = (percent_new as f64) / 100.0;

    // Figure out total claimable
    let balance_new_bond: u64 = ((bond.total_claimable as f64) * percent_new_fraction) as u64;
    let balance_old_bond: u64 = bond.total_claimable - balance_new_bond;

    // Update existing bond
    bond.total_claimable = balance_old_bond;

    // Set new bond
    new_bond.new(
        ctx.bumps.get("new_bond").unwrap(),
        owner.key(),
        bond.maturity_date,
        balance_new_bond,
        bond.mature_only,
        ibo.bond_counter
    );

    // Transfer lamports to the master recipient account for splitting the bond
    take_fee(&master.to_account_info(), &owner, master.user_fees.bond_split_fee as u64, 0)?;

    let seeds = &[
        BOND_SEED.as_bytes(),
        ibo_address.as_ref(),
        &bond_idx.to_be_bytes(),
        &[bond.bump],
    ];

    // Get balance
    let current_bond_balance = ctx.accounts.bond_ata_old.amount as f64;
    let new_balance: u64 = (current_bond_balance * percent_new_fraction) as u64;

    msg!("current_bond_balance: {:?}", current_bond_balance);
    msg!("new_balance: {:?}", new_balance);

    // Transfer same percent of remaining tokens
    token::transfer(ctx.accounts.transfer_bond().with_signer(&[seeds]), new_balance)?;

    // Increment counter of all bonds issued
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    ibo.bond_counter += 1;

    Ok(())
}
