use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod common;
pub mod admin;
pub mod user;
pub mod superadmin;

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

    /** Invoke once only,sets details regarding the fees. */
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

    /** Updates fees and cuts applied to all interactions. */
    pub fn update_fees(
        ctx: Context<UpdateFees>,
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
        superadmin::update_fees::update_fees(
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

    /** Creates a bond offering. */
    pub fn create_ibo(
        ctx: Context<CreateIBO>,
        description: String,
        link: String,
        fixed_exchange_rate: u64,
        live_date: i64,
        end_date: i64,
        swap_cut: u32,
        liquidity_token: Pubkey,
        underlying_token: Pubkey,
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
            underlying_token,
            recipient
        )
    }
    /** Updates existing bond offering. */
    pub fn update_ibo(
        ctx: Context<UpdateIbo>,
        _ibo_idx: u64,
        description: String,
        link: String,
        fixed_exchange_rate: u64,
        live_date: i64,
        end_date: i64,
        swap_cut: u32,
        liquidity_token: Pubkey,
        underlying_token: Pubkey,
        recipient: Pubkey
    ) -> Result<()> {
        admin::update_ibo::update_ibo(
            ctx,
            description,
            link,
            fixed_exchange_rate,
            live_date,
            end_date,
            swap_cut,
            liquidity_token,
            underlying_token,
            recipient
        )
    }

    /** Adds a lock up with a specific duration and APY. */
    pub fn add_lockup(
        ctx: Context<AddLockUp>,
        lockup_duration: i64,
        lockup_apy: u64,
        mature_only: bool,
        limit: u64,
        principal_ratio: u16,
        purchase_period: PurchasePeriod
    ) -> Result<()> {
        admin::add_lockup::add_lockup(
            ctx,
            lockup_duration,
            lockup_apy,
            mature_only,
            limit,
            principal_ratio,
            purchase_period
        )
    }

    /** Removes existing lockup option. */
    pub fn remove_lockup(ctx: Context<RemoveLockup>) -> Result<()> {
        admin::remove_lockup::remove_lockup(ctx)
    }

    /** Updates on the lockup account which gates can be used to purchase bonds under this lockup option. */
    pub fn update_lockup_gates(
        ctx: Context<UpdateGates>,
        gates_add: Vec<u32>,
        gates_remove: Vec<u32>
    ) -> Result<()> {
        admin::update_lockup_gates::update_lockup_gates(ctx, gates_add, gates_remove)
    }

    /** Updates exchange rate between liquidity and underlying tokens*/
    pub fn update_rate(ctx: Context<UpdateRate>, _ibo_idx: u64, new_rate: u64) -> Result<()> {
        admin::update_rate::update_rate(ctx, new_rate)
    }

    /** Adds a gate which can be used to restrict access to a specific lockup*/
    pub fn add_gate(ctx: Context<AddGate>, gate_settings: Vec<GateType>) -> Result<()> {
        admin::add_gate::add_gate(ctx, gate_settings)
    }

    /** Removes an existing gate*/
    pub fn remove_gate(ctx: Context<RemoveGatedSettings>) -> Result<()> {
        admin::remove_gate::remove_gate(ctx)
    }

    pub fn lock(ctx: Context<Lock>, new_actions: PermittedAction) -> Result<()> {
        admin::lock::lock(ctx, new_actions)
    }

    // USer functions
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /** User purchases bond from an IBO by supplying liqyuidity token. */
    pub fn buy_bond<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, BuyBond<'info>>,
        liquidity_provided: u64,
        gate_idxs: u32
    ) -> Result<()> {
        user::buy_bond::buy_bond(ctx, liquidity_provided, gate_idxs)
    }

    /** Claim tokens yielded for that specifc bond bond. */
    pub fn claim(ctx: Context<Claim>, ibo_address: Pubkey, bond_idx: u32) -> Result<()> {
        user::claim::claim(ctx, ibo_address, bond_idx)
    }

    /** Splits a bond into two distinct bonds, with specified ratio between the bonds. */
    pub fn split(
        ctx: Context<Split>,
        percent_new: u16,
        ibo_address: Pubkey,
        bond_idx: u32
    ) -> Result<()> {
        user::split::split(ctx, percent_new, ibo_address, bond_idx)
    }

    /** Marks bond as reselablke on the secondary market */
    pub fn set_swap(ctx: Context<SetSwap>, sell_price: u64) -> Result<()> {
        user::set_swap::set_swap(ctx, sell_price)
    }

    /** Buy bond advertised for sale on the secondary market */
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
