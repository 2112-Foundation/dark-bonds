use anchor_lang::prelude::*;
use crate::common::errors::BondErrors::*;
use crate::common::errors::BondErrors;

use anchor_spl::token::{ self, Mint, Token, TokenAccount, Burn };
use mpl_token_metadata::accounts::Metadata;

#[account]
#[derive(PartialEq, Eq)]
pub struct Gate {
    /** Index of this gate.*/
    pub index: u16,
    /** Type of gate_settings.*/
    pub gate_settings: Vec<GateType>,
}

// Size in bytes
pub enum LockSize {
    CollectionLock = 100,
    SplLock = 50,
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
            GateType::Spl { .. } => 2, // Modifying this to pass
        }
    }
}

pub trait Verifiable<'a> {
    type Args;
    fn verify(&self, owner: &Signer, args: Self::Args) -> Result<bool>;
}
impl<'a> Verifiable<'a> for GateType {
    type Args = Vec<AccountInfo<'a>>;
    fn verify(&self, owner: &Signer, args: Self::Args) -> Result<bool> {
        match self {
            GateType::Collection { gate } => gate.verify(owner, args),
            GateType::Spl { gate } => gate.verify(owner, args),
        }
    }
}
impl<'a> Verifiable<'a> for CollectionType {
    type Args = Vec<AccountInfo<'a>>;

    fn verify(&self, owner: &Signer, _args: Self::Args) -> Result<bool> {
        // verify based on membership to an NFT community
        // msg!("\n\nCollection gate_settings");
        msg!("Provided {:?} accounts.", _args.len());

        if _args.len() < 3 {
            msg!("Not enough accounts provided. At least 3 required.");
            return Err(GateCollectionInsufficientAccounts.into());
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
        require!(&nft_token_account.owner == &owner.key(), BondErrors::GateCollectionInvalidOwner);

        // Token accout is for that particular  mint
        require!(
            &nft_token_account.mint == &nft_mint.key(),
            BondErrors::GateCollectionInvalidTokenAccount
        );

        // Nft metadta matches the nft mint
        msg!("Mint from the metadata provided: {:?}", nft_metadata.mint);
        // msg!("Provided NFT mint: {:?}", nft_mint.key());

        // Ensure mint in the metadata matches provided mint
        require!(nft_metadata.mint == nft_mint.key(), BondErrors::GateCollectionInvalidNftMetadata);

        let temp = nft_metadata.collection.unwrap();

        // msg!("\nmaster mint stored in class: {:?}", self.master_mint);
        // msg!("metadata mint stored in class: {:?}", self.metadata);
        // msg!("nft_metadata. colection details: {:?} ", nft_metadata.collection_details);
        // msg!("nft_metadata. colection: {:?} ", temp.key);

        // Ensure daddy mint matches one inside nft metadata
        require!(self.master_mint == temp.key, BondErrors::GateCollectionNftNotFromCollection);

        // Ensure caller owns provided nft mint
        msg!("verified collection gate_settings");
        Ok(true)
    }
}
impl<'a> Verifiable<'a> for SplType {
    type Args = Vec<AccountInfo<'a>>;
    fn verify(&self, owner: &Signer, _args: Self::Args) -> Result<bool> {
        msg!("\n\nSPL gate_settings");
        msg!("Provided {:?} accounts.", _args.len());
        if _args.len() < 2 {
            msg!("Not enough accounts provided. At least 2 required.");
            return Err(GateSplInsufficientAccounts.into());
        }

        let account1: &AccountInfo<'_> = &_args[0];
        let account2: &AccountInfo<'_> = &_args[1];

        // Mint mathes the one stored
        let mint: Account<Mint> = Account::try_from(account1)?;
        require!(&mint.key() == &self.spl_mint, BondErrors::GateSplIncorrectMint);

        // Token account derived from this mint
        let spl_token_account: Account<TokenAccount> = Account::try_from(account2)?;
        require!(&spl_token_account.mint == &mint.key(), BondErrors::GateSplInvalidTokenAccount);

        // let token_program: Program<Token> = Program::try_from(account3)?;

        // User owns provieded token account
        require!(&spl_token_account.owner == &owner.key(), BondErrors::GateSplInvalidOwner);

        // User has enough tokens
        require!(
            spl_token_account.amount > self.minimum_ownership,
            BondErrors::GateSplCallerNotEnoughToken
        );

        msg!(
            "User has: {:?} and min ownership is {:?}",
            spl_token_account.amount,
            self.minimum_ownership
        );

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
}

impl Gate {
    pub fn load_gate_lock(&mut self, gate_inputs: Vec<GateType>) -> usize {
        // Keep a track of how much in size the account shoudl increase
        let mut size_increase: usize = 0;

        // Loop over each of the gates and set them in the array
        for &gate in gate_inputs.iter() {
            // Debug: Print when this branch is reached.
            msg!("\n\nGate: {:?}", gate);

            match gate {
                GateType::Collection { gate } => {
                    msg!("\nMatching CollectionType with collection: {:?}", gate);
                    self.gate_settings.push(GateType::Collection {
                        gate,
                    });
                    size_increase += LockSize::CollectionLock as usize;
                }
                GateType::Spl { gate } => {
                    msg!("\nMatching SplType with spl: {:?}", gate);
                    self.gate_settings.push(GateType::Spl {
                        gate,
                    });
                    size_increase += LockSize::SplLock as usize;
                }
            }
        }

        size_increase
    }
}
