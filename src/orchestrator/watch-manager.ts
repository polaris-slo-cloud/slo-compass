import { CONNECTED_EVENT, useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import {
  ObjectKind,
  ObjectKindsAlreadyWatchedError,
  ObjectKindWatcher,
  ObjectKindWatchHandlerPair,
  WatchEventsHandler,
  WatchManager,
} from '@polaris-sloc/core';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';
import { IUnsubscribe } from '@/crosscutting/subscibable';

const orchestratorApi = useOrchestratorApi();

export class OrchestratorWatchManager implements WatchManager {
  private watchers: Map<string, ObjectKindWatcher> = new Map();
  private unsubscribeOrchestrator: IUnsubscribe;

  constructor(private bookmarkManager: WatchBookmarkManager) {}

  get activeWatchers(): ObjectKindWatcher[] {
    return Array.from(this.watchers.values());
  }

  public async configureWatchers(kinds: ObjectKind[], handler: WatchEventsHandler): Promise<void> {
    if (await orchestratorApi.test()) {
      await this.startWatchers(kinds, handler);
    }
    this.unsubscribeOrchestrator = orchestratorApi
      .on(CONNECTED_EVENT, async () => {
        this.stopWatchersInternal([...this.watchers.keys()]);
        await this.startWatchers(kinds, handler);
      })
      .bind(this);
  }

  startWatchers(kinds: ObjectKind[], handler: WatchEventsHandler): Promise<ObjectKindWatcher[]>;
  startWatchers(kindHandlerPairs: ObjectKindWatchHandlerPair[]): Promise<ObjectKindWatcher[]>;
  startWatchers(
    kindOrPairs: ObjectKind[] | ObjectKindWatchHandlerPair[],
    handler?: WatchEventsHandler
  ): Promise<ObjectKindWatcher[]> {
    let kindHandlerPairs: ObjectKindWatchHandlerPair[];
    if (handler) {
      kindHandlerPairs = (kindOrPairs as ObjectKind[]).map((kind) => ({ kind, handler }));
    } else {
      kindHandlerPairs = kindOrPairs as ObjectKindWatchHandlerPair[];
    }
    return this.startWatchersInternal(kindHandlerPairs);
  }

  stopWatchers(kinds: ObjectKind[]): void {
    this.stopWatchersInternal(kinds.map(ObjectKind.stringify));
    if (this.unsubscribeOrchestrator) {
      this.unsubscribeOrchestrator();
      this.unsubscribeOrchestrator = null;
    }
  }

  private stopWatchersInternal(kinds: string[]): void {
    kinds.forEach((kind) => {
      const watcher = this.watchers.get(kind);
      if (watcher) {
        watcher.stopWatch();
        this.watchers.delete(kind);
      }
    });
  }

  private async startWatchersInternal(
    kindHandlerPairs: ObjectKindWatchHandlerPair[]
  ): Promise<ObjectKindWatcher[]> {
    this.assertNoExistingWatchers(kindHandlerPairs);

    const watchers = kindHandlerPairs.map(async (pair) => {
      const watcher = orchestratorApi.createWatcher(this.bookmarkManager);
      await watcher.startWatch(pair.kind, pair.handler);
      this.watchers.set(ObjectKind.stringify(pair.kind), watcher);
      return watcher;
    });

    return Promise.all(watchers);
  }

  private assertNoExistingWatchers(kindsAndHandlers: ObjectKindWatchHandlerPair[]): void {
    const watchedKinds = kindsAndHandlers.filter((pair) =>
      this.watchers.has(ObjectKind.stringify(pair.kind))
    );
    if (watchedKinds.length > 0) {
      const kinds = watchedKinds.map((pair) => pair.kind);
      throw new ObjectKindsAlreadyWatchedError(this, kinds);
    }
  }
}
