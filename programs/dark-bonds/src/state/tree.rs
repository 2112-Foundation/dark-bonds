use anchor_lang::prelude::*;

#[account]
pub struct Tree {
    pub tree_idx: u16, // Can have multiple trees, if NFTs divided based on some price point
    pub depth: u8, // How many layers
    pub total_nfts: u32,
}