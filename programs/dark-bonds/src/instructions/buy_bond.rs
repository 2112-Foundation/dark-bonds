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
    gate_idx: u32
) -> Result<()> {
    let buyer: &Signer = &mut ctx.accounts.buyer;
    let master: &mut Account<Master> = &mut ctx.accounts.master;
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;

    msg!("Master.master_recipient: {:?}", master.master_recipient);
    msg!("\n\nThis lock-up {:?} has {:?} gates", lockup.key(), lockup.gates.len());

    // Check if it has at least one access gate
    if lockup.gates.len() > 0 {
        msg!("This lock up has associated gate");
        let remaining_accounts_vec = ctx.remaining_accounts.to_vec();

        // Remaining acounts can't be empty
        require!(remaining_accounts_vec.len() > 0, ErrorCode::RestrictedLockup);
        let (gate_account, verification_accounts) = remaining_accounts_vec
            .split_first()
            .ok_or(ProgramError::InvalidArgument)?;

        // Check if gate index exists within the lockup
        require!(lockup.gates.contains(&gate_idx), ErrorCode::IncorrectGateIndex);

        msg!("Index gucci");

        // Recheck that the pda is correct for the given gate account
        let (gate_pda, _bump) = Pubkey::find_program_address(
            // &[question.key().as_ref(), &[idx as u8]],
            &["gate".as_bytes(), ibo.key().as_ref(), &gate_idx.to_be_bytes()],
            &ctx.program_id
        );

        // Correct gate has been given
        require!(&gate_pda == gate_account.key, ErrorCode::InvalidGateAccount);

        msg!("Gate is gucci");

        // Extract gate from the remaining accounts
        let gate: Account<GatedSettings> = Account::try_from(gate_account)?;

        // Call on the gate to check the remaining accounts
        gate.verification.verify(&buyer.key(), verification_accounts.to_vec())?;
    }

    // If so extarct remainign and verify it
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
