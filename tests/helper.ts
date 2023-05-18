const fs = require("fs");
const path = require("path");
const solanaWeb3 = require("@solana/web3.js");
import * as anchor from "@project-serum/anchor";

export function loadKeypairFromFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  let secretKeyString;
  try {
    secretKeyString = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error("Error reading file:", err);
  }
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

  let keypair;
  try {
    keypair = anchor.web3.Keypair.fromSeed(
      Uint8Array.from(Buffer.from(secretKey).slice(0, 32))
    );
  } catch (err) {
    console.log("Error creating keypair:", err);
  }

  return keypair;
}
