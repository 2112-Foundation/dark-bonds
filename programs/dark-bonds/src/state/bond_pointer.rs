use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct BondPointer {
    pub bond_address: Pubkey,
}
