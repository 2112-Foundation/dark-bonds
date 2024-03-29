use crate::state::*;
use crate::common::errors::BondErrors;
use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };
use crate::common::*;

// For adding the FIRST level
#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8, vertex_idx_0: u8, vertex_idx_1: u8, vertex_idx_2: u8, nft_basket_idx: u8)]
pub struct LoadNfts<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // Rederive ibo to ensure it is the correct one
    // TODO wrong action look-up probably, need to be specific to this
    #[account(mut, has_one = admin, constraint = ibo.actions.lockup_modification == false @BondErrors::IboLockupsLocked)]
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
    let nft_basket: &mut Account<NftBasket> = &mut ctx.accounts.nft_basket;

    let accounts: &mut Vec<AccountInfo> = &mut ctx.remaining_accounts.to_vec();

    // TODO maybe make it larger than since need at least 3 acounts afterwards for this function to be useful
    require!((accounts.len() as u8) >= tree.depth, BondErrors::MissingVertexAccount);
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

    // Needs to be divisible by 2
    require!(rest_vec.len() % 2 == 0, BondErrors::IncorrectRatioRemaining);

    msg!("ATAs size: {:?}", rest_vec.len());

    for i in (0..rest_vec.len()).step_by(2) {
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
    nft_basket.fill_idx += rest_vec.len() as u16;
    Ok(())
}

// TODO option to hardcode so they are from single collection only
