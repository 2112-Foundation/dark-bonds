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

export class Mint {
  constructor(
    public connection: anchor.web3.Connection,
    public mintScAuth: anchor.web3.Keypair,
    public mintSc: PublicKey
  ) {}

  async makeAta(topUpAcc: PublicKey): Promise<Account> {
    return await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.mintScAuth,
      this.mintSc,
      topUpAcc,
      true
    );
  }

  async topUpStable(topUpAccAta: PublicKey, amount: number = 1000) {
    console.log("this.mintSc: ", this.mintSc.toBase58());
    try {
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
    } catch (e) {
      console.log(e);
    }
  }
}
