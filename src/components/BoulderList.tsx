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
  Hand,
  BookOpen
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
      <div className="bg-[#181614] border border-[#332e29] rounded-xl p-12 text-center space-y-3 shadow-md">
        <div className="w-12 h-12 rounded-xl bg-[#221f1c] border border-stone-700 flex items-center justify-center mx-auto text-stone-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-stone-200 font-headline uppercase tracking-wider">
          Keine Boulder im Topo gefunden
        </h3>
        <p className="text-xs text-stone-400 max-w-sm mx-auto font-sans">
          Es wurden keine Routen gefunden, die deinen Filterkriterien entsprechen. Passe die Filter an oder trage eine neue Erstbegehung / Begehung ein.
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
        const vEquivalent = b.gradeScale === 'font' ? fontToVGrade(b.grade) : null;

        return (
          <div
            key={b.id}
            className="bg-[#181614] border border-[#38332e] hover:border-[#4d463f] rounded-xl p-4 transition-all shadow-md space-y-3 group"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Vintage Topo Grade Badge + Information */}
              <div className="flex items-start gap-3.5">
                {/* Grade Badge */}
                <div
                  className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center font-black shrink-0 border-2 shadow-md ${
                    b.gradeScale === 'color' && b.colorHex
                      ? 'border-black/30 text-stone-950 font-mono'
                      : 'bg-[#121110] border-amber-600/70 text-amber-400 font-mono'
                  }`}
                  style={b.colorHex ? { backgroundColor: b.colorHex } : undefined}
                >
                  <span className={`text-lg leading-none font-bold ${b.colorHex === '#1e293b' ? 'text-white' : ''}`}>
                    {b.grade}
                  </span>
                  {vEquivalent && (
                    <span className="text-[10px] font-bold text-stone-400 mt-0.5 font-mono">
                      {vEquivalent}
                    </span>
                  )}
                  {b.gradeScale === 'v_scale' && (
                    <span className="text-[9px] font-bold text-stone-500 mt-0.5 tracking-wider font-headline">
                      V-SCALE
                    </span>
                  )}
                </div>

                {/* Name, Gym/Area, Sector */}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-[#f4efe6] font-headline tracking-wide uppercase">
                      {b.name}
                    </h3>
                    {/* Stamp-like Ascent Style Badge */}
                    <span className="stamp-badge bg-[#24201c] border-amber-600/80 text-amber-400">
                      {styleConfig?.label || b.ascentStyle}
                    </span>
                    {/* Attempts count */}
                    <span className="text-xs text-stone-400 font-mono font-medium">
                      {b.attempts} {b.attempts === 1 ? 'Versuch' : 'Versuche'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400 mt-1 flex-wrap font-sans">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-stone-300">{b.location}</span>
                      {b.sector && <span className="text-stone-500">· {b.sector}</span>}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      {b.date}
                    </span>
                    {b.rating && (
                      <span className="flex items-center gap-0.5 text-amber-400 ml-1">
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
                  className="p-2 text-stone-400 hover:text-amber-400 hover:bg-[#24201c] rounded-lg transition-colors border border-transparent hover:border-[#38332e]"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {deletingId === b.id ? (
                  <div className="flex items-center space-x-1 bg-red-950/40 border border-red-800/80 rounded-lg p-1">
                    <button
                      onClick={() => {
                        onDelete(b.id);
                        setDeletingId(null);
                      }}
                      className="text-[11px] font-bold text-red-400 px-2 py-0.5 hover:bg-red-900/40 rounded font-headline uppercase"
                    >
                      Löschen
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-[11px] text-stone-400 px-1 py-0.5 hover:bg-[#24201c] rounded"
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-2 text-stone-400 hover:text-red-400 hover:bg-[#24201c] rounded-lg transition-colors border border-transparent hover:border-[#38332e]"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => toggleExpand(b.id)}
                  className="p-2 text-stone-400 hover:text-stone-200 hover:bg-[#24201c] rounded-lg transition-colors border border-transparent hover:border-[#38332e]"
                  title={isExpanded ? 'Details einklappen' : 'Details ausklappen'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tags / Quick Attributes Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              {wallLabel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#121110] border border-[#332e29] rounded text-stone-300 font-sans text-[11px]">
                  <Compass className="w-3 h-3 text-stone-400" />
                  {wallLabel}
                </span>
              )}

              {b.holdTypes.map((ht) => {
                const label = HOLD_TYPES.find(h => h.value === ht)?.label || ht;
                return (
                  <span
                    key={ht}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#121110] border border-[#332e29] rounded text-stone-300 font-sans text-[11px]"
                  >
                    <Hand className="w-3 h-3 text-amber-500" />
                    {label}
                  </span>
                );
              })}

              {perceivedLabel && (
                <span className="px-2 py-0.5 bg-[#121110] border border-[#332e29] rounded text-stone-400 italic text-[11px]">
                  {perceivedLabel}
                </span>
              )}

              {b.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#24201c] border border-[#38332e] rounded text-stone-400 text-[11px] font-mono"
                >
                  <Tag className="w-2.5 h-2.5 text-stone-500" />
                  #{t}
                </span>
              ))}
            </div>

            {/* Expandable Crux & Beta Notes (Field Notebook style) */}
            {isExpanded && (
              <div className="pt-3 border-t border-[#332e29] space-y-2.5 text-xs">
                {b.cruxDescription ? (
                  <div className="bg-[#121110] border border-amber-900/40 rounded-lg p-3 relative">
                    <div className="font-bold text-amber-400 font-headline uppercase tracking-wider text-xs mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      Schlüsselstelle (Crux) & Beta:
                    </div>
                    <div className="text-stone-200 font-mono text-xs whitespace-pre-wrap leading-relaxed pl-1 border-l-2 border-amber-600/50">
                      {b.cruxDescription}
                    </div>
                  </div>
                ) : (
                  <div className="text-stone-500 italic font-mono text-xs">Keine Crux-Notizen hinterlegt.</div>
                )}

                {b.notes && (
                  <div className="bg-[#121110] rounded-lg p-3 border border-[#332e29]">
                    <div className="font-bold text-stone-400 font-headline uppercase tracking-wider text-[11px] mb-0.5">
                      Feld-Notizen:
                    </div>
                    <div className="text-stone-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">{b.notes}</div>
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
