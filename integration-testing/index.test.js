import path from 'path';
import createSandbox from 'jest-sandbox';

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

  test('Initializing a client', async () => {
    const client = new Lighthouse({
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

    // It hasn't crashed yet? Good enough for now.
  });

  // TODO add tests for:
  // JoinColony/lighthouse#9
  // JoinColony/lighthouse#16
  // JoinColony/lighthouse#17
  // JoinColony/lighthouse#19
  // JoinColony/lighthouse#20
  // JoinColony/lighthouse#21
  // JoinColony/lighthouse#22
  // JoinColony/lighthouse#25
});
