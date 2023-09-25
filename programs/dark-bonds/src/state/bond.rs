use anchor_lang::prelude::*;

// Set to zero for testing
const SECONDS_DAY: i64 = 86_400;

#[account]
pub struct Bond {
    /* Public key of the owner that can sell/split this bond.*/
    pub owner: Pubkey,
    /* Index of the bonc_counter at the ibo state account at the instance this bond was created.*/
    pub idx: u32,
    /*  Swap: if non zero someone can exucte it with a transfer otherwise not for sale. Exchange using underlying liqudiity token.*/
    pub swap_price: u64,
    /* Total amount that can be made at maturity.*/
    pub total_claimable: u64, // Fixed
    /* Data in seconds since the epoch when full bond value can be withdrawn.*/
    pub maturity_date: i64, // Fixed
    /* Last redemption date in seconds since the epoch.*/
    pub last_claimed: i64,
    /* Bond creation date in seconds since the epoch.*/
    pub bond_start: i64,
    /* Redemption possible only once full maturity is reached.*/
    pub mature_only: bool, // Set based on lockup type
}

impl Bond {
    pub fn new(
        &mut self,
        owner: Pubkey,
        maturity_date: i64,
        total_gains: u64,
        mature_only: bool,
        idx: u32
    ) {
        self.maturity_date = maturity_date;
        self.owner = owner;
        self.bond_start = Clock::get().unwrap().unix_timestamp;
        self.last_claimed = self.bond_start;
        self.total_claimable = total_gains;
        self.mature_only = mature_only;
        self.idx = idx;
    }

    // Update last claimed
    pub fn update_claim_date(&mut self) {
        self.last_claimed = Clock::get().unwrap().unix_timestamp;
    }

    // A day has passed since last withdraw for this bond bond
    pub fn time_elapsed(&self) -> bool {
        return Clock::get().unwrap().unix_timestamp > self.last_claimed + SECONDS_DAY;
    }

    // How much can be claimed on this particular call absed on time elsapsed since
    // last time and total that is to be claimable
    pub fn claim_amount(&self) -> u64 {
        // Need to calculate time since last claim
        let time_elapsed: i64 = Clock::get().unwrap().unix_timestamp - self.last_claimed;
        msg!("time_elapsed: {:?}", time_elapsed);

        // Need to work out total time from start to maturity
        let total_time: i64 = self.maturity_date - self.bond_start;
        msg!("total_time: {:?}", total_time);

        // Need work out the ratio of total time
        let ratio: f64 = (time_elapsed as f64) / (total_time as f64);
        msg!("ratio: {:?}", ratio);

        msg!("total_claimable: {:?}", self.total_claimable);
        msg!("claiming this time: {:?}", ratio * (self.total_claimable as f64));

        // Multiplly ratio by total that is to gain
        return (ratio * (self.total_claimable as f64)) as u64;
    }
}

// 1683842

// TODO: Need to standardise input to seconds or miliseconds
