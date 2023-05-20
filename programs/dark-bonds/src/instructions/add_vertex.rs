use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };
use switchboard_v2::VrfAccountData;

#[derive(Accounts)]
pub struct AddVertex<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub nft_entry: Program<'info, Token>,
    pub sender_ata: Account<'info, TokenAccount>,
    pub recipient_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    // pub associated_token_program: Program<'info, AssociatedToken>,
    // pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

// needs to be common to all of them the actual transfer
// impl<'info> AddVertex<'info> {
//     fn transfer_nft(
//         &self,
//         sender_ata: &Account<'info, TokenAccount>,
//         recipient_ata: &Account<'info, TokenAccount>
//     ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//         CpiContext::new(self.token_program.to_account_info(), Transfer {
//             from: sender_ata.to_account_info(),
//             to: recipient_ata.to_account_info(),
//             authority: self.bond.to_account_info(),
//         })
//     }
// }

// option to add % to claim?
pub fn add_vertex(ctx: Context<AddNft>, ibo_address: Pubkey, bond_idx: u32) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    Ok(())
}