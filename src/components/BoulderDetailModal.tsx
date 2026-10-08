import React, { useState, useEffect } from 'react';
import {
  WallBoulder,
  GymGradeScale,
  Sector,
  CurrentUser,
  AscentType,
  RatingInput
} from '../types/boulder';
import { RadarChart } from './RadarChart';
import { RatingModal } from './RatingModal';
import { PublicProfileModal } from './PublicProfileModal';
import {
  getUserAscent,
  getUserRating,
  logAscent,
  deleteAscent,
  deleteRating,
  saveRating,
  computeBoulderStatsAggregate,
  getRatings,
  getAscents,
  getComments,
  addComment,
  deleteComment,
  isUserMatch,
  isBoulderMatch
} from '../lib/ratingAndAscentService';
import { syncBridge } from '../lib/syncBridge';
import { getProfiles } from '../lib/profileService';
import { useBackHandler } from '../hooks/useBackHandler';
import {
  X,
  Star,
  Zap,
  Trophy,
  Clock,
  Check,
  TrendingUp,
  User,
  Info,
  Calendar,
  Layers,
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface BoulderDetailModalProps {
  boulder: WallBoulder;
  sector?: Sector;
  gradeScale?: GymGradeScale;
  currentUser: CurrentUser;
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const BoulderDetailModal: React.FC<BoulderDetailModalProps> = ({
  boulder,
  sector,
  gradeScale,
  currentUser,
  isOpen,
  onClose,
  onDataChanged,
}) => {
  if (!isOpen) return null;

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTriggeredByAscent, setRatingTriggeredByAscent] = useState(false);
  const [viewingPublicUserId, setViewingPublicUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsVersion, setCommentsVersion] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);

  // SPEC-015: Mobile-First Android Back-Button Handling for child modals
  useBackHandler({
    id: `boulder-rating-modal-${boulder.id}`,
    isOpen: isRatingModalOpen,
    onBack: () => setIsRatingModalOpen(false),
  });

  useBackHandler({
    id: `boulder-public-profile-modal-${boulder.id}`,
    isOpen: Boolean(viewingPublicUserId),
    onBack: () => setViewingPublicUserId(null),
  });

  // Compute live aggregates from storage
  const stats = React.useMemo(() => {
    const ratings = getRatings(boulder.id);
    const ascents = getAscents(boulder.id);
    const comments = getComments(boulder.id);
    return computeBoulderStatsAggregate(boulder, ratings, ascents, comments);
  }, [boulder, commentsVersion, dataVersion]);

  const currentUserAscent = getUserAscent(currentUser.id, boulder.id);
  const currentUserRating = getUserRating(currentUser.id, boulder.id);

  // AC-15: Echtzeit-Aktualisierung bei eingehenden Bewertungen und Begehungen
  useEffect(() => {
    const handleRatingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail?.boulderId || isBoulderMatch(customEvent.detail.boulderId, boulder.id)) {
        setDataVersion(v => v + 1);
      }
    };

    const handleAscentsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail?.boulderId || isBoulderMatch(customEvent.detail.boulderId, boulder.id)) {
        setDataVersion(v => v + 1);
      }
    };

    window.addEventListener('bouldermate:ratings_updated', handleRatingsUpdate);
    window.addEventListener('bouldermate:ascents_updated', handleAscentsUpdate);

    // Instant quiet sync with Supabase when modal opens
    syncBridge.syncRatingsAndAscentsQuietly();

    return () => {
      window.removeEventListener('bouldermate:ratings_updated', handleRatingsUpdate);
      window.removeEventListener('bouldermate:ascents_updated', handleAscentsUpdate);
    };
  }, [boulder.id]);

  const handleDeleteRating = () => {
    deleteRating(currentUser.id, boulder.id);
    setDataVersion(v => v + 1);
    onDataChanged?.();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(
      currentUser.id,
      currentUser.nickname,
      boulder.id,
      commentText.trim(),
      currentUser.avatarUrl
    );
    setCommentText('');
    setCommentsVersion(v => v + 1);
    onDataChanged?.();
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId, currentUser.id, currentUser.isPlatformAdmin);
    setCommentsVersion(v => v + 1);
    onDataChanged?.();
  };

  const handleAscentClick = (type: AscentType) => {
    // If clicking same active type, option to remove
    if (currentUserAscent?.type === type) {
      deleteAscent(currentUser.id, boulder.id);
      setDataVersion(v => v + 1);
      onDataChanged?.();
      return;
    }

    const { isFirstTopOrFlash } = logAscent(
      currentUser.id,
      currentUser.nickname,
      boulder.id,
      type,
      currentUser.avatarUrl
    );

    setDataVersion(v => v + 1);
    onDataChanged?.();

    // AC-4: Trigger rating modal if top/flash was just achieved
    if (isFirstTopOrFlash) {
      setRatingTriggeredByAscent(true);
      setIsRatingModalOpen(true);
    }
  };

  const handleSaveRating = (input: RatingInput) => {
    saveRating(currentUser.id, currentUser.nickname, boulder.id, input);
    setDataVersion(v => v + 1);
    setIsRatingModalOpen(false);
    setRatingTriggeredByAscent(false);
    onDataChanged?.();
    // Nach der Bewertung im Kletterbereich sofort das Fenster schliessen (schneller, daumenfreundlicher Flow)
    onClose();
  };

  // Helper for human-readable feel label
  const getDominantFeelText = () => {
    if (!stats.dominantGradeFeel || stats.totalRatings === 0) {
      return 'Noch keine Bewertungen';
    }
    const pct = stats.gradeFeelPercentages[stats.dominantGradeFeel];
    if (stats.dominantGradeFeel === 'soft') return `Eher Soft (${pct}%)`;
    if (stats.dominantGradeFeel === 'fair') return `Fair / Passend (${pct}%)`;
    return `Eher Stiff (${pct}%)`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="w-full max-w-2xl bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-[var(--bm-line)] bg-[var(--bm-bg)] flex items-start justify-between relative">
            <div className="flex items-start gap-4">
              {/* Large Color Badge (Square block) */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border border-black/40 shrink-0"
                style={{ backgroundColor: gradeScale?.colorHex || 'var(--bm-text-3)' }}
              >
                <span className="text-xl font-headline font-bold text-[var(--bm-bg)]">
                  {gradeScale?.colorName?.[0] || 'B'}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-headline text-[var(--bm-text)]">
                    {boulder.name || `${gradeScale?.colorName || 'Boulder'} #${boulder.id.slice(-4)}`}
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded-xl text-xs font-mono font-bold border border-[var(--bm-line)] bg-[var(--bm-elevated)]"
                    style={{
                      color: gradeScale?.colorHex || 'var(--bm-text-3)',
                    }}
                  >
                    {gradeScale?.difficultyLabel || 'Schwierigkeit'}
                  </span>
                  {gradeScale?.fontRangeMin && (
                    <span className="text-xs font-mono font-bold text-[var(--bm-text-2)] bg-[var(--bm-elevated)] px-2 py-0.5 rounded-xl border border-[var(--bm-line)]">
                      Fb {gradeScale.fontRangeMin} - {gradeScale.fontRangeMax}
                    </span>
                  )}
                  {stats.avgStars >= 4.2 && stats.totalRatings >= 1 && (
                    <span className="px-2 py-0.5 rounded-xl text-xs font-mono font-bold bg-[var(--bm-accent)]/20 text-[var(--bm-accent)] border border-[var(--bm-accent)]/50 flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-[var(--bm-accent)]" />
                      <span>Community-Favorit</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-[var(--bm-text-2)]">
                  {sector && (
                    <span className="flex items-center gap-1 text-[var(--bm-text)]">
                      <Layers className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                      <span>{sector.name}</span>
                    </span>
                  )}
                  <span>•</span>
                  <span>{getProfiles().find(p => p.id === boulder.setterId)?.nickname || 'Hallenteam'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] transition cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {/* 1. Action Bar: Ascent Logging (AC-3) & Review Button (AC-5) - GANZ OBEN IM FRAME */}
            <div className="p-4 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] space-y-3" data-testid="ascent-logging-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-headline text-[var(--bm-text)] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                  <span>Deine Begehung</span>
                </span>

                {/* AC-5: Manual Review Button */}
                <button
                  type="button"
                  onClick={() => {
                    setRatingTriggeredByAscent(false);
                    setIsRatingModalOpen(true);
                  }}
                  className="text-xs font-mono font-bold text-[var(--bm-text)] hover:text-[var(--bm-strong)] bg-[var(--bm-surface)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] hover:border-[var(--bm-strong)] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-[var(--bm-star)] text-[var(--bm-accent)]" />
                  <span>{currentUserRating ? 'Bewertung anpassen' : 'Jetzt bewerten'}</span>
                </button>
              </div>

              {/* 3 Prominent Log Buttons: Flash / Top / Project (AC-3) - 2px radius */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAscentClick('flash')}
                  className={`py-2 px-2 rounded-xl text-xs font-headline border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    currentUserAscent?.type === 'flash'
                      ? 'bg-[var(--bm-accent)] text-[var(--bm-bg)] border-[var(--bm-accent)] font-bold'
                      : 'bg-[var(--bm-surface)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-strong)] hover:text-[var(--bm-text)]'
                  }`}
                >
                  <Zap className="w-4 h-4 stroke-[2]" />
                  <span>Flash</span>
                  {currentUserAscent?.type === 'flash' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAscentClick('top')}
                  className={`py-2 px-2 rounded-xl text-xs font-headline border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    currentUserAscent?.type === 'top'
                      ? 'bg-[var(--bm-success)] text-[var(--bm-on-accent)] border-[var(--bm-success)] font-bold'
                      : 'bg-[var(--bm-surface)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-strong)] hover:text-[var(--bm-text)]'
                  }`}
                >
                  <Trophy className="w-4 h-4 stroke-[2]" />
                  <span>Top</span>
                  {currentUserAscent?.type === 'top' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAscentClick('project')}
                  className={`py-2 px-2 rounded-xl text-xs font-headline border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    currentUserAscent?.type === 'project'
                      ? 'bg-[var(--bm-text-2)] text-[var(--bm-bg)] border-[var(--bm-text-2)] font-bold'
                      : 'bg-[var(--bm-surface)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-strong)] hover:text-[var(--bm-text)]'
                  }`}
                >
                  <Clock className="w-4 h-4 stroke-[2]" />
                  <span>Projekt</span>
                  {currentUserAscent?.type === 'project' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>
              </div>

              {currentUserAscent && (
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--bm-text-2)] pt-1">
                  <span>
                    Geloggt als <strong className="text-[var(--bm-text)]">{currentUserAscent.type}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteAscent(currentUser.id, boulder.id);
                      setDataVersion(v => v + 1);
                      onDataChanged?.();
                    }}
                    className="text-[var(--bm-text-3)] hover:text-[var(--bm-danger)] underline transition text-[10px] cursor-pointer"
                  >
                    Logbucheintrag löschen
                  </button>
                </div>
              )}

              {currentUserRating && (
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--bm-text-2)] pt-1.5 border-t border-[var(--bm-line)]/60">
                  <span className="flex items-center gap-1.5">
                    <span>Deine Bewertung:</span>
                    <strong className="text-[var(--bm-accent)] flex items-center gap-0.5">
                      {currentUserRating.qualityStars} <Star className="w-3 h-3 fill-[var(--bm-star)] text-[var(--bm-accent)]" />
                    </strong>
                    {currentUserRating.gradeFeel && (
                      <span className="text-[var(--bm-text)] capitalize">({currentUserRating.gradeFeel})</span>
                    )}
                  </span>
                  <button
                    type="button"
                    data-testid="delete-rating-btn"
                    onClick={handleDeleteRating}
                    className="text-[var(--bm-danger)] hover:text-[var(--bm-danger)] hover:underline transition text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Eigene Bewertung löschen"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bewertung löschen</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Quick Metrics Bar (AC-8) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Star Rating Card */}
              <div className="p-4 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[var(--bm-text-2)] block">
                    Community-Bewertung
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-mono font-bold text-[var(--bm-accent)]">
                      {stats.avgStars > 0 ? stats.avgStars.toFixed(1) : '–'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={`avg-star-${s}`}
                          className={`w-3.5 h-3.5 ${
                            stats.avgStars >= s
                              ? 'fill-[var(--bm-star)] text-[var(--bm-accent)]'
                              : 'text-[var(--bm-line)]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono text-[var(--bm-text-2)]">
                    {stats.totalRatings} {stats.totalRatings === 1 ? 'Wertung' : 'Wertungen'}
                  </span>
                  {stats.avgStars >= 4.2 && stats.totalRatings >= 1 && (
                    <span className="px-1.5 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-[var(--bm-accent)]/20 text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[var(--bm-accent)]" />
                      <span>Favorit</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Soft / Fair / Stiff Barometer Card */}
              <div className="p-4 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-[var(--bm-text-2)]">
                    Grad-Barometer
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--bm-text)]">
                    {getDominantFeelText()}
                  </span>
                </div>

                {/* 3-segment progress bar (0px radius) */}
                <div className="w-full h-2 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] overflow-hidden flex">
                  <div
                    className="bg-[var(--bm-success)] transition-all duration-200"
                    style={{ width: `${stats.gradeFeelPercentages.soft}%` }}
                    title={`Soft: ${stats.gradeFeelPercentages.soft}%`}
                  />
                  <div
                    className="bg-[var(--bm-accent)] transition-all duration-200"
                    style={{ width: `${stats.gradeFeelPercentages.fair}%` }}
                    title={`Fair: ${stats.gradeFeelPercentages.fair}%`}
                  />
                  <div
                    className="bg-[var(--bm-danger)] transition-all duration-200"
                    style={{ width: `${stats.gradeFeelPercentages.stiff}%` }}
                    title={`Stiff: ${stats.gradeFeelPercentages.stiff}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-[var(--bm-text-2)] mt-1.5">
                  <span className="text-[var(--bm-success)]">{stats.gradeFeelCounts.soft} Soft</span>
                  <span className="text-[var(--bm-accent)]">{stats.gradeFeelCounts.fair} Fair</span>
                  <span className="text-[var(--bm-danger)]">{stats.gradeFeelCounts.stiff} Stiff</span>
                </div>
              </div>
            </div>

            {/* Radar Chart (AC-2) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--bm-accent)]" />
                  <h3 className="text-sm font-headline text-[var(--bm-text)]">
                    Charakter
                  </h3>
                </div>
              </div>

              <div className="my-2">
                <RadarChart
                  data={stats.radarAggregate}
                  referenceData={boulder.radar}
                  size={260}
                  accentColor="var(--bm-star)"
                />
              </div>

              {boulder.notes && (
                <div className="w-full mt-3 p-3 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] text-xs font-mono text-[var(--bm-text-2)] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[var(--bm-accent)] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[var(--bm-text)] block font-headline">Schrauber-Notiz:</span>
                    <span>{boulder.notes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ascent Feed / Begehungsliste (AC-9) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-headline text-[var(--bm-text)] flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--bm-accent)]" />
                  <span>Begehungen ({stats.ascents.length})</span>
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono text-[var(--bm-text-2)]">
                  <span className="text-[var(--bm-accent)] font-bold">{stats.totalFlashes} Flashes</span>
                  <span>•</span>
                  <span className="text-[var(--bm-success)] font-bold">{stats.totalTops} Tops</span>
                </div>
              </div>

              {stats.ascents.length === 0 ? (
                <div className="p-6 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-center text-xs font-mono text-[var(--bm-text-3)]">
                  Noch keine Begehungen eingetragen. Sei der Erste, der diesen Boulder toppt!
                </div>
              ) : (
                <div className="divide-y divide-[var(--bm-line)] rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] overflow-hidden">
                  {stats.ascents.map(ascent => {
                    const isFlash = ascent.type === 'flash';
                    const isTop = ascent.type === 'top';
                    const dateFormatted = new Date(ascent.createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={ascent.id}
                        className="p-3 sm:px-4 flex items-center justify-between hover:bg-[var(--bm-surface)] transition"
                      >
                        <button
                          type="button"
                          onClick={() => setViewingPublicUserId(ascent.userId)}
                          className="flex items-center gap-3 text-left group/user cursor-pointer focus:outline-none"
                          title={`${ascent.userNickname}s öffentliches Profil ansehen`}
                          data-testid={`btn-user-profile-${ascent.userId}`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-[var(--bm-surface)] group-hover/user:border-[var(--bm-strong)] flex items-center justify-center text-xs font-mono font-bold text-[var(--bm-text)] border border-[var(--bm-line)] transition">
                            {ascent.userNickname.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-mono font-bold text-[var(--bm-text)] group-hover/user:text-[var(--bm-strong)] transition block">
                              {ascent.userNickname}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--bm-text-3)] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{dateFormatted}</span>
                            </span>
                          </div>
                        </button>

                        <div>
                          {isFlash && (
                            <span className="px-2.5 py-0.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--bm-surface)] text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-[var(--bm-star)] text-[var(--bm-accent)]" />
                              <span>Flash</span>
                            </span>
                          )}
                          {isTop && (
                            <span className="px-2.5 py-0.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--bm-surface)] text-[var(--bm-success)] border border-[var(--bm-success)]/50 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-[var(--bm-success)]" />
                              <span>Top</span>
                            </span>
                          )}
                          {ascent.type === 'project' && (
                            <span className="px-2.5 py-0.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--bm-surface)] text-[var(--bm-text-2)] border border-[var(--bm-line)] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[var(--bm-text-2)]" />
                              <span>Projekt</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Community Ratings & Reviews List (AC-16: Was haben Freunde bewertet?) */}
            <div className="space-y-3 pt-2 border-t border-[var(--bm-line)]" data-testid="community-ratings-section">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-headline text-[var(--bm-text)] flex items-center gap-2">
                  <Star className="w-4 h-4 text-[var(--bm-accent)]" />
                  <span>Community-Wertungen & Reviews ({stats.ratings?.length || 0})</span>
                </h3>
                <span className="text-xs font-mono text-[var(--bm-text-2)]">
                  {stats.avgStars > 0 ? `Schnitt: ${stats.avgStars.toFixed(1)} ★` : 'Noch unbewertet'}
                </span>
              </div>

              {(!stats.ratings || stats.ratings.length === 0) ? (
                <div className="p-4 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-center text-xs font-mono text-[var(--bm-text-3)]">
                  Noch keine detaillierten Bewertungen vorhanden. Teste den Boulder und bewerte als Erster!
                </div>
              ) : (
                <div className="divide-y divide-[var(--bm-line)] rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] overflow-hidden">
                  {stats.ratings.map(rating => {
                    const userAscent = stats.ascents.find(a => isUserMatch(a.userId, rating.userId));
                    const dateFormatted = rating.createdAt
                      ? new Date(rating.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : 'Heute';

                    return (
                      <div
                        key={rating.id}
                        className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--bm-surface)] transition"
                        data-testid={`community-rating-row-${rating.userId}`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setViewingPublicUserId(rating.userId)}
                            className="w-8 h-8 rounded-xl bg-[var(--bm-surface)] flex items-center justify-center text-xs font-mono font-bold text-[var(--bm-text)] border border-[var(--bm-line)] hover:border-[var(--bm-strong)] shrink-0 transition cursor-pointer"
                            title={`${rating.userNickname}s Profil ansehen`}
                          >
                            {rating.userNickname?.charAt(0) || 'K'}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[var(--bm-text)]">
                                {rating.userNickname}
                              </span>
                              {userAscent && (
                                <span className={`px-1.5 py-0.5 rounded-xl text-[9px] font-mono font-bold ${
                                  userAscent.type === 'flash'
                                    ? 'bg-[var(--bm-accent)]/20 text-[var(--bm-accent)] border border-[var(--bm-accent)]/40'
                                    : userAscent.type === 'top'
                                    ? 'bg-[var(--bm-success)]/20 text-[var(--bm-success)] border border-[var(--bm-success)]/40'
                                    : 'bg-[var(--bm-elevated)] text-[var(--bm-text-2)] border border-[var(--bm-line)]'
                                }`}>
                                  {userAscent.type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-[var(--bm-text-3)] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{dateFormatted}</span>
                            </span>
                          </div>
                        </div>

                        {/* Rating Details: Stars & Grade Feel */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {rating.qualityStars !== undefined && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono font-bold text-[var(--bm-accent)]">
                                {rating.qualityStars}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star
                                    key={`card-star-${rating.id}-${s}`}
                                    className={`w-3.5 h-3.5 ${
                                      (rating.qualityStars || 0) >= s
                                        ? 'fill-[var(--bm-star)] text-[var(--bm-accent)]'
                                        : 'text-[var(--bm-line)]'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {rating.gradeFeel && (
                            <span className={`px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold border ${
                              rating.gradeFeel === 'soft'
                                ? 'bg-[var(--bm-success)]/20 text-[var(--bm-success)] border-[var(--bm-success)]/50'
                                : rating.gradeFeel === 'fair'
                                ? 'bg-[var(--bm-accent)]/20 text-[var(--bm-accent)] border-[var(--bm-accent)]/50'
                                : 'bg-[var(--bm-danger)]/20 text-[var(--bm-danger)] border-[var(--bm-danger)]/50'
                            }`}>
                              {rating.gradeFeel === 'soft' && 'Soft'}
                              {rating.gradeFeel === 'fair' && 'Fair'}
                              {rating.gradeFeel === 'stiff' && 'Stiff'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Route Discussion & Beta Community Feed */}
            <div className="space-y-3 pt-2 border-t border-[var(--bm-line)]">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-headline text-[var(--bm-text)] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--bm-accent)]" />
                  <span>Routen-Diskussion & Beta ({stats.comments.length})</span>
                </h3>
                <span className="text-xs font-mono text-[var(--bm-text-2)]">
                  Tipps, Tricks & Beta austauschen
                </span>
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Diskussion starten: Beta-Tipp, Crux-Erfahrung, Tritt-Empfehlung..."
                  className="flex-1 px-3 py-2 bg-[var(--bm-bg)] border border-[var(--bm-line)] focus:border-[var(--bm-strong)] rounded-xl text-xs font-mono text-[var(--bm-text)] placeholder:text-[var(--bm-text-3)] focus:outline-none"
                  data-testid="boulder-comment-input"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3 py-2 bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--bm-bg)] font-headline font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
                  data-testid="boulder-comment-submit"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Senden</span>
                </button>
              </form>

              {/* Comments List */}
              {stats.comments.length === 0 ? (
                <div className="p-4 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-center text-xs font-mono text-[var(--bm-text-3)]">
                  Noch keine Diskussionsbeiträge. Starte als Erster die Diskussion zu diesem Boulder!
                </div>
              ) : (
                <div className="divide-y divide-[var(--bm-line)] rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] overflow-hidden">
                  {stats.comments.map(comment => {
                    const isAuthor = comment.userId === currentUser.id;
                    const canDelete = isAuthor || currentUser.isPlatformAdmin;
                    const dateFormatted = new Date(comment.createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={comment.id}
                        className="p-3 sm:px-4 flex items-start justify-between gap-3 hover:bg-[var(--bm-surface)] transition"
                        data-testid={`comment-${comment.id}`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewingPublicUserId(comment.userId)}
                            className="w-7 h-7 rounded-xl bg-[var(--bm-surface)] hover:border-[var(--bm-strong)] flex items-center justify-center text-xs font-mono font-bold text-[var(--bm-text)] border border-[var(--bm-line)] shrink-0 transition"
                            title={`${comment.userNickname}s Profil ansehen`}
                          >
                            {comment.userNickname.charAt(0)}
                          </button>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[var(--bm-text)]">
                                {comment.userNickname}
                              </span>
                              {isAuthor && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-[var(--bm-bg)] text-[var(--bm-accent)] border border-[var(--bm-line)]">
                                  Du
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-[var(--bm-text-3)]">
                                {dateFormatted}
                              </span>
                            </div>
                            <p className="text-xs font-sans text-[var(--bm-text)] leading-relaxed break-words">
                              {comment.text}
                            </p>
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-[var(--bm-text-3)] hover:text-[var(--bm-danger)] transition shrink-0"
                            title="Kommentar löschen"
                            data-testid={`delete-comment-${comment.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modal: Rating Modal */}
      {isRatingModalOpen && (
        <RatingModal
          boulder={boulder}
          gradeScale={gradeScale}
          currentUser={currentUser}
          existingRating={currentUserRating}
          isOpen={isRatingModalOpen}
          isTriggeredByAscent={ratingTriggeredByAscent}
          onClose={() => {
            const wasTriggeredByAscent = ratingTriggeredByAscent;
            setIsRatingModalOpen(false);
            setRatingTriggeredByAscent(false);
            // Wenn nach Begehung übersprungen wird, auch direkt zurück zur Wand für schnellen Flow
            if (wasTriggeredByAscent) {
              onClose();
            }
          }}
          onSave={handleSaveRating}
          onDeleteRating={handleDeleteRating}
        />
      )}

      {/* Sub-modal: Public Profile Modal (AC-6) */}
      {viewingPublicUserId && (
        <PublicProfileModal
          userId={viewingPublicUserId}
          isOpen={!!viewingPublicUserId}
          onClose={() => setViewingPublicUserId(null)}
        />
      )}
    </>
  );
};
