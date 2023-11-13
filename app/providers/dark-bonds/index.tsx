import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Master,
  Ibo,
  Bond,
  createCreateIboInstruction,
} from "@/js/darkbonds/dark-bonds";
import { BN } from "@coral-xyz/anchor";
import { BigNumber } from "@metaplex-foundation/js";
import { Mint } from "@/tests/mint";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  Account,
} from "@solana/spl-token";
import { Program, web3 } from "@project-serum/anchor";
// import { DarkBonds } from "@/target/types/dark_bonds";

const PROGRAM_ID = new PublicKey(
  "CkAJr4F6zYzDL2ov5uZgJFtupqzSsSuPXgh1Paed7K6n"
);
const MACHINE_WALLET_ID = new PublicKey(
  "ALHiCK3L3MRqT2QMfa2ivVwv67uoRfqfXGhQgwbmRCYf"
);
export const MAIN_SEED = "master";
export const IBO_SEED = "ibo";
export const BOND_SEED = "bond";

export const MINUTE = 60;
export const HOUR = 3600;
export const WEEK = 604800;

type DarkBondsContextData = {
  testing: string;
};

const defaultState: DarkBondsContextData = {
  testing: "This is the default",
};

const DarkBondsContext = createContext<DarkBondsContextData>(defaultState);

const DarkBondsProvider = ({ children }: { children: JSX.Element }) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const signAndSend = useCallback(
    async (ix: TransactionInstruction[]) => {
      if (!signTransaction || !publicKey || !connection) {
        throw "Wallet connection error! Refresh, reconnect your wallet and try again.";
      }

      const transaction = new Transaction();
      ix.forEach((ix) => {
        transaction.add(ix);
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signed = await signTransaction(transaction);

      // console.log("Here 2a");

      const sent = await connection.sendRawTransaction(signed.serialize(), {
        // maxRetries: 3,
        maxRetries: 1,
      });

      // console.log("Here 3a");

      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: sent,
      });
    },
    [connection, publicKey, signTransaction]
  );

  //Master
  const [master] = useMemo(() => {
    var x = PublicKey.findProgramAddressSync(
      [Buffer.from(MAIN_SEED)],
      PROGRAM_ID
    );
    // console.log(x);
    return x;
  }, []);

  const [masterPDA] = useMemo(() => {
    var x = PublicKey.findProgramAddressSync(
      [Buffer.from(MAIN_SEED)],
      PROGRAM_ID
    );
    return x;
  }, []);

  const [masterData, setMasterData] = useState<Master | null>(null);
  const refetchMasterData = useCallback(async () => {
    const data = await Master.fromAccountAddress(connection, masterPDA).then();
    setMasterData(data);
  }, [connection, masterPDA]);

  useEffect(() => {
    (async () => {
      await refetchMasterData();
    })();
  }, [refetchMasterData]);

  //Ibo
  const [ibo] = useMemo(() => {
    var x = PublicKey.findProgramAddressSync(
      [Buffer.from(IBO_SEED), new BN(0).toArrayLike(Buffer, "be", 8)],
      PROGRAM_ID
    );
    // console.log(x);
    return x;
  }, [master]);

  const [iboData, setIboData] = useState<Ibo | null>(null);
  const refetchIboData = useCallback(async () => {
    const data = await Ibo.fromAccountAddress(connection, ibo);
    console.log(data);
    setIboData(data);
  }, [ibo, connection]);

  useEffect(() => {
    (async () => {
      await refetchIboData();
    })();
  }, [refetchIboData]);

  //print master data after set
  useEffect(() => {
    console.log(masterData);
    if (masterData?.iboCounter) runAddIboTest(masterData!);
  }, [masterData]);

  async function runAddIboTest(info: Master) {
    await test();
  }

  const adminIbo0 = anchor.web3.Keypair.generate();
  const mintAuthSC = anchor.web3.Keypair.generate();
  const mintAuthB = anchor.web3.Keypair.generate();
  const mintAuthWl = anchor.web3.Keypair.generate();
  let mintBond: Mint;
  let mintSc: Mint;
  let mintWhiteList: Mint;
  let mintSC: PublicKey; // Stable coin mint
  let mintB: PublicKey; // Bond coin mint
  let mintWL: PublicKey; // Bond coin mint
  let bondProgram: any;
  let exchangeRate: number = 40;
  let liveDate: number = 1683718579;
  let swapCut = 200; //
  const LAMPORTS_PER_SOL = 1000000000;
  // try {
  //   bondProgram = anchor.workspace.DarkBonds as Program<DarkBonds>;
  // } catch (err) {
  //   console.log("err: ", err);
  // }

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

  async function test() {
    await Promise.all([
      topUp(mintAuthSC.publicKey),
      topUp(mintAuthWl.publicKey),
      topUp(mintAuthB.publicKey),
      // topUp(nftWallet.publicKey),
    ]);

    // let ibo: Ibo;
    // ibo = await master.addIbo(
    //   exchangeRate,
    //   liveDate,
    //   liveDate + 100000, // Can buy bonds until that point in the future
    //   swapCut,
    //   mintBond,
    //   mintSc.mint,
    //   adminIbo0,
    //   adminIbo0.publicKey // If
    // );
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

    mintSc = new Mint(connection, mintAuthSC, mintSC);
    mintBond = new Mint(connection, mintAuthB, mintB);
    mintWhiteList = new Mint(connection, mintAuthWl, mintWL);
    // users = new Users(connection, mintSc, bondProgram.programId);
    console.log("Created classes");

    await Promise.all([
      // topUp(superAdmin.publicKey),
      topUp(adminIbo0.publicKey),
      // topUp(nftWallet.publicKey),
      // users.addUsers(10),
    ]);

    console.log("Inside AddIBO");
    const iboPda = PublicKey.findProgramAddressSync(
      [Buffer.from(IBO_SEED), new BN(0).toArrayLike(Buffer, "be", 8)],
      PROGRAM_ID
    )[0];

    console.log("Getting iboAccount makeAta");
    // let superAdminAta_sc: Account;
    // superAdminAta_sc = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   superAdmin,
    //   mintSC,
    //   superAdmin.publicKey
    // );

    const iboAccount = await mintBond.makeAta(iboPda);
    // const iboAccount = await getOrCreateAssociatedTokenAccount(
    //   mintBond.makeAta,
    //   mintBond.mintAuth,
    //   mintBond.mint,
    //   iboPda,
    //   true
    // );
    const iboAdminLiquidityAccount = await mintSc.makeAta(iboPda);

    // const newIbo = await
    // const iboAdminLiquidityAccount = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   mintAuthSC,
    //   mintAuthSC.publicKey,
    //   // recipientPubkey ? recipientPubkey : iboPda,recipientPubkey ? recipientPubkey : iboPda
    //   iboPda,
    //   true
    // );

    // try {
    //   const tx = await bondProgram.methods
    //     .createIbo(
    //       "test description",
    //       "test link",
    //       new BN(exchangeRate),
    //       new BN(liveDate),
    //       new BN(liveDate + 100000),
    //       swapCut,
    //       mintSc.mint, //liquidityMint
    //       mintBond.mint, //mintB
    //       iboAdminLiquidityAccount //Recipient
    //     )
    //     .accounts({
    //       master: masterPDA,
    //       admin: adminIbo0,
    //       ibo: iboPda,
    //       systemProgram: anchor.web3.SystemProgram.programId,
    //     })
    //     .signers([adminIbo0])
    //     .rpc();

    //   masterData?.iboCounter;
    // } catch (err) {
    //   console.log("test 1 err: ", err);
    // }

    try {
      console.log("trying to create ibo instruction");
      const ix = createCreateIboInstruction(
        {
          master: masterPDA,
          //PHANTOM Wallet ID
          admin: new PublicKey("ALHiCK3L3MRqT2QMfa2ivVwv67uoRfqfXGhQgwbmRCYf"),
          ibo: iboPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        {
          description: "Create new IBO",
          link: "Test Link",
          fixedExchangeRate: new BN(exchangeRate),
          liveDate: new BN(liveDate),
          endDate: new BN(liveDate + 100000),
          swapCut: swapCut,
          liquidityToken: mintSc.mint,
          underlyingToken: mintBond.mint,
          recipient: iboAdminLiquidityAccount.address,
        },
        PROGRAM_ID
      );
      console.log(ix);
      await signAndSend([ix]);
    } catch (error) {
      console.log("signAndSend error ", error);
    }
  }

  //Ibo
  //   const [ibo] = useMemo(() => {
  //     var x = PublicKey.findProgramAddressSync(
  //       [Buffer.from(IBO_SEED), new BN(0).toArrayLike(Buffer, "be", 8)],
  //       PROGRAM_ID
  //     );
  //     // console.log(x);
  //     return x;
  //   }, [master]);

  //   const [iboData, setIboData] = useState<Ibo | null>(null);
  //   const refetchIboData = useCallback(async () => {
  //     const data = await Ibo.fromAccountAddress(connection, ibo);
  //     console.log(data);
  //     setIboData(data);
  //   }, [ibo, connection]);

  //   useEffect(() => {
  //     (async () => {
  //       await refetchIboData();
  //     })();
  //   }, [refetchIboData]);

  //Bonds
  //   const [bonds] = useMemo(() => {
  //     // console.log(ibo);
  //     var x = PublicKey.findProgramAddressSync(
  //       [
  //         Buffer.from(BOND_SEED),
  //         Buffer.from(ibo.toBytes()),
  //         new BN(1).toArrayLike(Buffer, "be", 4),
  //       ],
  //       PROGRAM_ID
  //     );
  //     return x;
  //   }, [ibo]);

  //   const [bondsData, setBondsData] = useState<Bond | null>(null);
  //   const refetchBondsData = useCallback(async () => {
  //     const data = await Bond.fromAccountAddress(connection, bonds);
  //     // console.log(data);
  //     setBondsData(data);
  //   }, [bonds, connection]);

  //   useEffect(() => {
  //     (async () => {
  //       await refetchBondsData();
  //     })();
  //   }, [refetchBondsData]);

  return (
    <DarkBondsContext.Provider
      value={{
        testing: defaultState.testing,
      }}
    >
      {children}
    </DarkBondsContext.Provider>
  );
};

const useDarkBonds = () => {
  const state = useContext(DarkBondsContext);
  return { ...state };
};

export default DarkBondsProvider;
export { useDarkBonds };
