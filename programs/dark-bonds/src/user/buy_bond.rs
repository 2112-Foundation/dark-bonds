use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token::{ Token, TokenAccount } };

use solana_program::pubkey::Pubkey;

use crate::common::*;

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

// PDA for acceptable mints
// Extra cut for deposit which goes on to make LP in raydium

pub fn buy_bond(
    ctx: Context<BuyBond>,
    _lockup_idx: u32,
    ibo_idx: u64,
    stable_amount_liquidity: u64,
    gate_idx: u32 // This needs to be an array of gates
) -> Result<()> {
    let buyer: &Signer = &mut ctx.accounts.buyer;
    let master: &mut Account<Master> = &mut ctx.accounts.master;
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    // msg!("Master.master_recipient: {:?}", master.master_recipient);
    // msg!("\n\nThis lock-up {:?} has {:?} gates", lockup.key(), lockup.gates.len());

    // Check if it has at least one access gate
    if lockup.gates.len() > 0 {
        // Need to loop over the proveded gate indexes

        // Check if gate index exists within the lockup
        require!(lockup.gates.contains(&gate_idx), ErrorCode::IncorrectGateIndex);

        msg!("This lock up has associated gates: {:?}", lockup.gates);
        let mut remaining_accounts_vec: Vec<AccountInfo<'_>> = ctx.remaining_accounts.to_vec();

        // Remaining acounts can't be empty
        require!(remaining_accounts_vec.len() > 0, ErrorCode::RestrictedLockup);
        let (gate_account, verification_accounts) = remaining_accounts_vec
            .split_first()
            .ok_or(ProgramError::InvalidArgument)?;

        // Check if gate index exists within the lockup
        require!(lockup.gates.contains(&gate_idx), ErrorCode::IncorrectGateIndex);
        msg!("Index gucci. Trying out PDA derivation for gate_idx: {:?}", gate_idx);

        // Recheck that the pda is correct for the given gate account
        let (gate_pda, _bump) = Pubkey::find_program_address(
            // &[question.key().as_ref(), &[idx as u8]],
            &["gate".as_bytes(), ibo.key().as_ref(), &gate_idx.to_be_bytes()],
            &ctx.program_id
        );

        // Correct gate has been given
        require!(&gate_pda == gate_account.key, ErrorCode::InvalidGateAccount);
        msg!("Provided gate matches the account");

        // Extract gate accoutn content from the remaining accounts
        let gate_acc: Account<Gate> = Account::try_from(gate_account)?;

        // Verification vector
        let mut v_vec: Vec<AccountInfo<'_>> = verification_accounts.to_vec();

        // Loop over gates stored in the account
        for (index, &gate_idx) in gate_acc.gate_settings.iter().enumerate() {
            msg!("Loop item {:?}", gate_idx);

            // Get instance of the gate to feed it accounts
            let gate: &GateType = gate_acc.gate_settings
                .get(index)
                .ok_or(ErrorCode::InvalidNFTAccountOwner)?;

            // msg!("Gate is gucci");

            // Pass whatever accounts are left to the gate
            gate.verify(&buyer.key(), v_vec.clone())?;

            if index < gate_acc.gate_settings.len() - 1 {
                v_vec.drain(gate.account_drop()..);
            }
        }

        // Process each gate type provided by the user

        // Call on the gate to check the remaining accounts
        // gate.gate_settings.process(&buyer.key(), verification_accounts.to_vec())?;

        // substract from the total amount of liquidity
        // Chec if of type SPL that has a cut associated

        // TODO process bruning so need token account and the mint, or just one of them

        // Check if gate gate_settings matches SPL one or combined

        // if gate.gate_settings == GateType::Spl {
        // }
    }

    // msg!("After security checks");

    // Ensure lock up pruchase period does not overrule the IBO pruchase period
    // Set start time and end time based on lock up and then check if time now is within it

    // If so extarct remainign and process it
    purchase_mechanics(
        &ctx.accounts.buyer,
        &ctx.accounts.lockup,
        ibo,
        &mut ctx.accounts.bond,
        &mut ctx.accounts.ibo_ata,
        &mut ctx.accounts.bond_ata,
        &mut ctx.accounts.buyer_ata,
        &mut ctx.accounts.recipient_ata,
        &mut ctx.accounts.master_recipient_ata,
        &ctx.accounts.token_program,
        &ctx.program_id,
        ibo_idx,
        stable_amount_liquidity
    )?;

    Ok(())
}
