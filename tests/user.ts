import * as anchor from "@project-serum/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
import { Bond } from "./master";
import { USER_ACCOUNT_SEED, BOND_POINTER_SEED } from "./constants";

export class User {
  /** Bond's owned by the user */
  public bonds: Bond[] = [];
  public bondPointers: PublicKey[] = [];
  public bondCounter: number = 0;
  constructor(
    /** parent */
    public parent: Users,
    /** Private key */
    public secretKey: Uint8Array,
    /** Public address */
    public publicKey: PublicKey,
    /** Liquidity ATA address */
    public liquidityAccount: Account,
    /** Accountn for look ups of bond positions */
    public userAccount: PublicKey
  ) {}

  async issueBond(bond: Bond): Promise<Bond> {
    // Set owner of bond to be user
    bond.setOwner(
      await bond.parent.mintB.makeAta(this.publicKey),
      this.liquidityAccount
    );
    this.bonds.push(bond);

    // Increment counter
    this.bondCounter += 1;
    return bond;
  }

  // Get bond pointer address
  async getBondPointerAddress(): Promise<PublicKey> {
    const [bondPointerAddress, nonce] = await PublicKey.findProgramAddress(
      [
        Buffer.from(BOND_POINTER_SEED),
        this.publicKey.toBuffer(),
        new BN(this.bondCounter).toArrayLike(Buffer, "be", 2),
      ],
      this.parent.bondProgramAddress
    );

    this.bondPointers.push(bondPointerAddress);
    return bondPointerAddress;
  }

  removeBond(/** Index of users bond */ bondIdx: number): Bond {
    const retBP = this.bonds[bondIdx];
    this.bonds.splice(bondIdx, 1);
    return retBP;
  }
}

export class Users {
  users: User[] = [];
  mintSc: PublicKey;
  constructor(
    public connection: anchor.web3.Connection,
    public mintSC: Mint,
    public bondProgramAddress: PublicKey
  ) {}

  /** Changes bond owner from user x to user y in the ownership mappings for this IBO */
  async transferBond(
    /** Index of user x */ userFromIdx: number,
    /** Index of user y */ userToIdx: number,
    /** Index of bond */ bondIdx: number,
    /** Amount of bond to transfer */ amount: number
  ) {
    // Get bond to transfer
    const bond: Bond = this.users[userFromIdx].removeBond(bondIdx);

    // Add bond to user y
    await this.users[userToIdx].issueBond(bond);
  }

  async addUser() {
    const user = anchor.web3.Keypair.generate();

    // Tops up sol
    await this.topUp(user.publicKey);

    // Create the PDA for users account
    const [userAccount, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(USER_ACCOUNT_SEED), user.publicKey.toBuffer()],
      this.bondProgramAddress
    );

    // Create an ATA
    const userScAta = await this.mintSC.makeAta(user.publicKey);
    await this.mintSC.topUpSPl(userScAta.address, 100000000);
    const userStruct = new User(
      this,
      user.secretKey,
      user.publicKey,
      userScAta,
      userAccount
    );
    this.users.push(userStruct);
  }

  /** Adds a batch of users to the class array and tops each up with the stable coin */
  async addUsers(users: number) {
    const promises = [];
    for (let i = 0; i < users; i++) {
      promises.push(this.addUser());
    }
    await Promise.all(promises);
  }

  async topUp(topUpAcc: PublicKey, amount: number = 200) {
    try {
      const airdropSignature = await this.connection.requestAirdrop(
        topUpAcc,
        amount * LAMPORTS_PER_SOL
      );
      const latestBlockHash = await this.connection.getLatestBlockhash();
      await this.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
      });
    } catch (error) {
      console.error(error);
    }
  }
}
