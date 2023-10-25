use crate::state::*;
use crate::errors::errors::ErrorCode;
use anchor_lang::prelude::*;

// TODO add functions for smaller trees

// For adding the FIRST level
#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8, vertex_idx_0: u8, vertex_idx_1: u8, vertex_idx_2: u8, nft_basket_idx: u8)]
pub struct AddNftBasket2<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // Rederive ibo to ensure it is the correct one
    // TODO wrong action look-up probably, need to be specific to this
    #[account(mut, has_one = admin, constraint = ibo.actions.lockup_modification @ErrorCode::IboLockupsLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(
        seeds = ["tree".as_bytes(), ibo.key().as_ref(), &tree_idx.to_be_bytes()],
        bump,
        constraint = tree.depth == 2
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        init,
        seeds = [
            "nft_basket".as_bytes(),
            ibo.key().as_ref(),
            &tree_idx.to_be_bytes(),
            tree.key().as_ref(),
            vertex0.key().as_ref(),
            vertex1.key().as_ref(),
            vertex2.key().as_ref(),
            &nft_basket_idx.to_be_bytes(),
        ],
        bump,
        payer = admin,
        space = 400
    )]
    pub nft_basket: Account<'info, NftBasket>,
    #[account(
        seeds = [
            "vertex".as_bytes(),
            ibo.key().as_ref(),
            &tree_idx.to_be_bytes(),
            tree.key().as_ref(),
            &vertex_idx_0.to_be_bytes(),
        ],
        bump
    )]
    pub vertex0: Account<'info, Vertex>,
    #[account(
        seeds = [
            "vertex".as_bytes(),
            ibo.key().as_ref(),
            &tree_idx.to_be_bytes(),
            tree.key().as_ref(),
            vertex0.key().as_ref(),
            &vertex_idx_1.to_be_bytes(),
        ],
        bump
    )]
    pub vertex1: Account<'info, Vertex>,
    #[account(
        seeds = [
            "vertex".as_bytes(),
            ibo.key().as_ref(),
            &tree_idx.to_be_bytes(),
            tree.key().as_ref(),
            vertex0.key().as_ref(),
            vertex1.key().as_ref(),
            &vertex_idx_2.to_be_bytes(),
        ],
        bump,
        constraint = vertex2.end == true
    )]
    pub vertex2: Account<'info, Vertex>, // constraint for end being set to true
    pub system_program: Program<'info, System>,
}

pub fn add_nft_basket2(
    _ctx: Context<AddNftBasket2>,
    _ibo_idx: u32,
    _tree_idx: u8,
    _vertex_idx_0: u8,
    _vertex_idx_1: u8,
    _vertex_idx_2: u8,
    _nft_basket_idx: u8
) -> Result<()> {
    // let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    // let tree: &mut Account<Tree> = &mut ctx.accounts.tree;

    // Loop over vertices and process them

    msg!("initialising nft basket");

    Ok(())
}
