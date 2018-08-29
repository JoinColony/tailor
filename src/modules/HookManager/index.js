/* @flow */

import type {
  HookManagerArgs,
  HookManagerFn,
  Hook,
  Hooks,
  SuppliedHooks,
} from './flowtypes';

export default class HookManager {
  _hooks: Hooks;

  _parent: ?HookManager;

  /**
   * Constructs a HM with the given args and returns its `hooks()`
   * function.
   */
  static createHooks(args: HookManagerArgs = {}): HookManagerFn {
    const hm = new HookManager(args);
    return hm.createHooks();
  }

  constructor({ hooks, parent }: HookManagerArgs = {}) {
    this._hooks = new Map();
    this._parent = parent;

    if (hooks) this.addHooks(hooks);
  }

  /**
   * Gets the hooked value for the given hookName, with the value being
   * cascaded through each hook function, first in the parents if set,
   * in the order in which they were registered.
   *
   * All params after hookName are passed to hook functions, but the
   * first of these should be the value for which a hooked value is
   * returned.
   *
   * Returns a promise which resolves to the hooked value. The hook
   * functions may have side effects on the passed params.
   */
  async getHookedValue(hookName: string, ...params: Array<any>): Promise<*> {
    const parentHookedArgs = this._parent
      ? await this._parent.getHookedValue(hookName, ...params)
      : params[0];

    const hook = this._hooks.get(hookName);

    if (!Array.isArray(hook)) return parentHookedArgs;

    const stateArg = parentHookedArgs;
    const otherArgs = params.slice(1);

    return hook.reduce(
      async (acc, current) => current(await acc, ...otherArgs),
      Promise.resolve(stateArg),
    );
  }

  addHook(hookName: string, hook: Hook) {
    const existingHook = this._hooks.get(hookName);
    if (Array.isArray(existingHook)) {
      existingHook.push(hook);
    } else {
      this._hooks.set(hookName, [hook]);
    }
  }

  addHooks(hooks: SuppliedHooks) {
    const hookNames = Object.keys(hooks);

    hookNames.forEach(hookName => {
      [].concat(hooks[hookName]).forEach(hook => {
        this.addHook(hookName, hook);
      });
    });
  }

  removeHook(hookName: string, index: number) {
    const hook = this._hooks.get(hookName);
    if (hook) hook.splice(index, 1);
  }

  removeHooks(hookName: string) {
    this._hooks.delete(hookName);
  }

  /**
   * Returns a `hooks()` function which proxies `addHooks` and has
   * other HM functions as properties.
   */
  createHooks(): HookManagerFn {
    const fn = (hooks: SuppliedHooks) => {
      this.addHooks(hooks);
    };
    Object.assign(fn, {
      addHook: (...args) => this.addHook(...args),
      addHooks: (...args) => this.addHooks(...args),
      getHookedValue: (...args) => this.getHookedValue(...args),
      getManager: () => this,
      removeHook: (...args) => this.removeHook(...args),
      removeHooks: (...args) => this.removeHooks(...args),
    });
    return fn;
  }
}
