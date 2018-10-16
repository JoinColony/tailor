---
title: Wallets
section: Docs
order: 3
---

Wallets store your public and private keys and are used for signing transactions.

Tailor supports a wide range of wallets with [Purser](https://github.com/JoinColony/purser), including both hardware and software wallets. See the [Purser Documentation](https://docs.colony.io/purser/docs-overview/) for more information on how wallets work, as well as a full list of wallets available.

## How to use wallets

With Purser, the configuration for the `Web3Wallet` is simple.

### Web3 Wallet using MetaMask

Import the `@colony/purser-metamask` package, then execute the `open` method and pass the result to the `.load` method.

```js

import { open } from '@colony/purser-metamask'

const wallet = await open()

const client = await Tailor.load({
  ...
  wallet,
})

```

### Web3 Wallet using a private key or mnemonic

Import the `@colony/purser-software` package, execute the `open` method with the `privateKey` as an argument, then pass the result to the `.load` method.

```js

import { open } from '@colony/purser-software'

const privateKey = 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'

const wallet = await open({ privateKey })

await Tailor.load({
  ...
  wallet,
})

```

Import the `@colony/purser-software` package, execute the `open` method with the `mnemonic` as an argument, then pass the result to the `.load` method.

```js

import { open } from '@colony/purser-software'

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

const wallet = await open({ mnemonic })

await Tailor.load({
  ...
  wallet,
})

```

### Web3 Wallet using Trezor

Import the `@colony/purser-trezor` package, then execute the `open` method and pass the result to the `.load` method.

```js

import { open } from '@colony/purser-trezor'

const wallet = await open()

const client = await Tailor.load({
  ...
  wallet,
})

```
