/* @flow */

import type Tailor from '../../../Tailor';
import { SIGNING_MODES } from './constants';
import type { FunctionCall } from '../flowtypes';
import type { UnsignedTransaction } from '../../../interface/flowtypes';

type SigningMode = $Values<typeof SIGNING_MODES>;

type Signature = {
  sigR: string,
  sigS: string,
  sigV: number,
};

type Signers = {
  [signeeAddress: string]: Signature & { mode: SigningMode },
};

type CombinedSignatures = {
  sigR: Array<string>,
  sigS: Array<string>,
  sigV: Array<number>,
  mode: Array<SigningMode>,
};

export type {
  CombinedSignatures,
  FunctionCall,
  Tailor,
  Signature,
  Signers,
  SigningMode,
  UnsignedTransaction,
};
