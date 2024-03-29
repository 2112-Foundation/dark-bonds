/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { AdminFees, adminFeesBeet } from '../types/AdminFees'
import { UserFees, userFeesBeet } from '../types/UserFees'
import { Cuts, cutsBeet } from '../types/Cuts'

/**
 * Arguments used to create {@link Master}
 * @category Accounts
 * @category generated
 */
export type MasterArgs = {
  iboCounter: beet.bignum
  masterCut: beet.bignum
  admin: web3.PublicKey
  masterRecipient: web3.PublicKey
  adminFees: AdminFees
  userFees: UserFees
  cuts: Cuts
}

export const masterDiscriminator = [168, 213, 193, 12, 77, 162, 58, 235]
/**
 * Holds the data for the {@link Master} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Master implements MasterArgs {
  private constructor(
    readonly iboCounter: beet.bignum,
    readonly masterCut: beet.bignum,
    readonly admin: web3.PublicKey,
    readonly masterRecipient: web3.PublicKey,
    readonly adminFees: AdminFees,
    readonly userFees: UserFees,
    readonly cuts: Cuts
  ) {}

  /**
   * Creates a {@link Master} instance from the provided args.
   */
  static fromArgs(args: MasterArgs) {
    return new Master(
      args.iboCounter,
      args.masterCut,
      args.admin,
      args.masterRecipient,
      args.adminFees,
      args.userFees,
      args.cuts
    )
  }

  /**
   * Deserializes the {@link Master} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [Master, number] {
    return Master.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Master} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<Master> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find Master account at ${address}`)
    }
    return Master.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      '8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, masterBeet)
  }

  /**
   * Deserializes the {@link Master} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Master, number] {
    return masterBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Master} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return masterBeet.serialize({
      accountDiscriminator: masterDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Master}
   */
  static get byteSize() {
    return masterBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Master} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      Master.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link Master} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === Master.byteSize
  }

  /**
   * Returns a readable version of {@link Master} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      iboCounter: (() => {
        const x = <{ toNumber: () => number }>this.iboCounter
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      masterCut: (() => {
        const x = <{ toNumber: () => number }>this.masterCut
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      admin: this.admin.toBase58(),
      masterRecipient: this.masterRecipient.toBase58(),
      adminFees: this.adminFees,
      userFees: this.userFees,
      cuts: this.cuts,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const masterBeet = new beet.BeetStruct<
  Master,
  MasterArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['iboCounter', beet.u64],
    ['masterCut', beet.u64],
    ['admin', beetSolana.publicKey],
    ['masterRecipient', beetSolana.publicKey],
    ['adminFees', adminFeesBeet],
    ['userFees', userFeesBeet],
    ['cuts', cutsBeet],
  ],
  Master.fromArgs,
  'Master'
)
