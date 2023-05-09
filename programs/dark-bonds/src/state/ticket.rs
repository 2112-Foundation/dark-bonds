use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

// Set to zero for testing
const SECONDS_DAY: i64 = 86_400;

#[account]
pub struct Ticket {
    // Owner info
    pub owner: Pubkey,

    // Swap: if non zero someone can exucte it with a transfer otherwise not for sale
    pub swap_price: f64,
    // Subdivide
    pub total_claimable: u64, // Fixed

    // Payouts
    // Maturity date
    pub maturity_date: i64, // Fixed
    pub last_claimed: i64,
    pub bond_start: i64,
    // Total DARK left (is subtracted each time) either PDA owns balance or withdrawn from a pool
}

impl Ticket {
    // Move SPL over and

    // Create new bond ticket
    pub fn new(&mut self, owner: Pubkey, maturity_date: i64, total_gains: u64) {
        self.maturity_date = maturity_date;
        self.owner = owner;
        self.bond_start = Clock::get().unwrap().unix_timestamp;
        self.total_claimable = total_gains;
    }

    // Update last claimed
    pub fn update_claim_date(&mut self) {
        self.last_claimed = Clock::get().unwrap().unix_timestamp;
    }

    // A day has passed since last withdraw for this bond ticket
    pub fn time_elapsed(&self) -> bool {
        return Clock::get().unwrap().unix_timestamp > self.last_claimed + SECONDS_DAY;
    }

    // How much can be claimed on this particular call absed on time elsapsed since
    // last time and total that is to be claimable
    pub fn claim_amount(&self) -> u64 {
        return ((self.last_claimed - Clock::get().unwrap().unix_timestamp)
            / (self.maturity_date - self.bond_start)) as u64
            * self.total_claimable;
    }
}
