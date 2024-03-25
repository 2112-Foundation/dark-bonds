use anchor_lang::prelude::*;
use crate::common::*;
use crate::common::errors::BondErrors;

#[account]
#[derive(Default)]
pub struct UserAccount {
    pub bond_counter: u16,
    /** Counter for all of the blackboxes owned by this user. */
    pub total_owned: Vec<BondPointer>,
    /** Counter for all of the blackboxes offered on sale by this user. */
    pub total_listed: Vec<BondPointer>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Default, Debug, PartialEq, Eq)]
pub struct BondPointer {
    pub bank_index: u16,
    pub blackbox_index: u16,
}

impl UserAccount {
    pub fn add_total_listed(&mut self, bank_index: u16, blackbox_index: u16) {
        self.total_listed.push(BondPointer {
            bank_index,
            blackbox_index,
        });
    }

    pub fn remove_total_listed(&mut self, bank_index: u16, blackbox_index: u16) -> Result<()> {
        let blackbox_pointer = BondPointer {
            bank_index,
            blackbox_index,
        };

        let index = self.total_listed
            .iter()
            .position(|&x| x == blackbox_pointer)
            .ok_or(BondErrors::ToDo)?;

        self.total_listed.remove(index);
        Ok(())
    }

    pub fn add_total_owned(&mut self, bank_index: u16, blackbox_index: u16) {
        self.total_owned.push(BondPointer {
            bank_index,
            blackbox_index,
        });
    }

    pub fn remove_total_owned(&mut self, bank_index: u16, blackbox_index: u16) -> Result<()> {
        let blackbox_pointer = BondPointer {
            bank_index,
            blackbox_index,
        };
        let index = self.total_owned
            .iter()
            .position(|&x| x == blackbox_pointer)
            .ok_or(BondErrors::ToDo)?;
        self.total_owned.remove(index);
        Ok(())
    }
}
