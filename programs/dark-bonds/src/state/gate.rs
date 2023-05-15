use anchor_lang::prelude::*;

const SECONDS_YEAR: f64 = 31536000.0;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the ticket details
// After that not accessed

#[account]
pub struct Gate {
    pub mint_key: Pubkey,
    pub master_key: Pubkey,
    pub creator_key: Pubkey,
}
