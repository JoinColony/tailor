/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';

import Transaction from '../index';

describe('DeployTransaction', () => {
  const sandbox = createSandbox();

  const deployArgs = ['deploy', 'args'];
  const encodedDeploy = 'encoded deploy';
  const gasEstimate = 31415926535;
  const gasPrice = 4;
  const nonce = 0;
  const chainId = 1;
  const signedTransaction = 'signed tx';

  const wallet = {
    address: 'wallet address',
    sign: sandbox.fn().mockResolvedValue(signedTransaction),
  };
  const mockAdapter = {
    estimate: sandbox.fn().mockResolvedValue(gasEstimate),
    sendSignedTransaction: sandbox.fn(),
    getGasPrice: sandbox.fn().mockReturnValue(gasPrice),
    getNonce: sandbox.fn().mockReturnValue(nonce),
    getCurrentNetwork: sandbox.fn().mockReturnValue(chainId),
    encodeDeploy: sandbox.fn().mockReturnValue(encodedDeploy),
    wallet,
  };

  beforeEach(() => {
    sandbox.clear();
  });

  test('Constructor', () => {
    const tx = new Transaction(mockAdapter, { deployArgs });

    expect(tx.data).toBe(encodedDeploy);
    expect(mockAdapter.encodeDeploy).toHaveBeenCalledWith(deployArgs);

    // deploy args set
    expect(tx.deployArgs).toBe(deployArgs);

    // no args
    const tx2 = new Transaction(mockAdapter, {});
    expect(tx2.deployArgs).toEqual([]);
  });
});
