import { describe, it, expect, beforeEach } from 'vitest';
import * as gymStorage from '../src/lib/gymStorage';
import {
  TreffEntry,
  TREFF_STORE_KEY,
  validateTreffInput,
  combineDayTime,
  toDayKey,
  treffDayOptions,
  formatTreffDay,
  formatTreffTime,
  formatGradeRange,
  treffPhase,
  splitTreffEntries,
  filterByGym,
  filterBlocked,
  toPublicEntry,
  treffCompanions,
  countOpenEntries,
  buildNowInput,
  buildReportSnapshot,
  isExpiredForCleanup,
  nextHalfHour,
  toRemoteGymId,
  fromRemoteGymId,
  useRemote,
  getTreffSettings,
  saveTreffSettings,
  createTreffEntry,
  checkInNow,
  joinTreffEntry,
  loadTreffEntries,
  loadPublicTreffEntries,
  deleteTreffEntry,
  deleteAllMyTreffEntries,
  blockTreffUser,
  unblockTreffUser,
  listMyTreffBlocks,
  reportTreffEntry,
  listOpenTreffReports,
  handleTreffReport,
  cleanupLocalTreff,
  isTreffEnabledForGym,
  setGymTreffEnabled,
} from '../src/lib/treffService';

const GYM = 'gym-6a-plus';
const NOW = new Date(2026, 9, 16, 17, 10); // Fr 16. Okt. 2026, 17:10
const A = { id: 'treff-a', nickname: 'Anna' };
const B = { id: 'treff-b', nickname: 'Ben' };

function entry(id: string, userId: string, start: Date, end: Date, gymId = GYM): TreffEntry {
  return { id, userId, gymId, startsAt: start.toISOString(), endsAt: end.toISOString(), nickname: userId, createdAt: start.toISOString() };
}

function at(h: number, m = 0, dayOffset = 0): Date {
  return new Date(2026, 9, 16 + dayOffset, h, m);
}

async function consent(userId: string) {
  await saveTreffSettings({ userId, consentAt: NOW.toISOString(), ageConfirmed: true });
}

describe('SPEC-028 Treff – Hilfsfunktionen', () => {
  it('prüft Pflichtfelder, Reihenfolge, Vergangenheit, 14 Tage, Satzlänge und Niveau', () => {
    const ok = { gymId: GYM, day: '2026-10-16', from: '18:00', to: '21:00' };
    expect(validateTreffInput(ok, NOW)).toBeNull();
    expect(validateTreffInput({ ...ok, gymId: '' }, NOW)).toBe('gym_missing');
    expect(validateTreffInput({ ...ok, day: '' }, NOW)).toBe('day_missing');
    expect(validateTreffInput({ ...ok, to: '17:00' }, NOW)).toBe('time_order');
    expect(validateTreffInput({ ...ok, from: '08:00', to: '10:00' }, NOW)).toBe('in_past');
    expect(validateTreffInput({ ...ok, day: '2026-10-30' }, NOW)).toBeNull();
    expect(validateTreffInput({ ...ok, day: '2026-10-31' }, NOW)).toBe('too_far');
    expect(validateTreffInput({ ...ok, note: 'x'.repeat(121) }, NOW)).toBe('note_too_long');
    expect(validateTreffInput({ ...ok, note: 'x'.repeat(120) }, NOW)).toBeNull();
    expect(validateTreffInput({ ...ok, gradeMin: '7a', gradeMax: '6a' }, NOW)).toBe('grade_order');
  });

  it('läuft gerade = gültig (Zeitfenster hat schon begonnen)', () => {
    expect(validateTreffInput({ gymId: GYM, day: '2026-10-16', from: '16:00', to: '19:00' }, NOW)).toBeNull();
  });

  it('formatiert Tag und Zeit gut lesbar', () => {
    expect(formatTreffDay(at(18).toISOString(), NOW)).toBe('Heute');
    expect(formatTreffDay(at(18, 0, 1).toISOString(), NOW)).toBe('Morgen');
    expect(formatTreffDay(at(18, 0, 3).toISOString(), NOW)).toBe('Mo 19.');
    expect(formatTreffTime({ startsAt: at(18).toISOString(), endsAt: at(21).toISOString() })).toBe('18–21 Uhr');
    expect(formatTreffTime({ startsAt: at(18, 30).toISOString(), endsAt: at(21).toISOString() })).toBe('18:30–21 Uhr');
    expect(formatGradeRange('6a', '6b')).toBe('6A–6B');
    expect(formatGradeRange('6b+', '6b+')).toBe('6B+');
    expect(formatGradeRange(undefined, undefined)).toBeNull();
  });

  it('bietet heute + 14 Tage und halbe Stunden an', () => {
    const days = treffDayOptions(NOW);
    expect(days).toHaveLength(15);
    expect(days[0]).toEqual({ key: '2026-10-16', label: 'Heute' });
    expect(days[1].label).toBe('Morgen');
    expect(toDayKey(combineDayTime('2026-10-16', '18:30'))).toBe('2026-10-16');
    expect(nextHalfHour(NOW)).toBe('17:30');
    expect(nextHalfHour(at(17, 45))).toBe('18:00');
    expect(nextHalfHour(at(18, 0))).toBe('18:00');
  });

  it('teilt in «Jetzt da» und «Kommt noch», Abgelaufenes fällt weg', () => {
    const now1 = entry('n', 'x', at(16), at(19));
    const later1 = entry('l', 'y', at(19), at(21));
    const later2 = entry('l2', 'z', at(18, 0, 1), at(20, 0, 1));
    const over = entry('o', 'w', at(10), at(12));
    expect(treffPhase(now1, NOW)).toBe('now');
    expect(treffPhase(later1, NOW)).toBe('later');
    expect(treffPhase(over, NOW)).toBe('over');
    const split = splitTreffEntries([later2, over, later1, now1], NOW);
    expect(split.now.map(e => e.id)).toEqual(['n']);
    expect(split.later.map(e => e.id)).toEqual(['l', 'l2']);
  });

  it('filtert nach Halle und blendet in beide Richtungen aus', () => {
    const list = [entry('1', 'x', at(18), at(20)), entry('2', 'y', at(18), at(20), 'gym-minimum-zh')];
    expect(filterByGym(list, 'gym', GYM).map(e => e.id)).toEqual(['1']);
    expect(filterByGym(list, 'all', GYM)).toHaveLength(2);
    const blocks = [{ blockerId: 'me', blockedId: 'x' }, { blockerId: 'y', blockedId: 'me' }];
    expect(filterBlocked(list, 'me', blocks)).toHaveLength(0);
    expect(filterBlocked(list, 'other', blocks)).toHaveLength(2);
  });

  it('Gast-Ansicht hat keine Personen-Daten', () => {
    const pub = toPublicEntry({ ...entry('1', 'x', at(18), at(20)), note: 'geheim', avatarUrl: 'a.png', gradeMin: '6a' });
    expect(Object.keys(pub).sort()).toEqual(['endsAt', 'gradeMax', 'gradeMin', 'gymId', 'id', 'startsAt']);
  });

  it('«Auch da» = andere Personen mit überlappender Zeit in derselben Halle', () => {
    const mine = entry('1', 'a', at(18), at(21));
    const all = [
      mine,
      entry('2', 'b', at(19), at(22)),
      entry('3', 'c', at(21), at(23)), // beginnt genau beim Ende → keine Überlappung
      entry('4', 'd', at(18), at(20), 'gym-minimum-zh'),
      entry('5', 'b', at(18), at(19)), // gleiche Person nur einmal
    ];
    expect(treffCompanions(mine, all).map(e => e.userId)).toEqual(['b']);
  });

  it('«Ich bin jetzt da» = ab jetzt 2 Stunden, nie über Mitternacht', () => {
    const r = buildNowInput(GYM, NOW);
    expect(new Date(r.endsAt).getTime() - new Date(r.startsAt).getTime()).toBe(2 * 3600 * 1000);
    const late = buildNowInput(GYM, at(23, 0));
    expect(new Date(late.endsAt).getDate()).toBe(16);
  });

  it('zählt offene Einträge, räumt 1 Tag nach Ende auf, Meldung mit Kopie', () => {
    const list = [entry('1', 'a', at(18), at(20)), entry('2', 'a', at(10), at(12)), entry('3', 'b', at(18), at(20))];
    expect(countOpenEntries(list, 'a', NOW)).toBe(1);
    expect(isExpiredForCleanup({ endsAt: at(12).toISOString() }, NOW)).toBe(false);
    expect(isExpiredForCleanup({ endsAt: at(12, 0, -2).toISOString() }, NOW)).toBe(true);
    const snap = buildReportSnapshot({ ...entry('1', 'a', at(18), at(20)), nickname: 'Anna', note: 'Hallo', gradeMin: '6a', gradeMax: '6b' });
    expect(snap).toContain('Anna');
    expect(snap).toContain('18–20 Uhr');
    expect(snap).toContain('6A–6B');
    expect(snap).toContain('«Hallo»');
  });

  it('Hallen-IDs lokal ↔ Supabase', () => {
    expect(toRemoteGymId('gym-6a-plus')).toBe('f2b11564-ca86-4ed4-b51c-3affb346144b');
    expect(fromRemoteGymId('814696b2-303e-4897-9bdb-d83505a63489')).toBe('gym-minimum-zh');
    expect(fromRemoteGymId('abc')).toBe('abc');
  });

  it('in Tests wird immer lokal gespeichert (F17)', () => {
    expect(useRemote('8f0e7c5e-1111-4222-8333-944455556666')).toBe(false);
    expect(useRemote(null)).toBe(false);
  });
});

describe('SPEC-028 Treff – Speichern (lokal)', () => {
  beforeEach(() => {
    localStorage.clear();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
  });

  it('ohne Hinweis + Häkchen kein Eintrag, Gäste nie', async () => {
    const r = await checkInNow(A, GYM, undefined, NOW);
    expect(r).toEqual({ ok: false, error: 'no_consent' });
    expect(await checkInNow({ id: 'guest', nickname: 'Gast' }, GYM, undefined, NOW)).toEqual({ ok: false, error: 'guest' });
    expect(await checkInNow(null, GYM, undefined, NOW)).toEqual({ ok: false, error: 'guest' });
  });

  it('Einstellungen: Standard, Häkchen, Sperre lässt sich nicht selbst aufheben', async () => {
    expect(getTreffSettings(A.id)).toMatchObject({ ageConfirmed: false, showGrade: true, hidden: false, banned: false });
    await consent(A.id);
    expect(getTreffSettings(A.id).ageConfirmed).toBe(true);
    await saveTreffSettings({ userId: A.id, banned: true } as any);
    expect(getTreffSettings(A.id).banned).toBe(false);
  });

  it('eintragen, höchstens 3 offene, Niveau nur wenn erlaubt', async () => {
    await consent(A.id);
    const base = { gymId: GYM, from: '18:00', to: '20:00', gradeMin: '6a', gradeMax: '6b', note: '  Bin am Überhang  ' };
    const r1 = await createTreffEntry(A, { ...base, day: '2026-10-16' }, NOW);
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.value.note).toBe('Bin am Überhang');
      expect(r1.value.gradeMin).toBe('6a');
    }
    expect((await createTreffEntry(A, { ...base, day: '2026-10-17' }, NOW)).ok).toBe(true);
    expect((await createTreffEntry(A, { ...base, day: '2026-10-18' }, NOW)).ok).toBe(true);
    expect(await createTreffEntry(A, { ...base, day: '2026-10-19' }, NOW)).toEqual({ ok: false, error: 'limit' });

    await saveTreffSettings({ userId: B.id, consentAt: NOW.toISOString(), ageConfirmed: true, showGrade: false });
    const rb = await createTreffEntry(B, { ...base, day: '2026-10-16' }, NOW);
    expect(rb.ok && rb.value.gradeMin).toBeFalsy();
  });

  it('«Ich komme auch» legt eigenen Eintrag an, nicht doppelt', async () => {
    await consent(A.id);
    await consent(B.id);
    const ra = await createTreffEntry(A, { gymId: GYM, day: '2026-10-16', from: '18:00', to: '21:00' }, NOW);
    if (!ra.ok) throw new Error('setup');
    const all = (await loadTreffEntries(B.id, NOW)).entries;
    const rj = await joinTreffEntry(B, ra.value, all, undefined, NOW);
    expect(rj.ok).toBe(true);
    if (rj.ok) {
      expect(rj.value.userId).toBe(B.id);
      expect(rj.value.startsAt).toBe(ra.value.startsAt);
    }
    const after = (await loadTreffEntries(A.id, NOW)).entries;
    expect(treffCompanions(ra.value, after).map(e => e.nickname)).toEqual(['Ben']);
    expect(await joinTreffEntry(B, ra.value, after, undefined, NOW)).toEqual({ ok: false, error: 'already' });
  });

  it('Gast-Liste ohne Namen; Ausblenden wirkt in beide Richtungen und ist rückgängig', async () => {
    await consent(A.id);
    await consent(B.id);
    await createTreffEntry(A, { gymId: GYM, day: '2026-10-16', from: '18:00', to: '21:00' }, NOW);
    await createTreffEntry(B, { gymId: GYM, day: '2026-10-16', from: '18:00', to: '21:00' }, NOW);

    const pub = (await loadPublicTreffEntries(NOW)).entries;
    expect(pub).toHaveLength(2);
    expect(JSON.stringify(pub)).not.toContain('Anna');

    await blockTreffUser(B.id, A.id, 'Anna');
    expect((await loadTreffEntries(B.id, NOW)).entries.map(e => e.userId)).toEqual([B.id]);
    expect((await loadTreffEntries(A.id, NOW)).entries.map(e => e.userId)).toEqual([A.id]);
    expect(await listMyTreffBlocks(B.id)).toEqual([{ blockerId: B.id, blockedId: A.id, blockedNickname: 'Anna' }]);
    expect(await listMyTreffBlocks(A.id)).toEqual([]);
    await unblockTreffUser(B.id, A.id);
    expect((await loadTreffEntries(B.id, NOW)).entries).toHaveLength(2);
  });

  it('löschen: nur eigene; «Meine Einträge löschen»', async () => {
    await consent(A.id);
    await consent(B.id);
    const ra = await createTreffEntry(A, { gymId: GYM, day: '2026-10-16', from: '18:00', to: '21:00' }, NOW);
    await createTreffEntry(A, { gymId: GYM, day: '2026-10-17', from: '18:00', to: '21:00' }, NOW);
    if (!ra.ok) throw new Error('setup');
    expect(await deleteTreffEntry(B.id, ra.value.id)).toBe(false);
    expect(await deleteTreffEntry(A.id, ra.value.id)).toBe(true);
    expect((await loadTreffEntries(A.id, NOW)).entries).toHaveLength(1);
    await deleteAllMyTreffEntries(A.id);
    expect((await loadTreffEntries(A.id, NOW)).entries).toHaveLength(0);
  });

  it('Melden → nur Plattform-Admin sieht es; Sperren verhindert Eintragen', async () => {
    await consent(A.id);
    await consent(B.id);
    const ra = await createTreffEntry(A, { gymId: GYM, day: '2026-10-16', from: '18:00', to: '21:00', note: 'Hallo' }, NOW);
    if (!ra.ok) throw new Error('setup');
    expect(await reportTreffEntry(B.id, ra.value, 'spam')).toBe(true);
    expect(await listOpenTreffReports(B.id)).toEqual([]);
    const reports = await listOpenTreffReports('user-boris');
    expect(reports).toHaveLength(1);
    expect(reports[0].snapshot).toContain('«Hallo»');
    expect(await handleTreffReport(B.id, reports[0], 'ban_user')).toBe(false);
    expect(await handleTreffReport('user-boris', reports[0], 'ban_user')).toBe(true);
    expect(await listOpenTreffReports('user-boris')).toEqual([]);
    expect((await loadTreffEntries(B.id, NOW)).entries.some(e => e.userId === A.id)).toBe(false);
    expect(await checkInNow(A, GYM, undefined, NOW)).toEqual({ ok: false, error: 'banned' });
  });

  it('Halle kann Treff abschalten (nur Hallen-Admin)', async () => {
    await consent(A.id);
    expect(isTreffEnabledForGym(GYM)).toBe(true);
    expect(setGymTreffEnabled(GYM, 'hans-kletterer', false)).toBe(false);
    expect(setGymTreffEnabled(GYM, 'admin-6aplus', false)).toBe(true);
    expect(isTreffEnabledForGym(GYM)).toBe(false);
    expect(await checkInNow(A, GYM, undefined, NOW)).toEqual({ ok: false, error: 'gym_disabled' });
  });

  it('räumt lokal 1 Tag nach Ende auf', () => {
    localStorage.setItem(
      TREFF_STORE_KEY,
      JSON.stringify({ entries: [entry('alt', 'a', at(10, 0, -3), at(12, 0, -3)), entry('neu', 'a', at(18), at(20))] })
    );
    expect(cleanupLocalTreff(NOW)).toBe(1);
  });
});
