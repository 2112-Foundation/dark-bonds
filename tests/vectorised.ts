import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DarkBonds } from "../target/types/dark_bonds";
import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
import {
  keypairIdentity,
  KeypairIdentityDriver,
  Metaplex,
  toBigNumber,
  token,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { loadKeypairFromFile } from "./helper";
import {
  createMint,
  createAccount,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  transfer,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { assert, expect } from "chai";

describe("dark-bonds", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const LAMPORTS_PER_SOL = 1000000000;

  function delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  async function getTokenBalance(ata) {
    return Number((await getAccount(provider.connection, ata.address)).amount);
  }

  function roughlyEqual(desired: number, actual: number, deviation: number) {
    const lowerBound = desired - desired * (deviation / 100);
    const upperBound = desired + desired * (deviation / 100);

    console.log("lowerBound: ", lowerBound);
    console.log("upperBound: ", upperBound);
    console.log("desired: ", desired);
    console.log("actual: ", actual);

    return actual >= lowerBound && actual <= upperBound;
  }

  async function topUp(topUpAcc: PublicKey) {
    {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          topUpAcc,
          200 * LAMPORTS_PER_SOL
        )
      );
    }
  }

  it("test 1", async () => {
    console.log("YO");
  });
});
