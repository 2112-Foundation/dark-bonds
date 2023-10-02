use anchor_lang::prelude::*;
use crate::errors::errors::ErrorCode;
use anchor_spl::token::{ Mint, Token, TokenAccount };
use mpl_token_metadata::accounts::Metadata;

#[account]
#[derive(PartialEq, Eq)]
pub struct GatedSettings {
    /** Type of verification.*/
    pub verification: GateType,
    /** Accounts that encapsulate this type of lock-up.*/
    // SPL: = [spl_mint]
    // Collection: = [metadata, master_mint, creator]
    // Combined: = [metadata, master_mint, creator]
    pub accounts: Vec<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum GateType {
    Collection,
    Spl,
    Combined,
}

impl GatedSettings {
    // Adds accounts
    pub fn load_accounts(&mut self, accs: Vec<Pubkey>) {
        let size: usize = match self.verification {
            GateType::Spl => 1,
            GateType::Collection => 3,
            GateType::Combined => 4,
        };

        // Loop over size and load up provided accounts
        for i in 0..size {
            self.accounts.push(accs[i]);
        }
    }

    // set type
    pub fn set_type(&mut self, gate_option: u8) {
        match gate_option {
            0 => {
                self.verification = GateType::Collection;
            }
            1 => {
                self.verification = GateType::Spl;
            }
            2 => {
                self.verification = GateType::Combined;
            }
            _ => panic!("Invalid gate type"),
        }
    }

    pub fn verify(&self, owner: &Pubkey, accs: &Vec<AccountInfo>) -> Result<bool> {
        match self.verification {
            GateType::Collection => Ok(self.verify_collection(owner, accs)?),
            GateType::Spl => Ok(self.verify_spl(owner, accs)?),
            GateType::Combined => {
                // Need to extract accounts correctly to pass it
                msg!("Both verification");
                Ok(self.verify_collection(owner, accs)? && self.verify_spl(owner, accs)?)
            }
        }
    }

    // Verify SPL
    fn verify_spl(&self, owner: &Pubkey, accs: &Vec<AccountInfo>) -> Result<bool> {
        msg!("SPL verification");
        Ok(true)
    }

    // Verify community
    // Accounts: [metadata, nft_mint, token_account]
    fn verify_collection(&self, owner: &Pubkey, accs: &Vec<AccountInfo>) -> Result<bool> {
        msg!("Provided {:?} accounts.", accs.len());
        // Assert there is enough accounts
        if let [account1, account2, account3, ..] = accs.as_slice() {
            // Get mint metadata
            let nft_metadata: Metadata = Metadata::try_from(account1)?;

            msg!("Extarcted metadata");

            // Ensure caller owns provided nft mint
            let nft_mint: Account<Mint> = Account::try_from(account2)?;

            msg!("Extarcted nft mint");

            // Get token account
            let nft_token_account: Account<TokenAccount> = Account::try_from(account3)?;

            msg!("Extarcted nft token account");

            // Caller is the owner of the nft
            // msg!("nft_token_account.owner: {:?}", nft_token_account.owner);
            // msg!("owner: {:?}", owner);
            require!(&nft_token_account.owner == owner, ErrorCode::GateCollectionInvalidOwner);

            // Ensure mint comes from the provided caller
            // require!(
            //     nft_metadata.mint_authority == *account4.key,
            //     ErrorCode::GateCollectionInvalidMintAuthority
            // );

            // Ensure caller owns provided nft mint
            msg!("Collection verification");
            Ok(true)
        } else {
            return Err(ErrorCode::GateCollectionInsufficientAccounts.into());
        }
    }
}
