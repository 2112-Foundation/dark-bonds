"use client";
import { ReactNode } from "react";
import Navbar from "../components/navigation/navbar";
import Footer from "../components/navigation/footer";
import "../globals.css";
import { Montserrat } from "next/font/google";
import { ReduxProvider } from "../redux/provider";
import { useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "../../src/idl.json";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
require("@solana/wallet-adapter-react-ui/styles.css");

const wallets = [new PhantomWalletAdapter()];

interface Props {
  children?: ReactNode;
  // any props that come into the component
}

export function Providers({ children, ...props }: Props) {
  return (
    <ConnectionProvider endpoint="http://127.0.0.1:8899">
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <ReduxProvider>
            <Navbar />
            {children}
            <Footer />
          </ReduxProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
