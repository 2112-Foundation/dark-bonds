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
        seeds = ["ibo_instance".as_bytes(), &main_ibo.ibo_counter.to_be_bytes()], // TODO add counter
        bump,      
        payer = admin, 
        space = 333
    )]    
    pub ibo: Account<'info, Ibo>,

    // Checks for correct main account provided
    #[account(                
        seeds = ["main_register".as_bytes()], 
        bump,       
    )]    
    pub main_ibo: Account<'info, Master>,    
    pub system_program: Program<'info, System>,
}

// Extra cut for deposit which goes on to make LP in raydium
pub fn create_ibo(
    ctx: Context<CreateIBO>,
    fixed_exchange_rate: u64,
    live_date: i64,
    stablecoin: Pubkey,
) -> Result<()> {
    let admin: &Signer = &mut ctx.accounts.admin;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let main_ibo: &mut Account<Master> = &mut ctx.accounts.main_ibo;

    // Counter is incremebted for Ibo counter
    main_ibo.ibo_counter += 1;

    // Fill out details of the new Ibo
    ibo.new(fixed_exchange_rate, live_date, stablecoin, admin.key());

    Ok(())
}
