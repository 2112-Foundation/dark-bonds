use crate::errors::errors::ErrorCode;
use crate::state::*;
use crate::common::*;
// use anchor_lang::{ prelude::*, system_program::Transfer };
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ self, Token, TokenAccount, Transfer, Burn, Mint },
};

// use anchor_spl::token::{ self, Token, TokenAccount, Transfer };
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(lockup_idx: u32)]
pub struct BuyBond<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        init,
        seeds = ["bond".as_bytes(), ibo.key().as_ref(), &ibo.bond_counter.to_be_bytes()],
        bump,
        payer = buyer,
        space = 400
    )]
    pub bond: Account<'info, Bond>,
    #[account(mut)]
    pub ibo: Account<'info, Ibo>,
    #[account(seeds = ["main_register".as_bytes()], bump)]
    pub master: Account<'info, Master>,

    #[account(
        mut, // Might modify total used up for this lock up
        seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()],
        bump
        // constraint = lockup.gate_counter == 0 @ErrorCode::RestrictedLockup
    )]
    pub lockup: Account<'info, Lockup>,

    // purchse token
    // Provided ATA has to be same mint as the one set in ibo
    #[account(mut, token::mint = ibo.liquidity_token, token::authority = buyer)]
    pub buyer_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub recipient_ata: Box<Account<'info, TokenAccount>>,

    // bond token
    #[account(mut)]
    pub ibo_ata: Box<Account<'info, TokenAccount>>,
    // Check for bond substitution attack
    #[account(mut, token::authority = bond)]
    pub bond_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut, token::mint = ibo.liquidity_token, token::authority = master.master_recipient)]
    pub master_recipient_ata: Box<Account<'info, TokenAccount>>, // Matches specified owner and mint

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

impl<'info> BuyBond<'info> {
    fn transfer_buyer(&self, bond_amount: u64, ibo_idx: u64, program_id: &Pubkey) -> Result<()> {
        let (_, bump) = anchor_lang::prelude::Pubkey::find_program_address(
            &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes()],
            program_id
        );
        let seeds = &["ibo_instance".as_bytes(), &ibo_idx.to_be_bytes(), &[bump]];

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
        // msg!("\nTransfer liqudiity");
        Ok(())
    }

    fn burn_wl(
        &self,
        amount_to_burn: u64,
        mint: Account<'info, Mint>,
        from: Account<'info, TokenAccount>
    ) -> Result<()> {
        token::burn(
            CpiContext::new(self.token_program.to_account_info(), Burn {
                mint: mint.to_account_info(),
                from: from.to_account_info(),
                authority: self.buyer.to_account_info(),
            }),
            amount_to_burn // settings.case_fee
        )?;
        Ok(())
    }
}

// impl<'a> Verifiable<'a>
pub fn buy_bond<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, BuyBond<'info>>,
    _lockup_idx: u32,
    ibo_idx: u64,
    amount_liquidity: u64,
    gate_idx: u32 // This needs to be an array of gates
) -> Result<()> {
    let accounts: &mut BuyBond = ctx.accounts;
    let buyer: &Signer = &mut accounts.buyer;
    let master: &mut Account<Master> = &mut accounts.master;
    let lockup: &mut Account<Lockup> = &mut accounts.lockup;
    let ibo: &mut Account<Ibo> = &mut accounts.ibo;
    let bond: &mut Account<Bond> = &mut accounts.bond;
    let token_program: &mut Program<'_, Token> = &mut accounts.token_program;

    // let ggg = ctx.accounts.transfer_liquidity(); //amount, recipient_ata)

    // let recipient_ata: &mut Box<Account<'_, TokenAccount>> = &mut ctx.accounts.recipient_ata;
    // let master_recipient_ata: &mut Box<
    //     Account<'_, TokenAccount>
    // > = &mut ctx.accounts.master_recipient_ata;

    // let ctxa: &mut BuyBond<'_> = &mut ctx.accounts;

    // msg!("Master.master_recipient: {:?}", master.master_recipient);
    // msg!("\n\nThis lock-up {:?} has {:?} gates", lockup.key(), lockup.gates.len());

    msg!("After security checks");

    // Calcilate bond amount based on the stable amount provided
    let (cut, remainder) = calculate_cut_and_remainder(amount_liquidity, PURCHASE_CUT).unwrap();

    msg!("\ncut  : {:?}\n remainder: {:?}", cut, remainder);

    // Set exchange rate
    let bond_amount: u64 = conversion(&amount_liquidity, &ibo.fixed_exchange_rate)?;

    msg!("\n\nbond_amount from conversion : {:?}", bond_amount);

    // Compound the bond amount
    let bond_amount: u64 = lockup.compounded_amount(bond_amount)?;

    // Check if it has at least one access gate
    if lockup.gates.len() > 0 {
        // Need to loop over the proveded gate indexes

        // Check if gate index exists within the lockup
        require!(lockup.gates.contains(&gate_idx), ErrorCode::IncorrectGateIndex);

        // msg!("This lock up has associated gates: {:?}", lockup.gates);
        let mut remaining_accounts_vec: Vec<AccountInfo<'_>> = ctx.remaining_accounts.to_vec();

        // Remaining acounts can't be empty
        require!(remaining_accounts_vec.len() > 0, ErrorCode::RestrictedLockup);
        let (gate_account, verification_accounts) = remaining_accounts_vec
            .split_first()
            .ok_or(ProgramError::InvalidArgument)?;

        // Check if gate index exists within the lockup
        require!(lockup.gates.contains(&gate_idx), ErrorCode::IncorrectGateIndex);
        // msg!("Index gucci. Trying out PDA derivation for gate_idx: {:?}", gate_idx);

        // Recheck that the pda is correct for the given gate account
        let (gate_pda, _bump) = Pubkey::find_program_address(
            // &[question.key().as_ref(), &[idx as u8]],
            &["gate".as_bytes(), ibo.key().as_ref(), &gate_idx.to_be_bytes()],
            &ctx.program_id
        );

        // msg!("Gate account    : {:?}", gate_pda);
        // msg!("gate_account.key: {:?}", gate_account.key());

        // Correct gate has been given
        require!(&gate_pda == gate_account.key, ErrorCode::InvalidGateAccount);
        // msg!("Provided gate matches the account");

        // Extract gate accoutn content from the remaining accounts
        let gate_acc: Account<Gate> = Account::try_from(gate_account)?;

        // Verification vector
        let mut v_vec: Vec<AccountInfo<'_>> = verification_accounts.to_vec();

        // msg!("Gates length {:?}:\n{:?}", gate_acc.gate_settings.len(), gate_acc.gate_settings);

        // Loop over gates stored in the account
        for (index, &gate_idx) in gate_acc.gate_settings.iter().enumerate() {
            // msg!("Loop item {:?} at index {:?}", gate_idx, index);

            // Loop all the addresses
            // for (i, acc) in v_vec.iter().enumerate() {
            //     msg!("Remaining account {:?} at index {:?}", acc.key, i);
            // }

            // Get instance of the gate to feed it accounts
            let gate: &GateType = gate_acc.gate_settings
                .get(index)
                .ok_or(ErrorCode::InvalidNFTAccountOwner)?;

            // let buyer_clone: Signer<'_> = accounts.buyer.clone();
            // Pass whatever accounts are left to the gate
            gate.verify(&buyer, v_vec.clone())?;

            // Call burn token function if it is the SPL one and flagged as having a conversion
            match gate {
                GateType::Spl { gate } => {
                    // Mint mathes the one stored
                    {
                        let account1: &AccountInfo<'_> = &v_vec[0];
                        let account2: &AccountInfo<'_> = &v_vec[1];
                        let amount_to_burn: u64 = bond_amount * gate.amount_per_token;
                        let mint: Account<'info, Mint> = Account::try_from(&account1)?;
                        let spl_token_account: Account<'info, TokenAccount> = Account::try_from(
                            &account2
                        )?;
                        // accounts.burn_wl(amount_to_burn, mint.clone(), spl_token_account.clone())?;

                        token::burn(
                            CpiContext::new(token_program.to_account_info(), Burn {
                                mint: mint.to_account_info(),
                                from: spl_token_account.to_account_info(),
                                authority: buyer.to_account_info(),
                            }),
                            amount_to_burn // settings.case_fee
                        )?;
                    }
                }
                _ => {}
            }

            if index < gate_acc.gate_settings.len() - 1 {
                v_vec.drain(..gate.account_drop());
            }
        }
    }

    // Within the purchase period
    require!(lockup.within_sale(ibo.live_date, ibo.end_date), ErrorCode::NotWithinSale);

    msg!("bond_amount compounded  : {:?}", bond_amount);

    // Check that there are tokens left in that lockup
    lockup.tokens_left(bond_amount)?;

    msg!("Balance recipient ata: {:?}", accounts.recipient_ata.amount);

    // Increment bonud counter
    ibo.bond_counter += 1;

    // Set total redeemable for that bond
    bond.total_claimable = bond_amount;
    bond.maturity_date = lockup.compute_bond_completion_date();

    // Transfer liquidity coin cut to us
    accounts.transfer_liquidity(cut, &accounts.master_recipient_ata)?;
    msg!("Transfered cut to master");
    accounts.transfer_liquidity(remainder, &accounts.recipient_ata)?;
    msg!("Transfered remainder to recipient");

    // Send bond calculated amonut to buyer
    msg!("Transfering {:?} from account with {:?}", bond_amount, accounts.ibo_ata.amount);
    accounts.transfer_buyer(bond_amount, ibo_idx, &ctx.program_id)?;
    msg!("Transfered bond to buyer");

    msg!("\nEnd of BuyBond");
    Ok(())
}
