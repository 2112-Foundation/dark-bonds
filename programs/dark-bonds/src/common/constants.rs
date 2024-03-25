pub const SECONDS_YEAR: i64 = 31536000;
pub const SECONDS_IN_A_DAY: i64 = 86400;
pub const PURCHASE_CUT: f64 = 5.5; // equivalent to 5%
pub const SCALE: f64 = 1000.0;

// Account sizes
pub const PRE: usize = 8;
pub const LOCKUP_BASE_SIZE: usize = 90;
pub const IBO_BASE_SIZE: usize = 300;

pub const MAX_PDA_SIZE: usize = 10_000;

pub const BOND_BANK_ENTRIES: usize = 310;
pub const LISTING_BANK_ENTRIES: usize = 2000;

// PDA seeds
pub const LOCKUP_SEED: &str = "lockup";
pub const MAIN_SEED: &str = "main";
pub const BOND_SEED: &str = "bond";
pub const IBO_SEED: &str = "ibo";
pub const USER_ACCOUNT_SEED: &str = "user_account";
pub const BOND_POINTER_SEED: &str = "bond_pointer";
pub const GATE_SEED: &str = "gate";
pub const TREE_SEED: &str = "tree";
pub const VERTEX_SEED: &str = "vertex";
pub const NFT_BASKET_SEED: &str = "nft_basket";
pub const IBO_BANK_SEED: &str = "ibo_bank";
