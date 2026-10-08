import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { GymMap } from './GymMap';
import { LatLng, geocodeAddress, hasCoordinates } from '../lib/gymFinder';
import { getGyms, updateGymLocation } from '../lib/gymStorage';

/**
 * SPEC-025 AC-8 (Admin-Konsole, Hallen-Stammdaten): Standort der Halle für die Karte.
 * Adresse suchen (OpenStreetMap/Nominatim) → Pin prüfen und bei Bedarf verschieben → speichern.
 * Eigenständig: wird von der Admin-Konsole (SPEC-023) eingehängt, liest die Halle selbst aus gymStorage.
 */
interface GymLocationEditorProps {
  gymId: string;
  userId: string;
  onSaved?: () => void;
  /** Ersetzbar in Tests */
  geocode?: (query: string) => Promise<LatLng | null>;
}

const EMPTY_GYM = { id: '', name: '' } as { id: string; name: string; address?: string; city?: string; lat?: number; lng?: number };

export const GymLocationEditor: React.FC<GymLocationEditorProps> = ({ gymId, userId, onSaved, geocode = q => geocodeAddress(q) }) => {
  const [version, setVersion] = useState(0);
  const gym = useMemo(() => getGyms().find(g => g.id === gymId) || { ...EMPTY_GYM, id: gymId }, [gymId, version]);
  const initialQuery = [gym.address, gym.city].filter(Boolean).join(', ');
  const [query, setQuery] = useState(initialQuery);
  const [pos, setPos] = useState<LatLng | null>(hasCoordinates(gym) ? { lat: gym.lat, lng: gym.lng } : null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setQuery([gym.address, gym.city].filter(Boolean).join(', '));
    setPos(hasCoordinates(gym) ? { lat: gym.lat, lng: gym.lng } : null);
    setMessage(null);
  }, [gym.id]);

  const dirty = !!pos && (pos.lat !== gym.lat || pos.lng !== gym.lng);

  const search = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const found = await geocode(query);
      if (found) {
        setPos(found);
        setMessage({ kind: 'ok', text: 'Gefunden. Pin prüfen, dann speichern.' });
      } else {
        setMessage({ kind: 'error', text: 'Adresse nicht gefunden. Bitte genauer eingeben (Straße, Ort).' });
      }
    } catch {
      setMessage({ kind: 'error', text: 'Adresssuche gerade nicht möglich.' });
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!pos) return;
    try {
      updateGymLocation(gym.id, userId, pos.lat, pos.lng);
      setVersion(v => v + 1);
      setMessage({ kind: 'ok', text: 'Standort gespeichert. Die Halle erscheint auf der Karte.' });
      onSaved?.();
    } catch (e: any) {
      setMessage({ kind: 'error', text: e?.message || 'Speichern fehlgeschlagen.' });
    }
  };

  const points = useMemo(() => (pos ? [{ id: gym.id, name: gym.name, lat: pos.lat, lng: pos.lng }] : []), [gym.id, gym.name, pos]);

  return (
    <section className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-3.5 sm:p-5 space-y-3" data-testid="gym-location-editor">
      <h3 className="text-[17px] font-bold flex items-center gap-2">
        <MapPin className="w-5 h-5" aria-hidden />
        Standort auf der Karte
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Straße Nr., Ort"
          aria-label="Adresse der Halle"
          className="flex-1 min-w-0 min-h-[48px] px-3 rounded-xl bg-[var(--bm-elevated)] text-[16px] focus:outline-none"
          data-testid="gym-location-query"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy || !query.trim()}
          className="min-h-[48px] px-4 rounded-xl bg-[var(--bm-elevated)] text-[16px] font-semibold flex items-center gap-2 disabled:opacity-50"
          data-testid="gym-geocode-btn"
        >
          <Search className="w-5 h-5" aria-hidden />
          {busy ? 'Suche …' : 'Adresse suchen'}
        </button>
      </div>

      {pos ? (
        <>
          <GymMap
            points={points}
            selectedId={gym.id}
            onSelect={() => {}}
            draggable
            onDragEnd={setPos}
            className="h-[240px] rounded-xl"
            testId="gym-location-map"
          />
          <p className="text-[14px] text-[var(--bm-text-2)]" data-testid="gym-location-coords">
            Pin verschieben, falls er nicht genau sitzt. ({pos.lat.toFixed(5)}, {pos.lng.toFixed(5)})
          </p>
        </>
      ) : (
        <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="gym-location-missing">
          Noch kein Standort. Ohne Standort steht die Halle nur in der Liste, nicht auf der Karte.
        </p>
      )}

      {message && (
        <p
          className={`text-[15px] font-medium ${message.kind === 'ok' ? 'text-[var(--bm-success)]' : 'text-[var(--bm-danger)]'}`}
          role="status"
          data-testid="gym-location-message"
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!dirty}
        className="w-full min-h-[48px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold disabled:opacity-40"
        data-testid="gym-location-save"
      >
        Standort speichern
      </button>
    </section>
  );
};
