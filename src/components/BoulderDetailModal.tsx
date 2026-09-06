import React, { useState } from 'react';
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
  saveRating,
  computeBoulderStatsAggregate,
  getRatings,
  getAscents,
  getComments,
  addComment,
  deleteComment
} from '../lib/ratingAndAscentService';
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
  Trash2
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

  // Compute live aggregates from storage
  const stats = React.useMemo(() => {
    const ratings = getRatings(boulder.id);
    const ascents = getAscents(boulder.id);
    const comments = getComments(boulder.id);
    return computeBoulderStatsAggregate(boulder, ratings, ascents, comments);
  }, [boulder, commentsVersion]);

  const currentUserAscent = getUserAscent(currentUser.id, boulder.id);
  const currentUserRating = getUserRating(currentUser.id, boulder.id);

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

    onDataChanged?.();

    // AC-4: Trigger rating modal if top/flash was just achieved
    if (isFirstTopOrFlash) {
      setRatingTriggeredByAscent(true);
      setIsRatingModalOpen(true);
    }
  };

  const handleSaveRating = (input: RatingInput) => {
    saveRating(currentUser.id, currentUser.nickname, boulder.id, input);
    setIsRatingModalOpen(false);
    setRatingTriggeredByAscent(false);
    onDataChanged?.();
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
        <div className="w-full max-w-2xl bg-[#1E1E1E] border border-[#333333] rounded-none overflow-hidden my-4 flex flex-col max-h-[92vh]">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-[#333333] bg-[#121212] flex items-start justify-between relative">
            <div className="flex items-start gap-4">
              {/* Large Color Badge (Square block) */}
              <div
                className="w-12 h-12 rounded-none flex items-center justify-center border border-black/40 shrink-0"
                style={{ backgroundColor: gradeScale?.colorHex || '#C9A96E' }}
              >
                <span className="text-xl font-headline uppercase font-bold text-[#121212]">
                  {gradeScale?.colorName?.[0] || 'B'}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-headline uppercase tracking-wider text-[#E8E0D4]">
                    {boulder.name || `${gradeScale?.colorName || 'Boulder'} #${boulder.id.slice(-4)}`}
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded-none text-xs font-mono font-bold border border-[#333333] bg-[#2A2A2A]"
                    style={{
                      color: gradeScale?.colorHex || '#C9A96E',
                    }}
                  >
                    {gradeScale?.difficultyLabel || 'Schwierigkeit'}
                  </span>
                  {gradeScale?.fontRangeMin && (
                    <span className="text-xs font-mono font-bold text-[#A89F91] bg-[#2A2A2A] px-2 py-0.5 rounded-none border border-[#333333]">
                      Fb {gradeScale.fontRangeMin} - {gradeScale.fontRangeMax}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-[#A89F91]">
                  {sector && (
                    <span className="flex items-center gap-1 text-[#E8E0D4]">
                      <Layers className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span>{sector.name}</span>
                    </span>
                  )}
                  <span>•</span>
                  <span>Schrauber: {boulder.setterId}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-[2px] text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {/* Quick Metrics Bar (AC-8) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Star Rating Card */}
              <div className="p-4 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#A89F91] block">
                    Community-Bewertung
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-mono font-bold text-[#C9A96E]">
                      {stats.avgStars > 0 ? stats.avgStars.toFixed(1) : '–'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={`avg-star-${s}`}
                          className={`w-3.5 h-3.5 ${
                            stats.avgStars >= s
                              ? 'fill-[#C9A96E] text-[#C9A96E]'
                              : 'text-[#333333]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#A89F91]">
                  {stats.totalRatings} {stats.totalRatings === 1 ? 'Wertung' : 'Wertungen'}
                </span>
              </div>

              {/* Soft / Fair / Stiff Barometer Card */}
              <div className="p-4 rounded-none bg-[#2A2A2A] border border-[#333333] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#A89F91]">
                    Grad-Barometer
                  </span>
                  <span className="text-xs font-mono font-bold text-[#E8E0D4]">
                    {getDominantFeelText()}
                  </span>
                </div>

                {/* 3-segment progress bar (0px radius) */}
                <div className="w-full h-2 rounded-none bg-[#121212] border border-[#333333] overflow-hidden flex">
                  <div
                    className="bg-[#4A5D3A] transition-all duration-200"
                    style={{ width: `${stats.gradeFeelPercentages.soft}%` }}
                    title={`Soft: ${stats.gradeFeelPercentages.soft}%`}
                  />
                  <div
                    className="bg-[#C9A96E] transition-all duration-200"
                    style={{ width: `${stats.gradeFeelPercentages.fair}%` }}
                    title={`Fair: ${stats.gradeFeelPercentages.fair}%`}
                  />
                  <div
                    className="bg-[#A0522D] transition-all duration-200"
                    style={{ width: `${stats.gradeFeelPercentages.stiff}%` }}
                    title={`Stiff: ${stats.gradeFeelPercentages.stiff}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-[#A89F91] mt-1.5">
                  <span className="text-[#86A369]">🟢 {stats.gradeFeelCounts.soft} Soft</span>
                  <span className="text-[#C9A96E]">🟡 {stats.gradeFeelCounts.fair} Fair</span>
                  <span className="text-[#D97D5B]">🔴 {stats.gradeFeelCounts.stiff} Stiff</span>
                </div>
              </div>
            </div>

            {/* Action Bar: Ascent Logging (AC-3) & Review Button (AC-5) */}
            <div className="p-4 rounded-none bg-[#2A2A2A] border border-[#333333] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-headline uppercase tracking-wider text-[#E8E0D4] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>Deine Begehung ({currentUser.nickname})</span>
                </span>

                {/* AC-5: Manual Review Button */}
                <button
                  type="button"
                  onClick={() => {
                    setRatingTriggeredByAscent(false);
                    setIsRatingModalOpen(true);
                  }}
                  className="text-xs font-mono font-bold text-[#E8E0D4] hover:text-[#F5F0E8] bg-[#1E1E1E] hover:bg-[#333333] border border-[#333333] hover:border-[#F5F0E8] px-3 py-1.5 rounded-[2px] transition flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-[#C9A96E] text-[#C9A96E]" />
                  <span>{currentUserRating ? 'Bewertung anpassen' : 'Jetzt bewerten'}</span>
                </button>
              </div>

              {/* 3 Prominent Log Buttons: Flash / Top / Project (AC-3) - 2px radius */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAscentClick('flash')}
                  className={`py-2 px-2 rounded-[2px] text-xs font-headline uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    currentUserAscent?.type === 'flash'
                      ? 'bg-[#C9A96E] text-[#121212] border-[#C9A96E] font-bold'
                      : 'bg-[#1E1E1E] border-[#333333] text-[#A89F91] hover:border-[#F5F0E8] hover:text-[#E8E0D4]'
                  }`}
                >
                  <Zap className="w-4 h-4 stroke-[2]" />
                  <span>Flash</span>
                  {currentUserAscent?.type === 'flash' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAscentClick('top')}
                  className={`py-2 px-2 rounded-[2px] text-xs font-headline uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    currentUserAscent?.type === 'top'
                      ? 'bg-[#4A5D3A] text-[#F5F0E8] border-[#4A5D3A] font-bold'
                      : 'bg-[#1E1E1E] border-[#333333] text-[#A89F91] hover:border-[#F5F0E8] hover:text-[#E8E0D4]'
                  }`}
                >
                  <Trophy className="w-4 h-4 stroke-[2]" />
                  <span>Top</span>
                  {currentUserAscent?.type === 'top' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAscentClick('project')}
                  className={`py-2 px-2 rounded-[2px] text-xs font-headline uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    currentUserAscent?.type === 'project'
                      ? 'bg-[#8B8680] text-[#121212] border-[#8B8680] font-bold'
                      : 'bg-[#1E1E1E] border-[#333333] text-[#A89F91] hover:border-[#F5F0E8] hover:text-[#E8E0D4]'
                  }`}
                >
                  <Clock className="w-4 h-4 stroke-[2]" />
                  <span>Projekt</span>
                  {currentUserAscent?.type === 'project' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>
              </div>

              {currentUserAscent && (
                <div className="flex items-center justify-between text-[11px] font-mono text-[#A89F91] pt-1">
                  <span>
                    Geloggt als <strong className="text-[#E8E0D4] uppercase">{currentUserAscent.type}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteAscent(currentUser.id, boulder.id) && onDataChanged?.()}
                    className="text-[#6B6358] hover:text-[#A0522D] underline transition text-[10px]"
                  >
                    Logbucheintrag löschen
                  </button>
                </div>
              )}
            </div>

            {/* Radar Chart (AC-2) */}
            <div className="p-4 sm:p-5 rounded-none bg-[#2A2A2A] border border-[#333333] flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C9A96E]" />
                  <h3 className="text-sm font-headline uppercase tracking-wider text-[#E8E0D4]">
                    Klettercharakter (5-Achsen Radar)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#A89F91]">
                  Aggregiert aus {stats.totalRatings} Bewertungen
                </span>
              </div>

              <div className="my-2">
                <RadarChart
                  data={stats.radarAggregate}
                  referenceData={boulder.radar}
                  size={260}
                  accentColor="#C9A96E"
                />
              </div>

              {boulder.notes && (
                <div className="w-full mt-3 p-3 rounded-none bg-[#1E1E1E] border border-[#333333] text-xs font-mono text-[#A89F91] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#E8E0D4] block font-headline uppercase">Schrauber-Notiz:</span>
                    <span>{boulder.notes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ascent Feed / Begehungsliste (AC-9) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-headline uppercase tracking-wider text-[#E8E0D4] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#C9A96E]" />
                  <span>Begehungen ({stats.ascents.length})</span>
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono text-[#A89F91]">
                  <span className="text-[#C9A96E] font-bold">{stats.totalFlashes} Flashes</span>
                  <span>•</span>
                  <span className="text-[#86A369] font-bold">{stats.totalTops} Tops</span>
                </div>
              </div>

              {stats.ascents.length === 0 ? (
                <div className="p-6 rounded-none bg-[#2A2A2A] border border-[#333333] text-center text-xs font-mono text-[#6B6358]">
                  Noch keine Begehungen eingetragen. Sei der Erste, der diesen Boulder toppt!
                </div>
              ) : (
                <div className="divide-y divide-[#333333] rounded-none bg-[#2A2A2A] border border-[#333333] overflow-hidden">
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
                        className="p-3 sm:px-4 flex items-center justify-between hover:bg-[#1E1E1E] transition"
                      >
                        <button
                          type="button"
                          onClick={() => setViewingPublicUserId(ascent.userId)}
                          className="flex items-center gap-3 text-left group/user cursor-pointer focus:outline-none"
                          title={`${ascent.userNickname}s öffentliches Profil ansehen`}
                          data-testid={`btn-user-profile-${ascent.userId}`}
                        >
                          <div className="w-8 h-8 rounded-none bg-[#1E1E1E] group-hover/user:border-[#F5F0E8] flex items-center justify-center text-xs font-mono font-bold text-[#E8E0D4] border border-[#333333] transition">
                            {ascent.userNickname.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-mono font-bold text-[#E8E0D4] group-hover/user:text-[#F5F0E8] transition block">
                              {ascent.userNickname}
                            </span>
                            <span className="text-[10px] font-mono text-[#6B6358] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{dateFormatted}</span>
                            </span>
                          </div>
                        </button>

                        <div>
                          {isFlash && (
                            <span className="px-2.5 py-0.5 rounded-none text-[11px] font-mono font-bold bg-[#1E1E1E] text-[#C9A96E] border border-[#C9A96E]/40 flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-[#C9A96E] text-[#C9A96E]" />
                              <span>Flash</span>
                            </span>
                          )}
                          {isTop && (
                            <span className="px-2.5 py-0.5 rounded-none text-[11px] font-mono font-bold bg-[#1E1E1E] text-[#86A369] border border-[#4A5D3A]/50 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-[#86A369]" />
                              <span>Top</span>
                            </span>
                          )}
                          {ascent.type === 'project' && (
                            <span className="px-2.5 py-0.5 rounded-none text-[11px] font-mono font-bold bg-[#1E1E1E] text-[#A89F91] border border-[#333333] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#A89F91]" />
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

            {/* Route Discussion & Beta Community Feed */}
            <div className="space-y-3 pt-2 border-t border-[#333333]">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-headline uppercase tracking-wider text-[#E8E0D4] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#C9A96E]" />
                  <span>Routen-Diskussion & Beta ({stats.comments.length})</span>
                </h3>
                <span className="text-xs font-mono text-[#A89F91]">
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
                  className="flex-1 px-3 py-2 bg-[#121212] border border-[#333333] focus:border-[#F5F0E8] rounded-none text-xs font-mono text-[#E8E0D4] placeholder:text-[#6B6358] focus:outline-none"
                  data-testid="boulder-comment-input"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3 py-2 bg-[#F5F0E8] hover:bg-[#E8E0D4] disabled:opacity-40 disabled:cursor-not-allowed text-[#121212] font-headline uppercase font-bold text-xs tracking-wider rounded-[2px] transition flex items-center gap-1.5 shrink-0"
                  data-testid="boulder-comment-submit"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Senden</span>
                </button>
              </form>

              {/* Comments List */}
              {stats.comments.length === 0 ? (
                <div className="p-4 rounded-none bg-[#2A2A2A] border border-[#333333] text-center text-xs font-mono text-[#6B6358]">
                  Noch keine Diskussionsbeiträge. Starte als Erster die Diskussion zu diesem Boulder!
                </div>
              ) : (
                <div className="divide-y divide-[#333333] rounded-none bg-[#2A2A2A] border border-[#333333] overflow-hidden">
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
                        className="p-3 sm:px-4 flex items-start justify-between gap-3 hover:bg-[#1E1E1E] transition"
                        data-testid={`comment-${comment.id}`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewingPublicUserId(comment.userId)}
                            className="w-7 h-7 rounded-none bg-[#1E1E1E] hover:border-[#F5F0E8] flex items-center justify-center text-xs font-mono font-bold text-[#E8E0D4] border border-[#333333] shrink-0 transition"
                            title={`${comment.userNickname}s Profil ansehen`}
                          >
                            {comment.userNickname.charAt(0)}
                          </button>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[#E8E0D4]">
                                {comment.userNickname}
                              </span>
                              {isAuthor && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-[#121212] text-[#C9A96E] border border-[#333333]">
                                  Du
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-[#6B6358]">
                                {dateFormatted}
                              </span>
                            </div>
                            <p className="text-xs font-sans text-[#E8E0D4] leading-relaxed break-words">
                              {comment.text}
                            </p>
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-[#6B6358] hover:text-[#A0522D] transition shrink-0"
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
            setIsRatingModalOpen(false);
            setRatingTriggeredByAscent(false);
          }}
          onSave={handleSaveRating}
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
