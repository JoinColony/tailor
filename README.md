# Lighthouse API
Lighthouse is a library for interacting with Ethereum smart contracts, built by [Colony](https://colony.io/).

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
```js
import Lighthouse from 'lighthouse'
import abi from './MetaCoinABI.json'

const contractAddress = '0x123'
const metaCoin = new Lighthouse({ abi, contractAddress })

const balance = await metaCoin.getBalance('0x456')
// -> BigNumber(50)

const transaction = metaCoin.sendCoin('0x789', 20)
const estimatedGas = await transaction.estimate()
// -> BigNumber(46000)
await transaction.send()
// -> { successful: true, eventData: { ... }, meta: { ... } }
```

Here, we’re loading in the [MetaCoin](https://github.com/ConsenSys/truffle-webpack-demo/blob/master/contracts/MetaCoin.sol) ABI from a file, and using it to instantiate a contract client. Lighthouse is clever enough to detect environments such as MetaMask or Mist and will automatically use them.

> Actually maybe we want to use loaders in the quick start? I feel like this is a big feature, but also maybe complicated to a newcomer.

### Contract Loaders
TODO: why they’re so amazing!

```js
import { TrufflepigLoader } from 'lighthouse/loaders'

const contractName = 'MetaCoin'

const loader = new TrufflepigLoader()
const myContract = new Lighthouse({ loader, contractName })

// also works with a specific address
// new Lighthouse({ loader, contractAddress })
```

> How will we now handle loading account keys via TrufflePig? Maybe this functionality shouldn’t be in contract loaders, but rather account loaders?

### Specific Contract Interface
Giving callers, senders, events - more control over how things are handled. Allows named params.

```js
const callers = {
  getThing: {
    input: [['owner', 'address']],
    output: [['thing', 'paramType']]
  }
}
const senders = {
  doThing: {
    functionName: 'doTheThing', // optional
    input: [['amount', 'number']],
    events: ['MyEvent']
  }
}
const events = {
  MyEvent: [['thingResult'], ['string']]
}

const myContract = new Lighthouse({
  callers,
  senders,
  events,
  loader,
  contractName
})

await myContract.doThing({ amount: 20 }).send()
```

TODO: explanation of above.

> There still feels something a little bit off with the input/output params syntax, could be nicer.

### Manual Environment
In some cases, you may want to use a specific environment which Lighthouse isn’t able to detect automatically. Fortunately, Lighthouse lets you manually set how it should connect to the Ethereum network and sign transactions.

```js
import { EtherscanLoader } from 'lighthouse/loaders'
import { open } from 'colony-wallet/software'

const loader = new EtherscanLoader()
const contractAddress = '0x123'
const provider = window.web3.currentProvider
const wallet = await open({ mnemonic: 'random words' })

const myContract = new Lighthouse({
  loader,
  contractAddress,
  provider,
  wallet
})
```

> I think the parsing of different combinations of parameters could end up being a long and complicated bit of code.

### Custom Types
Out of the box Lighthouse comes with type checking for Solidity types, so transactions won’t be sent unless parameters pass validation. However for many parameters, a Solidity type may be used to hold a value with more strict criteria.

For example, a contract could have a `uint8` parameter which represents a rating between 1 and 10. Zero and any number greater than 10 are not valid, but Lighthouse doesn’t know this.

```js
const callers = { ... }
const senders = {
  giveRating: {
    input: ['rating', 'rating']
  }
}
const types = {
  rating: {
    validate(value) {
      return value >= 1 && value <= 10
    }
  }
}

const myContract = new Lighthouse({
  callers,
  senders,
  types,
})
```

Custom types are passed to the constructor along with the rest of your config.

### Method Hooks
```js
const senders = {
  doThing: {
    input: [['amount', 'number']],
    events: ['MyEvent'],
    beforeSend: params => {
      // do something
    }
  }
}
```

> What other hooks do we want?

### Extending Lighthouse
TODO: explain how it removes much of the verbosity of instantiating Lighthouse; custom methods; great for writing contract libraries.

```js
class MyLighthouse extends Lighthouse {
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

// no config required
const myContract = new MyLighthouse()
await myContract.complicatedThing().send()
```
