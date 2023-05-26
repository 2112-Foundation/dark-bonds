use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };
use switchboard_v2::VrfAccountData;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub bond_owner: Signer<'info>,
    #[account(mut)]
    pub bond: Account<'info, Bond>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(mut)]
    pub bond_owner_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub bond_ata: Box<Account<'info, TokenAccount>>,
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
pub fn claim(ctx: Context<Claim>, ibo_address: Pubkey, bond_idx: u32) -> Result<()> {
    let bond: &mut Account<Bond> = &mut ctx.accounts.bond;

    // Ensure can only withdraw once a day
    // require!(bond.time_elapsed(), ErrorCode::WithdrawTooEarly);

    // Calculate balance that can be witdhrawn
    let claimable_now = if Clock::get().unwrap().unix_timestamp > bond.maturity_date {
        msg!("\n\nBond lock-up is OVER");
        ctx.accounts.bond_ata.amount
    } else {
        msg!("\n\nBond lock-up is ON");
        bond.claim_amount()
    };

    msg!("\nclaim: {:?}", claimable_now);

    // Update withdraw date to now
    bond.update_claim_date();

    let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &["bond".as_bytes(), ibo_address.as_ref(), &bond_idx.to_be_bytes()],
        &ctx.program_id
    );
    let seeds = &["bond".as_bytes(), ibo_address.as_ref(), &bond_idx.to_be_bytes(), &[bump]];

    msg!("total claimable_now: {:?}", bond.total_claimable);
    msg!("claimable_now: {:?}", claimable_now);

    // Transfer SPL balance calculated
    token::transfer(ctx.accounts.transfer_bond().with_signer(&[seeds]), claimable_now)?;

    // Invoke SPL to transfer
    Ok(())
}