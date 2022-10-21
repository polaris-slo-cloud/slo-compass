import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';
import { ObjectKind } from '@polaris-sloc/core';
import { useWorkspaceStore } from '@/store/workspace';

export class WorkspaceWatchBookmarkManager implements WatchBookmarkManager {
  find(kind: ObjectKind): string {
    const store = useWorkspaceStore();
    return store.watchBookmarks[ObjectKind.stringify(kind)];
  }

  update(kind: ObjectKind, bookmark: string) {
    const store = useWorkspaceStore();
    store.updateWatchBookmark(ObjectKind.stringify(kind), bookmark);
  }
}
