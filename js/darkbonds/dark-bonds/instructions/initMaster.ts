/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";

/**
 * @category Instructions
 * @category InitMaster
 * @category generated
 */
export type InitMasterInstructionArgs = {
  iboCreationFee: beet.bignum;
  lockupFee: beet.bignum;
  gateAdditionFee: beet.bignum;
  purchaseCut: beet.bignum;
  resaleCut: beet.bignum;
  bondClaimFee: beet.bignum;
  bondPurchaseFee: beet.bignum;
  bondSplitFee: beet.bignum;
};
/**
 * @category Instructions
 * @category InitMaster
 * @category generated
 */
export const initMasterStruct = new beet.BeetArgsStruct<
  InitMasterInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["iboCreationFee", beet.u64],
    ["lockupFee", beet.u64],
    ["gateAdditionFee", beet.u64],
    ["purchaseCut", beet.u64],
    ["resaleCut", beet.u64],
    ["bondClaimFee", beet.u64],
    ["bondPurchaseFee", beet.u64],
    ["bondSplitFee", beet.u64],
  ],
  "InitMasterInstructionArgs"
);
/**
 * Accounts required by the _initMaster_ instruction
 *
 * @property [_writable_, **signer**] superadmin
 * @property [_writable_] main
 * @category Instructions
 * @category InitMaster
 * @category generated
 */
export type InitMasterInstructionAccounts = {
  superadmin: web3.PublicKey;
  main: web3.PublicKey;
  systemProgram?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
};

export const initMasterInstructionDiscriminator = [
  168, 49, 22, 248, 228, 56, 111, 24,
];

/**
 * Creates a _InitMaster_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category InitMaster
 * @category generated
 */
export function createInitMasterInstruction(
  accounts: InitMasterInstructionAccounts,
  args: InitMasterInstructionArgs,
  programId = new web3.PublicKey("8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV")
) {
  const [data] = initMasterStruct.serialize({
    instructionDiscriminator: initMasterInstructionDiscriminator,
    ...args,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.superadmin,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.main,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
  return ix;
}
