use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct Split<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    // Only owner can split
    #[account(mut, has_one = owner @ErrorCode::NotTicketOwner)]
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub ticket_ata_old: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ticket_ata_new: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        seeds = ["ticket".as_bytes(), ibo.key().as_ref(),  &ibo.ticket_counter.to_be_bytes()], // TODO add counter
        bump,
        payer = owner,
        space = 400
    )]
    pub new_ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
impl<'info> Split<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ticket_ata_old.to_account_info(),
                to: self.ticket_ata_new.to_account_info(),
                authority: self.ticket.to_account_info(),
            },
        )
    }
}

pub fn split(
    ctx: Context<Split>,
    percent_new: u16,
    ibo_address: Pubkey,
    ticket_idx: u32,
) -> Result<()> {
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;
    let new_ticket: &mut Account<Ticket> = &mut ctx.accounts.new_ticket;

    let percent_new_fraction: f64 = (percent_new as f64) / 100.0;

    // Figure out total claimable
    let balance_new_ticket: u64 = (ticket.total_claimable as f64 * percent_new_fraction) as u64;
    let balance_old_ticket: u64 = ticket.total_claimable - balance_new_ticket;

    // Update existing ticket
    ticket.total_claimable = balance_old_ticket;
    new_ticket.total_claimable = balance_new_ticket;

    // Get signing dets
    let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &[
            "ticket".as_bytes(),
            ibo_address.as_ref(),
            &ticket_idx.to_be_bytes(),
        ],
        &ctx.program_id,
    );
    let seeds = &[
        "ticket".as_bytes(),
        ibo_address.as_ref(),
        &ticket_idx.to_be_bytes(),
        &[bump],
    ];

    // Get balance
    let current_bond_balance = ctx.accounts.ticket_ata_old.amount as f64;
    let new_balance: u64 = (current_bond_balance * percent_new_fraction) as u64;

    msg!("current_bond_balance: {:?}", current_bond_balance);
    msg!("new_balance: {:?}", new_balance);

    // Transfer same percent of remaining tokens
    token::transfer(
        ctx.accounts.transfer_bond().with_signer(&[seeds]),
        new_balance,
    )?;

    // Increment counter of all bond tickets issued
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    ibo.ticket_counter += 1;

    // TODO check if actual amoutn gets transfered in tests

    Ok(())
}
