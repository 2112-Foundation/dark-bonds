use anchor_lang::prelude::*;
#[error_code]
pub enum ErrorCode {
    #[msg("Provided wrong string for the randomness reveal")]
    WrongReveal,
    #[msg("Game ended due to inaction")]
    MoveTooLate,
    #[msg("Game has not yet ended due to inaction")]
    MoveNotTooLate,
    #[msg("Caller not set as the ad poster")]
    Yeah,
}
