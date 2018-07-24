/* @flow */

import type EventEmitter from 'eventemitter3';

declare module 'web3-core-promievent' {
  declare class PromiEvent<T> {
    resolve(value: T): void;
    reject(error: Error): void;
    eventEmitter: Promise<T> & EventEmitter;
  }

  declare export default typeof PromiEvent;
}
