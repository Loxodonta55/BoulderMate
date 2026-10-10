import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import * as gymStorage from '../src/lib/gymStorage';
import { signOut } from '../src/lib/authService';
import { createDraftBoulder, publishBatch, getSectors, getGradeScales, clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { resetAscentAndRatingStorage, logAscent, addAttempt } from '../src/lib/ratingAndAscentService';
import { resetProfileStorage } from '../src/lib/profileService';
import {
  generateGroupCode,
  isValidGroupCode,
  normalizeGroupCode,
  createGroup,
  joinGroup,
  previewGroup,
  loadMyGroups,
  removeMember,
  dissolveGroup,
  summarizeMember,
  memberDetail,
  lastVisitText,
  GROUP_MAX_OWNED,
  GROUP_CODE_ALPHABET,
} from '../src/lib/groupService';
import { GroupsSettings } from '../src/components/me/GroupsSettings';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { CurrentUser } from '../src/types/boulder';

const GYM = 'gym-6a-plus';
const STEFAN = { id: 'trainer-stefan', nickname: 'Stefan' };
const KIM = { id: 'kim', nickname: 'Kim' };

function seed(name: string) {
  const sector = getSectors(GYM)[0];
  const scale = getGradeScales(GYM)[0];
  const b = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.3, positionY: 0.3, name, setterId: 'schrauber-6aplus' });
  publishBatch(sector.id, 'schrauber-6aplus');
  return b.id;
}

describe('SPEC-042: Trainings-Gruppen', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileStorage();
    resetAscentAndRatingStorage();
    clearBatchServiceStorage();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
    signOut();
  });
  afterEach(() => act(() => hideToast()));

  it('Code: 6 Zeichen, ohne 0, O, 1, I (AC-1)', () => {
    for (let i = 0; i < 200; i++) {
      const c = generateGroupCode();
      expect(c).toMatch(/^[A-Z2-9]{6}$/);
      expect(c).not.toMatch(/[01OI]/);
      expect(isValidGroupCode(c)).toBe(true);
    }
    expect(GROUP_CODE_ALPHABET).not.toMatch(/[01OI]/);
    expect(normalizeGroupCode(' abc-234 ')).toBe('ABC234');
    expect(isValidGroupCode('ABC10O')).toBe(false);
  });

  it('Beitreten nur mit gültigem Code; doppelt ändert nichts; eigene Gruppe nicht (AC-2)', async () => {
    const g = await createGroup(STEFAN, 'Jugend Dienstag');
    if (!g.ok) throw new Error(g.error);
    expect(await joinGroup(KIM, 'ZZZZZZ')).toEqual({ ok: false, error: 'not_found' });
    expect(await joinGroup(KIM, 'ab')).toEqual({ ok: false, error: 'code_invalid' });
    expect(await previewGroup(STEFAN.id, g.value.code)).toEqual({ ok: false, error: 'own_group' });
    expect(await joinGroup(KIM, g.value.code.toLowerCase())).toEqual({ ok: true });
    expect(await joinGroup(KIM, g.value.code)).toEqual({ ok: true });
    const { owned, members } = await loadMyGroups(STEFAN.id);
    expect(owned).toHaveLength(1);
    expect(members.filter(m => m.userId === KIM.id)).toHaveLength(1);
  });

  it('Trainer sieht Tops 4 Wochen, besten Grad, letzten Besuch – keine Versuche (AC-3)', async () => {
    const a = seed('A');
    const b = seed('B');
    logAscent(KIM.id, KIM.nickname, a, 'top');
    addAttempt(KIM.id, KIM.nickname, b);
    addAttempt(KIM.id, KIM.nickname, b);
    const s = summarizeMember({ userId: KIM.id, nickname: KIM.nickname });
    expect(s.topsLast4Weeks).toBe(1);
    expect(s.lastVisitText).toBe('heute');
    const d = memberDetail(KIM.id);
    expect(d.weeks).toHaveLength(8);
    expect(d.pyramid.reduce((n, p) => n + p.tops, 0)).toBe(1);
    expect(JSON.stringify(d)).not.toMatch(/attempts/);
    expect(lastVisitText(null)).toBe('noch nie');
  });

  it('Austreten und Entfernen wirken sofort; Grenze 3 eigene Gruppen (AC-5)', async () => {
    const g = await createGroup(STEFAN, 'G1');
    if (!g.ok) throw new Error(g.error);
    await createGroup(STEFAN, 'G2');
    await createGroup(STEFAN, 'G3');
    expect(await createGroup(STEFAN, 'G4')).toEqual({ ok: false, error: 'too_many_groups' });
    expect(GROUP_MAX_OWNED).toBe(3);
    await joinGroup(KIM, g.value.code);
    expect(await removeMember('fremd', g.value.id, KIM.id)).toBe(false);
    expect(await removeMember(STEFAN.id, g.value.id, KIM.id)).toBe(true);
    expect((await loadMyGroups(KIM.id)).joined).toHaveLength(0);
    await joinGroup(KIM, g.value.code);
    expect(await removeMember(KIM.id, g.value.id, KIM.id)).toBe(true);
    expect(await dissolveGroup(KIM.id, g.value.id)).toBe(false);
    expect(await dissolveGroup(STEFAN.id, g.value.id)).toBe(true);
    expect((await loadMyGroups(STEFAN.id)).owned).toHaveLength(2);
  });

  it('Oberfläche: gründen, Code anzeigen; beitreten mit Zustimmungs-Satz; Mitglieder sehen keine Zahlen (AC-2/AC-4)', async () => {
    const stefan: CurrentUser = { id: STEFAN.id, nickname: STEFAN.nickname, role: 'member', isPlatformAdmin: false };
    const kim: CurrentUser = { id: KIM.id, nickname: KIM.nickname, role: 'member', isPlatformAdmin: false };
    const { unmount } = render(
      <>
        <ToastHost />
        <GroupsSettings currentUser={stefan} />
      </>
    );
    fireEvent.click(screen.getByTestId('group-create-open'));
    fireEvent.change(screen.getByTestId('group-create-name'), { target: { value: 'Jugend' } });
    fireEvent.click(screen.getByTestId('group-create-save'));
    const codeEl = await screen.findByTestId('group-code');
    const code = codeEl.textContent!.replace(/\s/g, '');
    expect(isValidGroupCode(code)).toBe(true);
    unmount();

    render(
      <>
        <ToastHost />
        <GroupsSettings currentUser={kim} />
      </>
    );
    fireEvent.click(screen.getByTestId('group-join-open'));
    fireEvent.change(screen.getByTestId('group-join-code'), { target: { value: code } });
    fireEvent.click(screen.getByTestId('group-join-next'));
    expect(await screen.findByTestId('group-join-consent')).toHaveTextContent(
      'Stefan sieht deine Tops, Flashes und Projekte der letzten 8 Wochen. Du kannst jederzeit austreten. Unter 16? Frag zuerst deine Eltern.'
    );
    fireEvent.click(screen.getByTestId('group-join-confirm'));
    let joined: Awaited<ReturnType<typeof loadMyGroups>>['joined'] = [];
    await waitFor(async () => {
      joined = (await loadMyGroups(KIM.id)).joined;
      expect(joined).toHaveLength(1);
    });
    await waitFor(() => expect(screen.getByTestId(`group-joined-${joined[0].id}`)).toBeInTheDocument());
    fireEvent.click(screen.getByTestId(`group-joined-${joined[0].id}`));
    const names = screen.getByTestId('group-member-names');
    expect(names).toHaveTextContent('Kim (du)');
    expect(names.textContent).not.toMatch(/\d/);
    expect(screen.queryByTestId('group-member-list')).not.toBeInTheDocument();
  });
});
