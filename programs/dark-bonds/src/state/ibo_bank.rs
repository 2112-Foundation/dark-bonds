use anchor_lang::prelude::*;
use crate::common::*;

#[account]
#[derive(Default, Debug)]
pub struct IboBank {
    /** Bump */
    pub bump: u8,
    /** Index of this bank */
    pub index: u16,
    /** Vector of seeds needed to derive the bond account */
    pub aces: Vec<[u8; 32]>,
}

impl IboBank {
    pub fn has_space(&self) -> bool {
        return self.aces.len() < BOND_BANK_ENTRIES;
    }
    pub fn add_blackbox(&mut self, blackbox: [u8; 32]) {
        self.aces.push(blackbox);
    }
}
