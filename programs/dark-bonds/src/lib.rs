use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use errors::*;
pub use instructions::*;
pub use state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod dark_bonds {
    use super::*;

    pub fn create_ibo(ctx: Context<Claim>) -> Result<()> {
        Ok(())
    }

    pub fn buy_bonds(ctx: Context<BuyBond>) -> Result<()> {
        instructions::buy_bond::buy_bond(ctx, 0);
        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::claim(ctx);
        Ok(())
    }

    pub fn set_swap(ctx: Context<Claim>) -> Result<()> {
        Ok(())
    }

    pub fn buy_swap(ctx: Context<Claim>) -> Result<()> {
        Ok(())
    }
}
