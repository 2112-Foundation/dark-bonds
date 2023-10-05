const fs = require("fs");
const path = require("path");
const solanaWeb3 = require("@solana/web3.js");
import { PublicKey } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";
const BN = anchor.BN;

export function createSameAsMainIboInput() {
  return {
    sameAsMainIbo: {},
  };
}

export function createLockupPurchaseStartInput(start: number) {
  // Ensure that 'start' is a BN instance.
  const startBN = new BN(start);
  return {
    lockupPurchaseStart: {
      start: startBN,
    },
  };
}

export function createLockupPurchaseEndInput(end: number) {
  // Ensure that 'end' is a BN instance.
  const endBN = new BN(end);
  return {
    lockupPurchaseEnd: {
      end: endBN,
    },
  };
}

export function createLockupPurchaseCombinedInput(start: number, end: number) {
  // Ensure that 'start' and 'end' are BN instances.
  const startBN = new BN(start);
  const endBN = new BN(end);

  return {
    lockupPurchaseCombined: {
      start: startBN,
      end: endBN,
    },
  };
}

export function createCollectionTypeInput(
  metadata: PublicKey,
  masterMint: PublicKey,
  creator: PublicKey
) {
  return {
    collection: {
      gate: {
        metadata: metadata,
        masterMint: masterMint,
        creator: creator,
      },
    },
  };
}

export function createSplTypeInput(
  splMint: PublicKey,
  minimumOwnership: number,
  amountPerToken: number
) {
  const minimumOwnershipBN = new BN(minimumOwnership);
  const amountPerTokenBN = new BN(amountPerToken);

  return {
    spl: {
      gate: {
        splMint,
        minimumOwnershipBN,
        amountPerTokenBN,
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
    combined: {
      gate_collection: {
        metadata: collectionMetadata,
        masterMint: collectionMasterMint,
        creator: collectionCreator,
      },
      spl_gate: {
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
