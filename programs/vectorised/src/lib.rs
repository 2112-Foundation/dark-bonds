use anchor_lang::prelude::*;
// use array_init::array_init;

declare_id!("457eHNDfL1YTWcGFrdksApV4bo961zBuKvsnEhz16ev3");

#[program]
pub mod vectorised {
    use super::*;
    pub fn init(ctx: Context<Init>) -> Result<()> {
        // instructions::init::init(ctx)
        Ok(())
    }
}

#[account]
pub struct NftBasket {
    fill_idx: usize,
    data: Vec<NftEntry>, //; 300],
}

#[derive(Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct Pointer {
    address: Pubkey,
    taken: bool,
}

#[account]
pub struct Branch {
    end: bool,
    data: Vec<Pointer>, //; 300],
}

impl NftBasket {
    pub fn all_taken(&self) -> bool {
        for entry in self.data.iter() {
            if entry.taken {
                return true;
            }
        }
        false
    }

    pub fn add_entry(&mut self, nft_address: &Pubkey) {
        self.data[self.fill_idx].address = *nft_address;
        self.data[self.fill_idx].taken = false;
        self.fill_idx += 1;
    }
}

#[derive(Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct NftEntry {
    pub address: Pubkey,
    pub taken: bool,
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
}