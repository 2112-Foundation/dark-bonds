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
import { Mint } from "./mint";
import { now } from "@metaplex-foundation/js";

export class Bond {
  swapPrice: number = 0;
  ownerBondAccount: Account;
  ownerLiquidityAccount: Account;
  getIboIdx(): number {
    return this.parent.index;
  }

  setSwap(swapPrice: number) {
    this.swapPrice = swapPrice;
  }

  setOwner(ownerBondAccount: Account, ownerLiquidityAccount: Account) {
    this.ownerBondAccount = ownerBondAccount;
    this.ownerLiquidityAccount = ownerLiquidityAccount;
  }

  async split(amount: number) {
    this.amount -= amount;
    return await this.parent.addBond(this.lockUpIdx, amount);
  }

  constructor(
    public parent: Ibo,
    public idx: number,
    public address: PublicKey,
    public account: Account,
    public lockUpIdx: number,
    /** Amount in bond token to be given out. */
    public amount: number,
    public bondStart: number = Date.now()
  ) {}
}

/**
 * Represents the Gate class with the specified fields.
 */
export class Gate {
  constructor(
    /** Address of the PDA. */
    public address: PublicKey,
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
    /** Index of this lockup gate. */
    public index: number,
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

  /** Stores ata for the account that has tokens to be bonded out. */
  public iboCoinVault: Account;

  /** TODO Can definitely reduce this one. */
  public lockupCounter: number;

  /** TODO Can definitely reduce this one. */
  public gateCounter: number;

  /** The bond counter for the IBO. */
  public bondCounter: number;

  /** TODO need to also lock withdrawal of NFTs until it's over, delete and change to tree counter. */
  public nftCounter: number;

  /** TODO needs to be loaded. */
  public nftBasePrice: number;

  /** The tree counter for the IBO. */
  public treeCounter: number;

  /** An array of LockUp objects associated with this Ibo. */
  public lockups: LockUp[] = [];

  /** An array of LockUp objects associated with this Ibo. */
  public gates: Gate[] = [];

  /** An array of LockUp objects associated with this Ibo. */
  public bonds: Bond[] = [];

  // Function that returns any bond that is marked as being on a swap
  getBondsOnSwap(): Bond[] {
    return this.bonds.filter((bond) => bond.swapPrice > 0);
  }

  getBondToken(lockUpIdx: number, stableAmount: number) {
    const lockUp: LockUp = this.lockups[lockUpIdx];
    const gains = lockUp.apy * stableAmount * (lockUp.period / 31536000);
    return gains;
  }

  async addBond(lockUpIdx: number, amount: number) {
    console.log("Using bond counter: ", this.bondCounter);
    const [bondPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bond"),
        Buffer.from(this.address.toBytes()),
        new BN(this.bondCounter).toArrayLike(Buffer, "be", 4),
      ],
      this.parent.programAddress
    );
    const bondAccount = await this.mintB.makeAta(bondPDA);

    // Get how much token will be locked up
    const lockedBondToken = this.getBondToken(lockUpIdx, amount);

    console.log("Stroign in bond class: ", amount);
    const bond = new Bond(
      this,
      this.bondCounter,
      bondPDA,
      bondAccount,
      lockUpIdx,
      lockedBondToken
    );
    this.bondCounter++;
    this.bonds.push(bond);
    return bond;
  }

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

    // Instantiate lock wth provided stuff, if gate is empty set gatPrsent to false
    const newLockUp = new LockUp(
      lockUpPda,
      this.lockupCounter,
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
  async AddGate(
    mintKey: PublicKey,
    masterKey: PublicKey,
    editionKey: PublicKey
  ): Promise<Gate> {
    // Derive gate PDA
    const gatePda = (
      await PublicKey.findProgramAddressSync(
        [
          Buffer.from("gate"),
          Buffer.from(this.address.toBytes()),
          new BN(this.gateCounter).toArrayLike(Buffer, "be", 4),
        ],
        this.parent.programAddress
      )
    )[0];
    const newGatedSettings = new Gate(gatePda, mintKey, masterKey, editionKey);
    this.gates.push(newGatedSettings);
    this.gateCounter++;
    return newGatedSettings;
  }

  constructor(
    public parent: Master,

    /** Address of this Ibo instance. */
    public address: PublicKey,

    /** From origin IBO. */
    public index: number,

    /** Account that holds tokens being bonded off. */
    public vaultAccount: Account,

    /** Address which receives the provided liquidity. */
    public recipientAddressAccount: Account,

    /** Fixed rate of conversion between the underlying token and liquidity coin. */
    public fixedExchangeRate: number,

    /** The date when the IBO can be purchased. */
    public liveDate: number,

    /** The end date for the IBO, needs to be set. */
    public endDate: number,

    /** The cut for swaps in % x 100. */
    public swapCut: number,

    /** Token being bonded handle. */
    public mintB: Mint,

    /** The admin address for the IBO. */
    public admin: anchor.web3.Keypair,

    public liquidityMint: PublicKey
  ) {
    this.lockupCounter = 0;
    this.bondCounter = 0;
    this.gateCounter = 0;
  }
}

/**
 * Represents the Master class which contains objects mapping to PDA structures of Bonds
 */
export class Master {
  /** Address of this contract. */
  public programAddress: PublicKey;

  /** Address of this contract. */
  public address: PublicKey;

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

  async addIbo(
    fixedExchangeRate: number,
    liveDate: number,
    endDate: number,
    swapCut: number,
    mintB: Mint,
    liquidityMint: PublicKey,
    adminKey: anchor.web3.Keypair
  ): Promise<Ibo> {
    const iboPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("ibo_instance"),
        new BN(this.iboCounter).toArrayLike(Buffer, "be", 8),
      ],
      this.programAddress
    )[0];

    const iboAccount = await mintB.makeAta(iboPda);
    const liquidityAccount = await this.mintSc.makeAta(iboPda);
    const newIbo = new Ibo(
      this,
      iboPda,
      this.iboCounter,
      iboAccount,
      liquidityAccount,
      fixedExchangeRate,
      liveDate,
      endDate,
      swapCut,
      mintB,
      adminKey,
      liquidityMint
    );

    this.ibos.push(newIbo);
    this.iboCounter++;
    return newIbo;
  }
  constructor(
    programAddress: PublicKey,
    public connection: anchor.web3.Connection,
    public mintSc: Mint
  ) {
    this.programAddress = programAddress;
    this.address = PublicKey.findProgramAddressSync(
      [Buffer.from("main_register")],
      this.programAddress
    )[0];
  }
}
