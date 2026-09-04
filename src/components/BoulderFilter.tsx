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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Suche nach Boulder, Halle, Sektor, Crux, Tags..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-9 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
              className="appearance-none bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="date_desc">Neueste zuerst</option>
              <option value="date_asc">Älteste zuerst</option>
              <option value="grade_desc">Schwerste zuerst</option>
              <option value="grade_asc">Leichteste zuerst</option>
              <option value="rating_desc">Beste Bewertung</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
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
        <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3" /> Stil:
        </span>
        <button
          onClick={() => onChange({ ...filters, ascentStyle: 'all' })}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            !filters.ascentStyle || filters.ascentStyle === 'all'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Alle
        </button>
        {ASCENT_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onChange({ ...filters, ascentStyle: style.value })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filters.ascentStyle === style.value
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Additional Dropdowns (Wandneigung, Griffe, Ort) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-xs">
        {/* Wandneigung */}
        <div>
          <select
            value={filters.wallAngle || 'all'}
            onChange={(e) => onChange({ ...filters, wallAngle: e.target.value as WallAngle | 'all' })}
            className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Alle Wandneigungen</option>
            {WALL_ANGLES.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>

        {/* Griffform */}
        <div>
          <select
            value={filters.holdType || 'all'}
            onChange={(e) => onChange({ ...filters, holdType: e.target.value as HoldType | 'all' })}
            className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Alle Griffformen</option>
            {HOLD_TYPES.map(h => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <select
            value={filters.location || ''}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Alle Orte / Hallen</option>
            {availableLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
