use anchor_lang::prelude::*;

const SECONDS_YEAR: f64 = 31536000.0;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the ticket details
// After that not accessed

#[account]
pub struct Gate {
    pub mint: Pubkey,
}

impl Gate {
    pub fn get_maturity_stamp(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }
}
