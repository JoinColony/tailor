/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';

import HookManager from '../index';

describe('HookManager', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Static function getter', () => {
    sandbox.spyOn(HookManager.prototype, 'createHooks');
    HookManager.createHooks();
    expect(HookManager.prototype.createHooks).toHaveBeenCalled();
  });

  test('Constructor', () => {
    // no args
    const hm1 = new HookManager();
    expect(hm1._hooks).toEqual(new Map());
    expect(hm1._parent).toBe(undefined);

    // with args
    const hooks = {};
    const hm2 = new HookManager({ hooks, parent: hm1 });
    expect(hm2._hooks).toEqual(new Map());
    expect(hm2._parent).toEqual(hm1);
  });

  test('Getting hooked values', async () => {
    const args = ['my', 'args'];
    const hm = new HookManager();
    const parentHm = {
      getHookedValue: sandbox
        .fn()
        .mockImplementation(async (hookName, value) => value),
    };

    // no hooks
    expect(await hm.getHookedValue('myHook', ...args)).toBe(args[0]);

    // valid hook
    const hook1 = sandbox.fn().mockImplementation(async value => value);
    const hook2 = sandbox.fn().mockImplementation(async value => value);
    hm._hooks = new Map();
    hm._hooks.set('myHook', [hook1, hook2]);

    expect(await hm.getHookedValue('myHook', ...args)).toBe(args[0]);
    expect(hook1).toHaveBeenCalledWith(...args);
    expect(hook2).toHaveBeenCalledWith(...args);

    // with parent
    hm._parent = parentHm;
    expect(await hm.getHookedValue('myHook', ...args)).toBe(args[0]);
    expect(parentHm.getHookedValue).toHaveBeenCalledWith('myHook', ...args);
  });

  test('Adding a hook', () => {
    const hook1 = sandbox.fn();
    const hook2 = sandbox.fn();
    const hm = new HookManager();

    // no existing hooks
    hm.addHook('myHook', hook1);
    expect(hm._hooks.get('myHook')).toEqual([hook1]);

    // existing hooks
    hm.addHook('myHook', hook2);
    expect(hm._hooks.get('myHook')).toEqual([hook1, hook2]);
  });

  test('Adding multiple hooks', () => {
    const hook1 = sandbox.fn();
    const hook2 = sandbox.fn();
    const hm = new HookManager();

    // single hooks
    hm.addHooks({
      myHook: hook1,
      otherHooks: hook2,
    });
    expect(hm._hooks.get('myHook')).toEqual([hook1]);
    expect(hm._hooks.get('otherHooks')).toEqual([hook2]);

    // array
    hm._hooks = new Map();
    hm.addHooks({
      myHook: [hook1, hook2],
    });
    expect(hm._hooks.get('myHook')).toEqual([hook1, hook2]);
  });

  test('Removing a hook', () => {
    const hook1 = sandbox.fn();
    const hook2 = sandbox.fn();
    const hm = new HookManager({ hooks: { myHook: [hook1, hook2] } });

    expect(hm._hooks.get('myHook')).toEqual([hook1, hook2]);

    hm.removeHook('myHook', 0);

    expect(hm._hooks.get('myHook')).toEqual([hook2]);

    // bad index
    expect(() => hm.removeHook('myHook', 2)).not.toThrow();

    // fake hook
    expect(() => hm.removeHook('fakeHook', 0)).not.toThrow();
  });

  test('Removing multiple hooks', () => {
    const hook1 = sandbox.fn();
    const hook2 = sandbox.fn();
    const hm = new HookManager({ hooks: { myHook: [hook1, hook2] } });

    expect(hm._hooks.get('myHook')).toEqual([hook1, hook2]);

    hm.removeHooks('myHook');

    expect(hm._hooks.get('myHook')).toEqual(undefined);
  });

  test('Getting function', () => {
    const hm = new HookManager();

    const hooks = hm.createHooks();

    expect(typeof hooks).toEqual('function');
    expect(hooks).toEqual(
      expect.objectContaining({
        addHook: expect.anything(),
        addHooks: expect.anything(),
        getHookedValue: expect.anything(),
        getManager: expect.anything(),
        removeHook: expect.anything(),
        removeHooks: expect.anything(),
      }),
    );

    // hooks
    sandbox.spyOn(hm, 'addHooks').mockImplementation(() => {});
    hooks();
    expect(hm.addHooks).toHaveBeenCalled();

    // add hook
    sandbox.spyOn(hm, 'addHook').mockImplementation(() => {});
    hooks.addHook();
    expect(hm.addHook).toHaveBeenCalled();

    // add hooks
    sandbox.spyOn(hm, 'addHooks').mockReset();
    hooks.addHooks();
    expect(hm.addHooks).toHaveBeenCalled();

    // get hooked value
    sandbox.spyOn(hm, 'getHookedValue').mockImplementation(() => {});
    hooks.getHookedValue();
    expect(hm.getHookedValue).toHaveBeenCalled();

    // get manager
    expect(hooks.getManager()).toBe(hm);

    // remove hook
    sandbox.spyOn(hm, 'removeHook').mockImplementation(() => {});
    hooks.removeHook();
    expect(hm.removeHook).toHaveBeenCalled();

    // remove hooks
    sandbox.spyOn(hm, 'removeHooks').mockImplementation(() => {});
    hooks.removeHooks();
    expect(hm.removeHooks).toHaveBeenCalled();
  });
});
