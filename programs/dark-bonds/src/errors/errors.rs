use anchor_lang::prelude::*;
#[error_code]
pub enum ErrorCode {
    #[msg("Need 24h between withdraws")]
    WithdrawTooEarly,
    #[msg("Can not add new lockup type")]
    RatesLocked,
    #[msg("There aren't enought tokens left for this bond allocation. Try again with a smaller amount")]
    BondsSoldOut,
    #[msg("This ticket is not for sale")]
    NotForSale,
    #[msg("Signing account is not the owner of this ticket")]
    NotTicketOwner,
    #[msg("Signing account is not IBO admin")]
    NotIBOAdmin,
    #[msg("Purchase requires seperate function call with NTF ownership proof")]
    RestrictedLockup,
    #[msg("The owner of the NFT token account is not the user.")]
    InvalidNFTAccountOwner,
    #[msg("The mint of the NFT token account is not the expected mint.")]
    InvalidNFTAccountMint,
    #[msg("The amount of the NFT token account is not 1.")]
    InvalidNFTAccountAmount,
    #[msg("The NFT master edition account is not valid.")]
    InvalidMasterEdition,
    #[msg("The NFT metadata account is not valid.")]
    InvalidMetadata,
    #[msg("The creator of the NFT is not the expected creator or is not verified.")]
    InvalidCreator,
}
