/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

type ErrorWithCode = Error & { code: number };
type MaybeErrorWithCode = ErrorWithCode | null | undefined;

const createErrorFromCodeLookup: Map<number, () => ErrorWithCode> = new Map();
const createErrorFromNameLookup: Map<string, () => ErrorWithCode> = new Map();

/**
 * WithdrawTooEarly: 'Need 24h between withdraws'
 *
 * @category Errors
 * @category generated
 */
export class WithdrawTooEarlyError extends Error {
  readonly code: number = 0x1770;
  readonly name: string = "WithdrawTooEarly";
  constructor() {
    super("Need 24h between withdraws");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, WithdrawTooEarlyError);
    }
  }
}

createErrorFromCodeLookup.set(0x1770, () => new WithdrawTooEarlyError());
createErrorFromNameLookup.set(
  "WithdrawTooEarly",
  () => new WithdrawTooEarlyError()
);

/**
 * WorngCutTMP: 'Wrong cut?'
 *
 * @category Errors
 * @category generated
 */
export class WorngCutTMPError extends Error {
  readonly code: number = 0x1771;
  readonly name: string = "WorngCutTMP";
  constructor() {
    super("Wrong cut?");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, WorngCutTMPError);
    }
  }
}

createErrorFromCodeLookup.set(0x1771, () => new WorngCutTMPError());
createErrorFromNameLookup.set("WorngCutTMP", () => new WorngCutTMPError());

/**
 * NonZeroFees: 'Bruh we ain't charity'
 *
 * @category Errors
 * @category generated
 */
export class NonZeroFeesError extends Error {
  readonly code: number = 0x1772;
  readonly name: string = "NonZeroFees";
  constructor() {
    super("Bruh we ain't charity");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NonZeroFeesError);
    }
  }
}

createErrorFromCodeLookup.set(0x1772, () => new NonZeroFeesError());
createErrorFromNameLookup.set("NonZeroFees", () => new NonZeroFeesError());

/**
 * IboLockupsLocked: 'Can not add or remove lockup type'
 *
 * @category Errors
 * @category generated
 */
export class IboLockupsLockedError extends Error {
  readonly code: number = 0x1773;
  readonly name: string = "IboLockupsLocked";
  constructor() {
    super("Can not add or remove lockup type");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IboLockupsLockedError);
    }
  }
}

createErrorFromCodeLookup.set(0x1773, () => new IboLockupsLockedError());
createErrorFromNameLookup.set(
  "IboLockupsLocked",
  () => new IboLockupsLockedError()
);

/**
 * IboRateLocked: 'Can not add modify the exchange rate'
 *
 * @category Errors
 * @category generated
 */
export class IboRateLockedError extends Error {
  readonly code: number = 0x1774;
  readonly name: string = "IboRateLocked";
  constructor() {
    super("Can not add modify the exchange rate");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IboRateLockedError);
    }
  }
}

createErrorFromCodeLookup.set(0x1774, () => new IboRateLockedError());
createErrorFromNameLookup.set("IboRateLocked", () => new IboRateLockedError());

/**
 * IboGatedSettingsLocked: 'Can not add or remove gate type'
 *
 * @category Errors
 * @category generated
 */
export class IboGatedSettingsLockedError extends Error {
  readonly code: number = 0x1775;
  readonly name: string = "IboGatedSettingsLocked";
  constructor() {
    super("Can not add or remove gate type");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IboGatedSettingsLockedError);
    }
  }
}

createErrorFromCodeLookup.set(0x1775, () => new IboGatedSettingsLockedError());
createErrorFromNameLookup.set(
  "IboGatedSettingsLocked",
  () => new IboGatedSettingsLockedError()
);

/**
 * IboBondsSoldOut: 'There aren't enought tokens left for this bond allocation. Try again with a smaller amount'
 *
 * @category Errors
 * @category generated
 */
export class IboBondsSoldOutError extends Error {
  readonly code: number = 0x1776;
  readonly name: string = "IboBondsSoldOut";
  constructor() {
    super(
      "There aren't enought tokens left for this bond allocation. Try again with a smaller amount"
    );
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IboBondsSoldOutError);
    }
  }
}

createErrorFromCodeLookup.set(0x1776, () => new IboBondsSoldOutError());
createErrorFromNameLookup.set(
  "IboBondsSoldOut",
  () => new IboBondsSoldOutError()
);

/**
 * IboNotdmin: 'Signing account is not IBO admin'
 *
 * @category Errors
 * @category generated
 */
export class IboNotdminError extends Error {
  readonly code: number = 0x1777;
  readonly name: string = "IboNotdmin";
  constructor() {
    super("Signing account is not IBO admin");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IboNotdminError);
    }
  }
}

createErrorFromCodeLookup.set(0x1777, () => new IboNotdminError());
createErrorFromNameLookup.set("IboNotdmin", () => new IboNotdminError());

/**
 * BondNotForSale: 'This bond is not for sale'
 *
 * @category Errors
 * @category generated
 */
export class BondNotForSaleError extends Error {
  readonly code: number = 0x1778;
  readonly name: string = "BondNotForSale";
  constructor() {
    super("This bond is not for sale");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, BondNotForSaleError);
    }
  }
}

createErrorFromCodeLookup.set(0x1778, () => new BondNotForSaleError());
createErrorFromNameLookup.set(
  "BondNotForSale",
  () => new BondNotForSaleError()
);

/**
 * BondNotBondOwner: 'Signing account is not the owner of this bond'
 *
 * @category Errors
 * @category generated
 */
export class BondNotBondOwnerError extends Error {
  readonly code: number = 0x1779;
  readonly name: string = "BondNotBondOwner";
  constructor() {
    super("Signing account is not the owner of this bond");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, BondNotBondOwnerError);
    }
  }
}

createErrorFromCodeLookup.set(0x1779, () => new BondNotBondOwnerError());
createErrorFromNameLookup.set(
  "BondNotBondOwner",
  () => new BondNotBondOwnerError()
);

/**
 * MintMismatch: 'Mint of the provided token account is not the one set in the ibo'
 *
 * @category Errors
 * @category generated
 */
export class MintMismatchError extends Error {
  readonly code: number = 0x177a;
  readonly name: string = "MintMismatch";
  constructor() {
    super("Mint of the provided token account is not the one set in the ibo");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, MintMismatchError);
    }
  }
}

createErrorFromCodeLookup.set(0x177a, () => new MintMismatchError());
createErrorFromNameLookup.set("MintMismatch", () => new MintMismatchError());

/**
 * BondMatureOnly: 'This bond can only be claimed at the end of the lockup duration'
 *
 * @category Errors
 * @category generated
 */
export class BondMatureOnlyError extends Error {
  readonly code: number = 0x177b;
  readonly name: string = "BondMatureOnly";
  constructor() {
    super("This bond can only be claimed at the end of the lockup duration");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, BondMatureOnlyError);
    }
  }
}

createErrorFromCodeLookup.set(0x177b, () => new BondMatureOnlyError());
createErrorFromNameLookup.set(
  "BondMatureOnly",
  () => new BondMatureOnlyError()
);

/**
 * RestrictedLockup: 'Purchase requires seperate function call with NTF ownership proof'
 *
 * @category Errors
 * @category generated
 */
export class RestrictedLockupError extends Error {
  readonly code: number = 0x177c;
  readonly name: string = "RestrictedLockup";
  constructor() {
    super("Purchase requires seperate function call with NTF ownership proof");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, RestrictedLockupError);
    }
  }
}

createErrorFromCodeLookup.set(0x177c, () => new RestrictedLockupError());
createErrorFromNameLookup.set(
  "RestrictedLockup",
  () => new RestrictedLockupError()
);

/**
 * InvalidNFTAccountMint: 'The mint of the NFT token account is not the expected mint'
 *
 * @category Errors
 * @category generated
 */
export class InvalidNFTAccountMintError extends Error {
  readonly code: number = 0x177d;
  readonly name: string = "InvalidNFTAccountMint";
  constructor() {
    super("The mint of the NFT token account is not the expected mint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidNFTAccountMintError);
    }
  }
}

createErrorFromCodeLookup.set(0x177d, () => new InvalidNFTAccountMintError());
createErrorFromNameLookup.set(
  "InvalidNFTAccountMint",
  () => new InvalidNFTAccountMintError()
);

/**
 * InvalidNFTAccountAmount: 'The amount of the NFT token account is not 1'
 *
 * @category Errors
 * @category generated
 */
export class InvalidNFTAccountAmountError extends Error {
  readonly code: number = 0x177e;
  readonly name: string = "InvalidNFTAccountAmount";
  constructor() {
    super("The amount of the NFT token account is not 1");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidNFTAccountAmountError);
    }
  }
}

createErrorFromCodeLookup.set(0x177e, () => new InvalidNFTAccountAmountError());
createErrorFromNameLookup.set(
  "InvalidNFTAccountAmount",
  () => new InvalidNFTAccountAmountError()
);

/**
 * InvalidMasterEdition: 'The NFT main edition account is not valid'
 *
 * @category Errors
 * @category generated
 */
export class InvalidMasterEditionError extends Error {
  readonly code: number = 0x177f;
  readonly name: string = "InvalidMasterEdition";
  constructor() {
    super("The NFT main edition account is not valid");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidMasterEditionError);
    }
  }
}

createErrorFromCodeLookup.set(0x177f, () => new InvalidMasterEditionError());
createErrorFromNameLookup.set(
  "InvalidMasterEdition",
  () => new InvalidMasterEditionError()
);

/**
 * InvalidMetadata: 'The NFT metadata account is not valid'
 *
 * @category Errors
 * @category generated
 */
export class InvalidMetadataError extends Error {
  readonly code: number = 0x1780;
  readonly name: string = "InvalidMetadata";
  constructor() {
    super("The NFT metadata account is not valid");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidMetadataError);
    }
  }
}

createErrorFromCodeLookup.set(0x1780, () => new InvalidMetadataError());
createErrorFromNameLookup.set(
  "InvalidMetadata",
  () => new InvalidMetadataError()
);

/**
 * InvalidCreator: 'The creator of the NFT is not the expected creator or is not verified'
 *
 * @category Errors
 * @category generated
 */
export class InvalidCreatorError extends Error {
  readonly code: number = 0x1781;
  readonly name: string = "InvalidCreator";
  constructor() {
    super(
      "The creator of the NFT is not the expected creator or is not verified"
    );
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidCreatorError);
    }
  }
}

createErrorFromCodeLookup.set(0x1781, () => new InvalidCreatorError());
createErrorFromNameLookup.set(
  "InvalidCreator",
  () => new InvalidCreatorError()
);

/**
 * BondInvalidCaller: 'The caller is not the onwer of this bond'
 *
 * @category Errors
 * @category generated
 */
export class BondInvalidCallerError extends Error {
  readonly code: number = 0x1782;
  readonly name: string = "BondInvalidCaller";
  constructor() {
    super("The caller is not the onwer of this bond");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, BondInvalidCallerError);
    }
  }
}

createErrorFromCodeLookup.set(0x1782, () => new BondInvalidCallerError());
createErrorFromNameLookup.set(
  "BondInvalidCaller",
  () => new BondInvalidCallerError()
);

/**
 * WithdrawLocked: 'Can not withdraw until IBO is over'
 *
 * @category Errors
 * @category generated
 */
export class WithdrawLockedError extends Error {
  readonly code: number = 0x1783;
  readonly name: string = "WithdrawLocked";
  constructor() {
    super("Can not withdraw until IBO is over");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, WithdrawLockedError);
    }
  }
}

createErrorFromCodeLookup.set(0x1783, () => new WithdrawLockedError());
createErrorFromNameLookup.set(
  "WithdrawLocked",
  () => new WithdrawLockedError()
);

/**
 * InvalidRecursiveIdx: 'Provided wrong number to the derivation'
 *
 * @category Errors
 * @category generated
 */
export class InvalidRecursiveIdxError extends Error {
  readonly code: number = 0x1784;
  readonly name: string = "InvalidRecursiveIdx";
  constructor() {
    super("Provided wrong number to the derivation");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidRecursiveIdxError);
    }
  }
}

createErrorFromCodeLookup.set(0x1784, () => new InvalidRecursiveIdxError());
createErrorFromNameLookup.set(
  "InvalidRecursiveIdx",
  () => new InvalidRecursiveIdxError()
);

/**
 * WrongVertexAccount: 'Provided wrong vertex'
 *
 * @category Errors
 * @category generated
 */
export class WrongVertexAccountError extends Error {
  readonly code: number = 0x1785;
  readonly name: string = "WrongVertexAccount";
  constructor() {
    super("Provided wrong vertex");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, WrongVertexAccountError);
    }
  }
}

createErrorFromCodeLookup.set(0x1785, () => new WrongVertexAccountError());
createErrorFromNameLookup.set(
  "WrongVertexAccount",
  () => new WrongVertexAccountError()
);

/**
 * MissingVertexAccount: 'Provided wrong number of vertex accounts'
 *
 * @category Errors
 * @category generated
 */
export class MissingVertexAccountError extends Error {
  readonly code: number = 0x1786;
  readonly name: string = "MissingVertexAccount";
  constructor() {
    super("Provided wrong number of vertex accounts");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, MissingVertexAccountError);
    }
  }
}

createErrorFromCodeLookup.set(0x1786, () => new MissingVertexAccountError());
createErrorFromNameLookup.set(
  "MissingVertexAccount",
  () => new MissingVertexAccountError()
);

/**
 * IncorrectRatioRemaining: 'Accounts after vertices need to be in multiple of three'
 *
 * @category Errors
 * @category generated
 */
export class IncorrectRatioRemainingError extends Error {
  readonly code: number = 0x1787;
  readonly name: string = "IncorrectRatioRemaining";
  constructor() {
    super("Accounts after vertices need to be in multiple of three");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IncorrectRatioRemainingError);
    }
  }
}

createErrorFromCodeLookup.set(0x1787, () => new IncorrectRatioRemainingError());
createErrorFromNameLookup.set(
  "IncorrectRatioRemaining",
  () => new IncorrectRatioRemainingError()
);

/**
 * ConversionFailed: 'Couldnt up the number'
 *
 * @category Errors
 * @category generated
 */
export class ConversionFailedError extends Error {
  readonly code: number = 0x1788;
  readonly name: string = "ConversionFailed";
  constructor() {
    super("Couldnt up the number");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ConversionFailedError);
    }
  }
}

createErrorFromCodeLookup.set(0x1788, () => new ConversionFailedError());
createErrorFromNameLookup.set(
  "ConversionFailed",
  () => new ConversionFailedError()
);

/**
 * LockupDurationZero: 'Lockup duration cant be zero'
 *
 * @category Errors
 * @category generated
 */
export class LockupDurationZeroError extends Error {
  readonly code: number = 0x1789;
  readonly name: string = "LockupDurationZero";
  constructor() {
    super("Lockup duration cant be zero");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, LockupDurationZeroError);
    }
  }
}

createErrorFromCodeLookup.set(0x1789, () => new LockupDurationZeroError());
createErrorFromNameLookup.set(
  "LockupDurationZero",
  () => new LockupDurationZeroError()
);

/**
 * LockupDurationUnderDay: 'Lockup duration needs to be more than a day'
 *
 * @category Errors
 * @category generated
 */
export class LockupDurationUnderDayError extends Error {
  readonly code: number = 0x178a;
  readonly name: string = "LockupDurationUnderDay";
  constructor() {
    super("Lockup duration needs to be more than a day");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, LockupDurationUnderDayError);
    }
  }
}

createErrorFromCodeLookup.set(0x178a, () => new LockupDurationUnderDayError());
createErrorFromNameLookup.set(
  "LockupDurationUnderDay",
  () => new LockupDurationUnderDayError()
);

/**
 * LockupZeroApy: 'APY can't be zero'
 *
 * @category Errors
 * @category generated
 */
export class LockupZeroApyError extends Error {
  readonly code: number = 0x178b;
  readonly name: string = "LockupZeroApy";
  constructor() {
    super("APY can't be zero");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, LockupZeroApyError);
    }
  }
}

createErrorFromCodeLookup.set(0x178b, () => new LockupZeroApyError());
createErrorFromNameLookup.set("LockupZeroApy", () => new LockupZeroApyError());

/**
 * LockupLimitExceeded: 'No more tokens under this lockup'
 *
 * @category Errors
 * @category generated
 */
export class LockupLimitExceededError extends Error {
  readonly code: number = 0x178c;
  readonly name: string = "LockupLimitExceeded";
  constructor() {
    super("No more tokens under this lockup");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, LockupLimitExceededError);
    }
  }
}

createErrorFromCodeLookup.set(0x178c, () => new LockupLimitExceededError());
createErrorFromNameLookup.set(
  "LockupLimitExceeded",
  () => new LockupLimitExceededError()
);

/**
 * NotWithinSale: 'Can't purchase a bond due to no sale right now'
 *
 * @category Errors
 * @category generated
 */
export class NotWithinSaleError extends Error {
  readonly code: number = 0x178d;
  readonly name: string = "NotWithinSale";
  constructor() {
    super("Can't purchase a bond due to no sale right now");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NotWithinSaleError);
    }
  }
}

createErrorFromCodeLookup.set(0x178d, () => new NotWithinSaleError());
createErrorFromNameLookup.set("NotWithinSale", () => new NotWithinSaleError());

/**
 * PurchaseInvalidGateOption: 'Provided wrong gate option'
 *
 * @category Errors
 * @category generated
 */
export class PurchaseInvalidGateOptionError extends Error {
  readonly code: number = 0x178e;
  readonly name: string = "PurchaseInvalidGateOption";
  constructor() {
    super("Provided wrong gate option");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PurchaseInvalidGateOptionError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x178e,
  () => new PurchaseInvalidGateOptionError()
);
createErrorFromNameLookup.set(
  "PurchaseInvalidGateOption",
  () => new PurchaseInvalidGateOptionError()
);

/**
 * PurchaseInvalidGateAccount: 'Provided wrong gate PDA'
 *
 * @category Errors
 * @category generated
 */
export class PurchaseInvalidGateAccountError extends Error {
  readonly code: number = 0x178f;
  readonly name: string = "PurchaseInvalidGateAccount";
  constructor() {
    super("Provided wrong gate PDA");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PurchaseInvalidGateAccountError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x178f,
  () => new PurchaseInvalidGateAccountError()
);
createErrorFromNameLookup.set(
  "PurchaseInvalidGateAccount",
  () => new PurchaseInvalidGateAccountError()
);

/**
 * PurchaseWrongGateStored: 'This shouldn't happen'
 *
 * @category Errors
 * @category generated
 */
export class PurchaseWrongGateStoredError extends Error {
  readonly code: number = 0x1790;
  readonly name: string = "PurchaseWrongGateStored";
  constructor() {
    super("This shouldn't happen");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PurchaseWrongGateStoredError);
    }
  }
}

createErrorFromCodeLookup.set(0x1790, () => new PurchaseWrongGateStoredError());
createErrorFromNameLookup.set(
  "PurchaseWrongGateStored",
  () => new PurchaseWrongGateStoredError()
);

/**
 * GateCollectionInsufficientAccounts: 'Provided insufficient number of accounts to process the collection'
 *
 * @category Errors
 * @category generated
 */
export class GateCollectionInsufficientAccountsError extends Error {
  readonly code: number = 0x1791;
  readonly name: string = "GateCollectionInsufficientAccounts";
  constructor() {
    super("Provided insufficient number of accounts to process the collection");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateCollectionInsufficientAccountsError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1791,
  () => new GateCollectionInsufficientAccountsError()
);
createErrorFromNameLookup.set(
  "GateCollectionInsufficientAccounts",
  () => new GateCollectionInsufficientAccountsError()
);

/**
 * GateCollectionInvalidOwner: 'Caller is not the NFT owner'
 *
 * @category Errors
 * @category generated
 */
export class GateCollectionInvalidOwnerError extends Error {
  readonly code: number = 0x1792;
  readonly name: string = "GateCollectionInvalidOwner";
  constructor() {
    super("Caller is not the NFT owner");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateCollectionInvalidOwnerError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1792,
  () => new GateCollectionInvalidOwnerError()
);
createErrorFromNameLookup.set(
  "GateCollectionInvalidOwner",
  () => new GateCollectionInvalidOwnerError()
);

/**
 * GateCollectionInvalidTokenAccount: 'Token account not derived from the NFT mint'
 *
 * @category Errors
 * @category generated
 */
export class GateCollectionInvalidTokenAccountError extends Error {
  readonly code: number = 0x1793;
  readonly name: string = "GateCollectionInvalidTokenAccount";
  constructor() {
    super("Token account not derived from the NFT mint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateCollectionInvalidTokenAccountError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1793,
  () => new GateCollectionInvalidTokenAccountError()
);
createErrorFromNameLookup.set(
  "GateCollectionInvalidTokenAccount",
  () => new GateCollectionInvalidTokenAccountError()
);

/**
 * GateCollectionInvalidNftMetadata: 'Mint does not match mint stored in the metadata'
 *
 * @category Errors
 * @category generated
 */
export class GateCollectionInvalidNftMetadataError extends Error {
  readonly code: number = 0x1794;
  readonly name: string = "GateCollectionInvalidNftMetadata";
  constructor() {
    super("Mint does not match mint stored in the metadata");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateCollectionInvalidNftMetadataError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1794,
  () => new GateCollectionInvalidNftMetadataError()
);
createErrorFromNameLookup.set(
  "GateCollectionInvalidNftMetadata",
  () => new GateCollectionInvalidNftMetadataError()
);

/**
 * GateCollectionNftNotFromCollection: 'Provided NFT is not a member of this collection'
 *
 * @category Errors
 * @category generated
 */
export class GateCollectionNftNotFromCollectionError extends Error {
  readonly code: number = 0x1795;
  readonly name: string = "GateCollectionNftNotFromCollection";
  constructor() {
    super("Provided NFT is not a member of this collection");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateCollectionNftNotFromCollectionError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1795,
  () => new GateCollectionNftNotFromCollectionError()
);
createErrorFromNameLookup.set(
  "GateCollectionNftNotFromCollection",
  () => new GateCollectionNftNotFromCollectionError()
);

/**
 * GateSplCallerNotEnoughToken: 'Buyer does not own the enough WL SPL necessary for this gate'
 *
 * @category Errors
 * @category generated
 */
export class GateSplCallerNotEnoughTokenError extends Error {
  readonly code: number = 0x1796;
  readonly name: string = "GateSplCallerNotEnoughToken";
  constructor() {
    super("Buyer does not own the enough WL SPL necessary for this gate");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateSplCallerNotEnoughTokenError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1796,
  () => new GateSplCallerNotEnoughTokenError()
);
createErrorFromNameLookup.set(
  "GateSplCallerNotEnoughToken",
  () => new GateSplCallerNotEnoughTokenError()
);

/**
 * GateSplIncorrectMint: 'SPL mint address does not match the one stored for this gate'
 *
 * @category Errors
 * @category generated
 */
export class GateSplIncorrectMintError extends Error {
  readonly code: number = 0x1797;
  readonly name: string = "GateSplIncorrectMint";
  constructor() {
    super("SPL mint address does not match the one stored for this gate");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateSplIncorrectMintError);
    }
  }
}

createErrorFromCodeLookup.set(0x1797, () => new GateSplIncorrectMintError());
createErrorFromNameLookup.set(
  "GateSplIncorrectMint",
  () => new GateSplIncorrectMintError()
);

/**
 * GateSplInsufficientAccounts: 'Provided insufficient number of accounts to process the collection'
 *
 * @category Errors
 * @category generated
 */
export class GateSplInsufficientAccountsError extends Error {
  readonly code: number = 0x1798;
  readonly name: string = "GateSplInsufficientAccounts";
  constructor() {
    super("Provided insufficient number of accounts to process the collection");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateSplInsufficientAccountsError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1798,
  () => new GateSplInsufficientAccountsError()
);
createErrorFromNameLookup.set(
  "GateSplInsufficientAccounts",
  () => new GateSplInsufficientAccountsError()
);

/**
 * GateSplInvalidTokenAccount: 'Token account not derived from the SPL mint'
 *
 * @category Errors
 * @category generated
 */
export class GateSplInvalidTokenAccountError extends Error {
  readonly code: number = 0x1799;
  readonly name: string = "GateSplInvalidTokenAccount";
  constructor() {
    super("Token account not derived from the SPL mint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateSplInvalidTokenAccountError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x1799,
  () => new GateSplInvalidTokenAccountError()
);
createErrorFromNameLookup.set(
  "GateSplInvalidTokenAccount",
  () => new GateSplInvalidTokenAccountError()
);

/**
 * GateSplNotEnoughWlTokens: 'Not enough tokens to burn for this amount of bond token'
 *
 * @category Errors
 * @category generated
 */
export class GateSplNotEnoughWlTokensError extends Error {
  readonly code: number = 0x179a;
  readonly name: string = "GateSplNotEnoughWlTokens";
  constructor() {
    super("Not enough tokens to burn for this amount of bond token");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateSplNotEnoughWlTokensError);
    }
  }
}

createErrorFromCodeLookup.set(
  0x179a,
  () => new GateSplNotEnoughWlTokensError()
);
createErrorFromNameLookup.set(
  "GateSplNotEnoughWlTokens",
  () => new GateSplNotEnoughWlTokensError()
);

/**
 * GateSplInvalidOwner: 'Caller is not the owner of the token account'
 *
 * @category Errors
 * @category generated
 */
export class GateSplInvalidOwnerError extends Error {
  readonly code: number = 0x179b;
  readonly name: string = "GateSplInvalidOwner";
  constructor() {
    super("Caller is not the owner of the token account");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, GateSplInvalidOwnerError);
    }
  }
}

createErrorFromCodeLookup.set(0x179b, () => new GateSplInvalidOwnerError());
createErrorFromNameLookup.set(
  "GateSplInvalidOwner",
  () => new GateSplInvalidOwnerError()
);

/**
 * IncorrectGateIndex: 'Provided gate index is not included in this lockup'
 *
 * @category Errors
 * @category generated
 */
export class IncorrectGateIndexError extends Error {
  readonly code: number = 0x179c;
  readonly name: string = "IncorrectGateIndex";
  constructor() {
    super("Provided gate index is not included in this lockup");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IncorrectGateIndexError);
    }
  }
}

createErrorFromCodeLookup.set(0x179c, () => new IncorrectGateIndexError());
createErrorFromNameLookup.set(
  "IncorrectGateIndex",
  () => new IncorrectGateIndexError()
);

/**
 * Attempts to resolve a custom program error from the provided error code.
 * @category Errors
 * @category generated
 */
export function errorFromCode(code: number): MaybeErrorWithCode {
  const createError = createErrorFromCodeLookup.get(code);
  return createError != null ? createError() : null;
}

/**
 * Attempts to resolve a custom program error from the provided error name, i.e. 'Unauthorized'.
 * @category Errors
 * @category generated
 */
export function errorFromName(name: string): MaybeErrorWithCode {
  const createError = createErrorFromNameLookup.get(name);
  return createError != null ? createError() : null;
}
