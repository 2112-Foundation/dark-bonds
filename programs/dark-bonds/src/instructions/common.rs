use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

use solana_program::pubkey::Pubkey;

const SECONDS_YEAR: f64 = 31536000.0;
const PURCHASE_CUT: u64 = 500; // equivalent to 5%

// TODO hardcode program ID as it doesn't need to be passed as an account

pub fn mark_end<'info>(vertex: &mut Account<'info, Vertex>, max_depth: u8, this_depth: u8) {
    msg!("Depth helper\n\tthis depth: {:?}\n\tmax_depth {:?}", this_depth, max_depth);
    if max_depth == this_depth {
        msg!("End of line");
        vertex.end = true;
    }
}

pub fn purchase_mechanics<'info>(
    buyer: &Signer<'info>,
    lockup: &Account<'info, Lockup>,
    ibo: &mut Account<'info, Ibo>,
    bond: &mut Account<'info, Bond>,
    ibo_ata: &Account<'info, TokenAccount>,
    bond_ata: &Account<'info, TokenAccount>,
    buyer_ata: &Account<'info, TokenAccount>,
    recipient_ata: &Account<'info, TokenAccount>,
    master_recipient_ata: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    program_id: &Pubkey,
    ibo_idx: u64,
    stable_amount_liquidity: u64
) -> Result<()> {
    // Convert APY, time and initial input to f64
    // Moved here
    // ------------------------------------------------------------------------------------------
    let apy: f64 = lockup.apy / 100.0;
    let time_in_years: f64 = (lockup.period as f64) / SECONDS_YEAR;
    let initial_input: f64 = stable_amount_liquidity as f64;

    msg!("\n\n\tliquidity provided: {:?}", stable_amount_liquidity);
    msg!("apy: {:?}", apy);
    msg!("time_in_years: {:?}", time_in_years);
    msg!("self.period : {:?}", lockup.period);

    // Calculate total value using compound interest formula
    let total_balance: f64 = initial_input * apy.powf(time_in_years);
    msg!("total balance: {:?}", total_balance);

    // Total earnings is the total value minus the initial input
    let profit: f64 = total_balance - initial_input;
    msg!("total profit: {:?}", profit);
    // msg!("yearly earnings: {:?}", profit);

    let total_gains: u64 = profit as u64;

    // ------------------------------------------------------------------------------------------
    //
    // Get balance within the bond main
    let bond_token_left: u64 = ibo_ata.amount;

    // Ensure there are enough tokens TODO
    require!(bond_token_left >= total_gains, ErrorCode::BondsSoldOut);

    msg!("bond_token_left: {:?}", bond_token_left);
    msg!("full bond value: {:?}", total_gains);
    msg!("full bond stable_amount_liquidity: {:?}", stable_amount_liquidity);

    // Work out split ratio
    let total_leftover = (stable_amount_liquidity * (10000 - PURCHASE_CUT)) / 10000;
    let total_cut = stable_amount_liquidity - total_leftover;

    msg!("total_cut: {:?}", total_cut);
    msg!("total_leftover: {:?}", total_leftover);

    // Transfer liquidity coin to us
    token::transfer(
        CpiContext::new(token_program.to_account_info(), Transfer {
            from: buyer_ata.to_account_info(),
            to: master_recipient_ata.to_account_info(),
            authority: buyer.to_account_info(),
        }),
        total_cut
    )?;

    // Transfer liquidity coin to the specified ibo account
    token::transfer(
        CpiContext::new(token_program.to_account_info(), Transfer {
            from: buyer_ata.to_account_info(),
            to: recipient_ata.to_account_info(),
            authority: buyer.to_account_info(),
        }),
        total_leftover
    )?;

    // Rederive the bump
    let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes()],
        program_id
    );
    let seeds = &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes(), &[bump]];

    // Transfer bond to the vested account
    token::transfer(
        CpiContext::new(token_program.to_account_info(), Transfer {
            from: ibo_ata.to_account_info(),
            to: bond_ata.to_account_info(),
            authority: ibo.to_account_info(),
        }).with_signer(&[seeds]),
        total_gains
    )?;

    // msg!("desired stable mint: {:?}", ibo.liquidity_token);
    // msg!("provided mint: {:?}", ctx.accounts.recipient_ata.mint);

    // Create a new bond instance PDA
    let maturity_stamp: i64 = lockup.get_maturity_stamp();
    bond.new(buyer.key(), maturity_stamp, total_gains, lockup.mature_only);

    // Increment counter of all the issued bonds
    ibo.bond_counter += 1;

    Ok(())
}