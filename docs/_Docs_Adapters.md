---
title: Adapters
section: Docs
order: 2
---

Adapters allow you to interact with the Ethereum blockchain.

In this case, the adapter is the layer between Tailor and your connection to Ethereum network.

## How to use adapters

Tailor currently only supports a [web3.js](https://github.com/ethereum/web3.js) adapter, with plans to support an [ethers.js](https://github.com/ethers-io/ethers.js/) adapter and new adapters as they become available.

### Web3 Adapter

In order to configure the `Web3Adapter`, all you need to do is create a `web3` instance, set a provider, and then pass the `web3` instance to the `.load` method.

```js

import Tailor from '@colony/tailor';
import Web3 from 'web3';

const web3 = new Web3('wss://mainnet.infura.io/ws');

const client = await Tailor.load({
  ...
  adapter: {
    name: 'web3',
    options: { web3 }
  },
  ...
});

```
