use crate::common::errors::BondErrors;
use crate::state::*;
use crate::common::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ self, Token, TokenAccount, Transfer, Burn, Mint },
};

use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(aces: [u8; 32])]
pub struct BuyBond<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        init,
        seeds = [BOND_SEED.as_bytes(), ibo.key().as_ref(), aces.as_ref()],
        bump,
        payer = buyer,
        space = 400
    )]
    pub bond: Account<'info, Bond>,

    #[account(
        mut,
        seeds = [
            IBO_SEED.as_bytes(),  
            ibo.aces.as_ref()
        ],
        bump = ibo.bump,
    )]
    pub ibo: Account<'info, Ibo>,

    #[account(mut, seeds = [MAIN_SEED.as_bytes()], bump = main.bump)]
    pub main: Account<'info, Main>,

    #[account(
        mut,
        seeds = [LOCKUP_SEED.as_bytes(), ibo.key().as_ref(), &lockup.index.to_be_bytes()],
        bump = lockup.bump        
    )]
    pub lockup: Account<'info, Lockup>,

    #[account(
        init_if_needed,
        seeds = [USER_ACCOUNT_SEED.as_bytes(), buyer.key().as_ref()],
        bump,
        space = 8 + 40, // change
        payer = buyer
    )]
    pub user_account: Account<'info, UserAccount>,

    // Provided token account for the buyer has to be same mint as the one set in ibo
    #[account(
        mut, 
        token::mint = ibo.liquidity_token, 
        token::authority = buyer
    )]
    pub buyer_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut, 
        token::mint = ibo.liquidity_token, 
        token::authority = ibo.recipient_address
    )]
    pub recipient_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut, 
        token::mint = ibo.liquidity_token, 
        token::authority = main.master_recipient
    )]
    pub master_recipient_ata: Box<Account<'info, TokenAccount>>, // Matches specified owner and mint

    #[account(mut, constraint = ibo_ata.mint == ibo.underlying_token @BondErrors::MintMismatch)]
    pub ibo_ata: Box<Account<'info, TokenAccount>>,
    // Check for bond substitution attack
    #[account(mut, token::authority = bond, constraint = ibo_ata.mint == ibo.underlying_token @BondErrors::MintMismatch)]
    pub bond_ata: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

impl<'info> BuyBond<'info> {
    fn transfer_bond(
        &self,
        ibo_bump: &u8,
        bond_amount: u64,
        aces: [u8; 32],
        program_id: &Pubkey
    ) -> Result<()> {
        let seeds = &[IBO_SEED.as_bytes(), aces.as_ref(), &[*ibo_bump]];

        // Transfer bond to the vested account
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.ibo_ata.to_account_info(),
                    to: self.bond_ata.to_account_info(),
                    authority: self.ibo.to_account_info(),
                },
                &[seeds]
            ),
            bond_amount
        )?;
        Ok(())
    }

    fn transfer_liquidity(
        &self,
        amount: u64,
        recipient_ata: &Account<'info, TokenAccount>
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(self.token_program.to_account_info(), Transfer {
                from: self.buyer_ata.to_account_info(),
                to: recipient_ata.to_account_info(),
                authority: self.buyer.to_account_info(),
            }),
            amount
        )?;
        Ok(())
    }
}

fn burn_wl<'a, 'info>(
    amount_to_burn: u64,
    mint: &Account<'info, Mint>,
    from: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    buyer: &Signer<'info>
) -> Result<()> {
    token::burn(
        CpiContext::new(token_program.to_account_info(), Burn {
            mint: mint.to_account_info(),
            from: from.to_account_info(),
            authority: buyer.to_account_info(),
        }),
        amount_to_burn
    )?;
    Ok(())
}

pub fn buy_bond<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, BuyBond<'info>>,
    aces: [u8; 32],
    amount_liquidity: u64,
    gate_idx: u32 // Gate selector
) -> Result<()> {
    let accounts: &mut BuyBond = ctx.accounts;
    let buyer: &Signer = &mut accounts.buyer;
    let user_account: &mut Account<UserAccount> = &mut accounts.user_account;
    let main: &Account<Main> = &mut accounts.main;
    let lockup: &mut Account<Lockup> = &mut accounts.lockup;
    let ibo: &mut Account<Ibo> = &mut accounts.ibo;
    let bond: &mut Account<Bond> = &mut accounts.bond;
    let token_program: &mut Program<'_, Token> = &mut accounts.token_program;

    // Loop over all the remaining accounts to get the bond bank that is empty
    let mut bond_index: u16 = 0;
    let mut bank_index: u16 = 0;
    let mut val_set: bool = false;
    for (idx, account) in ctx.remaining_accounts.iter().enumerate() {
        let _account_key: Pubkey = account.key();
        let mut data = account.try_borrow_mut_data()?;
        let mut bond_bank: BondBank = BondBank::try_deserialize(&mut data.as_ref()).expect(
            "Error Deserializing Data"
        );

        // Skip if index is prior to the current one
        if bond_bank.index != ibo.current_bond_bank_counter {
            continue;
        }

        // Validate the provided account
        let (expected_pda, _) = Pubkey::find_program_address(
            &[
                BOND_BANK_SEED.as_ref(),
                ibo.key().as_ref(),
                &ibo.current_bond_bank_counter.to_be_bytes(),
            ],
            &ctx.program_id
        );

        // Log derived and provided addresses
        msg!("Derived PDA: {:?}", expected_pda);
        msg!("Provided PDA: {:?}", _account_key);

        // Derived must match provided
        if expected_pda != _account_key {
            return Err(BondErrors::ToDo.into());
        }

        // Check if there is space left
        if bond_bank.has_space() {
            msg!("This bank has a total of {:?} blackboxes", bond_bank.aces.len() as u16);
            bond_index = bond_bank.aces.len() as u16;
            bond_bank.add_blackbox(aces);
            bond_bank.try_serialize(&mut data.as_mut())?;
            val_set = true;
            bank_index = ibo.current_bond_bank_counter;

            // Increment the current ibo bank counter if the bank is full
            if !bond_bank.has_space() {
                ibo.current_bond_bank_counter += 1;
            }
            break;
        }
    }

    // If this is last one throw error
    if val_set == false {
        return Err(BondErrors::ToDo.into());
    }

    // Increment bond pointer counter and store pointer in the pointer PDA
    user_account.bond_counter += 1;
    // bond_pointer.bond_address = bond.key();

    // Within the purchase period
    require!(lockup.within_sale(ibo.live_date, ibo.end_date), BondErrors::NotWithinSale);

    // Calcilate bond amount based on the stable amount provided
    let (cut, remainder) = calculate_cut_and_remainder(
        amount_liquidity,
        (main.cuts.purchase_cut as f64) / SCALE
    ).unwrap();

    msg!("\ncut  : {:?}\n remainder: {:?}", cut, remainder);

    // Get bond amount from provided liquidity
    let bond_amount: u64 = conversion(&amount_liquidity, &ibo.fixed_exchange_rate)?;

    msg!("\n\nbond_amount from conversion : {:?}", bond_amount);

    // Compound the bond amount
    let bond_amount_comp: u64 = lockup.compounded_amount(bond_amount)?;

    // Take SOL fee for buying a bond
    take_fee(&main.to_account_info(), &buyer, main.user_fees.bond_purchase_fee as u64, 0)?;

    // Check if it has at least one access gate
    if lockup.gates.len() > 0 {
        // Check if gate index exists within the lockup
        require!(lockup.gates.contains(&gate_idx), BondErrors::PurchaseInvalidGateOption);

        // Remaining acounts can't be empty
        let remaining_accounts_vec: Vec<AccountInfo<'_>> = ctx.remaining_accounts.to_vec();
        require!(remaining_accounts_vec.len() > 0, BondErrors::RestrictedLockup);
        let (gate_account, verification_accounts) = remaining_accounts_vec
            .split_first()
            .ok_or(ProgramError::InvalidArgument)?;

        // Recheck that the pda is correct for the given gate account
        let (gate_pda, _bump) = Pubkey::find_program_address(
            &[GATE_SEED.as_bytes(), ibo.key().as_ref(), &gate_idx.to_be_bytes()],
            &ctx.program_id
        );

        // Correct gate has been given
        require!(&gate_pda == gate_account.key, BondErrors::PurchaseInvalidGateAccount);

        // Extract gate accoutn content from the remaining accounts
        let gate_acc: Account<Gate> = Account::try_from(gate_account)?;

        // Verification vector
        let mut v_vec: Vec<AccountInfo<'_>> = verification_accounts.to_vec();

        // Loop over all the gate settings stored in the account
        for (index, &gate_idx) in gate_acc.gate_settings.iter().enumerate() {
            // Get instance of the gate to feed it accounts
            let gate: &GateType = gate_acc.gate_settings
                .get(index)
                .ok_or(BondErrors::PurchaseWrongGateStored)?;

            // Pass whatever accounts are left to the gate
            gate.verify(&buyer, v_vec.clone())?;

            // Call burn token function if it is the SPL one and flagged as having a conversion
            match gate {
                GateType::Spl { gate } => {
                    // Mint mathes the one stored
                    msg!("SPL gate {:?} ", gate);
                    if gate.amount_per_token > 0 {
                        let account1: &AccountInfo<'_> = &v_vec[0];
                        let account2: &AccountInfo<'_> = &v_vec[1];
                        let amount_to_burn: u64 = ((bond_amount as f64) /
                            (gate.amount_per_token as f64)) as u64;
                        let mint: Account<'info, Mint> = Account::try_from(&account1)?;
                        let spl_token_account: Account<'info, TokenAccount> = Account::try_from(
                            &account2
                        )?;
                        // TODO add require for burning it
                        msg!("\n\nBURNING\n");
                        require!(
                            spl_token_account.amount > amount_to_burn,
                            BondErrors::GateSplNotEnoughWlTokens
                        );
                        burn_wl(amount_to_burn, &mint, &spl_token_account, token_program, buyer)?;
                    }
                }
                _ => {}
            }
            if index < gate_acc.gate_settings.len() - 1 {
                v_vec.drain(..gate.account_drop());
            }
        }
    }

    msg!("bond_amount compounded  : {:?}", bond_amount_comp);

    // Check that there are tokens left in that lockup
    lockup.tokens_left(bond_amount_comp)?;

    msg!("Balance recipient ata: {:?}", accounts.recipient_ata.amount);

    // Increment bonud counter
    ibo.bond_counter += 1;

    // Set total redeemable for that bond
    bond.total_claimable = bond_amount_comp;
    bond.maturity_date = lockup.compute_bond_completion_date();
    bond.owner = buyer.key();
    bond.bump = *ctx.bumps.get("bond").unwrap();
    bond.principal_ratio = lockup.principal_ratio;
    bond.aces = aces;
    bond.bank_index = bank_index;

    // TODO extract from the loop
    bond.bond_index = bond_index;

    // Write to the user owned array
    user_account.add_total_owned(bank_index, bond_index);

    // Transfer liquidity coin cut to us
    accounts.transfer_liquidity(cut, &accounts.master_recipient_ata)?;
    msg!("Transfered cut to main");
    accounts.transfer_liquidity(remainder, &accounts.recipient_ata)?;
    msg!("Transfered remainder to recipient");

    // Send bond calculated amonut to buyer
    msg!("Transfering {:?} from account with {:?}", bond_amount_comp, accounts.ibo_ata.amount);
    accounts.transfer_bond(
        &accounts.ibo.bump,
        bond_amount_comp,
        accounts.ibo.aces,
        &ctx.program_id
    )?;
    msg!("Transfered bond to buyer");

    msg!("\nEnd of BuyBond");
    Ok(())
}
