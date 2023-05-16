use anchor_lang::prelude::*;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the ticket details
// After that not accessed

#[account]
pub struct LockUp {
    pub period: i64,       // In seconds
    pub apy: f64,          // yearly gain for that lockup
    pub gate_counter: u32, // TODO check that is zero for normal buy
    pub mature_only: bool, // Will be transfered to the ticket
}

impl LockUp {
    pub fn get_maturity_stamp(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }
}
