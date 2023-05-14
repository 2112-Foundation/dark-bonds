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
}
