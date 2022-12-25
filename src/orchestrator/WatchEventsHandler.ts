import { ObjectKind, WatchEventsHandler } from '@polaris-sloc/core';
import { ObjectKindQueryOptions } from '@/orchestrator/ObjectKindQueryOptions';

export interface ChangeTrackingWatchEventsHandler extends WatchEventsHandler {
  loadLatestResourceVersion(objectKind: ObjectKind): Promise<void>;
}

export function isChangeTrackingWatchEventsHandler(
  handler: WatchEventsHandler
): handler is ChangeTrackingWatchEventsHandler {
  return 'loadLatestResourceVersion' in handler;
}

export interface WatchEventsHandlerWithQueryOptions extends WatchEventsHandler {
  watchQueryOptions: ObjectKindQueryOptions;
}

export function hasWatchQueryOptions(handler: WatchEventsHandler): handler is WatchEventsHandlerWithQueryOptions {
  return 'watchQueryOptions' in handler;
}
