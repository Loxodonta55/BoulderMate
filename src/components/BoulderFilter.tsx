import React from 'react';
import { BoulderFilterOptions, ASCENT_STYLES, WALL_ANGLES, HOLD_TYPES, WallAngle, HoldType } from '../types/boulder';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface Props {
  filters: BoulderFilterOptions;
  onChange: (filters: BoulderFilterOptions) => void;
  availableLocations: string[];
}

export const BoulderFilter: React.FC<Props> = ({ filters, onChange, availableLocations }) => {
  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    (filters.ascentStyle && filters.ascentStyle !== 'all') ||
    (filters.wallAngle && filters.wallAngle !== 'all') ||
    (filters.holdType && filters.holdType !== 'all') ||
    filters.location
  );

  const resetFilters = () => {
    onChange({
      searchQuery: '',
      ascentStyle: 'all',
      wallAngle: 'all',
      holdType: 'all',
      location: '',
      sortBy: filters.sortBy || 'date_desc'
    });
  };

  return (
    <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-4 space-y-3.5">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--bm-text-3)]" />
          <input
            type="text"
            placeholder="Topo durchsuchen (Name, Halle, Sektor, Crux, Beta, Tags)..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-9 py-2 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-xs md:text-sm text-[var(--bm-text)] placeholder-[var(--bm-text-3)] focus:outline-none focus:border-[var(--bm-accent)] transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--bm-text-3)] hover:text-[var(--bm-text)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filters.sortBy || 'date_desc'}
              onChange={(e) => onChange({ ...filters, sortBy: e.target.value as any })}
              className="appearance-none bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl pl-9 pr-8 py-2 text-xs md:text-sm text-[var(--bm-text)] focus:outline-none focus:border-[var(--bm-accent)] font-mono cursor-pointer"
            >
              <option value="date_desc">Neueste zuerst</option>
              <option value="date_asc">Älteste zuerst</option>
              <option value="grade_desc">Schwerste zuerst</option>
              <option value="grade_asc">Leichteste zuerst</option>
              <option value="rating_desc">Beste Bewertung</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--bm-text-3)] pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-semibold text-[var(--bm-text-2)] hover:text-[var(--bm-text)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] rounded-xl transition-colors flex items-center gap-1 font-headline"
              title="Filter zurücksetzen"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Style Chips Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-[var(--bm-text-2)] font-headline mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3 text-[var(--bm-accent)]" /> Begehungsstil:
        </span>
        <button
          onClick={() => onChange({ ...filters, ascentStyle: 'all' })}
          className={`px-3 py-1 rounded-xl text-xs font-headline transition-all border ${
            !filters.ascentStyle || filters.ascentStyle === 'all'
              ? 'bg-[var(--bm-strong)] border-[var(--bm-strong)] text-[var(--bm-bg)] font-black'
              : 'bg-[var(--bm-bg)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-text-3)]'
          }`}
        >
          Alle
        </button>
        {ASCENT_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onChange({ ...filters, ascentStyle: style.value })}
            className={`px-3 py-1 rounded-xl text-xs font-headline transition-all border ${
              filters.ascentStyle === style.value
                ? 'bg-[var(--bm-strong)] border-[var(--bm-strong)] text-[var(--bm-bg)] font-black'
                : 'bg-[var(--bm-bg)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-text-3)]'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Additional Dropdowns (Wandneigung, Griffe, Ort) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--bm-line)] text-xs">
        {/* Wandneigung */}
        <div>
          <label className="block text-[10px] font-bold text-[var(--bm-text-2)] font-headline mb-1">
            Wandneigung
          </label>
          <select
            value={filters.wallAngle || 'all'}
            onChange={(e) => onChange({ ...filters, wallAngle: e.target.value as WallAngle | 'all' })}
            className="w-full bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl px-2.5 py-1.5 text-[var(--bm-text)] focus:outline-none focus:border-[var(--bm-accent)] font-sans"
          >
            <option value="all">Alle Wandneigungen</option>
            {WALL_ANGLES.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>

        {/* Griffform */}
        <div>
          <label className="block text-[10px] font-bold text-[var(--bm-text-2)] font-headline mb-1">
            Griffformen
          </label>
          <select
            value={filters.holdType || 'all'}
            onChange={(e) => onChange({ ...filters, holdType: e.target.value as HoldType | 'all' })}
            className="w-full bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl px-2.5 py-1.5 text-[var(--bm-text)] focus:outline-none focus:border-[var(--bm-accent)] font-sans"
          >
            <option value="all">Alle Griffformen</option>
            {HOLD_TYPES.map(h => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-[10px] font-bold text-[var(--bm-text-2)] font-headline mb-1">
            Gebiet / Halle
          </label>
          <select
            value={filters.location || ''}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl px-2.5 py-1.5 text-[var(--bm-text)] focus:outline-none focus:border-[var(--bm-accent)] font-sans"
          >
            <option value="">Alle Gebiete & Hallen</option>
            {availableLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
