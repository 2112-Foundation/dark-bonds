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

export class Bond {
  iboIdx: number;
  amount: number;
}

export class User {
  constructor(
    /** Private key */
    public secretKey: Uint8Array,
    /** Public address */
    public publicKey: PublicKey,
    /** Liquidity ATA address */
    public liquidityAccount: Account
  ) {}
}

export class Users {
  users: User[] = [];
  mintSc: PublicKey;

  constructor(
    public connection: anchor.web3.Connection, // public mintSC: PublicKey, // public mintScAuth: anchor.web3.Keypair
    public mintSC: Mint
  ) {}

  async addUser() {
    const user = anchor.web3.Keypair.generate();

    // Tops up sol
    await this.topUp(user.publicKey);

    // Create an ATA
    const userScAta = await this.mintSC.makeAta(user.publicKey);
    await this.mintSC.topUpSPl(userScAta.address);
    const userStruct = new User(user.secretKey, user.publicKey, userScAta);
    this.users.push(userStruct);
  }

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
