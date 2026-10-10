import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EN, LANG_KEY, deviceLang, getLang, resetLang, setLang, t } from '../src/lib/i18n';
import { LanguageGroup } from '../src/components/me/LanguageGroup';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { FIRST_STEPS_KEY } from '../src/components/basis/FirstStepsCard';
import * as gymStorage from '../src/lib/gymStorage';
import { clearBatchServiceStorage, createDraftBoulder, publishBatch, getSectors, getGradeScales, getWallBoulders } from '../src/lib/batchBoulderService';
import { CurrentUser } from '../src/types/boulder';
import { GROUP_ERROR_TEXT } from '../src/lib/groupService';

const GYM = 'gym-6a-plus';
const lena: CurrentUser = { id: 'spec039-lena', nickname: 'Lena', role: 'member', isPlatformAdmin: false };

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'i18n' ? [] : sourceFiles(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

describe('SPEC-039: Englisch', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLang();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
    clearBatchServiceStorage();
    localStorage.setItem(FIRST_STEPS_KEY, 'true');
  });
  afterEach(() => {
    act(() => setLang('de'));
    localStorage.clear();
    resetLang();
  });

  it('t(): Platzhalter, Rückfall auf Deutsch bei fehlendem Text (AC-4)', () => {
    setLang('en');
    expect(t('von {m} geschafft', { m: 12 })).toBe('of 12 done');
    expect(t('Diesen Satz gibt es nur auf Deutsch')).toBe('Diesen Satz gibt es nur auf Deutsch');
    setLang('de');
    expect(t('von {m} geschafft', { m: 12 })).toBe('von 12 geschafft');
  });

  it('Gerätesprache: de… → Deutsch, sonst Englisch; Tests laufen auf Deutsch (AC-2/AC-5)', () => {
    expect(deviceLang('de-CH')).toBe('de');
    expect(deviceLang('de')).toBe('de');
    expect(deviceLang('en-US')).toBe('en');
    expect(deviceLang('fr-FR')).toBe('en');
    expect(getLang()).toBe('de');
  });

  it('Jeder englische Eintrag hat dieselben Platzhalter und einen deutschen Text im Code', () => {
    const code = sourceFiles(join(__dirname, '../src')).map(f => readFileSync(f, 'utf8')).join('\n') + Object.values(GROUP_ERROR_TEXT).join('\n');
    const missing: string[] = [];
    for (const [de, en] of Object.entries(EN)) {
      expect(en.trim(), de).not.toBe('');
      const ph = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join(',');
      expect(ph(en), de).toBe(ph(de));
      if (!code.includes(de)) missing.push(de);
    }
    expect(missing).toEqual([]);
  });

  it('Umschalten unter Einstellungen wirkt sofort und bleibt gespeichert (AC-3)', () => {
    render(<LanguageGroup />);
    expect(screen.getByText('Sprache / Language')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('settings-lang-en'));
    expect(localStorage.getItem(LANG_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    resetLang();
    expect(getLang()).toBe('en');
  });

  it('Wand auf Englisch: Filter «All · Open · New» (AC-1)', () => {
    act(() => setLang('en'));
    render(<ClimberSectorView currentUser={lena} activeGymId={GYM} />);
    expect(screen.getByTestId('filter-chip-all')).toHaveTextContent('All');
    expect(screen.getByTestId('filter-chip-open')).toHaveTextContent('Open');
    act(() => setLang('de'));
    expect(screen.getByTestId('filter-chip-all')).toHaveTextContent('Alle');
  });

  it('Boulder-Sheet auf Englisch: «Flash · Top · Project» (AC-1)', () => {
    const sector = getSectors(GYM)[0];
    const scale = getGradeScales(GYM)[0];
    const b = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.3, positionY: 0.3, name: 'EN', setterId: 'schrauber-6aplus' });
    publishBatch(sector.id, 'schrauber-6aplus');
    const boulder = getWallBoulders(sector.id).find(x => x.id === b.id)!;
    act(() => setLang('en'));
    render(<BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={lena} onClose={() => {}} />);
    expect(screen.getByTestId('log-flash-btn')).toHaveTextContent('Flash');
    expect(screen.getByTestId('log-top-btn')).toHaveTextContent('Top');
    expect(screen.getByTestId('log-project-btn')).toHaveTextContent('Project');
    expect(screen.getByTestId('log-project-btn')).not.toHaveTextContent('Projekt');
  });
});
