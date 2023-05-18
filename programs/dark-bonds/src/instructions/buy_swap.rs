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

    #[account(mut)] //, token::mint = ibo.liquidity_token, token::authority = ibo.recipient_address)]        
    pub ibo_admin_ata: Box<Account<'info, TokenAccount>>, // Matches specified owner and mint   

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
}

impl<'info> BuySwap<'info> {
    fn transfer_liquidity(
        &self,
        recipient_ata: &Account<'info, TokenAccount>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.buyer_ata.to_account_info(),
                to: recipient_ata.to_account_info(),
                authority: self.buyer.to_account_info(),
            },
        )
    }
}


// impl<'info> BuySwap<'info> {    
//     fn transfer_liquidity(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>{
//         CpiContext::new(
//             self.token_program.to_account_info(),
//             Transfer {
//                 from: self.buyer_ata.to_account_info(),
//                 to: self.seller_ata.to_account_info(),
//                 authority: self.buyer.to_account_info(),
//             },
//         )
//     }
// }


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
    let ibo: &mut Account<Ibo> = &mut accounts.ibo;

    // Set as the new bond owner
    bond.owner = buyer.key();

    // Set swap price to zero
    // bond.swap_price = 0;


    // let vault_balance_f64  = ctx.accounts.vault_ata.amount as f64;
    // let amount_game_program_f64  = vault_balance_f64  * game_entry.game_cut_ratio;
    // let amount_game_manager_f64: f64 = amount_game_program_f64 * SUB_CUT;
    // let amount_player_f64 = vault_balance_f64 - amount_game_program_f64 - amount_game_manager_f64;

    msg!("bond.swap_price: {:?}", bond.swap_price);
    msg!("ibo.swap_cut: {:?}",  ibo.swap_cut);

    // Calculate the cut for them
    // let seller_cut: u64 = (bond.swap_price * (100.0 - ibo.swap_cut as f64 / 100.0)) as u64 ;
    // let reuser_cut: u64 = ((bond.swap_price - seller_cut) as f64 * 0.9 * seller_cut as f64) as u64; // We get 10% of whatever they do
    // let master_cut: u64 = bond.swap_price - seller_cut - reuser_cut;

    let bond_price: u64 = bond.swap_price;  // for example
    let BMc: u64 = ibo.swap_cut;  // Bond master cut, in basis points (i.e., hundredths of a percent)
    let MMc: u64 = 1000; // Master master cut, in basis points 
    
    // Seller's cut
    let seller_cut: u64 = bond_price * (10000 - BMc) / 10000;
    
    // Bond master's cut
    let bond_master_cut: u64 = bond_price * BMc * (10000 - MMc) / 100000000;

    msg!("bond_master_cut: {:?}", bond_master_cut);
    
    // Master master's cut
    let master_master_cut: u64 = bond_price - seller_cut - bond_master_cut;
    
    // Now, adjust the bond master's cut so that the total exactly matches the bond price.
    let adjusted_bond_master_cut = bond_master_cut + bond_price - seller_cut - bond_master_cut - master_master_cut;

    msg!("seller_cut: {:?}", seller_cut);
    // msg!("bond_master_cut: {:?}", bond_master_cut);
    msg!("adjusted_bond_master_cut: {:?}", adjusted_bond_master_cut);
    msg!("master_master_cut: {:?}", master_master_cut);  

    
    assert_eq!(seller_cut + adjusted_bond_master_cut + master_master_cut, bond_price);   

    

    // Transfer liquidity coin cut to the ATA of the seller
    token::transfer(
        accounts.transfer_liquidity(&accounts.seller_ata),  
        seller_cut
    )?;                   

    // Transfer liquidity coin cut to the ATA of the IBO admin
    token::transfer(
        accounts.transfer_liquidity(&accounts.ibo_admin_ata),
        bond_master_cut
    )?;                   

    // Transfer liquidity coin cut to the ATA of the master admin
    token::transfer(
        accounts.transfer_liquidity(&accounts.master_recipient_ata),  
        master_master_cut
    )?;                   

    Ok(())
}

