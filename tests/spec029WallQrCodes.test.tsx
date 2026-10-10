import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { App } from '../src/App';
import { WallQrCodes } from '../src/components/admin/WallQrCodes';
import { LandingPage } from '../src/components/LandingPage';
import { clearBatchServiceStorage, getSectors } from '../src/lib/batchBoulderService';
import { resetAllGymData, ensureInitialGymData } from '../src/lib/gymStorage';
import { setSessionUser, signOut } from '../src/lib/authService';
import { buildWallLink, clearPendingWallLink, getPendingWallLink } from '../src/lib/wallLink';
import { stringToUuid } from '../src/lib/storageUtils';
import * as syncService from '../src/lib/syncService';

/** SPEC-029 · QR-Codes an der Wand: Druckansicht, Landing-Hinweis, Sprung zur Wand */

beforeEach(() => {
  localStorage.clear();
  resetAllGymData();
  clearBatchServiceStorage();
  ensureInitialGymData();
  clearPendingWallLink();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.spyOn(syncService, 'syncFromSupabase').mockResolvedValue(false);
});

describe('AC-6/AC-7 Druckansicht', () => {
  it('zeigt einen Aufkleber pro Sektor mit Name, Halle, QR-Code und Link', () => {
    const sectors = getSectors('gym-minimum-zh');
    render(<WallQrCodes gymId="gym-minimum-zh" />);
    expect(screen.getByTestId('wall-qr-section')).toHaveTextContent('QR-Codes für die Wände');
    fireEvent.click(screen.getByTestId('wall-qr-print-btn'));

    const sheet = screen.getByTestId('wall-qr-sheet');
    expect(within(sheet).getAllByTestId('wall-qr-code')).toHaveLength(sectors.length);
    const first = within(sheet).getByTestId(`wall-qr-card-${sectors[0].id}`);
    expect(first).toHaveTextContent(sectors[0].name);
    expect(first).toHaveTextContent('Minimum');
    expect(first).toHaveTextContent('Scannen und Boulder loggen');
    expect(within(first).getByTestId('wall-qr-link-text')).toHaveTextContent(`bouldermate.ch/?wand=${stringToUuid(sectors[0].id)}`);
    expect(within(first).getByTestId('wall-qr-code')).toHaveAttribute('data-qr-text', buildWallLink(sectors[0].id));
  });

  it('«Drucken» ruft den Druckdialog, «Schließen» schließt', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<WallQrCodes gymId="gym-minimum-zh" />);
    fireEvent.click(screen.getByTestId('wall-qr-print-btn'));
    fireEvent.click(screen.getByTestId('wall-qr-print-now'));
    expect(print).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('wall-qr-close'));
    expect(screen.queryByTestId('wall-qr-sheet')).not.toBeInTheDocument();
  });

  it('ohne Sektoren ist der Knopf gesperrt', () => {
    render(<WallQrCodes gymId="gym-gibt-es-nicht" />);
    expect(screen.getByTestId('wall-qr-print-btn')).toBeDisabled();
  });
});

describe('AC-4 Landing-Hinweis', () => {
  it('zeigt den Hinweis nur Gästen', () => {
    const { rerender } = render(<LandingPage onOpenLogin={() => {}} wallLinkNotice="Melde dich an, dann geht es direkt zur Wand «Dach»." />);
    expect(screen.getByTestId('wall-link-notice')).toHaveTextContent('Wand «Dach»');
    rerender(<LandingPage onOpenLogin={() => {}} onContinue={() => {}} wallLinkNotice="x" />);
    expect(screen.queryByTestId('wall-link-notice')).not.toBeInTheDocument();
  });
});

describe('AC-1/AC-4/AC-5 App', () => {
  it('angemeldet: ?wand= öffnet die Wand des Sektors und verschwindet aus der Adresse', async () => {
    setSessionUser('hans-kletterer');
    const target = getSectors('gym-minimum-zh')[1];
    window.history.replaceState(null, '', `/?wand=${stringToUuid(target.id)}`);
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('sector-pill-name')).toHaveTextContent(target.name));
    expect(window.location.search).toBe('');
    expect(getPendingWallLink()).toBeNull();
  });

  it('Gast: Landing zeigt den Sektornamen, das Ziel bleibt gemerkt', () => {
    signOut();
    const target = getSectors('gym-minimum-zh')[0];
    window.history.replaceState(null, '', `/?wand=${target.id}`);
    render(<App />);
    expect(screen.getByTestId('wall-link-notice')).toHaveTextContent(target.name);
    expect(getPendingWallLink()).toBe(target.id);
  });

  it('unbekannte Wand: normaler Start mit Hinweis', async () => {
    setSessionUser('hans-kletterer');
    window.history.replaceState(null, '', '/?wand=00000000-0000-4000-8000-000000000000');
    render(<App />);
    expect(await screen.findByText('Diese Wand gibt es nicht mehr.')).toBeInTheDocument();
    expect(screen.getByTestId('climber-wall-view')).toBeInTheDocument();
  });
});
