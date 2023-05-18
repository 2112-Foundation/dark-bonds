use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(        
        init,      
        seeds = ["main_register".as_bytes()], 
        bump,      
        payer = superadmin, 
        space = 400
    )]    
    pub master: Account<'info, Master>,
    pub system_program: Program<'info, System>,
}

// Any invocation after first time will fail on the PDA seeds macthing
pub fn init(ctx: Context<Init>) -> Result<()> {
    let superadmin: &Signer = &mut ctx.accounts.superadmin;
    let master: &mut Account<Master> = &mut ctx.accounts.master;

    // TODO not sure if admin is needed tbh at all
    master.admin = superadmin.key();
    master.master_recipient = superadmin.key(); // TODO option for this to be different

    Ok(())
}
