use anchor_lang::prelude::*;
#[error_code]
pub enum ErrorCode {
    #[msg("Need 24h between withdraws")]
    WithdrawTooEarly,
}
