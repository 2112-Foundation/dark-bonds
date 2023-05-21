use crate::state::*;
use crate::errors::errors::ErrorCode;
use anchor_lang::prelude::*;

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
    // #[account(mut)]
    // pub vertex0: Box<Account<'info, Vertex>>,
    // #[account(mut)]
    // pub vertex1: Box<Account<'info, Vertex>>,
    // #[account(mut)]
    // pub vertex2: Box<Account<'info, Vertex>>,
    pub system_program: Program<'info, System>,
}

// pub fn recursive_derivation() {}

pub fn load_nfts(
    ctx: Context<LoadNfts>,
    _ibo_idx: u32,
    tree_idx: u8,
    vertex_idx_0: u8,
    vertex_idx_1: u8,
    vertex_idx_2: u8,
    nft_basket_idx: u8
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let tree: &mut Account<Tree> = &mut ctx.accounts.tree;

    let accounts: &mut Vec<AccountInfo> = &mut ctx.remaining_accounts.to_vec();

    require!((accounts.len() as u8) >= tree.depth, ErrorCode::MissingVertexAccount);
    msg!("accounts length: {:?}", accounts.len());
    msg!("tree.depth : {:?}", tree.depth);
    let (vertices, rest) = accounts.split_at((tree.depth as usize) + 1); // TODO needs to be unified what depth is

    let vertices_vec: Vec<AccountInfo> = vertices.to_vec();
    let rest_vec: Vec<AccountInfo> = rest.to_vec();

    let ver: Vec<&Pubkey> = vertices_vec
        .into_iter()
        .map(|account_info| account_info.key)
        .collect();

    let vertex_idx_vec: Vec<u8> = vec![vertex_idx_0, vertex_idx_1, vertex_idx_2];

    recursive_pda_derivation(
        &ibo.key().clone(),
        &tree.key().clone(),
        vertex_idx_vec,
        tree_idx,
        0,
        ver,
        &ctx.program_id
    )?;

    msg!("initialising nft basket");

    Ok(())
}