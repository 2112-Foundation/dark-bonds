use crate::state::*;
use crate::common::*;
use crate::common::errors::BondErrors;
use anchor_lang::prelude::*;

use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub bond_owner: Signer<'info>,
    #[account(mut, constraint = bond.owner == *bond_owner.key @BondErrors::BondInvalidCaller)]
    pub bond: Account<'info, Bond>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(mut)]
    pub bond_owner_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        mut, 
        token::authority = bond.key(),
        // token::mint = ibo.mint,
    )]
    pub bond_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        mut, 
        seeds = [MAIN_SEED.as_bytes()], 
        bump = main.bump
    )]
    pub main: Account<'info, Main>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.bond_ata.to_account_info(),
            to: self.bond_owner_ata.to_account_info(),
            authority: self.bond.to_account_info(),
        })
    }
}

// option to add % to claim?
pub fn claim(ctx: Context<Claim>, ibo_address: Pubkey) -> Result<()> {
    let accounts = ctx.accounts;

    // msg!("\n\nProvided bond idx: {:?}", bond_idx);
    // msg!("Stored bond idx: {:?}", bond.idx);

    // Ensure can only withdraw once a day TODO leave it in only when going to prod
    // require!(bond.time_elapsed(), BondErrors::WithdrawTooEarly);

    // Ensure the bond is not one of those where you can only claim it all at the end
    require!(!accounts.bond.mature_only, BondErrors::BondMatureOnly);

    // Take SOL fee for buying a bond
    take_fee(
        &accounts.main.to_account_info(),
        &accounts.bond_owner,
        accounts.main.user_fees.bond_claim_fee as u64,
        0
    )?;

    // Calculate balance that can be witdhrawn
    let claimable_now = if Clock::get().unwrap().unix_timestamp > accounts.bond.maturity_date {
        msg!("\n\nBond lock-up is OVER");
        accounts.bond_ata.amount
    } else {
        msg!("\n\nBond lock-up is ON");
        accounts.bond.claim_amount()?
    };

    msg!("\nClaiming now: {:?}", claimable_now);

    // Update withdraw date to now
    accounts.bond.update_claim_date();

    let seeds = &[
        BOND_SEED.as_bytes(),
        ibo_address.as_ref(),
        accounts.bond.aces.as_ref(),
        &[accounts.bond.bump],
    ];

    // msg!("total claimable_now: {:?}", bond.total_claimable);
    // msg!("claiming now: {:?}", claimable_now);
    // msg!("derived_ata: {:?}", der);
    // msg!("provided_ata: {:?}", bond.key());
    // msg!("Balances bond_ata (from): {:?}", ctx.accounts.bond_ata.amount);
    // msg!("Balances bond_ata.owner: {:?}", ctx.accounts.bond_ata.owner);
    // msg!("Balances bond_owner_ata (to): {:?}", ctx.accounts.bond_owner_ata.amount);

    // Transfer SPL balance calculated
    token::transfer(accounts.transfer_bond().with_signer(&[seeds]), 100)?;

    // Invoke SPL to transfer
    Ok(())
}
