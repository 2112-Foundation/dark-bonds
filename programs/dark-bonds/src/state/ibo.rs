use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

#[account]
pub struct Ibo {
    /** After being set to true, IBO admin can't add further lock-ups.*/
    pub lockups_locked: bool, // After being set to true can't add further lock-ups
    /** After being set to true, IBO admin can't withdraw underlying token until end of the IBO set by end_date */
    pub withdraws_locked: bool,

    // Fixed rate of conversion between underlying token and liquidity coin
    // Set by the deployer at the start
    /** Fixed rate of conversion between underlying token and liquidity coin.
        Set by the IBO deployers at the initalisation of the IBO.
        Allows to bypass innability to add jupiter. */
    pub fixed_exchange_rate: u64,

    // TODO option nto to enable swaps at all?
    pub swap_cut: u64, // in % x 100

    /** Date after which bonds can be purchased.*/
    pub live_date: i64,
    /** Date after which bonds can not be purchased.*/
    pub end_date: i64,
    /** Mint of the token in which bonds will be redeemed.*/
    pub liquidity_token: Pubkey,
    /** Mint of the token which will be used to purchase bonds.*/
    pub underlying_token: Pubkey,
    /** Receives a cut of the provided liquidity token amount.*/
    pub recipient_address: Pubkey, // , can be this PDA or any specified account

    /** Admin of the ibo which can:
     - add/remove gates
     - add/remove lockups
     - change exchange rate
     */
    pub admin: Pubkey,

    /** Total number of indidividual bond option types created for this IBO.*/
    pub lockup_counter: u32, // TODO Can definitaly reduce this one
    /** Total number of bonds issued under this IBO.*/
    pub bond_counter: u32,
    /** Total number of gates which restrict which lock up option can be used to purchase the bond.*/
    pub gate_counter: u32, //

    // Ignore for now
    pub nft_counter: u32, // TODO ned to also lock withdrawl of NFTs until its over delete and change to tree counter
    pub nft_base_price: u64, // TODO needs to be loaded
    pub tree_counter: u8,

    /** Description of the project launching this bond offering */
    pub descriptin: String,
    /** Link to the project launching this offering */
    pub link: String,
}
