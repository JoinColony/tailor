/* @flow */

import type HookManager from './index';

export type Hook = (...params: any) => any;

export type Hooks = Map<string, Array<Hook>>;

export type SuppliedHooks = {
  [hookName: string]: Hook | Array<Hook>,
};

export type HookManagerFn = {
  (hook: SuppliedHooks): void,
  addHook: (hookName: string, hook: Hook) => void,
  addHooks: (hooks: SuppliedHooks) => void,
  getHookedValue(hookName: string, ...args: any): Promise<any>,
  getManager: () => HookManager,
  removeHook: (hookName: string, index: number) => void,
  removeHooks: (hookName: string) => void,
};

export type HookManagerArgs = { hooks?: SuppliedHooks, parent?: HookManager };
