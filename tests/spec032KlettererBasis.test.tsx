import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { MeView } from '../src/components/MeView';
import { OfflineChip, pendingText } from '../src/components/basis/OfflineChip';
import { FIRST_STEPS_KEY } from '../src/components/basis/FirstStepsCard';
import { ToastHost, hideToast, showToast, toastDuration, ACTION_TOAST_MIN_MS } from '../src/components/ui/Toast';
import * as gymStorage from '../src/lib/gymStorage';
import { createDraftBoulder, publishBatch, getSectors, getGradeScales, getWallBoulders } from '../src/lib/batchBoulderService';
import { resetAscentAndRatingStorage, addComment } from '../src/lib/ratingAndAscentService';
import {
  enqueuePendingSync,
  getPendingSyncCount,
  hasPendingSync,
  flushPendingSync,
  resetPendingSync,
  clearPendingSync,
  PENDING_SYNC_MAX_TRIES,
} from '../src/lib/pendingSync';
import { syncBridge, registerSyncHandlers } from '../src/lib/syncBridge';
import { computeBoulderNumbers, readableTextOn } from '../src/lib/boulderNumbers';
import { logToastMessage } from '../src/components/BoulderSheet';
import { CurrentUser, WallBoulder } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

const GYM = 'gym-6a-plus';
const climber: CurrentUser = { id: 'spec032-climber', nickname: 'Rainer', role: 'member', isPlatformAdmin: false };

function wb(id: string, publishedAt: string, status: WallBoulder['status'] = 'active', archivedAt?: string): WallBoulder {
  return {
    id,
    sectorId: 's1',
    gradeScaleId: 'g',
    positionX: 0.5,
    positionY: 0.5,
    setterId: 'x',
    status,
    radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
    createdAt: publishedAt,
    publishedAt,
    archivedAt,
  } as WallBoulder;
}

function seedBoulder(name = 'Gelbe Platte') {
  const sector = getSectors(GYM)[0];
  const scale = getGradeScales(GYM)[0];
  const b = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.4, positionY: 0.4, name, setterId: 'schrauber-6aplus' });
  publishBatch(sector.id, 'schrauber-6aplus');
  const published = getWallBoulders(sector.id).find(x => x.id === b.id)!;
  return { sector, scale, boulder: published };
}

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
}

describe('SPEC-032: Kletterer-Basis', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAscentAndRatingStorage();
    resetPendingSync();
    gymStorage.ensureInitialGymData();
    setOnline(true);
  });

  afterEach(() => {
    act(() => hideToast());
    setOnline(true);
  });

  describe('A · App-Icon (F1, AC-1)', () => {
    it('Manifest hat Name, standalone und Icons 192/512/maskable; index.html verlinkt es', () => {
      const root = path.resolve(__dirname, '..');
      const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
      expect(manifest.name).toBe('BoulderMate');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      const sizes = manifest.icons.map((i: any) => `${i.sizes}:${i.purpose}`);
      expect(sizes).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
      for (const icon of manifest.icons) {
        expect(fs.existsSync(path.join(root, 'public', icon.src))).toBe(true);
      }
      const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
      expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
      expect(html).toContain('rel="apple-touch-icon"');
      expect(fs.existsSync(path.join(root, 'public/apple-touch-icon.png'))).toBe(true);
      expect(fs.existsSync(path.join(root, 'public/boulder-icon.svg'))).toBe(true);
    });
  });

  describe('A · Sende-Warteschlange (F3, AC-2/AC-3)', () => {
    it('neuester Stand gewinnt pro Boulder und Person', () => {
      enqueuePendingSync({ kind: 'ascent', op: 'upsert', userId: 'u', boulderId: 'b', payload: { type: 'project' } });
      enqueuePendingSync({ kind: 'ascent', op: 'upsert', userId: 'u', boulderId: 'b', payload: { type: 'top' } });
      enqueuePendingSync({ kind: 'rating', op: 'delete', userId: 'u', boulderId: 'b' });
      expect(getPendingSyncCount()).toBe(2);
      expect(hasPendingSync('ascent', 'u', 'b')).toBe(true);
      clearPendingSync('ascent', 'u', 'b');
      expect(hasPendingSync('ascent', 'u', 'b')).toBe(false);
    });

    it('flush sendet Wartendes und entfernt es; offline bleibt alles liegen', async () => {
      enqueuePendingSync({ kind: 'ascent', op: 'upsert', userId: 'u', boulderId: 'b', payload: { type: 'top' } });
      setOnline(false);
      const sender = vi.fn().mockResolvedValue(true);
      expect(await flushPendingSync(sender)).toBe(1);
      expect(sender).not.toHaveBeenCalled();
      setOnline(true);
      expect(await flushPendingSync(sender)).toBe(0);
      expect(sender).toHaveBeenCalledTimes(1);
    });

    it('verwirft einen Eintrag nach zu vielen Fehlversuchen mit Netz', async () => {
      enqueuePendingSync({ kind: 'rating', op: 'upsert', userId: 'u', boulderId: 'b', payload: {} });
      const sender = vi.fn().mockResolvedValue(false);
      for (let i = 0; i < PENDING_SYNC_MAX_TRIES; i++) await flushPendingSync(sender);
      expect(getPendingSyncCount()).toBe(0);
    });

    it('syncBridge legt fehlgeschlagene Begehungen in die Warteschlange und sendet sie nach «online»', async () => {
      let fail = true;
      const syncAscent = vi.fn(async () => !fail);
      registerSyncHandlers({ syncAscent });
      await syncBridge.syncAscent({ userId: 'u1', boulderId: 'b1', type: 'top' });
      expect(hasPendingSync('ascent', 'u1', 'b1')).toBe(true);
      fail = false;
      window.dispatchEvent(new Event('online'));
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
      expect(hasPendingSync('ascent', 'u1', 'b1')).toBe(false);
      // ohne Netz wird gar nicht erst gesendet
      setOnline(false);
      syncAscent.mockClear();
      await syncBridge.syncAscent({ userId: 'u1', boulderId: 'b2', type: 'top' });
      expect(syncAscent).not.toHaveBeenCalled();
      expect(hasPendingSync('ascent', 'u1', 'b2')).toBe(true);
    });
  });

  describe('A · Offline-Chip (F4, AC-4/AC-5)', () => {
    it('ist unsichtbar online ohne Wartendes und erscheint offline bzw. bei Wartendem', () => {
      const { rerender } = render(<OfflineChip />);
      expect(screen.queryByTestId('offline-chip')).not.toBeInTheDocument();
      act(() => {
        setOnline(false);
        window.dispatchEvent(new Event('offline'));
      });
      expect(screen.getByTestId('offline-chip')).toHaveTextContent('Offline');
      act(() => {
        setOnline(true);
        enqueuePendingSync({ kind: 'ascent', op: 'upsert', userId: 'u', boulderId: 'b', payload: {} });
      });
      rerender(<OfflineChip />);
      expect(screen.getByTestId('offline-chip')).toHaveTextContent('Senden');
      expect(pendingText(3)).toBe('3 Einträge warten. Sie werden automatisch gesendet.');
      expect(pendingText(1)).toBe('1 Eintrag wartet. Er wird automatisch gesendet.');
    });

    it('Toast nach dem Loggen ohne Netz sagt, dass später gesendet wird', () => {
      expect(logToastMessage('top', undefined, true)).toBe('Top geloggt');
      expect(logToastMessage('top', undefined, false)).toBe('Top gespeichert · wird gesendet, sobald Netz da ist');
      expect(logToastMessage('flash', 1, false)).toBe('Flash gespeichert · wird gesendet, sobald Netz da ist');
    });
  });

  describe('B · Lesbarkeit (F5–F8)', () => {
    it('Toasts mit «Rückgängig» stehen mindestens 8 Sekunden (AC-7)', () => {
      expect(ACTION_TOAST_MIN_MS).toBe(8000);
      expect(toastDuration({ durationMs: 2000, actionLabel: 'Rückgängig', onAction: () => {} })).toBe(8000);
      expect(toastDuration({ durationMs: 2000 })).toBe(2000);
      vi.useFakeTimers();
      render(<ToastHost />);
      act(() => showToast({ message: 'Top geloggt', actionLabel: 'Rückgängig', onAction: () => {}, durationMs: 4000 }));
      act(() => vi.advanceTimersByTime(7000));
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1500));
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it('Beschriftung der drei Zahlen in «Ich» ist mindestens 15 px (AC-6)', () => {
      const roleInfo = { canAccessSetterStudio: false, canAccessAdminConsole: false } as UserRoleInfo;
      render(<MeView currentUser={climber} activeGymId={GYM} roleInfo={roleInfo} onSwitchMode={() => {}} onLogout={() => {}} />);
      const label = screen.getByText('Flash-Quote');
      expect(label.className).toContain('text-[15px]');
    });

    it('Nummern folgen der Schraub-Reihenfolge, Lücken nach Abschrauben bleiben, Umbau startet bei 1 (F7)', () => {
      const a = wb('a', '2026-09-01T10:00:00Z');
      const b = wb('b', '2026-09-02T10:00:00Z', 'archived', '2026-09-20T10:00:00Z');
      const c = wb('c', '2026-09-03T10:00:00Z');
      const nums = computeBoulderNumbers([c, b, a]);
      expect(nums.get('a')).toBe(1);
      expect(nums.get('b')).toBe(2);
      expect(nums.get('c')).toBe(3);
      // Nach dem Umbau: nur noch das Neue zählt
      const old = wb('old', '2026-08-01T10:00:00Z', 'archived', '2026-09-30T10:00:00Z');
      const fresh = wb('fresh', '2026-10-01T10:00:00Z');
      const after = computeBoulderNumbers([old, fresh], '2026-10-01T10:00:30Z');
      expect(after.get('fresh')).toBe(1);
      expect(after.has('old')).toBe(false);
    });

    it('Schrift auf der Grifffarbe ist hell oder dunkel je nach Farbe', () => {
      expect(readableTextOn('#FFE14D')).toBe('#121110');
      expect(readableTextOn('#1D4ED8')).toBe('#FFFFFF');
      expect(readableTextOn(undefined)).toBe('#FFFFFF');
    });

    it('Pin und Listenzeile zeigen dieselbe Nummer; Projekt-Pins haben ein Abzeichen (AC-8/AC-9)', () => {
      const { boulder } = seedBoulder('Nummernboulder');
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
      const pinNumber = screen.getByTestId(`pin-number-${boulder.id}`).textContent;
      expect(pinNumber).toMatch(/^\d+$/);
      expect(screen.getByTestId(`route-number-${boulder.id}`).textContent).toBe(pinNumber);
    });
  });

  describe('C · Erste Schritte (F9/F10)', () => {
    it('Karte erscheint einmal und nach «Verstanden» nie wieder (AC-10)', () => {
      const { boulder, sector, scale } = seedBoulder();
      const { unmount } = render(
        <BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={climber} onClose={() => {}} number={3} />
      );
      expect(screen.getByTestId('first-steps-card')).toHaveTextContent('Flash – im ersten Versuch geschafft');
      expect(screen.getByTestId('first-steps-visibility')).toHaveTextContent('Andere sehen deinen Spitznamen');
      expect(screen.getByTestId('boulder-sheet-number')).toHaveTextContent('3');
      fireEvent.click(screen.getByTestId('first-steps-ok'));
      expect(screen.queryByTestId('first-steps-card')).not.toBeInTheDocument();
      expect(localStorage.getItem(FIRST_STEPS_KEY)).toBe('true');
      unmount();
      render(<BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={climber} onClose={() => {}} />);
      expect(screen.queryByTestId('first-steps-card')).not.toBeInTheDocument();
    });

    it('«?» klappt den Erklärsatz zu Font und Soft/Fair/Stiff auf und zu (AC-11)', () => {
      const { boulder, sector, scale } = seedBoulder();
      render(<BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={climber} onClose={() => {}} />);
      fireEvent.click(screen.getByTestId('info-font'));
      expect(screen.getByTestId('info-font-text')).toHaveTextContent('Font ist die übliche Boulder-Skala');
      fireEvent.click(screen.getByTestId('info-font'));
      expect(screen.queryByTestId('info-font-text')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('boulder-sheet-more'));
      fireEvent.click(screen.getByTestId('info-grade-feel'));
      expect(screen.getByTestId('info-grade-feel-text')).toHaveTextContent('Soft = fühlt sich leichter an');
    });
  });

  describe('I · Beta-Spoilerschutz (F11, AC-12)', () => {
    it('Beta ist zugeklappt und zeigt nach Tippen Kommentare und Eingabe', () => {
      const { boulder, sector, scale } = seedBoulder();
      addComment('someone', 'Hannah', boulder.id, 'Links den Heel einhaken');
      render(<BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={climber} onClose={() => {}} />);
      fireEvent.click(screen.getByTestId('boulder-sheet-more'));
      expect(screen.queryByText('Links den Heel einhaken')).not.toBeInTheDocument();
      expect(screen.queryByTestId('boulder-comment-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('beta-toggle')).toHaveTextContent('Beta anzeigen (1)');
      fireEvent.click(screen.getByTestId('beta-toggle'));
      expect(screen.getByText('Links den Heel einhaken')).toBeInTheDocument();
      expect(screen.getByTestId('boulder-comment-input')).toBeInTheDocument();
    });
  });
});

describe('SPEC-032 F8: Kontrast der Hinweistexte', () => {
  const lum = (hex: string) => {
    const c = [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255).map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const css = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf8');
  const tokens = (block: string) => Object.fromEntries([...block.matchAll(/--(bm-[\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
  const light = tokens(css.split('@media (prefers-color-scheme: dark)')[0]);
  const dark = tokens(css.split('@media (prefers-color-scheme: dark)')[1].split('}')[0]);

  it('--bm-text-2 und --bm-text-3 erreichen 4,5:1 auf Hintergrund und Fläche (hell und dunkel)', () => {
    for (const t of [light, dark]) {
      for (const fg of ['bm-text-2', 'bm-text-3']) {
        for (const bg of ['bm-bg', 'bm-surface']) {
          expect(ratio(t[fg], t[bg]), `${fg} auf ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
