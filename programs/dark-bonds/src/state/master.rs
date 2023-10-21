use anchor_lang::prelude::*;

#[account]
pub struct Master {
    /** Counter for all of the IBOs intialised to date.*/
    pub ibo_counter: u64,
    /** Cut take of each bond issuance transaction.*/
    pub master_cut: u64, // Could be just hardcoded it is
    /** Master admin that can.*/
    pub admin: Pubkey, // Not sure what it can do really, withdraw
    /** Receives all the cuts.*/
    pub master_recipient: Pubkey,
    /** Fees for ibo admin */
    pub admin_fees: AdminFees,
    /** Fees for users */
    pub user_fees: UserFees,
    /** Cuts for users */
    pub cuts: Cuts,
}

// Create me a rust struct for selling bond fees in one single struct beneth this line

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct AdminFees {
    /** Fee to create a new bond offering account in SOL.*/
    pub ibo_creation_fee: u64,
    /** Fee to add a new specific instance of lockup type in SOL.*/
    pub lockup_fee: u64,
    /** Fee to add a new gate to this IBO in SOL.*/
    pub gate_addition_fee: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct Cuts {
    /** Cut on top of liquidity in %.*/
    pub purchase_cut: u64,
    /** Cut on top of swap fee set by them in %.*/
    pub resale_cut: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct UserFees {
    /** Fee to claim on earned bond token in SOL.*/
    pub bond_claim_fee: u64,
    /** Fee to purchase a bond in SOL.*/
    pub bond_purchase_fee: u64,
    /** Fee to split a bond in SOL.*/
    pub bond_split_fee: u64,
}
