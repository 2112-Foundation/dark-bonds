use anchor_lang::prelude::*;

#[derive(Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct Pointer {
    address: Pubkey,
    taken: bool,
}

#[account]
pub struct Branch {
    end: bool, // true means all pointers are to the baskets
    data: Vec<Pointer>, // Pointers to either next branch, or Nft basket
}