"use client";
import React from "react";
import Link from "next/link";
import { IoLogoOctocat } from "react-icons/io";
import { BiSolidBook, BiLaptop } from "react-icons/bi";
import { FaWallet } from "react-icons/fa";
import styles from "./Navbar.module.css";
import "../../../../app/globals.css";
import { usePathname } from "next/navigation";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
require("@solana/wallet-adapter-react-ui/styles.css");

const Navbar = () => {
  const pathname = usePathname();
  const wallet = useWallet();
  return (
    <div className="flex items-center w-full h-20 bg-sable-green-page-bg top-0 px-5">
      <div className="foo flex justify-between container mx-auto px-5 h-full">
        <a
          href="/"
          className="flex justify-end items-center text-sable-green-text text-2xl"
        >
          SABLE
          <div className="p-1 mx-2 bg-[#283a3a] text-[#70a1a2] border-solid">
            Beta
          </div>
        </a>
        <div className="flex justify-end content-center items-center">
          {/* <Logo /> */}
          <ul className="flex gap-x-3 items-center content-center text-sable-green-text">
            <li className="border-solid border-[1px] border-sable-green-text p-2 rounded-md">
              <Link href="/discord">
                <IoLogoOctocat />
              </Link>
            </li>
            <li className="border-solid border-[1px] border-sable-green-text p-2 rounded-md">
              <Link href="/book">
                <BiSolidBook />
              </Link>
            </li>
            {pathname == "/" && (
              <li className="border-solid border-[1px] border-sable-green-text px-1 rounded-md">
                <Link
                  href="/app"
                  className="flex items-center text-[18px] p-1"
                  style={{ fontFamily: "Mono" }}
                >
                  <div className="mx-2">
                    <BiLaptop />
                  </div>
                  APP
                </Link>
              </li>
            )}
            {pathname == "/app" && (
              <li className="border-solid border-[1px] border-sable-green-text px-1 rounded-md">
                <div
                  onClick={() => {
                    console.log("Hello");
                  }}
                  className="flex items-center text-[16px] p-1"
                  style={{ fontFamily: "Mono" }}
                >
                  <div className="mx-2">
                    <FaWallet />
                  </div>
                  LOGIN
                </div>
              </li>
            )}
            <WalletMultiButton />
            {/* {wallet.connected && <WalletMultiButton />} */}
            {/* {wallet.connected && <WalletDisconnectButton />} */}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
