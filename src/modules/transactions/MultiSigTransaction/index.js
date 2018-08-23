/* @flow */

import defaultAssert from 'assert';
import isPlainObject from 'lodash.isplainobject';
import isEqual from 'lodash.isequal';
import {
  padLeft,
  soliditySha3,
  isHexStrict,
  hexToBytes,
  isAddress,
} from 'web3-utils';

import ContractTransaction from '../ContractTransaction';
import { SIGNING_MODES } from './constants';
import { makeAssert, sigHexToRSV } from '../../utils';
import HookManager from '../../HookManager';
import getFunctionCall from '../../getFunctionCall';
import { isOptions } from '../utils';

import type {
  CombinedSignatures,
  FunctionCall,
  Lighthouse,
  Signature,
  SigningMode,
  UnsignedTransaction,
} from './flowtypes';

export default class MultiSigTransaction extends ContractTransaction {
  _state: Object; // TODO: more specific type

  static get transactionName() {
    return 'multisig';
  }

  static async restore(
    lighthouse: Lighthouse,
    json: string,
    options: Object = {},
  ) {
    let parsed = {};
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      throw new Error('Unable to restore operation: could not parse JSON');
    }
    const tx = new this(lighthouse, { ...parsed, ...options });
    await tx.start();
    return tx;
  }

  static getMethodFn({
    lighthouse,
    functionParams,
    isPayable,
    getRequiredSigners,
    multiSigFunctionName,
    getMultiSigNonce,
  }: Object) {
    // TODO: more specific type

    const hooks = new HookManager();
    const fn = (...inputParams: any) => {
      const options = isOptions(inputParams[inputParams.length - 1])
        ? inputParams.pop()
        : {};
      if (!isPayable && options.value)
        throw new Error('Cannot send a value to a non-payable function');
      const functionCall = getFunctionCall(functionParams, ...inputParams);
      return new this(lighthouse, {
        functionCall,
        hooks,
        getRequiredSigners,
        multiSigFunctionName,
        getMultiSigNonce,
        ...options,
      });
    };
    fn.hooks = hooks.createHooks();

    fn.restore = json =>
      this.restore(lighthouse, json, {
        getRequiredSigners,
        multiSigFunctionName,
        getMultiSigNonce,
      });

    return fn;
  }

  static _validateSignature(signature: any, assert: Function) {
    assert(isPlainObject(signature), 'Signature must be an object');
    const { sigV, sigR, sigS, mode } = signature;
    return (
      assert([27, 28].includes(sigV), 'v must be 27 or 28') &&
      assert(isHexStrict(sigR), 'r must be a hex string') &&
      assert(isHexStrict(sigS), 's must be a hex string') &&
      assert(
        Object.values(SIGNING_MODES).includes(mode),
        'mode must be a valid signing mode',
      )
    );
  }

  static _validateSigners(signers: any) {
    const assert = makeAssert('Invalid _signers');
    assert(isPlainObject(signers), 'Signers must be an object');
    return Object.entries(signers || {}).every(
      ([address, signature]) =>
        assert(isAddress(address), `"${address}" is not a valid address`) &&
        this._validateSignature(signature, assert),
    );
  }

  constructor(lh: Lighthouse, { signers, multiSigNonce, ...state }: Object) {
    super(lh, { ...state });

    if (signers) this.signers = signers;
    if (multiSigNonce) this.multiSigNonce = multiSigNonce;
  }

  get _signedMessageDigest() {
    return hexToBytes(
      soliditySha3('\x19Ethereum Signed Message:\n32', this._state.messageHash),
    );
  }

  get _signedTrezorMessageDigest() {
    return hexToBytes(
      soliditySha3(
        '\x19Ethereum Signed Message:\n\x20',
        this._state.messageHash,
      ),
    );
  }

  /**
   * Override parent to use multisig function + data
   */
  get rawTransaction() {
    const functionCall: FunctionCall = {
      functionSignature: this._state.multiSigFunctionName,
      args: this._getArgs(),
    };
    const rawTx: UnsignedTransaction = {
      data: this._lh.adapter.encodeFunctionCall(functionCall),
      from: this.from,
      to: this.to,
      value: this.value,
    };

    if (this.chainId) rawTx.chainId = this.chainId;
    if (this.gas) rawTx.gas = this.gas;
    if (this.gasPrice) rawTx.gasPrice = this.gasPrice;
    if (this.nonce) rawTx.nonce = this.nonce;

    return rawTx;
  }

  get requiredSigners(): Array<string> {
    defaultAssert(
      Array.isArray(this._state.requiredSigners),
      'Required signers not defined; call `.refresh` to refresh signers',
    );
    return this._state.requiredSigners;
  }

  get signers(): Array<string> {
    return this._state.signers;
  }

  get missingSigners(): Array<string> {
    return this.requiredSigners.filter(
      address => !this._state.signers[address],
    );
  }

  get multiSigNonce() {
    if (!this._state.multiSigNonce)
      throw new Error(
        'MultiSig nonce not set; call `.refresh` to refresh nonce',
      );
    return this._state.multiSigNonce;
  }

  set signers(signers: any) {
    // eslint-disable-next-line no-underscore-dangle
    this.constructor._validateSigners(signers);
    this._state.signers = signers;
  }

  set multiSigNonce(multiSigNonce: number) {
    if (!Number.isInteger(multiSigNonce))
      throw new Error('multiSigNonce should be an integer');
    this._state.multiSigNonce = multiSigNonce;
  }

  _getMessageDigest(mode: SigningMode) {
    return mode === SIGNING_MODES.TREZOR
      ? this._signedTrezorMessageDigest
      : this._signedMessageDigest;
  }

  /**
   * Given multiple signers, combine each part of the signatures together.
   */
  _combineSignatures(): CombinedSignatures {
    const combined = { sigV: [], sigR: [], sigS: [], mode: [] };

    // Sort by address so that the order is always the same
    Object.keys(this._state.signers)
      .sort()
      .forEach(address => {
        const { sigV, sigR, sigS, mode } = this._state.signers[address];
        combined.sigV.push(sigV);
        combined.sigR.push(sigR);
        combined.sigS.push(sigS);
        combined.mode.push(mode);
      });

    return combined;
  }

  /**
   * Given the payload and signatures for this operation, combine the signatures
   * and return the arguments in the order the contract expects.
   */
  _getArgs() {
    const { value, data } = this;
    const { sigV, sigR, sigS, mode } = this._combineSignatures();
    return [sigV, sigR, sigS, mode, value, data];
  }

  /**
   * Ensure that there are no missing signers (based on the input values for
   * this operation).
   */
  _validateRequiredSigners() {
    defaultAssert(
      this.missingSigners.length === 0,
      `Missing signatures (from addresses ${this.missingSigners.join(', ')})`,
    );
    return true;
  }

  /**
   * Given the payload and nonce, use this input to create an ERC191-compatible
   * message hash
   */
  _refreshMessageHash() {
    const { data, to, from, value, multiSigNonce } = this;

    // Follows ERC191 signature scheme: https://github.com/ethereum/EIPs/issues/191
    const addresses = `${from.slice(2)}${to.slice(2)}`;
    const paddedValue = padLeft(value.toString(16), 64, '0');
    const paddedNonce = padLeft(multiSigNonce.toString(16), 64, '0');
    this._state.messageHash = soliditySha3(
      `0x${addresses}${paddedValue}${data.slice(2)}${paddedNonce}`,
    );
  }

  async _refreshMultiSigNonce() {
    // If the nonce has not yet been set, simply set it; Don't reset signers,
    // because we don't have a way of knowing whether they're valid or nor;
    // assume they are still valid.
    if (!Object.hasOwnProperty.call(this._state, 'multiSigNonce')) {
      this._state.multiSigNonce = await this.getMultiSigNonce();
      return;
    }

    const oldNonce = Number(this._state.multiSigNonce);
    const newNonce = await this.getMultiSigNonce();
    if (oldNonce !== newNonce) {
      this._state.multiSigNonce = newNonce;
      // If the nonce changed, the signers are no longer valid
      this._state.signers = {};
      // We will also trigger onReset, if it exists
      if (this._state.onReset) this._state.onReset();
    }
  }

  async _refreshRequiredSigners() {
    this._state.requiredSigners = await this.getRequiredSigners();
  }

  /**
   * Given a signature and a wallet address, determine the signing mode by
   * trying different digests with `ecRecover` until the wallet address matches
   * the recovered address.
   */
  async _findSignatureMode(
    signature: Signature,
    address: string,
  ): Promise<SigningMode> {
    let foundMode;
    // $FlowFixMe
    const modes: Array<number> = Object.values(SIGNING_MODES);

    await Promise.all(
      modes.map(async mode => {
        const digest = this._getMessageDigest(mode);
        if (await this._lh.wallet.verifyMessage({ message: digest, signature }))
          foundMode = mode;
      }),
    );

    if (foundMode !== undefined) return foundMode;

    throw new Error(`Unable to confirm signature mode for address ${address}`);
  }

  /**
   * Given a signature and an address, find the signature mode and
   * add the address/signature to the signers.
   */
  async _addSignature(signature: Signature, address: string) {
    const mode = await this._findSignatureMode(signature, address);
    this._state.signers = Object.assign({}, this._state.signers, {
      [address]: {
        mode,
        ...signature,
      },
    });
    return this;
  }

  toJSON() {
    const json = JSON.parse(super.toJSON());
    return JSON.stringify({
      multiSigNonce: this._state.multiSigNonce,
      signers: this.signers,
      ...json,
    });
  }

  addSignersFromJSON(json: string) {
    let parsed = {};
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      throw new Error('Unable to add signers: could not parse JSON');
    }
    const { data, to, from, value, signers } = parsed;

    defaultAssert(
      isEqual(
        { data: this.data, to: this.to, from: this.from, value: this.value },
        { data, to, from, value },
      ),
      'Unable to add state; incompatible payloads',
    );
    // eslint-disable-next-line no-underscore-dangle
    this.constructor._validateSigners(signers);
    this._state.signers = Object.assign({}, this._state.signers, signers);
    return this;
  }

  async getMultiSigNonce(): Promise<number> {
    const nonce = await this._state.getMultiSigNonce({
      lighthouse: this._lh,
      ...this._state,
    });

    if (!Number.isInteger(nonce))
      throw new Error('getMultiSigNonce must return an integer');

    return nonce;
  }

  async getRequiredSigners(): Promise<Array<string>> {
    const signers = await this._state.getRequiredSigners(
      this._state.functionCall.args,
    );
    if (!(Array.isArray(signers) && signers.every(isAddress)))
      throw new Error('Expected an array of signer addresses');
    return signers;
  }

  /**
   * Refresh the required signers, nonce value and message hash.
   * If the nonce value has changed, `_signers` will be reset.
   */
  async refresh() {
    await this._refreshMultiSigNonce();
    await this._refreshRequiredSigners();
    this._refreshMessageHash();
    return this;
  }

  async send(): Promise<this> {
    await this.refresh();
    this._validateRequiredSigners();
    return super.send();
  }

  /**
   * Sign the message hash with the current wallet and add the signature.
   */
  async sign() {
    await this.refresh();
    const signature = await this._lh.wallet.signMessage(
      this._state.messageHash,
    );
    const { r: sigR, s: sigS, v: sigV } = sigHexToRSV(signature);
    await this._addSignature({ sigR, sigS, sigV }, this._lh.wallet.address);
    return this;
  }

  async start() {
    await this.refresh();
  }
}
