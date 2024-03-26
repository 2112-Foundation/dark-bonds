use crate::state::*;
use crate::common::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(aces: [u8; 32], description: String, link: String)]
pub struct CreateIBO<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // Must be derived from the latest counter
    #[account(
        init,
        seeds = [IBO_SEED.as_bytes(), aces.as_ref()],
        bump,
        payer = admin,
        space = IBO_BASE_SIZE + PRE + description.len() + link.len()
    )]
    pub ibo: Account<'info, Ibo>,

    // Checks for correct main account provided
    #[account(               
        mut, 
        seeds = [MAIN_SEED.as_bytes()], 
        bump = main.bump,       
    )]
    pub main: Account<'info, Main>, // TODO do that everwyehre
    pub system_program: Program<'info, System>,
}

pub fn create_ibo(
    ctx: Context<CreateIBO>,
    aces: [u8; 32],
    description: String,
    link: String,
    fixed_exchange_rate: u64,
    live_date: i64,
    end_date: i64,
    swap_cut: u32,
    liquidity_token: Pubkey,
    underlying_token: Pubkey,
    recipient: Pubkey
) -> Result<()> {
    let admin: &Signer = &mut ctx.accounts.admin;
    let ibo: &mut Account<Ibo> = &mut ctx.accounts.ibo;
    let main: &mut Account<Main> = &mut ctx.accounts.main;

    // Loop over remaining accounts
    let mut ibo_index: u16 = 0;
    let mut val_set: bool = false;
    for (idx, account) in ctx.remaining_accounts.iter().enumerate() {
        let _account_key: Pubkey = account.key();

        let mut data = account.try_borrow_mut_data()?;
        let mut ibo_bank: IboBank = IboBank::try_deserialize(&mut data.as_ref()).expect(
            "Error Deserializing Data"
        );

        // Skip if index is prior to the current one
        if ibo_bank.index != main.current_ibo_bank_counter {
            continue;
        }

        // Validate the provided account
        let (expected_pda, _) = Pubkey::find_program_address(
            &[IBO_BANK_SEED.as_ref(), &main.current_ibo_bank_counter.to_be_bytes()],
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
        if ibo_bank.has_space() {
            msg!("This bank has a total of {:?} blackboxes", ibo_bank.aces.len() as u16);
            ibo_index = ibo_bank.aces.len() as u16;
            ibo_bank.add_blackbox(aces);
            ibo_bank.try_serialize(&mut data.as_mut())?;
            val_set = true;

            // Increment the current ibo bank counter if the bank is full
            if !ibo_bank.has_space() {
                main.current_ibo_bank_counter += 1;
            }
            break;
        }
    }

    // If this is last one throw error
    if val_set == false {
        return Err(BondErrors::ToDo.into());
    }

    // Take SOL fee for creating the IBO
    take_fee(&main.to_account_info(), &admin, main.admin_fees.ibo_creation_fee, 0)?;

    // Fill out details of the new Ibo
    ibo.live_date = live_date;
    ibo.fixed_exchange_rate = fixed_exchange_rate;
    ibo.liquidity_token = liquidity_token;
    ibo.underlying_token = underlying_token;
    ibo.admin = admin.key();
    ibo.recipient_address = recipient;
    ibo.swap_cut = swap_cut as u64;
    ibo.end_date = end_date;
    ibo.bump = *ctx.bumps.get("ibo").unwrap();
    ibo.index = main.ibo_counter;

    // Set additional details for buyers
    ibo.descriptin = description;
    ibo.link = link;

    // Counter is incremebted for Ibo counter
    main.ibo_counter += 1;

    // Set permitted actions
    ibo.actions = PermittedAction::new();

    // Set this ibos bank and bank index
    ibo.bank_index = main.current_ibo_bank_counter as u16;
    ibo.ibo_index = ibo_index;

    ibo.aces = aces;

    // Increment ibo position
    Ok(())
}

// TODO a check for SOL being transfered
