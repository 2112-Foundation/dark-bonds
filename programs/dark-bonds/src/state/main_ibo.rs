use anchor_lang::prelude::*;

// Deployed only once at a start so has a uniqye PDA
// "ibo_counter"

#[account]
pub struct Master {
    // Counter for all of the IBOs to date
    pub ibo_counter: u64,

    // Applied to non-dark IBOs
    pub master_cut: u64, // Could be just hardcoded

    // Admin not sure if needed
    pub admin: Pubkey,
}
