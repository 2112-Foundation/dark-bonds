use anchor_lang::prelude::*;
use crate::errors::errors::ErrorCode;
use crate::common::*;

#[account]
pub struct Lockup {
    /** Minimum lockup period in seconds.*/
    pub period: i64,
    /** Yearly APY for this lockup. As it is f64 disguised as u64 due to solita, need to divide by 1000*/
    pub apy: u64,
    /** Pointers to the gates that will allow this lockup to be used.*/
    pub gates: Vec<u32>,
    /** Can only withdraw all at once at the end.*/
    pub mature_only: bool,
    /** Total amount to be sold under this lock-up option.*/
    pub limit: Option<u64>,
    /** Optional period that allows to be purchased outside of the main timing.*/
    pub purchase_period: PurchasePeriod,
    /** If the tokens are unlocked linearly or exponentially.*/
    pub unlock: UnlockType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum UnlockType {
    DUdd,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum PurchasePeriod {
    SameAsMainIbo,
    /** First time when this lock-up can be used.*/
    LockupPurchaseStart {
        start: i64,
    },
    /** Last time when this lock-up can be used.*/
    LockupPurchaseEnd {
        end: i64,
    },
    /** First and last time when this lock-up can be used.*/
    LockupPurchaseCombined {
        start: i64,
        end: i64,
    },
}

impl Lockup {
    /** Creates a unix since epoch value for when the bond will fully mature.*/
    pub fn compute_bond_completion_date(&self) -> i64 {
        return Clock::get().unwrap().unix_timestamp + self.period;
    }

    /** Checks whether there are any tokens left still under this lockup.*/
    pub fn tokens_left(&self, bond_purchase_amount: u64) -> Result<bool> {
        return match self.limit {
            Some(limit) => {
                require!(limit >= bond_purchase_amount, ErrorCode::LockupLimitExceeded);
                Ok(true)
            }
            None => Ok(true),
        };
    }

    /**Checks that sale period is on for both IBO and Lockup.*/
    pub fn within_sale(&self, ibo_start: i64, ibo_end: i64) -> bool {
        let time_now = Clock::get().unwrap().unix_timestamp;

        // Get definite start time
        let definite_start: i64;
        let definite_end: i64;
        match self.purchase_period {
            PurchasePeriod::SameAsMainIbo => {
                definite_start = ibo_start;
                definite_end = ibo_end;
            }
            PurchasePeriod::LockupPurchaseStart { start } => {
                definite_start = start;
                definite_end = ibo_end;
            }
            PurchasePeriod::LockupPurchaseEnd { end } => {
                definite_end = end;
                definite_start = ibo_start;
            }
            PurchasePeriod::LockupPurchaseCombined { start, end } => {
                definite_start = start;
                definite_end = end;
            }
        }
        time_now < definite_start || time_now > definite_end
    }

    /** Adds a gate that can be used with this lock-up.*/
    pub fn add_gate(&mut self, gate: u32) {
        self.gates.push(gate);
        // TODO may need to recalculate account size
    }

    /** Removes a gate that can be used with this lock-up.*/
    pub fn remove_gate(&mut self, gate: u32) {
        // FInd what index gate is within gates and if it exists remove it
        let idx = self.gates
            .iter()
            .position(|&r| r == gate)
            .unwrap();

        self.gates.swap_remove(idx);

        // TODO may need to recalculate account size
    }

    /** Calculates how much bond move to the bond's PDA's token account */
    pub fn compounded_amount(&self, bond_starting_amount: u64) -> Result<u64> {
        let apy: f64 = (self.apy as f64) / 100.0 / SCALE;
        let year_elapsed: f64 = (self.period as f64) / (SECONDS_YEAR as f64);

        // Calculate compounded amount
        let compounded: f64 = (bond_starting_amount as f64) * (1.0 + apy).powf(year_elapsed);

        // println!("compounded : {:?}s", compounded);

        // Rounding instead of truncating
        Ok(compounded.round() as u64)
    }
}
