use anchor_lang::prelude::*;

#[account]
pub struct Ibo {
    pub locked: bool, // After being set to true can;t add further lock-ups

    // Fixed rate of conversion between underlying token and liquidity coin
    // Set by the deployer at the start
    pub fixed_exchange_rate: u64,

    // Can be purchased after this date
    pub live_date: i64,

    // Accepted mint address for purchase
    pub stablecoin: Pubkey, // TODO rename to liqudity something

    // Receives provided liquidity, can be this PDA or any specified account
    pub recipient_address: Pubkey,

    // Admin
    pub admin: Pubkey,

    pub lockup_counter: u32, // TODO Can definitaly reduce this one
    pub ticket_counter: u32,
}

impl Ibo {
    pub fn correct_mint(&self, provided_mint: &Pubkey) -> bool {
        return &self.stablecoin == provided_mint;
    }
}
