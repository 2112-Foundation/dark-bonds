use anchor_lang::prelude::*;

#[account]
pub struct Ibo {
    pub locked: bool,

    // Fixed rate of conversion between underlying SPL and USDC
    // Set by the deployer at the start
    pub fixed_exchange_rate: u64,

    // Can be purchased after this date
    pub live_date: i64,

    // Accepted mint address for purchase
    pub stablecoin: Pubkey,

    // Receives provided liquidity
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
