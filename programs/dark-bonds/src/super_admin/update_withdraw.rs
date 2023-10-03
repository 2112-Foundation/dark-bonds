use crate::state::*;
use anchor_lang::prelude::*;

// TODO this is pretty much unimplemented

#[derive(Accounts)]
pub struct UpdateMasterWithdraw<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(        
        mut,      
        seeds = ["main_register".as_bytes()], 
        bump,                      
    )]
    pub master: Account<'info, Master>,
    pub system_program: Program<'info, System>,
}

// Any invocation after first time will fail on the PDA seeds macthing
pub fn update_withdraw(ctx: Context<UpdateMasterWithdraw>, master_recipient: Pubkey) -> Result<()> {
    let superadmin: &Signer = &mut ctx.accounts.superadmin;
    let master: &mut Account<Master> = &mut ctx.accounts.master;

    // TODO not sure if admin is needed tbh at all

    master.master_recipient = superadmin.key(); // TODO option for this to be different

    Ok(())
}
