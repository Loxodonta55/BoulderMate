/**
 * SPEC-053 · «Noch nicht dabei» – alle Hallen zeigen und Hallen empfehlen.
 * Verzeichnis-Hallen (Tabelle `hallen_verzeichnis`), Wünsche, Empfehlungscode, Link und Teilen-Text.
 * Speicher wie Treff: Supabase für echte Konten, sonst lokal (Test-Personen, Tests, Entwicklung).
 */
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { isTestEnv } from './authService';
import { useRemote } from './treffService';
import { getStorageJson, setStorageJson, removeStorageItem, getStorageString, setStorageString } from './storageUtils';
import { GymFinderEntry, hasCoordinates, normalizeSearch } from './gymFinder';
import { t } from './i18n';

// ---------------------------------------------------------------------------
// Einstellungen (Hans)
// ---------------------------------------------------------------------------

/** Einmalige Einführungsgebühr der Halle in CHF. null = Betrag folgt (§8, Aufgabe 2 für Hans). Jahrespreis: SPEC-054 `HALLEN_JAHRESPREIS_CHF`. */
export const EINFUEHRUNGSGEBUEHR_CHF: number | null = null;
export const DANKESCHOEN_ANTEIL = 0.3;
/** Wunsch-Zahl erst ab 3 zeigen (Runde 2, V3) */
export const WUNSCH_ZAHL_AB = 3;
/** Bis es ein eigenes Postfach gibt: dieselbe Adresse wie Datenschutz und Meldungen (contact.ts) */
export const HALLEN_CONTACT_EMAIL = 'bors.dolic@web.de';
export const TEILNAHME_URL = '/empfehlungsprogramm.html';
export const HALLEN_LINK_BASE_URL = 'https://bouldermate.ch/';
export const HALLEN_LINK_PARAM = 'halle';
export const REF_PARAM = 'ref';
/** Vorlesbar: ohne 0/O, 1/I, 2/Z, 5/S, 8/B */
export const CODE_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY3479';
export const CODE_LENGTH = 6;
export const PENDING_REF_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const HALLEN_CHANGED_EVENT = 'bouldermate:hallen_verzeichnis_changed';
const ONLY_ACTIVE_KEY = 'bouldermate_finder_only_active_v1';
const LOCAL_WISHES_KEY = 'bouldermate_hallen_wuensche_v1';
const LOCAL_CODES_KEY = 'bouldermate_empfehlungscodes_v1';
const LOCAL_REFERRALS_KEY = 'bouldermate_hallen_empfehlungen_v1';
const DIRECTORY_CACHE_KEY = 'bouldermate_hallen_verzeichnis_cache_v1';
const PENDING_REF_KEY = 'bouldermate_pending_ref_v1';
const SEEN_ACTIVE_KEY = 'bouldermate_hallen_jetzt_dabei_gesehen_v1';

// ---------------------------------------------------------------------------
// Verzeichnis
// ---------------------------------------------------------------------------

export interface VerzeichnisHalle {
  id: string;
  name: string;
  adresse?: string;
  plz?: string;
  ort?: string;
  kanton?: string;
  lat?: number;
  lng?: number;
  website?: string;
  email?: string;
  pruefStatus?: 'ok' | 'korrigiert' | 'unsicher' | null;
  /** gesetzt, sobald die Halle bei BoulderMate mitmacht */
  gymId?: string | null;
  ausgeblendet?: boolean;
}

/**
 * Beispiel-Hallen nur für Tests, Test-Personen und Entwicklung (keine echten Daten, Koordinaten ungefähr).
 * `demoWuensche` simuliert Wünsche anderer Personen.
 */
export const LOCAL_VERZEICHNIS_SEED: Array<VerzeichnisHalle & { demoWuensche?: number }> = [
  { id: 'vz-demo-winterthur', name: 'Boulderhalle Winterthur (Beispiel)', adresse: 'Beispielstrasse 1', plz: '8400', ort: 'Winterthur', kanton: 'ZH', lat: 47.4999, lng: 8.7241, website: 'https://example.com/winterthur', email: 'info@example.com', pruefStatus: 'ok', demoWuensche: 11 },
  { id: 'vz-demo-bern', name: 'Kletterhalle Bern (Beispiel)', adresse: 'Beispielweg 2', plz: '3008', ort: 'Bern', kanton: 'BE', lat: 46.9466, lng: 7.4219, pruefStatus: 'ok', demoWuensche: 1 },
  { id: 'vz-demo-stgallen', name: 'Boulder St. Gallen (Beispiel)', adresse: 'Musterplatz 3', plz: '9000', ort: 'St. Gallen', kanton: 'SG', lat: 47.4245, lng: 9.3767, website: 'https://example.com/sg', pruefStatus: 'korrigiert' },
  { id: 'vz-demo-unsicher', name: 'Unsichere Halle (Beispiel)', ort: 'Luzern', kanton: 'LU', lat: 47.05, lng: 8.31, pruefStatus: 'unsicher' },
  { id: 'vz-demo-ohne-ort', name: 'Halle ohne Koordinaten (Beispiel)', ort: 'Chur', kanton: 'GR', pruefStatus: 'ok' },
];

function remoteDirectory(): boolean {
  return Boolean(supabase && isSupabaseConfigured && !isTestEnv && !(import.meta as any).env?.DEV);
}

function rowToHalle(r: any): VerzeichnisHalle {
  return {
    id: r.id,
    name: r.name,
    adresse: r.adresse ?? undefined,
    plz: r.plz ?? undefined,
    ort: r.ort ?? undefined,
    kanton: r.kanton ?? undefined,
    lat: typeof r.lat === 'number' ? r.lat : undefined,
    lng: typeof r.lng === 'number' ? r.lng : undefined,
    website: r.website ?? undefined,
    email: r.email ?? undefined,
    pruefStatus: r.pruef_status ?? null,
    gymId: r.gym_id ?? null,
    ausgeblendet: Boolean(r.ausgeblendet),
  };
}

/** Alle nicht ausgeblendeten Einträge (auch bereits aktive, für F6). Fällt bei Fehlern auf den letzten Stand zurück. */
export async function loadDirectory(): Promise<VerzeichnisHalle[]> {
  if (!remoteDirectory()) return LOCAL_VERZEICHNIS_SEED.map(({ demoWuensche: _d, ...h }) => h);
  try {
    const { data, error } = await supabase!
      .from('hallen_verzeichnis')
      .select('id, name, adresse, plz, ort, kanton, lat, lng, website, email, pruef_status, gym_id, ausgeblendet')
      .eq('ausgeblendet', false)
      .limit(2000);
    if (error) throw error;
    const rows = (data || []).map(rowToHalle);
    setStorageJson(DIRECTORY_CACHE_KEY, rows);
    return rows;
  } catch {
    return getStorageJson<VerzeichnisHalle[]>(DIRECTORY_CACHE_KEY, []);
  }
}

/** F1: Was auf Karte und Liste erscheint (AC-10) */
export function isShownInFinder(v: VerzeichnisHalle, activeGymNames: Set<string> = new Set()): boolean {
  if (v.ausgeblendet || v.gymId) return false;
  if (v.pruefStatus === 'unsicher') return false;
  if (!hasCoordinates(v)) return false;
  return !activeGymNames.has(normalizeSearch(v.name));
}

export interface DirectoryEntry extends GymFinderEntry {
  registered: false;
  website?: string;
  email?: string;
  wishCount: number;
}

export function toDirectoryEntries(
  rows: VerzeichnisHalle[],
  activeGyms: Array<{ name: string }>,
  wishCounts: Record<string, number>
): DirectoryEntry[] {
  const activeNames = new Set(activeGyms.map(g => normalizeSearch(g.name)));
  return rows
    .filter(v => isShownInFinder(v, activeNames))
    .map(v => ({
      id: v.id,
      name: v.name,
      city: v.ort,
      address: [v.adresse, [v.plz, v.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ') || undefined,
      lat: v.lat,
      lng: v.lng,
      activeBoulders: 0,
      newBoulders: 0,
      registered: false as const,
      website: v.website,
      email: v.email,
      wishCount: wishCounts[v.id] || 0,
    }));
}

export function isDirectoryEntry(e: GymFinderEntry): e is DirectoryEntry {
  return (e as Partial<DirectoryEntry>).registered === false;
}

// ---------------------------------------------------------------------------
// Schalter «Nur aktive Hallen» (Runde 2, V5)
// ---------------------------------------------------------------------------

export function getOnlyActive(): boolean {
  return getStorageString(ONLY_ACTIVE_KEY) === '1';
}

export function setOnlyActive(on: boolean): void {
  setStorageString(ONLY_ACTIVE_KEY, on ? '1' : '0');
}

// ---------------------------------------------------------------------------
// Wünsche
// ---------------------------------------------------------------------------

interface LocalWish {
  verzeichnisId: string;
  userId: string;
  createdAt: string;
}

function readLocalWishes(): LocalWish[] {
  return getStorageJson<LocalWish[]>(LOCAL_WISHES_KEY, []);
}

function emitChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(HALLEN_CHANGED_EVENT));
}

export async function loadWishCounts(): Promise<Record<string, number>> {
  if (remoteDirectory()) {
    try {
      const { data, error } = await supabase!.rpc('hallen_wunsch_anzahl');
      if (error) throw error;
      const out: Record<string, number> = {};
      for (const r of (data || []) as Array<{ verzeichnis_id: string; anzahl: number }>) out[r.verzeichnis_id] = r.anzahl;
      return out;
    } catch {
      return {};
    }
  }
  const out: Record<string, number> = {};
  for (const s of LOCAL_VERZEICHNIS_SEED) if (s.demoWuensche) out[s.id] = s.demoWuensche;
  for (const w of readLocalWishes()) out[w.verzeichnisId] = (out[w.verzeichnisId] || 0) + 1;
  return out;
}

export async function loadMyWishes(userId: string | null | undefined): Promise<string[]> {
  if (!userId) return [];
  if (useRemote(userId)) {
    try {
      const { data, error } = await supabase!.from('hallen_wuensche').select('verzeichnis_id').eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((r: any) => r.verzeichnis_id);
    } catch {
      return [];
    }
  }
  return readLocalWishes().filter(w => w.userId === userId).map(w => w.verzeichnisId);
}

/** Setzt oder nimmt den Wunsch zurück. true = gespeichert. */
export async function setWish(verzeichnisId: string, userId: string, on: boolean): Promise<boolean> {
  if (useRemote(userId)) {
    try {
      const q = on
        ? supabase!.from('hallen_wuensche').insert({ verzeichnis_id: verzeichnisId, user_id: userId })
        : supabase!.from('hallen_wuensche').delete().eq('verzeichnis_id', verzeichnisId).eq('user_id', userId);
      const { error } = await q;
      // 23505 = schon gewünscht → gilt als Erfolg
      if (error && (error as any).code !== '23505') throw error;
    } catch {
      return false;
    }
  } else {
    const rest = readLocalWishes().filter(w => !(w.verzeichnisId === verzeichnisId && w.userId === userId));
    if (on) rest.push({ verzeichnisId, userId, createdAt: new Date().toISOString() });
    setStorageJson(LOCAL_WISHES_KEY, rest);
  }
  emitChanged();
  return true;
}

/** Wunsch-Zeile: Zahl erst ab 3 (sonst null → «Sei unter den Ersten») */
export function wishCountLabel(count: number): string | null {
  if (count < WUNSCH_ZAHL_AB) return null;
  return t('{n} Kletterer wünschen sich BoulderMate hier', { n: count });
}

// ---------------------------------------------------------------------------
// Empfehlungscode
// ---------------------------------------------------------------------------

export function generateCode(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length) % CODE_ALPHABET.length];
  return `BM-${s}`;
}

const CODE_RE = new RegExp(`^BM-[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

export function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const c = raw.trim().toUpperCase();
  return CODE_RE.test(c) ? c : null;
}

/** «BM-K7Q2AC» → «BM-K7Q 2AC» zum Vorlesen */
export function formatCodeForReading(code: string): string {
  const body = code.replace(/^BM-/, '');
  return `BM-${body.slice(0, 3)} ${body.slice(3)}`;
}

function readLocalCodes(): Record<string, string> {
  return getStorageJson<Record<string, string>>(LOCAL_CODES_KEY, {});
}

export async function loadMyCode(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  if (useRemote(userId)) {
    try {
      const { data, error } = await supabase!.from('empfehlungscodes').select('code').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return (data as any)?.code ?? null;
    } catch {
      return null;
    }
  }
  return readLocalCodes()[userId] ?? null;
}

/** Nur nach Haken «mindestens 18 + Teilnahmebedingungen» (AC-7). */
export async function createMyCode(userId: string, confirmedAdult: boolean, random: () => number = Math.random): Promise<string | null> {
  if (!confirmedAdult) return null;
  const existing = await loadMyCode(userId);
  if (existing) return existing;
  if (useRemote(userId)) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode(random);
      const { error } = await supabase!.from('empfehlungscodes').insert({ user_id: userId, code });
      if (!error) {
        emitChanged();
        return code;
      }
      if ((error as any).code !== '23505') return null;
    }
    return null;
  }
  const codes = readLocalCodes();
  const taken = new Set(Object.values(codes));
  let code = generateCode(random);
  for (let i = 0; i < 20 && taken.has(code); i++) code = generateCode(random);
  codes[userId] = code;
  setStorageJson(LOCAL_CODES_KEY, codes);
  emitChanged();
  return code;
}

export async function deleteMyCode(userId: string): Promise<boolean> {
  if (useRemote(userId)) {
    const { error } = await supabase!.from('empfehlungscodes').delete().eq('user_id', userId);
    if (error) return false;
  } else {
    const codes = readLocalCodes();
    delete codes[userId];
    setStorageJson(LOCAL_CODES_KEY, codes);
  }
  emitChanged();
  return true;
}

// ---------------------------------------------------------------------------
// Empfehlungen (Status setzt der Plattform-Admin)
// ---------------------------------------------------------------------------

/** SPEC-054: «betreut» = ein Partner kümmert sich (Schritt 1 von 5) */
export type EmpfehlungStatus = 'betreut' | 'im_gespraech' | 'registriert' | 'bezahlt' | 'ausgezahlt';
export const EMPFEHLUNG_STATUS_ORDER: EmpfehlungStatus[] = ['betreut', 'im_gespraech', 'registriert', 'bezahlt', 'ausgezahlt'];
export const EMPFEHLUNG_STATUS_LABEL: Record<EmpfehlungStatus, string> = {
  betreut: 'Von dir betreut',
  im_gespraech: 'Im Gespräch',
  registriert: 'Registriert',
  bezahlt: 'Bezahlt',
  ausgezahlt: 'Ausgezahlt',
};

export interface Empfehlung {
  id: string;
  halleName: string;
  status: EmpfehlungStatus;
  betragChf?: number | null;
  updatedAt: string;
}

export async function loadMyReferrals(userId: string | null | undefined): Promise<Empfehlung[]> {
  if (!userId) return [];
  if (useRemote(userId)) {
    try {
      const { data, error } = await supabase!
        .from('hallen_empfehlungen')
        .select('id, halle_name, status, betrag_chf, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        halleName: r.halle_name,
        status: r.status,
        betragChf: r.betrag_chf,
        updatedAt: r.updated_at,
      }));
    } catch {
      return [];
    }
  }
  return getStorageJson<Array<Empfehlung & { userId: string }>>(LOCAL_REFERRALS_KEY, []).filter(r => r.userId === userId);
}

// ---------------------------------------------------------------------------
// Dankeschön, Link, Teilen-Text
// ---------------------------------------------------------------------------

export function formatChf(amount: number): string {
  const rounded = Math.round(amount);
  return `CHF ${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '’')}`;
}

/** SPEC-054 §1.2: dieselbe Regel wie die Partner-Provision (Anteil am ersten Jahr, nicht nur an der Einführungsgebühr) */
export function dankeschoenText(): string {
  return t('Dein Dankeschön: {pct} % von dem, was die Halle im ersten Jahr an BoulderMate zahlt.', { pct: Math.round(DANKESCHOEN_ANTEIL * 100) });
}

export function buildHallenLink(verzeichnisId: string, code?: string | null, baseUrl: string = HALLEN_LINK_BASE_URL): string {
  const url = new URL(baseUrl);
  url.searchParams.set(HALLEN_LINK_PARAM, verzeichnisId);
  if (code) url.searchParams.set(REF_PARAM, code);
  return url.toString();
}

export function buildShareText(opts: { wishCount: number; link: string }): string {
  const parts = [
    t('Hallo zusammen! Ich klettere gern bei euch und würde mich freuen, wenn ihr eure Routen in BoulderMate zeigt.'),
  ];
  if (opts.wishCount >= WUNSCH_ZAHL_AB) parts.push(t('{n} Kletterer wünschen sich das schon.', { n: opts.wishCount }));
  parts.push(t('Infos für euch: {link}', { link: opts.link }));
  return parts.join(' ');
}

export function buildMailto(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export interface HallenLink {
  /** null = allgemeiner Partner-Link `?ref=<code>` ohne Halle (SPEC-054 F5) */
  halleId: string | null;
  ref: string | null;
}

export function readHallenLinkFromUrl(href?: string): HallenLink | null {
  const source = href ?? (typeof window !== 'undefined' ? window.location.href : '');
  if (!source) return null;
  try {
    const url = new URL(source);
    const halleId = url.searchParams.get(HALLEN_LINK_PARAM)?.trim() || null;
    const ref = normalizeCode(url.searchParams.get(REF_PARAM));
    if (!halleId && !ref) return null;
    return { halleId, ref };
  } catch {
    return null;
  }
}

export function clearHallenLinkFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(HALLEN_LINK_PARAM) && !url.searchParams.has(REF_PARAM)) return;
    url.searchParams.delete(HALLEN_LINK_PARAM);
    url.searchParams.delete(REF_PARAM);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // ignore
  }
}

/** F4: Code 30 Tage merken, falls die Hallenleitung später schreibt */
export function savePendingRef(code: string, now: number = Date.now()): void {
  setStorageJson(PENDING_REF_KEY, { code, savedAt: now });
}

export function getPendingRef(now: number = Date.now()): string | null {
  const p = getStorageJson<{ code: string; savedAt: number } | null>(PENDING_REF_KEY, null);
  if (!p?.code || typeof p.savedAt !== 'number') return null;
  if (now - p.savedAt > PENDING_REF_MAX_AGE_MS) {
    removeStorageItem(PENDING_REF_KEY);
    return null;
  }
  return normalizeCode(p.code);
}

// ---------------------------------------------------------------------------
// F6: «Deine Halle ist jetzt dabei»
// ---------------------------------------------------------------------------

export function findNowActive(myWishIds: string[], rows: VerzeichnisHalle[]): VerzeichnisHalle[] {
  const seen = new Set(getStorageJson<string[]>(SEEN_ACTIVE_KEY, []));
  const wished = new Set(myWishIds);
  return rows.filter(r => wished.has(r.id) && r.gymId && !seen.has(r.id));
}

export function markNowActiveSeen(ids: string[]): void {
  const seen = new Set(getStorageJson<string[]>(SEEN_ACTIVE_KEY, []));
  ids.forEach(id => seen.add(id));
  setStorageJson(SEEN_ACTIVE_KEY, [...seen]);
}

// ---------------------------------------------------------------------------
// Hook für Karte, Blatt und «Ich»
// ---------------------------------------------------------------------------

export interface HallenVerzeichnisState {
  rows: VerzeichnisHalle[];
  wishCounts: Record<string, number>;
  myWishes: string[];
  loaded: boolean;
}

export function useHallenVerzeichnis(active: boolean, userId: string | null | undefined): HallenVerzeichnisState & { reload: () => void } {
  const [state, setState] = useState<HallenVerzeichnisState>({ rows: [], wishCounts: {}, myWishes: [], loaded: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    Promise.all([loadDirectory(), loadWishCounts(), loadMyWishes(userId)]).then(([rows, wishCounts, myWishes]) => {
      if (!cancelled) setState({ rows, wishCounts, myWishes, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [active, userId, tick]);

  useEffect(() => {
    const on = () => setTick(x => x + 1);
    window.addEventListener(HALLEN_CHANGED_EVENT, on);
    return () => window.removeEventListener(HALLEN_CHANGED_EVENT, on);
  }, []);

  return { ...state, reload: () => setTick(x => x + 1) };
}
