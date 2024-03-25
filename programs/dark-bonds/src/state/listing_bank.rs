use anchor_lang::prelude::*;
use crate::common::*;

#[account]
#[derive(Default, Debug)]
pub struct ListingBank {
    pub bump: u8,
    pub state: ListingBankState,
    /** Index of this listings bank */
    pub index: u16,
    pub listings: Vec<Listing>,
    pub swappable_fifo: Vec<u16>,
}

impl ListingBank {
    // Function that
    pub fn has_slots(&mut self) -> bool {
        // Ensure there is enough space
        return self.swappable_fifo.len() > 0 || self.listings.len() <= LISTING_BANK_ENTRIES;
    }

    pub fn add_listing(
        &mut self,
        bank_index: u16,
        blackbox_index: u16,
        sale_price: u64
    ) -> Result<u16> {
        if self.swappable_fifo.len() > 0 {
            // Get the index of the first available slot
            let index = self.swappable_fifo.pop().unwrap() as usize;
            msg!("Pushing to a prior slot [{:?}]", index);
            // Add the listing
            self.listings[index].state = ListingState::Listed;
            self.listings[index].sale_price = sale_price;
            self.listings[index].bank_index = bank_index;
            self.listings[index].blackbox_index = blackbox_index;
            return Ok(index as u16);
        } else {
            // Add the listing

            let listing: Listing = Listing {
                state: ListingState::Listed,
                bank_index,
                blackbox_index,
                sale_price,
            };
            msg!("Writing a new slot [{:?}]", self.listings.len());
            self.listings.push(listing);
            return Ok((self.listings.len() - 1) as u16);
        }
    }
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct Listing {
    /** Points to the bank */
    pub state: ListingState,
    /** Points to the bank */
    pub bank_index: u16,
    /** Points to the blackbox */
    pub blackbox_index: u16,
    /** Price at which the owner is willing to part with it. */
    pub sale_price: u64,
}

#[derive(AnchorSerialize, Eq, AnchorDeserialize, Clone, Debug, PartialEq, Default, Copy)]
pub enum ListingState {
    #[default]
    Listed,
    Swappable,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Default, Copy)]
pub enum ListingBankState {
    #[default]
    Uninitialised,
    Initialised,
}
