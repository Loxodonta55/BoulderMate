import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import * as gymStorage from '../src/lib/gymStorage';
import { resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
import { resetProfileStorage } from '../src/lib/profileService';
import { clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { buildLogbookCsv } from '../src/lib/meStats';
import {
  parseOwnCsv,
  importTicks,
  getImportedTicks,
  deleteImportedTicks,
  importedAsLogbook,
  mergePyramid,
  splitCsvLine,
  parseCsvDate,
  importResultText,
} from '../src/lib/importService';
import { MeView } from '../src/components/MeView';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { FIRST_STEPS_KEY } from '../src/components/basis/FirstStepsCard';
import { CurrentUser, LogbookEntry } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

const ME = 'spec043-me';
const CSV = [
  '﻿Datum;Halle;Sektor;Nummer;Boulder;Farbe;Grad;Stil;Versuche',
  '2026-09-20 18:00;Boulderwelt Ost;Halle 2;;Gelb;Gelb;6a;Top;3',
  '2026-09-20 18:30;Boulderwelt Ost;Halle 2;;Rot;Rot;6b+;Flash;1',
  '2026-09-20 19:00;Boulderwelt Ost;"Dach; links";;Blau;Blau;6c;Projekt;',
  '2026-09-20 19:30;Boulderwelt Ost;Halle 2;;Gelb2;Gelb;6a;Top;',
  'kaputt;;;;;;;;',
].join('\r\n');

describe('SPEC-043: Ticks importieren (eigene CSV)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileStorage();
    resetAscentAndRatingStorage();
    clearBatchServiceStorage();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
    localStorage.setItem(FIRST_STEPS_KEY, 'true');
  });
  afterEach(() => act(() => hideToast()));

  it('liest die eigene CSV mit BOM, Anführungszeichen und Datum (F2)', () => {
    expect(splitCsvLine('a;"b;c";"d ""x"""')).toEqual(['a', 'b;c', 'd "x"']);
    expect(new Date(parseCsvDate('2026-09-20 18:00')!).getHours()).toBe(18);
    expect(new Date(parseCsvDate('20.09.2026')!).getDate()).toBe(20);
    const { rows, invalid, headerOk } = parseOwnCsv(CSV);
    expect(headerOk).toBe(true);
    expect(rows).toHaveLength(4);
    expect(invalid).toBe(1);
    expect(rows[2].sectorName).toBe('Dach; links');
  });

  it('importiert Tops/Flashes, überspringt Doppelte und meldet sie (AC-1/AC-2)', () => {
    const r = importTicks(ME, CSV);
    expect(r).toMatchObject({ added: 2, skipped: 1, invalid: 1, ignoredProjects: 1 });
    expect(importResultText(r)).toBe('2 Ticks importiert, 1 übersprungen (schon vorhanden), 1 Zeilen unlesbar, 1 Projekte nicht übernommen.');
    expect(importTicks(ME, CSV)).toMatchObject({ added: 0, skipped: 3 });
    expect(getImportedTicks(ME)).toHaveLength(2);
    expect(importTicks(ME, 'foo;bar\n1;2').headerOk).toBe(false);
  });

  it('eigene BoulderMate-Ticks werden beim Rückimport nicht doppelt gezählt', () => {
    const own = [
      {
        id: '1', ascentId: 'a', boulderId: 'b', type: 'top', createdAt: new Date(2026, 9, 1, 18).toISOString(),
        gymId: 'g', gymName: '6a Plus', sectorId: 's', sectorName: 'S', fontGrade: '6a',
        gradeScale: { id: 'x', gymId: 'g', colorName: 'Gelb', colorHex: '#ff0', difficultyLabel: '', fontRangeMin: '', fontRangeMax: '', sortOrder: 1 },
      },
    ] as LogbookEntry[];
    expect(importTicks(ME, buildLogbookCsv(own), own)).toMatchObject({ added: 0, skipped: 1 });
  });

  it('erscheinen nur in der Statistik mit «(importiert)»; Pyramide ergänzt (F1)', () => {
    importTicks(ME, CSV);
    const log = importedAsLogbook(getImportedTicks(ME));
    expect(log.every(e => e.gymName === 'Boulderwelt Ost (importiert)' && e.boulderId === '')).toBe(true);
    const merged = mergePyramid([], getImportedTicks(ME));
    expect(merged.map(p => [p.fontGrade, p.totalCount, p.flashCount])).toEqual([
      ['6b+', 1, 1],
      ['6a', 1, 0],
    ]);
  });

  it('«Ich» zeigt importierte Ticks nur bei «Alle Hallen»; Löschen entfernt alle (AC-1/AC-3)', async () => {
    importTicks(ME, CSV);
    const me: CurrentUser = { id: ME, nickname: 'Ingrid', role: 'member', isPlatformAdmin: false };
    const roleInfo = { canAccessSetterStudio: false, canAccessAdminConsole: false } as UserRoleInfo;
    render(
      <>
        <ToastHost />
        <MeView currentUser={me} activeGymId="gym-6a-plus" roleInfo={roleInfo} onSwitchMode={() => {}} onLogout={() => {}} />
      </>
    );
    expect(screen.getByTestId('pyramid-imported-note')).toHaveTextContent('inkl. 2 importierte Ticks');
    expect(screen.getByTestId('pyramid-count-6b+')).toHaveTextContent('1');
    fireEvent.click(screen.getByTestId('open-settings-btn'));
    fireEvent.click(screen.getByTestId('settings-import-delete'));
    fireEvent.click(screen.getByText('Löschen'));
    await waitFor(() => expect(getImportedTicks(ME)).toHaveLength(0));
    expect(deleteImportedTicks(ME)).toBe(0);
  });
});
