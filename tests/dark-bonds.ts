import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { assert } = chai;
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
// import { assert, use } from "chai";
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
} from "./main";
import { User, Users } from "./user";
import { Mint } from "./mint";
import { MintSupplyMustBeZeroError } from "@metaplex-foundation/mpl-token-metadata";
import { CollectionsMaster, NftMint0, NftMint1 } from "./derived_nfts";
const DAY_SECONDS: number = 86400;

//
const BN = anchor.BN;

let number_of_collections = 1;
let nfts_per_collections = 4;

console.log("\nStart of dark bonds tests\n");

// TODOs
// need to add a class for different types of gates insice the main class

describe("dark-bonds", async () => {
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

  let bondProgram: anchor.Program<DarkBonds>;
  try {
    bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;
  } catch (err) {
    console.log("Failed loading IDL error: ", err);
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
  let main: Master; // = new Master(bondProgram.programId, connection);
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

  // Lock ups
  let lockUp0Period: number = 31536000; // 1 year
  let lockUp0Apy: number = 1.2 * 100;
  let lockUp1Period: number = 63072000; // 2 years
  let lockUp1Apy: number = 1.2 * 100;
  let lockUp2Period: number = DAY_SECONDS;
  let lockUp2Apy: number = 10000000 * 100;

  let metaplex = new Metaplex(connection);
  metaplex.use(keypairIdentity(nftWallet));

  // Admin fees
  let iboCreationFee = 1000000;
  let gateCreationFee = 1000000;
  let lockupCreationFee = 1000000;

  // Cuts
  let bondPurchaseCut = 200;
  let bondResaleCut = 200;

  // User fees
  let bondClaimFee = 2000;
  let bondPurchaseFee = 20000;
  let bondSplitFee = 200000;

  // Same purchase period as the IBO lockup
  let pp = await createSameAsMainIboInput();

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
    users = new Users(connection, mintSc, bondProgram.programId);

    console.log("Created classes");

    await Promise.all([
      topUp(superAdmin.publicKey),
      topUp(adminIbo0.publicKey),
      topUp(nftWallet.publicKey),
      users.addUsers(10),
    ]);

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
    main = new Master(bondProgram.programId, connection, mintSc);
    console.log("main.address: ", main.address.toBase58());
    // Check if already deployed by fetching account and if so don't deploy again
    try {
      let main_state = await bondProgram.account.main.fetch(main.address);

      // If it exists set IBO counter
      main.iboCounter = parseInt(main_state.iboCounter.toString());
    } catch (err) {
      console.log("Error fetch main: ", err, "\n\nRedeploying");
      try {
        const tx = await bondProgram.methods
          .initMaster(
            // Admin fees
            new BN(iboCreationFee),
            new BN(gateCreationFee),
            new BN(lockupCreationFee),
            // Cuts
            new BN(bondPurchaseCut),
            new BN(bondResaleCut),
            // User fees
            new BN(bondClaimFee),
            new BN(bondPurchaseFee),
            new BN(bondSplitFee)
          )
          .accounts({
            main: main.address,
            superadmin: superAdmin.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([superAdmin])
          .rpc();
        console.log("Your transaction signature", tx);
      } catch (err) {
        console.log("Error init main: ", err);
      }
    }
  });

  it("Create banks for ibos", async () => {
    for (let i = 0; i <= 10; i++) {
      const iboBank = await main.deriveIboBank(i);
      try {
        console.log(`Creating ibo bank account ${i}`);
        const tx1 = await bondProgram.methods
          .addIboBank()
          .accounts({
            kang: superAdmin.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            main: main.address,
            iboBank,
          })
          .signers([superAdmin])
          .rpc();
      } catch (error) {
        console.log("error init ibo bank: ", error);
      }
    }
  });

  it("Register bond offering.", async () => {
    ibo = await main.addIbo(
      exchangeRate,
      liveDate,
      liveDate + 100000, // Can buy bonds until that point in the future
      swapCut,
      mintBond,
      mintSc.mint,
      adminIbo0,
      adminIbo0.publicKey // If
    );

    console.log("ibo.ata: ", ibo.vaultAccount.address.toBase58());
    await mintBond.topUpSPl(ibo.vaultAccount.address, 1000000000000000);
    console.log("Minted");
    try {
      const tx = await bondProgram.methods
        .createIbo(
          "test description",
          "test link",
          new BN(ibo.fixedExchangeRate),
          new BN(ibo.liveDate),
          new BN(ibo.endDate),
          ibo.swapCut,
          ibo.liquidityMint,
          ibo.mintB.mint,
          ibo.recipientAddressAccount.owner
        )
        .accounts({
          main: main.address,
          admin: ibo.admin.publicKey,
          ibo: ibo.address,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([ibo.admin])
        .rpc();
    } catch (err) {
      console.log("err: ", err);
    }
  });

  it("Add three different lockups.", async () => {
    let lockUp0: LockUp = await ibo.addLockUp(
      lockUp0Period,
      lockUp0Apy,
      false,
      0
    );
    let lockUp1: LockUp = await ibo.addLockUp(
      lockUp1Period,
      lockUp1Apy,
      false,
      0
    );
    let lockUp2: LockUp = await ibo.addLockUp(
      lockUp2Period,
      lockUp2Apy,
      false,
      0
    );

    let lockUp0Instruction = bondProgram.instruction.addLockup(
      new BN(lockUp0Period),
      new BN(lockUp0Apy),
      false,
      new BN(0),
      0,
      pp,
      {
        accounts: {
          admin: ibo.admin.publicKey,
          ibo: ibo.address,
          lockup: lockUp0.address,
          main: main.address,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );
    let lockUp1Instruction = bondProgram.instruction.addLockup(
      new BN(lockUp1Period),
      new BN(lockUp1Apy),
      false,
      new BN(0),
      0,
      pp,
      {
        accounts: {
          admin: ibo.admin.publicKey,
          ibo: ibo.address,
          lockup: lockUp1.address,
          main: main.address,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );
    let lockUp2Instruction = bondProgram.instruction.addLockup(
      new BN(lockUp2Period),
      new BN(lockUp2Apy),
      false,
      new BN(0),
      0,
      pp,
      {
        accounts: {
          admin: ibo.admin.publicKey,
          ibo: ibo.address,
          lockup: lockUp2.address,
          main: main.address,
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
    let lockUp3: LockUp = await ibo.addLockUp(DAY_SECONDS, lockUp2Apy, true, 0);
    console.log("\nadded lock up with idx: ", lockUp3.index);
    let collectionM: NftMint0 = cm.collections[0];

    console.log("Master addres: ", main.address.toBase58());

    const tx = await bondProgram.methods
      .addLockup(
        new BN(lockUp3.period),
        new BN(lockUp3.apy),
        false,
        new BN(0),
        0,
        pp
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        main: main.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

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
      .addGate([gateType])
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        gate: gate0.address,
        main: main.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // Update lock up to reflect those changes
    const tx3 = await bondProgram.methods
      .updateLockupGates(
        [0], // 0th gate PDA
        []
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp3.address,
        main: main.address,
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
      .addLockup(
        new BN(lockUp4.period),
        new BN(lockUp4.apy),
        false,
        new BN(0),
        0,
        pp
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp4.address,
        main: main.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    const newGateSetting = createSplTypeInput(mintWhiteList.mint, 100, 40);
    let gate1 = await ibo.addGate([newGateSetting]);

    console.log("\n\nTHIS GATE INDEX: ", newGateSetting);

    const tx2 = await bondProgram.methods
      .addGate([newGateSetting])
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp4.address,
        gate: gate1.address,
        main: main.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // Update lock up to reflect those changes
    const tx3 = await bondProgram.methods
      .updateLockupGates(
        [gate1.index], // 0th gate PDA
        []
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp4.address,
        main: main.address,
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
      .addLockup(
        new BN(lockUp5.period),
        new BN(lockUp5.apy),
        false,
        new BN(0),
        0,
        pp
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        main: main.address,
        lockup: lockUp5.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

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
      .addGate([gateType1, gateType2])
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp5.address,
        main: main.address,
        gate: gate2.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    // Update lock up to reflect those changes
    const tx3 = await bondProgram.methods
      .updateLockupGates(
        [gate2.index], // 0th gate PDA
        []
      )
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
        lockup: lockUp5.address,
        main: main.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ibo.admin])
      .rpc();

    lockUp5.addGateIdx(gate2.index);
  });

  // TODO implement consuming a whole struct
  xit("Lock further lockups.", async () => {
    const tx_lu1 = await bondProgram.methods
      .lock(true, true)
      .accounts({
        admin: ibo.admin.publicKey,
        ibo: ibo.address,
      })
      .signers([ibo.admin])
      .rpc();

    // Assert lock changed to true
    // let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
    // assert(ibo0_state.lockupsLocked == true);
  });

  it("Buyer 0 buys with lockkup rate 0", async () => {
    // masterBalance = await getTokenBalance(superAdminAta_sc);
    console.log("superAdmin: ", superAdmin.publicKey.toBase58()); // Add a bond
    let lockUp: LockUp = ibo.lockups[0];
    const user: User = users.users[0]; // take some user out
    const bond: Bond = await ibo.issueBond(ibo.bondCounter, purchaseAmount);
    user.issueBond(bond);

    console.log("/sc mint: ", mintSC.toBase58());
    console.log("mint buyer ata mint: ", user.liquidityAccount.mint.toBase58());
    console.log(
      "masterRecipientAta ata mint: ",
      superAdminAta_sc.mint.toBase58()
    );

    // Get latest bond pointer
    let bp: PublicKey = await user.getBondPointerAddress();

    console.log(
      `Using  bp ${bp.toBase58()} at index ${user.bondPointers.length}`
    );
    // try {
    const tx_lu1 = await bondProgram.methods
      .buyBond(new BN(purchaseAmount), 0)
      .accounts({
        buyer: user.publicKey,
        bond: bond.address,
        ibo: ibo.address,
        lockup: lockUp.address,
        buyerAta: user.liquidityAccount.address,
        recipientAta: ibo.recipientAddressAccount.address,
        main: main.address,
        masterRecipientAta: superAdminAta_sc.address,
        iboAta: ibo.vaultAccount.address,
        bondAta: bond.account.address,
        userAccount: user.userAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
    // } catch (e) {
    //   console.log("\nerror:\n\n", e);
    // }

    // bond_counter += 1;

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
    // assert(
    //   purchaseAmount * 0.05 == masterBalanceEnd,
    //   "take a cut of exactly 5%"
    // );

    // masterBalance += purchaseAmount * 0.05;

    // Check that liquidity_token balance decresed
    // Check that buyer set as the owner in the bond
    // Check calculation of bond to receive is correct
  });

  it("Buyer 0 buys with lockkup rate 0 bond idx1", async () => {
    // masterBalance = await getTokenBalance(superAdminAta_sc);
    console.log("superAdmin: ", superAdmin.publicKey.toBase58()); // Add a bond
    let lockUp: LockUp = ibo.lockups[0];
    const user: User = users.users[0]; // take some user out
    const bond: Bond = await ibo.issueBond(ibo.bondCounter, purchaseAmount);
    user.issueBond(bond);

    console.log("/sc mint: ", mintSC.toBase58());
    console.log("mint buyer ata mint: ", user.liquidityAccount.mint.toBase58());
    console.log(
      "masterRecipientAta ata mint: ",
      superAdminAta_sc.mint.toBase58()
    );

    // Get latest bond pointer
    let bp: PublicKey = await user.getBondPointerAddress();

    console.log(
      `Using  bp ${bp.toBase58()} at index ${user.bondPointers.length}`
    );

    const tx_lu1 = await bondProgram.methods
      .buyBond(new BN(purchaseAmount), 0)
      .accounts({
        buyer: user.publicKey,
        bond: bond.address,
        ibo: ibo.address,
        lockup: lockUp.address,
        buyerAta: user.liquidityAccount.address,
        recipientAta: ibo.recipientAddressAccount.address,
        main: main.address,
        masterRecipientAta: superAdminAta_sc.address,
        iboAta: ibo.vaultAccount.address,
        bondAta: bond.account.address,
        userAccount: user.userAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // bond_counter += 1;

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
    // assert(
    //   purchaseAmount * 0.05 == masterBalanceEnd,
    //   "take a cut of exactly 5%"
    // );

    // masterBalance += purchaseAmount * 0.05;

    // Check that liquidity_token balance decresed
    // Check that buyer set as the owner in the bond
    // Check calculation of bond to receive is correct
  });

  it("Claim test 1", async () => {
    // console.log("bond: ", bond2.toBase58());

    let user: User = users.users[0];
    let bond: Bond = user.bonds[0];

    console.log("bond.account.address: ", bond.account.address.toBase58());

    let bondBalanceStart = await getTokenBalance(bond.account);
    let bond1_state = await bondProgram.account.bond.fetch(bond.address);
    let bondStartTime = parseInt(bond1_state.bondStart.toString());

    let time_now_s = new Date().getTime() / 1000;

    console.log("bond started: ", bondStartTime);
    console.log("bond end at:  ", bondStartTime + shortBond);
    console.log("time now:     ", time_now_s);
    let time_elapsed = time_now_s - bondStartTime;
    console.log("time elapsed: ", time_elapsed);

    await delay(shortBond / 2 - time_elapsed);
    await delay(3);

    console.log(" user.publicKey: ", user.publicKey.toBase58());
    console.log(
      "bond.ownerBondAccount.address: ",
      bond.ownerBondAccount.address.toBase58()
    );

    // try {
    const tx_lu1 = await bondProgram.methods
      .claim(ibo.address, bond.idx)
      .accounts({
        bondOwner: user.publicKey,
        bond: bond.address,
        bondOwnerAta: bond.ownerBondAccount.address,
        bondAta: bond.account.address,
        main: main.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    // } catch (e) {
    //   console.log("\nerror:\n\n", e);
    // }

    // Get bond amounts
    let balanceBuyer = await getTokenBalance(bond.ownerBondAccount);
    let bondBalance = await getTokenBalance(bond.account);

    console.log("balanceBuyer: ", balanceBuyer);
    console.log("bond: ", bondBalance);

    // assert(roughlyEqual(0.5, balanceBuyer / bondBalanceStart, 15));
  });

  it("Buyer 0 splits bond at 50%", async () => {
    // console.log("bond: ", bond2.toBase58());

    // let bondBalanceStart = await getTokenBalance(bond2ATA_b);
    // let bond2_state = await bondProgram.account.bond.fetch(bond2);

    let ibo0_state = await bondProgram.account.ibo.fetch(ibo.address);
    console.log("\n\n\nibo0_state start: ", ibo0_state.bondCounter.toString());

    let user: User = users.users[0];
    let bondOld: Bond = user.bonds[0];

    console.log("Old bond balance stored: ", bondOld.amount);
    console.log(
      "Old bond balance chain : ",
      await getTokenBalance(bondOld.account)
    );

    const splitAmount = Math.round(bondOld.amount / 2);

    console.log("After split");

    // SPlit the bond
    const newBondExt: Bond = await user.issueBond(
      await bondOld.split(splitAmount)
    );

    console.log("splitAmount: ", splitAmount);

    // Spend 500 for rate 1 as player 1
    try {
      const tx_lu1 = await bondProgram.methods
        .split(50, ibo.address, bondOld.idx)
        .accounts({
          owner: user.publicKey,
          bond: bondOld.address,
          newBond: newBondExt.address,
          main: main.address,
          ibo: ibo.address,
          bondAtaOld: bondOld.account.address,
          bondAtaNew: newBondExt.account.address,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();
    } catch (e) {
      console.log("\nerror:\n\n", e);
    }

    // console.log("Transaction gucci");

    let bond1_balance = await getTokenBalance(bondOld.account);
    let bond3_balance = await getTokenBalance(newBondExt.account);
    console.log("bond1_balance: ", bond1_balance);
    console.log("bond3_balance: ", bond3_balance);
    // Equal amount of tokens split
    // assert(bond1_balance - bond3_balance == 0);

    // let ibo0_state_end = await bondProgram.account.ibo.fetch(ibo.address);
    // console.log(
    //   "\n\n\nibo0_state end: ",
    //   ibo0_state_end.bondCounter.toString()
    // );
  });

  it("Set swap on the split on a bond", async () => {
    // Get latest bond
    let user: User = users.users[0];
    let bondSplit: Bond = user.bonds[user.bonds.length - 1];
    // User will sell splitted bond at 200
    bondSplit.setSwap(200);

    const tx_lu1 = await bondProgram.methods
      .setSwap(new BN(bondSplit.swapPrice))
      .accounts({
        owner: user.publicKey,
        bond: bondSplit.address,
      })
      .signers([user])
      .rpc();

    let bond1_state = await bondProgram.account.bond.fetch(bondSplit.address);

    // console.log("bond1_state.sell_price: ", bond1_state.swapPrice.toString());

    // assert((200).toString() == bond1_state.swapPrice.toString());
  });

  it("Buy bond offered on swap", async () => {
    // Find any bonds on swap
    const bondSale: Bond = ibo.getBondsOnSwap()[0];

    // Get random buyer
    const buyer: User = users.users[4];

    let bp: PublicKey = await buyer.getBondPointerAddress();
    // Update counter

    // TODO should really be here
    buyer.bondCounter++;

    const tx_lu1 = await bondProgram.methods
      .buySwap()
      .accounts({
        buyer: buyer.publicKey,
        bond: bondSale.address,
        buyerAta: buyer.liquidityAccount.address,
        main: main.address,
        masterRecipientAta: superAdminAta_sc.address,
        sellerAta: bondSale.ownerLiquidityAccount.address,
        userAccount: buyer.userAccount,
        ibo: bondSale.parent.address,
        iboAdminAta: bondSale.parent.recipientAddressAccount.address,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    // let bond1_state = await bondProgram.account.bond.fetch(bond1);

    // // New owner set
    // assert(resaleBuyer1.publicKey.toBase58() == bond1_state.owner.toBase58());
  });

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

    console.log("\n\nlockup: ", lockup);
    console.log("gate: ", gate);

    // Need to ensure they have NFT
    const user: User = users.users[5];
    const bond: Bond = await ibo.issueBond(lockup.index, purchaseAmount);

    console.log("nftWallet.publicKey: ", nftWallet.publicKey.toBase58());

    // Spend 500 for rate 1 as player 1

    // Get latest bond pointer
    let bp: PublicKey = await user.getBondPointerAddress();

    console.log(
      `Using  bp ${bp.toBase58()} at index ${user.bondPointers.length}`
    );

    async function submit() {
      const tx_lu1 = await bondProgram.methods
        .buyBond(new BN(10000), gate.index)
        .accounts({
          buyer: user.publicKey,
          bond: bond.address,
          ibo: ibo.address,
          lockup: lockup.address,
          main: main.address,
          userAccount: user.userAccount,
          buyerAta: user.liquidityAccount.address,
          recipientAta: ibo.recipientAddressAccount.address,
          iboAta: ibo.vaultAccount.address,
          bondAta: bond.account.address,
          masterRecipientAta: superAdminAta_sc.address,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: gate.address, isWritable: true, isSigner: false },
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
    }

    // rejects without NFT
    await assert.isRejected(submit(), Error);

    // Treansfer nft to the user
    let collectionM: NftMint0 = cm.collections[0];
    console.log("Sending nft: ");
    await collectionM.nfts[0].transferFromMinter(user.publicKey);
    console.log("Sent nft: ");
    try {
      await submit();
    } catch (e) {
      console.log("\n\n\nerror:\n", e);
    }

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
    // console.log("\n\nType of gane: ", typeof gate);
    // console.log("\ngate type: ", gate, " at idx: ", gate.index);

    const user: User = users.users[4];
    const bond: Bond = await ibo.issueBond(lockup.index, purchaseAmount);

    // Get ATA for that user for whitelist
    const userWlAta: Account = await mintWhiteList.makeAta(user.publicKey);
    const userScAta: Account = await mintSc.makeAta(user.publicKey);

    // Get latest bond pointer
    let bp: PublicKey = await user.getBondPointerAddress();

    console.log(
      `Using  bp ${bp.toBase58()} at index ${user.bondPointers.length}`
    );

    async function submit() {
      const tx_lu1 = await bondProgram.methods
        .buyBond(new BN(10000), gate.index)
        .accounts({
          buyer: user.publicKey,
          bond: bond.address,
          ibo: ibo.address,
          lockup: lockup.address,
          main: main.address,
          userAccount: user.userAccount,
          buyerAta: user.liquidityAccount.address,
          recipientAta: ibo.recipientAddressAccount.address,
          iboAta: ibo.vaultAccount.address,
          bondAta: bond.account.address,
          masterRecipientAta: superAdminAta_sc.address,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: gate.address, isWritable: true, isSigner: false },
          {
            pubkey: mintWhiteList.mint,
            isWritable: true,
            isSigner: false,
          },
          { pubkey: userWlAta.address, isWritable: true, isSigner: false },
        ])
        .signers([user])
        .rpc();

      console.log("\n\nSUBBITED no erro TARNSACITO");
    }

    // Transfer whitelisted token to the user
    console.log("\nstart balance WL", await getTokenBalance(userWlAta));
    console.log("\nstart balance SC", await getTokenBalance(userScAta));

    // await delay(5);
    console.log("end balance WL", await getTokenBalance(userWlAta));
    console.log("Calling buy SPL gated bond");

    // Get starting balance in WL for the user
    const userWlBalanceStart = await getTokenBalance(userWlAta);

    // Assert it fails when submitted without SPL ownership for the caller
    await assert.isRejected(submit(), Error);

    // Top up the user
    await mintWhiteList.topUpSPl(userWlAta.address, 777655);
    await delay(3);
    await submit();

    // Calls after topup
    // try {
    //   await submit();
    // } catch (e) {
    //   console.log("\n\n\nerror:\n", e);
    // }

    // Assert amount has been subtracted for one that does so
    const userWlBalanceEnd = await getTokenBalance(userWlAta);

    console.log("\n\nUser start balance: ", userWlBalanceStart);
    console.log("\n\nUser end balance: ", userWlBalanceEnd);
  });

  it("Buy SPL and collection gated bond offered on ibo", async () => {
    console.log("Total lock-ups: ", ibo.lockups.length);

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
    const userWlAta: Account = await mintWhiteList.makeAta(user.publicKey);
    const userScAta: Account = await mintSc.makeAta(user.publicKey);
    let collectionM: NftMint0 = cm.collections[0];

    // Get latest bond pointer
    let bp: PublicKey = await user.getBondPointerAddress();

    console.log(
      `Using  bp ${bp.toBase58()} at index ${user.bondPointers.length}`
    );

    async function submit() {
      const tx_lu1 = await bondProgram.methods
        .buyBond(new BN(10000), gate.index)
        .accounts({
          buyer: user.publicKey,
          bond: bond.address,
          ibo: ibo.address,
          lockup: lockup.address,
          main: main.address,
          userAccount: user.userAccount,
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
            isWritable: true,
            isSigner: false,
          },
          { pubkey: userWlAta.address, isWritable: true, isSigner: false },
        ])
        .signers([user])
        .rpc();
    }

    // Fails due to missing NFT
    await assert.isRejected(submit(), Error);
    // Sending nft
    await collectionM.nfts[2].transferFromMinter(user.publicKey);

    // Fails due to missing SPL
    await assert.isRejected(submit(), Error);
    // Mint wl SPL
    await mintWhiteList.topUpSPl(userWlAta.address, 777655);

    await delay(2);

    await submit();

    console.log("end balance WL", await getTokenBalance(userWlAta));

    // Get starting balance in WL for the user
    const userWlBalanceStart = await getTokenBalance(userWlAta);

    console.log("Calling buy SPL gated bond");

    // Assert amount has been subtracted for one that does so
    const userWlBalanceEnd = await getTokenBalance(userWlAta);

    console.log("\n\nUser start balance: ", userWlBalanceStart);
    console.log("\n\nUser end balance: ", userWlBalanceEnd);
  });
});
