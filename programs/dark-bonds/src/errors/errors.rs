use anchor_lang::prelude::*;
#[error_code]
pub enum ErrorCode {
    #[msg("Need 24h between withdraws")]
    WithdrawTooEarly,
    #[msg("Wrong cut?")]
    WorngCutTMP,

    // Supaadmin errirs
    /////////////////////////////////////////////////////////////////////////////
    #[msg("Bruh we ain't charity")]
    NonZeroFees,

    // Ibo errors
    /////////////////////////////////////////////////////////////////////////////
    #[msg("Can not add or remove lockup type")]
    IboRatesLocked,
    #[msg("Can not add or remove gate type")]
    IboGatedSettingsLocked,
    #[msg(
        "There aren't enought tokens left for this bond allocation. Try again with a smaller amount"
    )]
    IboBondsSoldOut,
    #[msg("Signing account is not IBO admin")]
    IboNotdmin,

    // Bond errors
    /////////////////////////////////////////////////////////////////////////////

    #[msg("This bond is not for sale")]
    BondNotForSale,
    #[msg("Signing account is not the owner of this bond")]
    BondNotBondOwner,
    #[msg("This bond can only be claimed at the end of the lockup duration")]
    BondMatureOnly,
    #[msg("Purchase requires seperate function call with NTF ownership proof")]
    RestrictedLockup,
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

    // NFT Ibo errors
    /////////////////////////////////////////////////////////////////////////////

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

    // Lockup errors
    /////////////////////////////////////////////////////////////////////////////
    #[msg("Lockup duration cant be zero")]
    LockupDurationZero,
    #[msg("Lockup duration needs to be more than a day")]
    LockupDurationUnderDay,
    #[msg("APY can't be zero")]
    LockupZeroApy,
    #[msg("No more tokens under this lockup")]
    LockupLimitExceeded,
    #[msg("Can't purchase a bond due to no sale right now")]
    NotWithinSale,

    // Buy bond erros
    /////////////////////////////////////////////////////////////////////////////
    #[msg("Provided wrong gate option")]
    PurchaseInvalidGateOption,
    #[msg("Provided wrong gate PDA")]
    PurchaseInvalidGateAccount,
    #[msg("This shouldn't happen")]
    PurchaseWrongGateStored,

    // Collection gate errors
    /////////////////////////////////////////////////////////////////////////////

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
    /////////////////////////////////////////////////////////////////////////////

    #[msg("Buyer does not own the enough WL SPL necessary for this gate")]
    GateSplCallerNotEnoughToken,
    #[msg("SPL mint address does not match the one stored for this gate")]
    GateSplIncorrectMint,
    #[msg("Provided insufficient number of accounts to process the collection")]
    GateSplInsufficientAccounts,
    #[msg("Token account not derived from the SPL mint")]
    GateSplInvalidTokenAccount,
    #[msg("Not enough tokens to burn for this amount of bond token")]
    GateSplNotEnoughWlTokens,
    #[msg("Caller is not the owner of the token account")]
    GateSplInvalidOwner,
    #[msg("Provided gate index is not included in this lockup")]
    IncorrectGateIndex,
}
