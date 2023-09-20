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
    public liquidityAta: PublicKey
  ) {}
}

export class Users {
  users: User[] = [];
  mintSc: PublicKey;

  constructor(
    public connection: anchor.web3.Connection,
    // public mintSC: PublicKey,
    public mintScAuth: anchor.web3.Keypair
  ) {}

  addMintSc(mintSc: PublicKey) {
    this.mintSc = mintSc;
  }

  async addUser() {
    const user = anchor.web3.Keypair.generate();
    // tops up sol
    this.topUp(user.publicKey);
    // Create an ATA
    const userScAta = await this.makeAta(user);
    console.log("Made ata");
    // Mints liquidity
    await this.topUpStable(userScAta);
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

  async makeAta(topUpAcc: anchor.web3.Keypair): Promise<PublicKey> {
    return (
      await getOrCreateAssociatedTokenAccount(
        this.connection,
        topUpAcc,
        this.mintSc,
        topUpAcc.publicKey
      )
    )[0];
  }

  async topUpStable(topUpAccAta: PublicKey, amount: number = 1000) {
    mintTo(
      this.connection,
      this.mintScAuth,
      this.mintSc,
      topUpAccAta,
      this.mintScAuth,
      amount,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );
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
