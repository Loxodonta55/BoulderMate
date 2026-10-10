import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { MeView } from '../src/components/MeView';
import { hideToast } from '../src/components/ui/Toast';
import * as gymStorage from '../src/lib/gymStorage';
import { createDraftBoulder, publishBatch, getSectors, getGradeScales, getWallBoulders } from '../src/lib/batchBoulderService';
import { resetAscentAndRatingStorage, logAscent, addComment, saveRating } from '../src/lib/ratingAndAscentService';
import { setShowInLists, isShownInLists, updateProfile, resetProfileStorage } from '../src/lib/profileService';
import { buildLogbookCsv, CSV_HEADER, formatCsvDate } from '../src/lib/meStats';
import { FIRST_STEPS_KEY } from '../src/components/basis/FirstStepsCard';
import { CurrentUser, LogbookEntry } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

const GYM = 'gym-6a-plus';
const me: CurrentUser = { id: 'spec033-me', nickname: 'Georg', role: 'member', isPlatformAdmin: false };
const other: CurrentUser = { id: 'spec033-other', nickname: 'Katrin', role: 'member', isPlatformAdmin: false };
const roleInfo = { canAccessSetterStudio: false, canAccessAdminConsole: false } as UserRoleInfo;

function seedBoulder() {
  const sector = getSectors(GYM)[0];
  const scale = getGradeScales(GYM)[0];
  const b = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.4, positionY: 0.4, name: 'Sichtbar?', setterId: 'schrauber-6aplus' });
  publishBatch(sector.id, 'schrauber-6aplus');
  return { sector, scale, boulder: getWallBoulders(sector.id).find(x => x.id === b.id)! };
}

describe('SPEC-033: Sichtbarkeit und meine Daten', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileStorage();
    resetAscentAndRatingStorage();
    gymStorage.ensureInitialGymData();
    localStorage.setItem(FIRST_STEPS_KEY, 'true');
    updateProfile(me.id, { nickname: me.nickname });
    updateProfile(other.id, { nickname: other.nickname });
  });
  afterEach(() => act(() => hideToast()));

  it('Schalter ist standardmässig an und speichert im Profil (F1/F4)', () => {
    expect(isShownInLists(me.id)).toBe(true);
    setShowInLists(me.id, false);
    expect(isShownInLists(me.id)).toBe(false);
  });

  it('andere sehen «Jemand» ohne Buchstabe und ohne Profil-Link; Sterne bleiben (AC-2)', () => {
    const { boulder, sector, scale } = seedBoulder();
    logAscent(other.id, other.nickname, boulder.id, 'top');
    saveRating(other.id, other.nickname, boulder.id, { qualityStars: 4 });
    addComment(other.id, other.nickname, boulder.id, 'Heel links');
    setShowInLists(other.id, false);
    render(<BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={me} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('boulder-sheet-more'));
    const row = screen.getByTestId(`community-rating-row-${other.id}`);
    expect(row).toHaveTextContent('Jemand');
    expect(row).not.toHaveTextContent('Katrin');
    expect(row).toHaveTextContent('4');
    expect(row).toBeDisabled();
    fireEvent.click(screen.getByTestId('beta-toggle'));
    expect(screen.getByText('Heel links').parentElement).toHaveTextContent('Jemand');
    expect(screen.queryByText('Katrin')).not.toBeInTheDocument();
  });

  it('die eigene Zeile zeigt den Namen mit «(nur für dich sichtbar)» (AC-3)', () => {
    const { boulder, sector, scale } = seedBoulder();
    logAscent(me.id, me.nickname, boulder.id, 'top');
    setShowInLists(me.id, false);
    render(<BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={me} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('boulder-sheet-more'));
    const row = screen.getByTestId(`community-ascent-row-${me.id}`);
    expect(row).toHaveTextContent('Georg');
    expect(row).toHaveTextContent('(nur für dich sichtbar)');
  });

  it('Einstellungen: Gruppe «Sichtbarkeit» mit Schalter und Vorschau (AC-1/F5)', () => {
    render(<MeView currentUser={me} activeGymId={GYM} roleInfo={roleInfo} onSwitchMode={() => {}} onLogout={() => {}} />);
    fireEvent.click(screen.getByTestId('open-settings-btn'));
    const toggle = screen.getByTestId('settings-show-in-lists');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('visibility-preview-name')).toHaveTextContent('Georg');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('visibility-preview-name')).toHaveTextContent('Jemand');
    expect(isShownInLists(me.id)).toBe(false);
    expect(screen.getByTestId('settings-export-csv')).toHaveTextContent('Als Tabelle (CSV)');
  });

  it('CSV: BOM, Semikolon, Kopfzeile, älteste Zeile zuerst, Versuche (AC-5)', () => {
    const base = {
      gymId: 'g', gymName: '6a Plus', sectorId: 's', sectorName: 'Überhang; Nord', boulderName: 'Gelb "eins"',
      gradeScale: { id: 'x', gymId: 'g', colorName: 'Gelb', colorHex: '#ff0', difficultyLabel: '', sortOrder: 1 },
      fontGrade: '5c', ascentId: 'a',
    };
    const entries: LogbookEntry[] = [
      { ...base, id: '2', boulderId: 'b2', type: 'top', createdAt: '2026-10-08T18:30:00' },
      { ...base, id: '1', boulderId: 'b1', type: 'flash', createdAt: '2026-10-01T09:05:00' },
    ] as LogbookEntry[];
    const csv = buildLogbookCsv(entries, e => ({ number: e.boulderId === 'b2' ? 7 : 3, attempts: e.boulderId === 'b2' ? 5 : undefined }));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).trim().split('\r\n');
    expect(lines[0]).toBe(CSV_HEADER.join(';'));
    expect(lines[1]).toBe('2026-10-01 09:05;6a Plus;"Überhang; Nord";3;"Gelb ""eins""";Gelb;5c;Flash;1');
    expect(lines[2]).toBe('2026-10-08 18:30;6a Plus;"Überhang; Nord";7;"Gelb ""eins""";Gelb;5c;Top;5');
    expect(formatCsvDate('kaputt')).toBe('');
  });

  it('Datenschutzerklärung nennt Sichtbarkeit, Treff-Löschung und Speicherort (AC-6)', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../public/datenschutz.html'), 'utf8');
    expect(html).toContain('Wer war schon oben');
    expect(html).toMatch(/Treff[\s\S]*24 Stunden/);
    expect(html).toContain('Speicherort');
  });
});
