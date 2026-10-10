import React, { useEffect, useState } from 'react';
import { Users, Plus, LogIn, UserMinus } from 'lucide-react';
import { CurrentUser } from '../../types/boulder';
import { ListGroup, ListRow } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import {
  TrainingGroup,
  GroupMember,
  GROUP_CHANGED_EVENT,
  GROUP_ERROR_TEXT,
  GROUP_NAME_MAX,
  loadMyGroups,
  createGroup,
  previewGroup,
  joinGroup,
  removeMember,
  dissolveGroup,
  consentSentence,
  summarizeMember,
  memberDetail,
} from '../../lib/groupService';
import { t } from '../../lib/i18n';

const inputCls =
  'w-full min-h-[52px] rounded-xl bg-[var(--bm-bg)] border-2 border-[var(--bm-line)] px-3 text-[17px] text-[var(--bm-text)]';
const primaryBtn = 'w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold disabled:opacity-50';
const secondaryBtn = 'w-full min-h-[52px] rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold';

/** Code gut lesbar: «ABC 234». */
const formatCode = (c: string) => `${c.slice(0, 3)} ${c.slice(3)}`;

/**
 * SPEC-042 · Ich → Einstellungen → «Gruppen».
 */
export const GroupsSettings: React.FC<{ currentUser: CurrentUser }> = ({ currentUser }) => {
  const [owned, setOwned] = useState<TrainingGroup[]>([]);
  const [joined, setJoined] = useState<TrainingGroup[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [sheet, setSheet] = useState<null | 'create' | 'join' | { group: TrainingGroup }>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<null | { name: string; ownerNickname: string }>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<GroupMember | null>(null);
  const [confirm, setConfirm] = useState<null | { kind: 'dissolve' | 'leave' | 'remove'; group: TrainingGroup; member?: GroupMember }>(null);

  useEffect(() => {
    const load = () =>
      loadMyGroups(currentUser.id).then(r => {
        setOwned(r.owned);
        setJoined(r.joined);
        setMembers(r.members);
      });
    void load();
    window.addEventListener(GROUP_CHANGED_EVENT, load);
    return () => window.removeEventListener(GROUP_CHANGED_EVENT, load);
  }, [currentUser.id]);

  if (currentUser.id === 'guest') return null;

  const close = () => {
    setSheet(null);
    setName('');
    setCode('');
    setPreview(null);
    setError(null);
    setDetailFor(null);
  };

  const membersOf = (g: TrainingGroup) => members.filter(m => m.groupId === g.id);
  const openGroup = sheet && typeof sheet === 'object' ? sheet.group : null;
  const isOwner = openGroup?.ownerId === currentUser.id;
  const user = { id: currentUser.id, nickname: currentUser.nickname };

  return (
    <>
      <ListGroup title={t('Gruppen')} footer={t('Für Trainer und Kurse. Wer beitritt, stimmt zu, dass der Trainer seine Tops sieht.')}>
        {owned.map(g => (
          <ListRow
            key={g.id}
            icon={<Users className="w-5 h-5 text-[var(--bm-text-2)]" />}
            title={g.name}
            subtitle={t('Code {code} · {n} Mitglieder', { code: formatCode(g.code), n: membersOf(g).length })}
            onClick={() => setSheet({ group: g })}
            testId={`group-owned-${g.id}`}
          />
        ))}
        {joined.map(g => (
          <ListRow
            key={g.id}
            icon={<Users className="w-5 h-5 text-[var(--bm-text-2)]" />}
            title={g.name}
            subtitle={t('Trainer: {name}', { name: g.ownerNickname })}
            onClick={() => setSheet({ group: g })}
            testId={`group-joined-${g.id}`}
          />
        ))}
        <ListRow icon={<Plus className="w-5 h-5 text-[var(--bm-text-2)]" />} title={t('Gruppe gründen')} onClick={() => setSheet('create')} testId="group-create-open" />
        <ListRow icon={<LogIn className="w-5 h-5 text-[var(--bm-text-2)]" />} title={t('Gruppe beitreten')} onClick={() => setSheet('join')} testId="group-join-open" />
      </ListGroup>

      {/* Gründen */}
      <Sheet open={sheet === 'create'} onClose={close} fitContent testId="group-create-sheet" ariaLabel={t('Gruppe gründen')}>
        <div className="px-5 pt-2 space-y-4">
          <h2 className="text-[24px] font-bold">{t('Gruppe gründen')}</h2>
          <input
            className={inputCls}
            value={name}
            maxLength={GROUP_NAME_MAX}
            onChange={e => setName(e.target.value)}
            placeholder={t('z. B. Jugendgruppe Dienstag')}
            aria-label={t('Name der Gruppe')}
            data-testid="group-create-name"
          />
          {error && <p role="alert" className="text-[16px] font-semibold text-[var(--bm-danger)]">{error}</p>}
          <button
            type="button"
            className={primaryBtn}
            data-testid="group-create-save"
            onClick={async () => {
              const res = await createGroup(user, name);
              if (!res.ok) return setError(t(GROUP_ERROR_TEXT[res.error]));
              close();
              setSheet({ group: res.value });
              showToast({ message: t('Gruppe gegründet. Code: {code}', { code: formatCode(res.value.code) }) });
            }}
          >
            {t('Gründen')}
          </button>
        </div>
      </Sheet>

      {/* Beitreten */}
      <Sheet open={sheet === 'join'} onClose={close} fitContent testId="group-join-sheet" ariaLabel={t('Gruppe beitreten')}>
        <div className="px-5 pt-2 space-y-4">
          <h2 className="text-[24px] font-bold">{t('Gruppe beitreten')}</h2>
          {!preview ? (
            <>
              <input
                className={`${inputCls} tracking-[0.3em] uppercase text-[22px] font-bold text-center`}
                value={code}
                maxLength={8}
                onChange={e => setCode(e.target.value)}
                placeholder={t('Code')}
                aria-label={t('Code der Gruppe')}
                autoCapitalize="characters"
                data-testid="group-join-code"
              />
              {error && <p role="alert" className="text-[16px] font-semibold text-[var(--bm-danger)]" data-testid="group-join-error">{error}</p>}
              <button
                type="button"
                className={primaryBtn}
                data-testid="group-join-next"
                onClick={async () => {
                  const res = await previewGroup(currentUser.id, code);
                  if (!res.ok) return setError(t(GROUP_ERROR_TEXT[res.error]));
                  setError(null);
                  setPreview({ name: res.value.name, ownerNickname: res.value.ownerNickname });
                }}
              >
                {t('Weiter')}
              </button>
            </>
          ) : (
            <>
              <p className="text-[19px] font-bold">{preview.name}</p>
              <p className="text-[17px] leading-snug" data-testid="group-join-consent">
                {consentSentence(preview.ownerNickname)}
              </p>
              {error && <p role="alert" className="text-[16px] font-semibold text-[var(--bm-danger)]">{error}</p>}
              <button
                type="button"
                className={primaryBtn}
                data-testid="group-join-confirm"
                onClick={async () => {
                  const res = await joinGroup(user, code);
                  if (!res.ok) return setError(t(GROUP_ERROR_TEXT[res.error]));
                  close();
                  showToast({ message: t('Du bist in der Gruppe «{name}».', { name: preview.name }) });
                }}
              >
                {t('Beitreten')}
              </button>
            </>
          )}
        </div>
      </Sheet>

      {/* Gruppe ansehen */}
      <Sheet open={Boolean(openGroup)} onClose={close} fitContent testId="group-sheet" ariaLabel={t('Gruppe')}>
        {openGroup && (
          <div className="px-5 pt-2 space-y-4">
            <h2 className="text-[24px] font-bold">{openGroup.name}</h2>
            {isOwner ? (
              <>
                <p className="text-[17px]">
                  {t('Code zum Weitergeben:')}{' '}
                  <strong className="text-[24px] tracking-widest" data-testid="group-code">
                    {formatCode(openGroup.code)}
                  </strong>
                </p>
                {detailFor ? (
                  <MemberDetailView member={detailFor} onBack={() => setDetailFor(null)} />
                ) : (
                  <ul className="rounded-2xl bg-[var(--bm-elevated)] divide-y divide-[var(--bm-line)]" data-testid="group-member-list">
                    {membersOf(openGroup).length === 0 && <li className="px-4 py-4 text-[17px] text-[var(--bm-text-2)]">{t('Noch niemand beigetreten.')}</li>}
                    {membersOf(openGroup).map(m => {
                      const s = summarizeMember(m);
                      return (
                        <li key={m.userId} className="flex items-center gap-2 pr-2">
                          <button
                            type="button"
                            onClick={() => setDetailFor(m)}
                            className="flex-1 min-w-0 text-left px-4 py-3 min-h-[64px]"
                            data-testid={`group-member-${m.userId}`}
                          >
                            <span className="block text-[17px] font-semibold truncate">{m.nickname}</span>
                            <span className="block text-[15px] text-[var(--bm-text-2)]">
                              {t('{n} Tops in 4 Wochen · bester Grad {grade}', { n: s.topsLast4Weeks, grade: s.bestGrade ? s.bestGrade.toUpperCase() : '–' })} · {s.lastVisitText}
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label={t('{name} entfernen', { name: m.nickname })}
                            onClick={() => setConfirm({ kind: 'remove', group: openGroup, member: m })}
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            data-testid={`group-remove-${m.userId}`}
                          >
                            <UserMinus className="w-5 h-5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button type="button" className={`${secondaryBtn} text-[var(--bm-danger)]`} onClick={() => setConfirm({ kind: 'dissolve', group: openGroup })} data-testid="group-dissolve">
                  {t('Gruppe auflösen')}
                </button>
              </>
            ) : (
              <>
                <p className="text-[17px]">{t('Trainer: {name}', { name: openGroup.ownerNickname })}</p>
                <p className="text-[15px] text-[var(--bm-text-2)]">{consentSentence(openGroup.ownerNickname)}</p>
                <ul className="rounded-2xl bg-[var(--bm-elevated)] divide-y divide-[var(--bm-line)]" data-testid="group-member-names">
                  {membersOf(openGroup).map(m => (
                    <li key={m.userId} className="px-4 min-h-[48px] flex items-center text-[17px]">
                      {m.userId === currentUser.id ? t('{name} (du)', { name: m.nickname }) : m.nickname}
                    </li>
                  ))}
                </ul>
                <button type="button" className={secondaryBtn} onClick={() => setConfirm({ kind: 'leave', group: openGroup })} data-testid="group-leave">
                  {t('Austreten')}
                </button>
              </>
            )}
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.kind === 'dissolve'
            ? t('«{name}» auflösen?', { name: confirm.group.name })
            : confirm?.kind === 'leave'
              ? t('Aus «{name}» austreten?', { name: confirm.group.name })
              : t('{name} entfernen?', { name: confirm?.member?.nickname || '' })
        }
        message={confirm?.kind === 'leave' ? t('Der Trainer sieht deine Tops dann nicht mehr.') : undefined}
        confirmLabel={confirm?.kind === 'dissolve' ? t('Auflösen') : confirm?.kind === 'leave' ? t('Austreten') : t('Entfernen')}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm;
          setConfirm(null);
          if (!c) return;
          if (c.kind === 'dissolve') await dissolveGroup(currentUser.id, c.group.id);
          if (c.kind === 'leave') await removeMember(currentUser.id, c.group.id, currentUser.id);
          if (c.kind === 'remove' && c.member) await removeMember(currentUser.id, c.group.id, c.member.userId);
          if (c.kind !== 'remove') close();
        }}
      />
    </>
  );
};

/** Trainer-Detail: Pyramide und Verlauf 8 Wochen, keine Versuche, keine Bewertungen (F3). */
const MemberDetailView: React.FC<{ member: GroupMember; onBack: () => void }> = ({ member, onBack }) => {
  const d = memberDetail(member.userId);
  const max = Math.max(1, ...d.weeks.map(w => w.tops));
  return (
    <div className="space-y-3" data-testid="group-member-detail">
      <button type="button" onClick={onBack} className="min-h-[44px] text-[17px] text-[var(--bm-accent)]" data-testid="group-member-back">
        ‹ {t('Alle Mitglieder')}
      </button>
      <h3 className="text-[20px] font-bold">{member.nickname}</h3>
      <section>
        <h4 className="text-[17px] font-semibold mb-1">{t('Grade (8 Wochen)')}</h4>
        {d.pyramid.length === 0 ? (
          <p className="text-[16px] text-[var(--bm-text-2)]">{t('Noch keine Tops.')}</p>
        ) : (
          <ul className="space-y-1">
            {d.pyramid.map(p => (
              <li key={p.grade} className="flex items-center gap-3 text-[16px]" data-testid={`group-pyramid-${p.grade}`}>
                <span className="w-10 font-semibold">{p.grade.toUpperCase()}</span>
                <span>
                  {t('{n} Tops', { n: p.tops })}{p.flashes > 0 ? ` · ${p.flashes} ⚡` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h4 className="text-[17px] font-semibold mb-1">{t('Verlauf 8 Wochen')}</h4>
        <div className="flex items-end gap-1.5 h-20" aria-hidden>
          {d.weeks.map(w => (
            <div key={w.weekStart} className="flex-1 bg-[var(--bm-star)] rounded-t" style={{ height: `${(w.tops / max) * 100}%`, minHeight: w.tops ? 4 : 1 }} />
          ))}
        </div>
      </section>
    </div>
  );
};
