use crate::errors::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(ibo_idx: u32, lockup_idx: u32)]
pub struct AddGate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin, constraint = ibo.lockups_locked == false @ErrorCode::RatesLocked)]
    pub ibo: Account<'info, Ibo>,
    #[account(seeds = ["lockup".as_bytes(), ibo.key().as_ref(), &lockup_idx.to_be_bytes()], bump)]
    pub lockup: Account<'info, Lockup>,
    #[account(
        init,
        seeds = ["gate".as_bytes(), ibo.key().as_ref(), &ibo.gate_counter.to_be_bytes()],
        bump,
        payer = admin,
        space = 400 // TODO fetch size based on bool
    )]
    pub gate: Account<'info, Gate>,
    pub system_program: Program<'info, System>,
}

// Need to feed acounts to set in within th gate
// TODO first or second argument is redundant
pub fn add_gate(
    ctx: Context<AddGate>,
    _ibo_idx: u32,
    _lockup_idx: u32,
    mint_key: Pubkey,
    creator_key: Pubkey,
    master_key: Pubkey,
    gate_type: bool
) -> Result<()> {
    let lockup: &mut Account<Lockup> = &mut ctx.accounts.lockup;
    let gate: &mut Account<Gate> = &mut ctx.accounts.gate;

    // Match gate type
    if gate_type {
        // Instantiate spl type here
        let spl: SplData = SplData {
            mint_key: mint_key,
        };

        gate.verification = GateType::Spl(spl);
    } else {
        let nft: CollectionData = CollectionData {
            mint_key: mint_key,
            master_key: master_key,
            creator_key: creator_key,
        };

        // Instrantu

        gate.verification = GateType::Collection(nft);
    }

    // Increment individuall gate counter
    lockup.gate_counter += 1;

    Ok(())
}
