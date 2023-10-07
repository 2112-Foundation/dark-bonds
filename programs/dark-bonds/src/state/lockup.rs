use anchor_lang::prelude::*;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the bond details
// After that not accessed

#[account]
pub struct Lockup {
    /** Minimum lockup period in seconds.*/
    pub period: i64,
    /** Yearly APY for this lockup.*/
    pub apy: i64,
    /** Pointers to the gates that will allow this lock up to be used.*/
    pub gates: Vec<u32>, // TODO check that is zero for normal buy
    /** Can only withdraw all at once at the end.*/
    pub mature_only: bool,
    /** Total amount to be sold under this lock-up option.*/
    pub limit: u64,
    /** Optional period that allows to be purchased outside of the main timing.*/
    pub purchase_period: PurchasePeriod,
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

    pub fn add_gate(&mut self, gate: u32) {
        self.gates.push(gate);

        // TODO may need to recalculate account size
    }

    pub fn remove_gate(&mut self, gate: u32) {
        // FInd what index gate is within gates and if it exists remove it
        let idx = self.gates
            .iter()
            .position(|&r| r == gate)
            .unwrap();

        self.gates.swap_remove(idx);

        // TODO may need to recalculate account size
    }
}
