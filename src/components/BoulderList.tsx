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
      <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center mx-auto text-[var(--bm-text-3)]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[var(--bm-text)] font-headline">
          Keine Boulder im Topo gefunden
        </h3>
        <p className="text-xs text-[var(--bm-text-2)] max-w-sm mx-auto font-sans">
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
            className="bg-[var(--bm-surface)] border border-[var(--bm-line)] hover:border-[var(--bm-text-3)] rounded-xl p-4 transition-all space-y-3 group"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Topo Grade Badge + Information */}
              <div className="flex items-start gap-3.5">
                {/* Grade Badge */}
                <div
                  className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black shrink-0 border ${
                    b.gradeScale === 'color' && b.colorHex
                      ? 'border-black/40 text-stone-950 font-mono'
                      : 'bg-[var(--bm-bg)] border-[var(--bm-line)] text-[var(--bm-strong)] font-mono'
                  }`}
                  style={b.colorHex ? { backgroundColor: b.colorHex } : undefined}
                >
                  <span className={`text-lg leading-none font-bold ${b.colorHex === '#1e293b' ? 'text-white' : ''}`}>
                    {b.grade}
                  </span>
                  {vEquivalent && (
                    <span className="text-[10px] font-bold text-[var(--bm-text-2)] mt-0.5 font-mono">
                      {vEquivalent}
                    </span>
                  )}
                  {b.gradeScale === 'v_scale' && (
                    <span className="text-[9px] font-bold text-[var(--bm-text-3)] mt-0.5 font-headline">
                      V-SCALE
                    </span>
                  )}
                </div>

                {/* Name, Gym/Area, Sector */}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-[var(--bm-text)] font-headline">
                      {b.name}
                    </h3>
                    {/* Stamp-like Ascent Style Badge */}
                    <span className="px-2 py-0.5 rounded-xl text-xs font-headline bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-accent)]">
                      {styleConfig?.label || b.ascentStyle}
                    </span>
                    {/* Attempts count */}
                    <span className="text-xs text-[var(--bm-text-2)] font-mono font-medium">
                      {b.attempts} {b.attempts === 1 ? 'Versuch' : 'Versuche'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--bm-text-2)] mt-1 flex-wrap font-sans">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                      <span className="text-[var(--bm-text)]">{b.location}</span>
                      {b.sector && <span className="text-[var(--bm-text-3)]">· {b.sector}</span>}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--bm-text-3)]" />
                      {b.date}
                    </span>
                    {b.rating && (
                      <span className="flex items-center gap-0.5 text-[var(--bm-accent)] ml-1">
                        {Array.from({ length: b.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[var(--bm-star)] text-[var(--bm-accent)]" />
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
                  className="p-2 text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] rounded-xl transition-colors border border-transparent hover:border-[var(--bm-line)]"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {deletingId === b.id ? (
                  <div className="flex items-center space-x-1 bg-[var(--bm-bg)] border border-[var(--bm-danger)] rounded-xl p-1">
                    <button
                      onClick={() => {
                        onDelete(b.id);
                        setDeletingId(null);
                      }}
                      className="text-[11px] font-bold text-[var(--bm-danger)] px-2 py-0.5 hover:bg-[var(--bm-danger)]/20 rounded-xl font-headline"
                    >
                      Löschen
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-[11px] text-[var(--bm-text-2)] px-1 py-0.5 hover:bg-[var(--bm-elevated)] rounded-xl"
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-2 text-[var(--bm-text-2)] hover:text-[var(--bm-danger)] hover:bg-[var(--bm-elevated)] rounded-xl transition-colors border border-transparent hover:border-[var(--bm-line)]"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => toggleExpand(b.id)}
                  className="p-2 text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] rounded-xl transition-colors border border-transparent hover:border-[var(--bm-line)]"
                  title={isExpanded ? 'Details einklappen' : 'Details ausklappen'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tags / Quick Attributes Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              {wallLabel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text-2)] font-sans text-[11px]">
                  <Compass className="w-3 h-3 text-[var(--bm-text-3)]" />
                  {wallLabel}
                </span>
              )}

              {b.holdTypes.map((ht) => {
                const label = HOLD_TYPES.find(h => h.value === ht)?.label || ht;
                return (
                  <span
                    key={ht}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text-2)] font-sans text-[11px]"
                  >
                    <Hand className="w-3 h-3 text-[var(--bm-accent)]" />
                    {label}
                  </span>
                );
              })}

              {perceivedLabel && (
                <span className="px-2 py-0.5 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text-3)] italic text-[11px]">
                  {perceivedLabel}
                </span>
              )}

              {b.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[var(--bm-elevated)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text-2)] text-[11px] font-mono"
                >
                  <Tag className="w-2.5 h-2.5 text-[var(--bm-text-3)]" />
                  #{t}
                </span>
              ))}
            </div>

            {/* Expandable Crux & Beta Notes */}
            {isExpanded && (
              <div className="pt-3 border-t border-[var(--bm-line)] space-y-2.5 text-xs">
                {b.cruxDescription ? (
                  <div className="bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl p-3 relative">
                    <div className="font-bold text-[var(--bm-accent)] font-headline text-xs mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                      Schlüsselstelle (Crux) & Beta:
                    </div>
                    <div className="text-[var(--bm-text)] font-mono text-xs whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-[var(--bm-accent)]">
                      {b.cruxDescription}
                    </div>
                  </div>
                ) : (
                  <div className="text-[var(--bm-text-3)] italic font-mono text-xs">Keine Crux-Notizen hinterlegt.</div>
                )}

                {b.notes && (
                  <div className="bg-[var(--bm-bg)] rounded-xl p-3 border border-[var(--bm-line)]">
                    <div className="font-bold text-[var(--bm-text-2)] font-headline text-[11px] mb-0.5">
                      Feld-Notizen:
                    </div>
                    <div className="text-[var(--bm-text)] font-mono text-xs whitespace-pre-wrap leading-relaxed">{b.notes}</div>
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
