/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
export type PermittedAction = {
  adminWithdraws: boolean
  gateModification: boolean
  lockupModification: boolean
  exchangeRateChange: boolean
  endDateChange: boolean
  liveDateChange: boolean
  swapCutChange: boolean
  descriptionChange: boolean
  linkChange: boolean
}

/**
 * @category userTypes
 * @category generated
 */
export const permittedActionBeet = new beet.BeetArgsStruct<PermittedAction>(
  [
    ['adminWithdraws', beet.bool],
    ['gateModification', beet.bool],
    ['lockupModification', beet.bool],
    ['exchangeRateChange', beet.bool],
    ['endDateChange', beet.bool],
    ['liveDateChange', beet.bool],
    ['swapCutChange', beet.bool],
    ['descriptionChange', beet.bool],
    ['linkChange', beet.bool],
  ],
  'PermittedAction'
)
