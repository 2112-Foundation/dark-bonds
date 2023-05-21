use crate::state::*;
use crate::errors::errors::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };
use super::common::recursive_pda_derivation;

// For adding the FIRST level
#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8, vertex_idx_0: u8, vertex_idx_1: u8, vertex_idx_2: u8, nft_basket_idx: u8)]
pub struct LoadNfts<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // Rederive ibo to ensure it is the correct one
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Box<Account<'info, Ibo>>,
    #[account(seeds = ["tree".as_bytes(), ibo.key().as_ref(), &tree_idx.to_be_bytes()], bump)]
    pub tree: Box<Account<'info, Tree>>,
    #[account(mut)]
    pub nft_basket: Box<Account<'info, NftBasket>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// pub fn recursive_derivation() {}

// pub fn load_nfts<'a>(
pub fn load_nfts<'a, 'b, 'c, 'd: 'a + 'e, 'e: 'a + 'd>(
    ctx: Context<'a, 'b, 'c, 'd, LoadNfts<'e>>,
    _ibo_idx: u32,
    tree_idx: u8,
    vertex_idx_0: u8,
    vertex_idx_1: u8,
    vertex_idx_2: u8,
    nft_basket_idx: u8
) -> Result<()> {
    msg!("initialising nft basket");

    let admin: &Signer = &mut ctx.accounts.admin;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let tree: &mut Account<Tree> = &mut ctx.accounts.tree;
    let token_program: &Program<Token> = &ctx.accounts.token_program;

    let accounts: &mut Vec<AccountInfo> = &mut ctx.remaining_accounts.to_vec();

    // TODO maybe make it larger than since need at least 3 acounts afterwards for this function to be useful
    require!((accounts.len() as u8) >= tree.depth, ErrorCode::MissingVertexAccount);
    msg!("accounts length: {:?}", accounts.len());
    msg!("tree.depth : {:?}", tree.depth);
    let (vertices, rest) = accounts.split_at((tree.depth as usize) + 1); // TODO needs to be unified what depth is

    let vertices_vec: Vec<AccountInfo> = vertices.to_vec();
    let rest_vec: Vec<AccountInfo> = rest.to_vec();

    recursive_pda_derivation(
        &ibo.key().clone(),
        &tree.key().clone(),
        vec![vertex_idx_0, vertex_idx_1, vertex_idx_2],
        tree_idx,
        0,
        vertices_vec
            .into_iter()
            .map(|account_info| account_info.key)
            .collect(),
        &ctx.program_id
    )?;

    // Needs to be divisible by 3
    // require!(rest_vec.len() % 3 == 0, ErrorCode::IncorrectRatioRemaining);

    msg!("ATAs size: {:?}", rest_vec.len());

    for i in (0..rest_vec.len()).step_by(2) {
        // let from_ata: Account<TokenAccount> = Account::try_from(&rest_vec[i])?;
        // let to_ata: Account<TokenAccount> = Account::try_from(&rest_vec[i + 1])?;
        let admin_account_info = ctx.accounts.admin.to_account_info().clone();

        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
                from: rest_vec[i].clone(),
                to: rest_vec[i + 1].clone(),
                authority: admin_account_info,
            }),
            1
        )?;

        msg!("transfered NFT");
    }

    // Increment the counter

    Ok(())
}

// TODO option to hardcode so they are from single collection only