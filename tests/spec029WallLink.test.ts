import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildWallLink,
  displayWallLink,
  readWallLinkFromUrl,
  clearWallLinkFromUrl,
  savePendingWallLink,
  getPendingWallLink,
  clearPendingWallLink,
  resolveWallLinkSector,
  PENDING_WALL_LINK_MAX_AGE_MS,
} from '../src/lib/wallLink';
import { buildQrSvgData, QR_QUIET_ZONE } from '../src/lib/qrSvg';
import { stringToUuid } from '../src/lib/storageUtils';

/** SPEC-029 · QR-Codes an der Wand: Link-Logik und QR-SVG */

const UUID = '3f2b8c1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f';

describe('SPEC-029 Link', () => {
  beforeEach(() => {
    localStorage.clear();
    clearPendingWallLink();
    window.history.replaceState(null, '', '/');
  });

  it('F2: baut den Link mit der Supabase-UUID', () => {
    expect(buildWallLink(UUID)).toBe(`https://bouldermate.ch/?wand=${UUID}`);
    // Lokale Kurz-ID wird zur selben UUID wie in Supabase
    expect(buildWallLink('sector-slab')).toBe(`https://bouldermate.ch/?wand=${stringToUuid('sector-slab')}`);
    expect(displayWallLink(UUID)).toBe(`bouldermate.ch/?wand=${UUID}`);
  });

  it('liest ?wand= aus der Adresse und ignoriert leere Werte', () => {
    expect(readWallLinkFromUrl(`https://bouldermate.ch/?wand=${UUID}`)).toBe(UUID);
    expect(readWallLinkFromUrl('https://bouldermate.ch/?wand=')).toBeNull();
    expect(readWallLinkFromUrl('https://bouldermate.ch/')).toBeNull();
    expect(readWallLinkFromUrl('kein link')).toBeNull();
  });

  it('AC-1: entfernt ?wand= aus der Adresszeile und lässt andere Parameter stehen', () => {
    window.history.replaceState(null, '', `/?wand=${UUID}&x=1#oben`);
    clearWallLinkFromUrl();
    expect(window.location.search).toBe('?x=1');
    expect(window.location.hash).toBe('#oben');
  });

  it('AC-4: merkt das Ziel 30 Minuten lang', () => {
    const t0 = 1_000_000;
    savePendingWallLink(UUID, t0);
    expect(getPendingWallLink(t0 + 60_000)).toBe(UUID);
    expect(getPendingWallLink(t0 + PENDING_WALL_LINK_MAX_AGE_MS + 1)).toBeNull();
    // Abgelaufenes Ziel ist danach gelöscht
    expect(getPendingWallLink(t0)).toBeNull();
  });

  it('AC-2: findet den Sektor über die lokale ID oder die UUID', () => {
    const sectors = [{ id: 'sector-slab' }, { id: UUID }];
    expect(resolveWallLinkSector('sector-slab', sectors)?.id).toBe('sector-slab');
    expect(resolveWallLinkSector(stringToUuid('sector-slab'), sectors)?.id).toBe('sector-slab');
    expect(resolveWallLinkSector(UUID.toUpperCase(), sectors)?.id).toBe(UUID);
    expect(resolveWallLinkSector('00000000-0000-4000-8000-000000000000', sectors)).toBeNull();
  });
});

describe('SPEC-029 QR-SVG', () => {
  it('F8: erzeugt einen quadratischen Code mit Ruhezone', () => {
    const data = buildQrSvgData(buildWallLink(UUID));
    // Version ≥ 3 bei einem Link dieser Länge: 29 Module + 2 × 4 Rand
    expect(data.size).toBeGreaterThanOrEqual(29 + QR_QUIET_ZONE * 2);
    expect(data.path).toMatch(/^M\d+ \d+h1v1h-1z/);
    // Oben links beginnt das Suchmuster direkt nach der Ruhezone
    expect(data.path.startsWith(`M${QR_QUIET_ZONE} ${QR_QUIET_ZONE}h1v1h-1z`)).toBe(true);
  });

  it('gleicher Inhalt → gleiches Bild, anderer Inhalt → anderes Bild', () => {
    const a = buildQrSvgData(buildWallLink(UUID));
    expect(buildQrSvgData(buildWallLink(UUID)).path).toBe(a.path);
    expect(buildQrSvgData(buildWallLink('sector-dach')).path).not.toBe(a.path);
  });
});
