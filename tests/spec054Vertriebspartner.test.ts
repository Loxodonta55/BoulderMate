import { describe, it, expect, beforeEach } from 'vitest';
import { LOCAL_VERZEICHNIS_SEED, VerzeichnisHalle, loadMyCode, loadMyReferrals } from '../src/lib/hallenVerzeichnis';
import {
  BETREUUNG_TAGE,
  MAX_BETREUUNGEN,
  adminBetreuungBeenden,
  becomePartner,
  berechneProvision,
  betreueHalle,
  buildPartnerLink,
  buildPartnerTexte,
  einwaende,
  freigeben,
  isAktiv,
  isPartnerEingabeComplete,
  leavePartner,
  loadBetreuteHallen,
  loadMyPartnerHallen,
  loadPartner,
  loadVertriebUebersicht,
  offenZurAuszahlung,
  offenlegungSatz,
  partnerZahlen,
  provisionSatz,
  readPartnerPageFromUrl,
  rechenbeispielText,
  satzVorschlag,
  setImGespraech,
  statusSchritt,
  updateVertriebEintrag,
} from '../src/lib/vertriebspartner';
import { clearMemoryStore } from '../src/lib/storageUtils';

/** SPEC-054 · Vertriebspartner – reine Logik (lokaler Speicher, kein Supabase) */

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 30, 12);

const H = (id: string, over: Partial<VerzeichnisHalle> = {}): VerzeichnisHalle => ({
  id,
  name: `Halle ${id}`,
  ort: 'Zürich',
  lat: 47.4,
  lng: 8.5,
  pruefStatus: 'ok',
  ...over,
});

async function partner(userId = 'user-p') {
  return becomePartner(userId, { rolle: 'trainer', region: 'Zürich' }, true);
}

beforeEach(() => {
  localStorage.clear();
  clearMemoryStore();
});

describe('SPEC-054 · Provision (AC-2)', () => {
  it('30 % für die 1. und 2. Halle, 40 % ab der 3., nicht rückwirkend', () => {
    expect(provisionSatz(1)).toBe(0.3);
    expect(provisionSatz(2)).toBe(0.3);
    expect(provisionSatz(3)).toBe(0.4);
    expect(provisionSatz(7)).toBe(0.4);
  });

  it('rechnet vom Umsatz des ersten Jahres', () => {
    expect(berechneProvision(1000, 0.3)).toBe(300);
    expect(berechneProvision(1000, 0.4)).toBe(400);
    expect(berechneProvision(1234.5, 0.3)).toBe(370.35);
    expect(berechneProvision(0, 0.3)).toBe(0);
    expect(berechneProvision(Number.NaN, 0.3)).toBe(0);
  });

  it('Rechenbeispiel ohne festen Preis: CHF 1’000 → 300 / 400', () => {
    expect(rechenbeispielText()).toBe('Zahlt eine Halle im ersten Jahr CHF 1’000, bekommst du CHF 300 (ab der 3. Halle CHF 400).');
  });
});

describe('SPEC-054 · Partner werden (AC-3, AC-10)', () => {
  it('braucht Haken «18», Rolle und Region; legt Profil und Code an', async () => {
    expect(isPartnerEingabeComplete({ rolle: null, region: 'Zürich' })).toBe(false);
    expect(isPartnerEingabeComplete({ rolle: 'stammgast', region: ' ' })).toBe(false);
    expect(await becomePartner('user-p', { rolle: 'trainer', region: 'Zürich' }, false)).toBeNull();
    expect(await loadPartner('user-p')).toBeNull();

    const p = await partner();
    expect(p?.rolle).toBe('trainer');
    expect(await loadPartner('user-p')).toMatchObject({ rolle: 'trainer', region: 'Zürich' });
    expect(await loadMyCode('user-p')).toMatch(/^BM-[A-Z0-9]{6}$/);
  });

  it('«Partner beenden» löscht Profil und Code, Hallen bleiben', async () => {
    await partner();
    await betreueHalle('user-p', H('vz-a'), NOW);
    expect(await leavePartner('user-p')).toBe(true);
    expect(await loadPartner('user-p')).toBeNull();
    expect(await loadMyCode('user-p')).toBeNull();
    expect(await loadMyPartnerHallen('user-p')).toHaveLength(1);
  });
});

describe('SPEC-054 · Betreuung (AC-4, AC-5)', () => {
  it('nur Partner; 60 Tage; fremde Betreuung sperrt; abgelaufene zählt nicht', async () => {
    expect(await betreueHalle('user-p', H('vz-a'), NOW)).toEqual({ ok: false, fehler: 'kein_partner' });
    await partner('user-p');
    await partner('user-q');

    const res = await betreueHalle('user-p', H('vz-a'), NOW);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.halle.status).toBe('betreut');
    expect(new Date(res.halle.betreutBis!).getTime()).toBe(NOW + BETREUUNG_TAGE * DAY);

    expect(await betreueHalle('user-q', H('vz-a'), NOW + DAY)).toEqual({ ok: false, fehler: 'schon_betreut' });
    expect((await loadBetreuteHallen(NOW + DAY)).has('vz-a')).toBe(true);

    // nach Ablauf wieder frei
    const later = NOW + (BETREUUNG_TAGE + 1) * DAY;
    expect(isAktiv(res.halle, later)).toBe(false);
    expect((await loadBetreuteHallen(later)).has('vz-a')).toBe(false);
    expect((await betreueHalle('user-q', H('vz-a'), later)).ok).toBe(true);
  });

  it('unsichtbare Hallen können nicht betreut werden', async () => {
    await partner();
    expect(await betreueHalle('user-p', H('vz-x', { gymId: 'gym-1' }), NOW)).toEqual({ ok: false, fehler: 'nicht_sichtbar' });
    expect(await betreueHalle('user-p', H('vz-y', { pruefStatus: 'unsicher' }), NOW)).toEqual({ ok: false, fehler: 'nicht_sichtbar' });
  });

  it(`höchstens ${MAX_BETREUUNGEN} gleichzeitig`, async () => {
    await partner();
    for (let i = 0; i < MAX_BETREUUNGEN; i++) expect((await betreueHalle('user-p', H(`vz-${i}`), NOW)).ok).toBe(true);
    expect(await betreueHalle('user-p', H('vz-zuviel'), NOW)).toEqual({ ok: false, fehler: 'limit' });
  });

  it('«Im Gespräch» verlängert einmal um 60 Tage; «Freigeben» macht frei', async () => {
    await partner();
    const res = await betreueHalle('user-p', H('vz-a'), NOW);
    if (!res.ok) throw new Error('betreuen');
    expect(await setImGespraech('user-p', res.halle.id, NOW + 10 * DAY)).toBe(true);
    let [row] = await loadMyPartnerHallen('user-p');
    expect(row.status).toBe('im_gespraech');
    expect(new Date(row.betreutBis!).getTime()).toBe(NOW + 2 * BETREUUNG_TAGE * DAY);
    // ein zweites Mal geht nicht (Status ist schon «Im Gespräch»)
    expect(await setImGespraech('user-p', res.halle.id, NOW + 20 * DAY)).toBe(false);

    expect(await freigeben('user-p', row.id)).toBe(true);
    expect(await loadMyPartnerHallen('user-p')).toHaveLength(0);
    expect((await loadBetreuteHallen(NOW)).has('vz-a')).toBe(false);
  });

  it('SPEC-053 «Deine Empfehlungen» sieht dieselben Einträge', async () => {
    await partner();
    await betreueHalle('user-p', H('vz-a'), NOW);
    const refs = await loadMyReferrals('user-p');
    expect(refs).toHaveLength(1);
    expect(refs[0].status).toBe('betreut');
    expect(statusSchritt('betreut')).toBe(1);
    expect(statusSchritt('ausgezahlt')).toBe(5);
  });
});

describe('SPEC-054 · Partner-Kit (AC-6)', () => {
  it('jeder Text legt die Provision offen und enthält halle= und ref=', () => {
    const texte = buildPartnerTexte({ halleId: 'vz-a', halleName: 'Halle A', code: 'BM-K7Q4AC', wishCount: 12, name: 'Marco' });
    const satz = offenlegungSatz();
    expect(satz).toContain('bekomme eine Provision');
    expect(texte.email).toContain(satz);
    expect(texte.nachricht).toContain(satz);
    expect(texte.leitfaden).toContain(satz);
    expect(texte.leitfaden).toHaveLength(5);
    for (const s of [texte.email, texte.nachricht]) {
      expect(s).toContain('halle=vz-a');
      expect(s).toContain('ref=BM-K7Q4AC');
    }
    expect(texte.email).toContain('Liebe Hallenleitung von Halle A');
    expect(texte.email).toContain('12 Kletterer');
    expect(texte.email).toContain('Marco');
    expect(texte.emailBetreff).toBe('BoulderMate für Halle A');
  });

  it('Wunsch-Zahl erst ab 3', () => {
    const texte = buildPartnerTexte({ halleId: 'vz-a', halleName: 'Halle A', code: 'BM-K7Q4AC', wishCount: 2 });
    expect(texte.email).not.toContain('Kletterer wünschen sich BoulderMate bei euch');
  });

  it('7 Einwände mit Antwort; allgemeiner Partner-Link ohne Halle', () => {
    expect(einwaende()).toHaveLength(7);
    expect(einwaende().every(e => e.frage && e.antwort)).toBe(true);
    expect(buildPartnerLink('BM-K7Q4AC')).toBe('https://bouldermate.ch/?ref=BM-K7Q4AC');
    expect(readPartnerPageFromUrl('https://bouldermate.ch/?partner')).toBe(true);
    expect(readPartnerPageFromUrl('https://bouldermate.ch/?halle=x')).toBe(false);
  });
});

describe('SPEC-054 · Zahlen und Admin (AC-7, AC-9)', () => {
  it('Admin setzt Status und Umsatz; Provision, Satz, Offen, Ausgezahlt', async () => {
    await partner();
    const ids: string[] = [];
    for (const id of ['vz-1', 'vz-2', 'vz-3']) {
      const r = await betreueHalle('user-p', H(id), NOW);
      if (r.ok) ids.push(r.halle.id);
    }
    let rows = await loadVertriebUebersicht('admin');
    expect(rows).toHaveLength(3);
    expect(rows[0].partnerRolle).toBe('trainer');

    // zwei Hallen registriert → dritte bekommt 40 %
    await updateVertriebEintrag('admin', ids[0], { status: 'ausgezahlt', umsatzErstesJahrChf: 1000, provisionSatz: 0.3 });
    await updateVertriebEintrag('admin', ids[1], { status: 'bezahlt', umsatzErstesJahrChf: 2000, provisionSatz: 0.3 });
    rows = await loadVertriebUebersicht('admin');
    const third = rows.find(r => r.id === ids[2])!;
    expect(satzVorschlag(third)).toBe(0.4);
    await updateVertriebEintrag('admin', ids[2], { status: 'bezahlt', umsatzErstesJahrChf: 1000, provisionSatz: satzVorschlag(third) });

    rows = await loadVertriebUebersicht('admin');
    expect(rows.find(r => r.id === ids[2])!.betragChf).toBe(400);
    expect(offenZurAuszahlung(rows)).toBe(1000);

    const z = partnerZahlen(await loadMyPartnerHallen('user-p'), NOW);
    expect(z.registriert).toBe(3);
    expect(z.aktuellerSatz).toBe(0.4);
    expect(z.offenChf).toBe(1000);
    expect(z.ausgezahltChf).toBe(300);
  });

  it('Admin beendet eine Betreuung, aber keine registrierte Halle', async () => {
    await partner();
    const a = await betreueHalle('user-p', H('vz-a'), NOW);
    const b = await betreueHalle('user-p', H('vz-b'), NOW);
    if (!a.ok || !b.ok) throw new Error('betreuen');
    await updateVertriebEintrag('admin', b.halle.id, { status: 'registriert', umsatzErstesJahrChf: null, provisionSatz: 0.3 });
    expect(await adminBetreuungBeenden('admin', a.halle.id)).toBe(true);
    expect(await adminBetreuungBeenden('admin', b.halle.id)).toBe(false);
    expect((await loadMyPartnerHallen('user-p')).map(r => r.id)).toEqual([b.halle.id]);
  });

  it('Beispiel-Hallen aus SPEC-053 sind betreubar', async () => {
    await partner();
    const seed = LOCAL_VERZEICHNIS_SEED.find(s => s.id === 'vz-demo-winterthur')!;
    expect((await betreueHalle('user-p', seed, NOW)).ok).toBe(true);
  });
});
