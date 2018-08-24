# Tailor

Tailor is a library for interacting with Ethereum smart contracts, built by [Colony](https://colony.io/). It includes extensible type checking, detailed error reporting, support for different environments, and much more.

## Getting Started

Let's start by loading a contract from Etherscan. To interact with a contract we need it's ABI - a description of what functions and events it has. This example relies on the code having been [verified](https://etherscan.io/verifyContract) on Etherscan.

```js
import Tailor from 'tailor'

const cryptoKitties = await Tailor.load({
  etherscan: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d'
})

// get kitty ids owned by us
const myKittyIds = await cryptoKitties.constants
  .tokensOfOwner(cryptoKitties.wallet.address)

console.log(myKittyIds)
// -> ['123456', ...]

// transfer our first kitty
await cryptoKitties.methods.transfer('0xabc...', myKittyIds[0]).send()

// helper method to get our kitties
cryptoKitties.extend({
  async getKitties(count) {
    const kittyIds = await cryptoKitties.constants
      .tokensOfOwner(cryptoKitties.wallet.address)
    return kittyIds
      .slice(0, count)
      .map(async id => await cryptoKitties.constants.getKitty(id))
  }
})

// list our first 5 kitties
const myKitties = await cryptoKitties.getKitties(5)

console.log(myKitties)
// -> [{ generation, genes, ... }, ...]

// listen for kitties being transferred to us
cryptoKitties.events.Transfer.addListener(({from, to, tokenId}) => {
  if (to === cryptoKitties.wallet.address)
    console.log(`${from} sent you kitty with id ${tokenId}!`)
})
```

Tailor is clever enough to detect environments such as MetaMask or Mist and will automatically use them for wallets and interacting with the contract.

If parameters are named in the contract, they can be passed as an object, otherwise as positional arguments. The same applies for outputs/event params.

## Configuration

### Loaders

As well as getting contract data from Etherscan like in the getting started, there are several other ways of loading this in.

```js
const client = await Tailor.load({ file: '../build/MyContract.json' })

// trufflepig: 'MyContract'
// http: 'https://mycooldapp.com/contract.json'
// ipfs: 'QmXyz...'
// swarm: 'abc123...'
// ens: 'mycontract.ens'
// github: { repo: 'project/repo', version: 'v2.0.0' }

// alternatively pass pre-loaded contractData
// contractData: {
//   abi: [{ ... }],
//   address: '0xabc'
// }
```

Loaders are super flexible and allow for great development experiences using tools like [TrufflePig](https://github.com/JoinColony/trufflepig). You can also create your own loader and pass it as `loader`. See [extending loaders](todo) for more info.

### Wallet

In most cases you shouldn't need to worry about telling Tailor which wallet to use. If you're using MetaMask or a browser with Web3 built in, it'll be detected and used automatically. Tailor supports a wide range of wallets through [Purser](todo). It's also possible to pass a mnemonic phrase, or specify a particular wallet.

```js
// mnemonic
await Tailor.load({ mnemonic: 'twelve words...' })

// specific wallet
await Tailor.load({ wallet: 'trezor' })
```

Wallets need to conform to a standard interface, but creating a wrapper for your own is simple. See [wallet info](todo) for more info about wallets.

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

Overriden methods have a few different options, including the `functionName` which they should call, and the `type` of transaction to be used (e.g. `deploy` or `multisig` for ERC191 off-chain multisig). See [contract specification](todo) for more info.

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

For all available events see [events info](todo).

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

For a full list of available hooks see [hooks info](todo).

### Extend

In a lot of cases, it's fine to pass all your Tailor configuration when you load the instance. But what if, for example, you wanted to provide developers using your contract with an instance which could be further extended? We've got you covered.

```js
import myExtension from './myExtension'

const cryptoKitties = await Tailor.load({ ... })

// conveniently use external extension modules
cryptoKitties.extend(myExtension)

// or do it manually
cryptoKitties.extend({
  ...
})
```

This is particularly handy for [`redux-logger`](https://github.com/evgenyrodionov/redux-logger#readme) style debugging, or optional _extra features_ which you can distribute for your contract libraries.

See [configuration options](todo) for full details of how Tailor can be extended.
