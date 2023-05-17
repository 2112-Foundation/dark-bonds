use anchor_lang::prelude::*;

#[account]
pub struct Ibo {
    pub lockups_locked: bool, // After being set to true can't add further lock-ups
    pub withdraws_locked: bool, // After being set to true, IBO admin can't withdraw underlying token until end of the sesh

    // Fixed rate of conversion between underlying token and liquidity coin
    // Set by the deployer at the start
    pub fixed_exchange_rate: u64,

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
    pub ticket_counter: u32,
}

impl Ibo {
    pub fn correct_mint(&self, provided_mint: &Pubkey) -> bool {
        return &self.liquidity_token == provided_mint;
    }
}
