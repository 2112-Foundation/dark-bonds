import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DarkBonds } from "../target/types/dark_bonds";
import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
import {
  createMint,
  createAccount,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  transfer,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("dark-bonds", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const LAMPORTS_PER_SOL = 1000000000;

  const bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;

  const superAdmin = anchor.web3.Keypair.generate();
  const bondBuyer1 = anchor.web3.Keypair.generate();
  const bondBuyer2 = anchor.web3.Keypair.generate();

  let bondBuyer1ATA;
  let bondBuyer2ATA;

  // Stable coin mint
  let mintSC: PublicKey;
  const mintAuthSC = anchor.web3.Keypair.generate();
  const mintKeypairSC = anchor.web3.Keypair.generate();

  // Bond coin mint
  let mintB: PublicKey;
  const mintAuthB = anchor.web3.Keypair.generate();
  const mintKeypairB = anchor.web3.Keypair.generate();

  // PDA
  let mainIbo: PublicKey;

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

  before(async () => {
    await Promise.all([
      topUp(bondBuyer1.publicKey),
      topUp(bondBuyer2.publicKey),
      topUp(mintAuthSC.publicKey),
      topUp(mintKeypairSC.publicKey),
      topUp(mintAuthB.publicKey),
      topUp(mintKeypairB.publicKey),
      topUp(superAdmin.publicKey),
    ]);

    // Stablecoin mint
    mintSC = await createMint(
      provider.connection,
      mintAuthSC,
      mintAuthSC.publicKey,
      mintAuthSC.publicKey,
      10
    );

    mintB = await createMint(
      provider.connection,
      mintAuthB,
      mintAuthB.publicKey,
      mintAuthB.publicKey,
      10
    );

    // Initialise bondBuyer ATAs
    // bondBuyer1ATA = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   superAdmin,
    //   mintSC,
    //   bondBuyer1.publicKey
    // );

    // bondBuyer2ATA = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   superAdmin,
    //   mintSC,
    //   bondBuyer2.publicKey
    // );
  });

  it("Is initialized!", async () => {
    // Derive
    [mainIbo] = await PublicKey.findProgramAddress(
      [Buffer.from("main_register")],
      bondProgram.programId
    );

    // Add your test here.
    const tx = await bondProgram.methods
      .init()
      .accounts({
        mainIbo: mainIbo,
        superadmin: superAdmin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([superAdmin])
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
