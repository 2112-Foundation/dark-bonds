use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[derive(Accounts)]
pub struct CreateIBO<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // Must be derived from the latest counter
    #[account(        
        init,      
        seeds = ["ibo_instance".as_bytes(), &main_ibo.ibo_counter.to_be_bytes()], 
        bump,      
        payer = admin, 
        space = 333
    )]    
    pub ibo: Account<'info, Ibo>,

    // Checks for correct main account provided
    #[account(               
        mut, 
        seeds = ["main_register".as_bytes()], 
        bump,       
    )]    
    pub main_ibo: Account<'info, Master>,    // TODO do that everwyehre
    pub system_program: Program<'info, System>,
}

pub fn create_ibo(
    ctx: Context<CreateIBO>,
    fixed_exchange_rate: u64,
    live_date: i64,
    liquidity_token: Pubkey,
    recipient: Pubkey,
) -> Result<()> {
    let admin: &Signer = &mut ctx.accounts.admin;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let main_ibo: &mut Account<Master> = &mut ctx.accounts.main_ibo;    

    // Fill out details of the new Ibo    
    ibo.live_date = live_date;
    ibo.fixed_exchange_rate = fixed_exchange_rate;
    ibo.liquidity_token = liquidity_token;
    ibo.admin = admin.key();
    ibo.recipient_address = recipient;

    // Counter is incremebted for Ibo counter
    main_ibo.ibo_counter += 1;
    Ok(())
}
