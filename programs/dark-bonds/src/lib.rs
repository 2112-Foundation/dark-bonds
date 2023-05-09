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

    pub fn init_ibo_master(ctx: Context<InitIBOMaster>, cut: u64) -> Result<()> {
        instructions::init_ibo_master::init_ibo_master(ctx, cut)
    }

    pub fn create_ibo(
        ctx: Context<CreateIBO>,
        fixed_exchange_rate: u64,
        live_date: i64,
        stablecoin: Pubkey,
    ) -> Result<()> {
        instructions::create_ibo::create_ibo(ctx, fixed_exchange_rate, live_date, stablecoin)
    }

    pub fn buy_bonds(ctx: Context<BuyBond>, liquidity_provided: u64) -> Result<()> {
        instructions::buy_bond::buy_bond(ctx, liquidity_provided)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::claim(ctx)
    }

    pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
        instructions::set_swap::set_swap(ctx, sell_price)
    }

    pub fn buy_swap(ctx: Context<BuySwap>) -> Result<()> {
        instructions::buy_swap::buy_swap(ctx)
    }
}
