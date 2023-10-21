use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod common;
pub mod admin;
pub mod user;
pub mod superadmin;
pub use errors::*;
pub use instructions::*;
pub use admin::*;
pub use state::*;
pub use common::*;
pub use user::*;
pub use superadmin::*;

declare_id!("8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV");

#[program]
pub mod dark_bonds {
    use super::*;

    // Super admin functions
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Invoke once at the deployement,sets Ibo counter and recipient
    pub fn init_master(
        ctx: Context<Init>,
        // Admin creation fees
        ibo_creation_fee: u64,
        lockup_fee: u64,
        gate_addition_fee: u64,
        // Cuts
        purchase_cut: u64,
        resale_cut: u64,
        // User fees
        bond_claim_fee: u64,
        bond_purchase_fee: u64,
        bond_split_fee: u64
    ) -> Result<()> {
        superadmin::init_master::init_master(
            ctx,
            ibo_creation_fee,
            lockup_fee,
            gate_addition_fee,
            purchase_cut,
            resale_cut,
            bond_claim_fee,
            bond_purchase_fee,
            bond_split_fee
        )
    }

    // Bond admin functions
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Create a bond offering
    pub fn create_ibo(
        ctx: Context<CreateIBO>,
        description: String,
        link: String,
        fixed_exchange_rate: u64,
        live_date: i64,
        end_date: i64,
        swap_cut: u32,
        liquidity_token: Pubkey,
        recipient: Pubkey
    ) -> Result<()> {
        admin::create_ibo::create_ibo(
            ctx,
            description,
            link,
            fixed_exchange_rate,
            live_date, // TODO make it so you can't buy bonds prior to it
            end_date,
            swap_cut,
            liquidity_token,
            recipient
        )
    }

    // TODO add payout on maturity only
    // This also needs structs. That have
    // Mandatory field
    // - lock-up duration
    // - lock-up APY
    // Optional field
    // - releasse all on maturity
    // - toke cap
    // - start
    // - expiry
    // Need to figure out how the above two ifnluence the mainIBO ones
    // I guess they can be

    pub fn add_lockup(
        ctx: Context<AddLockUp>,
        lockup_duration: i64,
        lockup_apy: f64,
        mature_only: bool,
        purchase_period: PurchasePeriod
    ) -> Result<()> {
        admin::add_lockup::add_lockup(
            ctx,
            lockup_duration,
            lockup_apy as f64,
            mature_only,
            purchase_period
        )
    }

    pub fn remove_lockup(ctx: Context<RemoveLockup>) -> Result<()> {
        admin::remove_lockup::remove_lockup(ctx)
    }

    pub fn update_gates(
        ctx: Context<UpdateGates>,
        _ibo_idx: u32,
        _lockup_idx: u32,
        gates_add: Vec<u32>,
        gates_remove: Vec<u32>
    ) -> Result<()> {
        admin::update_gates::update_gates(ctx, gates_add, gates_remove)
    }

    pub fn add_gate(
        ctx: Context<AddGate>,
        ibo_idx: u32,
        lockup_idx: u32,
        gate_settings: Vec<GateType>
    ) -> Result<()> {
        admin::add_gate::add_gate(ctx, ibo_idx, lockup_idx, gate_settings)
    }

    pub fn remove_gate(
        ctx: Context<RemoveGatedSettings>,
        ibo_idx: u32,
        lockup_idx: u32
    ) -> Result<()> {
        admin::remove_gate::remove_gate(ctx, ibo_idx, lockup_idx)
    }

    pub fn lock(
        ctx: Context<Lock>,
        lock_withdraws: bool,
        lock_lockup_addition: bool
    ) -> Result<()> {
        admin::lock::lock(ctx, lock_withdraws, lock_lockup_addition)
    }

    // USer functions
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Provide liquidity for bonds for a given bond offering
    pub fn buy_bond<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, BuyBond<'info>>,
        lockup_idx: u32,
        ibo_idx: u64,
        liquidity_provided: u64,
        gate_idxs: u32
    ) -> Result<()> {
        user::buy_bond::buy_bond(ctx, lockup_idx, ibo_idx, liquidity_provided, gate_idxs)
    }

    // Claim tokens yielded for that specifc bond bond
    pub fn claim(ctx: Context<Claim>, ibo_address: Pubkey, ibo_idx: u32) -> Result<()> {
        user::claim::claim(ctx, ibo_address, ibo_idx)
    }

    // Split bond bond into multiples
    pub fn split(
        ctx: Context<Split>,
        percent_new: u16,
        ibo_address: Pubkey,
        bond_idx: u32
    ) -> Result<()> {
        user::split::split(ctx, percent_new, ibo_address, bond_idx)
    }

    // Mark bond as purchasable
    pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
        user::set_swap::set_swap(ctx, sell_price)
    }

    // Buy bond advertised for sale
    pub fn buy_swap(ctx: Context<BuySwap>) -> Result<()> {
        user::buy_swap::buy_swap(ctx)
    }

    // NFT stuff for later
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    pub fn add_tree(ctx: Context<AddTree>, ibo_idx: u32, tree_idx: u8, depth: u8) -> Result<()> {
        instructions::add_tree::add_tree(ctx, ibo_idx, tree_idx, depth)
    }

    pub fn add_vertex0(
        ctx: Context<AddVertex0>,
        ibo_idx: u32,
        tree_idx: u8,
        vertex_idx_0: u8
    ) -> Result<()> {
        instructions::add_vertex::add_vertex0(ctx, ibo_idx, tree_idx, vertex_idx_0)
    }

    pub fn add_vertex1(
        ctx: Context<AddVertex1>,
        ibo_idx: u32,
        tree_idx: u8,
        vertex_idx_0: u8,
        vertex_idx_1: u8
    ) -> Result<()> {
        instructions::add_vertex::add_vertex1(ctx, ibo_idx, tree_idx, vertex_idx_0, vertex_idx_1)
    }

    pub fn add_vertex2(
        ctx: Context<AddVertex2>,
        ibo_idx: u32,
        tree_idx: u8,
        vertex_idx_0: u8,
        vertex_idx_1: u8,
        vertex_idx_2: u8
    ) -> Result<()> {
        instructions::add_vertex::add_vertex2(
            ctx,
            ibo_idx,
            tree_idx,
            vertex_idx_0,
            vertex_idx_1,
            vertex_idx_2
        )
    }

    pub fn add_nft_basket2(
        ctx: Context<AddNftBasket2>,
        ibo_idx: u32,
        tree_idx: u8,
        vertex_idx_0: u8,
        vertex_idx_1: u8,
        vertex_idx_2: u8,
        nft_basket_idx: u8
    ) -> Result<()> {
        instructions::add_nft_basket::add_nft_basket2(
            ctx,
            ibo_idx,
            tree_idx,
            vertex_idx_0,
            vertex_idx_1,
            vertex_idx_2,
            nft_basket_idx
        )
    }

    pub fn load_nfts<'a, 'b, 'c, 'd: 'a + 'e, 'e: 'a + 'd>(
        ctx: Context<'a, 'a, 'a, 'd, LoadNfts<'e>>,
        ibo_idx: u32,
        tree_idx: u8,
        vertex_idx_0: u8,
        vertex_idx_1: u8,
        vertex_idx_2: u8,
        nft_basket_idx: u8
    ) -> Result<()> {
        instructions::load_nfts::load_nfts(
            ctx,
            ibo_idx,
            tree_idx,
            vertex_idx_0,
            vertex_idx_1,
            vertex_idx_2,
            nft_basket_idx
        )
    }
}
