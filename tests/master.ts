import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

/**
 * Represents the Gate class with the specified fields.
 */
export class Gate {
  /** The mint key for the gate. */
  public mintKey: PublicKey;
  /** The master key for the gate. */
  public masterKey: PublicKey;
  /** The creator key for the gate. */
  public creatorKey: PublicKey;
}

/**
 * Represents the LockUp class with the specified fields.
 */
export class LockUp {
  /** Duration in seconds for the lockup. */
  public period: number;
  /** The yearly gain for the lockup. */
  public apy: number;
  /** TODO check that is zero for normal buy */
  public gateCounter: number;
  /** Determines if the lockup will be transferred to the bond. */
  public matureOnly: boolean;
  /** An array of Gate objects associated with the LockUp. */
  public gates: Gate[] = [];
}

/**
 * Represents the Ibo class with the specified fields.
 */
export class Ibo {
  /** Determines if lockups can be further added after being set to true. */
  public lockupsLocked: boolean;
  /** Determines if IBO admin can't withdraw the underlying token until end of the session after being set to true. */
  public withdrawsLocked: boolean;
  /** Fixed rate of conversion between the underlying token and liquidity coin. */
  public fixedExchangeRate: number;
  /** The cut for swaps in % x 100. */
  public swapCut: number;
  /** The date when the IBO can be purchased. */
  public liveDate: number;
  /** The end date for the IBO, needs to be set. */
  public endDate: number;
  /** Accepted mint address for purchase. */
  public liquidityToken: PublicKey;
  /** Represents the underlying token for the IBO. */
  public underlyingToken: PublicKey;
  /** Address which receives the provided liquidity. */
  public recipientAddress: PublicKey;
  /** The admin address for the IBO. */
  public admin: PublicKey;
  /** TODO Can definitely reduce this one. */
  public lockupCounter: number;
  /** The bond counter for the IBO. */
  public bondCounter: number;
  /** TODO need to also lock withdrawal of NFTs until it's over, delete and change to tree counter. */
  public nftCounter: number;
  /** TODO needs to be loaded. */
  public nftBasePrice: number;
  /** The tree counter for the IBO. */
  public treeCounter: number;
  /** An array of LockUp objects associated with the Ibo. */
  public lockups: LockUp[] = [];
}

/**
 * Represents the Master class with the specified fields.
 */
export class Master {
  /** Counter for all of the IBOs to date. */
  public iboCounter: number;

  /** Array of all Ibos to date. */
  public ibos: Ibo[] = [];

  /** Applied to non-dark IBOs. Could be just hardcoded, it is. */
  public masterCut: number;

  /** Admin field, not sure if needed. */
  public admin: PublicKey;

  /** Recipient field related to the master, not sure if needed. */
  public masterRecipient: PublicKey;

  addIbo(
    fixedExchangeRate: number,
    liveDate: number,
    endDate: number,
    swapCut: number,
    liquidityToken: PublicKey
  ): Ibo {
    const newIbo = new Ibo();
    newIbo.fixedExchangeRate = fixedExchangeRate;
    newIbo.liveDate = liveDate;
    newIbo.endDate = endDate;
    newIbo.swapCut = swapCut;
    newIbo.liquidityToken = liquidityToken;
    this.ibos.push(newIbo);
    return newIbo;
  }
}
