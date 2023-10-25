import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Master, Ibo, Bond } from "@/js/darkbonds/dark-bonds";
import { BN } from "@coral-xyz/anchor";
import { BigNumber } from "@metaplex-foundation/js";

const PROGRAM_ID = new PublicKey(
  "CkAJr4F6zYzDL2ov5uZgJFtupqzSsSuPXgh1Paed7K6n"
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

  //print master data after set
  useEffect(() => {
    console.log(masterData);
    if (masterData?.iboCounter) runAddIboTest(masterData!);
  }, [masterData]);

  function runAddIboTest(info: Master) {
    console.log("Running IBO test");
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
