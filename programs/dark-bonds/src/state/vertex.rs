use anchor_lang::prelude::*;

#[derive(Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct Pointer {
    address: Pubkey,
    taken: bool,
}

#[account]
pub struct Vertex {
    end: bool, // true means all pointers are to the baskets
    idx: u8, // 10 max, counter can be either of
    data: Vec<Pointer>, // Pointers to either next branch, or Nft basket
}