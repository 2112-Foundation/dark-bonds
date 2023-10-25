use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserAccount {
    pub bond_counter: u16,
}
