use anchor_lang::prelude::*;
use mpl_token_metadata::accounts::Metadata;

// Those PDAs are spun off the main Ibo PDA by the reuser
// Only used to fill out the bond details
// After that not accessed

use anchor_lang::prelude::*;

#[account]
pub struct Gate {
    pub verification: GateType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum GateType {
    Collection(CollectionData),
    Spl(SplData),
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct CollectionData {
    pub mint_key: Pubkey,
    pub master_key: Pubkey,
    pub creator_key: Pubkey,
}

pub trait Verifiable {
    type Args; // Associated type to represent arguments.
    fn verify(&self, args: Self::Args) -> Result<()>;
}

impl Verifiable for CollectionData {
    type Args = (Pubkey, Pubkey, Pubkey);

    fn verify(&self, args: (Pubkey, Pubkey, Pubkey)) -> Result<()> {
        let (mint_key, master_key, creator_key) = args;
        // Your specific logic for CollectionData using the above keys...
        Ok(())
    }
}

impl Verifiable for SplData {
    type Args = Pubkey;

    fn verify(&self, mint_key: Pubkey) -> Result<()> {
        // Your specific logic for SplData using the mint_key...
        Ok(())
    }
}

impl CollectionData {
    fn verify(&self, _mint_key: Pubkey, _master_key: Pubkey, _creator_key: Pubkey) -> Result<()> {
        // let metadata: Metadata = Metadata::try_from(&self.nft_metadata_account)?;
        // Verify NFT token account
        // Check if the owner of the token account is the buyer
        // if self.nft_token_account.owner != self.buyer.key() {
        //     return Err(ErrorCode::InvalidNFTAccountOwner.into());
        // }
        // // Check if the mint of the token account is the mint provided
        // if self.nft_token_account.mint != self.mint.key() {
        //     return Err(ErrorCode::InvalidNFTAccountMint.into());
        // }
        // // Check if the amount in the token account is exactly 1 (as expected for an NFT)
        // if self.nft_token_account.amount != 1 {
        //     return Err(ErrorCode::InvalidNFTAccountAmount.into());
        // }

        // Verify NFT Mint
        // Check if the master edition account key matches the provided master key
        // if master_key != self.nft_master_edition_account.key() {
        //     return Err(ErrorCode::InvalidMasterEdition.into());
        // }

        // metadata.data.

        // Check if the master edition account contains any data
        // if self.nft_master_edition_account.data_is_empty() {
        //     return Err(ErrorCode::InvalidMasterEdition.into());
        // }

        // Print the master key and the master edition account key for debugging purposes
        // msg!("master_key: {:?}", master_key);
        // msg!("nft_master_edition_account: {:?}", self.nft_master_edition_account.key());

        // // Verify NFT metadata
        // // Extract the metadata from the metadata account and check if its mint matches the provided mint
        // // let metadata = Metadata::from_account_info(&self.nft_metadata_account)?;
        // if metadata.mint != self.mint.key() {
        //     return Err(ErrorCode::InvalidMetadata.into());
        // }

        // Check if the metadata contains any data
        // if metadata.data.is_empty() {
        //     return Err(ErrorCode::InvalidMetadata.into());
        // }

        // Verify NFT creator
        // Check if there's any creator in the metadata that matches the provided creator key and is verified
        // if
        //     !metadata.creators.iter().any(|creator_vec| {
        //         if let Some(creator) = creator_vec.first() {
        //             creator.address == creator_key && creator.verified
        //         } else {
        //             false
        //         }
        //     })
        // {
        //     return Err(ErrorCode::InvalidCreator.into());
        // }
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SplData {
    pub mint_key: Pubkey,
}

impl SplData {
    fn verify(&self, _mint_key: Pubkey) -> Result<()> {
        Ok(())
    }
}

// #[account]
// pub struct Gate {
//     // pub mint_key: Pubkey,
//     // pub master_key: Pubkey,
//     // pub creator_key: Pubkey,
//     pub gate_type: GateType,
// }

// #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
// pub enum GateType {
//     Spl,
//     Nft,
// }

// pub struct GateVerification {
//     pub mint_key: Pubkey,
//     pub master_key: Pubkey,
//     pub creator_key: Pubkey,
// }

// pub struct GateVerification2 {
//     pub mint_key: Pubkey,
// }

// // Need to add verification functions here
// // Also different types of a gate

// impl<'info> GatedBuy<'info> {
//     fn verify(&self, _mint_key: Pubkey, master_key: Pubkey, creator_key: Pubkey) -> Result<()> {
//         let metadata: Metadata = Metadata::try_from(&self.nft_metadata_account)?;
//         // Verify NFT token account
//         // Check if the owner of the token account is the buyer
//         // if self.nft_token_account.owner != self.buyer.key() {
//         //     return Err(ErrorCode::InvalidNFTAccountOwner.into());
//         // }
//         // // Check if the mint of the token account is the mint provided
//         // if self.nft_token_account.mint != self.mint.key() {
//         //     return Err(ErrorCode::InvalidNFTAccountMint.into());
//         // }
//         // // Check if the amount in the token account is exactly 1 (as expected for an NFT)
//         // if self.nft_token_account.amount != 1 {
//         //     return Err(ErrorCode::InvalidNFTAccountAmount.into());
//         // }

//         // Verify NFT Mint
//         // Check if the master edition account key matches the provided master key
//         if master_key != self.nft_master_edition_account.key() {
//             return Err(ErrorCode::InvalidMasterEdition.into());
//         }

//         // metadata.data.

//         // Check if the master edition account contains any data
//         if self.nft_master_edition_account.data_is_empty() {
//             return Err(ErrorCode::InvalidMasterEdition.into());
//         }

//         // Print the master key and the master edition account key for debugging purposes
//         msg!("master_key: {:?}", master_key);
//         msg!("nft_master_edition_account: {:?}", self.nft_master_edition_account.key());

//         // Verify NFT metadata
//         // Extract the metadata from the metadata account and check if its mint matches the provided mint
//         // let metadata = Metadata::from_account_info(&self.nft_metadata_account)?;
//         if metadata.mint != self.mint.key() {
//             return Err(ErrorCode::InvalidMetadata.into());
//         }

//         // Check if the metadata contains any data
//         // if metadata.data.is_empty() {
//         //     return Err(ErrorCode::InvalidMetadata.into());
//         // }

//         // Verify NFT creator
//         // Check if there's any creator in the metadata that matches the provided creator key and is verified
//         if
//             !metadata.creators.iter().any(|creator_vec| {
//                 if let Some(creator) = creator_vec.first() {
//                     creator.address == creator_key && creator.verified
//                 } else {
//                     false
//                 }
//             })
//         {
//             return Err(ErrorCode::InvalidCreator.into());
//         }

// //         Ok(())
// //     }
// // }
