/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from "@solana/spl-token";
import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";

/**
 * @category Instructions
 * @category BuySwap
 * @category generated
 */
export const buySwapStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "BuySwapInstructionArgs"
);
/**
 * Accounts required by the _buySwap_ instruction
 *
 * @property [_writable_, **signer**] buyer
 * @property [_writable_] bond
 * @property [] main
 * @property [] ibo
 * @property [_writable_] buyerAta
 * @property [_writable_] sellerAta
 * @property [_writable_] masterRecipientAta
 * @property [_writable_] iboAdminAta
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category BuySwap
 * @category generated
 */
export type BuySwapInstructionAccounts = {
  buyer: web3.PublicKey;
  bond: web3.PublicKey;
  main: web3.PublicKey;
  ibo: web3.PublicKey;
  buyerAta: web3.PublicKey;
  sellerAta: web3.PublicKey;
  masterRecipientAta: web3.PublicKey;
  iboAdminAta: web3.PublicKey;
  associatedTokenProgram: web3.PublicKey;
  tokenProgram?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
};

export const buySwapInstructionDiscriminator = [
  130, 102, 71, 248, 171, 112, 156, 167,
];

/**
 * Creates a _BuySwap_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category BuySwap
 * @category generated
 */
export function createBuySwapInstruction(
  accounts: BuySwapInstructionAccounts,
  programId = new web3.PublicKey("8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV")
) {
  const [data] = buySwapStruct.serialize({
    instructionDiscriminator: buySwapInstructionDiscriminator,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.buyer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.bond,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.main,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.ibo,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.buyerAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.sellerAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.masterRecipientAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.iboAdminAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.associatedTokenProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
  return ix;
}
