use anchor_lang::prelude::*;
use crate::errors::errors::ErrorCode;
use anchor_spl::token::{ Mint, Token, TokenAccount };
use mpl_token_metadata::accounts::Metadata;

#[account]
#[derive(PartialEq, Eq)]
pub struct Gate {
    /** Type of verification.*/
    pub verification: GateType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum GateOption {
    /** Verification via NFT membership.*/
    Collection,
    /** Verification via SPL ownership.*/
    Spl,
    /** Verification via SPL ownership and NFT membership.*/
    Combined,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum GateType {
    /** Verification via NFT membership.*/
    Collection {
        gate: CollectionType,
    },
    /** Verification via SPL ownership.*/
    Spl {
        gate: SplType,
    },
    /** Verification via SPL ownership and NFT membership.*/
    Combined {
        gate_collection: CollectionType,
        spl_gate: SplType,
    },
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
            GateType::Combined { gate_collection, spl_gate } => {
                // Need to splut args into first two and the rest
                // let (first, rest) = args.split_at(2);
                gate_collection.verify(owner, args.clone())?;
                spl_gate.verify(owner, args)
            }
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
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

impl<'a> Verifiable<'a> for CollectionType {
    type Args = Vec<AccountInfo<'a>>;

    fn verify(&self, owner: &Pubkey, _args: Self::Args) -> Result<bool> {
        // verify based on membership to an NFT community
        msg!("\n\nCollection verification");
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
        msg!("Provided NFT mint: {:?}", nft_mint.key());

        // Ensure mint in the metadata matches provided mint
        require!(nft_metadata.mint == nft_mint.key(), ErrorCode::GateCollectionInvalidNftMetadata);

        let temp = nft_metadata.collection.unwrap();

        msg!("\nmaster mint stored in class: {:?}", self.master_mint);
        msg!("metadata mint stored in class: {:?}", self.metadata);
        msg!("nft_metadata. colection details: {:?} ", nft_metadata.collection_details);
        msg!("nft_metadata. colection: {:?} ", temp.key);

        // Ensure daddy mint matches one inside nft metadata
        require!(self.master_mint == temp.key, ErrorCode::GateCollectionNftNotFromCollection);

        // Ensure caller owns provided nft mint
        msg!("Collection verification");
        Ok(true)
    }
}

impl<'a> Verifiable<'a> for SplType {
    type Args = Vec<AccountInfo<'a>>;
    fn verify(&self, owner: &Pubkey, _args: Self::Args) -> Result<bool> {
        msg!("\n\nSPL verification");
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

        msg!("User has: {:?}", spl_token_account.amount);
        msg!("User passed SPL verication");

        Ok(true)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
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
}

impl Gate {
    pub fn load(&mut self, gate_input: GateType) {
        // Debug: Print the input at the beginning of the function.
        // msg!("Input to load2: {:?}", gate_input);

        match gate_input {
            GateType::Collection { gate } => {
                // Debug: Print when this branch is reached.
                msg!("\nMatching CollectionType with collection: {:?}", gate);
                self.verification = GateType::Collection {
                    gate,
                };
            }
            // GateInput::SplType { spl } => {
            GateType::Spl { gate } => {
                // Debug: Print when this branch is reached.
                msg!("\nMatching SplType with spl: {:?}", gate);
                self.verification = GateType::Spl {
                    gate,
                };
            }
            // GateInput::CombinedType { collection, spl } => {
            GateType::Combined { gate_collection, spl_gate } => {
                // Debug: Print when this branch is reached.
                msg!(
                    "\nMatching CombinedType with collection: {:?} and spl: {:?}",
                    gate_collection,
                    spl_gate
                );
                self.verification = GateType::Combined {
                    gate_collection: gate_collection,
                    spl_gate: spl_gate,
                };
            }
        }

        msg!("\n\nGate loaded:\n{:?}", self.verification);
    }
}
