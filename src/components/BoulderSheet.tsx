import React, { useEffect, useMemo, useState } from 'react';
import { Zap, Check, Target, X, Star, MessageCircle, Trash2, Send, UserRound } from 'lucide-react';
import {
  WallBoulder,
  Sector,
  GymGradeScale,
  CurrentUser,
  AscentType,
  RatingInput,
} from '../types/boulder';
import {
  getAscents,
  getRatings,
  getComments,
  addComment,
  deleteComment,
  getUserAscent,
  getUserRating,
  logAscent,
  deleteAscent,
  addAttempt,
  restoreAscent,
  saveRating,
  deleteRating,
  computeBoulderStatsAggregate,
  isUserMatch,
} from '../lib/ratingAndAscentService';
import { syncBridge } from '../lib/syncBridge';
import { PublicProfileModal } from './PublicProfileModal';
import { getProfile, isShownInLists } from '../lib/profileService';
import { isDeviceOnline } from '../lib/pendingSync';
import { readableTextOn } from '../lib/boulderNumbers';
import { FirstStepsCard } from './basis/FirstStepsCard';
import { InfoTip, FONT_HELP, GRADE_FEEL_HELP } from './basis/InfoTip';
import { Sheet } from './ui/Sheet';
import { showToast, hideToast } from './ui/Toast';
import { RadarChart } from './RadarChart';
import { RatingModal } from './RatingModal';
import { useBackHandler } from '../hooks/useBackHandler';
import { t, useLang } from '../lib/i18n';

/**
 * SPEC-020 §5.2 · Ein einziges Boulder-Sheet (ersetzt Detail-Modal + separate Flows).
 * Halb: Kopf + 3 grosse Log-Buttons (1 Tap = geloggt, Sheet schliesst, Undo-Toast) + «Bewerten»-Knopf.
 * Voll: Community, Charakter, Beta, eigene Einträge.
 */
export interface BoulderSheetProps {
  boulder: WallBoulder;
  sector?: Sector;
  gradeScale?: GymGradeScale;
  currentUser: CurrentUser;
  isGuest?: boolean;
  onRequireLogin?: () => void;
  onClose: () => void;
  /** SPEC-032 F7: Nummer an der Wand */
  number?: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

export function resolveSetterName(setterId?: string): string {
  if (!setterId) return t('Hallenteam');
  try {
    const p = getProfile(setterId);
    if (p?.nickname && !UUID_RE.test(p.nickname) && p.nickname !== setterId) return p.nickname;
  } catch {
    /* ignore */
  }
  return UUID_RE.test(setterId) ? t('Hallenteam') : setterId;
}

const ASCENT_LABEL: Record<AscentType, string> = { flash: 'Flash', top: 'Top', project: 'Projekt' };

const ascentIcon = (type: AscentType): React.ReactNode =>
  ({
    flash: <Zap className="w-4 h-4 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-label={t('Flash')} />,
    top: <Check className="w-4 h-4 text-[var(--bm-success)]" aria-label={t('Top')} />,
    project: <Target className="w-4 h-4 text-[var(--bm-text-2)]" aria-label={t('Projekt')} />,
  })[type];

const FEEL_LABEL: Record<string, string> = { soft: 'Soft', fair: 'Fair', stiff: 'Stiff' };

/** SPEC-033 F2: so heissen Personen, die ihren Namen verbergen */
export const ANONYMOUS_NAME = 'Jemand';

/** SPEC-032 F4 / SPEC-035 F3: Toast-Text nach dem Loggen */
export function logToastMessage(type: AscentType, attempts: number | undefined, online: boolean): string {
  const label = t(ASCENT_LABEL[type]);
  const base = type === 'top' && attempts && attempts > 1 ? t('Top im {n}. Versuch', { n: attempts }) : t('{label} geloggt', { label });
  return online
    ? base
    : t('{text} · wird gesendet, sobald Netz da ist', { text: type === 'top' && attempts && attempts > 1 ? base : t('{label} gespeichert', { label }) });
}

function vibrate() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
  } catch {
    /* ignore */
  }
}

export const BoulderSheet: React.FC<BoulderSheetProps> = ({
  boulder,
  sector,
  gradeScale,
  currentUser,
  isGuest = false,
  onRequireLogin,
  onClose,
  number,
}) => {
  useLang();
  const [isBetaOpen, setIsBetaOpen] = useState(false);
  const [detent, setDetent] = useState<'half' | 'full'>('half');
  const [version, setVersion] = useState(0);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  useBackHandler({ id: 'boulder-sheet-rating', isOpen: isRatingOpen, onBack: () => setIsRatingOpen(false) });
  useBackHandler({ id: 'boulder-sheet-profile', isOpen: Boolean(profileUserId), onBack: () => setProfileUserId(null) });

  // Beim Öffnen still mit Supabase abgleichen (wie zuvor im Detail-Modal)
  useEffect(() => {
    syncBridge.syncRatingsAndAscentsQuietly();
  }, [boulder.id]);

  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener('bouldermate:ratings_updated', bump);
    window.addEventListener('bouldermate:ascents_updated', bump);
    return () => {
      window.removeEventListener('bouldermate:ratings_updated', bump);
      window.removeEventListener('bouldermate:ascents_updated', bump);
    };
  }, []);

  const stats = useMemo(
    () => computeBoulderStatsAggregate(boulder, getRatings(boulder.id), getAscents(boulder.id), getComments(boulder.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boulder, version]
  );
  const myAscent = isGuest ? null : getUserAscent(currentUser.id, boulder.id);
  const myRating = isGuest ? null : getUserRating(currentUser.id, boulder.id);

  const title = boulder.name?.trim() || `${gradeScale?.colorName || 'Boulder'}`;
  const gradeText = gradeScale
    ? gradeScale.fontRangeMin && gradeScale.fontRangeMax
      ? `${gradeScale.fontRangeMin}–${gradeScale.fontRangeMax}`
      : gradeScale.difficultyLabel
    : boulder.fontGrade || '';
  const subtitle = [gradeText, gradeScale?.difficultyLabel && gradeScale.difficultyLabel !== gradeText ? gradeScale.difficultyLabel : null, sector?.name]
    .filter(Boolean)
    .join(' · ');

  const rateStars = (stars: number) => {
    saveRating(currentUser.id, currentUser.nickname, boulder.id, { qualityStars: stars });
    hideToast();
    showToast({ message: stars === 1 ? t('Danke! {n} Stern gespeichert', { n: stars }) : t('Danke! {n} Sterne gespeichert', { n: stars }), durationMs: 2000 });
  };

  const handleLog = (type: AscentType) => {
    if (isGuest) {
      onRequireLogin?.();
      return;
    }
    const previous = getUserAscent(currentUser.id, boulder.id);
    if (previous?.type === type) return;
    const { ascent } = logAscent(currentUser.id, currentUser.nickname, boulder.id, type, currentUser.avatarUrl);
    vibrate();
    const askForStars = type !== 'project' && !getUserRating(currentUser.id, boulder.id)?.qualityStars;
    showToast({
      message: logToastMessage(type, ascent.attempts, isDeviceOnline()),
      actionLabel: t('Rückgängig'),
      durationMs: 8000,
      onAction: () => restoreAscent(currentUser.id, boulder.id, previous ? { ...previous } : null),
      content: askForStars ? (
        <div className="flex items-center gap-2" data-testid="toast-stars">
          <span className="text-[13px] text-[var(--bm-text-2)]">{t("Wie war's?")}</span>
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              type="button"
              aria-label={t('{n} Sterne', { n: s })}
              data-testid={`toast-star-${s}`}
              onClick={() => rateStars(s)}
              className="p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <Star className="w-6 h-6 text-[var(--bm-star)]" />
            </button>
          ))}
        </div>
      ) : undefined,
    });
    onClose(); // CONSTITUTION §11.2: sofort zurück zur Wand
  };

  // SPEC-035 F2: «+1 Versuch» – Sheet bleibt offen
  const handleAddAttempt = () => {
    if (isGuest) {
      onRequireLogin?.();
      return;
    }
    const { ascent, previous } = addAttempt(currentUser.id, currentUser.nickname, boulder.id, currentUser.avatarUrl);
    vibrate();
    setVersion(v => v + 1);
    showToast({
      message: isDeviceOnline() ? t('{n}. Versuch', { n: String(ascent.attempts) }) : t('{n}. Versuch · wird später gesendet', { n: String(ascent.attempts) }),
      actionLabel: t('Rückgängig'),
      onAction: () => {
        restoreAscent(currentUser.id, boulder.id, previous);
        setVersion(v => v + 1);
      },
    });
  };

  const handleRemoveAscent = () => {
    const previous = getUserAscent(currentUser.id, boulder.id);
    if (!previous) return;
    deleteAscent(currentUser.id, boulder.id);
    showToast({
      message: t('Eintrag entfernt'),
      actionLabel: t('Rückgängig'),
      onAction: () => logAscent(currentUser.id, currentUser.nickname, boulder.id, previous.type, currentUser.avatarUrl),
    });
  };

  const handleRemoveRating = () => {
    const previous = getUserRating(currentUser.id, boulder.id);
    if (!previous) return;
    deleteRating(currentUser.id, boulder.id);
    showToast({
      message: t('Bewertung entfernt'),
      actionLabel: t('Rückgängig'),
      onAction: () =>
        saveRating(currentUser.id, currentUser.nickname, boulder.id, {
          gradeFeel: previous.gradeFeel,
          qualityStars: previous.qualityStars,
          radar: previous.radar,
        }),
    });
  };

  const handleSaveRating = (input: RatingInput) => {
    saveRating(currentUser.id, currentUser.nickname, boulder.id, input);
    setIsRatingOpen(false);
    showToast({ message: t('Bewertung gespeichert'), durationMs: 2000 });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireLogin?.();
      return;
    }
    if (!commentText.trim()) return;
    addComment(currentUser.id, currentUser.nickname, boulder.id, commentText.trim(), currentUser.avatarUrl);
    setCommentText('');
    setVersion(v => v + 1);
  };

  const commentAnonymous = (userId: string) => !isUserMatch(userId, currentUser.id) && !isShownInLists(userId);

  const feel = stats.gradeFeelPercentages;
  const hasFeel = stats.gradeFeelCounts.soft + stats.gradeFeelCounts.fair + stats.gradeFeelCounts.stiff > 0;

  // Begehungen und Bewertungen anderer pro Person zusammengeführt
  const climbers = useMemo(() => {
    const rows: { userId: string; nickname: string; ascent?: (typeof stats.ascents)[number]; rating?: (typeof stats.ratings)[number] }[] = [];
    for (const a of stats.ascents) {
      rows.push({ userId: a.userId, nickname: a.userNickname, ascent: a });
    }
    for (const r of stats.ratings || []) {
      const row = rows.find(x => isUserMatch(x.userId, r.userId));
      if (row) row.rating = r;
      else rows.push({ userId: r.userId, nickname: r.userNickname || t('Kletterer'), rating: r });
    }
    return rows;
  }, [stats]);

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        detent={detent}
        onDetentChange={setDetent}
        testId="boulder-sheet"
        ariaLabel={t('Boulder {name}', { name: title })}
      >
        <div className="px-5">
          {/* Kopf */}
          <div className="flex items-start gap-3 pt-1">
            <span
              className="mt-0.5 w-9 h-9 rounded-full shrink-0 ring-1 ring-black/10 flex items-center justify-center text-[17px] font-bold tabular-nums"
              style={{ backgroundColor: gradeScale?.colorHex || 'var(--bm-text-3)', color: readableTextOn(gradeScale?.colorHex) }}
              data-testid="boulder-sheet-number"
              aria-label={number ? t('Nummer {n}', { n: number }) : undefined}
            >
              {number ?? ''}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-semibold leading-tight truncate" data-testid="boulder-sheet-title">
                {title}
              </h2>
              <p className="text-[15px] text-[var(--bm-text-2)] flex flex-wrap items-center gap-x-2">
                <span className="truncate max-w-full">{subtitle}</span>
                {gradeText && <InfoTip text={FONT_HELP} label={t('Was heisst Font?')} testId="info-font" />}
              </p>
              <p className="text-[14px] text-[var(--bm-text-2)] flex items-center gap-1 mt-0.5">
                {stats.totalRatings > 0 ? (
                  <>
                    <Star className="w-3.5 h-3.5 fill-[var(--bm-star)] text-[var(--bm-star)]" />
                    <span className="text-[var(--bm-text)] font-medium">{stats.avgStars.toFixed(1)}</span>
                    <span>({stats.totalRatings})</span>
                  </>
                ) : (
                  <span>{t('Noch keine Bewertung')}</span>
                )}
                <span aria-hidden>·</span>
                <span>{t('{n} Tops', { n: stats.totalTops + stats.totalFlashes })}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('Schliessen')}
              data-testid="boulder-sheet-close"
              className="w-8 h-8 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4 text-[var(--bm-text-2)]" />
            </button>
          </div>

          {/* SPEC-032 F9: Erste Schritte (nur einmal) */}
          <FirstStepsCard showVisibilityHint={!isGuest} />

          {/* 2-Tap-Logging */}
          <div className="grid grid-cols-3 gap-2.5 mt-5" data-testid="ascent-logging-card">
            {(
              [
                { type: 'flash' as AscentType, label: t('Flash'), Icon: Zap },
                { type: 'top' as AscentType, label: t('Top'), Icon: Check },
                { type: 'project' as AscentType, label: t('Projekt'), Icon: Target },
              ]
            ).map(({ type, label, Icon }) => {
              const active = myAscent?.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  data-testid={`log-${type}-btn`}
                  aria-pressed={active}
                  onClick={() => handleLog(type)}
                  className={`min-h-[64px] rounded-2xl flex flex-col items-center justify-center gap-1 text-[15px] font-semibold transition active:scale-[0.97] ${
                    active
                      ? 'bg-[var(--bm-accent)] text-[var(--bm-on-accent)]'
                      : 'bg-[var(--bm-elevated)] text-[var(--bm-text)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              );
            })}
          </div>
          {isGuest && (
            <p className="text-[14px] text-[var(--bm-text-2)] text-center mt-2">{t('Zum Loggen anmelden')}</p>
          )}

          {/* SPEC-035 F2: Versuche zählen, ohne Formular */}
          {!isGuest && myAscent?.type !== 'flash' && myAscent?.type !== 'top' && (
            <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-[var(--bm-elevated)] px-4 min-h-[52px]" data-testid="attempts-row">
              <span className="text-[16px] text-[var(--bm-text)]">
                {t('Versuche:')} <span className="font-bold tabular-nums" data-testid="attempts-count">{myAscent?.attempts || 0}</span>
              </span>
              <button
                type="button"
                data-testid="attempt-plus-btn"
                onClick={handleAddAttempt}
                aria-label={t('Einen Versuch dazuzählen')}
                className="min-h-[44px] min-w-[64px] px-4 rounded-xl bg-[var(--bm-surface)] text-[17px] font-bold text-[var(--bm-text)] active:scale-[0.97]"
              >
                +1
              </button>
            </div>
          )}
          {!isGuest && (myAscent?.type === 'top' || myAscent?.type === 'flash') && myAscent.attempts ? (
            <p className="mt-2 text-[15px] text-[var(--bm-text-2)] text-center" data-testid="attempts-done">
              {myAscent.type === 'flash' ? t('Im ersten Versuch') : t('Im {n}. Versuch', { n: myAscent.attempts })}
            </p>
          ) : null}

          {/* Bewerten mit einem Tap, geht nie von selbst auf (SPEC-022 F23) */}
          <button
            type="button"
            data-testid="quick-rate-btn"
            aria-label={myRating?.qualityStars ? t('Bewertung ändern (deine Wertung: {n} von 5)', { n: myRating.qualityStars }) : t('Bewerten')}
            onClick={() => (isGuest ? onRequireLogin?.() : setIsRatingOpen(true))}
            className="w-full mt-2.5 min-h-[56px] rounded-2xl border-2 border-[var(--bm-star)] bg-[var(--bm-elevated)] text-[var(--bm-text)] text-[17px] font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Star className="w-6 h-6 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-hidden />
            {myRating?.qualityStars ? (
              <span>
                {myRating.qualityStars === 1
                  ? t('Deine Bewertung: {n} Stern · ändern', { n: myRating.qualityStars })
                  : t('Deine Bewertung: {n} Sterne · ändern', { n: myRating.qualityStars })}
              </span>
            ) : (
              <span>{t('Bewerten')}</span>
            )}
          </button>

          {detent === 'half' && (
            <button
              type="button"
              onClick={() => setDetent('full')}
              data-testid="boulder-sheet-more"
              className="w-full mt-3 min-h-[44px] text-[15px] font-medium text-[var(--bm-accent)]"
            >
              {t('Details')}
            </button>
          )}

          {detent === 'full' && (
            <div className="mt-6 space-y-6 pb-4" data-testid="boulder-sheet-details">
              {/* Community */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold">{t('Community')}</h3>
                  {!isGuest && (
                    <button
                      type="button"
                      data-testid="open-rating-btn"
                      onClick={() => setIsRatingOpen(true)}
                      className="text-[15px] font-medium text-[var(--bm-accent)] min-h-[36px]"
                    >
                      {myRating ? t('Bewertung ändern') : t('Bewerten')}
                    </button>
                  )}
                </div>
                <div className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-4">
                  <div className="flex items-end gap-3">
                    <span className="text-[34px] font-semibold leading-none tabular-nums">
                      {stats.totalRatings > 0 ? stats.avgStars.toFixed(1) : '–'}
                    </span>
                    <div className="pb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(stats.avgStars)
                                ? 'fill-[var(--bm-star)] text-[var(--bm-star)]'
                                : 'text-[var(--bm-text-3)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[14px] text-[var(--bm-text-2)]">
                        {stats.totalRatings === 1 ? t('{n} Bewertung', { n: stats.totalRatings }) : t('{n} Bewertungen', { n: stats.totalRatings })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5" data-testid="grade-barometer">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="text-[15px] font-medium">{t('Grad-Gefühl')}</span>
                      <InfoTip text={GRADE_FEEL_HELP} label={t('Was heisst Soft, Fair, Stiff?')} testId="info-grade-feel" />
                    </div>
                    <div className="flex justify-between text-[14px] text-[var(--bm-text-2)]">
                      <span>Soft</span>
                      <span>Fair</span>
                      <span>Stiff</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden flex bg-[var(--bm-line)]">
                      {hasFeel && (
                        <>
                          <span style={{ width: `${feel.soft}%` }} className="bg-[var(--bm-success)]" />
                          <span style={{ width: `${feel.fair}%` }} className="bg-[var(--bm-text-2)]" />
                          <span style={{ width: `${feel.stiff}%` }} className="bg-[var(--bm-danger)]" />
                        </>
                      )}
                    </div>
                    <p className="text-[14px] text-[var(--bm-text-2)]">
                      {hasFeel
                        ? stats.dominantGradeFeel === 'soft'
                          ? t('Grad fühlt sich eher leicht an')
                          : stats.dominantGradeFeel === 'stiff'
                            ? t('Grad fühlt sich eher hart an')
                            : t('Grad fühlt sich passend an')
                        : t('Noch keine Grad-Einschätzung')}
                    </p>
                  </div>
                </div>
              </section>

              {/* Charakter */}
              <section className="space-y-3">
                <h3 className="text-[17px] font-semibold">{t('Charakter')}</h3>
                <div className="rounded-2xl bg-[var(--bm-elevated)] p-4 flex justify-center">
                  <RadarChart data={stats.radarAggregate} size={220} showLabels accentColor="var(--bm-accent)" />
                </div>
                <p className="text-[14px] text-[var(--bm-text-2)]">{t('Geschraubt von {name}', { name: resolveSetterName(boulder.setterId) })}</p>
                {boulder.notes && <p className="text-[15px] text-[var(--bm-text)]">{boulder.notes}</p>}
              </section>

              {/* SPEC-022 F8: Wer war schon oben (SPEC-015 AC-16) */}
              <section className="space-y-3" data-testid="community-ratings-section">
                <h3 className="text-[17px] font-semibold">
                  {t('Wer war schon oben')} <span className="text-[var(--bm-text-2)] font-normal">{climbers.length}</span>
                </h3>
                {climbers.length === 0 ? (
                  <p className="text-[15px] text-[var(--bm-text-2)]">{t('Noch niemand.')}</p>
                ) : (
                  <ul className="rounded-2xl bg-[var(--bm-elevated)] overflow-hidden divide-y divide-[var(--bm-line)]">
                    {climbers.map(c => {
                      // SPEC-033 F2/F3: verborgene Personen als «Jemand», ohne Buchstabe und Profil-Link
                      const isMe = isUserMatch(c.userId, currentUser.id);
                      const hidden = !isShownInLists(c.userId);
                      const anonymous = hidden && !isMe;
                      return (
                      <li key={c.userId}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!anonymous) setProfileUserId(c.userId);
                          }}
                          disabled={anonymous}
                          data-testid={c.rating ? `community-rating-row-${c.userId}` : `community-ascent-row-${c.userId}`}
                          data-anonymous={anonymous ? 'true' : undefined}
                          className="w-full min-h-[52px] px-4 py-2 flex items-center gap-3 text-left disabled:cursor-default"
                        >
                          <span className="w-8 h-8 rounded-full bg-[var(--bm-surface)] flex items-center justify-center text-[14px] font-semibold shrink-0">
                            {anonymous ? <UserRound className="w-4 h-4 text-[var(--bm-text-2)]" aria-hidden /> : c.nickname.charAt(0).toUpperCase()}
                          </span>
                          <span className="flex-1 min-w-0 text-[15px] truncate">
                            {anonymous ? t(ANONYMOUS_NAME) : c.nickname}
                            {isMe && hidden && (
                              <span className="text-[var(--bm-text-2)]"> {t('(nur für dich sichtbar)')}</span>
                            )}
                          </span>
                          {c.rating?.qualityStars ? (
                            <span className="flex items-center gap-0.5 text-[15px] tabular-nums text-[var(--bm-text-2)]">
                              <Star className="w-3.5 h-3.5 fill-[var(--bm-star)] text-[var(--bm-star)]" />
                              {c.rating.qualityStars}
                            </span>
                          ) : null}
                          {c.rating?.gradeFeel && (
                            <span className="text-[14px] text-[var(--bm-text-2)]">{FEEL_LABEL[c.rating.gradeFeel]}</span>
                          )}
                          {c.ascent && ascentIcon(c.ascent.type)}
                        </button>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Beta – SPEC-032 F11: zugeklappt, damit nichts verraten wird */}
              <section className="space-y-3" data-testid="beta-section">
                <h3 className="text-[17px] font-semibold flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[var(--bm-text-2)]" />
                  Beta <span className="text-[var(--bm-text-2)] font-normal">{stats.comments.length}</span>
                </h3>
                {!isBetaOpen ? (
                  <button
                    type="button"
                    data-testid="beta-toggle"
                    onClick={() => setIsBetaOpen(true)}
                    className="w-full min-h-[52px] rounded-2xl bg-[var(--bm-elevated)] text-[16px] font-semibold text-[var(--bm-text)]"
                  >
                    {stats.comments.length > 0 ? t('Beta anzeigen ({n})', { n: stats.comments.length }) : t('Beta schreiben')}
                  </button>
                ) : (
                <>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={t('Tipp für diesen Boulder…')}
                    data-testid="boulder-comment-input"
                    className="flex-1 min-h-[44px] px-4 rounded-full bg-[var(--bm-elevated)] text-[15px] text-[var(--bm-text)] placeholder:text-[var(--bm-text-3)] outline-none focus:ring-2 focus:ring-[var(--bm-accent)]"
                  />
                  <button
                    type="submit"
                    aria-label={t('Senden')}
                    disabled={!commentText.trim()}
                    data-testid="boulder-comment-submit"
                    className="w-11 h-11 rounded-full bg-[var(--bm-accent)] text-[var(--bm-on-accent)] flex items-center justify-center disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <ul className="space-y-3">
                  {stats.comments.map(c => {
                    const canDelete = c.userId === currentUser.id || currentUser.isPlatformAdmin;
                    return (
                      <li key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
                        <span className="w-8 h-8 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center text-[14px] font-semibold shrink-0">
                          {commentAnonymous(c.userId) ? <UserRound className="w-4 h-4 text-[var(--bm-text-2)]" aria-hidden /> : c.userNickname.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] text-[var(--bm-text-2)]">{commentAnonymous(c.userId) ? t(ANONYMOUS_NAME) : c.userNickname}</p>
                          <p className="text-[15px]">{c.text}</p>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            aria-label={t('Kommentar löschen')}
                            data-testid={`delete-comment-${c.id}`}
                            onClick={() => {
                              deleteComment(c.id, currentUser.id, currentUser.isPlatformAdmin);
                              setVersion(v => v + 1);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-[var(--bm-text-3)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                </>
                )}
              </section>

              {/* Eigene Einträge – destruktiv, aber mit Undo */}
              {!isGuest && (myAscent || myRating) && (
                <section className="rounded-2xl bg-[var(--bm-elevated)] divide-y divide-[var(--bm-line)] overflow-hidden">
                  {myAscent && (
                    <button
                      type="button"
                      data-testid="delete-ascent-btn"
                      onClick={handleRemoveAscent}
                      className="w-full text-left px-4 min-h-[48px] text-[15px] text-[var(--bm-danger)]"
                    >
                      {t('{label}-Eintrag entfernen', { label: t(ASCENT_LABEL[myAscent.type]) })}
                    </button>
                  )}
                  {myRating && (
                    <button
                      type="button"
                      data-testid="delete-rating-btn"
                      onClick={handleRemoveRating}
                      className="w-full text-left px-4 min-h-[48px] text-[15px] text-[var(--bm-danger)]"
                    >
                      {t('Meine Bewertung entfernen')}
                    </button>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </Sheet>

      {/* Über dem Sheet (z-60) anzeigen */}
      <div className="relative z-[70]">
      {profileUserId && (
        <PublicProfileModal userId={profileUserId} isOpen onClose={() => setProfileUserId(null)} />
      )}

      {isRatingOpen && (
        <RatingModal
          boulder={boulder}
          gradeScale={gradeScale}
          currentUser={currentUser}
          existingRating={myRating}
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          onSave={handleSaveRating}
        />
      )}
      </div>
    </>
  );
};
