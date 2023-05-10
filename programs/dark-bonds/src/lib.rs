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

    // Invoke once at the deployement,sets IBO counter and recipient
    pub fn init(ctx: Context<Init>) -> Result<()> {
        instructions::init::init(ctx)
    }

    // Create a bond offering
    pub fn create_ibo(
        ctx: Context<CreateIBO>,
        fixed_exchange_rate: u64,
        live_date: i64,
        stablecoin: Pubkey,
    ) -> Result<()> {
        instructions::create_ibo::create_ibo(ctx, fixed_exchange_rate, live_date, stablecoin)
    }

    pub fn add_lockup(
        ctx: Context<AddLockUp>,
        lock_up_duration: i64,
        lock_up_apy: f64,
    ) -> Result<()> {
        instructions::add_lockup::add_lockup(ctx, lock_up_duration, lock_up_apy)
    }

    // Provide liquidity for bonds for a given bond offering
    pub fn buy_bonds(ctx: Context<BuyBond>, liquidity_provided: u64) -> Result<()> {
        instructions::buy_bond::buy_bond(ctx, liquidity_provided)
    }

    // Claim tokens yielded for that specifc bond ticket
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::claim(ctx)
    }

    // Split bond ticket into multiples
    pub fn split(ctx: Context<Split>, sell_price: u64) -> Result<()> {
        instructions::split::split(ctx, sell_price)
    }

    // Join several bonds into one
    pub fn consolidate(ctx: Context<Consolidate>, sell_price: u64) -> Result<()> {
        instructions::consolidate::consolidate(ctx, sell_price)
    }

    // Mark bond as purchasable
    pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
        instructions::set_swap::set_swap(ctx, sell_price)
    }

    // Buy bond advertised for sale
    pub fn buy_swap(ctx: Context<BuySwap>) -> Result<()> {
        instructions::buy_swap::buy_swap(ctx)
    }
}
