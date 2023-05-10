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
import { BN } from "bn.js";
import { assert, expect } from "chai";

describe("dark-bonds", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const LAMPORTS_PER_SOL = 1000000000;

  const bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;

  const superAdmin = anchor.web3.Keypair.generate();
  const adminIbo0 = anchor.web3.Keypair.generate();
  const bondBuyer1 = anchor.web3.Keypair.generate();
  const bondBuyer2 = anchor.web3.Keypair.generate();

  let bondBuyer1ATA_sc;
  let bondBuyer2ATA_sc;
  let bondBuyer1ATA_b;
  let bondBuyer2ATA_b;

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

  // Ibo 0
  let ibo0: PublicKey;
  let exchangeRate: number = 40;
  let liveDate: number = 1683718579;
  let iboATA_b;

  // Tickets
  let ticket0: PublicKey;
  let ticket1: PublicKey;
  let ticket2: PublicKey;

  // Lock ups
  let lockUp1PDA: PublicKey;
  let lockUp1Period: number = 31536000;
  let lockUp1Apy: number = 1.2 * 100;
  let lockUp2PDA: PublicKey;
  let lockUp2Period: number = 63072000;
  let lockUp2Apy: number = 1.33 * 100;
  let lockUp3PDA: PublicKey;
  let lockUp3Period: number = 94608000;
  let lockUp3Apy: number = 1.5 * 100;

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
      topUp(adminIbo0.publicKey),
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

    // Initialise bondBuyer ATAs for the stablecoin
    bondBuyer1ATA_sc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer1,
      mintSC,
      bondBuyer1.publicKey
    );

    bondBuyer2ATA_sc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer2,
      mintSC,
      bondBuyer2.publicKey
    );

    // Initialise  ATAs for the bond token
    bondBuyer1ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer1,
      mintB,
      bondBuyer1.publicKey
    );

    bondBuyer2ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer2,
      mintB,
      bondBuyer2.publicKey
    );

    // Airdrop liquditi token to the accounts
    await mintTo(
      provider.connection,
      mintAuthSC,
      mintSC,
      bondBuyer1ATA_sc.address,
      mintAuthSC,
      10000,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      provider.connection,
      mintAuthSC,
      mintSC,
      bondBuyer2ATA_sc.address,
      mintAuthSC,
      10000,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );
  });

  it("Main register initialised!", async () => {
    // Derive
    [mainIbo] = await PublicKey.findProgramAddress(
      [Buffer.from("main_register")],
      bondProgram.programId
    );

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

  it("Register bond offering.", async () => {
    // Derive ibo pda for counter 0
    [ibo0] = await PublicKey.findProgramAddress(
      [Buffer.from("ibo_instance"), new BN(0).toArrayLike(Buffer, "le", 8)],
      bondProgram.programId
    );

    const tx = await bondProgram.methods
      .createIbo(new anchor.BN(exchangeRate), new anchor.BN(liveDate), mintSC)
      .accounts({
        mainIbo: mainIbo,
        admin: adminIbo0.publicKey,
        ibo: ibo0,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([adminIbo0])
      .rpc();
    console.log("Your transaction signature", tx);

    // derive ibo ata
    iboATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      adminIbo0,
      mintB,
      ibo0,
      true
    );

    // Mint bond tokens into the Ibo PDA derived ATA
    await mintTo(
      provider.connection,
      mintAuthB,
      mintB,
      iboATA_b.address,
      mintAuthB,
      10000,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );
  });

  it("Add three different lockups.", async () => {
    // Derive lock up PDAs for 1,2,3
    [lockUp1PDA] = await PublicKey.findProgramAddress(
      [Buffer.from("lockup"), new BN(0).toArrayLike(Buffer, "be", 4)],
      bondProgram.programId
    );
    [lockUp2PDA] = await PublicKey.findProgramAddress(
      [Buffer.from("lockup"), new BN(1).toArrayLike(Buffer, "be", 4)],
      bondProgram.programId
    );

    [lockUp3PDA] = await PublicKey.findProgramAddress(
      [Buffer.from("lockup"), new BN(2).toArrayLike(Buffer, "be", 4)],
      bondProgram.programId
    );

    let lockUp1Instruction = bondProgram.instruction.addLockup(
      new anchor.BN(lockUp1Period),
      new anchor.BN(lockUp1Apy),
      {
        accounts: {
          // mainIbo: mainIbo,
          admin: adminIbo0.publicKey,
          ibo: ibo0,
          lockup: lockUp1PDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );

    let lockUp2Instruction = bondProgram.instruction.addLockup(
      new anchor.BN(lockUp2Period),
      new anchor.BN(lockUp2Apy),
      {
        accounts: {
          // mainIbo: mainIbo,
          admin: adminIbo0.publicKey,
          ibo: ibo0,
          lockup: lockUp2PDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );

    let lockUp3Instruction = bondProgram.instruction.addLockup(
      new anchor.BN(lockUp3Period),
      new anchor.BN(lockUp3Apy),
      {
        accounts: {
          // mainIbo: mainIbo,
          admin: adminIbo0.publicKey,
          ibo: ibo0,
          lockup: lockUp3PDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );

    let transaction = new anchor.web3.Transaction();
    transaction.add(lockUp1Instruction);
    transaction.add(lockUp2Instruction);
    transaction.add(lockUp3Instruction);

    let tx = await anchor.web3.sendAndConfirmTransaction(
      anchor.getProvider().connection,
      transaction,
      [adminIbo0],
      {
        skipPreflight: false,
        preflightCommitment: "single",
      }
    );

    // TODO assert lock up counter incremented to 3
    let ibo0_state = await bondProgram.account.ibo.fetch(ibo0);
    console.log("lock up ocunter: ", ibo0_state.lockupCounter);
    assert(ibo0_state.lockupCounter == 3);

    // Check one of them for setting correct rates
  });

  it("Lock further lockups.", async () => {
    const tx_lu1 = await bondProgram.methods
      .lock()
      .accounts({
        admin: adminIbo0.publicKey,
        ibo: ibo0,
      })
      .signers([adminIbo0])
      .rpc();

    // Assert lock changed to true
    let ibo0_state = await bondProgram.account.ibo.fetch(ibo0);
    assert(ibo0_state.locked == true);
  });

  it("Buyer 1 deposits funds at a rate 1", async () => {
    // Derive ticket from latest counter instance
    [ticket0] = await PublicKey.findProgramAddress(
      [
        Buffer.from("ticket"),
        Buffer.from(ibo0.toBytes()),
        new BN(0).toArrayLike(Buffer, "be", 4),
      ],
      bondProgram.programId
    );

    // Spend 500 for rate 1 as player 1
    const tx_lu1 = await bondProgram.methods
      .buyBonds(new anchor.BN(500))
      .accounts({
        buyer: bondBuyer1.publicKey,
        ticket: ticket0,
        ibo: ibo0,
        lockup: lockUp1PDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bondBuyer1])
      .rpc();

    let ticket0_state = await bondProgram.account.ticket.fetch(ticket0);
    console.log("ticket0 owner: ", ticket0_state.owner.toBase58());
    console.log(
      "ticket0 maturity date: ",
      ticket0_state.maturityDate.toString()
    );
    console.log(
      "ticket0 total to claim: ",
      ticket0_state.totalClaimable.toString()
    );

    // Check that stablecoin balance decresed
    // Check that buyer set as the owner in the ticket
    // Check calculation of bond to receive is correct
  });

  it("Buyer 2 deposits funds at a rate 2", async () => {
    // Derive ticket from latest counter instance
    [ticket1] = await PublicKey.findProgramAddress(
      [
        Buffer.from("ticket"),
        Buffer.from(ibo0.toBytes()),
        new BN(1).toArrayLike(Buffer, "be", 4),
      ],
      bondProgram.programId
    );

    // Spend 500 for rate 1 as player 1
    const tx_lu1 = await bondProgram.methods
      .buyBonds(new anchor.BN(500))
      .accounts({
        buyer: bondBuyer2.publicKey,
        ticket: ticket1,
        ibo: ibo0,
        lockup: lockUp2PDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bondBuyer2])
      .rpc();

    let ticket1_state = await bondProgram.account.ticket.fetch(ticket1);
    console.log("ticket0 owner: ", ticket1_state.owner.toBase58());
    console.log(
      "ticket0 maturity date: ",
      ticket1_state.maturityDate.toString()
    );
    console.log(
      "ticket0 total to claim: ",
      ticket1_state.totalClaimable.toString()
    );

    // Check that stablecoin balance decresed
    // Check that buyer set as the owner in the ticket
    // Check calculation of bond to receive is correct
  });
});
