/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { GateType, gateTypeBeet } from '../types/GateType'

/**
 * Arguments used to create {@link Gate}
 * @category Accounts
 * @category generated
 */
export type GateArgs = {
  gateSettings: GateType[]
}

export const gateDiscriminator = [13, 25, 212, 153, 150, 57, 225, 171]
/**
 * Holds the data for the {@link Gate} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Gate implements GateArgs {
  private constructor(readonly gateSettings: GateType[]) {}

  /**
   * Creates a {@link Gate} instance from the provided args.
   */
  static fromArgs(args: GateArgs) {
    return new Gate(args.gateSettings)
  }

  /**
   * Deserializes the {@link Gate} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [Gate, number] {
    return Gate.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Gate} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<Gate> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find Gate account at ${address}`)
    }
    return Gate.fromAccountInfo(accountInfo, 0)[0]
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
    return beetSolana.GpaBuilder.fromStruct(programId, gateBeet)
  }

  /**
   * Deserializes the {@link Gate} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Gate, number] {
    return gateBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Gate} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return gateBeet.serialize({
      accountDiscriminator: gateDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Gate} for the provided args.
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   */
  static byteSize(args: GateArgs) {
    const instance = Gate.fromArgs(args)
    return gateBeet.toFixedFromValue({
      accountDiscriminator: gateDiscriminator,
      ...instance,
    }).byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Gate} data from rent
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    args: GateArgs,
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      Gate.byteSize(args),
      commitment
    )
  }

  /**
   * Returns a readable version of {@link Gate} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      gateSettings: this.gateSettings,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const gateBeet = new beet.FixableBeetStruct<
  Gate,
  GateArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['gateSettings', beet.array(gateTypeBeet)],
  ],
  Gate.fromArgs,
  'Gate'
)
