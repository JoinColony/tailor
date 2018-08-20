/* @flow */

import type EventEmitter from 'eventemitter3';

declare module 'web3-core-promievent' {
  declare export class PromiEventEmitter<+R> extends Promise<R> {
    static defaultMaxListeners: number;
    _events: Object;
    getMaxListeners(): number;
    setMaxListeners(n: number): this;
    listenerCount(event: string): number;
    listeners(event: string): Array<any>;
    listeners(event: string, existence: boolean): boolean;
    on(event: string, listener: Function, context?: any): this;
    addListener(event: string, listener: Function, context?: any): this;
    once(event: string, listener: Function, context?: any): this;
    removeAllListeners(event?: string): this;
    removeListener(event: string, listener?: Function, context?: any): this;
    off(event: string, listener?: Function, context?: any): this;
    emit(event: string, ...params?: Array<any>): this;
  }

  declare class PromiEvent<T> {
    resolve(value: T): void;
    reject(error: Error): void;
    eventEmitter: PromiEventEmitter<T>;
  }

  declare export default typeof PromiEvent;
}
