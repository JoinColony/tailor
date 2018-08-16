/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import createSandbox from 'jest-sandbox';

import HookManager from '../index';

describe('Methods', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.clear();
  });

  test('Static function getter', () => {
    sandbox.spyOn(HookManager.prototype, 'fn');
    HookManager.fn();
    expect(HookManager.prototype.fn).toHaveBeenCalled();
  });

  test('Constructor', () => {
    // no args
    const hm1 = new HookManager();
    expect(hm1._hooks).toEqual({});
    expect(hm1._parent).toBe(undefined);

    // with args
    const hooks = {};
    const hm2 = new HookManager({ hooks, parent: hm1 });
    expect(hm2._hooks).toEqual(hooks);
    expect(hm2._parent).toEqual(hm1);
  });

  test('Getting hooked values', async () => {
    const args = ['my', 'args'];
    const hm = new HookManager();
    const parentHm = {
      getHookedValue: sandbox.fn().mockImplementation(async value => value),
    };

    // no hooks
    expect(await hm.getHookedValue('myHook', ...args)).toBe(args[0]);

    // valid hook
    const hook1 = sandbox.fn().mockImplementation(async value => value);
    const hook2 = sandbox.fn().mockImplementation(async value => value);
    hm._hooks.myHook = [hook1, hook2];

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
    expect(hm._hooks.myHook).toEqual([hook1]);

    // existing hooks
    hm.addHook('myHook', hook2);
    expect(hm._hooks.myHook).toEqual([hook1, hook2]);
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
    expect(hm._hooks.myHook).toEqual([hook1]);
    expect(hm._hooks.otherHooks).toEqual([hook2]);

    // array
    hm._hooks = {};
    hm.addHooks({
      myHook: [hook1, hook2],
    });
    expect(hm._hooks.myHook).toEqual([hook1, hook2]);
  });

  test('Removing a hook', () => {
    const hook1 = sandbox.fn();
    const hook2 = sandbox.fn();
    const hm = new HookManager({ hooks: { myHook: [hook1, hook2] } });

    expect(hm._hooks.myHook).toEqual([hook1, hook2]);

    hm.removeHook('myHook', 0);

    expect(hm._hooks.myHook).toEqual([hook2]);
  });

  test('Removing multiple hooks', () => {
    const hook1 = sandbox.fn();
    const hook2 = sandbox.fn();
    const hm = new HookManager({ hooks: { myHook: [hook1, hook2] } });

    expect(hm._hooks.myHook).toEqual([hook1, hook2]);

    hm.removeHooks('myHook');

    expect(hm._hooks.myHook).toEqual(undefined);
  });

  test('Getting function', () => {
    const hm = new HookManager();

    const fn = hm.fn();

    expect(typeof fn).toEqual('function');
    expect(fn).toEqual(
      expect.objectContaining({
        addHook: expect.anything(),
        addHooks: expect.anything(),
        getHookedValue: expect.anything(),
        getManager: expect.anything(),
        removeHook: expect.anything(),
        removeHooks: expect.anything(),
      }),
    );

    // fn
    sandbox.spyOn(hm, 'addHooks').mockImplementation(() => {});
    fn();
    expect(hm.addHooks).toHaveBeenCalled();

    // add hook
    sandbox.spyOn(hm, 'addHook').mockImplementation(() => {});
    fn.addHook();
    expect(hm.addHook).toHaveBeenCalled();

    // add hooks
    sandbox.spyOn(hm, 'addHooks').mockReset();
    fn.addHooks();
    expect(hm.addHooks).toHaveBeenCalled();

    // get hooked value
    sandbox.spyOn(hm, 'getHookedValue').mockImplementation(() => {});
    fn.getHookedValue();
    expect(hm.getHookedValue).toHaveBeenCalled();

    // get manager
    expect(fn.getManager()).toBe(hm);

    // remove hook
    sandbox.spyOn(hm, 'removeHook').mockImplementation(() => {});
    fn.removeHook();
    expect(hm.removeHook).toHaveBeenCalled();

    // remove hooks
    sandbox.spyOn(hm, 'removeHooks').mockImplementation(() => {});
    fn.removeHooks();
    expect(hm.removeHooks).toHaveBeenCalled();
  });
});
