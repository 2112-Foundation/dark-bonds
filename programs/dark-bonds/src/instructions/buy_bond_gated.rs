// use crate::errors::errors::ErrorCode;
// use crate::state::*;
// use anchor_lang::prelude::*;
// use anchor_spl::token::{ Mint, Token, TokenAccount };

// use mpl_token_metadata::accounts::Metadata;
// use crate::common::*;

// #[derive(Accounts)]
// #[instruction(lockup_idx: u32)]
// pub struct GatedSettingsdBuy<'info> {
//     #[account(mut)]
//     pub buyer: Signer<'info>,
//     #[account(seeds = ["main_register".as_bytes()], bump)]
//     pub master: Account<'info, Master>,
//     #[account(
//         init,
//         seeds = ["bond".as_bytes(), ibo.key().as_ref(), &ibo.bond_counter.to_be_bytes()], // TODO add counter
//         bump,
//         payer = buyer,
//         space = 400
//     )]
//     pub bond: Account<'info, Bond>,
//     #[account(mut)]
//     pub ibo: Account<'info, Ibo>,

//     #[account(
//         seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()], // TODO add counter
//         bump
//     )]
//     pub lockup: Account<'info, Lockup>,

//     // // TODO needs to be derived off the ibo gate counter
//     #[account(mut)]
//     pub gate: Account<'info, GatedSettings>,
//     // purchse token
//     // Provided ATA has to be same mint as the one set in ibo // TODO need same for normal buy
//     #[account(mut, token::mint = ibo.liquidity_token, token::authority = buyer)]
//     pub buyer_ata: Box<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub recipient_ata: Box<Account<'info, TokenAccount>>,
//     #[account(mut, token::mint = ibo.liquidity_token, token::authority = master.master_recipient)]
//     pub master_recipient_ata: Box<Account<'info, TokenAccount>>, // Matches specified owner and mint

//     // bond token
//     #[account(mut)]
//     pub ibo_ata: Box<Account<'info, TokenAccount>>,
//     // Check for bond substitution attack
//     #[account(mut, token::authority = bond)]
//     pub bond_ata: Box<Account<'info, TokenAccount>>,

//     pub token_program: Program<'info, Token>,
//     // pub associated_token_program: Program<'info, AssociatedToken>,
//     // pub rent: Sysvar<'info, Rent>,
//     pub system_program: Program<'info, System>,

//     // // NFT stuff
//     // mint: Account<'info, Mint>,
//     // #[account(mut, has_one = mint)]
//     // nft_token_account: Box<Account<'info, TokenAccount>>,
//     // /// CHECK:
//     // nft_metadata_account: AccountInfo<'info>,
//     // /// CHECK:
//     // nft_master_edition_account: AccountInfo<'info>,
// }

// // PDA for acceptable mints
// // Extra cut for deposit which goes on to make LP in raydium

// // below reusable code needs to be abstracted away between both purchase types

// pub fn buy_bond_gated(
//     ctx: Context<GatedSettingsdBuy>,
//     _lockup_idx: u32,
//     ibo_idx: u64,
//     stable_amount_liquidity: u64
// ) -> Result<()> {
//     // Check that the caller is the owner of the desired NFT
//     let gate: Account<'_, GatedSettings> = ctx.accounts.gate.clone();
//     // ctx.accounts.verify(gate.mint_key, gate.master_key, gate.creator_key)?;

//     let accounts: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();

//     // Call single unique verify function
//     // gate.verification.verify(accounts)?;

//     purchase_mechanics(
//         &ctx.accounts.buyer,
//         &ctx.accounts.lockup,
//         &mut ctx.accounts.ibo,
//         &mut ctx.accounts.bond,
//         &mut ctx.accounts.ibo_ata,
//         &mut ctx.accounts.bond_ata,
//         &mut ctx.accounts.buyer_ata,
//         &mut ctx.accounts.recipient_ata,
//         &mut ctx.accounts.master_recipient_ata,
//         &ctx.accounts.token_program,
//         &ctx.program_id,
//         ibo_idx,
//         stable_amount_liquidity
//     )?;

//     Ok(())
// }
