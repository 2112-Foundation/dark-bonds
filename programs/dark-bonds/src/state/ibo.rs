use anchor_lang::prelude::*;

#[account]
pub struct IBO {
    // Fixed rate of conversion between underlying SPL and USDC
    // Set by the deployer at the start
    pub exchange_rate: u64,
}
