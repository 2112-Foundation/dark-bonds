/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * @category Instructions
 * @category CreateIbo
 * @category generated
 */
export type CreateIboInstructionArgs = {
  description: string
  link: string
  fixedExchangeRate: beet.bignum
  liveDate: beet.bignum
  endDate: beet.bignum
  swapCut: number
  liquidityToken: web3.PublicKey
  recipient: web3.PublicKey
}
/**
 * @category Instructions
 * @category CreateIbo
 * @category generated
 */
export const createIboStruct = new beet.FixableBeetArgsStruct<
  CreateIboInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['description', beet.utf8String],
    ['link', beet.utf8String],
    ['fixedExchangeRate', beet.u64],
    ['liveDate', beet.i64],
    ['endDate', beet.i64],
    ['swapCut', beet.u32],
    ['liquidityToken', beetSolana.publicKey],
    ['recipient', beetSolana.publicKey],
  ],
  'CreateIboInstructionArgs'
)
/**
 * Accounts required by the _createIbo_ instruction
 *
 * @property [_writable_, **signer**] admin
 * @property [_writable_] ibo
 * @property [_writable_] master
 * @category Instructions
 * @category CreateIbo
 * @category generated
 */
export type CreateIboInstructionAccounts = {
  admin: web3.PublicKey
  ibo: web3.PublicKey
  master: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const createIboInstructionDiscriminator = [
  19, 39, 169, 8, 118, 170, 246, 209,
]

/**
 * Creates a _CreateIbo_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CreateIbo
 * @category generated
 */
export function createCreateIboInstruction(
  accounts: CreateIboInstructionAccounts,
  args: CreateIboInstructionArgs,
  programId = new web3.PublicKey('8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV')
) {
  const [data] = createIboStruct.serialize({
    instructionDiscriminator: createIboInstructionDiscriminator,
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
      pubkey: accounts.master,
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
