/* @flow */

import type EventEmitter from 'eventemitter3';

declare module 'web3-core-promievent' {
  // TODO: this type definition does not work
  declare export type PromiEventEmitter<T> = Promise<T> & EventEmitter;

  declare class PromiEvent<T> {
    resolve(value: T): void;
    reject(error: Error): void;
    eventEmitter: PromiEventEmitter<T>;
  }

  declare export default typeof PromiEvent;
}
