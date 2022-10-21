import { ObjectKind } from '@polaris-sloc/core';

export interface WatchBookmarkManager {
  find(kind: ObjectKind): string;
  update(kind: ObjectKind, bookmark: string);
}
