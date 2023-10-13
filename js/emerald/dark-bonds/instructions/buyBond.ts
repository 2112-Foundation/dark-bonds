/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category BuyBond
 * @category generated
 */
export type BuyBondInstructionArgs = {
  lockupIdx: number
  iboIdx: beet.bignum
  liquidityProvided: beet.bignum
  gateIdxs: number
}
/**
 * @category Instructions
 * @category BuyBond
 * @category generated
 */
export const buyBondStruct = new beet.BeetArgsStruct<
  BuyBondInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['lockupIdx', beet.u32],
    ['iboIdx', beet.u64],
    ['liquidityProvided', beet.u64],
    ['gateIdxs', beet.u32],
  ],
  'BuyBondInstructionArgs'
)
/**
 * Accounts required by the _buyBond_ instruction
 *
 * @property [_writable_, **signer**] buyer
 * @property [_writable_] bond
 * @property [_writable_] ibo
 * @property [] master
 * @property [_writable_] lockup
 * @property [_writable_] buyerAta
 * @property [_writable_] recipientAta
 * @property [_writable_] iboAta
 * @property [_writable_] bondAta
 * @property [_writable_] masterRecipientAta
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category BuyBond
 * @category generated
 */
export type BuyBondInstructionAccounts = {
  buyer: web3.PublicKey
  bond: web3.PublicKey
  ibo: web3.PublicKey
  master: web3.PublicKey
  lockup: web3.PublicKey
  buyerAta: web3.PublicKey
  recipientAta: web3.PublicKey
  iboAta: web3.PublicKey
  bondAta: web3.PublicKey
  masterRecipientAta: web3.PublicKey
  tokenProgram?: web3.PublicKey
  associatedTokenProgram: web3.PublicKey
  rent?: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const buyBondInstructionDiscriminator = [
  213, 80, 222, 237, 246, 145, 5, 94,
]

/**
 * Creates a _BuyBond_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category BuyBond
 * @category generated
 */
export function createBuyBondInstruction(
  accounts: BuyBondInstructionAccounts,
  args: BuyBondInstructionArgs,
  programId = new web3.PublicKey('8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV')
) {
  const [data] = buyBondStruct.serialize({
    instructionDiscriminator: buyBondInstructionDiscriminator,
    ...args,
  })
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
      pubkey: accounts.ibo,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.master,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.lockup,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.buyerAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.recipientAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.iboAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.bondAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.masterRecipientAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.associatedTokenProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.rent ?? web3.SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}