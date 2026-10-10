/**
 * syncBridge.ts
 * 
 * SOLID: Dependency Inversion Principle (DIP).
 * Decouples storage services (gymStorage, batchBoulderService, ratingAndAscentService)
 * from the concrete cloud sync implementation (syncService), eliminating circular
 * dependencies and removing dynamic import() calls.
 */

import {
  PendingSyncItem,
  enqueuePendingSync,
  clearPendingSync,
  flushPendingSync,
  getPendingSyncCount,
  isDeviceOnline,
} from './pendingSync';

export interface SyncHandlers {
  syncSector?: (sector: any) => Promise<boolean>;
  deleteSector?: (sectorId: string) => Promise<boolean>;
  syncSectorOrder?: (gymId: string, orderedSectorIds: string[]) => Promise<boolean>;
  syncGradeScales?: (gymId: string, scales: any[]) => Promise<boolean>;
  syncBoulders?: (boulders: any[]) => Promise<boolean>;
  deleteBoulder?: (boulderId: string) => Promise<boolean>;
  syncAscent?: (ascent: any) => Promise<boolean>;
  deleteAscent?: (userId: string, boulderId: string) => Promise<boolean>;
  syncRating?: (rating: any) => Promise<boolean>;
  deleteRating?: (userId: string, boulderId: string) => Promise<boolean>;
  syncRatingsAndAscentsQuietly?: () => Promise<boolean>;
  syncClimberRoute?: (route: any) => Promise<boolean>;
  deleteClimberRoute?: (routeId: string) => Promise<boolean>;
  syncGymLocation?: (gym: { id: string; name: string; lat?: number; lng?: number }) => Promise<boolean>;
}

const handlers: SyncHandlers = {};

/**
 * SPEC-032 F3: Begehungen und Bewertungen, die nicht gesendet werden konnten,
 * kommen in die Warteschlange und werden später erneut gesendet.
 */
function sendPending(item: PendingSyncItem): Promise<boolean> {
  if (item.kind === 'ascent') {
    if (item.op === 'delete') return handlers.deleteAscent ? handlers.deleteAscent(item.userId, item.boulderId) : Promise.resolve(false);
    return handlers.syncAscent ? handlers.syncAscent(item.payload) : Promise.resolve(false);
  }
  if (item.op === 'delete') return handlers.deleteRating ? handlers.deleteRating(item.userId, item.boulderId) : Promise.resolve(false);
  return handlers.syncRating ? handlers.syncRating(item.payload) : Promise.resolve(false);
}

export function flushPendingSyncNow(): Promise<number> {
  return flushPendingSync(sendPending);
}

let pendingWatcherInstalled = false;
function installPendingWatcher(): void {
  if (pendingWatcherInstalled || typeof window === 'undefined') return;
  pendingWatcherInstalled = true;
  window.addEventListener('online', () => {
    void flushPendingSyncNow();
  });
  window.setTimeout(() => {
    void flushPendingSyncNow();
  }, 1500);
}

/** Sendet einmal; bei Fehlschlag in die Warteschlange, bei Erfolg Wartendes nachschieben. */
function sendOrQueue(
  run: (() => Promise<boolean>) | undefined,
  item: Omit<PendingSyncItem, 'queuedAt' | 'tries'>
): Promise<boolean> {
  if (!run) return Promise.resolve(false);
  if (!isDeviceOnline()) {
    enqueuePendingSync(item);
    return Promise.resolve(false);
  }
  return run()
    .catch(() => false)
    .then(ok => {
      if (ok) {
        clearPendingSync(item.kind, item.userId, item.boulderId);
        if (getPendingSyncCount() > 0) void flushPendingSyncNow();
      } else {
        enqueuePendingSync(item);
      }
      return ok;
    });
}

export function registerSyncHandlers(newHandlers: Partial<SyncHandlers>): void {
  Object.assign(handlers, newHandlers);
  installPendingWatcher();
}

export const syncBridge = {
  syncSector(sector: any): Promise<boolean> {
    return handlers.syncSector ? handlers.syncSector(sector).catch(() => false) : Promise.resolve(false);
  },
  deleteSector(sectorId: string): Promise<boolean> {
    return handlers.deleteSector ? handlers.deleteSector(sectorId).catch(() => false) : Promise.resolve(false);
  },
  syncSectorOrder(gymId: string, orderedSectorIds: string[]): Promise<boolean> {
    return handlers.syncSectorOrder ? handlers.syncSectorOrder(gymId, orderedSectorIds).catch(() => false) : Promise.resolve(false);
  },
  syncGradeScales(gymId: string, scales: any[]): Promise<boolean> {
    return handlers.syncGradeScales ? handlers.syncGradeScales(gymId, scales).catch(() => false) : Promise.resolve(false);
  },
  syncBoulders(boulders: any[]): Promise<boolean> {
    return handlers.syncBoulders ? handlers.syncBoulders(boulders).catch(() => false) : Promise.resolve(false);
  },
  deleteBoulder(boulderId: string): Promise<boolean> {
    return handlers.deleteBoulder ? handlers.deleteBoulder(boulderId).catch(() => false) : Promise.resolve(false);
  },
  syncAscent(ascent: any): Promise<boolean> {
    return sendOrQueue(handlers.syncAscent && (() => handlers.syncAscent!(ascent)), {
      kind: 'ascent', op: 'upsert', userId: ascent?.userId, boulderId: ascent?.boulderId, payload: ascent,
    });
  },
  deleteAscent(userId: string, boulderId: string): Promise<boolean> {
    return sendOrQueue(handlers.deleteAscent && (() => handlers.deleteAscent!(userId, boulderId)), {
      kind: 'ascent', op: 'delete', userId, boulderId,
    });
  },
  syncRating(rating: any): Promise<boolean> {
    return sendOrQueue(handlers.syncRating && (() => handlers.syncRating!(rating)), {
      kind: 'rating', op: 'upsert', userId: rating?.userId, boulderId: rating?.boulderId, payload: rating,
    });
  },
  deleteRating(userId: string, boulderId: string): Promise<boolean> {
    return sendOrQueue(handlers.deleteRating && (() => handlers.deleteRating!(userId, boulderId)), {
      kind: 'rating', op: 'delete', userId, boulderId,
    });
  },
  syncRatingsAndAscentsQuietly(): Promise<boolean> {
    return handlers.syncRatingsAndAscentsQuietly ? handlers.syncRatingsAndAscentsQuietly().catch(() => false) : Promise.resolve(false);
  },
  syncClimberRoute(route: any): Promise<boolean> {
    return handlers.syncClimberRoute ? handlers.syncClimberRoute(route).catch(() => false) : Promise.resolve(false);
  },
  deleteClimberRoute(routeId: string): Promise<boolean> {
    return handlers.deleteClimberRoute ? handlers.deleteClimberRoute(routeId).catch(() => false) : Promise.resolve(false);
  },
  syncGymLocation(gym: { id: string; name: string; lat?: number; lng?: number }): Promise<boolean> {
    return handlers.syncGymLocation ? handlers.syncGymLocation(gym).catch(() => false) : Promise.resolve(false);
  },
};
