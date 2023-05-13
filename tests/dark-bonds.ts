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

  const bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;

  const superAdmin = anchor.web3.Keypair.generate();
  const adminIbo0 = anchor.web3.Keypair.generate();
  const bondBuyer1 = anchor.web3.Keypair.generate();
  const bondBuyer2 = anchor.web3.Keypair.generate();
  const resaleBuyer1 = anchor.web3.Keypair.generate();

  const shortBond = 20;

  let bondBuyer1ATA_sc;
  let bondBuyer2ATA_sc;
  let resaleBuyer1ATA_sc;
  let iboAdminATA_sc;
  let bondBuyer1ATA_b;
  let bondBuyer2ATA_b;
  let resaleBuyer1ATA_b;

  let ticket0ATA_b;
  let ticket1ATA_b;
  let ticket2ATA_b;
  let ticket3ATA_b;

  let ticket1ResalePrice = 500;

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
  let ibo0ATA_b;

  // Tickets
  let ticket0: PublicKey;
  let ticket1: PublicKey;
  let ticket2: PublicKey;
  let ticket3: PublicKey;

  // Lock ups
  let lockUp0PDA: PublicKey;
  let lockUp0Period: number = 31536000;
  let lockUp0Apy: number = 1.2 * 100;
  let lockUp1PDA: PublicKey;
  let lockUp1Period: number = 63072000;
  let lockUp1Apy: number = 1.2 * 100;
  let lockUp2PDA: PublicKey;
  let lockUp2Period: number = shortBond;
  let lockUp2Apy: number = 10000000 * 100;

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
      topUp(resaleBuyer1.publicKey),
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

    resaleBuyer1ATA_sc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      resaleBuyer1,
      mintSC,
      resaleBuyer1.publicKey
    );

    iboAdminATA_sc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      adminIbo0,
      mintSC,
      adminIbo0.publicKey
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

    resaleBuyer1ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      resaleBuyer1,
      mintB,
      resaleBuyer1.publicKey
    );

    // Airdrop liquditi token to the accounts
    await mintTo(
      provider.connection,
      mintAuthSC,
      mintSC,
      bondBuyer1ATA_sc.address,
      mintAuthSC,
      8888888,
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
      10000000000000,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      provider.connection,
      mintAuthSC,
      mintSC,
      resaleBuyer1ATA_sc.address,
      mintAuthSC,
      10000000000,
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

    ibo0ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      adminIbo0,
      mintB,
      ibo0,
      true
    );

    await mintTo(
      provider.connection,
      mintAuthB,
      mintB,
      ibo0ATA_b.address,
      mintAuthB,
      1000000000000000,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    const tx = await bondProgram.methods
      .createIbo(
        new anchor.BN(exchangeRate),
        new anchor.BN(liveDate),
        mintSC,
        adminIbo0.publicKey
      )
      .accounts({
        mainIbo: mainIbo,
        admin: adminIbo0.publicKey,
        ibo: ibo0,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([adminIbo0])
      .rpc();
  });

  it("Add three different lockups.", async () => {
    // Derive lock up PDAs for 1,2,3
    [lockUp0PDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("lockup"),
        Buffer.from(ibo0.toBytes()),
        new BN(0).toArrayLike(Buffer, "be", 4),
      ],
      bondProgram.programId
    );
    [lockUp1PDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("lockup"),
        Buffer.from(ibo0.toBytes()),
        new BN(1).toArrayLike(Buffer, "be", 4),
      ],
      bondProgram.programId
    );
    [lockUp2PDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("lockup"),
        Buffer.from(ibo0.toBytes()),
        new BN(2).toArrayLike(Buffer, "be", 4),
      ],
      bondProgram.programId
    );
    let lockUp0Instruction = bondProgram.instruction.addLockup(
      new anchor.BN(lockUp0Period),
      new anchor.BN(lockUp0Apy),
      {
        accounts: {
          // mainIbo: mainIbo,
          admin: adminIbo0.publicKey,
          ibo: ibo0,
          lockup: lockUp0PDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
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
    let transaction = new anchor.web3.Transaction();
    transaction.add(lockUp0Instruction);
    transaction.add(lockUp1Instruction);
    transaction.add(lockUp2Instruction);
    let tx = await anchor.web3.sendAndConfirmTransaction(
      anchor.getProvider().connection,
      transaction,
      [adminIbo0],
      {
        skipPreflight: true,
        preflightCommitment: "single",
      }
    );
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

    // Get ATA for ticket0 PDA
    ticket0ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer1,
      mintB,
      ticket0,
      true
    );

    // Spend 500 for rate 1 as player 1
    const tx_lu1 = await bondProgram.methods
      .buyBonds(0, new anchor.BN(0), new anchor.BN(500))
      .accounts({
        buyer: bondBuyer1.publicKey,
        ticket: ticket0,
        ibo: ibo0,
        lockup: lockUp0PDA,
        buyerAta: bondBuyer1ATA_sc.address,
        recipientAta: iboAdminATA_sc.address,
        iboAta: ibo0ATA_b.address,
        ticketAta: ticket0ATA_b.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
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

    // let ibo0_state = await bondProgram.account.ibo.fetch(ibo0);
    // console.log("ibo0_state: ", ibo0_state.)

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

    ticket1ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer2,
      mintB,
      ticket1,
      true
    );

    // Spend 500 for rate 1 as player 1
    const tx_lu1 = await bondProgram.methods
      .buyBonds(1, new anchor.BN(0), new anchor.BN(500))
      .accounts({
        buyer: bondBuyer2.publicKey,
        ticket: ticket1,
        ibo: ibo0,
        lockup: lockUp1PDA,
        buyerAta: bondBuyer2ATA_sc.address,
        recipientAta: iboAdminATA_sc.address,
        iboAta: ibo0ATA_b.address,
        ticketAta: ticket1ATA_b.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
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

    console.log("stable coin mint: ", mintSC.toBase58());
    console.log("bond coin mint: ", mintB.toBase58());

    // Check that stablecoin balance decresed
    // Check that buyer set as the owner in the ticket
    // Check calculation of bond to receive is correct
  });

  it("Buyer 3 deposits funds at a rate 3", async () => {
    // Derive ticket from latest counter instance
    [ticket2] = await PublicKey.findProgramAddress(
      [
        Buffer.from("ticket"),
        Buffer.from(ibo0.toBytes()),
        new BN(2).toArrayLike(Buffer, "be", 4),
      ],
      bondProgram.programId
    );

    // Get ATA for ticket0 PDA
    ticket2ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer2,
      mintB,
      ticket2,
      true
    );

    // Spend 500 for rate 1 as player 1
    const tx_lu1 = await bondProgram.methods
      .buyBonds(2, new anchor.BN(0), new anchor.BN(100000000))
      .accounts({
        buyer: bondBuyer2.publicKey,
        ticket: ticket2,
        ibo: ibo0,
        lockup: lockUp2PDA,
        buyerAta: bondBuyer2ATA_sc.address,
        recipientAta: iboAdminATA_sc.address,
        iboAta: ibo0ATA_b.address,
        ticketAta: ticket2ATA_b.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([bondBuyer2])
      .rpc();

    // TODO: ticket substitition attack
    // can provide any ticket ATA right now

    let ticket1_state = await bondProgram.account.ticket.fetch(ticket2);
    console.log("ticket2 owner: ", ticket1_state.owner.toBase58());
    console.log(
      "ticket2 maturity date: ",
      ticket1_state.maturityDate.toString()
    );
    console.log(
      "ticket2 total to claim: ",
      ticket1_state.totalClaimable.toString()
    );

    // Check that stablecoin balance decresed
    // Check that buyer set as the owner in the ticket
    // Check calculation of bond to receive is correct
  });

  // it("Claim test 1", async () => {
  //   console.log("ticket: ", ticket2.toBase58());

  //   let ticektBalanceStart = await getTokenBalance(ticket2ATA_b);

  //   await delay(shortBond / 2);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo0, 2)
  //     .accounts({
  //       bondOwner: bondBuyer2.publicKey,
  //       ticket: ticket2,
  //       bondOwnerAta: bondBuyer2ATA_b.address,
  //       ticketAta: ticket2ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   // Get bond amounts
  //   let balanceBuyer = await getTokenBalance(bondBuyer2ATA_b);
  //   let ticektBalance = await getTokenBalance(ticket2ATA_b);

  //   console.log("balanceBuyer: ", balanceBuyer);
  //   console.log("ticekt: ", ticektBalance);

  //   assert(roughlyEqual(0.5, balanceBuyer / ticektBalanceStart, 10));
  // });

  // it("Claim test 1, ALMOST FUKLK amount", async () => {
  //   console.log("ticket: ", ticket2.toBase58());

  //   let ticektBalanceStart = await getTokenBalance(ticket2ATA_b);

  //   await delay(8);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo0, 2)
  //     .accounts({
  //       bondOwner: bondBuyer2.publicKey,
  //       ticket: ticket2,
  //       bondOwnerAta: bondBuyer2ATA_b.address,
  //       ticketAta: ticket2ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   // Get bond amounts
  //   let balanceBuyer = await getTokenBalance(bondBuyer2ATA_b);
  //   let ticektBalance = await getTokenBalance(ticket2ATA_b);

  //   console.log("balanceBuyer: ", balanceBuyer);
  //   console.log("ticekt: ", ticektBalance);

  //   // assert(roughlyEqual(0.5, balanceBuyer / ticektBalanceStart, 10));
  // });

  // it("Claim test 1, full", async () => {
  //   console.log("ticket: ", ticket2.toBase58());

  //   let ticektBalanceStart = await getTokenBalance(ticket2ATA_b);
  //   let ticket2_state = await bondProgram.account.ticket.fetch(ticket2);

  //   await delay(8);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo0, 2)
  //     .accounts({
  //       bondOwner: bondBuyer2.publicKey,
  //       ticket: ticket2,
  //       bondOwnerAta: bondBuyer2ATA_b.address,
  //       ticketAta: ticket2ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   // Get bond amounts
  //   let balanceBuyer = await getTokenBalance(bondBuyer2ATA_b);
  //   let ticektBalance = await getTokenBalance(ticket2ATA_b);

  //   console.log("balanceBuyer: ", balanceBuyer);
  //   console.log("ticekt: ", ticektBalance);

  //   assert(ticektBalance == 0);
  //   assert(balanceBuyer.toString() == ticket2_state.totalClaimable.toString());
  // });

  it("Split bond ticket 50%", async () => {
    console.log("ticket: ", ticket2.toBase58());

    let ticektBalanceStart = await getTokenBalance(ticket2ATA_b);
    let ticket2_state = await bondProgram.account.ticket.fetch(ticket2);

    // derive a new ticket
    [ticket3] = await PublicKey.findProgramAddress(
      [
        Buffer.from("ticket"),
        Buffer.from(ibo0.toBytes()),
        new BN(3).toArrayLike(Buffer, "be", 4),
      ],
      bondProgram.programId
    );

    // Get ATA for ticket0 PDA
    ticket3ATA_b = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer2,
      mintB,
      ticket3,
      true
    );

    // Spend 500 for rate 1 as player 1
    const tx_lu1 = await bondProgram.methods
      .split(50, ibo0, 1)
      .accounts({
        owner: bondBuyer2.publicKey,
        ticket: ticket1,
        newTicket: ticket3,
        ibo: ibo0,
        ticketAtaOld: ticket1ATA_b.address,
        ticketAtaNew: ticket3ATA_b.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bondBuyer2])
      .rpc();

    let ticket1_balance = await getTokenBalance(ticket1ATA_b);
    let ticket3_balance = await getTokenBalance(ticket1ATA_b);
    // Equal amount of tokens split
    assert(ticket1_balance - ticket3_balance == 0);
  });

  it("Set swap on the split new ticket", async () => {
    const tx_lu1 = await bondProgram.methods
      .setSwap(new BN(ticket1ResalePrice))
      .accounts({
        owner: bondBuyer2.publicKey,
        ticket: ticket1,
      })
      .signers([bondBuyer2])
      .rpc();

    let ticket1_state = await bondProgram.account.ticket.fetch(ticket1);

    console.log(
      "ticket1_state.sell_price: ",
      ticket1_state.swapPrice.toString()
    );

    assert(ticket1ResalePrice.toString() == ticket1_state.swapPrice.toString());
  });

  it("Buy bond offered on swap", async () => {
    let ticket1_state_start = await bondProgram.account.ticket.fetch(ticket1);
    console.log(
      "ticket1_state_start.owner: ",
      ticket1_state_start.owner.toBase58()
    );
    console.log("buyer: ", resaleBuyer1.publicKey.toBase58());

    const tx_lu1 = await bondProgram.methods
      .buySwap()
      .accounts({
        buyer: resaleBuyer1.publicKey,
        ticket: ticket1,
        buyerAta: resaleBuyer1ATA_sc.address,
        sellerAta: bondBuyer2ATA_sc.address,
        ibo: ibo0,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([resaleBuyer1])
      .rpc();

    let ticket1_state = await bondProgram.account.ticket.fetch(ticket1);

    // New owner set
    assert(resaleBuyer1.publicKey.toBase58() == ticket1_state.owner.toBase58());
  });
});
