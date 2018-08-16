/* @flow */

// eslint-disable-next-line import/no-cycle
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

  static fn(args: HookManagerArgs = {}): HookManagerFn {
    const hm = new HookManager(args);
    return hm.fn();
  }

  constructor({ hooks, parent }: HookManagerArgs = {}) {
    this._hooks = {};
    this._parent = parent;

    if (hooks) this.addHooks(hooks);
  }

  async getHookedValue(hookName: string, ...params: Array<any>): Promise<*> {
    const parentHookedArgs = this._parent
      ? await this._parent.getHookedValue(hookName, ...params)
      : params[0];

    if (!Array.isArray(this._hooks[hookName])) return parentHookedArgs;

    const stateArg = parentHookedArgs;
    const otherArgs = params.slice(1);

    return this._hooks[hookName].reduce(
      async (acc, current) => current(await acc, ...otherArgs),
      Promise.resolve(stateArg),
    );
  }

  addHook(hookName: string, hook: Hook) {
    if (Array.isArray(this._hooks[hookName])) {
      this._hooks[hookName].push(hook);
    } else {
      this._hooks[hookName] = [hook];
    }
  }

  addHooks(hooks: SuppliedHooks) {
    const hookNames = Object.keys(hooks);

    hookNames.forEach(hookName => {
      const thisHooks: Array<Hook> = Array.isArray(hooks[hookName])
        ? hooks[hookName]
        : [hooks[hookName]];
      thisHooks.forEach(hook => {
        this.addHook(hookName, hook);
      });
    });
  }

  removeHook(hookName: string, index: number) {
    this._hooks[hookName].splice(index, 1);
  }

  removeHooks(hookName: string) {
    delete this._hooks[hookName];
  }

  fn(): HookManagerFn {
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
