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

> TODO: do we like the `addListener` syntax?

```js
import Tailor from 'tailor'
import abi from './MetaCoinABI.json'

const contractAddress = '0x123'
const metaCoin = new Tailor({ abi, contractAddress })

const balance = await metaCoin.getBalance('0x456')
// -> BigNumber(50)

const transaction = metaCoin.sendCoin('0x789', 20)
const estimatedGas = await transaction.estimate()
// -> BigNumber(46000)
await transaction.send()
// -> { successful: true, eventData: { ... }, meta: { ... } }

metaCoin.addListener('Transfer', { eventData } => {
  console.log('tokens were transfered')
})
```

Here, we’re loading in the [MetaCoin](https://github.com/ConsenSys/truffle-webpack-demo/blob/master/contracts/MetaCoin.sol) ABI from a file, and using it to instantiate a contract client. This parses the ABI to determine the contract methods, their arguments, and events. Tailor is clever enough to detect environments such as MetaMask or Mist and will automatically use them for wallets and interacting with the contract.

### Contract Loaders
Loading the ABI from a file and baking the address into our DApp is fine for simple applications, but often we want more flexibility in complex environments. Tailor uses the concept of loaders to allow developers to fetch info about their contracts from a variety of sources.

```js
import { TrufflepigLoader } from 'tailor/loaders'

const contractName = 'MetaCoin'
const loader = new TrufflepigLoader()

const myContract = new Tailor({ loader, contractName })
await myContract.load()

// also works with a specific address
// new Tailor({ loader, contractAddress })
```

Tailor includes loaders for Trufflepig, Etherscan, and others, but it’s also easy to write your own.

### Manual Environment
In some cases, you may want to use a specific environment which Tailor isn’t able to detect automatically. Fortunately, Tailor lets you manually set how it should connect to the Ethereum network and sign transactions.

```js
import { EtherscanLoader } from 'tailor/loaders'
import { open } from 'colony-wallet/software'

const loader = new EtherscanLoader()
const contractAddress = '0x123'
const provider = window.web3.currentProvider
const wallet = await open({ mnemonic: 'random words' })

const myContract = new Tailor({
  loader,
  contractAddress,
  provider,
  wallet
})
```

In the above example, we're using Web3's `currentProvider` to connect to the Ethereum network, and the Colony software wallet to load from a mnemonic.

## Contract Definition Overrides
Although Tailor parses your ABI to determine what your contract can do, it only knows as much as the ABI tells it. Sometimes it helps to be able to specify in more detail how Tailor should interact with your contract, and what values it can expect to be returned.

One of the more obvious advantages to this is the ability to give labels to unnamed arguments and return values, as seen below.

```js
const callers = {
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
const senders = {
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
  callers,
  senders,
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
  validate(value) {
    return value >= 1 && value <= 10
  },
  convertOutput(value) {
    return isBigNumber(value) ? value.toNumber() : value
  },
  convertInput(value) {
    return Number(value)
  }
}

const senders = {
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
  senders,
  ...
})
```

### Method Hooks
For cases where we want to perform some extra functionality before or after a transaction is sent, Tailor provides method hooks. For example, we may want to store the result of a transaction or call on IPFS, or send another transaction after a first successful one.

```js
const senders = {
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

We can also add listeners for a specific method after the fact, as well as contract-wide hooks.

```js
myClient.doThing.afterSend(({ params, contract, result }) => {
  // store result elsewhere
})

myClient.beforeSend(({ params, contract, method }) => {
  // do something every time we send a tx
})
```

### Common Contract Patterns
> On/off chain multisig senders.

## Extending Tailor
Many Ethereum projects take full advantage of the openness of the platform, and opt to release a library to interact with their contracts. Although you could quite happily use the above methods to achieve such a goal, Tailor is designed around being able to extend the base class to implement your own complex functionality.

A static getter is used to return the base contract definition.

```js
class MyTailor extends Tailor {
  static get definition() {
    return { callers, senders, events, types, contractName }
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
