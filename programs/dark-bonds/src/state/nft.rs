use anchor_lang::prelude::*;

#[account]
pub struct Nft {
    pub taken: bool,
    pub mint: Pubkey,
}