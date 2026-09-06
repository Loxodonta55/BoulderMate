import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearBatchServiceStorage,
  checkSetterPermission,
  getSectors,
  updateSectorPhoto,
  getLastSelectedGradeScaleId,
  setLastSelectedGradeScaleId,
  createDraftBoulder,
  getWallBoulders,
  updateBoulderPosition,
  deleteDraftBoulder,
  publishBatch,
} from '../src/lib/batchBoulderService';

describe('SPEC-002: Batch-Foto-Boulder-Erfassung (Service & Logic)', () => {
  beforeEach(() => {
    clearBatchServiceStorage();
  });

  // ------------------------------------------------------------------------
  // AC-1: Workflow nur für Nutzer mit Rolle setter oder admin zugänglich
  // ------------------------------------------------------------------------
  describe('AC-1: Zugriffsbeschränkung', () => {
    it('erlaubt Zugriff für Rolle "setter"', () => {
      expect(() => checkSetterPermission('setter')).not.toThrow();
    });

    it('erlaubt Zugriff für Rolle "admin"', () => {
      expect(() => checkSetterPermission('admin')).not.toThrow();
    });

    it('verweigert Zugriff für Rolle "member" mit erklärendem Fehler', () => {
      expect(() => checkSetterPermission('member')).toThrow(/Zugriff verweigert/);
    });

    it('verhindert das Erstellen von Draft-Bouldern für "member"', () => {
      expect(() =>
        createDraftBoulder(
          {
            sectorId: 'sector-overhang',
            gradeScaleId: 'scale-green',
            positionX: 0.5,
            positionY: 0.5,
            setterId: 'user-member-1',
          },
          'member'
        )
      ).toThrow(/Zugriff verweigert/);
    });
  });

  // ------------------------------------------------------------------------
  // AC-2: Sektor-Foto aktualisieren & relative Koordinaten erhalten
  // ------------------------------------------------------------------------
  describe('AC-2: Wandfoto-Aktualisierung', () => {
    it('aktualisiert das Wandfoto eines Sektors', () => {
      const initialSectors = getSectors('gym-minimum-zh');
      const targetSector = initialSectors[0];

      const newUrl = 'https://images.unsplash.com/new-overhang-photo.jpg';
      const updated = updateSectorPhoto(targetSector.id, newUrl);

      expect(updated.wallPhotoUrl).toBe(newUrl);

      const reloadedSectors = getSectors('gym-minimum-zh');
      expect(reloadedSectors.find(s => s.id === targetSector.id)?.wallPhotoUrl).toBe(newUrl);
    });

    it('behält relative Koordinaten bestehender Boulder bei Foto-Aktualisierung unverändert bei', () => {
      const bouldersBefore = getWallBoulders('sector-overhang');
      expect(bouldersBefore.length).toBeGreaterThan(0);
      const coordsBefore = bouldersBefore.map(b => ({ id: b.id, x: b.positionX, y: b.positionY }));

      updateSectorPhoto('sector-overhang', 'https://example.com/fresh-wall-photo.jpg');

      const bouldersAfter = getWallBoulders('sector-overhang');
      coordsBefore.forEach(orig => {
        const found = bouldersAfter.find(b => b.id === orig.id);
        expect(found?.positionX).toBe(orig.x);
        expect(found?.positionY).toBe(orig.y);
      });
    });

    it('wirft einen Fehler bei ungültiger Bild-URL', () => {
      expect(() => updateSectorPhoto('sector-overhang', '')).toThrow(/gültige Bild-URL/);
    });
  });

  // ------------------------------------------------------------------------
  // AC-3: Relativer Klick erzeugt Pin mit 0.0 <= x, y <= 1.0
  // ------------------------------------------------------------------------
  describe('AC-3: Relative Koordinaten beim Pin-Setzen', () => {
    it('speichert relative Koordinaten im gültigen Bereich', () => {
      const draft = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-blue',
          positionX: 0.4523,
          positionY: 0.8124,
          setterId: 'setter-1',
        },
        'setter'
      );

      expect(draft.positionX).toBe(0.4523);
      expect(draft.positionY).toBe(0.8124);
      expect(draft.positionX).toBeGreaterThanOrEqual(0.0);
      expect(draft.positionX).toBeLessThanOrEqual(1.0);
    });

    it('wirft Fehler bei Koordinaten außerhalb von 0.0 bis 1.0', () => {
      expect(() =>
        createDraftBoulder(
          {
            sectorId: 'sector-overhang',
            gradeScaleId: 'scale-blue',
            positionX: 1.25,
            positionY: 0.5,
            setterId: 'setter-1',
          },
          'setter'
        )
      ).toThrow(/Ungültige relative Koordinaten/);

      expect(() =>
        createDraftBoulder(
          {
            sectorId: 'sector-overhang',
            gradeScaleId: 'scale-blue',
            positionX: 0.5,
            positionY: -0.1,
            setterId: 'setter-1',
          },
          'setter'
        )
      ).toThrow(/Ungültige relative Koordinaten/);
    });
  });

  // ------------------------------------------------------------------------
  // AC-4: Nur Hallenfarbe ist Pflichtfeld; Radar hat Default 3/5
  // ------------------------------------------------------------------------
  describe('AC-4: Pflichtfeldprüfung & Smart Defaults', () => {
    it('verlangt die Hallenfarbe (gradeScaleId) als Pflichtfeld', () => {
      expect(() =>
        createDraftBoulder(
          {
            sectorId: 'sector-overhang',
            gradeScaleId: '',
            positionX: 0.5,
            positionY: 0.5,
            setterId: 'setter-1',
          },
          'setter'
        )
      ).toThrow(/Farbauswahl.*ist erforderlich/);
    });

    it('belegt Radar-Werte automatisch mit Smart-Default 3/3/3/3/3 wenn nicht angegeben', () => {
      const draft = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-yellow',
          positionX: 0.5,
          positionY: 0.5,
          setterId: 'setter-1',
        },
        'setter'
      );

      expect(draft.radar).toEqual({
        kraft: 3,
        technik: 3,
        balance: 3,
        koordination: 3,
        flexibilitaet: 3,
      });
      expect(draft.name).toBeUndefined();
      expect(draft.notes).toBeUndefined();
    });

    it('übernimmt individuelle Radar-Werte, wenn vom Schrauber angegeben', () => {
      const draft = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-red',
          positionX: 0.2,
          positionY: 0.3,
          setterId: 'setter-1',
          radar: { kraft: 5, technik: 4, balance: 2, koordination: 5, flexibilitaet: 1 },
          name: 'Dyno Monster',
        },
        'setter'
      );

      expect(draft.name).toBe('Dyno Monster');
      expect(draft.radar.kraft).toBe(5);
      expect(draft.radar.technik).toBe(4);
      expect(draft.radar.flexibilitaet).toBe(1);
    });
  });

  // ------------------------------------------------------------------------
  // AC-5: Zuletzt gewählte Farbe wird gemerkt & vorausgewählt
  // ------------------------------------------------------------------------
  describe('AC-5: Farbauswahl-Gedächtnis', () => {
    it('speichert die zuletzt gewählte Farbe nach Boulder-Erstellung', () => {
      createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-red',
          positionX: 0.1,
          positionY: 0.1,
          setterId: 'setter-1',
        },
        'setter'
      );

      expect(getLastSelectedGradeScaleId('gym-minimum-zh')).toBe('scale-red');
    });

    it('aktualisiert die gemerkte Farbe bei neuer Auswahl', () => {
      setLastSelectedGradeScaleId('gym-minimum-zh', 'scale-black');
      expect(getLastSelectedGradeScaleId('gym-minimum-zh')).toBe('scale-black');
    });
  });

  // ------------------------------------------------------------------------
  // AC-6: Bestehende Boulder als semitransparent & Archivierung
  // ------------------------------------------------------------------------
  describe('AC-6: Bestehende Boulder & Archivierung', () => {
    it('lädt aktive bestehende Boulder des Sektors', () => {
      const existing = getWallBoulders('sector-overhang').filter(b => b.status === 'active');
      expect(existing.length).toBeGreaterThanOrEqual(2);
      expect(existing[0].status).toBe('active');
    });
  });

  // ------------------------------------------------------------------------
  // AC-7: Long-Press / Drag verschiebt Pin-Position
  // ------------------------------------------------------------------------
  describe('AC-7: Verschieben von Pins', () => {
    it('erlaubt das Ändern der relativen Koordinaten eines Pins', () => {
      const draft = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-blue',
          positionX: 0.2,
          positionY: 0.2,
          setterId: 'setter-1',
        },
        'setter'
      );

      const moved = updateBoulderPosition(draft.id, 0.45, 0.75);
      expect(moved.positionX).toBe(0.45);
      expect(moved.positionY).toBe(0.75);

      const all = getWallBoulders('sector-overhang');
      const found = all.find(b => b.id === draft.id);
      expect(found?.positionX).toBe(0.45);
      expect(found?.positionY).toBe(0.75);
    });
  });

  // ------------------------------------------------------------------------
  // AC-8: Neue Boulder verbleiben im Status draft bis Veröffentlichung
  // ------------------------------------------------------------------------
  describe('AC-8: Status-Lifecycle (Draft)', () => {
    it('erstellt neue Boulder stets mit Status "draft"', () => {
      const draft = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-green',
          positionX: 0.3,
          positionY: 0.3,
          setterId: 'setter-1',
        },
        'setter'
      );

      expect(draft.status).toBe('draft');
      expect(draft.publishedAt).toBeUndefined();
    });

    it('erlaubt das Löschen eines Drafts vor der Veröffentlichung', () => {
      const draft = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-green',
          positionX: 0.3,
          positionY: 0.3,
          setterId: 'setter-1',
        },
        'setter'
      );

      deleteDraftBoulder(draft.id);

      const all = getWallBoulders('sector-overhang');
      expect(all.find(b => b.id === draft.id)).toBeUndefined();
    });
  });

  // ------------------------------------------------------------------------
  // AC-9: Transaktionale Batch-Veröffentlichung
  // ------------------------------------------------------------------------
  describe('AC-9: Transaktionales Batch-Publishing', () => {
    it('setzt alle Drafts auf "active" und markierte Boulder auf "archived"', () => {
      // 1. Create two drafts
      const draft1 = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-green',
          positionX: 0.2,
          positionY: 0.2,
          setterId: 'setter-1',
        },
        'setter'
      );

      const draft2 = createDraftBoulder(
        {
          sectorId: 'sector-overhang',
          gradeScaleId: 'scale-yellow',
          positionX: 0.6,
          positionY: 0.6,
          setterId: 'setter-1',
        },
        'setter'
      );

      // Existing boulder to archive
      const existingToArchive = 'boulder-existing-1';

      // 2. Publish batch
      const result = publishBatch('sector-overhang', 'setter-1', [existingToArchive]);

      expect(result.publishedCount).toBe(2);
      expect(result.archivedCount).toBe(1);
      expect(result.publishedBoulderIds).toContain(draft1.id);
      expect(result.publishedBoulderIds).toContain(draft2.id);
      expect(result.archivedBoulderIds).toContain(existingToArchive);

      // 3. Verify in storage
      const all = getWallBoulders('sector-overhang');

      const p1 = all.find(b => b.id === draft1.id);
      expect(p1?.status).toBe('active');
      expect(p1?.publishedAt).toBeDefined();

      const p2 = all.find(b => b.id === draft2.id);
      expect(p2?.status).toBe('active');
      expect(p2?.publishedAt).toBeDefined();

      const arch = all.find(b => b.id === existingToArchive);
      expect(arch?.status).toBe('archived');
      expect(arch?.archivedAt).toBeDefined();
    });
  });
});
