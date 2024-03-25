use crate::state::*;
use anchor_lang::prelude::*;
use crate::common::*;

// TODO this is pretty much unimplemented

#[derive(Accounts)]
pub struct UpdateMasterWithdraw<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    #[account(        
        mut,      
        seeds = [MAIN_SEED.as_bytes()], 
        bump = main.bump,                      
    )]
    pub main: Account<'info, Main>,
    pub system_program: Program<'info, System>,
}

// TODO I think this function is pointless
pub fn update_withdraw(ctx: Context<UpdateMasterWithdraw>, master_recipient: Pubkey) -> Result<()> {
    let superadmin: &Signer = &mut ctx.accounts.superadmin;
    let main: &mut Account<Main> = &mut ctx.accounts.main;

    // TODO not sure if admin is needed tbh at all
    main.master_recipient = master_recipient; // TODO option for this to be different

    Ok(())
}
