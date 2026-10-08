import React, { useEffect, useMemo, useState } from 'react';
import { Building2, LocateFixed, Navigation, Search, X, ChevronRight } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { GymMap } from './GymMap';
import {
  GymFinderEntry,
  LatLng,
  buildNavigationUrl,
  formatDistance,
  matchesGymSearch,
  sortGymEntries,
} from '../lib/gymFinder';
import { useBackHandler } from '../hooks/useBackHandler';

/**
 * SPEC-025: «Halle wählen» – Karte (oben) und Liste (unten) aller eingetragenen Hallen.
 * Pin oder Zeile öffnet die Hallen-Karte mit «Zur Wand» und «Navigation starten».
 */
interface GymFinderSheetProps {
  open: boolean;
  onClose: () => void;
  entries: GymFinderEntry[];
  activeGymId?: string;
  onSelectGym: (gymId: string) => void;
  /** Ersetzbar in Tests */
  geolocation?: Geolocation | null;
}

/** «Flüelastrasse 31, 8048 Zürich» statt «…, 8048 Zürich, Zürich» */
export function formatPlace(g: { address?: string; city?: string }): string {
  if (g.address && g.city && g.address.toLowerCase().includes(g.city.toLowerCase())) return g.address;
  return [g.address, g.city].filter(Boolean).join(', ');
}

type LocateState = 'idle' | 'locating' | 'ok' | 'denied';

export const GymFinderSheet: React.FC<GymFinderSheetProps> = ({
  open,
  onClose,
  entries,
  activeGymId,
  onSelectGym,
  geolocation = typeof navigator !== 'undefined' ? navigator.geolocation : null,
}) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [locateState, setLocateState] = useState<LocateState>('idle');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedId(null);
    }
  }, [open]);

  useBackHandler({
    id: 'sheet-gym-finder',
    isOpen: open,
    onBack: () => (selectedId ? setSelectedId(null) : onClose()),
  });

  const visible = useMemo(
    () => sortGymEntries(entries.filter(e => matchesGymSearch(e, query)), userPos),
    [entries, query, userPos]
  );
  const selected = visible.find(e => e.id === selectedId) || null;

  const locate = () => {
    if (!geolocation) {
      setLocateState('denied');
      return;
    }
    setLocateState('locating');
    geolocation.getCurrentPosition(
      pos => {
        // Standort bleibt nur im Speicher dieses Sheets (SPEC-025 F7)
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocateState('ok');
      },
      () => setLocateState('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const goToWall = (id: string) => {
    onSelectGym(id);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} detent="full" testId="gym-finder-sheet" ariaLabel="Halle wählen">
      <div className="px-4 pb-2 flex items-center justify-between gap-2">
        <h2 className="text-[22px] font-bold">Halle wählen</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center"
          aria-label="Schließen"
          data-testid="gym-finder-close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2">
        <label className="flex-1 flex items-center gap-2 min-h-[48px] px-3 rounded-xl bg-[var(--bm-elevated)]">
          <Search className="w-5 h-5 text-[var(--bm-text-2)] shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
            placeholder="Halle oder Ort"
            aria-label="Halle oder Ort suchen"
            className="flex-1 min-w-0 bg-transparent text-[17px] focus:outline-none placeholder:text-[var(--bm-text-2)]"
            data-testid="gym-finder-search"
          />
        </label>
      </div>

      {locateState === 'denied' && (
        <p className="px-4 pb-2 text-[15px] text-[var(--bm-warning)]" role="status" data-testid="gym-finder-locate-denied">
          Standort nicht freigegeben. Die Liste ist nach Namen sortiert.
        </p>
      )}

      <div className="relative mx-4">
      <GymMap
        points={visible}
        activeGymId={activeGymId}
        selectedId={selectedId}
        userPos={userPos}
        onSelect={setSelectedId}
        className="h-[40dvh] min-h-[220px] rounded-2xl"
      />
      <button
        type="button"
        onClick={locate}
        disabled={locateState === 'locating'}
        className={`absolute top-3 right-3 z-[600] min-h-[48px] px-3.5 rounded-xl flex items-center gap-2 text-[16px] font-semibold shadow-lg ${
          locateState === 'ok'
            ? 'bg-[#1A1918] text-white'
            : 'bg-white text-[#1A1918]'
        }`}
        aria-pressed={locateState === 'ok'}
        data-testid="gym-finder-locate"
      >
        <LocateFixed className="w-5 h-5" aria-hidden />
        <span>{locateState === 'locating' ? 'Suche …' : 'In meiner Nähe'}</span>
      </button>
      </div>

      {selected ? (
        <div className="mx-4 mt-3 rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-4" data-testid={`gym-card-${selected.id}`}>
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-[var(--bm-surface)] flex items-center justify-center overflow-hidden shrink-0">
              {selected.logoUrl ? (
                <img src={selected.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[19px] font-bold leading-tight">{selected.name}</h3>
              <p className="text-[16px] text-[var(--bm-text-2)] mt-0.5">
                {formatPlace(selected)}
                {selected.distanceKm !== undefined && ` · ${formatDistance(selected.distanceKm)}`}
              </p>
              <p className="text-[16px] mt-1" data-testid="gym-card-stats">
                <span className="font-semibold">{selected.activeBoulders} Boulder</span>
                {selected.newBoulders > 0 && (
                  <span className="ml-2 px-1.5 rounded-md text-[13px] font-bold bg-[var(--bm-accent)] text-[var(--bm-on-accent)]">
                    {selected.newBoulders} neu
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              aria-label="Zurück zur Liste"
              data-testid="gym-card-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => goToWall(selected.id)}
              className="min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
              data-testid="gym-card-select"
            >
              Zur Wand
            </button>
            <a
              href={buildNavigationUrl(selected)}
              target="_blank"
              rel="noreferrer"
              className="min-h-[52px] rounded-xl bg-[var(--bm-surface)] text-[var(--bm-text)] text-[17px] font-semibold flex items-center justify-center gap-2"
              data-testid="gym-card-navigate"
            >
              <Navigation className="w-5 h-5" aria-hidden />
              Navigation starten
            </a>
          </div>
        </div>
      ) : null}

      <ul className="mt-3 px-4 divide-y divide-[var(--bm-line)]" data-testid="gym-finder-list">
        {visible.map(e => {
          const isActive = e.id === activeGymId;
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setSelectedId(e.id)}
                className="w-full min-h-[64px] py-2.5 flex items-center gap-3 text-left"
                aria-current={isActive ? 'true' : undefined}
                data-testid={`gym-row-${e.id}`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full shrink-0 ${isActive ? 'bg-[var(--bm-star)]' : 'bg-[var(--bm-line)]'}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[17px] truncate ${isActive ? 'font-bold' : 'font-semibold'}`}>{e.name}</span>
                  <span className="block text-[15px] text-[var(--bm-text-2)] truncate">
                    {e.city || e.address || 'Ort fehlt'}
                    {isActive && ' · gewählt'}
                  </span>
                </span>
                {e.distanceKm !== undefined && (
                  <span className="text-[15px] font-semibold text-[var(--bm-text-2)] shrink-0" data-testid={`gym-row-distance-${e.id}`}>
                    {formatDistance(e.distanceKm)}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-[var(--bm-text-2)] shrink-0" aria-hidden />
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="py-6 text-center text-[16px] text-[var(--bm-text-2)]" data-testid="gym-finder-empty">
            Keine Halle gefunden
          </li>
        )}
      </ul>
    </Sheet>
  );
};
