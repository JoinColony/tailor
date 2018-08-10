/* @flow */

import type { Address, UnsignedTransaction } from './flowtypes';

export interface IWallet {
  +address: Address;
  +otherAddresses?: Array<Address>;

  keystore: Promise<string>;
  +mnemonic?: string;
  +derivationPath?: Promise<string>;
  +privateKey: string;
  +publicKey: Promise<string>;

  setDefaultAddress(addressIndex: number): Promise<boolean>;
  signMessage(messageObject: Object): Promise<string>;
  verifyMessage(verificationObject: Object): Promise<boolean>;

  // This should be optional, but interfaces don't support optional methods
  sign(unsignedTransaction: UnsignedTransaction): Promise<string>;
}
