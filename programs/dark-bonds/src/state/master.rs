use anchor_lang::prelude::*;

// Deployed only once at a start so has a uniqye PDA
// "ibo_counter"

#[account]
pub struct Master {
    /** Counter for all of the IBOs intialised to date.*/
    pub ibo_counter: u64,
    /** Cut take of each bond issuance transaction.*/
    pub master_cut: u64, // Could be just hardcoded it is
    /** Master admin that can.*/
    pub admin: Pubkey, // Not sure what it can do really, withdraw
    /** Receives all the cuts.*/
    pub master_recipient: Pubkey,
}
