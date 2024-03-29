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

import {
  loadKeypairFromFile,
  delay,
  roughlyEqual,
  createCollectionTypeInput,
  createSplTypeInput,
  createCombinedTypeInput,
  createSameAsMainIboInput,
  createLockupPurchaseStartInput,
  createLockupPurchaseEndInput,
  createLockupPurchaseCombinedInput,
} from "./helpers";

import {
  LOCKUP_SEED,
  MAIN_SEED,
  BOND_SEED,
  IBO_SEED,
  GATE_SEED,
  LISTING_BANK_SEED,
  BOND_BANK_SEED,
  IBO_BANK_SEED,
  TREE_SEED,
  VERTEX_SEED,
  NFT_BASKET_SEED,
} from "./constants";

// export class Bond {
//   swapPrice: number = 0;
//   ownerBondAccount: Account;
//   ownerLiquidityAccount: Account;
//   getIboIdx(): number {
//     return this.parent.index;
//   }

//   setSwap(swapPrice: number) {
//     this.swapPrice = swapPrice;
//   }

//   setOwner(ownerBondAccount: Account, ownerLiquidityAccount: Account) {
//     this.ownerBondAccount = ownerBondAccount;
//     this.ownerLiquidityAccount = ownerLiquidityAccount;
//   }

//   async split(amount: number) {
//     this.amount -= amount;
//     return await this.parent.issueBond(this.lockUpIdx, amount);
//   }

//   constructor(
//     public parent: Ibo,
//     public idx: number,
//     /** Address of this bond PDA*/
//     public address: PublicKey,
//     /** This bond's token account for the mint specified in the IBO PDA */
//     public account: Account,
//     public lockUpIdx: number,
//     /** Amount in bond token to be given out. */
//     public amount: number,
//     public bondStart: number = Date.now()
//   ) {}
// }

export class Gate {
  constructor(
    /** Address of the PDA. */
    public address: PublicKey,
    /** Gate inedex within this IBO. */
    public index: number,
    /** Array of different gate settings */
    public settings: GateSetting[]
  ) {}

  /** Adds a setting type for this gate */
  public addSetting(setting: GateSetting) {
    this.settings.push(setting);
  }
}

export abstract class GateSetting {
  // Write me an abstract class that returns the struct I need to pass forward
  // abstract createInput(): {};
}

export class CollectionSetting extends GateSetting {
  constructor(
    /** The mint key for the gate. */
    public mintKey: PublicKey,
    /** The main key for the gate. */
    public masterKey: PublicKey,
    /** The creator key for the gate. */
    public creatorKey: PublicKey
  ) {
    super();
  }
  /** Get struct for submission as argument */
  // createInput(): {} {
  //   return createCollectionTypeInput(
  //     this.mintKey,
  //     this.masterKey,
  //     this.creatorKey
  //   );
  // }
}

export class SplSetting extends GateSetting {
  constructor(
    /** Address of the Mint. */
    public mint: PublicKey, // Example additional field
    /** Minnimum SPL balance needed for the gate. */
    public minnimumAccount: number, // Example additional field
    /** Address of the Mint. */
    public bondsAllowed: number // Example additional field
  ) {
    super();
  }
  // /** Get struct for submission as argument */
  // createInput(): {} {
  //   return createSplTypeInput(
  //     this.mint,
  //     this.minnimumAccount,
  //     this.bondsAllowed
  //   );
  // }
}

// /**
//  * Represents the LockUp class with the specified fields.
//  */
// export class LockUp {
//   constructor(
//     /** Address of the PDA. */
//     public address: PublicKey,
//     /** Index of this lockup gate. */
//     public index: number,
//     /** Duration in seconds for the lockup. */
//     public period: number,
//     /** The yearly gain for the lockup. */
//     public apy: number,

//     public principalRatio: number,
//     /** Determines if the lockup will be transferred to the bond. */
//     public matureOnly: boolean,
//     /** Has special deal on. */
//     public gatePresent: boolean,
//     /** Index of the gate. */
//     public gates: number[]
//   ) {}

//   /** Function that adds a variable gate index to this lock-up*/
//   addGateIdx(gateIdx: number) {
//     this.gates.push(gateIdx);
//   }

//   /**  Function that removes a particulare gate index from this lock-up */
//   removeGate(gateIdx: number) {
//     this.gates = this.gates.filter((gate) => gate !== gateIdx);
//   }
// }

/**
 * Represents the Ibo class with the specified fields.
 */
// export class Ibo {
//   // Write Comment and field that holds on chain address of this object

//   /** Determines if lockups can be further added after being set to true. */
//   public lockupsLocked: boolean;

//   /** Determines if IBO admin can't withdraw the underlying token until end of the session after being set to true. */
//   public withdrawsLocked: boolean;

//   /** Represents the underlying token for the IBO. */
//   public underlyingToken: PublicKey;

//   /** Stores ata for the account that has tokens to be bonded out. */
//   public iboCoinVault: Account;

//   /** TODO Can definitely reduce this one. */
//   public lockupCounter: number;

//   /** TODO Can definitely reduce this one. */
//   public gateCounter: number;

//   /** The bond counter for the IBO. */
//   public bondCounter: number;

//   /** TODO need to also lock withdrawal of NFTs until it's over, delete and change to tree counter. */
//   public nftCounter: number;

//   /** TODO needs to be loaded. */
//   public nftBasePrice: number;

//   /** The tree counter for the IBO. */
//   public treeCounter: number;

//   /** An array of LockUp objects associated with this Ibo. */
//   public lockups: LockUp[] = [];

//   /** An array of LockUp objects associated with this Ibo. */
//   public gates: Gate[] = [];

//   /** An array of LockUp objects associated with this Ibo. */
//   public bonds: Bond[] = [];

//   /**  Function that returns any bond that is marked as being on a swap */
//   getBondsOnSwap(): Bond[] {
//     return this.bonds.filter((bond) => bond.swapPrice > 0);
//   }

//   /** Converts between liqduid and bont tokens using the conversion and APY for this particular lock up */
//   getBondToken(lockUpIdx: number, stableAmount: number) {
//     const lockUp: LockUp = this.lockups[lockUpIdx];
//     const gains = lockUp.apy * stableAmount * (lockUp.period / 31536000);
//     return gains;
//   }

//   /** Adds bond entry to the ibo instance and icnremenets bond counter */
//   async issueBond(
//     /**Index of the lock up from which thsi bond will get rate and lockup period. */
//     lockUpIdx: number,
//     /** Amount in liquidity coin that the user is spending  */
//     amount: number
//   ) {
//     console.log("Using bond counter: ", this.bondCounter);
//     const [bondPDA] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from(BOND_SEED),
//         Buffer.from(this.address.toBytes()),
//         new BN(this.bondCounter).toArrayLike(Buffer, "be", 4),
//       ],
//       this.parent.programAddress
//     );
//     const bondAccount = await this.mintB.makeAta(bondPDA);

//     // Get how much token will be locked up
//     console.log("Getting lockup idx: ", lockUpIdx);
//     console.log("Total lock-ups: ", this.lockups.length);
//     const lockedBondToken = this.getBondToken(lockUpIdx, amount);

//     console.log("Stroign in bond class: ", amount);
//     const bond = new Bond(
//       this,
//       this.bondCounter,
//       bondPDA,
//       bondAccount,
//       lockUpIdx,
//       lockedBondToken
//     );
//     this.bondCounter++;
//     this.bonds.push(bond);
//     return bond;
//   }

//   async addLockUp(
//     period: number,
//     apy: number,
//     matureOnly: boolean,
//     principalRatio: number,
//     gateIdx?: number
//   ): Promise<LockUp> {
//     console.log("Using counter of: ", this.lockupCounter);
//     const [lockUpPda] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from(LOCKUP_SEED),
//         Buffer.from(this.address.toBytes()),
//         new BN(this.lockupCounter).toArrayLike(Buffer, "be", 4),
//       ],
//       this.parent.programAddress
//     );

//     // Instantiate lock wth provided stuff, if gate is empty set gatPrsent to false
//     const newLockUp = new LockUp(
//       lockUpPda,
//       this.lockupCounter,
//       period,
//       apy,
//       principalRatio,
//       matureOnly,
//       gateIdx !== undefined,
//       []
//     );

//     // Push to the array
//     this.lockups.push(newLockUp);

//     // Increment the lockup counter
//     this.lockupCounter++;
//     return newLockUp;
//   }
//   private async deriveGatePda(): Promise<PublicKey> {
//     const [gatePda] = await PublicKey.findProgramAddress(
//       [
//         Buffer.from(GATE_SEED),
//         Buffer.from(this.address.toBytes()),
//         new BN(this.gateCounter).toArrayLike(Buffer, "be", 4),
//       ],
//       this.parent.programAddress
//     );
//     return gatePda;
//   }

//   // Adds gate along wiht a list ot gate settings
//   async addGate(settings: GateSetting[]): Promise<Gate> {
//     const gatePda = await this.deriveGatePda();
//     const newGate = new Gate(gatePda, this.gateCounter, settings);
//     this.gates.push(newGate);
//     this.gateCounter++;
//     return newGate;
//   }

//   // async getSplGate(
//   //   mintKey: PublicKey,
//   //   bondsAllowed: number,
//   //   minimumAmount: number
//   // ): Promise<SplSettings> {
//   //   const newGate = new SplSettings(mintKey, bondsAllowed, minimumAmount);
//   //   return newGate;
//   // }

//   // async addCollectionGate(
//   //   mintKey: PublicKey,
//   //   masterKey: PublicKey,
//   //   creatorKey: PublicKey
//   // ): Promise<CollectionGate> {
//   //   const gatePda = await this.deriveGatePda();
//   //   const newGate = new CollectionGate(
//   //     gatePda,
//   //     this.gateCounter,
//   //     mintKey,
//   //     masterKey,
//   //     creatorKey
//   //   );
//   //   this.gates.push(newGate);
//   //   this.gateCounter++;
//   //   return newGate;
//   // }

//   // async addCombinedGate(
//   //   collectionMintKey: PublicKey,
//   //   collectionMasterKey: PublicKey,
//   //   collectionCreatorKey: PublicKey,
//   //   splMint: PublicKey
//   // ): Promise<CombinedGate> {
//   //   const collectionGatePda = await this.deriveGatePda();
//   //   const collectionGate = new CollectionGate(
//   //     collectionGatePda,
//   //     this.gateCounter,
//   //     collectionMintKey,
//   //     collectionMasterKey,
//   //     collectionCreatorKey
//   //   );

//   //   const splGatePda = await this.deriveGatePda();
//   //   const splGate = new SplGate(splGatePda, this.gateCounter, splMint);
//   //   const gatePda = await this.deriveGatePda();
//   //   const newGate = new CombinedGate(
//   //     gatePda,
//   //     this.gateCounter,
//   //     collectionGate,
//   //     splGate
//   //   );
//   //   this.gates.push(newGate);
//   //   this.gateCounter++;
//   //   return newGate;
//   // }

//   constructor(
//     public parent: Master,

//     /** Address of this Ibo instance. */
//     public address: PublicKey,

//     /** From origin IBO. */
//     public index: number,

//     /** Account that holds tokens being bonded off. */
//     public vaultAccount: Account,

//     /** Address which receives the provided liquidity. */
//     public recipientAddressAccount: Account,

//     /** Fixed rate of conversion between the underlying token and liquidity coin. */
//     public fixedExchangeRate: number,

//     /** The date when the IBO can be purchased. */
//     public liveDate: number,

//     /** The end date for the IBO, needs to be set. */
//     public endDate: number,

//     /** The cut for swaps in % x 100. */
//     public swapCut: number,

//     /** Token being bonded handle. */
//     public mintB: Mint,

//     /** The admin address for the IBO. */
//     public admin: anchor.web3.Keypair,

//     public liquidityMint: PublicKey
//   ) {
//     this.lockupCounter = 0;
//     this.bondCounter = 0;
//     this.gateCounter = 0;
//   }
// }

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
  // public ibos: Ibo[] = [];

  /** Applied to non-dark IBOs. Could be just hardcoded, it is. */
  public masterCut: number;

  /** Admin field, not sure if needed. */
  public admin: PublicKey;

  /** Recipient field related to the main, not sure if needed. */
  public masterRecipient: PublicKey;

  // async addIbo(
  //   fixedExchangeRate: number,
  //   liveDate: number,
  //   endDate: number,
  //   swapCut: number,
  //   mintB: Mint,
  //   liquidityMint: PublicKey,
  //   adminKey: anchor.web3.Keypair,
  //   recipientPubkey?: PublicKey
  // ): Promise<Ibo> {
  //   const [iboPda, rand] = await this.deriveIboPdaRand();

  //   // Get bonds token
  //   const iboAccount = await mintB.makeAta(iboPda);
  //   // Liwuidity gets made from the PDA rathern than admin if there is one
  //   const iboAdminLiquidityAccount = await this.mintSc.makeAta(
  //     recipientPubkey ? recipientPubkey : iboPda
  //   );
  //   const newIbo = new Ibo(
  //     this,
  //     iboPda,
  //     this.iboCounter,
  //     iboAccount,
  //     iboAdminLiquidityAccount, // This one
  //     fixedExchangeRate,
  //     liveDate,
  //     endDate,
  //     swapCut,
  //     mintB,
  //     adminKey,
  //     liquidityMint
  //   );

  //   this.ibos.push(newIbo);
  //   this.iboCounter++;
  //   return newIbo;
  // }

  async deriveIboBank(index: number): Promise<PublicKey> {
    // Derive PDA for blackbox_bank
    const [iboBank, _] = await PublicKey.findProgramAddress(
      [Buffer.from(IBO_BANK_SEED), new BN(index).toArrayLike(Buffer, "be", 2)],
      this.programAddress
    );

    return iboBank;
  }

  /** Derive PDA of the ibo from rand*/
  async deriveIboPdaRand(): Promise<[PublicKey, number[]]> {
    // Generate an array of 32 ranom numbers
    const randomNumbers: number[] = [];
    for (let i = 0; i < 32; i++) {
      randomNumbers.push(Math.floor(Math.random() * 100));
    }

    const [iboAccount, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(IBO_SEED), Buffer.from(randomNumbers)],
      this.programAddress
    );
    return [iboAccount, randomNumbers];
  }

  /** Rederive IBO from aces */
  async rederiveIboPdaRand(aces: number[]): Promise<PublicKey> {
    const [iboAccount, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(IBO_SEED), Buffer.from(aces)],
      this.programAddress
    );
    return iboAccount;
  }

  /** Derive PDA of the gate from the ibo and an index at u32 size */
  async deriveBondBankFromIbo(
    ibo: PublicKey,
    index: number
  ): Promise<PublicKey> {
    const [bondBank, _] = await PublicKey.findProgramAddress(
      [
        Buffer.from(BOND_BANK_SEED),
        Buffer.from(ibo.toBytes()),
        new BN(index).toArrayLike(Buffer, "be", 2),
      ],
      this.programAddress
    );
    return bondBank;
  }

  /** Derives bond address based on ibo address and random seed */
  async deriveBondPdaRand(ibo: PublicKey): Promise<[PublicKey, number[]]> {
    // Generate an array of 32 ranom numbers
    const randomNumbers: number[] = [];
    for (let i = 0; i < 32; i++) {
      randomNumbers.push(Math.floor(Math.random() * 100));
    }
    const [bondAccount, nonce] = await PublicKey.findProgramAddress(
      [
        Buffer.from(BOND_SEED),
        Buffer.from(ibo.toBytes()),
        Buffer.from(randomNumbers),
      ],
      this.programAddress
    );
    return [bondAccount, randomNumbers];
  }

  // Function that rederives the bond PDA from the aces and the bond address
  async rederiveBondPdaRand(
    ibo: PublicKey,
    aces: number[]
  ): Promise<PublicKey> {
    const [bondAccount, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(BOND_SEED), Buffer.from(ibo.toBytes()), Buffer.from(aces)],
      this.programAddress
    );
    return bondAccount;
  }

  /** Derive PDA of the gate from the ibo and an index at u32 size */
  async deriveGateFromIbo(ibo: PublicKey, index: number): Promise<PublicKey> {
    const [gateAccount, _] = await PublicKey.findProgramAddress(
      [
        Buffer.from(GATE_SEED),
        Buffer.from(ibo.toBytes()),
        new BN(index).toArrayLike(Buffer, "be", 2),
      ],
      this.programAddress
    );
    return gateAccount;
  }

  /** Derive PDA of the gate from the ibo and an index at u32 size */
  async deriveLockupFromIbo(ibo: PublicKey, index: number): Promise<PublicKey> {
    const [gateAccount, _] = await PublicKey.findProgramAddress(
      [
        Buffer.from(LOCKUP_SEED),
        Buffer.from(ibo.toBytes()),
        new BN(index).toArrayLike(Buffer, "be", 2),
      ],
      this.programAddress
    );
    return gateAccount;
  }

  async rederiveBlackboxPdaRand(aces: number[]): Promise<PublicKey> {
    const [iboAccount, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(IBO_SEED), Buffer.from(aces)],
      this.programAddress
    );
    return iboAccount;
  }

  constructor(
    programAddress: PublicKey,
    public connection: anchor.web3.Connection,
    public mintSc: Mint
  ) {
    this.programAddress = programAddress;
    this.address = PublicKey.findProgramAddressSync(
      [Buffer.from(MAIN_SEED)],
      this.programAddress
    )[0];
  }
}
