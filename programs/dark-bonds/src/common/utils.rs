use crate::common::errors::BondErrors::*;
use crate::common::errors::BondErrors;
use crate::state::*;
use anchor_lang::prelude::*;
use spl_math::precise_number::PreciseNumber;

use solana_program::pubkey::Pubkey;

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
            return Err(InvalidRecursiveIdx.into());
        }
    };

    let (derived_address, _) = Pubkey::find_program_address(&seeds, program_id);
    require!(vertices[current_depth as usize] == &derived_address, BondErrors::WrongVertexAccount);

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

pub fn take_fee<'info>(
    recipient: &AccountInfo<'info>,
    payer: &AccountInfo<'info>,
    fee: u64,
    fee_reduction: u8
) -> Result<()> {
    // Only take fee if not invoked by admin
    let lamport_fee: u64;
    match fee_reduction {
        0 => {
            lamport_fee = fee;
        }
        100 => {
            return Ok(());
        }
        _ => {
            lamport_fee = (fee * (100 - (fee_reduction as u64))) / 100;
            msg!("lamport_fee: {:?}", lamport_fee);
        }
    }

    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &payer.key(),
        &recipient.key(),
        lamport_fee
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[payer.to_account_info(), recipient.to_account_info()]
    )?;

    Ok(())
}

/** Splits liquidity fee between main and IBO admin */
pub fn calculate_cut_and_remainder(amount: u64, cut_percentage: f64) -> Result<(u64, u64)> {
    // Validate percentage
    require!(cut_percentage > 0.0 || cut_percentage < 100.0, BondErrors::WorngCutTMP);

    // Convert u64 to u128 for internal calculations
    let amount_128 = amount as u128;

    // Calculate the cut and check for potential overflow
    let cut_128 = (((amount_128 as f64) * cut_percentage) / 100.0).round() as u128;
    let cut = cut_128 as u64;

    // Calculate the remainder and check for potential overflow
    let remainder = amount.checked_sub(cut).ok_or("Overflow during remainder calculation").unwrap();
    Ok((cut, remainder))
}

/** Converts liqduity amoutn to bonds based on exchange rate */
pub fn conversion(amount_liqduity: &u64, _exchange_rate: &u64) -> Result<u64> {
    // Conversion of parameters to PreciseNumber
    let liquidity_in: PreciseNumber = PreciseNumber::new(*amount_liqduity as u128).ok_or(
        error!(ConversionFailed)
    )?;
    let exchange_rate: PreciseNumber = PreciseNumber::new(*_exchange_rate as u128).ok_or(
        error!(ConversionFailed)
    )?;

    // Multuply amount lqiudity by exhcange rate, cast as u64 and return it
    let amount_stable: u64 = liquidity_in
        .checked_mul(&exchange_rate)
        .ok_or(error!(ConversionFailed))?
        .to_imprecise()
        .ok_or(error!(ConversionFailed))? as u64;

    Ok(amount_stable)
}
