use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use solana_program::pubkey::Pubkey;

const SECONDS_YEAR: f64 = 31536000.0;

// TODO hardcode program ID as it doesn't need to be passed as an account

pub fn purchase_mechanics<'info>(
    buyer: &Signer<'info>,
    lockup: &Account<'info, LockUp>,
    ibo: &mut Account<'info, Ibo>,
    ticket: &mut Account<'info, Ticket>,
    ibo_ata: &Account<'info, TokenAccount>,
    ticket_ata: &Account<'info, TokenAccount>,
    buyer_ata: &Account<'info, TokenAccount>,
    recipient_ata: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    program_id: &Pubkey,
    ibo_idx: u64,
    stable_amount_liquidity: u64,
) -> Result<()> {
    // Convert APY, time and initial input to f64
    // Moved here
    // ------------------------------------------------------------------------------------------
    let apy: f64 = lockup.apy / 100.0;
    let time_in_years: f64 = lockup.period as f64 / SECONDS_YEAR;
    let initial_input: f64 = stable_amount_liquidity as f64;

    msg!("\n\n\tliquidity provided: {:?}", stable_amount_liquidity);
    msg!("apy: {:?}", apy);
    msg!("time_in_years: {:?}", time_in_years);
    msg!("self.period : {:?}", lockup.period);
    // msg!("SECONDS_YEAR: {:?}", SECONDS_YEAR);

    // Calculate total value using compound interest formula
    let total_balance: f64 = initial_input * apy.powf(time_in_years);
    msg!("total balance: {:?}", total_balance);

    // Total earnings is the total value minus the initial input
    let profit: f64 = total_balance - initial_input;
    msg!("total profit: {:?}", profit);
    msg!("yearly earnings: {:?}", profit);

    let total_gains: u64 = profit as u64;

    // ------------------------------------------------------------------------------------------
    //
    // Get balance within the bond main
    let bond_token_left: u64 = ibo_ata.amount;

    // Ensure there are enough tokens TODO
    require!(bond_token_left >= total_gains, ErrorCode::BondsSoldOut);

    msg!("bond_token_left: {:?}", bond_token_left);
    msg!("full bond value: {:?}", total_gains);

    // Transfer liquidity coin to the specified account
    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: buyer_ata.to_account_info(),
                to: recipient_ata.to_account_info(),
                authority: buyer.to_account_info(),
            },
        ),
        stable_amount_liquidity,
    )?;

    // Rederive bump
    let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes()],
        program_id,
    );
    let seeds = &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes(), &[bump]];

    // Transfer bond to the vested account
    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: ibo_ata.to_account_info(),
                to: ticket_ata.to_account_info(),
                authority: ibo.to_account_info(),
            },
        )
        .with_signer(&[seeds]),
        total_gains,
    )?;

    // msg!("desired stable mint: {:?}", ibo.stablecoin);
    // msg!("provided mint: {:?}", ctx.accounts.recipient_ata.mint);

    // Create a new bond instance PDA
    let maturity_stamp: i64 = lockup.get_maturity_stamp();
    ticket.new(buyer.key(), maturity_stamp, total_gains);

    // Increment counter of all bond tickets issued
    ibo.ticket_counter += 1;

    Ok(())
}
