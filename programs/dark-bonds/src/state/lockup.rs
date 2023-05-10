use anchor_lang::prelude::*;
use std::time::Duration;

const SECONDS_YEAR: i64 = 31536000;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the ticket
// After that not accessed

#[account]
pub struct LockUp {
    pub period: i64, // In seconds
    pub apy: f64,    // yearly gain for that lockup
}
impl LockUp {
    pub fn get_total_gain(&self, liquidity_provided: u64) -> u64 {
        return (self.apy * (self.period / SECONDS_YEAR) as f64) as u64 * liquidity_provided;
    }

    pub fn get_maturity_stamp(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }
}
