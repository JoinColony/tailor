/* eslint-disable import/no-extraneous-dependencies,flowtype/require-valid-file-annotation,no-console */

const util = require('util');
const ganache = require('ganache-cli');
const chalk = require('chalk');
const childProcess = require('child_process');
const path = require('path');
const rimraf = require('rimraf');
const fs = require('fs');

const { writeFile } = fs;

let exec = util.promisify(childProcess.exec);
const remove = util.promisify(rimraf);
const write = util.promisify(writeFile);

global.DEBUG = process.env.DEBUG || false;
/*
 * If we're in watch mode, so we need to check if this is the first run or not.
 *
 * On the first run, we'll set up ganache and compile contracts, but if we're on
 * a subsequent run, we leave them just as they are.
 * Also, if this is NOT a first run, we're not killing the ganache server in the
 * teardown step.
 */
global.WATCH = process.env.WATCH || false;
global.WATCH_FIRST_RUN = true;

if (global.DEBUG) {
  exec = util.promisify((...args) => {
    const runner = childProcess.exec(...args);
    runner.stdout.on('data', output => process.stdout.write(output));
    return runner;
  });
}

/*
 * Paths
 */
const lighthousePath = path.resolve('.');
const testingPath = path.resolve('integration-testing');
const truffleProjectPath = path.resolve(testingPath, 'truffle-project');
const trufflePath = `${lighthousePath}/node_modules/.bin/truffle`;
const contractsPath = path.resolve(truffleProjectPath, 'build', 'contracts');
const ganacheAccountsFile = path.resolve(testingPath, 'ganache-accounts.json');

/* eslint-disable-next-line global-require, import/no-dynamic-require */
const lighthousePackage = require(path.resolve('package.json'));

const cleanupArtifacts = message => {
  console.log(chalk.green.bold(message));
  const cleanupPaths = [ganacheAccountsFile, contractsPath];
  cleanupPaths.map(async artifactPath => {
    if (global.DEBUG) {
      console.log(`Removing: ${artifactPath}`);
    }
    await remove(artifactPath, { disableGlob: true });
  });
};

module.exports = async () => {
  /*
   * Leave an empty line.
   * Since first line of `jest`s output doesn't end with a new line
   */
  console.log();

  /*
   * Tell the user we're in DEBUG mode
   */
  if (global.DEBUG) {
    console.log(chalk.bgYellowBright.black.bold('  DEBUG MODE  \n'));
  }

  /*
   * Setup & configure ganache
   */
  const ganacheServerPort = '8545';
  const ganacheServerOptions = {
    default_balance_ether: 100,
    total_accounts: 10,
    gasLimit: 7000000,
  };
  const ganacheServerDebugOptions = {
    debug: true,
    logger: console,
  };
  const server = ganache.server(
    Object.assign(
      {},
      ganacheServerOptions,
      global.DEBUG ? ganacheServerDebugOptions : {},
    ),
  );

  global.ganacheServer = {
    listen: util.promisify(server.listen),
    stop: util.promisify(server.close),
  };

  /*
   * Generate the accounts object. These addresses are generated at startup by ganache.
   *
   * They will be written to a file so other services can access them
   */
  const ganacheAccounts = {
    accounts: server.provider.manager.state.accounts,
    private_keys: Object.keys(server.provider.manager.state.accounts).reduce(
      (keys, address) =>
        Object.assign({}, keys, {
          [address]: server.provider.manager.state.accounts[
            address
          ].secretKey.toString('hex'),
        }),
      {},
    ),
  };

  if (!global.WATCH || (global.WATCH && global.WATCH_FIRST_RUN)) {
    /*
     * Perform initial cleanup, since there's a good chance there are leftover
     * artifacts (build folders)
     */
    global.cleanupArtifacts = cleanupArtifacts;
    cleanupArtifacts('Removing leftover artifacts');

    /*
     * Start the ganache server
     *
     * In WATCH mode, only start the server if this is the first run
     */
    await global.ganacheServer.listen(ganacheServerPort);
    console.log(
      chalk.green.bold('Ganache Server started on'),
      chalk.bold(`${chalk.gray('http://')}localhost:${ganacheServerPort}`),
    );

    /*
     * Write the accounts to a Json file so they're available externally
     *
     * If we're in WATCH mode, only write the file once.
     */
    await write(ganacheAccountsFile, JSON.stringify(ganacheAccounts));
    /*
     * If we're in DEBUG mode, tell the user we wrote the accounts file
     */
    if (global.DEBUG) {
      console.log(
        chalk.yellow.bold('Saved accounts to'),
        chalk.bold(ganacheAccountsFile),
        chalk.yellow.bold('JSON file'),
      );
    }

    console.log(
      chalk.green.bold('Compiling Contracts using'),
      chalk.bold(
        `truffle${chalk.gray('@')}${lighthousePackage.devDependencies.truffle}`,
      ),
    );
    await exec(
      `${trufflePath} migrate --reset --compile-all --network=integration`,
      {
        cwd: truffleProjectPath,
      },
    );
  }

  /*
   * Start running Jest unit tests
   */
  console.log(chalk.green.bold('Starting integration test suites'));

  /*
   * If WATCH mode, and if this is the first run, at this stage we ran it's course.
   * So it's no longer a first run.
   */
  if (global.WATCH && global.WATCH_FIRST_RUN) {
    global.WATCH_FIRST_RUN = false;
  }

  /*
   * @TODO In WATCH mode run teardown
   *
   * Currently we don't run the teardown step in WATCH mode. This is because we
   * can't run it with the current config options `jest` provides us.
   *
   * If they will ever implement a `globalCleanup` config option, then we could
   * do teardown there.
   *
   * This just affects WATCH mode, in a normal run, cleanup/teardown
   * is performed as expected.
   */
};
