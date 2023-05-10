use anchor_lang::prelude::*;
#[error_code]
pub enum ErrorCode {
    #[msg("Need 24h between withdraws")]
    WithdrawTooEarly,
    #[msg("Can not add new lockup type")]
    RatesLocked,
    #[msg("There aren't enought tokens left for this bond allocation. Try again with a smaller amount")]
    BondsSoldOut,
}
