const fs = require("fs");
const path = require("path");
const solanaWeb3 = require("@solana/web3.js");
import { PublicKey } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";

export function createCollectionTypeInput(
  metadata: PublicKey,
  masterMint: PublicKey,
  creator: PublicKey
) {
  return {
    collectionType: {
      collection: {
        metadata: metadata,
        masterMint: masterMint,
        creator: creator,
      },
    },
  };
}

export function createSplTypeInput(
  splMint: string,
  minimumOwnership: number,
  amountPerToken: number | null
) {
  return {
    splType: {
      spl: {
        splMint,
        minimumOwnership,
        amountPerToken,
      },
    },
  };
}

export function createCombinedTypeInput(
  collectionMetadata: string,
  collectionMasterMint: string,
  collectionCreator: string,
  splMint: string,
  splMinimumOwnership: number,
  splAmountPerToken: number | null
) {
  return {
    combinedType: {
      collection: {
        metadata: collectionMetadata,
        masterMint: collectionMasterMint,
        creator: collectionCreator,
      },
      splType: {
        // <- Note the change here
        splMint: splMint,
        minimumOwnership: splMinimumOwnership,
        amountPerToken: splAmountPerToken,
      },
    },
  };
}

export function loadKeypairFromFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  let secretKeyString;
  try {
    secretKeyString = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error("Error reading file:", err);
  }
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

  let keypair: anchor.web3.Keypair;
  try {
    keypair = anchor.web3.Keypair.fromSeed(
      Uint8Array.from(Buffer.from(secretKey).slice(0, 32))
    );
  } catch (err) {
    console.log("Error creating keypair:", err);
  }

  return keypair;
}
export function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
export function roughlyEqual(
  desired: number,
  actual: number,
  deviation: number
) {
  const lowerBound = desired - desired * (deviation / 100);
  const upperBound = desired + desired * (deviation / 100);

  console.log("lowerBound: ", lowerBound);
  console.log("upperBound: ", upperBound);
  console.log("desired: ", desired);
  console.log("actual: ", actual);

  return actual >= lowerBound && actual <= upperBound;
}
