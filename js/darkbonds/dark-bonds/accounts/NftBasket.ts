/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { NftEntry, nftEntryBeet } from '../types/NftEntry'

/**
 * Arguments used to create {@link NftBasket}
 * @category Accounts
 * @category generated
 */
export type NftBasketArgs = {
  fillIdx: number
  data: NftEntry[]
}

export const nftBasketDiscriminator = [90, 211, 63, 176, 98, 126, 56, 115]
/**
 * Holds the data for the {@link NftBasket} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class NftBasket implements NftBasketArgs {
  private constructor(readonly fillIdx: number, readonly data: NftEntry[]) {}

  /**
   * Creates a {@link NftBasket} instance from the provided args.
   */
  static fromArgs(args: NftBasketArgs) {
    return new NftBasket(args.fillIdx, args.data)
  }

  /**
   * Deserializes the {@link NftBasket} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [NftBasket, number] {
    return NftBasket.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link NftBasket} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<NftBasket> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find NftBasket account at ${address}`)
    }
    return NftBasket.fromAccountInfo(accountInfo, 0)[0]
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
    return beetSolana.GpaBuilder.fromStruct(programId, nftBasketBeet)
  }

  /**
   * Deserializes the {@link NftBasket} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [NftBasket, number] {
    return nftBasketBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link NftBasket} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return nftBasketBeet.serialize({
      accountDiscriminator: nftBasketDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link NftBasket} for the provided args.
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   */
  static byteSize(args: NftBasketArgs) {
    const instance = NftBasket.fromArgs(args)
    return nftBasketBeet.toFixedFromValue({
      accountDiscriminator: nftBasketDiscriminator,
      ...instance,
    }).byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link NftBasket} data from rent
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    args: NftBasketArgs,
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      NftBasket.byteSize(args),
      commitment
    )
  }

  /**
   * Returns a readable version of {@link NftBasket} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      fillIdx: this.fillIdx,
      data: this.data,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const nftBasketBeet = new beet.FixableBeetStruct<
  NftBasket,
  NftBasketArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['fillIdx', beet.u16],
    ['data', beet.array(nftEntryBeet)],
  ],
  NftBasket.fromArgs,
  'NftBasket'
)