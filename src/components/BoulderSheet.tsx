import React, { useEffect, useMemo, useState } from 'react';
import { Zap, Check, Target, X, Star, MessageCircle, Trash2, Send } from 'lucide-react';
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
  saveRating,
  deleteRating,
  computeBoulderStatsAggregate,
} from '../lib/ratingAndAscentService';
import { getProfile } from '../lib/profileService';
import { Sheet } from './ui/Sheet';
import { showToast, hideToast } from './ui/Toast';
import { RadarChart } from './RadarChart';
import { RatingModal } from './RatingModal';
import { useBackHandler } from '../hooks/useBackHandler';

/**
 * SPEC-020 §5.2 · Ein einziges Boulder-Sheet (ersetzt Detail-Modal + separate Flows).
 * Halb: Kopf + 3 grosse Log-Buttons (1 Tap = geloggt, Sheet schliesst, Undo-Toast).
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
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

export function resolveSetterName(setterId?: string): string {
  if (!setterId) return 'Hallenteam';
  try {
    const p = getProfile(setterId);
    if (p?.nickname && !UUID_RE.test(p.nickname) && p.nickname !== setterId) return p.nickname;
  } catch {
    /* ignore */
  }
  return UUID_RE.test(setterId) ? 'Hallenteam' : setterId;
}

const ASCENT_LABEL: Record<AscentType, string> = { flash: 'Flash', top: 'Top', project: 'Projekt' };

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
}) => {
  const [detent, setDetent] = useState<'half' | 'full'>('half');
  const [version, setVersion] = useState(0);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  useBackHandler({ id: 'boulder-sheet-rating', isOpen: isRatingOpen, onBack: () => setIsRatingOpen(false) });

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
    showToast({ message: `Danke! ${stars} ${stars === 1 ? 'Stern' : 'Sterne'} gespeichert`, durationMs: 2000 });
  };

  const handleLog = (type: AscentType) => {
    if (isGuest) {
      onRequireLogin?.();
      return;
    }
    const previous = getUserAscent(currentUser.id, boulder.id);
    if (previous?.type === type) return;
    logAscent(currentUser.id, currentUser.nickname, boulder.id, type, currentUser.avatarUrl);
    vibrate();
    const askForStars = type !== 'project' && !getUserRating(currentUser.id, boulder.id)?.qualityStars;
    showToast({
      message: `${ASCENT_LABEL[type]} geloggt`,
      actionLabel: 'Rückgängig',
      durationMs: askForStars ? 6000 : 4000,
      onAction: () => {
        if (previous) logAscent(currentUser.id, currentUser.nickname, boulder.id, previous.type, currentUser.avatarUrl);
        else deleteAscent(currentUser.id, boulder.id);
      },
      content: askForStars ? (
        <div className="flex items-center gap-2" data-testid="toast-stars">
          <span className="text-[13px] text-[var(--bm-text-2)]">Wie war's?</span>
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              type="button"
              aria-label={`${s} Sterne`}
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

  const handleRemoveAscent = () => {
    const previous = getUserAscent(currentUser.id, boulder.id);
    if (!previous) return;
    deleteAscent(currentUser.id, boulder.id);
    showToast({
      message: 'Eintrag entfernt',
      actionLabel: 'Rückgängig',
      onAction: () => logAscent(currentUser.id, currentUser.nickname, boulder.id, previous.type, currentUser.avatarUrl),
    });
  };

  const handleRemoveRating = () => {
    const previous = getUserRating(currentUser.id, boulder.id);
    if (!previous) return;
    deleteRating(currentUser.id, boulder.id);
    showToast({
      message: 'Bewertung entfernt',
      actionLabel: 'Rückgängig',
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
    showToast({ message: 'Bewertung gespeichert', durationMs: 2000 });
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

  const feel = stats.gradeFeelPercentages;
  const hasFeel = stats.gradeFeelCounts.soft + stats.gradeFeelCounts.fair + stats.gradeFeelCounts.stiff > 0;

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        detent={detent}
        onDetentChange={setDetent}
        testId="boulder-sheet"
        ariaLabel={`Boulder ${title}`}
      >
        <div className="px-5">
          {/* Kopf */}
          <div className="flex items-start gap-3 pt-1">
            <span
              className="mt-1 w-7 h-7 rounded-full shrink-0 ring-1 ring-black/10"
              style={{ backgroundColor: gradeScale?.colorHex || 'var(--bm-text-3)' }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-semibold leading-tight truncate" data-testid="boulder-sheet-title">
                {title}
              </h2>
              <p className="text-[14px] text-[var(--bm-text-2)] truncate">{subtitle}</p>
              <p className="text-[14px] text-[var(--bm-text-2)] flex items-center gap-1 mt-0.5">
                {stats.totalRatings > 0 ? (
                  <>
                    <Star className="w-3.5 h-3.5 fill-[var(--bm-star)] text-[var(--bm-star)]" />
                    <span className="text-[var(--bm-text)] font-medium">{stats.avgStars.toFixed(1)}</span>
                    <span>({stats.totalRatings})</span>
                  </>
                ) : (
                  <span>Noch keine Bewertung</span>
                )}
                <span aria-hidden>·</span>
                <span>{stats.totalTops + stats.totalFlashes} Tops</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Schliessen"
              data-testid="boulder-sheet-close"
              className="w-8 h-8 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4 text-[var(--bm-text-2)]" />
            </button>
          </div>

          {/* 2-Tap-Logging */}
          <div className="grid grid-cols-3 gap-2.5 mt-5" data-testid="ascent-logging-card">
            {(
              [
                { type: 'flash' as AscentType, label: 'Flash', Icon: Zap },
                { type: 'top' as AscentType, label: 'Top', Icon: Check },
                { type: 'project' as AscentType, label: 'Projekt', Icon: Target },
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
            <p className="text-[13px] text-[var(--bm-text-2)] text-center mt-2">Zum Loggen anmelden</p>
          )}

          {detent === 'half' && (
            <button
              type="button"
              onClick={() => setDetent('full')}
              data-testid="boulder-sheet-more"
              className="w-full mt-3 min-h-[44px] text-[15px] font-medium text-[var(--bm-accent)]"
            >
              Details & Bewertungen
            </button>
          )}

          {detent === 'full' && (
            <div className="mt-6 space-y-6 pb-4" data-testid="boulder-sheet-details">
              {/* Community */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold">Community</h3>
                  {!isGuest && (
                    <button
                      type="button"
                      data-testid="open-rating-btn"
                      onClick={() => setIsRatingOpen(true)}
                      className="text-[15px] font-medium text-[var(--bm-accent)] min-h-[36px]"
                    >
                      {myRating ? 'Bewertung ändern' : 'Bewerten'}
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
                      <span className="text-[13px] text-[var(--bm-text-2)]">
                        {stats.totalRatings} {stats.totalRatings === 1 ? 'Bewertung' : 'Bewertungen'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5" data-testid="grade-barometer">
                    <div className="flex justify-between text-[13px] text-[var(--bm-text-2)]">
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
                    <p className="text-[13px] text-[var(--bm-text-2)]">
                      {hasFeel
                        ? `Grad fühlt sich ${
                            stats.dominantGradeFeel === 'soft' ? 'eher leicht' : stats.dominantGradeFeel === 'stiff' ? 'eher hart' : 'passend'
                          } an`
                        : 'Noch keine Grad-Einschätzung'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Charakter */}
              <section className="space-y-3">
                <h3 className="text-[17px] font-semibold">Charakter</h3>
                <div className="rounded-2xl bg-[var(--bm-elevated)] p-4 flex justify-center">
                  <RadarChart data={stats.radarAggregate} size={220} showLabels accentColor="var(--bm-accent)" />
                </div>
                <p className="text-[13px] text-[var(--bm-text-2)]">Geschraubt von {resolveSetterName(boulder.setterId)}</p>
                {boulder.notes && <p className="text-[15px] text-[var(--bm-text)]">{boulder.notes}</p>}
              </section>

              {/* Beta */}
              <section className="space-y-3">
                <h3 className="text-[17px] font-semibold flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[var(--bm-text-2)]" />
                  Beta <span className="text-[var(--bm-text-2)] font-normal">{stats.comments.length}</span>
                </h3>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Tipp für diesen Boulder…"
                    data-testid="boulder-comment-input"
                    className="flex-1 min-h-[44px] px-4 rounded-full bg-[var(--bm-elevated)] text-[15px] text-[var(--bm-text)] placeholder:text-[var(--bm-text-3)] outline-none focus:ring-2 focus:ring-[var(--bm-accent)]"
                  />
                  <button
                    type="submit"
                    aria-label="Senden"
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
                        <span className="w-8 h-8 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center text-[13px] font-semibold shrink-0">
                          {c.userNickname.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[var(--bm-text-2)]">{c.userNickname}</p>
                          <p className="text-[15px]">{c.text}</p>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            aria-label="Kommentar löschen"
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
                      {ASCENT_LABEL[myAscent.type]}-Eintrag entfernen
                    </button>
                  )}
                  {myRating && (
                    <button
                      type="button"
                      data-testid="delete-rating-btn"
                      onClick={handleRemoveRating}
                      className="w-full text-left px-4 min-h-[48px] text-[15px] text-[var(--bm-danger)]"
                    >
                      Meine Bewertung entfernen
                    </button>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </Sheet>

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
    </>
  );
};
