use anchor_lang::prelude::*;
use std::time::Duration;

const SECONDS_YEAR: f64 = 31536000.0;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the ticket details
// After that not accessed

#[account]
pub struct LockUp {
    pub period: i64, // In seconds
    pub apy: f64,    // yearly gain for that lockup
}
impl LockUp {
    pub fn get_total_gain(&self, liquidity_provided: u64) -> u64 {
        (liquidity_provided as f64 * self.apy / (SECONDS_YEAR / self.period as f64) / 100.0) as u64
    }

    pub fn get_maturity_stamp(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }
}
