import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
} from "@solana/spl-token";

/**
 * Represents the Gate class with the specified fields.
 */
export class Gate {
  constructor(
    /** The mint key for the gate. */
    public mintKey: PublicKey,
    /** The master key for the gate. */
    public masterKey: PublicKey,
    /** The creator key for the gate. */
    public creatorKey: PublicKey
  ) {}
}

/**
 * Represents the LockUp class with the specified fields.
 */
export class LockUp {
  constructor(
    /** Address of the PDA. */
    public address: PublicKey,
    /** Duration in seconds for the lockup. */
    public period: number,
    /** The yearly gain for the lockup. */
    public apy: number,
    /** Determines if the lockup will be transferred to the bond. */
    public matureOnly: boolean,
    /** Has special deal on. */
    public gatePresent: boolean,
    /** Index of the gate. */
    public gateIdx: number
  ) {}
}

/**
 * Represents the Ibo class with the specified fields.
 */
export class Ibo {
  // Write Comment and field that holds on chain address of this object

  /** Determines if lockups can be further added after being set to true. */
  public lockupsLocked: boolean;

  /** Determines if IBO admin can't withdraw the underlying token until end of the session after being set to true. */
  public withdrawsLocked: boolean;

  /** Represents the underlying token for the IBO. */
  public underlyingToken: PublicKey;

  /** Address which receives the provided liquidity. */
  public recipientAddress: PublicKey;

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

  async addLockUp(
    period: number,
    apy: number,
    matureOnly: boolean,
    gateIdx?: number
  ): Promise<LockUp> {
    console.log("Using counter of: ", this.lockupCounter);
    const [lockUpPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("lockup"),
        Buffer.from(this.address.toBytes()),
        new BN(this.lockupCounter).toArrayLike(Buffer, "be", 4),
      ],
      this.parent.programAddress
    );

    // Instantiate lock wth provided styff, if gate is empty set gatPrsent to false
    const newLockUp = new LockUp(
      lockUpPda,
      period,
      apy,
      matureOnly,
      gateIdx !== undefined,
      gateIdx
    );

    // Push to the array
    this.lockups.push(newLockUp);

    // Increment the lockup counter
    this.lockupCounter++;
    return newLockUp;
  }

  constructor(
    public parent: Master,
    /** ATA for this PDA from the specified liquidity tokenx. */
    public ata: PublicKey,
    /** Address of this Ibo instance. */
    public address: PublicKey,
    /** Fixed rate of conversion between the underlying token and liquidity coin. */
    public fixedExchangeRate: number,
    /** The date when the IBO can be purchased. */
    public liveDate: number,
    /** The end date for the IBO, needs to be set. */
    public endDate: number,
    /** The cut for swaps in % x 100. */
    public swapCut: number,
    /** Token being bonded off. */
    public iboMint: PublicKey,
    /** The admin address for the IBO. */
    public admin: anchor.web3.Keypair
  ) {
    this.lockupCounter = 0;
  }
}

/**
 * Represents the Master class with the specified fields.
 */
export class Master {
  /** Address of this contract. */
  public programAddress: PublicKey;

  /** Accepted mint address for purchase. */
  public liqudityToken: PublicKey;

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

  constructor(
    programAddress: PublicKey,
    public connection: anchor.web3.Connection
  ) {
    this.programAddress = programAddress;
  }

  addLiquidtyToken(liqudityToken: PublicKey) {
    this.liqudityToken = liqudityToken;
  }

  getMasterAddress(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("main_register")],
      this.programAddress
    )[0];
  }

  async addIbo(
    fixedExchangeRate: number,
    liveDate: number,
    endDate: number,
    swapCut: number,
    iboMint: PublicKey,
    adminKey: anchor.web3.Keypair
  ): Promise<Ibo> {
    // Derive Ibo PDA address
    const iboPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("ibo_instance"),
        new BN(this.iboCounter).toArrayLike(Buffer, "be", 8),
      ],
      this.programAddress
    )[0];

    // Set ATA
    const ata = await getOrCreateAssociatedTokenAccount(
      this.connection,
      adminKey,
      iboMint,
      iboPda,
      true
    );

    console.log("diod the ATA");

    console.log("ATA address: ", ata.address.toBase58());

    const newIbo = new Ibo(
      this,
      ata.address,
      iboPda,
      fixedExchangeRate,
      liveDate,
      endDate,
      swapCut,
      iboMint,
      adminKey
    );

    // Push to the array
    this.ibos.push(newIbo);

    // Increment counter
    this.iboCounter++;
    return newIbo;
  }
}
