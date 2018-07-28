import path from 'path';
import createSandbox from 'jest-sandbox';
import Web3 from 'web3';

import Lighthouse from '../src';

const directory = path.resolve(
  'integration-testing',
  'truffle-project',
  'build',
  'contracts',
);

describe('Integration testing', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  let client;

  test('Initializing a client', async () => {
    client = new Lighthouse({
      adapter: {
        name: 'web3',
        options: {
          web3: new Web3('http://localhost:8545'),
        },
      },
      query: { contractName: 'MetaCoin' },
      parser: 'truffle',
      loader: {
        name: 'truffle',
        options: {
          directory,
        },
      },
    });

    // The specs should not be set
    expect(client).not.toHaveProperty('constants');
    expect(client).not.toHaveProperty('events');
    expect(client).not.toHaveProperty('methods');

    await client.initialize();

    expect(client).toHaveProperty('constants', {
      getBalance: expect.any(Function),
      getBalanceInEth: expect.any(Function),
      lastSender: expect.any(Function),
      overloaded: expect.any(Function),
    });

    // It hasn't crashed yet? Good enough for now.
  });

  test('Calling an overloaded constant', async () => {
    const { overloaded } = client.constants;
    expect(await overloaded(2, 2, 2)).toEqual({ sum: 6 });
    expect(await overloaded(2, 2)).toEqual({ sum: 4 });
    expect(await overloaded(2, true)).toEqual({ sum: 2 });
    expect(await overloaded(true, true)).toEqual({
      sum: 0,
    });
  });

  // TODO add tests for:
  // JoinColony/lighthouse#9
  // JoinColony/lighthouse#16
  // JoinColony/lighthouse#17
  // JoinColony/lighthouse#19
  // JoinColony/lighthouse#20
  // JoinColony/lighthouse#21
  // JoinColony/lighthouse#25
});
