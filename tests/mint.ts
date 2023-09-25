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

/**
 * To abstract mintint and creating ATAs
 */
export class Mint {
  constructor(
    public connection: anchor.web3.Connection,
    public mintAuth: anchor.web3.Keypair,
    public mint: PublicKey
  ) {}

  async makeAta(topUpAcc: PublicKey): Promise<Account> {
    return await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.mintAuth,
      this.mint,
      topUpAcc,
      true
    );
  }

  async topUpSPl(topUpAccAta: PublicKey, amount: number = 1000) {
    console.log("this.mintSc: ", this.mint.toBase58());
    try {
      mintTo(
        this.connection,
        this.mintAuth,
        this.mint,
        topUpAccAta,
        this.mintAuth,
        amount,
        [],
        undefined,
        TOKEN_PROGRAM_ID
      );
    } catch (e) {
      console.log(e);
    }
    console.log("SPL topped up");
  }
}
