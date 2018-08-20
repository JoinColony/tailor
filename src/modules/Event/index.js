/* @flow */
/* eslint-disable no-underscore-dangle */

import EventEmitter from 'eventemitter3';
import { sha3 } from 'web3-utils';
import type { IAdapter } from '../../interface/Adapter';
import type { Event as EventLog, TypedEvent } from '../../interface/flowtypes';
import type { EventSpec } from '../../interface/ContractSpec';

import { convertResultObj, convertOutput } from '../paramConversion';
import HookManager from '../HookManager';
import type { HookManagerFn } from '../HookManager/flowtypes';

type EventCallback = (...*) => *;

type TypedEventCallback = (error?: Error, event?: TypedEvent) => void;

export default class Event {
  _spec: EventSpec;

  _adapter: IAdapter;

  // A store for the event handlers that got wrapped for type validation.
  _wrappedHandlers: Map<TypedEventCallback, EventCallback>;

  _emitters: Array<EventEmitter>;

  hooks: HookManagerFn;

  constructor(adapter: IAdapter, spec: EventSpec) {
    this._adapter = adapter;
    this._emitters = [];
    this._spec = spec;
    this._wrappedHandlers = new Map();
    this.hooks = HookManager.createHooks();
  }

  handleEvent(event: EventLog) {
    const { signature: sigHash, returnValues } = event;
    const signature = this._findSignatureByHash(sigHash);
    const spec = this._spec.output[signature];
    const data = convertOutput(
      spec,
      ...convertResultObj(spec.length, returnValues),
    );
    return { event, signature, data, name: event.event };
  }

  _findSignatureByHash(hash: string): string {
    const signatures = Object.keys(this._spec.output);
    const found = signatures.find(signature => sha3(signature) === hash);
    if (!found)
      throw new Error(`Event signature "${hash}" could not be matched`);
    return found;
  }

  wrapHandlerFunction(handlerFunction: TypedEventCallback): EventCallback {
    return async (arg: EventLog | Error) => {
      if (arg instanceof Error) return handlerFunction(arg);

      const hookedEvent = await this.hooks.getHookedValue(
        'event',
        this.handleEvent(arg),
      );
      return handlerFunction(undefined, hookedEvent);
    };
  }

  _createEmitters() {
    this._emitters = Object.keys(this._spec.output).map(event =>
      this._adapter.subscribe({ event }),
    );
  }

  _addListener(wrappedHandlerFunction: EventCallback) {
    this._emitters.forEach(emitter => {
      emitter.on('data', wrappedHandlerFunction);
      emitter.on('error', wrappedHandlerFunction);
    });
  }

  _removeListener(wrappedHandlerFunction: EventCallback) {
    this._emitters.forEach(emitter => {
      emitter.removeListener('data', wrappedHandlerFunction);
      emitter.removeListener('error', wrappedHandlerFunction);
    });
  }

  async addListener(handlerFunction: TypedEventCallback) {
    if (this._wrappedHandlers.get(handlerFunction)) return;

    if (this._emitters.length === 0) {
      this._createEmitters();
    }

    const wrappedHandlerFunction = this.wrapHandlerFunction(handlerFunction);

    this._addListener(wrappedHandlerFunction);
    this._wrappedHandlers.set(handlerFunction, wrappedHandlerFunction);
  }

  removeListener(handlerFunction: TypedEventCallback) {
    const wrappedHandlerFunction = this._wrappedHandlers.get(handlerFunction);

    if (wrappedHandlerFunction) {
      this._removeListener(wrappedHandlerFunction);
      this._wrappedHandlers.delete(handlerFunction);
    }
  }
}
