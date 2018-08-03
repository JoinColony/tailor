/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';
import EventEmitter from 'eventemitter3';

import Event from '../index';
import { INTEGER_TYPE } from '../../paramTypes';

jest.mock('eventemitter3');

describe('Event', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  const mockAdapter = {
    subscribe: sandbox.fn().mockReturnValue(new EventEmitter()),
  };

  test('Creating an Event (spec with one signature)', () => {
    const spec = {
      name: 'MyEvent',
      output: {
        'MyEvent()': [],
      },
    };
    const event = new Event(mockAdapter, spec);
    expect(event).toBeInstanceOf(Event);
    expect(event).toHaveProperty('_adapter', mockAdapter);
    expect(event).toHaveProperty('_spec', spec);
    expect(event).toHaveProperty('_emitters', []);
    expect(event).toHaveProperty('_wrappedHandlers', expect.any(Map));
  });

  const spec = {
    name: 'MyEvent',
    output: {
      'MyEvent()': [],
      'MyEvent(uint256)': [
        {
          name: 'a',
          type: INTEGER_TYPE,
        },
      ],
      'MyEvent(uint256,uint256)': [
        {
          name: 'a',
          type: INTEGER_TYPE,
        },
        {
          name: 'b',
          type: INTEGER_TYPE,
        },
      ],
    },
  };

  test('Creating an Event (spec with multiple signatures)', () => {
    const event = new Event(mockAdapter, spec);
    expect(event).toBeInstanceOf(Event);
    expect(event).toHaveProperty('_adapter', mockAdapter);
    expect(event).toHaveProperty('_spec', spec);
    expect(event).toHaveProperty('_emitters', []);
    expect(event).toHaveProperty('_wrappedHandlers', expect.any(Map));
  });

  test('Finding an event signature by its hash', () => {
    const event = new Event(mockAdapter, spec);
    expect(
      event._findSignatureByHash(
        '0x6c2b4666ba8da5a95717621d879a77de725f3d816709b9cbe9f059b8f875e284',
      ),
    ).toBe('MyEvent(uint256)');
    expect(() => {
      event._findSignatureByHash('a hash that will not match');
    }).toThrow('could not be matched');
  });

  test('Wrapping a handler function', () => {
    const e = new Event(mockAdapter, spec);
    const handler = sandbox.fn().mockImplementation((error, event) => ({
      error,
      event,
    }));
    const wrapped = e.wrapHandlerFunction(handler);

    const error = new Error('Some event error');
    expect(wrapped(error)).toEqual({ error, event: undefined });

    const signature =
      '0x6c2b4666ba8da5a95717621d879a77de725f3d816709b9cbe9f059b8f875e284';
    const rawEvent = {
      signature,
      returnValues: {
        '0': 2,
        length: 1,
      },
    };
    expect(wrapped(rawEvent)).toEqual({
      error: undefined,
      event: {
        event: rawEvent,
        signature: 'MyEvent(uint256)',
        data: { a: 2 },
      },
    });
  });

  test('Event listeners', () => {
    const event = new Event(mockAdapter, spec);

    sandbox.spyOn(event, '_addListener');
    sandbox.spyOn(event, '_createEmitters');
    sandbox.spyOn(event, '_removeListener');
    sandbox.spyOn(event, 'wrapHandlerFunction');

    const handler = sandbox.fn();
    event.addListener(handler);

    expect(event._createEmitters).toHaveBeenCalled();
    expect(event.wrapHandlerFunction).toHaveBeenCalledWith(handler);
    expect(event._addListener).toHaveBeenCalledWith(expect.any(Function));

    expect(event._wrappedHandlers.has(handler)).toBe(true);

    // One for each event signature
    expect(event._emitters).toEqual(
      expect.arrayContaining([
        expect.any(EventEmitter),
        expect.any(EventEmitter),
        expect.any(EventEmitter),
      ]),
    );
    expect(mockAdapter.subscribe).toHaveBeenCalledTimes(3);
    expect(mockAdapter.subscribe).toHaveBeenCalledWith({ event: 'MyEvent()' });
    expect(mockAdapter.subscribe).toHaveBeenCalledWith({
      event: 'MyEvent(uint256)',
    });
    expect(mockAdapter.subscribe).toHaveBeenCalledWith({
      event: 'MyEvent(uint256,uint256)',
    });

    // The wrapped handler function should have been added
    expect(event._emitters[0].on).toHaveBeenCalledWith(
      'data',
      expect.any(Function),
    );
    expect(event._emitters[0].on).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );

    event._createEmitters.mockReset();
    event.wrapHandlerFunction.mockReset();
    event._addListener.mockReset();

    // Attempting to add the same handler shouldn't do anything
    event.addListener(handler);
    expect(event._createEmitters).not.toHaveBeenCalled();
    expect(event.wrapHandlerFunction).not.toHaveBeenCalled();
    expect(event._addListener).not.toHaveBeenCalled();

    event.removeListener(handler);
    expect(event._removeListener).toHaveBeenCalledWith(expect.any(Function));
    expect(event._emitters[0].removeListener).toHaveBeenCalledWith(
      'data',
      expect.any(Function),
    );
    expect(event._emitters[0].removeListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(event._wrappedHandlers.has(handler)).toBe(false);
  });
});
