import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DarkBonds } from "../target/types/dark_bonds";
import { PublicKey } from "@solana/web3.js";
import {
  keypairIdentity,
  Metaplex,
  toBigNumber,
  token,
  Nft,
} from "@metaplex-foundation/js";
import { loadKeypairFromFile, delay, roughlyEqual } from "./helpers";
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
} from "@solana/spl-token";
import { assert } from "chai";
import { Ibo, LockUp, Gate, Master, Bond } from "./master";
import { User, Users } from "./user";
import { Mint } from "./mint";
import { MintSupplyMustBeZeroError } from "@metaplex-foundation/mpl-token-metadata";

const BN = anchor.BN;

describe("dark-bonds", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;

  const LAMPORTS_PER_SOL = 1000000000;

  async function getTokenBalance(ata: Account) {
    return Number((await getAccount(connection, ata.address)).amount);
  }
  async function topUp(topUpAcc: PublicKey) {
    try {
      const airdropSignature = await connection.requestAirdrop(
        topUpAcc,
        200 * LAMPORTS_PER_SOL
      );
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
      });
    } catch (error) {
      console.error(error);
    }
  }
  const bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;
  const superAdmin = loadKeypairFromFile("./master-keypair.json"); // reused so that ATA are

  console.log("DARK BONDS ID: ", bondProgram.programId.toBase58());

  //TODO move that stuff to special class allowing to access keypair and it's ATA if created.
  const adminIbo0 = anchor.web3.Keypair.generate();
  const nftWallet = anchor.web3.Keypair.generate();

  const shortBond = 16;

  let superAdminAta_sc: Account;

  // New master struc
  const mintAuthSC = anchor.web3.Keypair.generate();
  const mintKeypairSC = anchor.web3.Keypair.generate();
  let master: Master; // = new Master(bondProgram.programId, connection);
  let users: Users; // = new Users(connection, mintAuthSC);
  let mintSc: Mint;
  let mintBond: Mint;

  let ibo_index = 0;

  // Stable coin mint
  let mintSC: PublicKey;

  // Bond coin mint
  let mintB: PublicKey;
  const mintAuthB = anchor.web3.Keypair.generate();
  const mintKeypairB = anchor.web3.Keypair.generate();

  // PDA
  let mainIbo: PublicKey;

  // Ibo 0
  let ibo: Ibo;
  let exchangeRate: number = 40;
  let liveDate: number = 1683718579;

  let swapCut = 200; // aka 2.0 %

  let purchaseAmount = 500;
  let bond1ResalePrice = 100000;
  let megaPurchase = 100000000;

  // Lock ups

  let lockUp0Period: number = 31536000; // 1 year
  let lockUp0Apy: number = 1.2 * 100;
  let lockUp1Period: number = 63072000; // 2 years
  let lockUp1Apy: number = 1.2 * 100;
  let lockUp2Period: number = shortBond;
  let lockUp2Apy: number = 10000000 * 100;

  // Gated
  let lockUp3Period: number = shortBond;
  let lockUp3Apy: number = 10000000 * 100;

  // NFT
  let creatorKey: PublicKey;
  let masterKey: PublicKey;
  let collectionKey: PublicKey;
  let mintKey: PublicKey;
  let editionKey: PublicKey;

  let nftTokenAccount: PublicKey;
  let nftMetadataAccount: PublicKey;
  let nftMasteEdition_account: PublicKey;

  let metaplex = new Metaplex(connection);
  metaplex.use(keypairIdentity(nftWallet));
  let nft_handle: Nft;

  // testing
  let bond_counter = 0;
  let lockup_counter = 0;
  let masterBalance = 0;

  before(async () => {
    await Promise.all([
      topUp(mintAuthSC.publicKey),
      topUp(mintKeypairSC.publicKey),
      topUp(mintAuthB.publicKey),
      topUp(mintKeypairB.publicKey),
    ]);

    console.log("Moint top up done");

    [mintSC, mintB] = await Promise.all([
      // liquidity_token mint
      createMint(
        connection,
        mintAuthSC,
        mintAuthSC.publicKey,
        mintAuthSC.publicKey,
        10
      ),
      createMint(
        connection,
        mintAuthB,
        mintAuthB.publicKey,
        mintAuthB.publicKey,
        10
      ),
    ]);

    // init mints and load sc to user
    mintSc = new Mint(connection, mintAuthSC, mintSC);
    mintBond = new Mint(connection, mintAuthB, mintB);
    users = new Users(connection, mintSc);

    await Promise.all([
      topUp(superAdmin.publicKey),
      topUp(adminIbo0.publicKey),
      topUp(nftWallet.publicKey),
      // Add few users
      users.addUsers(10),
    ]);

    // Create SC ATAs for admin accounts
    superAdminAta_sc = await getOrCreateAssociatedTokenAccount(
      connection,
      superAdmin,
      mintSC,
      superAdmin.publicKey
    );

    // Pre mint 2 NFTs and give one to buyer 1

    const { nft } = await metaplex.nfts().create({
      uri: "https://arweave.net/123",
      name: "TESSSSST",
      sellerFeeBasisPoints: 500,
      maxSupply: toBigNumber(5),
      isMutable: false,
    });

    nft_handle = nft;

    console.log("\n\nnft: \n", nft);

    mintKey = nft.mint.address;
    masterKey = nft.creators[0].address;
    editionKey = nft.edition.address;

    console.log("editionKey: ", editionKey.toBase58());
    console.log("mintKey: ", mintKey.toBase58());
    console.log("masterKey: ", masterKey.toBase58());
    console.log("editionKey: ", editionKey.toBase58());

    nftTokenAccount = nft["token"].address;
    nftMetadataAccount = nft.metadataAddress;
    nftMasteEdition_account = nft.edition.address;

    console.log("nftTokenAccount: ", nftTokenAccount.toBase58());
    console.log("nftMetadataAccount: ", nftMetadataAccount.toBase58());
    console.log(
      "nftMasteEdition_account: ",
      nftMasteEdition_account.toBase58()
    );

    // Address for NFT
    // bondBuyer2ATA_nft = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   bondBuyer2,
    //   mintKey,
    //   bondBuyer2.publicKey
    // );
  });

  it("Main register initialised!", async () => {
    master = new Master(bondProgram.programId, connection, mintSc);
    console.log("master.address: ", master.address);
    mainIbo = master.address;
    // Check if already deployed by fetching account and if so don't deploy again
    try {
      let main_state = await bondProgram.account.master.fetch(mainIbo);
      ibo_index = parseInt(main_state.iboCounter.toString());
      console.log("\nAlreadyt deployed\n");
      console.log("ibo_index at ibo make: ", ibo_index);

      // If it exists set IBO counter
      master.iboCounter = parseInt(main_state.iboCounter.toString());
    } catch (err) {
      const tx = await bondProgram.methods
        .init()
        .accounts({
          master: mainIbo,
          superadmin: superAdmin.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([superAdmin])
        .rpc();
      console.log("Your transaction signature", tx);
    }
  });

  it("Register bond offering.", async () => {
    ibo = await master.addIbo(
      exchangeRate,
      liveDate,
      liveDate + 100000, // Can buy bonds until that point in the future
      swapCut,
      mintBond,
      mintSc.mint,
      adminIbo0
    );

    console.log("ibo.ata: ", ibo.vaultAccount.address.toBase58());

    await mintBond.topUpSPl(ibo.vaultAccount.address, 1000000000000000);

    console.log("Minted");

    const tx = await bondProgram.methods
      .createIbo(
        new BN(ibo.fixedExchangeRate),
        new BN(ibo.liveDate),
        new BN(ibo.endDate), // Can buy bonds until that point in the future
        ibo.swapCut,
        ibo.liquidityMint,
        ibo.admin.publicKey
      )
      .accounts({
        master: mainIbo,
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();
  });

  it("Add three different lockups.", async () => {
    let lockUp0 = await ibo.addLockUp(lockUp0Period, lockUp0Apy, false);
    let lockUp1 = await ibo.addLockUp(lockUp1Period, lockUp1Apy, false);
    let lockUp2 = await ibo.addLockUp(lockUp2Period, lockUp2Apy, false);

    let lockUp0Instruction = bondProgram.instruction.addLockup(
      new BN(lockUp0Period),
      new BN(lockUp0Apy),
      {
        accounts: {
          admin: ibo.admin.publicKey,
          ibo: ibo.address,
          lockup: lockUp0.address,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );
    let lockUp1Instruction = bondProgram.instruction.addLockup(
      new BN(lockUp1Period),
      new BN(lockUp1Apy),
      {
        accounts: {
          admin: ibo.admin.publicKey,
          ibo: ibo.address,
          lockup: lockUp1.address,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );
    let lockUp2Instruction = bondProgram.instruction.addLockup(
      new BN(lockUp2Period),
      new BN(lockUp2Apy),
      {
        accounts: {
          admin: ibo.admin.publicKey,
          ibo: ibo.address,
          lockup: lockUp2.address,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );
    let transaction = new anchor.web3.Transaction();
    transaction.add(lockUp0Instruction);
    transaction.add(lockUp1Instruction);
    transaction.add(lockUp2Instruction);
    try {
      let tx = await anchor.web3.sendAndConfirmTransaction(
        anchor.getProvider().connection,
        transaction,
        [ibo.admin],
        {
          skipPreflight: true,
          preflightCommitment: "single",
        }
      );
    } catch (err) {
      console.log("err: ", err);
    }
  });

  it("Add gated lockup.", async () => {
    let lockUp3 = await ibo.addLockUp(lockUp2Period, lockUp2Apy, true, 0);

    const tx = await bondProgram.methods
      .addLockup(new BN(lockUp3Period), new BN(lockUp3Apy))
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    let gate0: Gate = await ibo.addGate(mintKey, masterKey, editionKey);

    const tx2 = await bondProgram.methods
      .addGate(3, 3, gate0.mintKey, gate0.masterKey, gate0.creatorKey)
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        gate: gate0.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();
  });

  it("Lock further lockups.", async () => {
    const tx_lu1 = await bondProgram.methods
      .lock(true, true)
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
      })
      .signers([ibo.admin])
      .rpc();

    // Assert lock changed to true
    let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
    assert(ibo0_state.lockupsLocked == true);
  });

  it("Buyer 1 deposits funds at a rate 1", async () => {
    masterBalance = await getTokenBalance(superAdminAta_sc);

    // Add a bond
    console.log("superAdmin: ", superAdmin.publicKey.toBase58());

    // take some user out
    const user: User = users.users[0];

    const bond: Bond = await ibo.addBond(0, 100);

    console.log("/sc mint: ", mintSC.toBase58());
    console.log("mint buyer ata mint: ", user.liquidityAccount.mint.toBase58());
    console.log(
      "masterRecipientAta ata mint: ",
      superAdminAta_sc.mint.toBase58()
    );

    const tx_lu1 = await bondProgram.methods
      .buyBond(0, new BN(ibo.index), new BN(purchaseAmount))
      .accounts({
        buyer: user.publicKey,
        bond: bond.address,
        ibo: ibo.address,
        lockup: ibo.lockups[0].address,
        buyerAta: user.liquidityAccount.address,
        recipientAta: ibo.recipientAddressAccount.address,
        master: master.address,
        masterRecipientAta: superAdminAta_sc.address,
        iboAta: ibo.vaultAccount.address,
        bondAta: bond.account.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    bond_counter += 1;

    let bond0_state = await bondProgram.account.bond.fetch(bond.address);
    console.log("bond0 owner: ", bond0_state.owner.toBase58());
    console.log("bond0 maturity date: ", bond0_state.maturityDate.toString());
    console.log(
      "bond0 total to claim: ",
      bond0_state.totalClaimable.toString()
    );

    // let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
    // console.log("ibo0_state: ", ibo0_state.)

    let masterBalanceEnd = await getTokenBalance(superAdminAta_sc);
    console.log("masterBalanceEnd: ", masterBalanceEnd);
    assert(
      purchaseAmount * 0.05 == masterBalanceEnd,
      "take a cut of exactly 5%"
    );

    masterBalance += purchaseAmount * 0.05;

    // Check that liquidity_token balance decresed
    // Check that buyer set as the owner in the bond
    // Check calculation of bond to receive is correct
  });

  // it("Buyer 2 deposits funds at a rate 2", async () => {
  //   // Derive bond from latest counter instance
  //   [bond1] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from("bond"),
  //       Buffer.from(ibo.address.toBytes()),
  //       new BN(bond_counter).toArrayLike(Buffer, "be", 4),
  //     ],
  //     bondProgram.programId
  //   );

  //   bond1ATA_b = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     bondBuyer2,
  //     mintB,
  //     bond1,
  //     true
  //   );

  //   // Spend 500 for rate 2 as player 2
  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(1, new BN(ibo_index), new BN(purchaseAmount))
  //     .accounts({
  //       buyer: bondBuyer2.publicKey,
  //       bond: bond1,
  //       ibo: ibo.address,
  //       lockup: lockUp1PDA,
  //       master: mainIbo,
  //       buyerAta: bondBuyer2ATA_sc.address,
  //       recipientAta: iboAdmin0ATA_sc.address,
  //       masterRecipientAta: superAdminAta_sc.address,
  //       iboAta: ibo0ATA_b.address,
  //       bondAta: bond1ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   bond_counter += 1;

  //   let bond1_state = await bondProgram.account.bond.fetch(bond1);
  //   console.log("bond0 owner: ", bond1_state.owner.toBase58());
  //   console.log("bond0 maturity date: ", bond1_state.maturityDate.toString());
  //   console.log(
  //     "bond0 total to claim: ",
  //     bond1_state.totalClaimable.toString()
  //   );

  //   console.log("stable coin mint: ", mintSC.toBase58());
  //   console.log("bond coin mint: ", mintB.toBase58());

  //   let masterBalanceEnd = await getTokenBalance(superAdminAta_sc);
  //   console.log("masterBalanceEnd: ", masterBalanceEnd);
  //   assert(
  //     purchaseAmount * 0.05 == masterBalanceEnd - masterBalance,
  //     "take a cut of exactly 5%"
  //   );

  //   masterBalance += purchaseAmount * 0.05;

  //   // Check that liquidity_token balance decresed
  //   // Check that buyer set as the owner in the bond
  //   // Check calculation of bond to receive is correct
  // });

  // it("Buyer 3 deposits funds at a rate 3", async () => {
  //   // Derive bond from latest counter instance
  //   [bond2] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from("bond"),
  //       Buffer.from(ibo.address.toBytes()),
  //       new BN(bond_counter).toArrayLike(Buffer, "be", 4),
  //     ],
  //     bondProgram.programId
  //   );

  //   // Get ATA for bond0 PDA
  //   bond2ATA_b = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     bondBuyer2,
  //     mintB,
  //     bond2,
  //     true
  //   );

  //   // Spend mega amount for rate 3 as player 3
  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(2, new BN(ibo_index), new BN(megaPurchase))
  //     .accounts({
  //       buyer: bondBuyer2.publicKey,
  //       bond: bond2,
  //       ibo: ibo.address,
  //       lockup: lockUp2PDA,
  //       master: mainIbo,
  //       buyerAta: bondBuyer2ATA_sc.address,
  //       recipientAta: iboAdmin0ATA_sc.address,
  //       masterRecipientAta: superAdminAta_sc.address,
  //       iboAta: ibo0ATA_b.address,
  //       bondAta: bond2ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   bond_counter += 1;

  //   // TODO: bond substitition attack
  //   // can provide any bond ATA right now

  //   let bond1_state = await bondProgram.account.bond.fetch(bond2);
  //   console.log("bond2 owner: ", bond1_state.owner.toBase58());
  //   console.log("bond2 maturity date: ", bond1_state.maturityDate.toString());
  //   console.log(
  //     "bond2 total to claim: ",
  //     bond1_state.totalClaimable.toString()
  //   );

  //   let masterBalanceEnd = await getTokenBalance(superAdminAta_sc);
  //   console.log("masterBalance:          ", masterBalance);
  //   console.log("masterBalanceEnd:       ", masterBalanceEnd);
  //   console.log("megaPurchase:           ", megaPurchase);
  //   console.log("megaPurchase * 0.05:    ", megaPurchase * 0.05);
  //   console.log(
  //     "masterBalanceEnd - masterBalance: ",
  //     masterBalanceEnd - masterBalance
  //   );
  //   assert(
  //     megaPurchase * 0.05 == masterBalanceEnd - masterBalance,
  //     "take a cut of exactly 5%"
  //   );

  //   masterBalance += masterBalanceEnd;

  //   // Check that liquidity_token balance decresed
  //   // Check that buyer set as the owner in the bond
  //   // Check calculation of bond to receive is correct
  // });

  // it("Claim test 1", async () => {
  //   console.log("bond: ", bond2.toBase58());

  //   let bondBalanceStart = await getTokenBalance(bond2ATA_b);
  //   let bond1_state = await bondProgram.account.bond.fetch(bond2);
  //   let bondStartTime = parseInt(bond1_state.bondStart.toString());

  //   let time_now_s = new Date().getTime() / 1000;

  //   console.log("bond started: ", bondStartTime);
  //   console.log("bond end at:  ", bondStartTime + shortBond);
  //   console.log("time now:     ", time_now_s);
  //   let time_elapsed = time_now_s - bondStartTime;
  //   console.log("time elapsed: ", time_elapsed);

  //   await delay(shortBond / 2 - time_elapsed);

  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo.address, 2)
  //     .accounts({
  //       bondOwner: bondBuyer2.publicKey,
  //       bond: bond2,
  //       bondOwnerAta: bondBuyer2ATA_b.address,
  //       bondAta: bond2ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   // Get bond amounts
  //   let balanceBuyer = await getTokenBalance(bondBuyer2ATA_b);
  //   let bondBalance = await getTokenBalance(bond2ATA_b);

  //   console.log("balanceBuyer: ", balanceBuyer);
  //   console.log("bond: ", bondBalance);

  //   assert(roughlyEqual(0.5, balanceBuyer / bondBalanceStart, 15));
  // });

  // it("Claim test 1, almost full amount", async () => {
  //   console.log("bond: ", bond2.toBase58());

  //   let bondBalanceStart = await getTokenBalance(bond2ATA_b);

  //   await delay(8);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo.address, 2)
  //     .accounts({
  //       bondOwner: bondBuyer2.publicKey,
  //       bond: bond2,
  //       bondOwnerAta: bondBuyer2ATA_b.address,
  //       bondAta: bond2ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   // Get bond amounts
  //   let balanceBuyer = await getTokenBalance(bondBuyer2ATA_b);
  //   let bondBalance = await getTokenBalance(bond2ATA_b);

  //   console.log("balanceBuyer: ", balanceBuyer);
  //   console.log("bond: ", bondBalance);

  //   // assert(roughlyEqual(0.5, balanceBuyer / bondBalanceStart, 10));
  // });

  // it("Claim test 1, full", async () => {
  //   console.log("bond: ", bond2.toBase58());

  //   let bondBalanceStart = await getTokenBalance(bond2ATA_b);
  //   let bond2_state = await bondProgram.account.bond.fetch(bond2);

  //   await delay(8);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo.address, 2)
  //     .accounts({
  //       bondOwner: bondBuyer2.publicKey,
  //       bond: bond2,
  //       bondOwnerAta: bondBuyer2ATA_b.address,
  //       bondAta: bond2ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   // Get bond amounts
  //   let balanceBuyer = await getTokenBalance(bondBuyer2ATA_b);
  //   let bondBalance = await getTokenBalance(bond2ATA_b);

  //   console.log("balanceBuyer: ", balanceBuyer);
  //   console.log("bond: ", bondBalance);

  //   assert(bondBalance == 0);
  //   assert(balanceBuyer.toString() == bond2_state.totalClaimable.toString());
  // });

  // it("Split bond bond 50%", async () => {
  //   console.log("bond: ", bond2.toBase58());

  //   let bondBalanceStart = await getTokenBalance(bond2ATA_b);
  //   let bond2_state = await bondProgram.account.bond.fetch(bond2);

  //   let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
  //   console.log("\n\n\nibo0_state start: ", ibo0_state.bondCounter.toString());

  //   // derive a new bond
  //   [bond3] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from("bond"),
  //       Buffer.from(ibo.address.toBytes()),
  //       new BN(3).toArrayLike(Buffer, "be", 4),
  //     ],
  //     bondProgram.programId
  //   );

  //   // Get ATA for bond0 PDA
  //   bond3ATA_b = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     bondBuyer2,
  //     mintB,
  //     bond3,
  //     true
  //   );

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .split(50, ibo.address, 1)
  //     .accounts({
  //       owner: bondBuyer2.publicKey,
  //       bond: bond1,
  //       newBond: bond3,
  //       master: mainIbo,
  //       ibo: ibo.address,
  //       bondAtaOld: bond1ATA_b.address,
  //       bondAtaNew: bond3ATA_b.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   let bond1_balance = await getTokenBalance(bond1ATA_b);
  //   let bond3_balance = await getTokenBalance(bond1ATA_b);
  //   // Equal amount of tokens split
  //   assert(bond1_balance - bond3_balance == 0);

  //   let ibo0_state_end = await bondProgram.account.ibo.fetch(ibo.address);
  //   console.log(
  //     "\n\n\nibo0_state end: ",
  //     ibo0_state_end.bondCounter.toString()
  //   );
  // });

  // it("Set swap on the split new bond", async () => {
  //   const tx_lu1 = await bondProgram.methods
  //     .setSwap(new BN(bond1ResalePrice))
  //     .accounts({
  //       owner: bondBuyer2.publicKey,
  //       bond: bond1,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();

  //   let bond1_state = await bondProgram.account.bond.fetch(bond1);

  //   console.log("bond1_state.sell_price: ", bond1_state.swapPrice.toString());

  //   assert(bond1ResalePrice.toString() == bond1_state.swapPrice.toString());
  // });

  // it("Buy bond offered on swap", async () => {
  //   let bond1_state_start = await bondProgram.account.bond.fetch(bond1);
  //   console.log(
  //     "bond1_state_start.owner: ",
  //     bond1_state_start.owner.toBase58()
  //   );
  //   console.log("buyer: ", resaleBuyer1.publicKey.toBase58());

  //   const tx_lu1 = await bondProgram.methods
  //     .buySwap()
  //     .accounts({
  //       buyer: resaleBuyer1.publicKey,
  //       bond: bond1,
  //       buyerAta: resaleBuyer1ATA_sc.address,
  //       master: mainIbo,
  //       masterRecipientAta: superAdminAta_sc.address,
  //       sellerAta: bondBuyer2ATA_sc.address,
  //       ibo: ibo.address,
  //       iboAdminAta: iboAdmin0ATA_sc.address,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([resaleBuyer1])
  //     .rpc();

  //   let bond1_state = await bondProgram.account.bond.fetch(bond1);

  //   // New owner set
  //   assert(resaleBuyer1.publicKey.toBase58() == bond1_state.owner.toBase58());
  // });

  // it("Buy gated bond offered on ibo", async () => {
  //   let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
  //   // assert(ibo0_state.lockupsLocked == true);

  //   console.log("bond counter: ", ibo0_state.bondCounter);

  //   [bond4] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from("bond"),
  //       Buffer.from(ibo.address.toBytes()),
  //       new BN(4).toArrayLike(Buffer, "be", 4),
  //     ],
  //     bondProgram.programId
  //   );

  //   console.log("bond4 pda address: ", bond4.toBase58());

  //   bond4ATA_b = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     bondBuyer2,
  //     mintB,
  //     bond4,
  //     true
  //   );

  //   console.log("nftWallet.publicKey: ", nftWallet.publicKey.toBase58());

  //   // send that lad NFT
  //   await metaplex.nfts().transfer({
  //     nftOrSft: nft_handle,
  //     authority: nftWallet,
  //     fromOwner: nftWallet.publicKey,
  //     toOwner: bondBuyer2.publicKey,
  //     amount: token(1),
  //   });

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .buyBondGated(3, new BN(ibo_index), new BN(10000))
  //     .accounts({
  //       buyer: bondBuyer2.publicKey,
  //       bond: bond4,
  //       ibo: ibo.address,
  //       lockup: lockUp3PDA,
  //       gate: gate1,
  //       master: mainIbo,
  //       buyerAta: bondBuyer2ATA_sc.address,
  //       recipientAta: iboAdmin0ATA_sc.address,
  //       iboAta: ibo0ATA_b.address,
  //       bondAta: bond4ATA_b.address,
  //       masterRecipientAta: superAdminAta_sc.address,

  //       // NFT
  //       mint: mintKey,
  //       nftTokenAccount: bondBuyer2ATA_nft.address,
  //       nftMasterEditionAccount: nftMasteEdition_account,
  //       nftMetadataAccount: nftMetadataAccount,

  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     })
  //     .signers([bondBuyer2])
  //     .rpc();
  // });
});
