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
 * @category AddVertex1
 * @category generated
 */
export type AddVertex1InstructionArgs = {
  iboIdx: number
  treeIdx: number
  vertexIdx0: number
  vertexIdx1: number
}
/**
 * @category Instructions
 * @category AddVertex1
 * @category generated
 */
export const addVertex1Struct = new beet.BeetArgsStruct<
  AddVertex1InstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['iboIdx', beet.u32],
    ['treeIdx', beet.u8],
    ['vertexIdx0', beet.u8],
    ['vertexIdx1', beet.u8],
  ],
  'AddVertex1InstructionArgs'
)
/**
 * Accounts required by the _addVertex1_ instruction
 *
 * @property [_writable_, **signer**] admin
 * @property [_writable_] ibo
 * @property [] tree
 * @property [] vertex0
 * @property [_writable_] vertex1
 * @category Instructions
 * @category AddVertex1
 * @category generated
 */
export type AddVertex1InstructionAccounts = {
  admin: web3.PublicKey
  ibo: web3.PublicKey
  tree: web3.PublicKey
  vertex0: web3.PublicKey
  vertex1: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const addVertex1InstructionDiscriminator = [
  79, 72, 134, 247, 245, 162, 145, 86,
]

/**
 * Creates a _AddVertex1_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category AddVertex1
 * @category generated
 */
export function createAddVertex1Instruction(
  accounts: AddVertex1InstructionAccounts,
  args: AddVertex1InstructionArgs,
  programId = new web3.PublicKey('8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV')
) {
  const [data] = addVertex1Struct.serialize({
    instructionDiscriminator: addVertex1InstructionDiscriminator,
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
      pubkey: accounts.tree,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.vertex0,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.vertex1,
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
