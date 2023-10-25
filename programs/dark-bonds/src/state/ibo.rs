use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

#[account]
pub struct Ibo {
    // /** After being set to true, IBO admin can't add further lock-ups.*/
    // pub lockups_locked: bool, // After being set to true can't add further lock-ups
    // /** After being set to true, IBO admin can't withdraw underlying token until end of the IBO set by end_date */
    // pub withdraws_locked: bool,

    /** All the different features that can be locked (once!) by the admin to make suers have more confidence */
    pub actions: PermittedAction,

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
    /** Receives a cut of the provided liquidity token amount. Not an ATA.*/
    pub recipient_address: Pubkey,

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct PermittedAction {
    /** After being set to true, IBO admin can't withdraw underlying token until end of the IBO set by end_date */
    pub admin_withdraws: bool, // Can withrdraw after it ends
    /** Can't add or remove gates*/
    pub gate_addition: bool,
    /** After being set to true, IBO admin can't withdraw underlying token until end of the IBO set by end_date */
    pub lockup_addition: bool,
    /** Can not change exchange rate set between underlying an dliquidity token*/
    pub exchange_rate_change: bool,
    /** Can't change when the main IBO deadline will be */
    pub end_date_change: bool, // could be so you can extend it only.
    /** Can't change when the IBO will go live */
    pub live_date_change: bool,
    /** Can't update the admin cut charged on the secodnary market */
    pub swap_cut_change: bool,
    /** Can't update the ibo description */
    pub description_change: bool,
    /** Can't update the link pointer */
    pub link_change: bool,
}

// Write me an implementation to the struct PermitedAction taht sets each of them to true
impl PermittedAction {
    pub fn new() -> Self {
        Self {
            admin_withdraws: true,
            gate_addition: true,
            lockup_addition: true,
            exchange_rate_change: true,
            end_date_change: true,
            live_date_change: true,
            swap_cut_change: true,
            description_change: true,
            link_change: true,
        }
    }

    /** Only updates if the field is set to true. You can only restrict existing functionality. */
    pub fn update_permissions(&mut self, new_config: &PermittedAction) {
        if self.admin_withdraws {
            self.admin_withdraws = new_config.admin_withdraws;
        }
        if self.gate_addition {
            self.gate_addition = new_config.gate_addition;
        }
        if self.lockup_addition {
            self.lockup_addition = new_config.lockup_addition;
        }
        if self.exchange_rate_change {
            self.exchange_rate_change = new_config.exchange_rate_change;
        }
        if self.end_date_change {
            self.end_date_change = new_config.end_date_change;
        }
        if self.live_date_change {
            self.live_date_change = new_config.live_date_change;
        }
        if self.swap_cut_change {
            self.swap_cut_change = new_config.swap_cut_change;
        }
        if self.description_change {
            self.description_change = new_config.description_change;
        }
        if self.link_change {
            self.link_change = new_config.link_change;
        }
    }
}
