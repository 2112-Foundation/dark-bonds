use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use errors::*;
pub use instructions::*;
pub use state::*;

declare_id!("H7zcGXtV7Fo1JkhxJ4hao7ZkLpAqzBTkQySAUbVxnLj7");

#[program]
pub mod dark_bonds {
    use super::*;

    // Invoke once at the deployement,sets Ibo counter and recipient
    pub fn init(ctx: Context<Init>) -> Result<()> {
        instructions::init::init(ctx)
    }

    // Create a bond offering
    // TODO ADD WITHDRFAW THIS OWN
    pub fn create_ibo(
        ctx: Context<CreateIBO>,
        fixed_exchange_rate: u64,
        live_date: i64,
        stablecoin: Pubkey,
        recipient: Pubkey,
    ) -> Result<()> {
        instructions::create_ibo::create_ibo(
            ctx,
            fixed_exchange_rate,
            live_date,
            stablecoin,
            recipient,
        )
    }

    pub fn add_lockup(
        ctx: Context<AddLockUp>,
        lock_up_duration: i64,
        lock_up_apy: f64,
    ) -> Result<()> {
        instructions::add_lockup::add_lockup(ctx, lock_up_duration, lock_up_apy)
    }

    pub fn add_gate(
        ctx: Context<AddGate>,
        mint_key: Pubkey,
        creator_key: Pubkey,
        master_key: Pubkey,
    ) -> Result<()> {
        instructions::add_lockup::add_gate(ctx, mint_key, creator_key, master_key)
    }

    pub fn lock(ctx: Context<Lock>) -> Result<()> {
        instructions::lock::lock(ctx)
    }

    // Provide liquidity for bonds for a given bond offering
    pub fn buy_bonds(
        ctx: Context<BuyBond>,
        lockup_idx: u32,
        ibo_idx: u64,
        liquidity_provided: u64,
    ) -> Result<()> {
        instructions::buy_bond::buy_bond(ctx, lockup_idx, ibo_idx, liquidity_provided)
    }

    pub fn gated_buy(
        ctx: Context<GatedBuy>,
        lockup_idx: u32,
        ibo_idx: u64,
        liquidity_provided: u64,
    ) -> Result<()> {
        instructions::gated_purchase::gated_buy_bond(ctx, lockup_idx, ibo_idx, liquidity_provided)
    }

    // Claim tokens yielded for that specifc bond ticket
    pub fn claim(ctx: Context<Claim>, ibo_address: Pubkey, ibo_idx: u32) -> Result<()> {
        instructions::claim::claim(ctx, ibo_address, ibo_idx)
    }

    // Split bond ticket into multiples
    pub fn split(
        ctx: Context<Split>,
        percent_new: u16,
        ibo_address: Pubkey,
        ticket_idx: u32,
    ) -> Result<()> {
        instructions::split::split(ctx, percent_new, ibo_address, ticket_idx)
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
