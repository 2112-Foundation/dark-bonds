use crate::errors::errors::ErrorCode;
use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ self, Mint, Token, TokenAccount, Transfer },
};

const MASTER_CUT: u64 = 1000; // equivalent to 10%

#[derive(Accounts)]
pub struct BuySwap<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    // Can't buy swap that is not listed
    #[account(mut, constraint = bond.swap_price > 0 @ErrorCode::BondNotForSale)]
    pub bond: Account<'info, Bond>,
    #[account(mut, seeds = [MASTER_SEED.as_bytes()], bump)]
    pub master: Account<'info, Master>,

    pub ibo: Account<'info, Ibo>,
    #[account(mut,
        token::mint = ibo.liquidity_token,
        token::authority = buyer,
    )]
    pub buyer_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        seeds = [USER_ACCOUNT_SEED.as_bytes(), buyer.key().as_ref()],
        bump,
        space = 8 + 40, // change
        payer = buyer
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        init_if_needed,
        seeds = [
            BOND_POINTER_SEED.as_bytes(),
            buyer.key().as_ref(),
            &user_account.bond_counter.to_be_bytes(),
        ],
        bump,
        space = 8 + 40, // change
        payer = buyer
    )]
    pub bond_pointer: Account<'info, BondPointer>,

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
    pub system_program: Program<'info, System>,
}

impl<'info> BuySwap<'info> {
    fn transfer_liquidity(
        &self,
        recipient_ata: &Account<'info, TokenAccount>
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.buyer_ata.to_account_info(),
            to: recipient_ata.to_account_info(),
            authority: self.buyer.to_account_info(),
        })
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
    let user_account: &mut Account<UserAccount> = &mut accounts.user_account;
    let bond_pointer: &mut Account<BondPointer> = &mut accounts.bond_pointer;
    let master: &mut Account<Master> = &mut accounts.master;
    let buyer: &mut Signer = &mut accounts.buyer;
    let bond: &mut Account<Bond> = &mut accounts.bond;
    let ibo: &mut Account<Ibo> = &mut accounts.ibo;

    // Take SOL fee for buying a bond
    take_fee(&master.to_account_info(), &buyer, master.user_fees.bond_purchase_fee as u64, 0)?;

    // Increment bond pointer counter and store pointer in the pointer PDA
    user_account.bond_counter += 1;
    bond_pointer.bond_address = bond.key();

    // Set as the new bond owner
    bond.owner = buyer.key();

    msg!("bond.swap_price: {:?}", bond.swap_price);
    msg!("ibo.swap_cut: {:?}", ibo.swap_cut);

    // Seller's cut
    let seller_cut: u64 = (bond.swap_price * (10000 - ibo.swap_cut)) / 10000;

    // Bond master's cut
    let bond_master_cut: u64 = (bond.swap_price * ibo.swap_cut * (10000 - MASTER_CUT)) / 100000000;

    msg!("bond_master_cut: {:?}", bond_master_cut);

    // Master master's cut
    let master_master_cut: u64 = bond.swap_price - seller_cut - bond_master_cut;

    // Now, adjust the bond master's cut so that the total exactly matches the bond price.
    let adjusted_bond_master_cut =
        bond_master_cut + bond.swap_price - seller_cut - bond_master_cut - master_master_cut;

    msg!("seller_cut: {:?}", seller_cut);
    msg!("bond_master_cut: {:?}", bond_master_cut);
    msg!("master_master_cut: {:?}", master_master_cut);

    // All funds used
    assert_eq!(seller_cut + adjusted_bond_master_cut + master_master_cut, bond.swap_price);

    // Transfer liquidity coin cut to the ATA of the seller
    token::transfer(accounts.transfer_liquidity(&accounts.seller_ata), seller_cut)?;

    // Transfer liquidity coin cut to the ATA of the IBO admin
    token::transfer(accounts.transfer_liquidity(&accounts.ibo_admin_ata), bond_master_cut)?;

    // Transfer liquidity coin cut to the ATA of the master admin
    token::transfer(
        accounts.transfer_liquidity(&accounts.master_recipient_ata),
        master_master_cut
    )?;

    Ok(())
}
