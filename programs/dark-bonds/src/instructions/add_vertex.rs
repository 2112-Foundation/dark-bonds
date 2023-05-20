use crate::state::*;
use crate::errors::errors::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };
use switchboard_v2::VrfAccountData;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8, vertex_idx: u8)]
pub struct AddVertex<'info> {
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
            &vertex_idx.to_be_bytes(),
        ],
        bump,
        payer = admin,
        space = 400
    )]
    pub vertex: Account<'info, Vertex>,
    pub system_program: Program<'info, System>,
}

pub fn add_vertex(
    ctx: Context<AddVertex>,
    ibo_idx: u32,
    tree_idx: u8,
    vertex_idx: u8
) -> Result<()> {
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let vertex: &mut Account<Vertex> = &mut ctx.accounts.vertex;
    let tree: &mut Account<Tree> = &mut ctx.accounts.tree;

    tree.vertex_counter += 1;

    Ok(())
}