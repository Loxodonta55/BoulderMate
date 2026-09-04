import React, { useState } from 'react';
import { Boulder, ASCENT_STYLES, WALL_ANGLES, HOLD_TYPES, PERCEIVED_DIFFICULTIES } from '../types/boulder';
import { fontToVGrade } from '../lib/gradeConverter';
import {
  MapPin,
  Calendar,
  Star,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  AlertCircle,
  Tag,
  Compass,
  Hand
} from 'lucide-react';

interface Props {
  boulders: Boulder[];
  onEdit: (boulder: Boulder) => void;
  onDelete: (id: string) => void;
}

export const BoulderList: React.FC<Props> = ({ boulders, onEdit, onDelete }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  if (boulders.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">Keine Boulder gefunden</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Es wurden keine Boulder gefunden, die deinen Such- oder Filterkriterien entsprechen. Passe die Filter an oder erfasse eine neue Route.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {boulders.map((b) => {
        const isExpanded = expandedIds.has(b.id);
        const styleConfig = ASCENT_STYLES.find(s => s.value === b.ascentStyle);
        const wallLabel = WALL_ANGLES.find(w => w.value === b.wallAngle)?.label;
        const perceivedLabel = PERCEIVED_DIFFICULTIES.find(p => p.value === b.perceivedDifficulty)?.label;

        // V-Grade subtitle if scale is font
        const vEquivalent = b.gradeScale === 'font' ? fontToVGrade(b.grade) : null;

        return (
          <div
            key={b.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 transition-all shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Grade Badge + Titles */}
              <div className="flex items-start gap-3.5">
                {/* Grade Badge */}
                <div
                  className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black shrink-0 shadow-md border ${
                    b.gradeScale === 'color' && b.colorHex
                      ? 'border-white/20 text-slate-950'
                      : 'bg-slate-950 border-slate-700 text-emerald-400'
                  }`}
                  style={b.colorHex ? { backgroundColor: b.colorHex } : undefined}
                >
                  <span className={`text-base leading-none ${b.colorHex === '#1e293b' ? 'text-white' : ''}`}>
                    {b.grade}
                  </span>
                  {vEquivalent && (
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {vEquivalent}
                    </span>
                  )}
                  {b.gradeScale === 'v_scale' && (
                    <span className="text-[9px] font-normal text-slate-500 mt-0.5">
                      V-Scale
                    </span>
                  )}
                </div>

                {/* Name, Gym, Sector */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-100">{b.name}</h3>
                    {/* Ascent Style Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styleConfig?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {styleConfig?.label || b.ascentStyle}
                    </span>
                    {/* Attempts count */}
                    <span className="text-xs text-slate-400 font-medium">
                      {b.attempts} {b.attempts === 1 ? 'Versuch' : 'Versuche'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {b.location}
                      {b.sector && <span className="text-slate-500">· {b.sector}</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {b.date}
                    </span>
                    {b.rating && (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: b.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => onEdit(b)}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {deletingId === b.id ? (
                  <div className="flex items-center space-x-1 bg-rose-500/10 border border-rose-500/30 rounded-lg p-1">
                    <button
                      onClick={() => {
                        onDelete(b.id);
                        setDeletingId(null);
                      }}
                      className="text-[11px] font-bold text-rose-400 px-2 py-0.5 hover:bg-rose-500/20 rounded"
                    >
                      Löschen
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-[11px] text-slate-400 px-1 py-0.5 hover:bg-slate-800 rounded"
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => toggleExpand(b.id)}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title={isExpanded ? 'Details einklappen' : 'Details ausklappen'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tags / Quick Attributes Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              {wallLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                  <Compass className="w-3 h-3 text-slate-500" />
                  {wallLabel}
                </span>
              )}

              {b.holdTypes.map((ht) => {
                const label = HOLD_TYPES.find(h => h.value === ht)?.label || ht;
                return (
                  <span
                    key={ht}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
                  >
                    <Hand className="w-3 h-3 text-emerald-500" />
                    {label}
                  </span>
                );
              })}

              {perceivedLabel && (
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 italic">
                  {perceivedLabel}
                </span>
              )}

              {b.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-800/80 rounded-lg text-slate-400 text-[11px]"
                >
                  <Tag className="w-2.5 h-2.5 text-slate-500" />
                  #{t}
                </span>
              ))}
            </div>

            {/* Expandable Crux & Beta Notes */}
            {isExpanded && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                {b.cruxDescription ? (
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                    <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                      🎯 Schlüsselstelle (Crux) & Beta:
                    </div>
                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {b.cruxDescription}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 italic">Keine Crux-Notizen hinterlegt.</div>
                )}

                {b.notes && (
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
                    <div className="font-semibold text-slate-400 mb-0.5">Notizen:</div>
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">{b.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
