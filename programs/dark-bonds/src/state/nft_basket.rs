// use anchor_lang::prelude::*;

// #[account]
// pub struct NftBasket {
//     fill_idx: usize,
//     // data: Vec<NftEntry>, //; 300],
// }

// // impl NftBasket {
// //     pub fn all_taken(&self) -> bool {
// //         for entry in self.data.iter() {
// //             if entry.taken {
// //                 return true;
// //             }
// //         }
// //         false
// //     }

// //     pub fn add_entry(&mut self, nft_address: &Pubkey) {
// //         self.data[self.fill_idx].address = *nft_address;
// //         self.data[self.fill_idx].taken = false;
// //         self.fill_idx += 1;
// //     }
// // }

// #[derive(Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
// pub struct NftEntry {
//     pub address: Pubkey,
//     pub taken: bool,
// }
