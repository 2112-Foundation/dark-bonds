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
import { assert, use } from "chai";
import { Ibo, LockUp, GatedSettings, Master, Bond } from "./master";
import { User, Users } from "./user";
import { Mint } from "./mint";
import { MintSupplyMustBeZeroError } from "@metaplex-foundation/mpl-token-metadata";
import { CollectionsMaster, NftMint0, NftMint1 } from "./derived_nfts";
//
const BN = anchor.BN;

let number_of_collections = 1;
let nfts_per_collections = 4;

console.log("\nHEY");

describe("dark-bonds", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;

  const LAMPORTS_PER_SOL = 1000000000;

  console.log("\nHEY222");

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

  console.log("\nHEY222333");
  let bondProgram;
  try {
    bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;
  } catch (err) {
    console.log("err: ", err);
  }

  console.log("\nHEY222333");
  const superAdmin = loadKeypairFromFile("./master-keypair.json"); // reused so that ATA are

  console.log("DARK BONDS ID: ", bondProgram.programId.toBase58());

  //TODO move that stuff to special class allowing to access keypair and it's ATA if created.
  const adminIbo0 = anchor.web3.Keypair.generate();
  const nftWallet = anchor.web3.Keypair.generate();

  const shortBond = 16;
  let superAdminAta_sc: Account;
  let cm: CollectionsMaster;

  console.log("\nHEY222333");

  // Mints
  const mintAuthSC = anchor.web3.Keypair.generate();
  const mintKeypairSC = anchor.web3.Keypair.generate();
  let mintSC: PublicKey; // Stable coin mint
  let mintB: PublicKey; // Bond coin mint
  const mintAuthB = anchor.web3.Keypair.generate();
  const mintKeypairB = anchor.web3.Keypair.generate();

  // Classes
  let master: Master; // = new Master(bondProgram.programId, connection);
  let users: Users; // = new Users(connection, mintAuthSC);
  let mintSc: Mint;
  let mintBond: Mint;

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

    console.log("Created mints");

    // init mints and load sc to user
    mintSc = new Mint(connection, mintAuthSC, mintSC);
    mintBond = new Mint(connection, mintAuthB, mintB);
    users = new Users(connection, mintSc);

    console.log("Created classes");

    await Promise.all([
      topUp(superAdmin.publicKey),
      topUp(adminIbo0.publicKey),
      topUp(nftWallet.publicKey),
      // Add few users
      users.addUsers(10),
    ]);

    console.log("Topped up privilagged users");

    // Create SC ATAs for admin accounts
    superAdminAta_sc = await getOrCreateAssociatedTokenAccount(
      connection,
      superAdmin,
      mintSC,
      superAdmin.publicKey
    );

    // Pre mint 2 NFTs and give one to buyer 1

    // const { nft } = await metaplex.nfts().create({
    //   uri: "https://arweave.net/123",
    //   name: "TESSSSST",
    //   sellerFeeBasisPoints: 500,
    //   maxSupply: toBigNumber(5),
    //   isMutable: false,
    // });

    // nft_handle = nft;

    // console.log("\n\nnft: \n", nft);

    // mintKey = nft.mint.address;
    // masterKey = nft.creators[0].address;
    // editionKey = nft.edition.address;

    // console.log("editionKey: ", editionKey.toBase58());
    // console.log("mintKey: ", mintKey.toBase58());
    // console.log("masterKey: ", masterKey.toBase58());
    // console.log("editionKey: ", editionKey.toBase58());

    // nftTokenAccount = nft["token"].address;
    // nftMetadataAccount = nft.metadataAddress;
    // nftMasteEdition_account = nft.edition.address;

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

    let collectionM: NftMint0 = cm.collections[0];

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

    let gate0: GatedSettings = await ibo.addGatedSettings(
      collectionM.masterMint,
      collectionM.masterMint,
      collectionM.masterEdition
    );

    const tx2 = await bondProgram.methods
      .addGatedSettings(
        ibo.index,
        lockUp3.index,
        { collection: {} },
        [gate0.mintKey, gate0.masterKey, gate0.creatorKey],
        []
      )
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

  //   // Add a bond
  //   console.log("superAdmin: ", superAdmin.publicKey.toBase58());

  //   // take some user out
  //   const user: User = users.users[0];
  //   const bond: Bond = await ibo.addBond(0, purchaseAmount);
  //   user.addBond(bond);

  //   console.log("/sc mint: ", mintSC.toBase58());
  //   console.log("mint buyer ata mint: ", user.liquidityAccount.mint.toBase58());
  //   console.log(
  //     "masterRecipientAta ata mint: ",
  //     superAdminAta_sc.mint.toBase58()
  //   );

  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(0, new BN(ibo.index), new BN(purchaseAmount))
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
  //   const bond: Bond = await ibo.addBond(1, purchaseAmount);
  //   user.addBond(bond);

  //   // Spend 500 for rate 2 as player 2
  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(1, new BN(ibo.index), new BN(purchaseAmount))
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
  //   const bond: Bond = await ibo.addBond(2, megaPurchase);
  //   user.addBond(bond);

  //   // Spend mega amount for rate 3 as player 3
  //   const tx_lu1 = await bondProgram.methods
  //     .buyBond(2, new BN(ibo.index), new BN(megaPurchase))
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
  //   const newBondExt: Bond = await user.addBond(
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

  it("Buy gated bond offered on ibo", async () => {
    // Get lock-up
    const lockup: LockUp = ibo.lockups[ibo.lockups.length - 1];

    // Get gate
    const gate: GatedSettings = ibo.gates[lockup.gateIdx];

    // Need to ensure they have NFT
    const user: User = users.users[5];
    const bond: Bond = await ibo.addBond(3, purchaseAmount);

    console.log("nftWallet.publicKey: ", nftWallet.publicKey.toBase58());

    // const user2ATA_nft = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   user,
    //   mintKey,
    //   user.publicKey
    // );

    // send that lad NFT
    // await metaplex.nfts().transfer({
    //   nftOrSft: nft_handle,
    //   authority: nftWallet,
    //   fromOwner: nftWallet.publicKey,
    //   toOwner: user.publicKey,
    //   amount: token(1),
    // });

    // mint: mintKey,
    //     nftTokenAccount: user2ATA_nft.address,
    //     nftMasterEditionAccount: nftMasteEdition_account,
    //     nftMetadataAccount: nftMetadataAccount,

    // Treansfer nft to the user
    let collectionM: NftMint0 = cm.collections[0];
    console.log("Sending nft: ");
    await collectionM.nfts[0].transferFromMinter(user.publicKey);
    console.log("Sent nft: ");

    // Spend 500 for rate 1 as player 1

    try {
      const tx_lu1 = await bondProgram.methods
        .buyBond(lockup.index, new BN(ibo.index), new BN(10000), 0)
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
    } catch (e) {
      console.log("\nerror:\n\n", e);
    }

    console.log("\n\nGATED BUY\n\n");
  });
});
