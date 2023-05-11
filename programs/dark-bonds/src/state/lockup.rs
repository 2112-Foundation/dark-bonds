use anchor_lang::prelude::*;

const SECONDS_YEAR: f64 = 31536000.0;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the ticket details
// After that not accessed

#[account]
pub struct LockUp {
    pub period: i64, // In seconds
    pub apy: f64,    // yearly gain for that lockup
}

//' TODO make it a funcion in other filke
impl LockUp {
    // pub fn get_total_gain(&self, initial_input: u64) -> u64 {
    //     // Convert APY, time and initial input to f64
    //     let apy: f64 = self.apy / 100.0;
    //     let time_in_years: f64 = self.period as f64 / SECONDS_YEAR;
    //     let initial_input: f64 = initial_input as f64;

    //     msg!("\ninitial_inputpy: {:?}", initial_input);
    //     msg!("apy: {:?}", apy);
    //     msg!("time_in_years: {:?}", time_in_years);
    //     msg!("self.period : {:?}", self.period);
    //     msg!("SECONDS_YEAR: {:?}", SECONDS_YEAR);

    //     // Calculate total value using compound interest formula
    //     let total_value: f64 = initial_input * apy.powf(time_in_years);
    //     msg!("total_value: {:?}", total_value);

    //     // Total earnings is the total value minus the initial input
    //     let total_earnings: f64 = total_value - initial_input;
    //     msg!("total_earnings: {:?}", total_earnings);
    //     msg!("yearly earnings: {:?}", total_earnings);

    //     total_earnings as u64
    // }

    pub fn get_maturity_stamp(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }
}
