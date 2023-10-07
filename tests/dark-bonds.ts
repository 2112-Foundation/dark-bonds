import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { DarkBonds } from "../target/types/dark_bonds";
import { PublicKey } from "@solana/web3.js";
import {
  keypairIdentity,
  Metaplex,
  toBigNumber,
  token,
  Nft,
} from "@metaplex-foundation/js";
import {
  loadKeypairFromFile,
  delay,
  roughlyEqual,
  createCollectionTypeInput,
  createSplTypeInput,
  createCombinedTypeInput,
  createSameAsMainIboInput,
  createLockupPurchaseStartInput,
  createLockupPurchaseEndInput,
  createLockupPurchaseCombinedInput,
} from "./helpers";
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
} from "@solana/spl-token";
import { assert, use } from "chai";
import {
  Ibo,
  LockUp,
  Master,
  Bond,
  Gate,
  // CollectionGate,
  // SplGate,
  // CombinedGate,
  SplSetting,
  CollectionSetting,
} from "./master";
import { User, Users } from "./user";
import { Mint } from "./mint";
import { MintSupplyMustBeZeroError } from "@metaplex-foundation/mpl-token-metadata";
import { CollectionsMaster, NftMint0, NftMint1 } from "./derived_nfts";

//
const BN = anchor.BN;

let number_of_collections = 1;
let nfts_per_collections = 4;

console.log("\nStart of dark bonds tests\n");

// TODOs
// need to add a class for different types of gates insice the master class

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

  let bondProgram;
  try {
    bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;
  } catch (err) {
    console.log("err: ", err);
  }

  const superAdmin = loadKeypairFromFile("./master-keypair.json"); // reused so that ATA are

  console.log("DARK BONDS ID: ", bondProgram.programId.toBase58());

  //TODO move that stuff to special class allowing to access keypair and it's ATA if created.
  const adminIbo0 = anchor.web3.Keypair.generate();
  const nftWallet = anchor.web3.Keypair.generate();

  const shortBond = 16;
  let superAdminAta_sc: Account;
  let cm: CollectionsMaster;

  // Mints
  const mintAuthSC = anchor.web3.Keypair.generate();
  let mintSC: PublicKey; // Stable coin mint
  let mintB: PublicKey; // Bond coin mint
  let mintWL: PublicKey; // Bond coin mint
  const mintAuthB = anchor.web3.Keypair.generate();
  const mintAuthWl = anchor.web3.Keypair.generate();

  // Classes
  let master: Master; // = new Master(bondProgram.programId, connection);
  let users: Users; // = new Users(connection, mintAuthSC);

  // Mint handle
  let mintSc: Mint;
  let mintBond: Mint;
  let mintWhiteList: Mint;

  // Ibo 0
  let ibo: Ibo;
  let exchangeRate: number = 40;
  let liveDate: number = 1683718579;
  let swapCut = 200; // aka 2.0 %
  let purchaseAmount = 500;
  let megaPurchase = 10000000;

  // Lock ups

  let lockUp0Period: number = 31536000; // 1 year
  let lockUp0Apy: number = 1.2 * 100;
  let lockUp1Period: number = 63072000; // 2 years
  let lockUp1Apy: number = 1.2 * 100;
  let lockUp2Period: number = shortBond;
  let lockUp2Apy: number = 10000000 * 100;

  // GatedSettingsd
  let lockUp3Period: number = shortBond;
  let lockUp3Apy: number = 10000000 * 100;

  let metaplex = new Metaplex(connection);
  metaplex.use(keypairIdentity(nftWallet));

  // Same purchase period as the IBO lockup
  let pp = await createSameAsMainIboInput();

  // testing
  let bond_counter = 0;
  let lockup_counter = 0;
  let masterBalance = 0;

  before(async () => {
    await Promise.all([
      topUp(mintAuthSC.publicKey),
      topUp(mintAuthWl.publicKey),
      topUp(mintAuthB.publicKey),
      topUp(nftWallet.publicKey),
    ]);

    metaplex = new Metaplex(provider.connection);
    metaplex.use(keypairIdentity(nftWallet));

    let uri: string = "https://arweave.net/123";

    // Mint of 0
    cm = new CollectionsMaster(provider.connection, nftWallet, metaplex);

    console.log("Deploying NFTs");
    for (let i = 0; i < number_of_collections; i++) {
      // Mint of 1 index 1
      console.log("Adding collection: ", i);
      await cm.initializeCollection(uri);

      console.log("Preminting");
      // Mint whole collection
      await cm.collections[i].premintNFTs(nfts_per_collections);
    }

    console.log("Moint top up done");

    [mintSC, mintB, mintWL] = await Promise.all([
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
      createMint(
        connection,
        mintAuthWl,
        mintAuthWl.publicKey,
        mintAuthWl.publicKey,
        10
      ),
    ]);

    console.log("Created mints");

    // init mints and load sc to user
    mintSc = new Mint(connection, mintAuthSC, mintSC);
    mintBond = new Mint(connection, mintAuthB, mintB);
    mintWhiteList = new Mint(connection, mintAuthWl, mintWL);
    users = new Users(connection, mintSc);

    console.log("Created classes");

    await Promise.all([
      topUp(superAdmin.publicKey),
      topUp(adminIbo0.publicKey),
      topUp(nftWallet.publicKey),
      users.addUsers(10),
    ]);

    // console.log(
    //   "\n\nUser 0 has publick key: ",
    //   users.users[0].publicKey.toBase58()
    // );

    // console.log(
    //   "User 0 has ata: ",
    //   users.users[0].liquidityAccount.address.toBase58()
    // );

    // console.log(
    //   "\nstart balance SC user 0",
    //   await getTokenBalance(users.users[0].liquidityAccount)
    // );
    // await mintSc.topUpSPl(users.users[0].liquidityAccount.address, 6666);
    // await delay(1);
    // await mintSc.topUpSPl(users.users[0].liquidityAccount.address, 100);

    console.log(
      "\nend balance SC user 0",
      await getTokenBalance(users.users[0].liquidityAccount)
    );

    console.log("Topped up privilagged users");

    // Create SC ATAs for admin accounts
    superAdminAta_sc = await getOrCreateAssociatedTokenAccount(
      connection,
      superAdmin,
      mintSC,
      superAdmin.publicKey
    );
  });

  it("Main register initialised!", async () => {
    master = new Master(bondProgram.programId, connection, mintSc);
    console.log("master.address: ", master.address.toBase58());
    // Check if already deployed by fetching account and if so don't deploy again
    try {
      let main_state = await bondProgram.account.master.fetch(master.address);

      // If it exists set IBO counter
      master.iboCounter = parseInt(main_state.iboCounter.toString());
    } catch (err) {
      const tx = await bondProgram.methods
        .init()
        .accounts({
          master: master.address,
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
        master: master.address,
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();
  });

  it("Add three different lockups.", async () => {
    let lockUp0: LockUp = await ibo.addLockUp(lockUp0Period, lockUp0Apy, false);
    let lockUp1: LockUp = await ibo.addLockUp(lockUp1Period, lockUp1Apy, false);
    let lockUp2: LockUp = await ibo.addLockUp(lockUp2Period, lockUp2Apy, false);

    let lockUp0Instruction = bondProgram.instruction.addLockup(
      new BN(lockUp0Period),
      new BN(lockUp0Apy),
      false,
      pp,
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
      false,
      pp,
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
      false,
      pp,
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

  it("Add gated lockup for collection.", async () => {
    let lockUp3: LockUp = await ibo.addLockUp(
      lockUp2Period,
      lockUp2Apy,
      true,
      0
    );
    console.log("\nadded lock up with idx: ", lockUp3.index);
    let collectionM: NftMint0 = cm.collections[0];

    const tx = await bondProgram.methods
      .addLockup(new BN(lockUp3Period), new BN(lockUp3Apy), false, pp)
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // const newGate = new SplSetting(mintKey, bondsAllowed, minimumAmount);

    // TODO two of these are the same, either doesnt get used in chain at all and is redundant
    const newGateSetting = new CollectionSetting(
      collectionM.masterMint,
      collectionM.masterMetadata,
      collectionM.masterEdition
    );

    const gateType = createCollectionTypeInput(
      collectionM.masterMint,
      collectionM.masterMint,
      collectionM.masterEdition
    );
    // const si = createSplTypeInput(mintWhiteList.mint, 100, 40)

    let gate0 = await ibo.addGate([newGateSetting]);
    console.log("\n\nTHIS GATE INDEX: ", gate0.index);

    const tx2 = await bondProgram.methods
      .addGate(ibo.index, lockUp3.index, [gateType])
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        gate: gate0.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // Update lock up to reflect those changes
    const tx3 = await bondProgram.methods
      .updateGates(
        ibo.index,
        lockUp3.index,
        [0], // 0th gate PDA
        []
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    lockUp3.addGateIdx(gate0.index);
  });

  it("Add gated lockup for SPL.", async () => {
    let lockUp4 = await ibo.addLockUp(lockUp2Period, lockUp2Apy, true, 0);
    console.log("\nadded lock up with idx: ", lockUp4.index);

    const tx = await bondProgram.methods
      .addLockup(new BN(lockUp3Period), new BN(lockUp3Apy), false, pp)
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp4.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // let gate1: SplGate = await ibo.addSplGate(mintWhiteList.mint);
    // const gateType = createSplTypeInput(gate1.mint, 100, 40);

    const newGateSetting = createSplTypeInput(mintWhiteList.mint, 100, 40);
    // const gateType = createSplTypeInput(mintWhiteList.mint, 100, 40);
    let gate1 = await ibo.addGate([newGateSetting]);

    console.log("\n\nTHIS GATE INDEX: ", gate1.index);

    const tx2 = await bondProgram.methods
      .addGate(ibo.index, lockUp4.index, [newGateSetting])
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp4.address,
        gate: gate1.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // Update lock up to reflect those changes
    const tx3 = await bondProgram.methods
      .updateGates(
        ibo.index,
        lockUp4.index,
        [gate1.index], // 0th gate PDA
        []
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp4.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    lockUp4.addGateIdx(gate1.index);
  });

  it("Add combined gated lockup with SPL and collection.", async () => {
    let collectionM: NftMint0 = cm.collections[0];
    let lockUp5 = await ibo.addLockUp(lockUp2Period, lockUp2Apy, true, 0);
    console.log("\nadded lock up with idx: ", lockUp5.index);

    const tx = await bondProgram.methods
      .addLockup(new BN(lockUp3Period), new BN(lockUp3Apy), false, pp)
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp5.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // let gate1: SplGate = await ibo.addSplGate(mintWhiteList.mint);
    // let gate0: CollectionGate = await ibo.addCollectionGate(
    //   collectionM.masterMint,
    //   collectionM.masterMint,
    //   collectionM.masterEdition
    // );
    // const gateType1 = createSplTypeInput(gate1.mint, 100, 40);
    // const gateType2 = createCollectionTypeInput(
    //   gate0.masterKey,
    //   gate0.masterKey,
    //   gate0.creatorKey
    // );

    const gateType1 = createCollectionTypeInput(
      collectionM.masterMint,
      collectionM.masterMint,
      collectionM.masterEdition
    );

    const gateType2 = createSplTypeInput(mintWhiteList.mint, 100, 40);
    const newGateSettingSpl = createSplTypeInput(mintWhiteList.mint, 100, 40);

    const newGateSettingCollection = new CollectionSetting(
      collectionM.masterMint,
      collectionM.masterMetadata,
      collectionM.masterEdition
    );

    // Stack gates
    let gate2 = await ibo.addGate([
      newGateSettingSpl,
      newGateSettingCollection,
      // newGateSettingCollection,
    ]);

    console.log("\n\nTHIS GATE INDEX: ", gate2.index);

    // Adding both types at once
    const tx2 = await bondProgram.methods
      .addGate(ibo.index, lockUp5.index, [gateType1, gateType2])
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp5.address,
        gate: gate2.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // Update lock up to reflect those changes
    const tx3 = await bondProgram.methods
      .updateGates(
        ibo.index,
        lockUp5.index,
        [gate2.index], // 0th gate PDA
        []
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp5.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    lockUp5.addGateIdx(gate2.index);
  });

  // it("Lock further lockups.", async () => {
  //   const tx_lu1 = await bondProgram.methods
  //     .lock(true, true)
  //     .accounts({
  //       admin: ibo.admin.publicKey,
  //       ibo: ibo.address,
  //     })
  //     .signers([ibo.admin])
  //     .rpc();

  //   // Assert lock changed to true
  //   let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
  //   assert(ibo0_state.lockupsLocked == true);
  // });

  // it("Buyer 1 deposits funds at a rate 1", async () => {
  //   masterBalance = await getTokenBalance(superAdminAta_sc);
  //   console.log("superAdmin: ", superAdmin.publicKey.toBase58()); // Add a bond
  //   let lockUp: LockUp = ibo.lockups[0];
  //   const user: User = users.users[0]; // take some user out
  //   const bond: Bond = await ibo.issueBond(ibo.bondCounter, purchaseAmount);
  //   user.issueBond(bond);

  //   console.log("/sc mint: ", mintSC.toBase58());
  //   console.log("mint buyer ata mint: ", user.liquidityAccount.mint.toBase58());
  //   console.log(
  //     "masterRecipientAta ata mint: ",
  //     superAdminAta_sc.mint.toBase58()
  //   );

  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(0, new BN(ibo.index), new BN(purchaseAmount), 0)
  //     .accounts({
  //       buyer: user.publicKey,
  //       bond: bond.address,
  //       ibo: ibo.address,
  //       lockup: ibo.lockups[0].address,
  //       buyerAta: user.liquidityAccount.address,
  //       recipientAta: ibo.recipientAddressAccount.address,
  //       master: master.address,
  //       masterRecipientAta: superAdminAta_sc.address,
  //       iboAta: ibo.vaultAccount.address,
  //       bondAta: bond.account.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([user])
  //     .rpc();

  //   bond_counter += 1;

  //   let bond0_state = await bondProgram.account.bond.fetch(bond.address);
  //   console.log("bond0 owner: ", bond0_state.owner.toBase58());
  //   console.log("bond0 maturity date: ", bond0_state.maturityDate.toString());
  //   console.log(
  //     "bond0 total to claim: ",
  //     bond0_state.totalClaimable.toString()
  //   );

  //   // let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
  //   // console.log("ibo0_state: ", ibo0_state.)

  //   let masterBalanceEnd = await getTokenBalance(superAdminAta_sc);
  //   console.log("masterBalanceEnd: ", masterBalanceEnd);
  //   assert(
  //     purchaseAmount * 0.05 == masterBalanceEnd,
  //     "take a cut of exactly 5%"
  //   );

  //   masterBalance += purchaseAmount * 0.05;

  //   // Check that liquidity_token balance decresed
  //   // Check that buyer set as the owner in the bond
  //   // Check calculation of bond to receive is correct
  // });

  // it("Buyer 2 deposits funds at a rate 2", async () => {
  //   const user: User = users.users[1];
  //   const bond: Bond = await ibo.issueBond(1, purchaseAmount);
  //   user.issueBond(bond);

  //   // Spend 500 for rate 2 as player 2
  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(1, new BN(ibo.index), new BN(purchaseAmount), 0)
  //     .accounts({
  //       buyer: user.publicKey,
  //       bond: bond.address,
  //       ibo: ibo.address,
  //       lockup: ibo.lockups[1].address,
  //       master: master.address,
  //       buyerAta: user.liquidityAccount.address,
  //       recipientAta: ibo.recipientAddressAccount.address,
  //       masterRecipientAta: superAdminAta_sc.address,
  //       iboAta: ibo.vaultAccount.address,
  //       bondAta: bond.account.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([user])
  //     .rpc();

  //   bond_counter += 1;

  //   let bond1_state = await bondProgram.account.bond.fetch(bond.address);
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
  //   const user: User = users.users[2];
  //   const bond: Bond = await ibo.issueBond(2, megaPurchase);
  //   user.issueBond(bond);

  //   // Spend mega amount for rate 3 as player 3
  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(2, new BN(ibo.index), new BN(megaPurchase), 0)
  //     .accounts({
  //       buyer: user.publicKey,
  //       bond: bond.address,
  //       ibo: ibo.address,
  //       lockup: ibo.lockups[2].address,
  //       master: master.address,
  //       buyerAta: user.liquidityAccount.address,
  //       recipientAta: ibo.recipientAddressAccount.address,
  //       masterRecipientAta: superAdminAta_sc.address,
  //       iboAta: ibo.vaultAccount.address,
  //       bondAta: bond.account.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([user])
  //     .rpc();

  //   bond_counter += 1;

  //   // TODO: bond substitition attack
  //   // can provide any bond ATA right now

  //   let bond1_state = await bondProgram.account.bond.fetch(bond.address);
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
  //   // console.log("bond: ", bond2.toBase58());

  //   let user: User = users.users[0];
  //   let bond: Bond = user.bonds[0];

  //   console.log("bond.account.address: ", bond.account.address);

  //   let bondBalanceStart = await getTokenBalance(bond.account);
  //   let bond1_state = await bondProgram.account.bond.fetch(bond.address);
  //   let bondStartTime = parseInt(bond1_state.bondStart.toString());

  //   let time_now_s = new Date().getTime() / 1000;

  //   console.log("bond started: ", bondStartTime);
  //   console.log("bond end at:  ", bondStartTime + shortBond);
  //   console.log("time now:     ", time_now_s);
  //   let time_elapsed = time_now_s - bondStartTime;
  //   console.log("time elapsed: ", time_elapsed);

  //   await delay(shortBond / 2 - time_elapsed);

  //   try {
  //     const tx_lu1 = await bondProgram.methods
  //       .claim(ibo.address, bond.idx)
  //       .accounts({
  //         bondOwner: user.publicKey,
  //         bond: bond.address,
  //         bondOwnerAta: bond.ownerBondAccount.address,
  //         bondAta: bond.account.address,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([user])
  //       .rpc();
  //   } catch (e) {
  //     console.log("\nerror:\n\n", e);
  //   }

  //   // Get bond amounts
  //   let balanceBuyer = await getTokenBalance(bond.ownerBondAccount);
  //   let bondBalance = await getTokenBalance(bond.account);

  //   console.log("balanceBuyer: ", balanceBuyer);
  //   console.log("bond: ", bondBalance);

  //   // assert(roughlyEqual(0.5, balanceBuyer / bondBalanceStart, 15));
  // });

  // it("Claim test 1, almost full amount", async () => {
  //   // console.log("bond: ", bond2.toBase58());

  //   // let bondBalanceStart = await getTokenBalance(bond2ATA_b);

  //   let user: User = users.users[1];
  //   let bond: Bond = user.bonds[0];

  //   await delay(8);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo.address, bond.idx)
  //     .accounts({
  //       bondOwner: user.publicKey,
  //       bond: bond.address,
  //       bondOwnerAta: bond.ownerBondAccount.address,
  //       bondAta: bond.account.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([user])
  //     .rpc();

  //   // Get bond amounts
  //   // let balanceBuyer = await getTokenBalance(bondBuyer2ATA_b);
  //   // let bondBalance = await getTokenBalance(bond2ATA_b);

  //   // console.log("balanceBuyer: ", balanceBuyer);
  //   // console.log("bond: ", bondBalance);

  //   // assert(roughlyEqual(0.5, balanceBuyer / bondBalanceStart, 10));
  // });

  // it("Claim test 1, full", async () => {
  //   let user: User = users.users[1];
  //   let bond: Bond = user.bonds[0];

  //   await delay(8);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .claim(ibo.address, bond.idx)
  //     .accounts({
  //       bondOwner: user.publicKey,
  //       bond: bond.address,
  //       bondOwnerAta: bond.ownerBondAccount.address,
  //       bondAta: bond.account.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([user])
  //     .rpc();

  //   // console.log("balanceBuyer: ", balanceBuyer);
  //   // console.log("bond: ", bondBalance);

  //   // assert(bondBalance == 0);
  //   // assert(balanceBuyer.toString() == bond2_state.totalClaimable.toString());
  // });

  // it("Split bond bond 50%", async () => {
  //   // console.log("bond: ", bond2.toBase58());

  //   // let bondBalanceStart = await getTokenBalance(bond2ATA_b);
  //   // let bond2_state = await bondProgram.account.bond.fetch(bond2);

  //   let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
  //   console.log("\n\n\nibo0_state start: ", ibo0_state.bondCounter.toString());

  //   let user: User = users.users[2];
  //   let bondOld: Bond = user.bonds[0];

  //   console.log("Old bond balance stored: ", bondOld.amount);
  //   console.log(
  //     "Old bond balance chain : ",
  //     await getTokenBalance(bondOld.account)
  //   );

  //   const splitAmount = Math.round(bondOld.amount / 2);

  //   console.log("After split");

  //   // SPlit the bond
  //   const newBondExt: Bond = await user.issueBond(
  //     await bondOld.split(splitAmount)
  //   );

  //   console.log("splitAmount: ", splitAmount);

  //   // Spend 500 for rate 1 as player 1
  //   const tx_lu1 = await bondProgram.methods
  //     .split(50, ibo.address, bondOld.idx)
  //     .accounts({
  //       owner: user.publicKey,
  //       bond: bondOld.address,
  //       newBond: newBondExt.address,
  //       master: master.address,
  //       ibo: ibo.address,
  //       bondAtaOld: bondOld.account.address,
  //       bondAtaNew: newBondExt.account.address,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .signers([user])
  //     .rpc();

  //   // console.log("Transaction gucci");

  //   let bond1_balance = await getTokenBalance(bondOld.account);
  //   let bond3_balance = await getTokenBalance(newBondExt.account);
  //   console.log("bond1_balance: ", bond1_balance);
  //   console.log("bond3_balance: ", bond3_balance);
  //   // Equal amount of tokens split
  //   // assert(bond1_balance - bond3_balance == 0);

  //   // let ibo0_state_end = await bondProgram.account.ibo.fetch(ibo.address);
  //   // console.log(
  //   //   "\n\n\nibo0_state end: ",
  //   //   ibo0_state_end.bondCounter.toString()
  //   // );
  // });

  // it("Set swap on the split on a bond", async () => {
  //   // Get latest bond
  //   let user: User = users.users[2];
  //   let bondSplit: Bond = user.bonds[user.bonds.length - 1];
  //   // User will sell splitted bond at 200
  //   bondSplit.setSwap(200);

  //   const tx_lu1 = await bondProgram.methods
  //     .setSwap(new BN(bondSplit.swapPrice))
  //     .accounts({
  //       owner: user.publicKey,
  //       bond: bondSplit.address,
  //     })
  //     .signers([user])
  //     .rpc();

  //   let bond1_state = await bondProgram.account.bond.fetch(bondSplit.address);

  //   console.log("bond1_state.sell_price: ", bond1_state.swapPrice.toString());

  //   assert((200).toString() == bond1_state.swapPrice.toString());
  // });

  // it("Buy bond offered on swap", async () => {
  //   // Find any bonds on swap
  //   const bondSale: Bond = ibo.getBondsOnSwap()[0];

  //   // Get random buyer
  //   const buyer: User = users.users[4];

  //   const tx_lu1 = await bondProgram.methods
  //     .buySwap()
  //     .accounts({
  //       buyer: buyer.publicKey,
  //       bond: bondSale.address,
  //       buyerAta: buyer.liquidityAccount.address,
  //       master: master.address,
  //       masterRecipientAta: superAdminAta_sc.address,
  //       sellerAta: bondSale.ownerLiquidityAccount.address,
  //       ibo: bondSale.parent.address,
  //       iboAdminAta: bondSale.parent.recipientAddressAccount.address,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([buyer])
  //     .rpc();

  //   // let bond1_state = await bondProgram.account.bond.fetch(bond1);

  //   // // New owner set
  //   // assert(resaleBuyer1.publicKey.toBase58() == bond1_state.owner.toBase58());
  // });

  it("Buy collection gated bond offered on ibo", async () => {
    // Get lock-up TODO fix its hardcoded for now
    const lockup: LockUp = ibo.lockups[3];

    // Get gate indexes available for this lockup
    const gatesIdxs: number[] = lockup.gates;

    console.log("\n\nTotal gates for this lock-up: ", gatesIdxs.length);
    console.log("gatesIdxs: ", gatesIdxs);
    console.log("lockup: ", lockup);

    // Get gate
    const gate: Gate = ibo.gates[gatesIdxs[0]];

    // Need to ensure they have NFT
    const user: User = users.users[5];
    const bond: Bond = await ibo.issueBond(lockup.index, purchaseAmount);

    console.log("nftWallet.publicKey: ", nftWallet.publicKey.toBase58());

    // Treansfer nft to the user
    let collectionM: NftMint0 = cm.collections[0];
    console.log("Sending nft: ");
    await collectionM.nfts[0].transferFromMinter(user.publicKey);
    console.log("Sent nft: ");

    // Spend 500 for rate 1 as player 1

    // try {
    const tx_lu1 = await bondProgram.methods
      .buyBond(lockup.index, new BN(ibo.index), new BN(10000), gate.index)
      .accounts({
        buyer: user.publicKey,
        bond: bond.address,
        ibo: ibo.address,
        lockup: lockup.address,
        master: master.address,
        buyerAta: user.liquidityAccount.address,
        recipientAta: ibo.recipientAddressAccount.address,
        iboAta: ibo.vaultAccount.address,
        bondAta: bond.account.address,
        masterRecipientAta: superAdminAta_sc.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: gate.address, isWritable: false, isSigner: false },
        {
          pubkey: collectionM.nfts[0].metadata,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: collectionM.nfts[0].mint,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: await collectionM.nfts[0].getAta(user.publicKey),
          isWritable: false,
          isSigner: false,
        },
      ])
      .signers([user])
      .rpc();
    // } catch (e) {
    //   console.log("\nerror:\n\n", e);
    // }

    console.log("\n\nGATED BUY\n\n");
  });

  // // IMPLEMENT SPL GATE
  it("Buy SPL gated bond offered on ibo", async () => {
    console.log("Total lock-ups: ", ibo.lockups.length);

    // Get the last gate which is the SPL one
    // const lockup: LockUp = ibo.lockups[ibo.lockups.length - 1];
    const lockup: LockUp = ibo.lockups[4];

    // ASsert it is the SPL gate
    console.log("\nlockup: ", lockup);

    // Get gate indexes available for this lockup
    const gatesIdxs: number[] = lockup.gates;

    console.log("Total gates for this lock-up: ", gatesIdxs.length);
    console.log("gatesIdxs: ", gatesIdxs);

    const gate: Gate = ibo.gates[gatesIdxs[gatesIdxs.length - 1]];

    // Assert gate is the combined type one
    // assert(typeof Gate == gate);
    expect(gate).to.be.instanceOf(Gate);
    console.log("\n\nType of gane: ", typeof gate);

    console.log("\ngate type: ", gate, " at idx: ", gate.index);

    const user: User = users.users[4];
    const bond: Bond = await ibo.issueBond(lockup.index, purchaseAmount);

    // Get ATA for that user for whitelist
    const userWlAta: Account = await mintWhiteList.makeAta(user.publicKey);
    const userScAta: Account = await mintSc.makeAta(user.publicKey);
    await mintWhiteList.topUpSPl(userWlAta.address, 777655);
    await mintSc.topUpSPl(userScAta.address, 2222);
    await delay(4);
    // const userSC: Account = await mintSc.makeAta(user.publicKey);
    // console.log("start balance SC", await getTokenBalance(userSC));
    // await mintSc.topUpSPl(userWlAta.address, 10000);
    // await mintSc.topUpSPl(userWlAta.address, 100);
    // console.log("end balance SC", await getTokenBalance(userSC));

    // // Make other bond accoutn for user
    // const userB: Account = await mintBond.makeAta(user.publicKey);
    // console.log("\nstart balance B", await getTokenBalance(userB));
    // await mintBond.topUpSPl(userWlAta.address, 1000000);
    // await mintBond.topUpSPl(userWlAta.address, 1000000);
    // console.log("end balance B", await getTokenBalance(userB));

    // console.log("User key: ", user.publicKey.toBase58());
    // console.log("User ATA: ", userWlAta.address.toBase58());

    // Transfer whitelisted token to the user
    console.log("\nstart balance WL", await getTokenBalance(userWlAta));
    console.log("\nstart balance SC", await getTokenBalance(userScAta));
    await mintWhiteList.topUpSPl(userWlAta.address, 777655);
    // await mintWhiteList.topUpSPl(userWlAta.address, 1000000);
    // await mintWhiteList.topUpSPl(userWlAta.address, 1000000);
    await delay(5);
    console.log("end balance WL", await getTokenBalance(userWlAta));

    // Get starting balance in WL for the user
    const userWlBalanceStart = await getTokenBalance(userWlAta);

    console.log("Calling buy SPL gated bond");
    // try {
    const tx_lu1 = await bondProgram.methods
      .buyBond(lockup.index, new BN(ibo.index), new BN(10000), 1)
      .accounts({
        buyer: user.publicKey,
        bond: bond.address,
        ibo: ibo.address,
        lockup: lockup.address,
        master: master.address,
        buyerAta: user.liquidityAccount.address,
        recipientAta: ibo.recipientAddressAccount.address,
        iboAta: ibo.vaultAccount.address,
        bondAta: bond.account.address,
        masterRecipientAta: superAdminAta_sc.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: gate.address, isWritable: false, isSigner: false },
        {
          pubkey: mintWhiteList.mint,
          isWritable: false,
          isSigner: false,
        },
        { pubkey: userWlAta.address, isWritable: false, isSigner: false },
      ])
      .signers([user])
      .rpc();
    // } catch (e) {
    //   console.log("\nerror final:\n\n", e);
    // }

    // Assert amount has been subtracted for one that does so
    const userWlBalanceEnd = await getTokenBalance(userWlAta);

    console.log("\n\nUser start balance: ", userWlBalanceStart);
    console.log("\n\nUser end balance: ", userWlBalanceEnd);
  });

  it("Buy SPL and collection gated bond offered on ibo", async () => {
    console.log("Total lock-ups: ", ibo.lockups.length);

    // Get the last gate which is the SPL one
    // const lockup: LockUp = ibo.lockups[ibo.lockups.length - 1];
    const lockup: LockUp = ibo.lockups[5];

    // ASsert it is the SPL gate
    console.log("\nlockup: ", lockup);

    // Get gate indexes available for this lockup
    const gatesIdxs: number[] = lockup.gates;

    console.log("Total gates for this lock-up: ", gatesIdxs.length);
    console.log("gatesIdxs: ", gatesIdxs);

    const gate: Gate = ibo.gates[gatesIdxs[gatesIdxs.length - 1]];

    expect(gate).to.be.instanceOf(Gate);

    console.log("\n\nType of gane: ", typeof gate);

    console.log("\ngate type: ", gate, " at idx: ", gate.index);

    // Need to ensure they have NFT
    const user: User = users.users[2];
    const bond: Bond = await ibo.issueBond(lockup.index, purchaseAmount);

    // Treansfer nft to the user
    let collectionM: NftMint0 = cm.collections[0];
    console.log("Sending nft: ");
    await collectionM.nfts[2].transferFromMinter(user.publicKey);
    console.log("Sent nft: ");

    // Get ATA for that user for whitelist
    const userWlAta: Account = await mintWhiteList.makeAta(user.publicKey);
    const userScAta: Account = await mintSc.makeAta(user.publicKey);
    await mintWhiteList.topUpSPl(userWlAta.address, 777655);
    await mintSc.topUpSPl(userScAta.address, 2222);
    await delay(4);
    // const userSC: Account = await mintSc.makeAta(user.publicKey);
    // console.log("start balance SC", await getTokenBalance(userSC));
    // await mintSc.topUpSPl(userWlAta.address, 10000);
    // await mintSc.topUpSPl(userWlAta.address, 100);
    // console.log("end balance SC", await getTokenBalance(userSC));

    // // Make other bond accoutn for user
    // const userB: Account = await mintBond.makeAta(user.publicKey);
    // console.log("\nstart balance B", await getTokenBalance(userB));
    // await mintBond.topUpSPl(userWlAta.address, 1000000);
    // await mintBond.topUpSPl(userWlAta.address, 1000000);
    // console.log("end balance B", await getTokenBalance(userB));

    // console.log("User key: ", user.publicKey.toBase58());
    // console.log("User ATA: ", userWlAta.address.toBase58());

    // Transfer whitelisted token to the user
    console.log("\nstart balance WL", await getTokenBalance(userWlAta));
    console.log("\nstart balance SC", await getTokenBalance(userScAta));
    await mintWhiteList.topUpSPl(userWlAta.address, 777655);
    // await mintWhiteList.topUpSPl(userWlAta.address, 1000000);
    // await mintWhiteList.topUpSPl(userWlAta.address, 1000000);
    await delay(5);
    console.log("end balance WL", await getTokenBalance(userWlAta));

    // Get starting balance in WL for the user
    const userWlBalanceStart = await getTokenBalance(userWlAta);

    console.log("Calling buy SPL gated bond");

    const tx_lu1 = await bondProgram.methods
      .buyBond(lockup.index, new BN(ibo.index), new BN(10000), gate.index)
      .accounts({
        buyer: user.publicKey,
        bond: bond.address,
        ibo: ibo.address,
        lockup: lockup.address,
        master: master.address,
        buyerAta: user.liquidityAccount.address,
        recipientAta: ibo.recipientAddressAccount.address,
        iboAta: ibo.vaultAccount.address,
        bondAta: bond.account.address,
        masterRecipientAta: superAdminAta_sc.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: gate.address, isWritable: false, isSigner: false },
        {
          pubkey: collectionM.nfts[0].metadata,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: collectionM.nfts[0].mint,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: await collectionM.nfts[0].getAta(user.publicKey),
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: mintWhiteList.mint,
          isWritable: false,
          isSigner: false,
        },
        { pubkey: userWlAta.address, isWritable: false, isSigner: false },
      ])
      .signers([user])
      .rpc();

    // Assert amount has been subtracted for one that does so
    const userWlBalanceEnd = await getTokenBalance(userWlAta);

    console.log("\n\nUser start balance: ", userWlBalanceStart);
    console.log("\n\nUser end balance: ", userWlBalanceEnd);
  });
});
