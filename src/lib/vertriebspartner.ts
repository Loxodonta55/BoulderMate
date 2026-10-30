/**
 * SPEC-054 · Vertriebspartner – Hallen gewinnen über Partner mit Provision.
 * Baut auf SPEC-053 auf (Verzeichnis, Empfehlungscode, Tabelle `hallen_empfehlungen`).
 * Speicher wie SPEC-053: Supabase für echte Konten, sonst lokal (Test-Personen, Tests, Entwicklung).
 */
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useRemote } from './treffService';
import { getStorageJson, setStorageJson } from './storageUtils';
import {
  EINFUEHRUNGSGEBUEHR_CHF,
  EmpfehlungStatus,
  HALLEN_CHANGED_EVENT,
  HALLEN_LINK_BASE_URL,
  REF_PARAM,
  WUNSCH_ZAHL_AB,
  VerzeichnisHalle,
  buildHallenLink,
  createMyCode,
  deleteMyCode,
  formatChf,
  isShownInFinder,
  loadMyCode,
} from './hallenVerzeichnis';
import { t } from './i18n';

// ---------------------------------------------------------------------------
// Einstellungen (Hans)
// ---------------------------------------------------------------------------

/** Jahresgebühr einer Halle in CHF. null = Preis folgt (§8, Aufgabe 2 für Hans). */
export const HALLEN_JAHRESPREIS_CHF: number | null = null;
/** 1. und 2. Halle */
export const PROVISION_SATZ_BASIS = 0.3;
/** ab der 3. Halle, auch für jede weitere (nicht rückwirkend) */
export const PROVISION_SATZ_HOCH = 0.4;
export const STAFFEL_AB_HALLE = 3;
/** Rechenbeispiel, solange es keinen festen Preis gibt (klar als Beispiel beschriftet) */
export const RECHENBEISPIEL_CHF = 1000;
export const BETREUUNG_TAGE = 60;
export const MAX_BETREUUNGEN = 5;
export const PARTNER_PARAM = 'partner';
export const PARTNER_BEDINGUNGEN_URL = '/empfehlungsprogramm.html';
export const PARTNER_PAGE_URL = `${HALLEN_LINK_BASE_URL}?${PARTNER_PARAM}`;

const DAY_MS = 24 * 60 * 60 * 1000;
const LOCAL_PARTNERS_KEY = 'bouldermate_vertriebspartner_v1';
/** Derselbe Schlüssel wie SPEC-053 (`loadMyReferrals`), damit beide dieselben Einträge sehen */
const LOCAL_REFERRALS_KEY = 'bouldermate_hallen_empfehlungen_v1';

// ---------------------------------------------------------------------------
// Provision (§1.1)
// ---------------------------------------------------------------------------

/** Satz für die n-te registrierte Halle eines Partners (1-basiert) */
export function provisionSatz(nteHalle: number): number {
  return nteHalle >= STAFFEL_AB_HALLE ? PROVISION_SATZ_HOCH : PROVISION_SATZ_BASIS;
}

export function berechneProvision(umsatzErstesJahrChf: number, satz: number): number {
  if (!Number.isFinite(umsatzErstesJahrChf) || umsatzErstesJahrChf <= 0) return 0;
  return Math.round(umsatzErstesJahrChf * satz * 100) / 100;
}

export function formatPct(satz: number): string {
  return `${Math.round(satz * 100)} %`;
}

/** Grundlage des Rechenbeispiels: echter Preis des ersten Jahres, sonst CHF 1’000 */
export function beispielUmsatz(): { betrag: number; echt: boolean } {
  if (typeof HALLEN_JAHRESPREIS_CHF === 'number' && HALLEN_JAHRESPREIS_CHF > 0) {
    return { betrag: HALLEN_JAHRESPREIS_CHF + (EINFUEHRUNGSGEBUEHR_CHF || 0), echt: true };
  }
  return { betrag: RECHENBEISPIEL_CHF, echt: false };
}

/** «Zahlt eine Halle im ersten Jahr CHF 1’000, bekommst du CHF 300 (ab der 3. Halle CHF 400).» */
export function rechenbeispielText(): string {
  const { betrag } = beispielUmsatz();
  return t('Zahlt eine Halle im ersten Jahr {umsatz}, bekommst du {basis} (ab der 3. Halle {hoch}).', {
    umsatz: formatChf(betrag),
    basis: formatChf(berechneProvision(betrag, PROVISION_SATZ_BASIS)),
    hoch: formatChf(berechneProvision(betrag, PROVISION_SATZ_HOCH)),
  });
}

// ---------------------------------------------------------------------------
// Partner-Profil
// ---------------------------------------------------------------------------

export type PartnerRolle = 'trainer' | 'stammgast' | 'influencer' | 'hallenteam' | 'studierend' | 'andere';
export const PARTNER_ROLLEN: PartnerRolle[] = ['trainer', 'stammgast', 'influencer', 'hallenteam', 'studierend', 'andere'];
export const PARTNER_ROLLE_LABEL: Record<PartnerRolle, string> = {
  trainer: 'Trainer/in',
  stammgast: 'Stammgast',
  influencer: 'Influencer/in',
  hallenteam: 'Hallenteam',
  studierend: 'Student/in',
  andere: 'Andere',
};

export interface PartnerProfil {
  userId: string;
  rolle: PartnerRolle;
  region: string;
  anzeigename?: string | null;
  akzeptiertAm: string;
}

export interface PartnerEingabe {
  rolle: PartnerRolle | null;
  region: string;
  anzeigename?: string;
}

/** AC-3: Rolle und Region sind Pflicht */
export function isPartnerEingabeComplete(e: PartnerEingabe): boolean {
  return Boolean(e.rolle && PARTNER_ROLLEN.includes(e.rolle) && e.region.trim().length >= 2);
}

function readLocalPartners(): Record<string, PartnerProfil> {
  return getStorageJson<Record<string, PartnerProfil>>(LOCAL_PARTNERS_KEY, {});
}

function emitChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(HALLEN_CHANGED_EVENT));
}

export async function loadPartner(userId: string | null | undefined): Promise<PartnerProfil | null> {
  if (!userId) return null;
  if (useRemote(userId)) {
    try {
      const { data, error } = await supabase!
        .from('vertriebspartner')
        .select('user_id, rolle, region, anzeigename, akzeptiert_am')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as any;
      return { userId: r.user_id, rolle: r.rolle, region: r.region, anzeigename: r.anzeigename, akzeptiertAm: r.akzeptiert_am };
    } catch {
      return null;
    }
  }
  return readLocalPartners()[userId] ?? null;
}

/** Partner werden: nur mit Haken «mindestens 18» und vollständiger Eingabe. Legt bei Bedarf den Code an. */
export async function becomePartner(userId: string, eingabe: PartnerEingabe, confirmedAdult: boolean): Promise<PartnerProfil | null> {
  if (!confirmedAdult || !isPartnerEingabeComplete(eingabe)) return null;
  const code = await createMyCode(userId, true);
  if (!code) return null;
  const profil: PartnerProfil = {
    userId,
    rolle: eingabe.rolle!,
    region: eingabe.region.trim().slice(0, 60),
    anzeigename: eingabe.anzeigename?.trim().slice(0, 40) || null,
    akzeptiertAm: new Date().toISOString(),
  };
  if (useRemote(userId)) {
    const { error } = await supabase!.from('vertriebspartner').upsert({
      user_id: userId,
      rolle: profil.rolle,
      region: profil.region,
      anzeigename: profil.anzeigename,
    });
    if (error) return null;
  } else {
    const all = readLocalPartners();
    all[userId] = profil;
    setStorageJson(LOCAL_PARTNERS_KEY, all);
  }
  emitChanged();
  return profil;
}

/** AC-10: löscht Profil und Code; laufende Hallen bleiben für die Abrechnung */
export async function leavePartner(userId: string): Promise<boolean> {
  if (useRemote(userId)) {
    const { error } = await supabase!.from('vertriebspartner').delete().eq('user_id', userId);
    if (error) return false;
  } else {
    const all = readLocalPartners();
    delete all[userId];
    setStorageJson(LOCAL_PARTNERS_KEY, all);
  }
  return deleteMyCode(userId);
}

// ---------------------------------------------------------------------------
// Betreuungen und Pipeline (Tabelle `hallen_empfehlungen`)
// ---------------------------------------------------------------------------

export const PARTNER_STATUS_ORDER: EmpfehlungStatus[] = ['betreut', 'im_gespraech', 'registriert', 'bezahlt', 'ausgezahlt'];

export interface PartnerHalle {
  id: string;
  verzeichnisId: string | null;
  halleName: string;
  userId: string | null;
  code: string;
  status: EmpfehlungStatus;
  betreutBis: string | null;
  verlaengert: boolean;
  umsatzErstesJahrChf: number | null;
  provisionSatz: number | null;
  betragChf: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Betreuung zählt, solange sie nicht abgelaufen ist; ab «Registriert» immer */
export function isAktiv(h: Pick<PartnerHalle, 'status' | 'betreutBis'>, now: number = Date.now()): boolean {
  if (h.status === 'betreut' || h.status === 'im_gespraech') {
    return Boolean(h.betreutBis) && new Date(h.betreutBis!).getTime() > now;
  }
  return true;
}

export function statusSchritt(status: EmpfehlungStatus): number {
  return PARTNER_STATUS_ORDER.indexOf(status) + 1;
}

function readLocalRows(): PartnerHalle[] {
  return getStorageJson<Array<Partial<PartnerHalle> & { id: string; halleName: string; status: EmpfehlungStatus }>>(LOCAL_REFERRALS_KEY, []).map(r => ({
    verzeichnisId: null,
    userId: null,
    code: '',
    betreutBis: null,
    verlaengert: false,
    umsatzErstesJahrChf: null,
    provisionSatz: null,
    betragChf: null,
    createdAt: r.updatedAt || new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...r,
  })) as PartnerHalle[];
}

function writeLocalRows(rows: PartnerHalle[]) {
  setStorageJson(LOCAL_REFERRALS_KEY, rows);
}

function rowToPartnerHalle(r: any): PartnerHalle {
  return {
    id: r.id,
    verzeichnisId: r.verzeichnis_id ?? null,
    halleName: r.halle_name,
    userId: r.user_id ?? null,
    code: r.code,
    status: r.status,
    betreutBis: r.betreut_bis ?? null,
    verlaengert: Boolean(r.verlaengert),
    umsatzErstesJahrChf: r.umsatz_erstes_jahr_chf != null ? Number(r.umsatz_erstes_jahr_chf) : null,
    provisionSatz: r.provision_satz != null ? Number(r.provision_satz) : null,
    betragChf: r.betrag_chf != null ? Number(r.betrag_chf) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const ROW_COLUMNS =
  'id, verzeichnis_id, halle_name, user_id, code, status, betreut_bis, verlaengert, umsatz_erstes_jahr_chf, provision_satz, betrag_chf, created_at, updated_at';

/** Eigene Hallen (auch abgelaufene, damit der Partner sieht, was war) */
export async function loadMyPartnerHallen(userId: string | null | undefined): Promise<PartnerHalle[]> {
  if (!userId) return [];
  if (useRemote(userId)) {
    try {
      const { data, error } = await supabase!
        .from('hallen_empfehlungen')
        .select(ROW_COLUMNS)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToPartnerHalle);
    } catch {
      return [];
    }
  }
  return readLocalRows()
    .filter(r => r.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** IDs der Verzeichnis-Hallen, die gerade ein Partner betreut (ohne Namen) */
export async function loadBetreuteHallen(now: number = Date.now()): Promise<Set<string>> {
  if (useRemote(null)) {
    try {
      const { data, error } = await supabase!.rpc('hallen_betreut');
      if (error) throw error;
      return new Set(((data || []) as Array<{ verzeichnis_id: string }>).map(r => r.verzeichnis_id));
    } catch {
      return new Set();
    }
  }
  return new Set(
    readLocalRows()
      .filter(r => r.verzeichnisId && isAktiv(r, now))
      .map(r => r.verzeichnisId!)
  );
}

export type BetreuenFehler = 'kein_partner' | 'nicht_sichtbar' | 'schon_betreut' | 'limit' | 'fehler';
export type BetreuenErgebnis = { ok: true; halle: PartnerHalle } | { ok: false; fehler: BetreuenFehler };

function localBetreuen(userId: string, code: string, halle: VerzeichnisHalle, now: number): BetreuenErgebnis {
  const rows = readLocalRows();
  if (rows.some(r => r.verzeichnisId === halle.id && isAktiv(r, now))) return { ok: false, fehler: 'schon_betreut' };
  const offen = rows.filter(r => r.userId === userId && (r.status === 'betreut' || r.status === 'im_gespraech') && isAktiv(r, now));
  if (offen.length >= MAX_BETREUUNGEN) return { ok: false, fehler: 'limit' };
  const iso = new Date(now).toISOString();
  const neu: PartnerHalle = {
    id: `pe-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    verzeichnisId: halle.id,
    halleName: halle.name,
    userId,
    code,
    status: 'betreut',
    betreutBis: new Date(now + BETREUUNG_TAGE * DAY_MS).toISOString(),
    verlaengert: false,
    umsatzErstesJahrChf: null,
    provisionSatz: null,
    betragChf: null,
    createdAt: iso,
    updatedAt: iso,
  };
  // abgelaufene Betreuung derselben Halle ersetzen, damit die Liste sauber bleibt
  writeLocalRows([...rows.filter(r => !(r.verzeichnisId === halle.id && !isAktiv(r, now) && r.status !== 'registriert')), neu]);
  return { ok: true, halle: neu };
}

/** F3/AC-4: Halle für 60 Tage betreuen */
export async function betreueHalle(userId: string, halle: VerzeichnisHalle, now: number = Date.now()): Promise<BetreuenErgebnis> {
  const [partner, code] = await Promise.all([loadPartner(userId), loadMyCode(userId)]);
  if (!partner || !code) return { ok: false, fehler: 'kein_partner' };
  if (!isShownInFinder(halle)) return { ok: false, fehler: 'nicht_sichtbar' };
  let result: BetreuenErgebnis;
  if (useRemote(userId)) {
    const { data, error } = await supabase!.rpc('partner_halle_betreuen', { p_verzeichnis_id: halle.id });
    if (error) {
      const msg = String((error as any).message || '');
      const fehler: BetreuenFehler = msg.includes('schon_betreut') ? 'schon_betreut' : msg.includes('limit') ? 'limit' : 'fehler';
      return { ok: false, fehler };
    }
    const rows = await loadMyPartnerHallen(userId);
    const row = rows.find(r => r.id === data) || rows.find(r => r.verzeichnisId === halle.id);
    result = row ? { ok: true, halle: row } : { ok: false, fehler: 'fehler' };
  } else {
    result = localBetreuen(userId, code, halle, now);
  }
  if (result.ok) emitChanged();
  return result;
}

/** AC-5: «Im Gespräch» verlängert einmal um 60 Tage */
export async function setImGespraech(userId: string, id: string, now: number = Date.now()): Promise<boolean> {
  if (useRemote(userId)) {
    const { error } = await supabase!.rpc('partner_im_gespraech', { p_id: id });
    if (error) return false;
  } else {
    const rows = readLocalRows();
    const row = rows.find(r => r.id === id && r.userId === userId);
    if (!row || row.status !== 'betreut' || !isAktiv(row, now)) return false;
    row.status = 'im_gespraech';
    if (!row.verlaengert) {
      row.betreutBis = new Date(Math.max(new Date(row.betreutBis!).getTime(), now) + BETREUUNG_TAGE * DAY_MS).toISOString();
      row.verlaengert = true;
    }
    row.updatedAt = new Date(now).toISOString();
    writeLocalRows(rows);
  }
  emitChanged();
  return true;
}

/** AC-5: Halle wieder freigeben (nur Schritt 1–2) */
export async function freigeben(userId: string, id: string): Promise<boolean> {
  if (useRemote(userId)) {
    const { error } = await supabase!.rpc('partner_freigeben', { p_id: id });
    if (error) return false;
  } else {
    const rows = readLocalRows();
    const row = rows.find(r => r.id === id && r.userId === userId);
    if (!row || (row.status !== 'betreut' && row.status !== 'im_gespraech')) return false;
    writeLocalRows(rows.filter(r => r.id !== id));
  }
  emitChanged();
  return true;
}

// ---------------------------------------------------------------------------
// Zahlen für den Partner (F2)
// ---------------------------------------------------------------------------

export interface PartnerZahlen {
  registriert: number;
  aktuellerSatz: number;
  offenChf: number;
  ausgezahltChf: number;
  laufend: number;
}

const AB_REGISTRIERT: EmpfehlungStatus[] = ['registriert', 'bezahlt', 'ausgezahlt'];

export function partnerZahlen(rows: PartnerHalle[], now: number = Date.now()): PartnerZahlen {
  const registriert = rows.filter(r => AB_REGISTRIERT.includes(r.status)).length;
  const sum = (s: EmpfehlungStatus) => rows.filter(r => r.status === s).reduce((acc, r) => acc + (r.betragChf || 0), 0);
  return {
    registriert,
    // Satz für die nächste Halle
    aktuellerSatz: provisionSatz(registriert + 1),
    offenChf: sum('bezahlt'),
    ausgezahltChf: sum('ausgezahlt'),
    laufend: rows.filter(r => (r.status === 'betreut' || r.status === 'im_gespraech') && isAktiv(r, now)).length,
  };
}

// ---------------------------------------------------------------------------
// Partner-Kit: Texte (F4)
// ---------------------------------------------------------------------------

export function offenlegungSatz(): string {
  return t('Offen gesagt: Ich bin BoulderMate-Partner und bekomme eine Provision, wenn ihr mitmacht. Euch kostet das nichts extra.');
}

export interface PartnerTexte {
  emailBetreff: string;
  email: string;
  nachricht: string;
  leitfaden: string[];
  link: string;
}

export function buildPartnerTexte(opts: { halleId: string; halleName: string; code: string; wishCount: number; name?: string | null }): PartnerTexte {
  const link = buildHallenLink(opts.halleId, opts.code);
  const wunsch = opts.wishCount >= WUNSCH_ZAHL_AB ? t('{n} Kletterer wünschen sich BoulderMate bei euch schon.', { n: opts.wishCount }) : '';
  const gruss = opts.name ? `\n\n${t('Liebe Grüsse')}\n${opts.name}` : `\n\n${t('Liebe Grüsse')}`;
  const email = [
    t('Liebe Hallenleitung von {name}', { name: opts.halleName }),
    [
      t('BoulderMate zeigt eure Routen mit Foto an der Wand. Kletterer loggen und bewerten sie, eure Schrauber sehen, wie die Routen ankommen.'),
      wunsch,
    ]
      .filter(Boolean)
      .join(' '),
    t('Infos und eine Demo findet ihr hier: {link}', { link }),
    offenlegungSatz(),
  ].join('\n\n') + gruss;
  const nachricht = [
    t('Hoi zusammen! Kennt ihr BoulderMate? Eure Routen mit Foto an der Wand, Kletterer loggen und bewerten.'),
    wunsch,
    t('Schaut mal: {link}', { link }),
    offenlegungSatz(),
  ]
    .filter(Boolean)
    .join(' ');
  const leitfaden = [
    t('Nach der Hallenleitung fragen, nicht ans Thekenteam.'),
    offenlegungSatz(),
    t('Die Demo zeigen: «Demo: 6a plus Zürich».'),
    opts.wishCount >= WUNSCH_ZAHL_AB ? t('Die Wunsch-Zahl nennen: {n} Kletterer wünschen sich BoulderMate hier.', { n: opts.wishCount }) : t('Sagen, dass Kletterer sich BoulderMate in der App wünschen können.'),
    t('Den Kontakt übergeben, nicht verhandeln: Preis und Vertrag kommen von BoulderMate.'),
  ];
  return { emailBetreff: t('BoulderMate für {name}', { name: opts.halleName }), email, nachricht, leitfaden, link };
}

/** F2: allgemeiner Partner-Link ohne Halle (`?ref=<code>`) */
export function buildPartnerLink(code: string, baseUrl: string = HALLEN_LINK_BASE_URL): string {
  const url = new URL(baseUrl);
  url.searchParams.set(REF_PARAM, code);
  return url.toString();
}

export interface Einwand {
  frage: string;
  antwort: string;
}

/** F2: 7 Einwände, Antworten je höchstens 2 Sätze */
export function einwaende(): Einwand[] {
  return [
    { frage: t('Wir haben schon eine andere App.'), antwort: t('BoulderMate zeigt eure Routen direkt auf dem Wandfoto und gibt euren Schraubern Rückmeldung. Probiert die Demo und vergleicht selbst.') },
    { frage: t('Was kostet das?'), antwort: t('Den Preis nennt BoulderMate euch direkt, mit einer Offerte. Ich verhandle keine Preise.') },
    { frage: t('Unsere Schrauber haben keine Zeit.'), antwort: t('Pro Sektor ein Foto, dann die Routen antippen. Die KI-Erfassung schlägt Routen aus dem Foto vor.') },
    { frage: t('Was passiert mit unseren Daten?'), antwort: t('Eure Routen gehören euch, Kletterer-Daten bleiben bei BoulderMate in der Schweiz/EU. Details stehen in der Datenschutzerklärung.') },
    { frage: t('Unsere Kletterer brauchen das nicht.'), antwort: t('In der App sieht man, wie viele sich BoulderMate bei euch wünschen. Kletterer finden neue Routen schneller und loggen ihre Erfolge.') },
    { frage: t('Wir sind ein Verein / eine Gemeinde.'), antwort: t('Ich stelle nur den Kontakt her. Die Offerte für euren Vorstand oder eure Beschaffung kommt von BoulderMate.') },
    { frage: t('Wir haben gerade keine Zeit.'), antwort: t('Kein Problem, ich lasse euch den Link da. Meldet euch, wann es passt.') },
  ];
}

// ---------------------------------------------------------------------------
// Links `?partner` und `?ref=` ohne Halle (F1, F5)
// ---------------------------------------------------------------------------

export function readPartnerPageFromUrl(href?: string): boolean {
  const source = href ?? (typeof window !== 'undefined' ? window.location.href : '');
  if (!source) return false;
  try {
    return new URL(source).searchParams.has(PARTNER_PARAM);
  } catch {
    return false;
  }
}

export function clearPartnerPageFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PARTNER_PARAM)) return;
    url.searchParams.delete(PARTNER_PARAM);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Plattform-Admin «Vertrieb» (F6)
// ---------------------------------------------------------------------------

export interface VertriebEintrag extends PartnerHalle {
  partnerRolle: PartnerRolle | null;
  partnerRegion: string | null;
  partnerName: string | null;
  /** registrierte Hallen dieses Partners ohne diesen Eintrag (für die Staffel) */
  partnerRegistriertSonst: number;
}

export async function loadVertriebUebersicht(adminUserId: string): Promise<VertriebEintrag[]> {
  if (useRemote(adminUserId)) {
    try {
      const { data, error } = await supabase!.rpc('vertrieb_uebersicht');
      if (error) throw error;
      return ((data || []) as any[]).map(r => ({
        ...rowToPartnerHalle(r),
        partnerRolle: r.partner_rolle ?? null,
        partnerRegion: r.partner_region ?? null,
        partnerName: r.partner_name ?? null,
        partnerRegistriertSonst: Number(r.partner_registriert_sonst || 0),
      }));
    } catch {
      return [];
    }
  }
  const rows = readLocalRows();
  const partners = readLocalPartners();
  return rows
    .map(r => {
      const p = r.userId ? partners[r.userId] : undefined;
      return {
        ...r,
        partnerRolle: p?.rolle ?? null,
        partnerRegion: p?.region ?? null,
        partnerName: p?.anzeigename ?? null,
        partnerRegistriertSonst: rows.filter(o => o.id !== r.id && o.userId === r.userId && AB_REGISTRIERT.includes(o.status)).length,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Vorschlag für den Satz: Staffel nach Anzahl der übrigen registrierten Hallen */
export function satzVorschlag(e: Pick<VertriebEintrag, 'provisionSatz' | 'partnerRegistriertSonst'>): number {
  return e.provisionSatz ?? provisionSatz(e.partnerRegistriertSonst + 1);
}

export function offenZurAuszahlung(rows: Array<Pick<PartnerHalle, 'status' | 'betragChf'>>): number {
  return rows.filter(r => r.status === 'bezahlt').reduce((acc, r) => acc + (r.betragChf || 0), 0);
}

export interface AdminUpdate {
  status: EmpfehlungStatus;
  umsatzErstesJahrChf: number | null;
  provisionSatz: number;
}

export async function updateVertriebEintrag(adminUserId: string, id: string, u: AdminUpdate): Promise<boolean> {
  const betrag = u.umsatzErstesJahrChf != null ? berechneProvision(u.umsatzErstesJahrChf, u.provisionSatz) : null;
  if (useRemote(adminUserId)) {
    const { error } = await supabase!
      .from('hallen_empfehlungen')
      .update({
        status: u.status,
        umsatz_erstes_jahr_chf: u.umsatzErstesJahrChf,
        provision_satz: u.provisionSatz,
        betrag_chf: betrag,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return false;
  } else {
    const rows = readLocalRows();
    const row = rows.find(r => r.id === id);
    if (!row) return false;
    row.status = u.status;
    row.umsatzErstesJahrChf = u.umsatzErstesJahrChf;
    row.provisionSatz = u.provisionSatz;
    row.betragChf = betrag;
    row.updatedAt = new Date().toISOString();
    writeLocalRows(rows);
  }
  emitChanged();
  return true;
}

/** Admin beendet eine Betreuung (Schritt 1–2), z. B. bei Missbrauch */
export async function adminBetreuungBeenden(adminUserId: string, id: string): Promise<boolean> {
  if (useRemote(adminUserId)) {
    const { error } = await supabase!.from('hallen_empfehlungen').delete().eq('id', id).in('status', ['betreut', 'im_gespraech']);
    if (error) return false;
  } else {
    const rows = readLocalRows();
    const row = rows.find(r => r.id === id);
    if (!row || (row.status !== 'betreut' && row.status !== 'im_gespraech')) return false;
    writeLocalRows(rows.filter(r => r.id !== id));
  }
  emitChanged();
  return true;
}

// ---------------------------------------------------------------------------
// Hook: Partner-Zustand für Hallen-Blatt und «Ich»
// ---------------------------------------------------------------------------

export interface PartnerState {
  partner: PartnerProfil | null;
  code: string | null;
  hallen: PartnerHalle[];
  betreut: Set<string>;
  loaded: boolean;
}

export function usePartnerState(userId: string | null | undefined): PartnerState {
  const [state, setState] = useState<PartnerState>({ partner: null, code: null, hallen: [], betreut: new Set(), loaded: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadPartner(userId), loadMyCode(userId), loadMyPartnerHallen(userId), loadBetreuteHallen()]).then(([partner, code, hallen, betreut]) => {
      if (!cancelled) setState({ partner, code, hallen, betreut, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [userId, tick]);

  useEffect(() => {
    const on = () => setTick(x => x + 1);
    window.addEventListener(HALLEN_CHANGED_EVENT, on);
    return () => window.removeEventListener(HALLEN_CHANGED_EVENT, on);
  }, []);

  return state;
}

export function formatDatum(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
