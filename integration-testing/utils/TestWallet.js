import EthereumTx from 'ethereumjs-tx';

import Wallet from '../../src/wallets/Wallet';

export default class TestWallet extends Wallet {
  constructor(publicKey, privateKey) {
    super();
    this._publicKey = publicKey;
    this._privateKey = privateKey;
  }

  // eslint-disable-next-line class-methods-use-this
  get address() {
    return this._publicKey;
  }

  // eslint-disable-next-line class-methods-use-this
  get publicKey() {
    return this._publicKey;
  }

  // eslint-disable-next-line class-methods-use-this
  get privateKey() {
    return this._privateKey;
  }

  async sign({ gas, nonce, gasPrice, data, to, value, from }) {
    // TODO do we need to convert to Number?
    const tx = new EthereumTx({
      data,
      from,
      gasLimit: gas && gas.toNumber(),
      gasPrice: gasPrice && gasPrice.toNumber(),
      nonce: nonce && nonce.toNumber(),
      to,
      value: value && value.toNumber(),
    });
    tx.sign(this.privateKey);
    return `0x${tx.serialize().toString('hex')}`;
  }
}
