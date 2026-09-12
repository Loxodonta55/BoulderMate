/**
 * syncBridge.ts
 * 
 * SOLID: Dependency Inversion Principle (DIP).
 * Decouples storage services (gymStorage, batchBoulderService, ratingAndAscentService)
 * from the concrete cloud sync implementation (syncService), eliminating circular
 * dependencies and removing dynamic import() calls.
 */

export interface SyncHandlers {
  syncSector?: (sector: any) => Promise<boolean>;
  syncSectorOrder?: (gymId: string, orderedSectorIds: string[]) => Promise<boolean>;
  syncGradeScales?: (gymId: string, scales: any[]) => Promise<boolean>;
  syncBoulders?: (boulders: any[]) => Promise<boolean>;
  deleteBoulder?: (boulderId: string) => Promise<boolean>;
  syncAscent?: (ascent: any) => Promise<boolean>;
  deleteAscent?: (userId: string, boulderId: string) => Promise<boolean>;
  syncRating?: (rating: any) => Promise<boolean>;
  deleteRating?: (userId: string, boulderId: string) => Promise<boolean>;
  syncRatingsAndAscentsQuietly?: () => Promise<boolean>;
}

const handlers: SyncHandlers = {};

export function registerSyncHandlers(newHandlers: Partial<SyncHandlers>): void {
  Object.assign(handlers, newHandlers);
}

export const syncBridge = {
  syncSector(sector: any): Promise<boolean> {
    return handlers.syncSector ? handlers.syncSector(sector).catch(() => false) : Promise.resolve(false);
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
    return handlers.syncAscent ? handlers.syncAscent(ascent).catch(() => false) : Promise.resolve(false);
  },
  deleteAscent(userId: string, boulderId: string): Promise<boolean> {
    return handlers.deleteAscent ? handlers.deleteAscent(userId, boulderId).catch(() => false) : Promise.resolve(false);
  },
  syncRating(rating: any): Promise<boolean> {
    return handlers.syncRating ? handlers.syncRating(rating).catch(() => false) : Promise.resolve(false);
  },
  deleteRating(userId: string, boulderId: string): Promise<boolean> {
    return handlers.deleteRating ? handlers.deleteRating(userId, boulderId).catch(() => false) : Promise.resolve(false);
  },
  syncRatingsAndAscentsQuietly(): Promise<boolean> {
    return handlers.syncRatingsAndAscentsQuietly ? handlers.syncRatingsAndAscentsQuietly().catch(() => false) : Promise.resolve(false);
  },
};
