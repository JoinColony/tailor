---
title: Loaders
section: Docs
order: 1
---

Loaders make it possible to easily access and load Ethereum smart contracts.

To interact with a contract, whether it's deployed on a local or remote network, you need the address of the deployed contract and its Application Binary Interface (ABI).

Loaders provide a simple way to get the address and ABI of a deployed contract, in a specific version, at a particular location (mainnet, testnet, or a local network). Within Tailor, this information is then parsed and used to form the Tailor instance.

In a nutshell, the loader is an abstraction that takes an argument (e.g. the name of a contract) and returns a definition (e.g. the address of the contract and its ABI) from a specific source (e.g. an http host).

## How to use loaders

We imagine that the most useful case for developers will be for a loader to accept a contract address and return that contract's ABI from an http source such as Etherscan's API. Tailor provides several options for loading contract data.

### Loading ABI from Etherscan with an address

Internally, Tailor is instantiating the Etherscan loader and calling its `.load` method with the provided query. The result of that (the `contractData`) is then handed over to the parser, which parses the data and tells Tailor what constants, events and methods are available on the contract.

```js

import Tailor from '@colony/tailor';

// The default endpoint for Etherscan:
// https://api.etherscan.io/api?module=contract&action=getabi&address=%%ADDRESS%%

const client = Tailor.load({
  loader: 'etherscan',
  query: {
    contractAddress: '0xf000000000000000000000000000000000000000',
  },
  ...
});

```

We can also use `EtherscanLoader` to load contract data without creating a client instance.

```js

import { EtherscanLoader } from '@colony/tailor';

// Create an instance of the loader
const loader = new EtherscanLoader();

// Get the contract data using the loader
const { abi, address, bytecode } = await loader.load({
  contractAddress: '0xf000000000000000000000000000000000000000',
});

```


### Loading contractAddress and ABI from TrufflePig with a name

For local development, contracts are quite commonly deployed, destroyed, and re-deployed multiple times to a local test network. Colony's very own [TrufflePig](https://github.com/JoinColony/trufflepig) is a tool that was built to serve and load both the contractAddress and ABI when given a unique name for a specific contract.

```js

import Tailor from '@colony/tailor';

// The default endpoint for TrufflePig:
// https://127.0.0.1:3030/contracts?name=%%NAME%%&address=%%ADDRESS%%&version=%%VERSION%%

const client = Tailor.load({
  loader: 'trufflepig',
  query: {
    contractName: 'ColonyNetwork',
  },
  ...
});

```

We can also use `TrufflepigLoader` to load contract data without creating a client instance.

```js

import { TrufflepigLoader } from '@colony/tailor';

// Create an instance of the loader
const loader = new TrufflepigLoader();

// Get the contract data using the loader
const { abi, address, bytecode } = await loader.load({
  contractName: 'ColonyNetwork',
});

```

### Loading from a custom data source using the `transform` property

It's possible that a custom data source will deliver your data in a format different than Etherscan or TrufflePig. For this, it's necessary to utilize the `transform` property, which can transform the raw output of the source. The default behavior of `transform` is to return the JSON object that is passed to it.

```js

import Tailor from '@colony/tailor';

const client = Tailor.load({
  name: 'http',
  options: {
    endpoint: 'https://example.io/contracts?address=%%ADDRESS%%',
    transform(response, query) {
      return {
        address: query.contractAddress,
        abi: response.data.contractABI,
        bytecode: response.data.bytecode
      };
    },
  },
  ...
});

```

We can also use `HttpLoader` to load contract data without creating a client instance.

```js

import { HttpLoader } from '@colony/tailor';

// Create an instance of the loader
const loader = new HttpLoader({
  endpoint: 'https://example.io/contracts?address=%%ADDRESS%%',
  transform(response, query) {
    return {
      address: query.contractAddress,
      abi: response.data.contractABI,
      bytecode: response.data.bytecode
    };
  },
});

// Get the contract data using the loader
const { abi, address, bytecode } = await loader.load({
  contractAddress: '0xf000000000000000000000000000000000000000'
});

```

## Future/Imaginable loaders

Both the `EtherscanLoader` and `TrufflepigLoader` are modified versions of the more general `HttpLoader`. We plan to extend this functionality to load contract data from more data sources, such as:

- IPFS
- EthPM
- GitHub tagged releases
- Databases (including IndexedDB)
- Browser file API
- Swarm
