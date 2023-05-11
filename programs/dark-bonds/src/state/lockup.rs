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
    // pub fn get_total_gain(&self, liquidity_provided: u64) -> u64 {
    //     msg!("liquidity_provided: {:?}", liquidity_provided);
    //     let mut input = liquidity_provided * 100;
    //     let new_balance = input as f64 * self.apy;
    //     msg!("new_balance after a year: {:?}", new_balance / 10000.0);
    //     let yearly_gain = new_balance - input as f64;
    //     msg!("yearly_gain: {:?}", yearly_gain / 10000.0);
    //     let total_gain: f64 = yearly_gain * self.period as f64 / yearly_gain / 1000000.0;
    //     msg!("total_gain: {:?}\n", total_gain);
    //     return total_gain as u64;
    //     // 7
    // }

    pub fn get_total_gain(&self, initial_input: u64) -> u64 {
        // Convert APY, time and initial input to f64
        let apy: f64 = self.apy / 100.0;
        let time_in_years: f64 = self.period as f64 / SECONDS_YEAR;
        let initial_input: f64 = initial_input as f64;

        msg!("\ninitial_inputpy: {:?}", initial_input);
        msg!("apy: {:?}", apy);
        msg!("time_in_years: {:?}", time_in_years);
        msg!("self.period : {:?}", self.period);
        msg!("SECONDS_YEAR: {:?}", SECONDS_YEAR);

        // Calculate total value using compound interest formula
        let total_value = initial_input * apy.powf(time_in_years);

        msg!("total_value: {:?}", total_value);

        // Total earnings is the total value minus the initial input
        let total_earnings = total_value - initial_input;
        msg!("total_earnings: {:?}", total_earnings);
        // msg!("yearly earnings: {:?}", total_earnings);

        // Ensure we don't round down to zero if total earnings are less than 1
        if total_earnings < 1.0 {
            return 0;
        }

        total_earnings as u64
        // 7
    }
    // pub fn get_total_gain(&self, liquidity_provided: u64) -> u64 {
    //     msg!("liquidity_provided: {:?}", liquidity_provided);
    //     let input = liquidity_provided as f64;

    //     // Calculate yearly interest. Assuming apy is given as a percentage.
    //     let yearly_gain = input * (self.apy / 100.0);
    //     msg!("yearly_gain: {:?}", yearly_gain);

    //     // Calculate total gain over the entire period. Assuming period is in years.
    //     let total_gain = yearly_gain * self.period as f64;
    //     msg!("total_gain: {:?}", total_gain);

    //     // return the total gain as u64
    //     // return total_gain as u64;
    //     8
    // }

    pub fn get_maturity_stamp(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }
}
