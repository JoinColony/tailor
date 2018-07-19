# Tailor API
Tailor is a library for interacting with Ethereum smart contracts, built by [Colony](https://colony.io/).

------
# WIP!
------

> Quoted sections are WIP comments.

## Key Features
* Extensible type checking and validation
* Detailed error reporting
* Simple for beginners, but flexible for more complex applications
* Support for various environments (Web3, Ethers, MetaMask, etc)

## Getting Started
> TODO: use something other than MetaCoin, complex enough to be used in all examples.

```js
import Tailor from 'tailor'
import contractData from './MetaCoin.json'

const metaCoin = new Tailor({ contractData })

const balance = await metaCoin.getBalance('0x456')
// -> BigNumber(50)

const transaction = metaCoin.sendCoin('0x789', 20)
const estimatedGas = await transaction.estimate()
// -> BigNumber(46000)
await transaction.send()
// -> { successful: true, eventData: { ... }, meta: { ... } }

// listen for Transfer event
metaCoin.on('Transfer', { eventData } => {
  console.log('tokens were transfered')
})
```

Here, we’re loading in the [MetaCoin](https://github.com/ConsenSys/truffle-webpack-demo/blob/master/contracts/MetaCoin.sol) Truffle artifact, and using it to instantiate a contract client. This parses the ABI to determine the contract methods, their arguments, and events.

Tailor is clever enough to detect environments such as MetaMask or Mist and will automatically use them for wallets and interacting with the contract. It also detects the current network and will choose the contract address from the Truffle artifact accordingly.

### Contract Loaders
Baking the contract ABI and address into our DApp is fine for simple applications, but often we want more flexibility in complex environments. Tailor uses the concept of loaders to allow developers to fetch info about their contracts from a variety of sources.

```js
const contractName = 'MetaCoin'

const myContract = new Tailor({
  loader: 'trufflepig',
  query: { contractName }
})
await myContract.init()

// also works with a specific address
// new Tailor({ loader: 'trufflepig', query: { contractAddress } })
```

Tailor includes loaders for Trufflepig, Etherscan, and others, but it’s also easy to write your own.

### Manual Environment
In some cases, you may want to use a specific environment which Tailor isn’t able to detect automatically. Fortunately, Tailor lets you manually set how it should connect to the Ethereum network and sign transactions.

```js
import { open } from 'colony-wallet/software'

const contractAddress = '0x123'
const provider = window.web3.currentProvider
const wallet = await open({ mnemonic: 'random words' })

const myContract = new Tailor({
  loader: 'etherscan',
  parser: 'truffle',
  query: { contractAddress },
  provider,
  wallet
})
```

In the above example, we're using Web3's `currentProvider` to connect to the Ethereum network, and the Colony software wallet to load from a mnemonic. We can use a string to specify any of the built in loaders and parsers, but you can also supply an instance, or an object containing the `name` and `options` to be passed.

The query defines how the loader should load the contract definition, as well as how to determine the address at which the contract resides (in this case we provide it).

## Contract Definition Overrides
Although Tailor parses your ABI to determine what your contract can do, it only knows as much as the ABI tells it. Sometimes it helps to be able to specify in more detail how Tailor should interact with your contract, and what values it can expect to be returned.

Some of the obvious advantages to this are the ability to give labels to unnamed arguments and return values, custom validations, and type casts.

```js
const constants = {
  getThing: {
    input: [{
      name: 'owner',
      type: 'address'
    }],
    output: [{
      name: 'thing',
      type: 'paramType'
    }]
  }
}
const methods = {
  doThing: {
    functionName: 'doTheThing',
    input: [{
      name: 'amount',
      type: 'number'
    }],
    events: ['MyEvent']
  }
}
const events = {
  MyEvent: [{
    name: 'thingResult',
    type: 'string'
  }]
}

const myContract = new Tailor({
  constants,
  methods,
  events,
  ...
})

await myContract.doThing({ amount: 20 }).send()
```

This specification acts as an override on top of the parsed ABI, so any methods or events you don't specify here will still be included.

We can also specify the `functionName` for a method, telling Tailor to use a different name for a method. Here, we're saying that when we send `myContract.doThing`, we actually want Tailor to use the `doTheThing` method on the contract.

For situations where our contract transacts with another contract, causing an event to be emitted, we are able to specify this - the ABI does not provide this information. We can also tell Tailor to map unnamed event values to JSON.

### Custom Types
Out of the box Tailor comes with type checking for Solidity types, so transactions won’t be sent unless parameters pass validation. However for many parameters, a Solidity type is used to hold a value with more strict criteria.

For example, a contract could have a `uint8` parameter which represents a rating between 1 and 10. Zero and any number greater than 10 are not valid, but Tailor doesn’t know this.

```js
const ratingType = {
  async validate(value) {
    await someAsyncThing(value)
    return value >= 1 && value <= 10
  },
  convertOutput(value) {
    return isBigNumber(value) ? value.toNumber() : value
  },
  convertInput(value) {
    return Number(value)
  }
}

const methods = {
  giveRating: {
    input: [
      {
        name: rating,
        type: ratingType
      }
    ]
  }
}

const myContract = new Tailor({
  methods,
  ...
})
```

Custom type validation functions can either return a boolean, or a promise which will resolve to one. The `async` support is super useful for situations where you might want to compare input against another value from the contract.

### Method Hooks
For cases where we want to perform some extra functionality before or after a transaction is sent, Tailor provides method hooks. For example, we may want to store the result of a transaction or call on IPFS, or send another transaction after a first successful one.

```js
const methods = {
  doThing: {
    input: [{
      name: 'amount',
      type: 'number'
    }],
    events: ['MyEvent'],
    beforeSend: async ({ params, contract }) => {
      // do something
    }
  }
}
```

We can also add listeners for a specific method after the fact, as well as contract-wide hooks, and hooks which will only fire `once`.

```js
myClient.doThing.on('send', ({ params, contract, result }) => {
  // every time a doThing tx is sent
})

myClient.once('beforeSend', ({ params, contract, method }) => {
  // do something before the next send
})
```

### Common Contract Patterns
> TODO: on/off chain multisig senders

Tailor's loaders also support contracts which use the EtherRouter pattern - when you specify a `routerAddress` in the query, it will load the contract definition as usual, but use the router to interact with it.

```js
const myContract = new Tailor({
  loader: 'trufflepig',
  query: { contractName, routerAddress },
  ...
})
```

## Extending Tailor
Many Ethereum projects take full advantage of the openness of the platform, and opt to release a library to interact with their contracts. Although you could quite happily use the above methods to achieve such a goal, Tailor is designed around being able to extend the base class to implement your own complex functionality.

A static getter is used to return the base contract definition.

```js
class MyTailor extends Tailor {
  static get definition() {
    return { constants, methods, events, contractData }
  }

  // helper functions
  complicatedThing() {
    const params = someFunction()
    someOtherFunction(params)
    return this.doThing(params)
  }
}
```

One of the really neat things this enables is users of your library being able to instantiate it with _zero-config_. Tailor will automatically detect the environment and set up everything needed for them to start interacting with your contract.

```js
const myContract = new MyTailor()
await myContract.complicatedThing().send()
```

> The following should be a brief description of the interfaces.

### Custom Loaders
E.g. extending http loader for a particular web api.

### Custom Adapters
Todo.

### Custom Wallets
Todo.

### Custom Methods
Todo.
