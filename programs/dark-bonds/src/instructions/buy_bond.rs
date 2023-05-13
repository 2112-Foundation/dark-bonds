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

const SECONDS_YEAR: f64 = 31536000.0;

#[derive(Accounts)]
#[instruction(lockup_idx: u32)]
pub struct BuyBond<'info> {
    
    #[account(mut)]
    pub buyer: Signer<'info>,    
    #[account(        
        init,      
        seeds = ["ticket".as_bytes(), ibo.key().as_ref(),  &ibo.ticket_counter.to_be_bytes()], // TODO add counter
        bump,      
        payer = buyer, 
        space = 400
    )]    
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    
    #[account(                
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(),  &lockup_idx.to_be_bytes()], // TODO add counter
        bump,              
    )]    
    pub lockup: Account<'info, LockUp>,

    // purchse token
    // Provided ATA has to be same mint as the one set in ibo
    #[account(mut, token::mint = ibo.stablecoin, token::authority = buyer)]
    pub buyer_ata: Box<Account<'info, TokenAccount>>,    
    #[account(mut)] 
    pub recipient_ata: Box<Account<'info, TokenAccount>>,

    // bond token    
    #[account(mut)]
    pub ibo_ata: Box<Account<'info, TokenAccount>>,
    // Check for ticket substitution attack
    #[account(mut, token::authority = ticket)]
    pub ticket_ata: Box<Account<'info, TokenAccount>>,       

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>, 
}

impl<'info> BuyBond<'info> {
    // fn transfer_liquidity(&self, from_ata: &Account<'info, TokenAccount>, to_ata: &Account<'info, TokenAccount>, auth: &Signer<'info>) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
    fn transfer_liquidity(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.buyer_ata.to_account_info(),
                to: self.recipient_ata.to_account_info(),
                authority: self.buyer.to_account_info(),
            },
        )
    }

    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ibo_ata.to_account_info(),
                to: self.ticket_ata.to_account_info(),
                authority: self.ibo.to_account_info(),
            },
        )
    }
}

// PDA for acceptable mints
// Extra cut for deposit which goes on to make LP in raydium

pub fn buy_bond(ctx: Context<BuyBond>, _lockup_idx: u32, ibo_idx: u64, stable_amount_liquidity: u64) -> Result<()> {    
    let buyer: &Signer = &ctx.accounts.buyer;
    let lockup: &Account<LockUp> = &ctx.accounts.lockup;    

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
    let bond_token_left: u64  = ctx.accounts.ibo_ata.amount;    

    // Ensure there are enough tokens TODO
    require!(bond_token_left >= total_gains, ErrorCode::BondsSoldOut);    

    msg!("bond_token_left: {:?}", bond_token_left);
    msg!("full bond value: {:?}", total_gains);

    // Transfer liquidity coin to the specified account    
    token::transfer(
        ctx.accounts
            .transfer_liquidity(),                 
            stable_amount_liquidity
    )?;               

    // Rederive bump
    let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(&["ibo_instance".as_bytes(),  &ibo_idx.to_be_bytes()], &ctx.program_id);
    let seeds = &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes(), &[bump]];  
    
    // Transfer bond to the vested account
    token::transfer(
        ctx.accounts
            .transfer_bond()
            .with_signer(&[seeds]),
            total_gains,
    )?;

    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;         
    let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;     

    msg!("desired stable mint: {:?}", ibo.stablecoin);
    msg!("provided mint: {:?}", ctx.accounts.recipient_ata.mint);

    // Create a new bond instance PDA
    let maturity_stamp: i64 = lockup.get_maturity_stamp();
    ticket.new(buyer.key(), maturity_stamp, total_gains);

    // Increment counter of all bond tickets issued
    ibo.ticket_counter += 1;    

    Ok(())
}

