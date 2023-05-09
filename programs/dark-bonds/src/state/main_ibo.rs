use anchor_lang::prelude::*;

// Deployed only once at a start so has a uniqye PDA
// "ibo_counter"

#[account]
pub struct MainIBO {
    // Counter for all of the IBOs to date
    pub ibo_counter: u32,

    // Applied to non-dark IBOs
    pub master_cut: u64,

    // Admin not sure if needed
    pub admin: Pubkey,
}

impl MainIBO {
    pub fn init_main_ibo(&mut self, admin: &Pubkey, master_cut: &u64) {
        self.admin = *admin;
        self.master_cut = *master_cut;
    }
}
