// @flow
import PromiEvent from 'web3-core-promievent';
import type EventEmitter from 'eventemitter3';
import type {
  IAdapter,
  FunctionCall,
  TransactionData,
  SignedTransaction,
  TransactionReceipt,
  SubscriptionOptions,
  FunctionArguments,
} from '../../interface/Adapter';
import type { ContractData } from '../../interface/Loader';

export default class Web3Adapter implements IAdapter {
  _web3: any;

  _contract: any;

  constructor(web3: any) {
    this._web3 = web3;
  }

  initialize(contractData: ContractData) {
    this._contract = new this._web3.eth.Contract(
      contractData.abi,
      contractData.address,
    );
  }

  encodeDeploy(args: FunctionArguments) {
    this._checkInitialized();

    return this._contract.deploy({ arguments: args }).encodeABI();
  }

  encodeFunctionCall(functionCall: FunctionCall) {
    this._checkInitialized();

    return this._contract.methods[functionCall.method](
      ...functionCall.arguments,
    ).encodeABI();
  }

  decodeFunctionCallData(functionCallData: TransactionData) {
    this._checkInitialized();

    const methodSig = functionCallData.slice(0, 10);
    // eslint-disable-next-line no-underscore-dangle
    const methodInterface = this._contract._jsonInterface.find(
      el => el.signature === methodSig,
    );

    if (!methodInterface) throw new Error('Cannot decode function call data!');

    const paramTypes = methodInterface.inputs.map(param => param.type);
    const paramData = `0x${functionCallData.slice(10)}`;
    const paramsResult = this._web3.eth.abi.decodeParameters(
      paramTypes,
      paramData,
    );

    const params = [];
    for (let i = 0; i < paramTypes.length; i += 1) {
      params.push(paramsResult[i]);
    }

    return { method: methodInterface.name, arguments: params };
  }

  async estimate(transactionData: TransactionData) {
    this._checkInitialized();

    // TODO: it's possible to pass `from`, `gas`, and `value` as options here
    return this._web3.eth.estimateGas({
      to: this._contract.options.address,
      data: transactionData,
    });
  }

  // adapted from https://github.com/ethereum/web3.js/blob/1.0/packages/web3-eth-contract/src/index.js#L836
  _decodeReceipt(receipt: any): TransactionReceipt {
    if (!(receipt.logs && receipt.logs.length)) {
      return receipt;
    }

    const logs = receipt.logs.map(log =>
      // eslint-disable-next-line no-underscore-dangle
      this._contract._decodeEventABI(
        {
          name: 'ALLEVENTS',
          jsonInterface: this._contract.options.jsonInterface,
        },
        log,
      ),
    );

    const decodedReceipt = receipt;
    decodedReceipt.events = {};

    let count = 0;
    logs.forEach(log => {
      // anonymous log
      if (!log.event) {
        decodedReceipt.events[count] = log;
        count += 1;
        return;
      }

      // use array if same event emitted multiple times
      if (decodedReceipt.events[log.event]) {
        if (Array.isArray(decodedReceipt.events[log.event])) {
          decodedReceipt.events[log.event].push(log);
        } else {
          decodedReceipt.events[log.event] = [
            decodedReceipt.events[log.event],
            log,
          ];
        }
      } else {
        decodedReceipt.events[log.event] = log;
      }
    });

    return decodedReceipt;
  }

  sendSignedTransaction(transaction: SignedTransaction) {
    this._checkInitialized();

    const promiEvent = new PromiEvent();
    const txPromiEvent = this._web3.eth.sendSignedTransaction(transaction);

    txPromiEvent.on('transactionHash', hash =>
      promiEvent.eventEmitter.emit('transactionHash', hash),
    );
    txPromiEvent.on('receipt', receipt =>
      promiEvent.eventEmitter.emit('receipt', this._decodeReceipt(receipt)),
    );
    txPromiEvent.on('confirmation', (confirmationNumber, receipt) =>
      promiEvent.eventEmitter.emit(
        'receipt',
        confirmationNumber,
        this._decodeReceipt(receipt),
      ),
    );
    txPromiEvent.on('error', error =>
      promiEvent.eventEmitter.emit('error', error),
    );

    txPromiEvent.catch(promiEvent.reject);
    txPromiEvent.then(receipt =>
      promiEvent.resolve(this._decodeReceipt(receipt)),
    );

    return promiEvent;
  }

  async call(functionCall: FunctionCall) {
    this._checkInitialized();

    const rawResult = await this._contract.methods[functionCall.method](
      ...functionCall.arguments,
    ).call();

    // convert Result object to array
    const result = [];
    for (let i = 0; i < functionCall.arguments.length; i += 1) {
      result.push(rawResult[i]);
    }

    return result;
  }

  async subscribe(options: SubscriptionOptions) {
    this._checkInitialized();

    const contract = this._contract.clone();

    if (options.address) {
      contract.options.address = options.address;
    }

    if (options.event) {
      return (contract.events[options.event](): EventEmitter);
    }
    return (contract.events.allEvents(): EventEmitter);
  }

  getCurrentNetwork() {
    return this._web3.eth.net.getId();
  }

  _checkInitialized() {
    if (!this._contract)
      throw new Error('Adapter not initialized! Call `.initialize()` first.');
  }
}
