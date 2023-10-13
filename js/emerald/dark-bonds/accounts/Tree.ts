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
 * Arguments used to create {@link Tree}
 * @category Accounts
 * @category generated
 */
export type TreeArgs = {
  treeIdx: number
  depth: number
  totalNfts: number
  vertexCounter: number
}

export const treeDiscriminator = [100, 9, 213, 154, 6, 136, 109, 55]
/**
 * Holds the data for the {@link Tree} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Tree implements TreeArgs {
  private constructor(
    readonly treeIdx: number,
    readonly depth: number,
    readonly totalNfts: number,
    readonly vertexCounter: number
  ) {}

  /**
   * Creates a {@link Tree} instance from the provided args.
   */
  static fromArgs(args: TreeArgs) {
    return new Tree(
      args.treeIdx,
      args.depth,
      args.totalNfts,
      args.vertexCounter
    )
  }

  /**
   * Deserializes the {@link Tree} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [Tree, number] {
    return Tree.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Tree} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<Tree> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find Tree account at ${address}`)
    }
    return Tree.fromAccountInfo(accountInfo, 0)[0]
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
    return beetSolana.GpaBuilder.fromStruct(programId, treeBeet)
  }

  /**
   * Deserializes the {@link Tree} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Tree, number] {
    return treeBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Tree} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return treeBeet.serialize({
      accountDiscriminator: treeDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Tree}
   */
  static get byteSize() {
    return treeBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Tree} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      Tree.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link Tree} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === Tree.byteSize
  }

  /**
   * Returns a readable version of {@link Tree} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      treeIdx: this.treeIdx,
      depth: this.depth,
      totalNfts: this.totalNfts,
      vertexCounter: this.vertexCounter,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const treeBeet = new beet.BeetStruct<
  Tree,
  TreeArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['treeIdx', beet.u16],
    ['depth', beet.u8],
    ['totalNfts', beet.u32],
    ['vertexCounter', beet.u8],
  ],
  Tree.fromArgs,
  'Tree'
)