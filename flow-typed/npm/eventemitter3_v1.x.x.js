// flow-typed signature: a4f283e3e83562144ed9127878573ca5
// flow-typed version: da30fe6876/eventemitter3_v1.x.x/flow_>=v0.25.x

declare module "eventemitter3" {
  declare class EventsEmitter {
    static defaultMaxListeners: number;
    static constructor(): EventsEmitter;
    _events: Object;
    getMaxListeners(): number;
    setMaxListeners(n: number): EventsEmitter;
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
  declare module.exports: Class<EventsEmitter>;
}
