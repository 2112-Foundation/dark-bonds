use anchor_lang::prelude::*;

#[account]
pub struct Ibo {
    pub lockups_locked: bool, // After being set to true can't add further lock-ups
    pub withdraws_locked: bool, // After being set to true, IBO admin can't withdraw underlying token until end of the sesh

    // Fixed rate of conversion between underlying token and liquidity coin
    // Set by the deployer at the start
    pub fixed_exchange_rate: u64,

    // TODO option nto to enable swaps at all?
    pub swap_cut: u64, // in % x 100

    // Can be purchased after this date
    pub live_date: i64,
    pub end_date: i64, // needs to be set

    // Accepted mint address for purchase
    pub liquidity_token: Pubkey,
    pub underlying_token: Pubkey,

    // Receives provided liquidity, can be this PDA or any specified account
    pub recipient_address: Pubkey,

    // Admin
    pub admin: Pubkey,

    pub lockup_counter: u32, // TODO Can definitaly reduce this one
    pub bond_counter: u32,
    pub nft_counter: u32, // TODO ned to also lock withdrawl of NFTs until its over delete and change to tree counter
    pub nft_base_price: u64, // TODO needs to be loaded

    pub tree_counter: u8,
}