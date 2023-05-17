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
        liquidity_token: Pubkey,
        recipient: Pubkey,
    ) -> Result<()> {
        instructions::create_ibo::create_ibo(
            ctx,
            fixed_exchange_rate,
            live_date,
            liquidity_token,
            recipient,
        )
    }

    pub fn add_lockup(
        ctx: Context<AddLockUp>,
        lockup_duration: i64,
        lockup_apy: f64,
    ) -> Result<()> {
        instructions::add_lockup::add_lockup(ctx, lockup_duration, lockup_apy)
    }

    pub fn add_gate(
        ctx: Context<AddGate>,
        ibo_idx: u32,
        lockup_idx: u32,
        mint_key: Pubkey,
        creator_key: Pubkey,
        master_key: Pubkey,
    ) -> Result<()> {
        instructions::add_lockup::add_gate(
            ctx,
            ibo_idx,
            lockup_idx,
            mint_key,
            creator_key,
            master_key,
        )
    }

    pub fn lock(ctx: Context<Lock>) -> Result<()> {
        instructions::lock::lock(ctx)
    }

    // Provide liquidity for bonds for a given bond offering
    pub fn buy_bond(
        ctx: Context<BuyBond>,
        lockup_idx: u32,
        ibo_idx: u64,
        liquidity_provided: u64,
    ) -> Result<()> {
        instructions::buy_bond::buy_bond(ctx, lockup_idx, ibo_idx, liquidity_provided)
    }

    pub fn buy_bond_gated(
        ctx: Context<GatedBuy>,
        lockup_idx: u32,
        ibo_idx: u64,
        liquidity_provided: u64,
    ) -> Result<()> {
        instructions::buy_bond_gated::buy_bond_gated(ctx, lockup_idx, ibo_idx, liquidity_provided)
    }

    // Claim tokens yielded for that specifc bond bond
    pub fn claim(ctx: Context<Claim>, ibo_address: Pubkey, ibo_idx: u32) -> Result<()> {
        instructions::claim::claim(ctx, ibo_address, ibo_idx)
    }

    // Split bond bond into multiples
    pub fn split(
        ctx: Context<Split>,
        percent_new: u16,
        ibo_address: Pubkey,
        bond_idx: u32,
    ) -> Result<()> {
        instructions::split::split(ctx, percent_new, ibo_address, bond_idx)
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
