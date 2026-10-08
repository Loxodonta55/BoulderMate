import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearBatchServiceStorage,
  getSectors,
  getSectorById,
  createDraftBoulder,
  getWallBoulders,
  updateBoulderDetails,
  publishBatch,
  isSectorInRebuild,
  isRecentlyNew,
  setRebuildPhoto,
  completeSectorRebuild,
  discardSectorRebuild,
} from '../src/lib/batchBoulderService';
import { saveRating, getRatings } from '../src/lib/ratingAndAscentService';

const NEW_PHOTO = '/images/walls/slab.jpg';

function firstSector() {
  return getSectors('gym-minimum-zh')[0];
}

function addActiveBoulder(sectorId: string, gradeScaleId: string, x = 0.3) {
  const draft = createDraftBoulder({ sectorId, gradeScaleId, positionX: x, positionY: 0.5, setterId: 'setter-1' });
  publishBatch(sectorId, 'setter-1');
  return getWallBoulders(sectorId).find(b => b.id === draft.id)!;
}

describe('SPEC-021: Umschrauben', () => {
  beforeEach(() => {
    clearBatchServiceStorage();
  });

  it('AC-2: Umbau starten setzt Entwurfsfoto, Live-Foto bleibt', () => {
    const sector = firstSector();
    const livePhoto = sector.wallPhotoUrl;
    setRebuildPhoto(sector.id, NEW_PHOTO);
    const updated = getSectorById(sector.id)!;
    expect(isSectorInRebuild(updated)).toBe(true);
    expect(updated.draftPhotoUrl).toBe(NEW_PHOTO);
    expect(updated.wallPhotoUrl).toBe(livePhoto);
  });

  it('AC-6: «Wand fertig» archiviert alte Routen, veröffentlicht Entwürfe und schaltet das Foto live', () => {
    const sector = firstSector();
    const livePhoto = sector.wallPhotoUrl;
    const scaleId = 'scale-green';
    const old = addActiveBoulder(sector.id, scaleId);

    setRebuildPhoto(sector.id, NEW_PHOTO);
    const draft = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scaleId, positionX: 0.6, positionY: 0.4, setterId: 'setter-2' });

    // Während des Umbaus bleibt die alte Route aktiv
    expect(getWallBoulders(sector.id).find(b => b.id === old.id)?.status).toBe('active');

    const result = completeSectorRebuild(sector.id);
    expect(result.publishedBoulderIds).toContain(draft.id);
    expect(result.archivedBoulderIds).toContain(old.id);

    const after = getWallBoulders(sector.id);
    const archived = after.find(b => b.id === old.id)!;
    expect(archived.status).toBe('archived');
    expect(archived.wallPhotoUrl).toBe(livePhoto);
    const published = after.find(b => b.id === draft.id)!;
    expect(published.status).toBe('active');
    expect(isRecentlyNew(published.publishedAt)).toBe(true);

    const s = getSectorById(sector.id)!;
    expect(s.wallPhotoUrl).toBe(NEW_PHOTO);
    expect(isSectorInRebuild(s)).toBe(false);
    expect(isRecentlyNew(s.rebuiltAt)).toBe(true);
  });

  it('AC-7: «Umbau verwerfen» löscht Entwürfe und lässt die Live-Wand unverändert', () => {
    const sector = firstSector();
    const livePhoto = sector.wallPhotoUrl;
    const old = addActiveBoulder(sector.id, 'scale-green');
    setRebuildPhoto(sector.id, NEW_PHOTO);
    const draft = createDraftBoulder({ sectorId: sector.id, gradeScaleId: 'scale-green', positionX: 0.6, positionY: 0.4, setterId: 'setter-1' });

    expect(discardSectorRebuild(sector.id)).toBe(1);
    const after = getWallBoulders(sector.id);
    expect(after.find(b => b.id === draft.id)).toBeUndefined();
    expect(after.find(b => b.id === old.id)?.status).toBe('active');
    const s = getSectorById(sector.id)!;
    expect(s.wallPhotoUrl).toBe(livePhoto);
    expect(isSectorInRebuild(s)).toBe(false);
  });

  it('AC-8: Grad-Änderung setzt nur die Grad-Einschätzungen zurück', () => {
    const sector = firstSector();
    const route = addActiveBoulder(sector.id, 'scale-green');
    saveRating('user-a', 'A', route.id, { gradeFeel: 'stiff', qualityStars: 4 });

    // Gleiche Farbe erneut speichern: nichts zurücksetzen
    updateBoulderDetails(route.id, { gradeScaleId: 'scale-green' });
    expect(getRatings(route.id)[0].gradeFeel).toBe('stiff');

    updateBoulderDetails(route.id, { gradeScaleId: 'scale-blue' });
    const rating = getRatings(route.id)[0];
    expect(rating.gradeFeel).toBeUndefined();
    expect(rating.qualityStars).toBe(4);
  });

  it('AC-11: Einzeln abgeschraubte Routen merken sich das Live-Foto', () => {
    const sector = firstSector();
    const route = addActiveBoulder(sector.id, 'scale-green');
    publishBatch(sector.id, 'setter-1', [route.id]);
    expect(getWallBoulders(sector.id).find(b => b.id === route.id)?.wallPhotoUrl).toBe(sector.wallPhotoUrl);
  });

  it('AC-10: «Neu» gilt 7 Tage', () => {
    expect(isRecentlyNew(new Date().toISOString())).toBe(true);
    expect(isRecentlyNew(new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString())).toBe(false);
    expect(isRecentlyNew(undefined)).toBe(false);
  });
});
