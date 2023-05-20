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

  console.log("|EHEHHEEHEH");

  const bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;
  console.log("|EHEHHEEHEH");
  const superAdmin = loadKeypairFromFile("./master-keypair.json"); // reused so that ATA are
  const adminIbo0 = anchor.web3.Keypair.generate();
  const bondBuyer1 = anchor.web3.Keypair.generate();
  const bondBuyer2 = anchor.web3.Keypair.generate();
  const resaleBuyer1 = anchor.web3.Keypair.generate();
  const nftWallet = anchor.web3.Keypair.generate();

  console.log("|EHEHHEEHEH");

  const shortBond = 20;

  let bondBuyer1ATA_sc;
  let bondBuyer2ATA_sc;
  let resaleBuyer1ATA_sc;
  let masterRecipientATA_sc;
  let adminIbo0ATA_sc;
  let iboAdminATA_sc;
  let bondBuyer1ATA_b;
  let bondBuyer2ATA_b;
  let resaleBuyer1ATA_b;

  let bondBuyer2ATA_nft;

  let bond0ATA_b;
  let bond1ATA_b;
  let bond2ATA_b;
  let bond3ATA_b;
  let bond4ATA_b;

  let ibo_index = 0;

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

  let swapCut = 200; // aka 2.0 %

  // bonds
  let bond0: PublicKey;
  let bond1: PublicKey;
  let bond2: PublicKey;
  let bond3: PublicKey; // TODO never gets made yet tests pass
  let bond4: PublicKey;

  let purchaseAmount = 500;
  let bond1ResalePrice = 100000;
  let megaPurchase = 100000000;

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

  // Gated
  let lockUp3PDA: PublicKey;
  let lockUp3Gate: PublicKey;
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

  let metaplex;
  let nft_handle;

  // Tree
  let tree: PublicKey;
  let vertex: PublicKey;

  // testing
  let bond_counter = 0;
  let lockup_counter = 0;
  let masterBalance = 0;

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
      topUp(nftWallet.publicKey),
    ]);

    // liquidity_token mint
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

    // Initialise bondBuyer ATAs for the liquidity_token
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

    adminIbo0ATA_sc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      adminIbo0,
      mintSC,
      adminIbo0.publicKey
    );

    masterRecipientATA_sc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      superAdmin,
      mintSC,
      superAdmin.publicKey
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

    // Pre mint 2 NFTs and give one to buyer 1

    metaplex = new Metaplex(provider.connection);
    metaplex.use(keypairIdentity(nftWallet));

    const { nft } = await metaplex.nfts().create({
      uri: "https://arweave.net/123",
      name: "CUNT",
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

    const { nft: printedNft } = await metaplex.nfts().printNewEdition({
      originalMint: nft.mint.address,
    });

    console.log("\n\nnft2: \n", nft);

    // nftWallet;

    // masterKey = nft.creators[0].address;
    // collectionKey = nft.creators[0].address;

    // Address for NFT
    bondBuyer2ATA_nft = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bondBuyer2,
      mintKey,
      bondBuyer2.publicKey
    );

    // Need to transfer the NFT
  });

  it("Main register initialised!", async () => {
    [mainIbo] = await PublicKey.findProgramAddress(
      [Buffer.from("main_register")],
      bondProgram.programId
    );

    try {
      let main_state = await bondProgram.account.master.fetch(mainIbo);
      ibo_index = parseInt(main_state.iboCounter.toString());
      console.log("\nAlreadyt deployed\n");
      console.log("ibo_index at ibo make: ", ibo_index);
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
    // Get ibo counter for this run
    let main_state = await bondProgram.account.master.fetch(mainIbo);
    ibo_index = parseInt(main_state.iboCounter.toString());

    console.log("ibo_index at ibo make: ", ibo_index);

    // Derive ibo pda for counter 0
    [ibo0] = await PublicKey.findProgramAddress(
      [
        Buffer.from("ibo_instance"),
        new BN(ibo_index).toArrayLike(Buffer, "be", 8),
      ],
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
        new anchor.BN(liveDate + 100000), // Can buy bonds until that point in the future
        swapCut,
        mintSC,
        adminIbo0.publicKey
      )
      .accounts({
        master: mainIbo,
        admin: adminIbo0.publicKey,
        ibo: ibo0,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([adminIbo0])
      .rpc();
  });

  it("Add tree to the bond offering", async () => {
    // derive tree index
    [tree] = await PublicKey.findProgramAddress(
      [
        Buffer.from("tree"),
        Buffer.from(ibo0.toBytes()),
        new BN(0).toArrayLike(Buffer, "be", 1),
      ],
      bondProgram.programId
    );

    const tx = await bondProgram.methods
      .addTree(0, 0, 2)
      .accounts({
        admin: adminIbo0.publicKey,
        tree: tree,
        ibo: ibo0,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([adminIbo0])
      .rpc();
  });

  it("Add vertex to the tree", async () => {
    // "vertex".as_bytes(),
    // ibo.key().as_ref(),
    // &tree_idx.to_be_bytes(),
    // &vertex_idx.to_be_bytes(),

    [vertex] = await PublicKey.findProgramAddress(
      [
        Buffer.from("vertex"),
        Buffer.from(ibo0.toBytes()),
        new BN(0).toArrayLike(Buffer, "be", 1),
        new BN(0).toArrayLike(Buffer, "be", 1),
      ],
      bondProgram.programId
    );

    const tx = await bondProgram.methods
      .addVertex(0, 0, 0)
      .accounts({
        admin: adminIbo0.publicKey,
        vertex: vertex,
        tree: tree,
        ibo: ibo0,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([adminIbo0])
      .rpc();
  });
});
