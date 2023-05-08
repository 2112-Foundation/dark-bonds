use anchor_lang::prelude::*;

#[account]
pub struct Ticket {
    // Owner info
    // adddress
    // pub players: [Pubkey; 2], // Picked by the person that started the game
    // pub player_ready: [bool; 2], // Picked from PDAs by player0

    // Swap
    // Swap price: if non zero someone can exucte it with a transfer otherwise not for sale

    // Subdivide

    // Payouts
    // Maturity date
    // Purchase date
    // Multipler applied
    // Total DARK left (is subtracted each time) either PDA owns balance or withdrawn from a pool
}

impl Ticket {}
