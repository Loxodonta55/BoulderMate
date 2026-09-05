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
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center mx-auto text-[#6B6358]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#E8E0D4] font-headline uppercase tracking-wider">
          Keine Boulder im Topo gefunden
        </h3>
        <p className="text-xs text-[#A89F91] max-w-sm mx-auto font-sans">
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
            className="bg-[#1E1E1E] border border-[#333333] hover:border-[#6B6358] rounded-none p-4 transition-all space-y-3 group"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Topo Grade Badge + Information */}
              <div className="flex items-start gap-3.5">
                {/* Grade Badge */}
                <div
                  className={`w-14 h-14 rounded-none flex flex-col items-center justify-center font-black shrink-0 border ${
                    b.gradeScale === 'color' && b.colorHex
                      ? 'border-black/40 text-stone-950 font-mono'
                      : 'bg-[#121212] border-[#333333] text-[#F5F0E8] font-mono'
                  }`}
                  style={b.colorHex ? { backgroundColor: b.colorHex } : undefined}
                >
                  <span className={`text-lg leading-none font-bold ${b.colorHex === '#1e293b' ? 'text-white' : ''}`}>
                    {b.grade}
                  </span>
                  {vEquivalent && (
                    <span className="text-[10px] font-bold text-[#A89F91] mt-0.5 font-mono">
                      {vEquivalent}
                    </span>
                  )}
                  {b.gradeScale === 'v_scale' && (
                    <span className="text-[9px] font-bold text-[#6B6358] mt-0.5 tracking-wider font-headline uppercase">
                      V-SCALE
                    </span>
                  )}
                </div>

                {/* Name, Gym/Area, Sector */}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-[#E8E0D4] font-headline tracking-wide uppercase">
                      {b.name}
                    </h3>
                    {/* Stamp-like Ascent Style Badge */}
                    <span className="px-2 py-0.5 rounded-none text-xs font-headline uppercase tracking-wider bg-[#2A2A2A] border border-[#333333] text-[#C9A96E]">
                      {styleConfig?.label || b.ascentStyle}
                    </span>
                    {/* Attempts count */}
                    <span className="text-xs text-[#A89F91] font-mono font-medium">
                      {b.attempts} {b.attempts === 1 ? 'Versuch' : 'Versuche'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#A89F91] mt-1 flex-wrap font-sans">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span className="text-[#E8E0D4]">{b.location}</span>
                      {b.sector && <span className="text-[#6B6358]">· {b.sector}</span>}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#6B6358]" />
                      {b.date}
                    </span>
                    {b.rating && (
                      <span className="flex items-center gap-0.5 text-[#C9A96E] ml-1">
                        {Array.from({ length: b.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#C9A96E] text-[#C9A96E]" />
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
                  className="p-2 text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333]"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {deletingId === b.id ? (
                  <div className="flex items-center space-x-1 bg-[#121212] border border-[#A0522D] rounded-none p-1">
                    <button
                      onClick={() => {
                        onDelete(b.id);
                        setDeletingId(null);
                      }}
                      className="text-[11px] font-bold text-[#A0522D] px-2 py-0.5 hover:bg-[#A0522D]/20 rounded-[2px] font-headline uppercase"
                    >
                      Löschen
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-[11px] text-[#A89F91] px-1 py-0.5 hover:bg-[#2A2A2A] rounded-[2px]"
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-2 text-[#A89F91] hover:text-[#A0522D] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333]"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => toggleExpand(b.id)}
                  className="p-2 text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333]"
                  title={isExpanded ? 'Details einklappen' : 'Details ausklappen'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tags / Quick Attributes Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              {wallLabel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#121212] border border-[#333333] rounded-none text-[#A89F91] font-sans text-[11px]">
                  <Compass className="w-3 h-3 text-[#6B6358]" />
                  {wallLabel}
                </span>
              )}

              {b.holdTypes.map((ht) => {
                const label = HOLD_TYPES.find(h => h.value === ht)?.label || ht;
                return (
                  <span
                    key={ht}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#121212] border border-[#333333] rounded-none text-[#A89F91] font-sans text-[11px]"
                  >
                    <Hand className="w-3 h-3 text-[#C9A96E]" />
                    {label}
                  </span>
                );
              })}

              {perceivedLabel && (
                <span className="px-2 py-0.5 bg-[#121212] border border-[#333333] rounded-none text-[#6B6358] italic text-[11px]">
                  {perceivedLabel}
                </span>
              )}

              {b.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#2A2A2A] border border-[#333333] rounded-none text-[#A89F91] text-[11px] font-mono"
                >
                  <Tag className="w-2.5 h-2.5 text-[#6B6358]" />
                  #{t}
                </span>
              ))}
            </div>

            {/* Expandable Crux & Beta Notes */}
            {isExpanded && (
              <div className="pt-3 border-t border-[#333333] space-y-2.5 text-xs">
                {b.cruxDescription ? (
                  <div className="bg-[#121212] border border-[#333333] rounded-none p-3 relative">
                    <div className="font-bold text-[#C9A96E] font-headline uppercase tracking-wider text-xs mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Schlüsselstelle (Crux) & Beta:
                    </div>
                    <div className="text-[#E8E0D4] font-mono text-xs whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-[#C9A96E]">
                      {b.cruxDescription}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#6B6358] italic font-mono text-xs">Keine Crux-Notizen hinterlegt.</div>
                )}

                {b.notes && (
                  <div className="bg-[#121212] rounded-none p-3 border border-[#333333]">
                    <div className="font-bold text-[#A89F91] font-headline uppercase tracking-wider text-[11px] mb-0.5">
                      Feld-Notizen:
                    </div>
                    <div className="text-[#E8E0D4] font-mono text-xs whitespace-pre-wrap leading-relaxed">{b.notes}</div>
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
