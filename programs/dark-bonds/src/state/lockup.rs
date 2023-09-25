use anchor_lang::prelude::*;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the bond details
// After that not accessed

#[account]
pub struct Lockup {
    /** Minimum lockup period in seconds. */
    pub period: i64,
    /** Yearly APY for this lockup */
    pub apy: f64,
    /** Pointer to the gate that will allow this lock up to be used */
    pub gate_counter: u32, // TODO check that is zero for normal buy
    /** Can only withdraw all at once at the end */
    pub mature_only: bool,
}

impl Lockup {
    pub fn get_maturity_stamp(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }
}
