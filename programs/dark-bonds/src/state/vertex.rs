use anchor_lang::prelude::*;

#[account]
pub struct Vertex {
    pub end: bool, // true means all pointers are to the baskets
    pub sub_idx: u8, // 10 max, counter can be either of
    pub empty: [u8; 10], // If set as empty can go next one mapping to a counter
}