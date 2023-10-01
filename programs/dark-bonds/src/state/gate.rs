use anchor_lang::prelude::*;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the bond details
// After that not accessed

#[account]
pub struct Gate {
    /** Mint key.*/
    pub mint_key: Pubkey,
    /** Master key.*/
    pub master_key: Pubkey,
    /** Creator key.*/
    pub creator_key: Pubkey,
}

// Need to add verification functions here
// Also different types of a gate
// - spl
// - community
