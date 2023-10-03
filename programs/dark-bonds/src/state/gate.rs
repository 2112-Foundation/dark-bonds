use anchor_lang::prelude::*;
use crate::errors::errors::ErrorCode;
use anchor_spl::token::{ Mint, Token, TokenAccount };
use mpl_token_metadata::accounts::Metadata;

#[account]
#[derive(PartialEq, Eq)]
pub struct GatedSettings {
    /** Type of verification.*/
    pub verification: GateType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum GateOption {
    Collection,
    Spl,
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
    type Args = Vec<AccountInfo<'a>>; // Add lifetime here
    fn verify(&self, owner: &Pubkey, args: Self::Args) -> Result<bool> {
        match self {
            GateType::Collection { gate } => gate.verify(owner, args),
            GateType::Spl { gate } => gate.verify(owner, args),
            GateType::Combined { gate_collection, spl_gate } => {
                // You might want to check both gate_collection and spl_gate here.
                // It depends on your use case.
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

        msg!("Provided {:?} accounts.", _args.len());

        if _args.len() < 3 {
            msg!("Not enough accounts provided. At least 3 required.");
            return Err(ErrorCode::GateCollectionInsufficientAccounts.into());
        }

        let account1: &AccountInfo<'_> = &_args[0];
        let account2: &AccountInfo<'_> = &_args[1];
        let account3: &AccountInfo<'_> = &_args[2];

        // Assert there is enough accounts
        // if let [account1, account2, account3, ..] = accs.as_slice() {
        // Get mint metadata
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
        // verify based on membership to an NFT community
        Ok(true)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct SplType {
    pub spl_mint: Pubkey,
    pub minimum_ownership: u64,
    pub amount_per_token: Option<u64>,
}

impl SplType {
    pub fn new(mint: &Pubkey, minimum_ownership: u64, amount_per_token: Option<u64>) -> Self {
        Self {
            spl_mint: *mint,
            minimum_ownership: minimum_ownership,
            amount_per_token: amount_per_token,
        }
    }
}

impl GatedSettings {
    // Adds accounts
    pub fn load(&mut self, gate_option: GateOption, accs: Vec<Pubkey>, options: Vec<u64>) {
        // Match absed on option
        match gate_option {
            GateOption::Collection => {
                self.verification = GateType::Collection {
                    gate: CollectionType::new(&accs[0], &accs[1], &accs[2]),
                };
            }
            GateOption::Spl => {
                // let var1: Option<u64> = options.get(0).clone();
                let minnimum_ownership: u64 = *options.get(0).unwrap();
                let amount_per_token: Option<u64> = options.get(1).cloned();
                self.verification = GateType::Spl {
                    gate: SplType::new(&accs[0], minnimum_ownership, amount_per_token),
                };
            }
            GateOption::Combined => {
                let minnimum_ownership: u64 = *options.get(0).unwrap();
                let amount_per_token: Option<u64> = options.get(1).cloned();
                self.verification = GateType::Combined {
                    gate_collection: CollectionType::new(&accs[0], &accs[1], &accs[2]),
                    spl_gate: SplType::new(&accs[0], minnimum_ownership, amount_per_token),
                };
            }
        }
    }
}

//     // pub fn load_accounts(&mut self, accs: Vec<Pubkey>) {
//     //     let ggate = match self.verification {
//     //         GateType::Spl => SplType::new(&accs[0].key()),
//     //         GateType::Collection =>
//     //             CollectionType::new(&accs[0].key(), &accs[1].key(), &accs[2].key()),
//     //     };

//     //     // Loop over size and load up provided accounts
//     //     // for i in 0..size {
//     //     //     self.accounts.push(accs[i]);
//     //     // }
//     // }

//     pub fn load_additional(&mut self, additional: Vec<u32>) {
//         self.additional_data = additional;
//     }

//     // set type
//     // pub fn set_type(&mut self, gate_option: u8) {
//     //     match gate_option {
//     //         0 => {
//     //             self.verification = GateType::Collection;
//     //         }
//     //         1 => {
//     //             self.verification = GateType::Spl;
//     //         }
//     //         2 => {
//     //             self.verification = GateType::Combined;
//     //         }
//     //         _ => panic!("Invalid gate type"),
//     //     }
//     // }

//     // pub fn verify(&self, owner: &Pubkey, accs: &Vec<AccountInfo>) -> Result<bool> {
//     //     match self.verification {
//     //         GateType::Collection => Ok(self.verify_collection(owner, accs)?),
//     //         GateType::Spl => Ok(self.verify_spl(owner, accs)?),
//     //         GateType::Combined => {
//     //             // Need to extract accounts correctly to pass it
//     //             msg!("Both verification");
//     //             Ok(self.verify_collection(owner, accs)? && self.verify_spl(owner, accs)?)
//     //         }
//     //         _ => panic!("Invalid gate type"),
//     //     }
//     // }

//     // Verify SPL
//     // Accounts: [spl_mint, token_account]
//     fn verify_spl(&self, owner: &Pubkey, accs: &Vec<AccountInfo>) -> Result<bool> {
//         let account1: &AccountInfo<'_> = &accs[0];
//         // Ensure correct mint
//         require!(&account1.key() == &self.accounts[0].key(), ErrorCode::GateSplIncorrectMint);

//         // Ensure correct mint
//         // Different gates need different balance amounts
//         let spl_mint: Account<Mint> = Account::try_from(account1)?;

//         let account2: &AccountInfo<'_> = &accs[1];
//         // let nft_mint: Account<Mint> = Account::try_from(
//         msg!("SPL verification");
//         Ok(true)
//     }

//     // Verify community
//     // Accounts: [metadata, nft_mint, token_account]
//     fn verify_collection(&self, owner: &Pubkey, accs: &Vec<AccountInfo>) -> Result<bool> {
//         msg!("Provided {:?} accounts.", accs.len());
//         // Assert there is enough accounts
//         if let [account1, account2, account3, ..] = accs.as_slice() {
//             // Get mint metadata
//             let nft_metadata: Metadata = Metadata::try_from(account1)?;
//             msg!("Extarcted metadata");

//             // Ensure caller owns provided nft mint
//             let nft_mint: Account<Mint> = Account::try_from(account2)?;
//             msg!("Extracted NFT mint");

//             // Get token account
//             let nft_token_account: Account<TokenAccount> = Account::try_from(account3)?;
//             msg!("Extarcted nft token account");

//             // Caller is the owner of the nft
//             require!(&nft_token_account.owner == owner, ErrorCode::GateCollectionInvalidOwner);

//             // Token accout is for that particular  mint
//             require!(
//                 &nft_token_account.mint == &nft_mint.key(),
//                 ErrorCode::GateCollectionInvalidTokenAccount
//             );

//             // Nft metadta matches the nft mint
//             msg!("Mint from the metadata provided: {:?}", nft_metadata.mint);
//             msg!("Provided NFT mint: {:?}", nft_mint.key());

//             // Ensure mint in the metadata matches provided mint
//             require!(
//                 nft_metadata.mint == nft_mint.key(),
//                 ErrorCode::GateCollectionInvalidNftMetadata
//             );

//             // msg!("\nmaster mint store din class: {:?}", self.accounts[1].key());
//             // msg!("nft_metadata. colection details: {:?} ", nft_metadata.collection_details);
//             // msg!("nft_metadata. colection: {:?} ", nft_metadata.collection.unwrap().key);
//             // msg!("nft_metadata. colection: {:?} ", nft_metadata.);

//             // Ensure daddy mint matches one inside nft metadata
//             require!(
//                 self.accounts[1].key() == nft_metadata.collection.unwrap().key,
//                 ErrorCode::GateCollectionNftNotFromCollection
//             );

//             // Ensure caller owns provided nft mint
//             msg!("Collection verification");
//             Ok(true)
//         } else {
//             return Err(ErrorCode::GateCollectionInsufficientAccounts.into());
//         }
//     }
// }
