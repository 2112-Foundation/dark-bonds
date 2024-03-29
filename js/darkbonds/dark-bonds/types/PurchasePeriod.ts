/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
/**
 * This type is used to derive the {@link PurchasePeriod} type as well as the de/serializer.
 * However don't refer to it in your code but use the {@link PurchasePeriod} type instead.
 *
 * @category userTypes
 * @category enums
 * @category generated
 * @private
 */
export type PurchasePeriodRecord = {
  SameAsMainIbo: void /* scalar variant */
  LockupPurchaseStart: { start: beet.bignum }
  LockupPurchaseEnd: { end: beet.bignum }
  LockupPurchaseCombined: { start: beet.bignum; end: beet.bignum }
}

/**
 * Union type respresenting the PurchasePeriod data enum defined in Rust.
 *
 * NOTE: that it includes a `__kind` property which allows to narrow types in
 * switch/if statements.
 * Additionally `isPurchasePeriod*` type guards are exposed below to narrow to a specific variant.
 *
 * @category userTypes
 * @category enums
 * @category generated
 */
export type PurchasePeriod = beet.DataEnumKeyAsKind<PurchasePeriodRecord>

export const isPurchasePeriodSameAsMainIbo = (
  x: PurchasePeriod
): x is PurchasePeriod & { __kind: 'SameAsMainIbo' } =>
  x.__kind === 'SameAsMainIbo'
export const isPurchasePeriodLockupPurchaseStart = (
  x: PurchasePeriod
): x is PurchasePeriod & { __kind: 'LockupPurchaseStart' } =>
  x.__kind === 'LockupPurchaseStart'
export const isPurchasePeriodLockupPurchaseEnd = (
  x: PurchasePeriod
): x is PurchasePeriod & { __kind: 'LockupPurchaseEnd' } =>
  x.__kind === 'LockupPurchaseEnd'
export const isPurchasePeriodLockupPurchaseCombined = (
  x: PurchasePeriod
): x is PurchasePeriod & { __kind: 'LockupPurchaseCombined' } =>
  x.__kind === 'LockupPurchaseCombined'

/**
 * @category userTypes
 * @category generated
 */
export const purchasePeriodBeet = beet.dataEnum<PurchasePeriodRecord>([
  ['SameAsMainIbo', beet.unit],

  [
    'LockupPurchaseStart',
    new beet.BeetArgsStruct<PurchasePeriodRecord['LockupPurchaseStart']>(
      [['start', beet.i64]],
      'PurchasePeriodRecord["LockupPurchaseStart"]'
    ),
  ],

  [
    'LockupPurchaseEnd',
    new beet.BeetArgsStruct<PurchasePeriodRecord['LockupPurchaseEnd']>(
      [['end', beet.i64]],
      'PurchasePeriodRecord["LockupPurchaseEnd"]'
    ),
  ],

  [
    'LockupPurchaseCombined',
    new beet.BeetArgsStruct<PurchasePeriodRecord['LockupPurchaseCombined']>(
      [
        ['start', beet.i64],
        ['end', beet.i64],
      ],
      'PurchasePeriodRecord["LockupPurchaseCombined"]'
    ),
  ],
]) as beet.FixableBeet<PurchasePeriod, PurchasePeriod>
