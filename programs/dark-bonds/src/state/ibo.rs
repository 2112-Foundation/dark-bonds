use anchor_lang::prelude::*;

#[account]
pub struct IBO {
    // Index of this specific IBO instance
    pub ibo_idx: u32,

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
}

// TODO check in the constraints

impl IBO {
    pub fn correct_mint(&self, provided_mint: &Pubkey) -> bool {
        return &self.stablecoin == provided_mint;
    }

    pub fn new(
        &mut self,
        fixed_exchange_rate: u64,
        live_date: i64,
        stablecoin: Pubkey,
        admin: Pubkey,
    ) {
        self.live_date = live_date;
        self.fixed_exchange_rate = fixed_exchange_rate;
        self.stablecoin = stablecoin;
        self.admin = admin
    }
}
