import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { signOut } from '../src/lib/authService';
import { getUserRoleInfo } from '../src/lib/roleService';
import { resetProfileStorage, getProfile, updateProfile, STORAGE_KEY_PROFILES } from '../src/lib/profileService';
import { resetAscentAndRatingStorage, STORAGE_KEY_ASCENTS } from '../src/lib/ratingAndAscentService';
import { TREFF_STORE_KEY } from '../src/lib/treffService';
import { isNicknameAllowed, BLOCKED_WORDS } from '../src/lib/moderation/nicknameFilter';
import {
  ANONYMOUS_NAME,
  REPORT_DAILY_LIMIT,
  resetModerationState,
  hidePerson,
  showPersonAgain,
  isHiddenBetween,
  isAnonymousFor,
  visibleAvatar,
  reportPerson,
  getMyModeration,
  getPublicModeration,
  listProfileReports,
  moderateProfile,
  objectToModeration,
  acknowledgeNotice,
  isEligibleReporter,
  countOpenReports,
} from '../src/lib/moderation/moderationService';
import { CONTACT_EMAIL } from '../src/lib/contact';
import { ProfileSafetyButtons } from '../src/components/moderation/ProfileSafetyButtons';
import { SafetySettingsGroup } from '../src/components/moderation/SafetySettingsGroup';
import { ModerationNotice } from '../src/components/moderation/ModerationNotice';
import { PublicProfileModal } from '../src/components/PublicProfileModal';
import { MeView } from '../src/components/MeView';
import { GroupsSettings } from '../src/components/me/GroupsSettings';
import { createGroup, joinGroup, loadMyGroups } from '../src/lib/groupService';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { CurrentUser } from '../src/types/boulder';

const ADMIN = 'user-boris';
const HANS = 'hans-kletterer';
const OLD = '2026-01-01T10:00:00Z';

/** Konten älter als 7 Tage mit einer Begehung zählen fürs vorläufige Verstecken */
function seedPeople(ids: string[], opts: { old?: boolean; ascent?: boolean } = { old: true, ascent: true }) {
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || '[]');
  const ascents = JSON.parse(localStorage.getItem(STORAGE_KEY_ASCENTS) || '[]');
  for (const id of ids) {
    profiles.push({ id, nickname: id, createdAt: opts.old ? OLD : new Date().toISOString() });
    if (opts.ascent) ascents.push({ id: `a-${id}`, userId: id, boulderId: 'b-x', type: 'top', createdAt: OLD });
  }
  localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  localStorage.setItem(STORAGE_KEY_ASCENTS, JSON.stringify(ascents));
}

describe('SPEC-046 Melden und Ausblenden', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileStorage();
    resetAscentAndRatingStorage();
    resetModerationState();
    localStorage.setItem(STORAGE_KEY_ASCENTS, '[]');
    signOut();
  });
  afterEach(() => act(() => hideToast()));

  describe('Wortliste für Namen (§4.6)', () => {
    it('lässt echte Namen und Kletternamen durch', () => {
      for (const n of ['Hakan', 'Dick', 'Dickfinger', 'Klettermax1988', 'Anna-Lena', 'Mia', 'Kletterer 0042']) {
        expect(isNicknameAllowed(n), n).toBe(true);
      }
    });
    it('stoppt ganze Schimpfwörter, auch mit Ziffern statt Buchstaben', () => {
      for (const n of ['4rschl0ch', 'Max 88', 'du arschloch', 'HITLER']) {
        expect(isNicknameAllowed(n), n).toBe(false);
      }
      expect(isNicknameAllowed('Bergfloh', ['bergfloh'])).toBe(false);
    });
    it('gleiche Liste wie in der Datenbank', () => {
      const sql = readFileSync(resolve(__dirname, '../supabase/migrations/20261022_spec046_melden.sql'), 'utf8');
      for (const w of BLOCKED_WORDS) expect(sql, w).toContain(`('${w}')`);
    });
    it('updateProfile übernimmt einen verbotenen Namen nicht', () => {
      const before = getProfile(HANS).nickname;
      updateProfile(HANS, { nickname: '4rschl0ch' });
      expect(getProfile(HANS).nickname).toBe(before);
    });
  });

  describe('Ausblenden (§4.3)', () => {
    it('wirkt in beide Richtungen und zeigt «Jemand»; rückgängig in den Einstellungen', async () => {
      expect(await hidePerson(HANS, { userId: 'mia', nickname: 'Mia' })).toBe(true);
      expect(isHiddenBetween(HANS, 'mia')).toBe(true);
      expect(isHiddenBetween('mia', HANS)).toBe(true);
      expect(isAnonymousFor(HANS, 'mia')).toBe(true);
      expect(isAnonymousFor('mia', HANS)).toBe(true);
      expect(isAnonymousFor('dritte', 'mia')).toBe(false);
      expect(isAnonymousFor('mia', 'mia')).toBe(false);
      expect(ANONYMOUS_NAME).toBe('Jemand');
      await showPersonAgain(HANS, 'mia');
      expect(isHiddenBetween(HANS, 'mia')).toBe(false);
    });
    it('sich selbst ausblenden geht nicht', async () => {
      expect(await hidePerson(HANS, { userId: HANS, nickname: 'Hans' })).toBe(false);
    });
  });

  describe('Melden (§4.2, §4.4)', () => {
    it('speichert Grund, Satz und einen Schnappschuss; höchstens 5 pro Tag', async () => {
      seedPeople(['mia']);
      expect(await reportPerson(HANS, { userId: 'mia', nickname: 'Mia' }, 'anderes', '  zu laut  ')).toBe('ok');
      const list = await listProfileReports(ADMIN);
      expect(list).toHaveLength(1);
      expect(list[0].note).toBe('zu laut');
      expect(list[0].snapshot).toContain('mia');
      for (let i = 1; i < REPORT_DAILY_LIMIT; i++) {
        expect(await reportPerson(HANS, { userId: `p${i}`, nickname: `P${i}` }, 'anderes')).toBe('ok');
      }
      expect(await reportPerson(HANS, { userId: 'p9', nickname: 'P9' }, 'anderes')).toBe('limit');
      expect(await reportPerson(HANS, { userId: HANS, nickname: 'Hans' }, 'anderes')).toBe('self');
    });

    it('nach 3 eingesessenen Meldenden wird das Bild vorläufig versteckt; frische Konten zählen nicht', async () => {
      seedPeople(['r1', 'r2', 'r3']);
      seedPeople(['neu1', 'neu2', 'neu3'], { old: false, ascent: true });
      seedPeople(['ohne'], { old: true, ascent: false });
      expect(isEligibleReporter('r1')).toBe(true);
      expect(isEligibleReporter('neu1')).toBe(false);
      expect(isEligibleReporter('ohne')).toBe(false);
      const target = { userId: 'ziel', nickname: 'Ziel', avatarUrl: 'https://x/bild.jpg' };
      for (const r of ['neu1', 'neu2', 'neu3', 'ohne']) await reportPerson(r, target, 'bild');
      expect(getPublicModeration('ziel').avatarHidden).toBe(false);
      await reportPerson('r1', target, 'bild');
      await reportPerson('r2', target, 'bild');
      expect(getPublicModeration('ziel').avatarHidden).toBe(false);
      await reportPerson('r3', target, 'bild');
      expect(getPublicModeration('ziel').avatarHidden).toBe(true);
      expect(getPublicModeration('ziel').nameHidden).toBe(false);
      expect(visibleAvatar('ziel', target.avatarUrl)).toBeUndefined();
      expect(getMyModeration('ziel').notice).toBe('pending_bild');
    });

    it('vorläufig versteckter Name erscheint als «Jemand»', async () => {
      seedPeople(['r1', 'r2', 'r3']);
      for (const r of ['r1', 'r2', 'r3']) await reportPerson(r, { userId: 'ziel', nickname: 'Ziel' }, 'name');
      expect(isAnonymousFor(HANS, 'ziel')).toBe(true);
      expect(isAnonymousFor('ziel', 'ziel')).toBe(false);
    });
  });

  describe('Die betroffene Person und der Admin (§4.4, §4.5)', () => {
    it('Einspruch landet beim Admin, Admin setzt Namen zurück, Hinweis bis «OK»', async () => {
      seedPeople(['r1', 'r2', 'r3', 'ziel']);
      for (const r of ['r1', 'r2', 'r3']) await reportPerson(r, { userId: 'ziel', nickname: 'ziel' }, 'name');
      expect(await objectToModeration('ziel', 'Das ist mein echter Name')).toBe(true);
      const [first] = await listProfileReports(ADMIN);
      expect(first.reportedNote).toBe('Das ist mein echter Name');
      expect(first.nameHidden).toBe(true);
      expect(first.timesReported).toBe(3);

      expect(await listProfileReports(HANS)).toEqual([]);
      expect(await moderateProfile(HANS, first, 'reset_name')).toBe(false);
      expect(await moderateProfile(ADMIN, first, 'reset_name')).toBe(true);
      expect(getProfile('ziel').nickname).toMatch(/^Kletterer \d{4}$/);
      expect(getPublicModeration('ziel').nameHidden).toBe(false);
      expect(await listProfileReports(ADMIN)).toHaveLength(0);
      expect(getMyModeration('ziel').notice).toBe('decided_name_reset');
      await acknowledgeNotice('ziel');
      expect(getMyModeration('ziel').notice).toBeUndefined();
    });

    it('Bild entfernen braucht eine Regel; Sperren bleibt stehen', async () => {
      await reportPerson(HANS, { userId: 'ziel', nickname: 'Ziel' }, 'bild');
      const [r] = await listProfileReports(ADMIN);
      expect(await moderateProfile(ADMIN, r, 'remove_avatar')).toBe(false);
      expect(await moderateProfile(ADMIN, r, 'remove_avatar', 'werbung')).toBe(true);
      expect(getMyModeration('ziel').notice).toBe('decided_bild_removed:werbung');

      await reportPerson(HANS, { userId: 'ziel', nickname: 'Ziel' }, 'belaestigung');
      const [r2] = await listProfileReports(ADMIN);
      await moderateProfile(ADMIN, r2, 'ban');
      expect(getPublicModeration('ziel').banned).toBe(true);
      expect(isAnonymousFor(HANS, 'ziel')).toBe(true);
      await acknowledgeNotice('ziel');
      expect(getMyModeration('ziel').notice).toBe('banned');
    });

    it('Trainer und versteckte Profile stehen oben', async () => {
      localStorage.setItem('boulderapp_groups_v1', JSON.stringify({ groups: [{ ownerId: 'trainer' }] }));
      seedPeople(['r1', 'r2', 'r3']);
      await reportPerson(HANS, { userId: 'normal', nickname: 'N' }, 'anderes');
      await reportPerson(HANS, { userId: 'trainer', nickname: 'T' }, 'anderes');
      for (const r of ['r1', 'r2', 'r3']) await reportPerson(r, { userId: 'versteckt', nickname: 'V' }, 'bild');
      const list = await listProfileReports(ADMIN);
      expect(list[0].reportedUserId).toBe('versteckt');
      expect(list.find(x => x.reportedUserId !== 'versteckt')?.reportedUserId).toBe('trainer');
      expect(await countOpenReports(ADMIN)).toBe(5);
    });
  });

  describe('Oberfläche', () => {
    it('Profil: eigene Person ohne Knöpfe, Gäste sehen die Adresse', () => {
      const { unmount } = render(<PublicProfileModal userId={HANS} isOpen onClose={() => {}} viewerId={HANS} />);
      expect(screen.queryByTestId('profile-safety')).toBeNull();
      unmount();
      render(<PublicProfileModal userId={HANS} isOpen onClose={() => {}} />);
      expect(screen.getByTestId('profile-safety-guest')).toHaveTextContent(CONTACT_EMAIL);
    });

    it('Melden mit «auch ausblenden»: Danke-Seite, Person verschwindet', async () => {
      let hidden = false;
      render(
        <>
          <ToastHost />
          <ProfileSafetyButtons viewerId={HANS} target={{ userId: 'mia', nickname: 'Mia' }} onHidden={() => (hidden = true)} />
        </>
      );
      fireEvent.click(screen.getByTestId('profile-report'));
      const sheet = await screen.findByTestId('report-sheet');
      expect(within(sheet).getByRole('heading', { name: 'Mia melden' })).toBeInTheDocument();
      expect(within(sheet).getByTestId('report-who-sees')).toBeInTheDocument();
      expect(within(sheet).getByTestId('report-emergency')).toHaveTextContent('112');
      expect(within(sheet).getByTestId('report-submit')).toBeDisabled();
      expect(within(sheet).queryByTestId('report-also-hide')).toBeNull();
      fireEvent.click(within(sheet).getByTestId('report-reason-belaestigung'));
      expect(within(sheet).getByTestId('report-also-hide')).toBeChecked();
      fireEvent.change(within(sheet).getByTestId('report-note'), { target: { value: 'schreibt mir dauernd' } });
      fireEvent.click(within(sheet).getByTestId('report-submit'));
      expect(await within(sheet).findByTestId('report-thanks')).toBeInTheDocument();
      expect(hidden).toBe(false);
      fireEvent.click(within(sheet).getByTestId('report-close'));
      expect(hidden).toBe(true);
      expect(isHiddenBetween(HANS, 'mia')).toBe(true);
      const [r] = await listProfileReports(ADMIN);
      expect(r.reason).toBe('belaestigung');
      expect(r.note).toBe('schreibt mir dauernd');
    });

    it('Ausblenden fragt mit ehrlichem Text nach', async () => {
      render(
        <>
          <ToastHost />
          <ProfileSafetyButtons viewerId={HANS} target={{ userId: 'mia', nickname: 'Mia' }} />
        </>
      );
      fireEvent.click(screen.getByTestId('profile-block'));
      expect(screen.getByText(/wer genau hinschaut, kann das merken/)).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('confirm-ok'));
      await waitFor(() => expect(isHiddenBetween(HANS, 'mia')).toBe(true));
    });

    it('Gruppe: Mitglieder können melden, aber nicht ausblenden', async () => {
      const g = await createGroup({ id: 'trainer-stefan', nickname: 'Stefan' }, 'Jugend');
      if (!g.ok) throw new Error('Gruppe');
      await joinGroup({ id: 'kim', nickname: 'Kim' }, g.value.code);
      await joinGroup({ id: 'lea', nickname: 'Lea' }, g.value.code);
      const kim: CurrentUser = { id: 'kim', nickname: 'Kim', role: 'member', isPlatformAdmin: false };
      render(<GroupsSettings currentUser={kim} />);
      const joined = (await loadMyGroups('kim')).joined;
      fireEvent.click(await screen.findByTestId(`group-joined-${joined[0].id}`));
      expect(screen.getByTestId('group-report-owner')).toBeInTheDocument();
      expect(screen.getByTestId('group-report-lea')).toBeInTheDocument();
      expect(screen.queryByTestId('group-report-kim')).toBeNull();
      expect(screen.queryByTestId('profile-block')).toBeNull();
    });

    it('Hinweis: vorläufig versteckt mit Einspruch, entschieden mit «OK»', async () => {
      seedPeople(['r1', 'r2', 'r3']);
      for (const r of ['r1', 'r2', 'r3']) await reportPerson(r, { userId: HANS, nickname: 'Hans' }, 'bild');
      render(
        <>
          <ToastHost />
          <ModerationNotice userId={HANS} />
        </>
      );
      expect(screen.getByTestId('moderation-notice')).toHaveTextContent('Profilbild ist vorläufig versteckt');
      expect(screen.queryByTestId('moderation-ack')).toBeNull();
      fireEvent.click(screen.getByTestId('moderation-object'));
      await waitFor(() => expect(screen.queryByTestId('moderation-object')).toBeNull());
      const [r] = await listProfileReports(ADMIN);
      expect(r.reportedNote).toBe('Das ist ein Fehler.');

      await act(async () => {
        await moderateProfile(ADMIN, r, 'restore');
      });
      expect(screen.getByTestId('moderation-notice')).toHaveTextContent('wieder freigegeben');
      fireEvent.click(screen.getByTestId('moderation-ack'));
      await waitFor(() => expect(screen.queryByTestId('moderation-notice')).toBeNull());
    });

    it('Admin-Liste: Foto unscharf, Bild entfernen nur mit Regel', async () => {
      await reportPerson(HANS, { userId: 'ziel', nickname: 'Ziel', avatarUrl: 'https://x/b.jpg' }, 'bild');
      const [r] = await listProfileReports(ADMIN);
      render(
        <>
          <ToastHost />
          <SafetySettingsGroup userId={ADMIN} isPlatformAdmin openReportsCount={1} />
        </>
      );
      fireEvent.click(screen.getByTestId('settings-treff-reports'));
      const card = await screen.findByTestId(`admin-profile-report-${r.id}`);
      fireEvent.click(within(card).getByTestId(`admin-remove-avatar-${r.id}`));
      fireEvent.click(await within(card).findByTestId(`admin-rule-nacktheit-${r.id}`));
      await waitFor(() => expect(screen.queryByTestId(`admin-profile-report-${r.id}`)).toBeNull());
      expect(getMyModeration('ziel').notice).toBe('decided_bild_removed:nacktheit');
    });

    it('Einstellungen: Hilfe-Fenster, Regeln, falscher Name, gesperrt', async () => {
      const user: CurrentUser = { id: HANS, nickname: 'Hans', role: 'member', isPlatformAdmin: false };
      const renderMe = () =>
        render(
          <>
            <ToastHost />
            <MeView currentUser={user} activeGymId="gym-6a-plus" roleInfo={getUserRoleInfo(HANS, 'gym-6a-plus')} onSwitchMode={() => {}} onLogout={() => {}} />
          </>
        );
      const { unmount } = renderMe();
      fireEvent.click(screen.getByTestId('open-settings-btn'));
      expect(screen.getByTestId('settings-rules-consent')).toHaveTextContent('Fair bleiben');
      const input = screen.getByTestId('settings-name-input');
      fireEvent.change(input, { target: { value: 'Max 88' } });
      fireEvent.blur(input);
      expect(await screen.findByTestId('settings-name-error')).toHaveTextContent(CONTACT_EMAIL);
      fireEvent.click(screen.getByTestId('settings-safety-help'));
      expect(await screen.findByTestId('safety-help-sheet')).toBeInTheDocument();
      unmount();

      await reportPerson(ADMIN, { userId: HANS, nickname: 'Hans' }, 'belaestigung');
      const [r] = await listProfileReports(ADMIN);
      await moderateProfile(ADMIN, r, 'ban');
      renderMe();
      expect(screen.getByTestId('moderation-notice')).toHaveTextContent(CONTACT_EMAIL);
      fireEvent.click(screen.getByTestId('open-settings-btn'));
      expect(screen.getByTestId('settings-name-input')).toBeDisabled();
      expect(screen.getByTestId('settings-rules-consent')).toHaveTextContent('gesperrt');
    });

    it('Admin sieht die Zahl offener Meldungen am Zahnrad', async () => {
      await reportPerson(HANS, { userId: 'ziel', nickname: 'Ziel' }, 'anderes');
      const boris: CurrentUser = { id: ADMIN, nickname: 'Boris', role: 'member', isPlatformAdmin: true };
      render(<MeView currentUser={boris} activeGymId="gym-6a-plus" roleInfo={getUserRoleInfo(ADMIN, 'gym-6a-plus')} onSwitchMode={() => {}} onLogout={() => {}} />);
      expect(await screen.findByTestId('moderation-open-count')).toHaveTextContent('1');
    });

    it('Treff-Ausblendungen und Profil-Ausblendungen sind dieselbe Liste', async () => {
      await hidePerson(HANS, { userId: 'mia', nickname: 'Mia' });
      expect(JSON.parse(localStorage.getItem(TREFF_STORE_KEY) || '{}').blocks).toEqual([
        expect.objectContaining({ blockerId: HANS, blockedId: 'mia' }),
      ]);
    });
  });
});
