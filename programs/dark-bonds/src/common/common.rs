use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

use solana_program::pubkey::Pubkey;

const SECONDS_YEAR: f64 = 31536000.0;
const PURCHASE_CUT: u64 = 500; // equivalent to 5%

pub fn recursive_pda_derivation(
    ibo: &Pubkey,
    tree: &Pubkey,
    vertex_idx: Vec<u8>,
    tree_idx: u8,
    current_depth: u8,
    vertices: Vec<&Pubkey>,
    program_id: &Pubkey
) -> Result<()> {
    // Create byte arrays
    let tree_idx_bytes = tree_idx.to_be_bytes();
    let vertex_idx_bytes: Vec<[u8; 1]> = vertex_idx
        .iter()
        .map(|&idx| [idx])
        .collect();

    msg!("current_depth: {:?}", current_depth);
    msg!("vertices length: {:?}", vertices.len());

    // Define the seeds based on current_depth
    let seeds: Vec<&[u8]> = match current_depth {
        0 =>
            vec![
                "vertex".as_bytes(),
                ibo.as_ref(),
                &tree_idx_bytes,
                tree.as_ref(),
                &vertex_idx_bytes[0]
            ],
        1 =>
            vec![
                "vertex".as_bytes(),
                ibo.as_ref(),
                &tree_idx_bytes,
                tree.as_ref(),
                vertices[0].as_ref(),
                &vertex_idx_bytes[1]
            ],
        2 =>
            vec![
                "vertex".as_bytes(),
                ibo.as_ref(),
                &tree_idx_bytes,
                tree.as_ref(),
                vertices[0].as_ref(),
                vertices[1].as_ref(),
                &vertex_idx_bytes[2]
            ],
        _ => {
            return Err(ErrorCode::InvalidRecursiveIdx.into());
        }
    };

    let (derived_address, _) = Pubkey::find_program_address(&seeds, program_id);
    require!(vertices[current_depth as usize] == &derived_address, ErrorCode::WrongVertexAccount);

    msg!("Provided address: {}", vertices[current_depth as usize]);
    msg!("Derived address: {}", derived_address);

    // Check if we have reached the last vertex
    if (current_depth as usize) == vertices.len() - 1 {
        return Ok(());
    } else {
        recursive_pda_derivation(
            ibo,
            tree,
            vertex_idx,
            tree_idx,
            current_depth + 1,
            vertices,
            program_id
        )
    }
}

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
    let maturity_stamp: i64 = lockup.compute_bond_completion_date();
    bond.new(buyer.key(), maturity_stamp, total_gains, lockup.mature_only, ibo.bond_counter);

    // Increment counter of all the issued bonds
    ibo.bond_counter += 1;

    Ok(())
}