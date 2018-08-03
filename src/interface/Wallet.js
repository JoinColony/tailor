/* @flow */

import type { Address } from './flowtypes';

export interface IWallet {
  +address: Address;
  +otherAddresses?: Array<Address>;

  keystore: Promise<string>;
  +mnemonic?: string;
  +derivationPath?: Promise<string>;
  +privateKey: string;
  +publicKey: Promise<string>;

  setDefaultAddress(addressIndex: number): Promise<boolean>;
  sign(transactionObject: {}): Promise<string>;
  signMessage(messageObject: {}): Promise<string>;
  verifyMessage(verificationObject: {}): Promise<boolean>;
}
