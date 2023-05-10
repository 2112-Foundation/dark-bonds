use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    // Need PDA of the to be derived of some shared register which is incremented
    #[account(        
        init,      
        seeds = ["main_register".as_bytes()], // TODO add hardcoded string
        bump,      
        payer = superadmin, 
        space = 400
    )]    
    pub main_ibo: Account<'info, Master>,
    pub system_program: Program<'info, System>,
}

// Any invocation after first time will fail on the PDA seeds macthing
pub fn init(ctx: Context<Init>) -> Result<()> {
    let superadmin: &Signer = &mut ctx.accounts.superadmin;
    let main_ibo: &mut Account<Master> = &mut ctx.accounts.main_ibo;

    // TODO not sure if admin is needed tbh at all
    main_ibo.admin = superadmin.key();
    Ok(())
}
