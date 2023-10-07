use anchor_lang::prelude::*;
use crate::errors::errors::ErrorCode;
use anchor_spl::token::{ Mint, Token, TokenAccount };
use mpl_token_metadata::accounts::Metadata;

#[account]
#[derive(PartialEq, Eq)]
pub struct Gate {
    /** Type of gate_settings.*/
    pub gate_settings: Vec<GateType>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Debug, PartialEq, Eq)]
pub enum GateType {
    /** Verification via NFT membership.*/
    Collection {
        gate: CollectionType,
    },
    /** Verification via SPL ownership.*/
    Spl {
        gate: SplType,
    },
}

impl GateType {
    pub fn account_drop(&self) -> usize {
        match self {
            GateType::Collection { .. } => 3, // for CollectionType
            GateType::Spl { .. } => 2, // for SplType
        }
    }
}

pub trait Verifiable<'a> {
    type Args;
    fn verify(&self, owner: &Pubkey, args: Self::Args) -> Result<bool>;
}
impl<'a> Verifiable<'a> for GateType {
    type Args = Vec<AccountInfo<'a>>;
    fn verify(&self, owner: &Pubkey, args: Self::Args) -> Result<bool> {
        match self {
            GateType::Collection { gate } => gate.verify(owner, args),
            GateType::Spl { gate } => gate.verify(owner, args),
        }
    }
}
impl<'a> Verifiable<'a> for CollectionType {
    type Args = Vec<AccountInfo<'a>>;

    fn verify(&self, owner: &Pubkey, _args: Self::Args) -> Result<bool> {
        // verify based on membership to an NFT community
        // msg!("\n\nCollection gate_settings");
        msg!("Provided {:?} accounts.", _args.len());

        if _args.len() < 3 {
            msg!("Not enough accounts provided. At least 3 required.");
            return Err(ErrorCode::GateCollectionInsufficientAccounts.into());
        }

        let account1: &AccountInfo<'_> = &_args[0];
        let account2: &AccountInfo<'_> = &_args[1];
        let account3: &AccountInfo<'_> = &_args[2];

        // Assert there is enough accounts
        let nft_metadata: Metadata = Metadata::try_from(account1)?;
        msg!("Extarcted metadata");

        // Ensure caller owns provided nft mint
        let nft_mint: Account<Mint> = Account::try_from(account2)?;
        msg!("Extracted NFT mint");

        // Get token account
        let nft_token_account: Account<TokenAccount> = Account::try_from(account3)?;
        msg!("Extarcted nft token account");

        // Caller is the owner of the nft
        require!(&nft_token_account.owner == owner, ErrorCode::GateCollectionInvalidOwner);

        // Token accout is for that particular  mint
        require!(
            &nft_token_account.mint == &nft_mint.key(),
            ErrorCode::GateCollectionInvalidTokenAccount
        );

        // Nft metadta matches the nft mint
        msg!("Mint from the metadata provided: {:?}", nft_metadata.mint);
        // msg!("Provided NFT mint: {:?}", nft_mint.key());

        // Ensure mint in the metadata matches provided mint
        require!(nft_metadata.mint == nft_mint.key(), ErrorCode::GateCollectionInvalidNftMetadata);

        let temp = nft_metadata.collection.unwrap();

        // msg!("\nmaster mint stored in class: {:?}", self.master_mint);
        // msg!("metadata mint stored in class: {:?}", self.metadata);
        // msg!("nft_metadata. colection details: {:?} ", nft_metadata.collection_details);
        // msg!("nft_metadata. colection: {:?} ", temp.key);

        // Ensure daddy mint matches one inside nft metadata
        require!(self.master_mint == temp.key, ErrorCode::GateCollectionNftNotFromCollection);

        // Ensure caller owns provided nft mint
        msg!("verified collection gate_settings");
        Ok(true)
    }
}
impl<'a> Verifiable<'a> for SplType {
    type Args = Vec<AccountInfo<'a>>;
    fn verify(&self, owner: &Pubkey, _args: Self::Args) -> Result<bool> {
        msg!("\n\nSPL gate_settings");
        msg!("Provided {:?} accounts.", _args.len());
        if _args.len() < 2 {
            msg!("Not enough accounts provided. At least 2 required.");
            return Err(ErrorCode::GateSplInsufficientAccounts.into());
        }

        let account1: &AccountInfo<'_> = &_args[0];
        let account2: &AccountInfo<'_> = &_args[1];

        // Mint mathes the one stored
        let mint: Account<Mint> = Account::try_from(account1)?;
        require!(&mint.key() == &self.spl_mint, ErrorCode::GateSplIncorrectMint);

        // Token account derived from this mint
        let spl_token_account: Account<TokenAccount> = Account::try_from(account2)?;
        require!(&spl_token_account.mint == &mint.key(), ErrorCode::GateSplInvalidTokenAccount);

        // User owns provieded token account
        require!(&spl_token_account.owner == owner, ErrorCode::GateSplInvalidOwner);

        // User has enough tokens
        require!(
            spl_token_account.amount > self.minimum_ownership,
            ErrorCode::GateSplCallerNotEnoughToken
        );

        // msg!("User has: {:?}", spl_token_account.amount);
        // msg!("User passed SPL verication");

        msg!("verified SPL gate_settings");

        Ok(true)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Debug, PartialEq, Eq)]
pub struct CollectionType {
    pub metadata: Pubkey,
    pub master_mint: Pubkey,
    pub creator: Pubkey,
}

impl CollectionType {
    pub fn new(metadata: &Pubkey, master_mint: &Pubkey, creator: &Pubkey) -> Self {
        Self {
            metadata: *metadata,
            master_mint: *master_mint,
            creator: *creator,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Debug, PartialEq, Eq)]
pub struct SplType {
    pub spl_mint: Pubkey,
    pub minimum_ownership: u64,
    pub amount_per_token: u64,
}

impl SplType {
    pub fn new(mint: &Pubkey, minimum_ownership: u64, amount_per_token: u64) -> Self {
        Self {
            spl_mint: *mint,
            minimum_ownership: minimum_ownership,
            amount_per_token: amount_per_token,
        }
    }
    /**Burns whitelisted token based on the converion rate */
    /// Brief.
    ///
    /// Description.
    ///
    /// * `purchase_amount` - Amount in liquidity coin used for this purchase.
    /// * `lockup_rate` - Conversion rate from this particular lock up.
    pub fn burn_wl_token(&self, purchase_amount: u64, lockup_rate: u64) -> Result<bool> {
        // amount * self.amount_per_token / 100
        // Calculate how many bond tokens they are allowed to have
        // let amount_allowed: u64 = (amount * self.amount_per_token) / 100;

        //

        Ok(true)
    }
}

impl Gate {
    pub fn load_gates(&mut self, gate_inputs: Vec<GateType>) {
        // Debug: Print the input at the beginning of the function.
        // msg!("Input to load2: {:?}", gate_input);

        // Loop over each of the gates and set them in the array

        for &gate in gate_inputs.iter() {
            // Debug: Print when this branch is reached.
            msg!("\n\nGate: {:?}", gate);
            // self.gate_settings.push(gate.clone());

            match gate {
                GateType::Collection { gate } => {
                    // Debug: Print when this branch is reached.
                    msg!("\nMatching CollectionType with collection: {:?}", gate);
                    self.gate_settings.push(GateType::Collection {
                        gate,
                    });
                }
                // GateInput::SplType { spl } => {
                GateType::Spl { gate } => {
                    // Debug: Print when this branch is reached.
                    msg!("\nMatching SplType with spl: {:?}", gate);
                    self.gate_settings.push(GateType::Spl {
                        gate,
                    });
                }
            }
        }

        msg!("\n\nGate loaded:\n{:?}", self.gate_settings);
    }
}
