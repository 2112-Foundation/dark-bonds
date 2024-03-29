use crate::common::errors::BondErrors;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, tree_idx: u8)]
pub struct AddTree<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // TODO wrong action look-up probably, need to be specific to this
    #[account(mut, has_one = admin, constraint = ibo.actions.lockup_modification == false @BondErrors::IboLockupsLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(
        init,
        seeds = ["tree".as_bytes(), ibo.key().as_ref(), &tree_idx.to_be_bytes()],
        bump,
        payer = admin,
        space = 400
    )]
    pub tree: Account<'info, Tree>,
    pub system_program: Program<'info, System>,
}

pub fn add_tree(ctx: Context<AddTree>, _ibo_idx: u32, _tree_idx: u8, depth: u8) -> Result<()> {
    let tree: &mut Account<Tree> = &mut ctx.accounts.tree;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    // Increment individuall tree counter and set depth
    msg!("setting tree depth of: {:?}", depth);
    ibo.tree_counter += 1;
    tree.depth = depth;

    Ok(())
}
