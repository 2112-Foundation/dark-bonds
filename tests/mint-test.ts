import {
  keypairIdentity,
  KeypairIdentityDriver,
  Metaplex,
  toBigNumber,
  token,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import {
  Connection,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Program, Wallet } from "@project-serum/anchor";
// import { MetaplexAnchorNft } from "../target/types/metaplex_anchor_nft";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  MINT_SIZE,
} from "@solana/spl-token"; // IGNORE THESE ERRORS IF ANY
const { SystemProgram } = anchor.web3;

describe("mint mate", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as Wallet;
  anchor.setProvider(provider);
  //   const program = anchor.workspace
  // .MetaplexAnchorNft as Program<MetaplexAnchorNft>;

  it("Is initialized!", async () => {
    // Add your test here.

    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    const lamports = 10000000000;
    const getMetadata = async (
      mint: anchor.web3.PublicKey
    ): Promise<anchor.web3.PublicKey> => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
      )[0];
    };

    const getMasterEdition = async (
      mint: anchor.web3.PublicKey
    ): Promise<anchor.web3.PublicKey> => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
            Buffer.from("edition"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
      )[0];
    };

    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const NftTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      wallet.publicKey
    );
    console.log("NFT Account: ", NftTokenAccount.toBase58());

    const mint_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      createInitializeMintInstruction(
        mintKey.publicKey,
        0,
        wallet.publicKey,
        wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        NftTokenAccount,
        wallet.publicKey,
        mintKey.publicKey
      )
    );
  });

  it("Test mint", async () => {
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    // const keypair = Keypair.fromSecretKey(
    //   Buffer.from(JSON.parse(process.env.SOLANA_KEYPAIR!.toString()))
    // );

    const keypair = anchor.web3.Keypair.generate();
    const owner = anchor.web3.Keypair.generate();

    const metaplex = new Metaplex(connection);
    metaplex.use(keypairIdentity(keypair));

    const feePayerAirdropSignature = await connection.requestAirdrop(
      keypair.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(feePayerAirdropSignature);

    const { nft } = await metaplex.nfts().create({
      uri: "https://arweave.net/123",
      name: "CUNT",
      sellerFeeBasisPoints: 500,
      maxSupply: toBigNumber(5),
      isMutable: false,
    });

    console.log(nft);

    // console.log("mint address: ", mintNFTResponse.mintAddress.toBase58());

    // await metaplex.nfts().mint({
    //   nftOrSft: nft,
    //   toOwner: owner.publicKey,
    //   amount: token(1),
    // });

    const { nft: printedNft } = await metaplex.nfts().printNewEdition({
      originalMint: nft.mint.address,
    });

    console.log("\n\nprintedNft: ", printedNft);

    console.log("wallet.pubkey :", wallet.publicKey.toBase58());
    console.log("keypair :", keypair.publicKey.toBase58());

    await metaplex.nfts().transfer({
      nftOrSft: nft,
      authority: keypair,
      fromOwner: keypair.publicKey,
      toOwner: owner.publicKey,
      amount: token(1),
    });

    console.log("Transferred");

    // await metaplex.nfts().update({
    //   nftOrSft: nft,
    //   name: "My Updated Name",
    // });

    const myNfts = await metaplex.nfts().findAllByOwner({
      owner: owner.publicKey,
    });

    console.log("NFTs owner by: ", myNfts);
  });
});
