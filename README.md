<div align="center">
  <img src="/docs/img/tailor_color.svg" width="600" />
</div>
<div align="center">
  <a href="https://gitter.im/JoinColony/tailor">
    <img src="https://img.shields.io/gitter/room/TechnologyAdvice/Stardust.svg" />
  </a>
  <a href="https://build.colony.io/">
    <img src="https://img.shields.io/discourse/https/build.colony.io/status.svg" />
  </a>
</div>

# Tailor

Tailor is a library for interacting with Ethereum smart contracts, built by [Colony](https://colony.io/). It acts as a powerful and easy to use layer between lower-level libraries such as Web3, and your dApp, with features including dynamic ABI loading and extensible type checking.

```sh
yarn add @colony/tailor
```

## Getting Started

Let's start by loading a contract from Etherscan. To interact with a contract we need its ABI - a description of what functions and events it has. This example relies on the code having been [verified](https://etherscan.io/verifyContract) on Etherscan.

```js
import Tailor from '@colony/tailor'
import Web3 from 'web3'
import { open } from '@colony/purser-software'

const web3 = new Web3('wss://mainnet.infura.io/ws')
const wallet = await open({ mnemonic: '...' })

const cryptoKitties = await Tailor.load({
  loader: 'etherscan',
  query: {
    contractAddress: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d'
  },
  adapter: {
    name: 'web3',
    options: { web3 }
  },
  wallet
})

// get kitty ids owned by us
const myKittyIds = await cryptoKitties.constants
  .tokensOfOwner(cryptoKitties.wallet.address)

console.log(myKittyIds)
// -> ['123456', ...]

// transfer our first kitty
await cryptoKitties.methods.transfer({
  to: '0xabc...',
  tokenId: myKittyIds[0]
}).send()

// helper method to get our kitties
cryptoKitties.extend({
  async getKitties(count) {
    const kittyIds = await this.constants
      .tokensOfOwner(cryptoKitties.wallet.address)
    return kittyIds
      .slice(0, count)
      .map(async id => await this.constants.getKitty(id))
  }
})

// list our first 5 kitties
const myKitties = await cryptoKitties.getKitties(5)

console.log(myKitties)
// -> [{ generation, genes, ... }, ...]

// listen for kitties being transferred to us
cryptoKitties.events.Transfer.addListener(({ from, to, tokenId }) => {
  if (to === cryptoKitties.wallet.address)
    console.log(`${from} sent you kitty with id ${tokenId}!`)
})
```

In this example, you can see we set up a Web3 instance pointing to [Infura](https://infura.io/), and open a [Purser](https://github.com/JoinColony/purser) wallet to use with Tailor. Once the ABI has been loaded and parsed, all of the CryptoKitties constants, events and methods are available to interact with.

As long as parameters are named in the contract, they can be passed as an object, like with the `transfer` above. You can also just pass them as positional arguments.

## Configuration

### Loaders

As well as getting contract data from Etherscan like in the getting started, there are several other ways of loading this in. The query is what tells the loader what it should be loading, with some supporting `contractName`, `contractAddress`, or both. Some loaders also take options.

```js
const client = await Tailor.load({
  loader: {
    name: 'truffle',
    options: {}
  },
  // or just loader: 'truffle',
  query: {
    contractName: 'MyContract'
  },
  ...
})

// also supports fs, http, trufflepig, etherscan

// alternatively pass pre-loaded contractData
// contractData: {
//   abi: [{ ... }],
//   address: '0xabc'
// }
```

Loaders are super flexible and allow for great development experiences using tools like [TrufflePig](https://github.com/JoinColony/trufflepig). See [loaders](https://docs.colony.io/tailor/docs-loaders) for more info, as well as how to create your own custom loader.

### Wallet

Tailor supports a wide range of wallets through [Purser](https://github.com/JoinColony/purser), including MetaMask and various hardware wallets.

```js
import { open: software } from '@colony/purser-software'
import { open: trezor } from '@colony/purser-trezor'

// mnemonic
await Tailor.load({
  wallet: await software({ mnemonic: '...' }),
  ...
})

// Trezor
await Tailor.load({
  wallet: await trezor(),
  ...
})
```

See the [Purser docs](https://docs.colony.io/purser/docs-overview) for more info on how wallets work, as well as a full list of those available.

### Contract Overrides

Sometimes it helps to be able to specify in more detail how Tailor should interact with your contract, and what values it can expect to be returned. We can do this by passing method, constant and event overrides.

```js
const KITTY_ID_TYPE = {
  validate: value => true,
  convertInput: value => value,
  convertOutput: value => value
}

const cryptoKitties = await Tailor.load({
  methods: {
    sendKitty: {
      functionName: 'transfer',
      type: 'contract',
      input: [{
        name: 'to',
        type: 'address'
      }, {
        name: 'kitty',
        type: KITTY_ID_TYPE
      }]
    }
  },
  events: {
    Transfer: {
      output: [{
        name: 'from',
        type: 'address'
      }, {
        name: 'to',
        type: 'address'
      }, {
        name: 'tokenId',
        type: 'integer'
      }]
    }
  },
  ...
})

const { events } = await cryptoKitties.methods.sendKitty({
  to: '0xabc...',
  kitty: 123456
}).send()

console.log(events)
// -> [{ from, to, tokenId }, ...]
```

Notice how at the top we define a custom type. This one doesn't actually do any checking/conversion, but you can see how it might do so.

Overriden methods have a few different options, including the `functionName` which they should call, and the `type` of transaction to be used (e.g. `deploy` or `multisig` for ERC191 off-chain multisig). See [contract specification](https://docs.colony.io/tailor/docs-contract-specification) for more info.

## Extending

### Event Emitters

Various things which happen internally within Tailor emit events. These can be used, for example, to update off-chain stores, display UI elements, or for logging purposes.

```js
const cryptoKitties = await Tailor.load({ ... })
const tx = cryptoKitties.methods.transfer(...)

tx.on('confirmation', (confirmationNumber, receipt) =>
  console.log(confirmationNumber))

await tx.send()
// -> 1, 2, 3...
```

For all available events see [events info](https://docs.colony.io/tailor/docs-events).

### Hooks

Emitted events are great for when you want to perform an action in response to something happening, but sometimes you need more control. That's where hooks come in - they let you asynchronously transform an internal Tailor value before it's used. We call these _hooked_ values.

```js
const cryptoKitties = await Tailor.load({ ... })

cryptoKitties.methods.transfer.hooks({
  // always transfer to this address
  send: (state, tx) => { ...state, to: '0x7e57...' }
})

const tx = cryptoKitties.methods.transfer(...)

tx.hooks({
  receipt: receipt => { ...receipt, hooked: true }
})
```

Hooks are called in the order `global > local`, meaning if we were to also set a `send` hook on the `tx` in the example above, the hooked value from the first would be what the second received as input. The hook functions must return the transformed input, but some hooks also provide additional arguments which should not be modified.

For a full list of available hooks see [hooks info](https://docs.colony.io/tailor/docs-hooks).

### Extend

In a lot of cases, it's fine to pass all your Tailor configuration when you load the instance. But what if, for example, you wanted to provide developers using your contract with an instance which could be further extended? We've got you covered.

```js
import myExtension from './myExtension'

const client = await Tailor.load({ ... })

// conveniently use external extension modules
client.extend(myExtension)

// or do it manually
client.extend({
  ...
})
```

This is particularly handy for [`redux-logger`](https://github.com/evgenyrodionov/redux-logger#readme) style debugging, or optional extra features which you can distribute for your contract libraries.

See [contract spec](https://docs.colony.io/tailor/docs-contract-specification) for full details of how Tailor can be extended.
