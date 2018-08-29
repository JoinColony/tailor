/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import assert from 'assert';
import {
  hexToBytes,
  isAddress,
  isHex,
  isHexStrict,
  padLeft,
  soliditySha3,
} from 'web3-utils';
import isPlainObject from 'lodash.isplainobject';
import isEqual from 'lodash.isequal';
import BigNumber from 'bn.js';

import Transaction from '../index';
import ContractTransaction from '../../ContractTransaction';
import * as utils from '../../../utils';
import HookManager from '../../../HookManager';

jest.mock('assert', () => jest.fn().mockReturnValue(true));
jest.mock('lodash.isplainobject', () => jest.fn().mockReturnValue(true));
jest.mock('lodash.isequal', () => jest.fn().mockReturnValue(true));
jest.mock('web3-utils', () => ({
  soliditySha3: jest.fn().mockImplementation(input => input),
  padLeft: jest.fn().mockImplementation(input => input),
  hexToBytes: jest.fn(),
  isHexStrict: jest.fn().mockReturnValue(true),
  isAddress: jest.fn().mockReturnValue(true),
  isHex: jest.fn().mockReturnValue(true),
}));

describe('MultiSigTransaction', () => {
  const sandbox = createSandbox();

  const functionCall = {
    functionSignature: 'myFunction(unit8)',
    args: [255],
  };
  const data = '0xdata';
  const gasEstimate = 31415926535;
  const gasPrice = 4;
  const nonce = 1;
  const chainId = 1;
  const value = new BigNumber(0);
  const signedTransaction = 'signed tx';
  const signedMessage = 'signed message';
  const to = '0xcontract';
  const from = '0xwallet';
  const multiSigNonce = 5;
  const getMultiSigNonce = sandbox.fn().mockResolvedValue(multiSigNonce);
  const multiSigFunctionName = 'ms function name';

  const mockEncodeFunctionCall = sandbox.fn().mockImplementation(() => data);
  const wallet = {
    address: from,
    sign: sandbox.fn().mockResolvedValue(signedTransaction),
    signMessage: sandbox.fn().mockResolvedValue(signedMessage),
    verifyMessage: sandbox.fn().mockResolvedValue(true),
  };
  const mockLighthouse = {
    adapter: {
      estimate: sandbox.fn().mockResolvedValue(gasEstimate),
      encodeFunctionCall: mockEncodeFunctionCall,
      sendSignedTransaction: sandbox.fn(),
      getGasPrice: sandbox.fn().mockReturnValue(gasPrice),
      getNonce: sandbox.fn().mockReturnValue(nonce),
      getCurrentNetwork: sandbox.fn().mockReturnValue(chainId),
      call: sandbox.fn(),
      wallet,
    },
    wallet,
    contractAddress: to,
  };

  const signatureRSV = {
    sigR: '0x3810976581519370936455002930541734832270292486195672859026812854',
    sigS: '0x2717400036569076491467357688191371198012187172992592815125647808',
    sigV: 28,
  };

  const signature = {
    ...signatureRSV,
    mode: 0,
  };

  const signatureAddress = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

  const signers = {
    signatureAddress: signature,
    '0x281055afc982d96fab65b3a49cac8b878184cb16': {
      sigR:
        '0x09ebb6ca057a0535d6186462bc0b465b561c94a295bdb0621fc19208ab149a9c',
      sigS:
        '0x440ffd775ce91a833ab410777204d5341a6f9fa91216a6f3ee2c051fea6a0428',
      sigV: 27,
      mode: 1,
    },
    '0x6f46cf5569aefa1acc1009290c8e043747172d89': {
      sigR:
        '0x3810976581519370936455002930541734832270292486195672859026812854',
      sigS:
        '0x2717400036569076491467357688191371198012187172992592815125647808',
      sigV: 28,
      mode: 0,
    },
  };

  const txArgs = {
    functionCall,
    signers,
    value,
    multiSigNonce,
    to,
    from,
    data,
    getMultiSigNonce,
    multiSigFunctionName,
  };

  beforeEach(() => {
    sandbox.clear();
    assert.mockClear();
    soliditySha3.mockClear();
    isHexStrict.mockClear();
    hexToBytes.mockClear();
    isAddress.mockClear();
    isHex.mockClear();
    padLeft.mockClear();
    isPlainObject.mockClear();
    isEqual.mockClear();
  });

  test('Combining signatures', () => {
    const tx = new Transaction(mockLighthouse, txArgs);

    // Test helper to get a certain prop from the signatures in order
    const sortedSigs = Object.keys(tx._state.signers).sort();
    const getSigValues = propName =>
      sortedSigs.map(addr => tx._state.signers[addr][propName]);

    const combined = tx._combineSignatures();
    expect(combined).toEqual({
      sigR: getSigValues('sigR'),
      sigS: getSigValues('sigS'),
      sigV: getSigValues('sigV'),
      mode: getSigValues('mode'),
    });
  });

  test('Getting Multisig arguments', () => {
    const tx = new Transaction(mockLighthouse, txArgs);
    const combined = {
      sigV: 'sigV',
      sigR: 'sigR',
      sigS: 'sigS',
      mode: 'mode',
    };
    sandbox.spyOn(tx, '_combineSignatures').mockReturnValue(combined);

    const args = tx._getArgs();

    expect(tx._combineSignatures).toHaveBeenCalled();
    expect(args).toEqual([
      combined.sigV,
      combined.sigR,
      combined.sigS,
      combined.mode,
      value,
      data,
    ]);
  });

  test('Validating required signers (all signers present)', () => {
    const tx = new Transaction(mockLighthouse, txArgs);
    tx._state.requiredSigners = Object.keys(signers);

    const valid = tx._validateRequiredSigners();

    expect(assert).toHaveBeenCalledWith(
      true,
      expect.stringContaining('Missing signatures (from addresses'),
    );

    expect(valid).toBe(true);
  });

  test('Validating required signers (missing a required signer)', () => {
    const [addressOne, addressTwo, addressThree] = Object.keys(signers);
    const twoSigners = {
      [addressOne]: signers[addressOne],
      [addressTwo]: signers[addressTwo],
    };

    const tx = new Transaction(mockLighthouse, {
      ...txArgs,
      signers: twoSigners,
    });
    tx._state.requiredSigners = [addressOne, addressTwo, addressThree];

    expect(tx._validateRequiredSigners()).toBe(true);

    expect(assert).toHaveBeenCalledWith(
      false,
      `Missing signatures (from addresses ${addressThree})`,
    );
  });

  test('Validating signers', () => {
    // an offering to the coverage gods
    expect(Transaction._validateSigners()).toEqual(true);
  });

  test('JSON contains multiSigNonce and signers', () => {
    const tx = new Transaction(mockLighthouse, txArgs);
    const json = tx.toJSON();
    expect(typeof json).toBe('string');
    expect(JSON.parse(json)).toMatchObject({
      signers,
      multiSigNonce,
    });
  });

  test('Adding state as JSON', () => {
    const [addressOne, addressTwo, addressThree] = Object.keys(signers);
    const initialSigners = {
      [addressOne]: signers[addressOne],
    };
    const addedSigners = {
      [addressTwo]: signers[addressTwo],
      [addressThree]: signers[addressThree],
    };

    const tx = new Transaction(mockLighthouse, {
      ...txArgs,
      signers: initialSigners,
    });

    const json = JSON.stringify({ ...txArgs, signers: addedSigners });

    sandbox.spyOn(JSON, 'stringify');
    sandbox.spyOn(tx.constructor, '_validateSigners');
    tx.addSignersFromJSON(json);

    // The payload should be validated by JSON-equality for each property of
    // both payloads
    expect(isEqual).toHaveBeenCalledWith(
      { data: tx.data, to: tx.to, from: tx.from, value: tx.value },
      {
        data,
        to,
        from,
        value: value.toString(),
      },
    );
    expect(assert).toHaveBeenCalledWith(
      true,
      'Unable to add state; incompatible payloads',
    );

    expect(tx.constructor._validateSigners).toHaveBeenCalledWith(addedSigners);

    // The _signers should have been added together
    expect(tx._state.signers).toEqual(
      Object.assign({}, initialSigners, addedSigners),
    );
  });

  test('Adding state as JSON (invalid json)', () => {
    const tx = new Transaction(mockLighthouse, txArgs);

    expect(() => {
      tx.addSignersFromJSON('aksjdhkjasdhkj');
    }).toThrowError('Unable to add signers: could not parse JSON');
  });

  test('ERC191 Message hash is created properly', async () => {
    const tx = new Transaction(mockLighthouse, {
      ...txArgs,
      value: 1,
      nonce: 5,
    });
    tx._state.multiSigNonce = 5;

    // It should be undefined until operation is refreshed
    expect(tx._state.messageHash).toBeUndefined();

    // The string to be hashed should contain:
    // Initial `0x`
    // source address (with initial 0x removed - `wallet`)
    // destination address (with initial 0x removed - `contract`)
    // transaction value (1 - `value`)
    // transaction data (with initial 0x removed - `data`)
    // nonce (5 - `nonce`)
    const expectedHash = '0xwalletcontract1data5';

    tx._refreshMessageHash();
    const hash = tx._state.messageHash;
    expect(hash).toBe(expectedHash);
    expect(padLeft).toHaveBeenCalledTimes(2);
    expect(soliditySha3).toHaveBeenCalledWith(expectedHash);
    expect(tx._state.messageHash).toBe(expectedHash);
  });

  test('Signed message digests', () => {
    const tx = new Transaction(mockLighthouse, txArgs);
    tx._state.multiSigNonce = 5;

    // Initialise the hash
    tx._refreshMessageHash();

    // Default signed message digest
    tx._signedMessageDigest; // eslint-disable-line no-unused-expressions
    expect(soliditySha3).toHaveBeenCalledWith(
      '\x19Ethereum Signed Message:\n32',
      tx._state.messageHash,
    );
    expect(hexToBytes).toHaveBeenCalledTimes(1);

    hexToBytes.mockClear();
    soliditySha3.mockClear();

    // Trezor signed message digest
    tx._signedTrezorMessageDigest; // eslint-disable-line no-unused-expressions
    expect(soliditySha3).toHaveBeenCalledWith(
      '\x19Ethereum Signed Message:\n\x20',
      tx._state.messageHash,
    );
    expect(hexToBytes).toHaveBeenCalledTimes(1);
  });

  test('Getting the message digest for different signing modes', () => {
    const digestSpy = sandbox.spyOn(
      Transaction.prototype,
      '_signedMessageDigest',
      'get',
    );
    const trezorDigestSpy = sandbox.spyOn(
      Transaction.prototype,
      '_signedTrezorMessageDigest',
      'get',
    );

    const tx = new Transaction(mockLighthouse, txArgs);

    tx._getMessageDigest(0);
    expect(digestSpy).toHaveBeenCalled();
    expect(trezorDigestSpy).not.toHaveBeenCalled();

    digestSpy.mockClear();
    trezorDigestSpy.mockClear();

    tx._getMessageDigest(1);
    expect(digestSpy).not.toHaveBeenCalled();
    expect(trezorDigestSpy).toHaveBeenCalled();
  });

  test('Finding the signature mode', async () => {
    const digest = 'digest';
    const trezorDigest = 'trezor digest';
    sandbox
      .spyOn(Transaction.prototype, '_signedMessageDigest', 'get')
      .mockReturnValue(digest);
    sandbox
      .spyOn(Transaction.prototype, '_signedTrezorMessageDigest', 'get')
      .mockReturnValue(trezorDigest);

    const tx = new Transaction(mockLighthouse, txArgs);

    sandbox.spyOn(tx, '_getMessageDigest');
    wallet.verifyMessage
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const mode = await tx._findSignatureMode(signature, signatureAddress);

    expect(mode).toBe(0); // A match was found for the first mode
    expect(tx._getMessageDigest).toHaveBeenCalledWith(0);
    expect(tx._getMessageDigest).toHaveBeenCalledWith(1);
    expect(wallet.verifyMessage).toHaveBeenCalledWith({
      message: digest,
      signature,
    });
    expect(wallet.verifyMessage).toHaveBeenCalledWith({
      message: trezorDigest,
      signature,
    });

    // It should fail when the address does not match in either case
    wallet.verifyMessage.mockResolvedValue(false);
    await expect(
      tx._findSignatureMode(signature, signatureAddress),
    ).rejects.toThrowError('Unable to confirm signature mode');
  });

  test('Adding signatures', async () => {
    const tx = new Transaction(mockLighthouse, { ...txArgs, signers: {} });
    const mode = 1;

    sandbox.spyOn(tx, '_findSignatureMode').mockResolvedValue(mode);

    await tx._addSignature(signature, signatureAddress);

    expect(tx._state.signers).toEqual({
      [signatureAddress]: { ...signature, ...mode },
    });
    expect(tx._findSignatureMode).toHaveBeenCalled();
  });

  test('Signing', async () => {
    const messageHash = 'messageHash';

    const tx = new Transaction(mockLighthouse, txArgs);
    tx._state.messageHash = messageHash;

    sandbox.spyOn(tx, '_addSignature').mockReturnValue(signature);
    sandbox.spyOn(tx, 'refresh').mockImplementation(async () => {});
    sandbox.spyOn(utils, 'sigHexToRSV').mockImplementation(() => ({
      r: signature.sigR,
      s: signature.sigS,
      v: signature.sigV,
    }));

    await tx.sign();

    // Ideally, we would assert that this function was called before the others,
    // but it's not well-supported in jest (or other modules like jest-extended)
    expect(tx.refresh).toHaveBeenCalled();

    expect(wallet.signMessage).toHaveBeenCalledWith(messageHash);
    expect(tx._addSignature).toHaveBeenCalledWith(signatureRSV, from);
  });

  test('Raw transaction is returned correctly', async () => {
    const tx = new Transaction(mockLighthouse, {
      ...txArgs,
      chainId: null,
      gas: null,
      gasPrice: null,
      nonce: null,
    });

    // base rawTransaction
    const multiSigFunctionData = 'ms function data';
    const multiSigArgs = 'ms args';
    mockLighthouse.adapter.encodeFunctionCall.mockReturnValue(
      multiSigFunctionData,
    );
    sandbox.spyOn(tx, '_getArgs').mockImplementation(() => multiSigArgs);
    expect(tx.rawTransaction).toEqual({
      data: multiSigFunctionData,
      from,
      to,
      value,
    });
    expect(mockLighthouse.adapter.encodeFunctionCall).toHaveBeenCalledWith({
      functionSignature: multiSigFunctionName,
      args: multiSigArgs,
    });

    // all values
    tx._state.chainId = chainId;
    tx._state.gas = gasEstimate;
    tx._state.gasPrice = gasPrice;
    tx._state.nonce = nonce;
    expect(tx.rawTransaction).toEqual({
      data: multiSigFunctionData,
      from,
      to,
      value,
      chainId,
      gas: gasEstimate,
      gasPrice,
      nonce,
    });
  });

  test('Refreshing', async () => {
    const tx = new Transaction(mockLighthouse, txArgs);

    sandbox
      .spyOn(tx, '_refreshMultiSigNonce')
      .mockImplementation(async () => {});
    sandbox
      .spyOn(tx, '_refreshRequiredSigners')
      .mockImplementation(async () => {});
    sandbox.spyOn(tx, '_refreshMessageHash').mockImplementation(() => {});

    await tx.refresh();

    // Ideally, jest would support asserting that _refreshMultiSigNonce is called
    // before _refreshRequiredSigners, because if a new nonce value was set,
    // the signers are reset.
    expect(tx._refreshMultiSigNonce).toHaveBeenCalled();
    expect(tx._refreshRequiredSigners).toHaveBeenCalled();
    expect(tx._refreshMessageHash).toHaveBeenCalled();
  });

  test('Refreshing multisig nonce', async () => {
    const tx = new Transaction(mockLighthouse, txArgs);
    sandbox.spyOn(tx, 'emit').mockImplementation(() => {});

    const oldNonce = 20;
    const newNonce = 21;
    tx._state.multiSigNonce = oldNonce;

    // Refresh with the old nonce
    sandbox
      .spyOn(tx, 'getMultiSigNonce')
      .mockImplementation(async () => oldNonce);
    await tx._refreshMultiSigNonce();
    expect(tx.getMultiSigNonce).toHaveBeenCalled();
    expect(tx._state.multiSigNonce).toBe(oldNonce);
    expect(tx._state.signers).toEqual(signers);
    expect(tx.emit).not.toHaveBeenCalled();

    // Refresh with the new nonce
    tx.getMultiSigNonce.mockImplementation(async () => newNonce);
    await tx._refreshMultiSigNonce();
    expect(tx.getMultiSigNonce).toHaveBeenCalled();
    expect(tx._state.multiSigNonce).toBe(newNonce);
    expect(tx._state.signers).toEqual({});
    expect(tx.emit).toHaveBeenCalled();

    // no nonce already set
    delete tx._state.multiSigNonce;
    await tx._refreshMultiSigNonce();
    expect(tx.getMultiSigNonce).toHaveBeenCalled();
    expect(tx._state.multiSigNonce).toBe(newNonce);
  });

  test('Refreshing required signers', async () => {
    const tx = new Transaction(mockLighthouse, txArgs);

    const newSigners = ['signer one', 'signer two'];
    sandbox
      .spyOn(tx, 'getRequiredSigners')
      .mockImplementationOnce(async () => newSigners);

    await tx._refreshRequiredSigners();
    expect(tx.getRequiredSigners).toHaveBeenCalled();
    expect(tx._state.requiredSigners).toEqual(newSigners);
  });

  test('Getting missing signers', async () => {
    const signer1 = 'signer1';
    const signer2 = 'signer2';
    const signer3 = 'signer3';
    const requiredSigners = [signer1, signer2, signer3];
    const tx = new Transaction(mockLighthouse, {
      ...txArgs,
      signers: { signer1, signer2 },
    });
    tx._state.requiredSigners = requiredSigners;

    expect(tx.requiredSigners).toEqual(requiredSigners);
    expect(tx.missingSigners).toEqual([signer3]);

    // with refreshing
    sandbox
      .spyOn(tx, 'getRequiredSigners')
      .mockImplementation(async () => [signer1, signer2]);
    await tx._refreshRequiredSigners();

    expect(tx.requiredSigners).toEqual([signer1, signer2]);
    expect(tx.missingSigners).toEqual([]); // all should be satisfied
  });

  test('Only one required signer', async () => {
    const signer1 = 'signer1';
    const tx = new Transaction(mockLighthouse, { ...txArgs, signers: {} });
    tx._state.requiredSigners = [signer1];

    expect(tx.requiredSigners).toEqual([signer1]);
    expect(tx.missingSigners).toEqual([signer1]);

    tx._state.signers[signer1] = signature;

    // with refreshing
    sandbox
      .spyOn(tx, 'getRequiredSigners')
      .mockImplementation(async () => [signer1]);
    await tx._refreshRequiredSigners();

    expect(tx.requiredSigners).toEqual([signer1]);
    expect(tx.missingSigners).toEqual([]); // all should be satisfied
  });

  test('Validating multisig nonce', () => {
    sandbox
      .spyOn(Transaction, '_validateSigners')
      .mockImplementation(() => true);

    // Invalid nonce supplied
    ['1', 0.1].forEach(input => {
      expect(
        () =>
          new Transaction(mockLighthouse, { ...txArgs, multiSigNonce: input }),
      ).toThrow('multiSigNonce');
    });

    // No nonce supplied, or valid nonce supplied
    [undefined, null, 0, 1, 5].forEach(input => {
      const tx = new Transaction(mockLighthouse, {
        ...txArgs,
        multiSigNonce: input,
      });
      expect(tx).toBeInstanceOf(Transaction);
    });
  });

  test('Sending a transaction', async () => {
    const tx = new Transaction(mockLighthouse, txArgs);
    sandbox.spyOn(tx, 'refresh').mockImplementation(() => {});
    sandbox.spyOn(tx, '_validateRequiredSigners').mockImplementation(() => {});
    sandbox
      .spyOn(ContractTransaction.prototype, 'send')
      .mockImplementation(() => {});
    await tx.send();
    expect(tx.refresh).toHaveBeenCalled();
    expect(tx._validateRequiredSigners).toHaveBeenCalled();
    expect(ContractTransaction.prototype.send).toHaveBeenCalled();
  });

  test('Getting required signers', async () => {
    const requiredSigners = ['0xabc'];
    const getRequiredSigners = sandbox.fn();
    const tx = new Transaction(mockLighthouse, {
      ...txArgs,
      getRequiredSigners,
    });

    // valid return
    tx._state.getRequiredSigners.mockImplementation(() => requiredSigners);
    expect(await tx.getRequiredSigners()).toEqual(requiredSigners);
    expect(tx._state.getRequiredSigners).toHaveBeenCalledWith(
      functionCall.args,
    );

    // invalid
    tx._state.getRequiredSigners.mockImplementation(() => 'bad return');
    await expect(tx.getRequiredSigners()).rejects.toThrow('Expected an array');
  });

  test('Getting multisig nonce', async () => {
    const tx = new Transaction(mockLighthouse, txArgs);

    // returns number
    getMultiSigNonce.mockImplementationOnce(() => multiSigNonce);
    expect(await tx.getMultiSigNonce()).toEqual(multiSigNonce);

    // returns invalid
    getMultiSigNonce.mockImplementationOnce(() => 'invalid');
    await expect(tx.getMultiSigNonce()).rejects.toThrow(
      'must return an integer',
    );

    // returns nothing
    getMultiSigNonce.mockImplementationOnce(() => {});
    await expect(tx.getMultiSigNonce()).rejects.toThrow(
      'must return an integer',
    );

    // state getter
    expect(tx.multiSigNonce).toEqual(multiSigNonce);

    // state getter not set
    tx._state.multiSigNonce = null;
    expect(() => tx.multiSigNonce).toThrow('MultiSig nonce not set');
  });

  test('Getting method function', async () => {
    const functionParams = {
      myMethod: [],
    };
    const isPayable = false;
    const getRequiredSigners = sandbox.fn();
    const fn = Transaction.getMethodFn({
      lighthouse: mockLighthouse,
      functionParams,
      isPayable,
      getRequiredSigners,
      multiSigFunctionName,
      getMultiSigNonce,
    });

    // construct non-payable with value
    expect(() =>
      fn({
        value: 1,
      }),
    ).toThrow('non-payable');

    // construct
    const tx = fn();
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx._lh).toBe(mockLighthouse);
    expect(tx._state.getRequiredSigners).toBe(getRequiredSigners);
    expect(tx._state.multiSigFunctionName).toBe(multiSigFunctionName);
    expect(tx._state.getMultiSigNonce).toBe(getMultiSigNonce);

    // hooks
    expect(fn.hooks.getManager()).toBeInstanceOf(HookManager);

    // restore
    const json = JSON.stringify({});
    sandbox.spyOn(Transaction, 'restore').mockImplementationOnce(() => {});
    await fn.restore(json);
    expect(Transaction.restore).toHaveBeenCalledWith(mockLighthouse, json, {
      getRequiredSigners,
      multiSigFunctionName,
      getMultiSigNonce,
    });
  });

  test('Restore transaction', async () => {
    const json = JSON.stringify({});
    const options = {};

    // valid json
    expect(
      await Transaction.restore(mockLighthouse, json, options),
    ).toBeInstanceOf(Transaction);

    // invalid json, no options
    await expect(() =>
      Transaction.restore(mockLighthouse, 'invalid json'),
    ).toThrow('could not parse JSON');
  });
});
