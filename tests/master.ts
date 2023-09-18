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
  // Write Comment and field that holds on chain address of this object
  /** Address of this Ibo instance. */
  public address: PublicKey;

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
  public admin: anchor.web3.Keypair;

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

  constructor(
    address: PublicKey,
    fixedExchangeRate: number,
    liveDate: number,
    endDate: number,
    swapCut: number,
    liquidityToken: PublicKey,
    adminKey: anchor.web3.Keypair
  ) {
    this.address = address;
    this.fixedExchangeRate = fixedExchangeRate;
    this.liveDate = liveDate;
    this.endDate = endDate;
    this.swapCut = swapCut;
    this.liquidityToken = liquidityToken;
    this.admin = adminKey;
  }
}

/**
 * Represents the Master class with the specified fields.
 */
export class Master {
  /** Address of this contract. */
  public programAddress: PublicKey;

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

  constructor(programAddress: PublicKey) {
    this.programAddress = programAddress;
  }

  getMasterAddress(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("main_register")],
      this.programAddress
    )[0];
  }

  addIbo(
    fixedExchangeRate: number,
    liveDate: number,
    endDate: number,
    swapCut: number,
    liquidityToken: PublicKey,
    adminKey: anchor.web3.Keypair
  ): Ibo {
    // Derive Ibo PDA address
    const iboPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("ibo_instance"),
        new BN(this.iboCounter).toArrayLike(Buffer, "be", 8),
      ],
      this.programAddress
    )[0];

    const newIbo = new Ibo(
      iboPda,
      fixedExchangeRate,
      liveDate,
      endDate,
      swapCut,
      liquidityToken,
      adminKey
    );

    // Push to the array
    this.ibos.push(newIbo);

    // Increment counter
    this.iboCounter++;
    return newIbo;
  }
}
