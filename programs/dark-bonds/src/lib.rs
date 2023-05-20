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
    pub fn create_ibo(
        ctx: Context<CreateIBO>,
        fixed_exchange_rate: u64,
        live_date: i64,
        end_date: i64,
        swap_cut: u32,
        liquidity_token: Pubkey,
        recipient: Pubkey
    ) -> Result<()> {
        instructions::create_ibo::create_ibo(
            ctx,
            fixed_exchange_rate,
            live_date, // TODO make it so you can't buy bonds prior to it
            end_date,
            swap_cut,
            liquidity_token,
            recipient
        )
    }

    // TODO add payout on maturity only
    pub fn add_lockup(
        ctx: Context<AddLockUp>,
        lockup_duration: i64,
        lockup_apy: f64
    ) -> Result<()> {
        instructions::add_lockup::add_lockup(ctx, lockup_duration, lockup_apy)
    }

    pub fn remove_lockup(ctx: Context<RemoveLockup>) -> Result<()> {
        instructions::remove_lockup::remove_lockup(ctx)
    }

    pub fn add_gate(
        ctx: Context<AddGate>,
        ibo_idx: u32,
        lockup_idx: u32,
        mint_key: Pubkey,
        creator_key: Pubkey,
        master_key: Pubkey
    ) -> Result<()> {
        instructions::add_gate::add_gate(
            ctx,
            ibo_idx,
            lockup_idx,
            mint_key,
            creator_key,
            master_key
        )
    }

    pub fn remove_gate(ctx: Context<RemoveGate>, ibo_idx: u32, lockup_idx: u32) -> Result<()> {
        instructions::remove_gate::remove_gate(ctx, ibo_idx, lockup_idx)
    }

    pub fn lock(
        ctx: Context<Lock>,
        lock_withdraws: bool,
        lock_lockup_addition: bool
    ) -> Result<()> {
        instructions::lock::lock(ctx, lock_withdraws, lock_lockup_addition)
    }

    // Provide liquidity for bonds for a given bond offering
    pub fn buy_bond(
        ctx: Context<BuyBond>,
        lockup_idx: u32,
        ibo_idx: u64,
        liquidity_provided: u64
    ) -> Result<()> {
        instructions::buy_bond::buy_bond(ctx, lockup_idx, ibo_idx, liquidity_provided)
    }

    pub fn buy_bond_gated(
        ctx: Context<GatedBuy>,
        lockup_idx: u32,
        ibo_idx: u64,
        liquidity_provided: u64
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
        bond_idx: u32
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

    pub fn add_tree(ctx: Context<AddTree>, ibo_idx: u32, tree_idx: u8, depth: u8) -> Result<()> {
        instructions::add_tree::add_tree(ctx, ibo_idx, tree_idx, depth)
    }

    pub fn add_vertex0(
        ctx: Context<AddVertex0>,
        ibo_idx: u32,
        tree_idx: u8,
        vertex_idx: u8
    ) -> Result<()> {
        instructions::add_vertex::add_vertex0(ctx, ibo_idx, tree_idx, vertex_idx)
    }

    pub fn add_vertex1(
        ctx: Context<AddVertex1>,
        ibo_idx: u32,
        tree_idx: u8,
        vertex_idx: u8
    ) -> Result<()> {
        instructions::add_vertex::add_vertex1(ctx, ibo_idx, tree_idx, vertex_idx)
    }
}