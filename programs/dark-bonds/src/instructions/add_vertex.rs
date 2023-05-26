use crate::state::*;
use crate::errors::errors::ErrorCode;
use anchor_lang::prelude::*;
use super::common::mark_end;

// For adding the FIRST level
#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8, vertex_idx_0: u8)]
pub struct AddVertex0<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // Rederive ibo to ensure it is the correct one
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(seeds = ["tree".as_bytes(), ibo.key().as_ref(), &tree_idx.to_be_bytes()], bump)]
    pub tree: Account<'info, Tree>,
    #[account(
        init,
        seeds = [
            "vertex".as_bytes(),
            ibo.key().as_ref(),
            &tree_idx.to_be_bytes(),
            tree.key().as_ref(),
            &vertex_idx_0.to_be_bytes(),
        ],
        bump,
        payer = admin,
        space = 400
    )]
    pub vertex0: Account<'info, Vertex>,
    pub system_program: Program<'info, System>,
}

pub fn add_vertex0(
    ctx: Context<AddVertex0>,
    _ibo_idx: u32,
    _tree_idx: u8,
    _vertex_idx_0: u8
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let vertex0: &mut Account<Vertex> = &mut ctx.accounts.vertex0;
    let tree: &mut Account<Tree> = &mut ctx.accounts.tree;

    tree.vertex_counter += 1;

    msg!("tree.depth: {:?}", tree.depth);

    mark_end(vertex0, tree.depth, 0);

    Ok(())
}

// For adding the SECOND level
#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8, vertex_idx_0: u8, vertex_idx_1: u8)]
pub struct AddVertex1<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // Rederive ibo to ensure it is the correct one
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(seeds = ["tree".as_bytes(), ibo.key().as_ref(), &tree_idx.to_be_bytes()], bump)]
    pub tree: Account<'info, Tree>,
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
        init,
        seeds = [
            "vertex".as_bytes(),
            ibo.key().as_ref(),
            &tree_idx.to_be_bytes(),
            tree.key().as_ref(),
            vertex0.key().as_ref(),
            &vertex_idx_1.to_be_bytes(),
        ],
        bump,
        payer = admin,
        space = 400
    )]
    pub vertex1: Account<'info, Vertex>,
    pub system_program: Program<'info, System>,
}

pub fn add_vertex1(
    ctx: Context<AddVertex1>,
    _ibo_idx: u32,
    _tree_idx: u8,
    _vertex_idx_0: u8,
    _vertex_idx_1: u8
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let vertex0: &mut Account<Vertex> = &mut ctx.accounts.vertex0;
    let vertex1: &mut Account<Vertex> = &mut ctx.accounts.vertex1;
    let tree: &mut Account<Tree> = &mut ctx.accounts.tree;

    // Increment sub counter on the vertex above
    vertex0.sub_idx += 1;

    msg!("tree.depth: {:?}", tree.depth);

    mark_end(vertex1, tree.depth, 1);

    Ok(())
}
// For adding the THIRD level
#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8, vertex_idx_0: u8, vertex_idx_1: u8, vertex_idx_2: u8)]
pub struct AddVertex2<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // Rederive ibo to ensure it is the correct one
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(seeds = ["tree".as_bytes(), ibo.key().as_ref(), &tree_idx.to_be_bytes()], bump)]
    pub tree: Account<'info, Tree>,
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
        init,
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
        payer = admin,
        space = 400
    )]
    pub vertex2: Account<'info, Vertex>,
    pub system_program: Program<'info, System>,
}

pub fn add_vertex2(
    ctx: Context<AddVertex2>,
    _ibo_idx: u32,
    _tree_idx: u8,
    _vertex_idx_0: u8,
    _vertex_idx_1: u8,
    _vertex_idx_2: u8
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let vertex1: &mut Account<Vertex> = &mut ctx.accounts.vertex1;
    let vertex2: &mut Account<Vertex> = &mut ctx.accounts.vertex2;
    let tree: &mut Account<Tree> = &mut ctx.accounts.tree;

    vertex1.sub_idx += 1;

    msg!("tree.depth: {:?}", tree.depth);

    mark_end(vertex2, tree.depth, 2);

    Ok(())
}