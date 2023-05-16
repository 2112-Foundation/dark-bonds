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

use metaplex_token_metadata::state::Metadata;
const SECONDS_YEAR: f64 = 31536000.0;



// TODO hardcode program ID

pub fn buy_common(buyer: &Signer, lockup: &Account<LockUp>, ibo: &mut Account<Ibo>, ticket: &mut Account<Ticket>, ibo_ata: &Account<TokenAccount>, stable_amount_liquidity: u64) -> Result<()> {

    // let buyer: &Signer = &ctx.accounts.buyer;
    // let lockup: &Account<LockUp> = &ctx.accounts.lockup;    

    // Cacluclate total amount to be netted over the whole lock-up period
    // let total_gains: u64 = lockup.get_total_gain(stable_amount_liquidity);


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
    let bond_token_left: u64  = ibo_ata.amount;    

    // Ensure there are enough tokens TODO
    require!(bond_token_left >= total_gains, ErrorCode::BondsSoldOut);    

    msg!("bond_token_left: {:?}", bond_token_left);
    msg!("full bond value: {:?}", total_gains);

    // Transfer liquidity coin to the specified account    
    // token::transfer(
    //     ctx.accounts
    //         .transfer_liquidity(),                 
    //         stable_amount_liquidity
    // )?;               

    // Rederive bump
    // let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(&["ibo_instance".as_bytes(),  &ibo_idx.to_be_bytes()], &ctx.program_id);
    // let seeds = &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes(), &[bump]];  
    
    // Transfer bond to the vested account
    // token::transfer(
    //     ctx.accounts
    //         .transfer_bond()
    //         .with_signer(&[seeds]),
    //         total_gains,
    // )?;

    // let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;         
    // let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;     

    // msg!("desired stable mint: {:?}", ibo.stablecoin);
    // msg!("provided mint: {:?}", ctx.accounts.recipient_ata.mint);

    // Create a new bond instance PDA
    let maturity_stamp: i64 = lockup.get_maturity_stamp();
    ticket.new(buyer.key(), maturity_stamp, total_gains);

    // Increment counter of all bond tickets issued
    ibo.ticket_counter += 1;    


    Ok(())
}