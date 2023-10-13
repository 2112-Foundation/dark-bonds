/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category SetSwap
 * @category generated
 */
export type SetSwapInstructionArgs = {
  sellPrice: beet.bignum
}
/**
 * @category Instructions
 * @category SetSwap
 * @category generated
 */
export const setSwapStruct = new beet.BeetArgsStruct<
  SetSwapInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['sellPrice', beet.u64],
  ],
  'SetSwapInstructionArgs'
)
/**
 * Accounts required by the _setSwap_ instruction
 *
 * @property [_writable_, **signer**] owner
 * @property [_writable_] bond
 * @category Instructions
 * @category SetSwap
 * @category generated
 */
export type SetSwapInstructionAccounts = {
  owner: web3.PublicKey
  bond: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const setSwapInstructionDiscriminator = [
  137, 100, 88, 128, 10, 173, 10, 6,
]

/**
 * Creates a _SetSwap_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category SetSwap
 * @category generated
 */
export function createSetSwapInstruction(
  accounts: SetSwapInstructionAccounts,
  args: SetSwapInstructionArgs,
  programId = new web3.PublicKey('8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV')
) {
  const [data] = setSwapStruct.serialize({
    instructionDiscriminator: setSwapInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.owner,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.bond,
      isWritable: true,
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