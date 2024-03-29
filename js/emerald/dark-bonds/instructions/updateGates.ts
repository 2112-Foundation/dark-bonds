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
 * @category UpdateGates
 * @category generated
 */
export type UpdateGatesInstructionArgs = {
  iboIdx: number
  lockupIdx: number
  gatesAdd: number[]
  gatesRemove: number[]
}
/**
 * @category Instructions
 * @category UpdateGates
 * @category generated
 */
export const updateGatesStruct = new beet.FixableBeetArgsStruct<
  UpdateGatesInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['iboIdx', beet.u32],
    ['lockupIdx', beet.u32],
    ['gatesAdd', beet.array(beet.u32)],
    ['gatesRemove', beet.array(beet.u32)],
  ],
  'UpdateGatesInstructionArgs'
)
/**
 * Accounts required by the _updateGates_ instruction
 *
 * @property [_writable_, **signer**] admin
 * @property [_writable_] ibo
 * @property [_writable_] lockup
 * @category Instructions
 * @category UpdateGates
 * @category generated
 */
export type UpdateGatesInstructionAccounts = {
  admin: web3.PublicKey
  ibo: web3.PublicKey
  lockup: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const updateGatesInstructionDiscriminator = [
  153, 195, 95, 238, 254, 223, 229, 141,
]

/**
 * Creates a _UpdateGates_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category UpdateGates
 * @category generated
 */
export function createUpdateGatesInstruction(
  accounts: UpdateGatesInstructionAccounts,
  args: UpdateGatesInstructionArgs,
  programId = new web3.PublicKey('8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV')
) {
  const [data] = updateGatesStruct.serialize({
    instructionDiscriminator: updateGatesInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.admin,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.ibo,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.lockup,
      isWritable: true,
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
