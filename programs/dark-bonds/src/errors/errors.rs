use anchor_lang::prelude::*;
#[error_code]
pub enum ErrorCode {
    #[msg("Need 24h between withdraws")]
    WithdrawTooEarly,
    #[msg("Wrong cut?")]
    WorngCutTMP,
    #[msg("Can not add or remove lockup type")]
    RatesLocked,
    #[msg("Can not add or remove gate type")]
    GatedSettingssLocked,
    #[msg(
        "There aren't enought tokens left for this bond allocation. Try again with a smaller amount"
    )]
    BondsSoldOut,
    #[msg("This bond is not for sale")]
    NotForSale,
    #[msg("Signing account is not the owner of this bond")]
    NotBondOwner,
    #[msg("Signing account is not IBO admin")]
    NotIBOAdmin,
    #[msg("Purchase requires seperate function call with NTF ownership proof")]
    RestrictedLockup,
    #[msg("The owner of the NFT token account is not the user")]
    InvalidNFTAccountOwner,
    #[msg("The mint of the NFT token account is not the expected mint")]
    InvalidNFTAccountMint,
    #[msg("The amount of the NFT token account is not 1")]
    InvalidNFTAccountAmount,
    #[msg("The NFT master edition account is not valid")]
    InvalidMasterEdition,
    #[msg("The NFT metadata account is not valid")]
    InvalidMetadata,
    #[msg("The creator of the NFT is not the expected creator or is not verified")]
    InvalidCreator,
    #[msg("Can not withdraw until IBO is over")]
    WithdrawLocked,
    #[msg("Provided wrong number to the derivation")]
    InvalidRecursiveIdx,
    #[msg("Provided wrong vertex")]
    WrongVertexAccount,
    #[msg("Provided wrong number of vertex accounts")]
    MissingVertexAccount,
    #[msg("Accounts after vertices need to be in multiple of three")]
    IncorrectRatioRemaining,
    #[msg("Couldnt up the number")]
    ConversionFailed,

    // Lokcup
    #[msg("Lockup duration cant be zero")]
    LockupDurationZero,
    #[msg("Lockup duration needs to be more than a day")]
    LockupDurationUnderDay,
    #[msg("APY can't be zero")]
    LockupZeroApy,
    #[msg("Can't purchase a bond due to no sale right now")]
    NotWithinSale,

    // new
    #[msg("Provided wrong gate option")]
    InvalidGateOption,
    #[msg("Provided wrong gate PDA")]
    InvalidGateAccount,

    #[msg("No more tokens under this lockup")]
    LockupLimitExceeded,
    #[msg("Invalid percent APY")]
    WrongAPY,

    // Collection gate
    #[msg("Provided insufficient number of accounts to process the collection")]
    GateCollectionInsufficientAccounts,
    #[msg("Caller is not the NFT owner")]
    GateCollectionInvalidOwner,
    #[msg("Token account not derived from the NFT mint")]
    GateCollectionInvalidTokenAccount,
    #[msg("Mint does not match mint stored in the metadata")]
    GateCollectionInvalidNftMetadata,
    #[msg("Provided NFT is not a member of this collection")]
    GateCollectionNftNotFromCollection,
    // SPL gate
    #[msg("Buyer does not own the enough SPL necessary for this gate")]
    GateSplCallerNotEnoughToken,
    #[msg("SPL mint address does not match the one stored for this gate")]
    GateSplIncorrectMint,
    #[msg("Provided insufficient number of accounts to process the collection")]
    GateSplInsufficientAccounts,
    #[msg("Token account not derived from the SPL mint")]
    GateSplInvalidTokenAccount,
    #[msg("Caller is not the owner of the token account")]
    GateSplInvalidOwner,
    #[msg("Provided gate index is not included in this lockup")]
    IncorrectGateIndex,
}
