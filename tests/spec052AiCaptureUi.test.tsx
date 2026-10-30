import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AiCapturePanel } from '../src/components/setter/AiCapturePanel';
import { AiCaptureSettings } from '../src/components/admin/AiCaptureSettings';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { ToastHost } from '../src/components/ui/Toast';
import { rememberCaptureJob, setGymAiSettings, getOpenIssues } from '../src/lib/aiCapture/aiCaptureService';
import * as gymStorage from '../src/lib/gymStorage';
import { clearMemoryStore } from '../src/lib/storageUtils';
import { STORAGE_KEY_ASCENTS } from '../src/lib/ratingAndAscentService';
import type { GymGradeScale, Sector, WallBoulder } from '../src/types/boulder';

const SECTOR: Sector = { id: 'sec_6a_cave', gymId: 'gym-6a-plus', name: 'Cave', wallPhotoUrl: '/w.jpg', sortOrder: 1, createdAt: '' };
const SCALES: GymGradeScale[] = [
  { id: 'g-gelb', gymId: 'gym-6a-plus', colorName: 'Gelb', colorHex: '#eab308', difficultyLabel: 'leicht', fontRangeMin: '3', fontRangeMax: '4', sortOrder: 1 },
  { id: 'g-blau', gymId: 'gym-6a-plus', colorName: 'Blau', colorHex: '#3b82f6', difficultyLabel: 'mittel', fontRangeMin: '6A', fontRangeMax: '6B+', sortOrder: 2 },
];
const RADAR = { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 };

function boulder(over: Partial<WallBoulder> = {}): WallBoulder {
  return { id: 'b1', sectorId: SECTOR.id, gradeScaleId: 'g-gelb', positionX: 0.3, positionY: 0.7, name: 'Faultier', setterId: 's', status: 'active', radar: RADAR, createdAt: new Date().toISOString(), ...over };
}

function storeBoulders(list: WallBoulder[]) {
  localStorage.setItem('boulderapp_wall_boulders_v2', JSON.stringify(list));
}

const panel = (boulders: WallBoulder[] = [], onOpenBoulder = vi.fn()) =>
  render(<><AiCapturePanel gymId="gym-6a-plus" sector={SECTOR} boulders={boulders} gradeScales={SCALES} userId="user-boris" inRebuild={false} onOpenBoulder={onOpenBoulder} /><ToastHost /></>);

describe('SPEC-052 Studio: Foto → KI', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMemoryStore();
    localStorage.setItem('bouldermate_synced_from_supabase', 'true');
    gymStorage.ensureInitialGymData();
  });

  it('AC-1: ohne Einschalten kein Kamera-Knopf, danach groß und beschriftet', () => {
    const { unmount } = panel();
    expect(screen.queryByTestId(`ai-capture-btn-${SECTOR.id}`)).toBeNull();
    unmount();
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true });
    panel();
    const btn = screen.getByTestId(`ai-capture-btn-${SECTOR.id}`);
    expect(btn).toHaveAttribute('aria-label', 'Foto für Sektor Cave');
    expect(btn.className).toMatch(/min-h-\[56px\]/);
    expect(screen.getByText('Ganze Wand, gerade davor, ohne Personen, ohne Blitz.')).toBeInTheDocument();
  });

  it('AC-22: Studio zeigt, woran die KI den Grad liest', () => {
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true, gradeMarker: 'symbol' });
    panel();
    expect(screen.getByTestId('ai-capture-marker-hint')).toHaveTextContent('KI liest den Grad an: Zeichen am Start');
  });

  it('AC-2: mit aktiven Routen zuerst die Frage, ohne Routen direkt die Kamera', () => {
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true });
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const { unmount } = panel([boulder()]);
    fireEvent.click(screen.getByTestId(`ai-capture-btn-${SECTOR.id}`));
    expect(screen.getByTestId('ai-capture-mode-full')).toHaveTextContent('Alle 1 alten Routen');
    expect(screen.getByTestId('ai-capture-mode-partial')).toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('ai-capture-mode-partial'));
    expect(click).toHaveBeenCalledTimes(1);
    unmount();

    panel([]);
    fireEvent.click(screen.getByTestId(`ai-capture-btn-${SECTOR.id}`));
    expect(screen.queryByTestId('ai-capture-mode-dialog')).toBeNull();
    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  it('AC-3/AC-4: nach dem Foto zeigt die Statuszeile «Wartet auf Netz …» (aria-live)', async () => {
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true });
    panel([]);
    const file = new File([new Uint8Array([1, 2, 3])], 'wand.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByTestId('ai-capture-file'), { target: { files: [file] } });
    const status = screen.getByTestId(`ai-capture-status-${SECTOR.id}`);
    expect(status).toHaveAttribute('aria-live', 'polite');
    await waitFor(() => expect(status).toHaveTextContent('Wartet auf Netz …'));
  });

  it('AC-12: «Ergebnis zurücknehmen» fragt bei Tops nach, «Abbrechen» vorausgewählt', async () => {
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true });
    const neu = boulder({ id: 'neu-1', captureSource: 'ai', aiRunId: 'job-9' });
    storeBoulders([neu]);
    localStorage.setItem(STORAGE_KEY_ASCENTS, JSON.stringify([
      { id: 'a1', userId: 'u1', userNickname: 'u1', boulderId: 'neu-1', type: 'top', createdAt: new Date().toISOString() },
      { id: 'a2', userId: 'u2', userNickname: 'u2', boulderId: 'neu-1', type: 'flash', createdAt: new Date().toISOString() },
    ]));
    rememberCaptureJob({ id: 'job-9', gymId: 'gym-6a-plus', sectorId: SECTOR.id, mode: 'new', status: 'done', createdAt: new Date().toISOString(), finishedAt: new Date().toISOString(), result: { created: 1, createdIds: ['neu-1'], review: 0, publishMode: 'direct' }, archivedBoulderIds: [] });
    panel([neu]);
    expect(screen.getByTestId(`ai-capture-status-${SECTOR.id}`)).toHaveTextContent('1 Route erkannt');
    fireEvent.click(screen.getByTestId('ai-capture-undo-job-9'));
    expect(screen.getByText('2 Tops gehen verloren. Trotzdem zurücknehmen?')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByTestId('ai-capture-undo-cancel'));
    fireEvent.click(screen.getByTestId('ai-capture-undo-cancel'));
    expect(screen.queryByTestId('ai-capture-undo-confirm')).toBeNull();
    fireEvent.click(screen.getByTestId('ai-capture-undo-job-9'));
    await act(async () => { fireEvent.click(screen.getByTestId('ai-capture-undo-confirm-btn')); });
    await waitFor(() => expect(screen.queryByTestId('ai-capture-undo-job-9')).toBeNull());
  });

  it('AC-13: «Kurz prüfen» zeigt Zahl ohne Rot, Gründe und Knöpfe; «Passt» erledigt', async () => {
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true });
    const b = boulder({ id: 'kp-1', captureSource: 'ai', gradePending: true, aiReview: ['grade'] });
    storeBoulders([b]);
    const open = vi.fn();
    panel([b], open);
    const count = screen.getByTestId(`ai-review-count-${SECTOR.id}`);
    expect(count).toHaveTextContent('1');
    expect(count.innerHTML).not.toMatch(/danger|red/);
    fireEvent.click(count);
    expect(screen.getByTestId('ai-review-item-kp-1')).toHaveTextContent('Grad nicht sicher lesbar');
    for (const id of ['ok', 'recolor', 'delete', 'pin']) expect(screen.getByTestId(`ai-review-${id}-kp-1`)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ai-review-recolor-kp-1'));
    fireEvent.click(screen.getByTestId('ai-review-color-g-blau'));
    await waitFor(() => expect(screen.queryByTestId('ai-review-item-kp-1')).toBeNull());
  });
});

describe('SPEC-052 Admin: Einstellungen', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMemoryStore();
    gymStorage.ensureInitialGymData();
  });

  it('AC-18: Schalter mit Datenschutz-Satz; Einstellungen erst nach dem Einschalten', () => {
    render(<AiCaptureSettings gymId="gym-6a-plus" userId="user-boris" />);
    expect(screen.getByTestId('ai-capture-privacy')).toHaveTextContent('nicht zum Training');
    expect(screen.queryByTestId('grade-marker-toggle')).toBeNull();
    fireEvent.click(screen.getByTestId('ai-capture-enable'));
    expect(screen.getByTestId('grade-marker-toggle')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('grade-marker-tape'));
    expect(screen.getByTestId('grade-marker-tape')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('name-style-plain'));
    fireEvent.click(screen.getByTestId('publish-mode-review'));
    const gym = gymStorage.getGyms().find(g => g.id === 'gym-6a-plus')!;
    expect(gym).toMatchObject({ ai_capture_enabled: true, grade_marker: 'tape', route_name_style: 'plain', ai_publish_mode: 'review' });
  });

  it('AC-20: drei Arten der Grad-Markierung; bei «Zeichen» je Farbe ein Feld, leeres Feld mit Hinweis; Hinweis an die KI', () => {
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true });
    render(<AiCaptureSettings gymId="gym-6a-plus" userId="user-boris" />);
    expect(screen.getByTestId('grade-marker-holds')).toHaveTextContent('Farbe der Griffe');
    expect(screen.getByTestId('grade-marker-tape')).toHaveTextContent('Farbiger Zettel am Start');
    expect(screen.queryByTestId('grade-symbols')).toBeNull();
    fireEvent.click(screen.getByTestId('grade-marker-symbol'));
    expect(screen.getByTestId('grade-marker-symbol')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('grade-marker-holds')).toHaveAttribute('aria-pressed', 'false');

    const inputs = screen.getAllByTestId(/^grade-symbol-(?!missing)/);
    expect(inputs.length).toBeGreaterThan(1);
    const first = inputs[0] as HTMLInputElement;
    const id = first.dataset.testid!.replace('grade-symbol-', '');
    expect(screen.getByTestId(`grade-symbol-missing-${id}`)).toHaveTextContent('Grad folgt');
    fireEvent.change(first, { target: { value: '★★, 2 Sterne' } });
    fireEvent.blur(first);
    expect(screen.queryByTestId(`grade-symbol-missing-${id}`)).toBeNull();

    const hint = screen.getByTestId('ai-grade-hint') as HTMLTextAreaElement;
    expect(hint.maxLength).toBe(300);
    fireEvent.change(hint, { target: { value: 'Schild unten links am Startgriff' } });
    fireEvent.blur(hint);

    const gym = gymStorage.getGyms().find(g => g.id === 'gym-6a-plus')!;
    expect(gym.grade_marker).toBe('symbol');
    expect(gym.grade_symbols).toEqual({ [id]: '★★, 2 Sterne' });
    expect(gym.ai_grade_hint).toBe('Schild unten links am Startgriff');
  });

  it('Nicht-Admins können nichts ändern', () => {
    render(<><AiCaptureSettings gymId="gym-6a-plus" userId="niemand-123" /><ToastHost /></>);
    fireEvent.click(screen.getByTestId('ai-capture-enable'));
    expect(screen.queryByTestId('grade-marker-toggle')).toBeNull();
    expect(screen.getByText('Nur Hallen-Admins dürfen das ändern.')).toBeInTheDocument();
  });
});

describe('SPEC-052 Kletterer: BoulderSheet', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMemoryStore();
    gymStorage.ensureInitialGymData();
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: true });
  });

  it('AC-14: ohne KI-Erfassung in der Halle kein «Stimmt was nicht?»', () => {
    setGymAiSettings('gym-6a-plus', 'user-boris', { enabled: false });
    sheet(boulder());
    expect(screen.queryByTestId('route-issue-btn')).toBeNull();
  });

  const sheet = (b: WallBoulder, isGuest = false) =>
    render(<><BoulderSheet boulder={b} sector={SECTOR} gradeScale={SCALES[0]} currentUser={{ id: isGuest ? 'guest' : 'u-kletterer', nickname: 'K', role: 'member' }} isGuest={isGuest} onClose={vi.fn()} /><ToastHost /></>);

  it('AC-7: «Grad folgt» als Fragezeichen mit Text, nicht als Farbe', () => {
    sheet(boulder({ gradePending: true, captureSource: 'ai' }));
    const num = screen.getByTestId('boulder-sheet-number');
    expect(num).toHaveTextContent('?');
    expect(num).toHaveAttribute('aria-label', 'Grad folgt');
    expect(screen.getByText(/Grad folgt/, { selector: 'span' })).toBeInTheDocument();
  });

  it('AC-6/AC-10: Griff-Farbe sichtbar, Merkmale einmal «geschätzt»', () => {
    sheet(boulder({ holdColor: 'Türkis', radarSource: 'ai', captureSource: 'ai' }));
    expect(screen.getByTestId('boulder-sheet-hold-color')).toHaveTextContent('Griffe: Türkis');
    fireEvent.click(screen.getByTestId('boulder-sheet-more'));
    expect(screen.getAllByTestId('radar-estimated')).toHaveLength(1);
  });

  it('AC-14: «Stimmt was nicht?» nur angemeldet, drei Gründe, Meldung einmal', async () => {
    const { unmount } = sheet(boulder(), true);
    fireEvent.click(screen.getByTestId('boulder-sheet-more'));
    expect(screen.queryByTestId('route-issue-btn')).toBeNull();
    unmount();

    sheet(boulder());
    fireEvent.click(screen.getByTestId('boulder-sheet-more'));
    fireEvent.click(screen.getByTestId('route-issue-btn'));
    for (const k of ['wrong_grade', 'not_exists', 'wrong_pin']) expect(screen.getByTestId(`route-issue-${k}`)).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByTestId('route-issue-wrong_pin')); });
    expect(getOpenIssues()).toMatchObject([{ kind: 'wrong_pin', boulderId: 'b1', userId: 'u-kletterer' }]);
    await waitFor(() => expect(screen.getByText('Danke! Die Schrauber schauen es sich an.')).toBeInTheDocument());
  });
});
