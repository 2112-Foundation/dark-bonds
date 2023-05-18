use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct BuySwap<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    // Can't buy swap that is not listed
    #[account(mut, constraint = bond.swap_price > 0 @ErrorCode::NotForSale)]
    pub bond: Account<'info, Bond>,
    #[account(              
        seeds = ["main_register".as_bytes()], 
        bump,         
    )]    
    pub master: Account<'info, Master>,
    
    pub ibo: Account<'info, Ibo>,    
    #[account(mut,
        token::mint = ibo.liquidity_token,
        token::authority = buyer,
    )]
    pub buyer_ata: Account<'info, TokenAccount>,

    #[account(mut, 
        token::mint = ibo.liquidity_token,
        token::authority = bond.owner
    )]
    pub seller_ata: Account<'info, TokenAccount>,
    #[account(mut, token::mint = ibo.liquidity_token, token::authority = master.master_recipient)]        
    pub master_recipient_ata: Box<Account<'info, TokenAccount>>, // Matches specified owner and mint   

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
}

impl<'info> BuySwap<'info> {    
    fn transfer_liquidity(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.buyer_ata.to_account_info(),
                to: self.seller_ata.to_account_info(),
                authority: self.buyer.to_account_info(),
            },
        )
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn buy_swap(ctx: Context<BuySwap>) -> Result<()> {
    let accounts: &mut BuySwap = ctx.accounts; 
    let buyer: &mut Signer = &mut accounts.buyer;
    let bond: &mut Account<Bond> = &mut accounts.bond;    

    // Set as the new bond owner
    bond.owner = buyer.key();

    // Set swap price to zero
    bond.swap_price = 0;

    // Transfer sell price base stable coin to the ATA of the owner
    token::transfer(
        accounts.transfer_liquidity(),  // use accounts here
        accounts.bond.swap_price
    )?;                   

    Ok(())
}

