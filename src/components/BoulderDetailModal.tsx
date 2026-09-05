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
  getAscents
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
  Layers
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTriggeredByAscent, setRatingTriggeredByAscent] = useState(false);
  const [viewingPublicUserId, setViewingPublicUserId] = useState<string | null>(null);

  // Compute live aggregates from storage
  const ratings = getRatings(boulder.id);
  const ascents = getAscents(boulder.id);
  const stats = computeBoulderStatsAggregate(boulder, ratings, ascents);

  const currentUserAscent = getUserAscent(currentUser.id, boulder.id);
  const currentUserRating = getUserRating(currentUser.id, boulder.id);

  if (!isOpen) return null;

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
      <div className="fixed inset-0 z-50 bg-[#121110]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-[#181614] border border-[#38332e] rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-[#38332e] bg-[#141210] flex items-start justify-between relative">
            <div className="flex items-start gap-4">
              {/* Large Color Badge */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 border-black/40 shrink-0"
                style={{ backgroundColor: gradeScale?.colorHex || '#f59e0b' }}
              >
                <span className="text-2xl font-headline uppercase font-bold text-[#121110] drop-shadow">
                  {gradeScale?.colorName?.[0] || 'B'}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-headline uppercase tracking-wider text-[#f4efe6]">
                    {boulder.name || `${gradeScale?.colorName || 'Boulder'} #${boulder.id.slice(-4)}`}
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border border-[#38332e] bg-[#221f1c]"
                    style={{
                      color: gradeScale?.colorHex || '#f59e0b',
                    }}
                  >
                    {gradeScale?.difficultyLabel || 'Schwierigkeit'}
                  </span>
                  {gradeScale?.fontRangeMin && (
                    <span className="text-xs font-mono font-bold text-[#a89f91] bg-[#221f1c] px-2 py-0.5 rounded-md border border-[#38332e]">
                      Fb {gradeScale.fontRangeMin} - {gradeScale.fontRangeMax}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-[#a89f91]">
                  {sector && (
                    <span className="flex items-center gap-1 text-[#d4cdc3]">
                      <Layers className="w-3.5 h-3.5 text-[#d97706]" />
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
              className="p-2 rounded-xl text-[#78716c] hover:text-[#f4efe6] hover:bg-[#221f1c] transition"
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
              <div className="p-4 rounded-xl bg-[#121110] border border-[#38332e] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#a89f91] block">
                    Community-Bewertung
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-headline font-bold text-[#f59e0b]">
                      {stats.avgStars > 0 ? stats.avgStars.toFixed(1) : '–'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={`avg-star-${s}`}
                          className={`w-3.5 h-3.5 ${
                            stats.avgStars >= s
                              ? 'fill-[#f59e0b] text-[#f59e0b]'
                              : 'text-[#38332e]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#a89f91]">
                  {stats.totalRatings} {stats.totalRatings === 1 ? 'Wertung' : 'Wertungen'}
                </span>
              </div>

              {/* Soft / Fair / Stiff Barometer Card */}
              <div className="p-4 rounded-xl bg-[#121110] border border-[#38332e] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#a89f91]">
                    Grad-Barometer
                  </span>
                  <span className="text-xs font-mono font-bold text-[#f4efe6]">
                    {getDominantFeelText()}
                  </span>
                </div>

                {/* 3-segment progress bar */}
                <div className="w-full h-2 rounded-full bg-[#221f1c] border border-[#38332e] overflow-hidden flex">
                  <div
                    className="bg-emerald-600 transition-all duration-300"
                    style={{ width: `${stats.gradeFeelPercentages.soft}%` }}
                    title={`Soft: ${stats.gradeFeelPercentages.soft}%`}
                  />
                  <div
                    className="bg-[#d97706] transition-all duration-300"
                    style={{ width: `${stats.gradeFeelPercentages.fair}%` }}
                    title={`Fair: ${stats.gradeFeelPercentages.fair}%`}
                  />
                  <div
                    className="bg-red-600 transition-all duration-300"
                    style={{ width: `${stats.gradeFeelPercentages.stiff}%` }}
                    title={`Stiff: ${stats.gradeFeelPercentages.stiff}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-[#a89f91] mt-1.5">
                  <span className="text-emerald-400">🟢 {stats.gradeFeelCounts.soft} Soft</span>
                  <span className="text-[#f59e0b]">🟡 {stats.gradeFeelCounts.fair} Fair</span>
                  <span className="text-red-400">🔴 {stats.gradeFeelCounts.stiff} Stiff</span>
                </div>
              </div>
            </div>

            {/* Action Bar: Ascent Logging (AC-3) & Review Button (AC-5) */}
            <div className="p-4 rounded-xl bg-[#121110] border border-[#38332e] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-headline uppercase tracking-wider text-[#f4efe6] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Deine Begehung ({currentUser.nickname})</span>
                </span>

                {/* AC-5: Manual Review Button */}
                <button
                  type="button"
                  onClick={() => {
                    setRatingTriggeredByAscent(false);
                    setIsRatingModalOpen(true);
                  }}
                  className="text-xs font-mono font-bold text-[#f59e0b] hover:text-[#d97706] bg-[#221f1c] hover:bg-[#2a2622] border border-[#38332e] hover:border-[#d97706] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-[#f59e0b]" />
                  <span>{currentUserRating ? 'Bewertung anpassen' : 'Jetzt bewerten'}</span>
                </button>
              </div>

              {/* 3 Prominent Log Buttons: Flash / Top / Project (AC-3) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAscentClick('flash')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-headline uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    currentUserAscent?.type === 'flash'
                      ? 'bg-[#d97706] text-[#121110] border-[#f59e0b] shadow font-bold'
                      : 'bg-[#221f1c] border-[#38332e] text-[#d4cdc3] hover:border-[#a89f91] hover:text-[#f4efe6]'
                  }`}
                >
                  <Zap className="w-4 h-4 stroke-[2.5]" />
                  <span>Flash</span>
                  {currentUserAscent?.type === 'flash' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAscentClick('top')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-headline uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    currentUserAscent?.type === 'top'
                      ? 'bg-[#16a34a] text-[#121110] border-emerald-400 shadow font-bold'
                      : 'bg-[#221f1c] border-[#38332e] text-[#d4cdc3] hover:border-[#a89f91] hover:text-[#f4efe6]'
                  }`}
                >
                  <Trophy className="w-4 h-4 stroke-[2.5]" />
                  <span>Top</span>
                  {currentUserAscent?.type === 'top' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAscentClick('project')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-headline uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    currentUserAscent?.type === 'project'
                      ? 'bg-[#2563eb] text-[#f4efe6] border-blue-400 shadow font-bold'
                      : 'bg-[#221f1c] border-[#38332e] text-[#d4cdc3] hover:border-[#a89f91] hover:text-[#f4efe6]'
                  }`}
                >
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                  <span>Projekt</span>
                  {currentUserAscent?.type === 'project' && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />}
                </button>
              </div>

              {currentUserAscent && (
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a89f91] pt-1">
                  <span>
                    Geloggt als <strong className="text-[#f4efe6] uppercase">{currentUserAscent.type}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteAscent(currentUser.id, boulder.id) && onDataChanged?.()}
                    className="text-[#78716c] hover:text-red-400 underline transition text-[10px]"
                  >
                    Logbucheintrag löschen
                  </button>
                </div>
              )}
            </div>

            {/* Radar Chart (AC-2) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#121110] border border-[#38332e] flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#d97706]" />
                  <h3 className="text-sm font-headline uppercase tracking-wider text-[#f4efe6]">
                    Klettercharakter (5-Achsen Radar)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#a89f91]">
                  Aggregiert aus {stats.totalRatings} Bewertungen
                </span>
              </div>

              <div className="my-2">
                <RadarChart
                  data={stats.radarAggregate}
                  referenceData={boulder.radar}
                  size={260}
                  accentColor="#f59e0b"
                />
              </div>

              {boulder.notes && (
                <div className="w-full mt-3 p-3 rounded-xl bg-[#181614] border border-[#38332e] text-xs font-mono text-[#d4cdc3] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#f4efe6] block font-headline uppercase">Schrauber-Notiz:</span>
                    <span>{boulder.notes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ascent Feed / Begehungsliste (AC-9) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-headline uppercase tracking-wider text-[#f4efe6] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#d97706]" />
                  <span>Begehungen ({stats.ascents.length})</span>
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono text-[#a89f91]">
                  <span className="text-[#f59e0b] font-bold">{stats.totalFlashes} Flashes</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{stats.totalTops} Tops</span>
                </div>
              </div>

              {stats.ascents.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#121110] border border-[#38332e] text-center text-xs font-mono text-[#78716c]">
                  Noch keine Begehungen eingetragen. Sei der Erste, der diesen Boulder toppt!
                </div>
              ) : (
                <div className="divide-y divide-[#38332e] rounded-xl bg-[#121110] border border-[#38332e] overflow-hidden">
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
                        className="p-3 sm:px-4 flex items-center justify-between hover:bg-[#181614] transition"
                      >
                        <button
                          type="button"
                          onClick={() => setViewingPublicUserId(ascent.userId)}
                          className="flex items-center gap-3 text-left group/user cursor-pointer focus:outline-none"
                          title={`${ascent.userNickname}s öffentliches Profil ansehen`}
                          data-testid={`btn-user-profile-${ascent.userId}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#221f1c] group-hover/user:border-[#d97706] flex items-center justify-center text-xs font-mono font-bold text-[#f4efe6] border border-[#38332e] transition shadow-sm">
                            {ascent.userNickname.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-mono font-bold text-[#f4efe6] group-hover/user:text-[#f59e0b] transition block">
                              {ascent.userNickname}
                            </span>
                            <span className="text-[10px] font-mono text-[#78716c] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{dateFormatted}</span>
                            </span>
                          </div>
                        </button>

                        <div>
                          {isFlash && (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#221f1c] text-[#f59e0b] border border-[#d97706]/40 flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                              <span>Flash</span>
                            </span>
                          )}
                          {isTop && (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#221f1c] text-emerald-400 border border-emerald-600/40 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-emerald-400" />
                              <span>Top</span>
                            </span>
                          )}
                          {ascent.type === 'project' && (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#221f1c] text-sky-400 border border-sky-600/40 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-400" />
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
