/* @flow */

import type {
  Event as EventLog,
  EventSignature,
  IAdapter,
} from '../../interface/Adapter';
import type { EventSpec } from '../../interface/ContractSpec';

// TODO later use the spec as a generic and make this more type-safe
type TypedEvent = {
  signature: EventSignature,
  event: EventLog,
  data: Object,
};

type TypedEvents = {
  [eventName: string]: TypedEvent,
};

export type { EventLog, EventSpec, IAdapter, TypedEvent, TypedEvents };
