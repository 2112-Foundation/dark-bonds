use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use jupiter_cpi::*;

// use anchor_lang::solana_program::clock;
// use std::convert::TryInto;
// use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub bond_owner: Signer<'info>,
    #[account(mut)]
    pub ticket: Account<'info, Ticket>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(mut)]
    pub bond_owner_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ticket_ata: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium
impl<'info> Claim<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ticket_ata.to_account_info(),
                to: self.bond_owner_ata.to_account_info(),
                authority: self.ticket.to_account_info(),
            },
        )
    }
}

// option to add % to claim?
pub fn claim(ctx: Context<Claim>, ibo_address: Pubkey, ibo_idx: u32) -> Result<()> {
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;

    // Ensure can only withdraw once a day
    require!(ticket.time_elapsed(), ErrorCode::WithdrawTooEarly);

    // Calculate balance that can be witdhrawn
    let claimable: u64 = ticket.claim_amount();

    // Update withdraw date to now
    ticket.update_claim_date();

    let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &[
            "ticket".as_bytes(),
            ibo_address.as_ref(),
            &ibo_idx.to_be_bytes(),
        ],
        &ctx.program_id,
    );
    let seeds = &[
        "ticket".as_bytes(),
        ibo_address.as_ref(),
        &ibo_idx.to_be_bytes(),
        &[bump],
    ];

    // Transfer SPL balance calculated
    token::transfer(
        ctx.accounts.transfer_bond().with_signer(&[seeds]),
        claimable,
    )?;

    // Invoke SPL to transfer
    Ok(())
}
