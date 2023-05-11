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
#[instruction(lockup_idx: u32)]
pub struct BuyBond<'info> {

    // TODO need a mint correctness check
    // #[account(mut, token::mint = mint, token::authority = vault)]
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

    // TODO add check for this being derived correctly
    // #[account(                
    //     seeds = ["lockup".as_bytes(), ibo.key().as_ref(),  &lockup_idx.to_be_bytes()], // TODO add counter
    //     bump,              
    // )]    
    pub lockup: Account<'info, LockUp>,
    // purchse token
    #[account(mut)]
    pub buyer_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub recipient_ata: Box<Account<'info, TokenAccount>>,

    // bond token
    #[account(mut)]
    pub ibo_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub buyer_pda_ata: Box<Account<'info, TokenAccount>>,    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>, 
}

// PDA for acceptable mints

// Extra cut for deposit which goes on to make LP in raydium

pub fn buy_bond(ctx: Context<BuyBond>, _lockup_idx: u32, ibo_idx: u64, stable_amount_liquidity: u64) -> Result<()> {    
    let buyer: &Signer = &ctx.accounts.buyer;
    let lockup: &Account<LockUp> = &ctx.accounts.lockup;    

    // Cacluclate total amount to be netted over the whole lock-up period
    let total_gains: u64 = lockup.get_total_gain(stable_amount_liquidity);

    // Get balance within the bond main
    let bond_token_left: u64  = ctx.accounts.ibo_ata.amount;    

    // Ensure there are enough tokens TODO
    require!(bond_token_left >= total_gains, ErrorCode::BondsSoldOut);    

    msg!("bond_token_left: {:?}", bond_token_left);
    msg!("total_gains: {:?}", total_gains);

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

    // Create a new bond instance PDA
    let maturity_stamp: i64 = lockup.get_maturity_stamp();
    ticket.new(buyer.key(), maturity_stamp, total_gains);

    // // // Increment counter of all bond tickets issued
    ibo.ticket_counter += 1;    

    Ok(())
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
                to: self.buyer_pda_ata.to_account_info(),
                authority: self.ibo.to_account_info(),
            },
        )
    }

}