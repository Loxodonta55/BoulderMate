import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng, hasCoordinates } from '../lib/gymFinder';

/**
 * SPEC-025: Karte mit OpenStreetMap-Kacheln (Leaflet).
 * Pins sind große, kontrastreiche Kreise (≥ 44 px Tippfläche). Die gewählte Halle ist größer und messingfarben.
 */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const SWITZERLAND: L.LatLngExpression = [46.8, 8.2];

export interface GymMapPoint {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

interface GymMapProps {
  points: GymMapPoint[];
  /** Halle, die gerade in der App gewählt ist (hervorgehoben) */
  activeGymId?: string;
  /** Halle, deren Karte unten offen ist */
  selectedId?: string | null;
  userPos?: LatLng | null;
  onSelect: (id: string) => void;
  className?: string;
  /** Admin: Pin verschiebbar (nur ein Punkt) */
  draggable?: boolean;
  onDragEnd?: (pos: LatLng) => void;
  testId?: string;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function pinIcon(p: GymMapPoint, highlighted: boolean): L.DivIcon {
  const size = highlighted ? 52 : 44;
  const dot = highlighted ? 30 : 24;
  const color = highlighted ? '#8C6A2A' : '#1A1918';
  return L.divIcon({
    className: 'bm-gym-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html:
      `<span data-testid="gym-pin-${escapeHtml(p.id)}" role="button" aria-label="${escapeHtml(p.name)}" ` +
      `data-highlighted="${highlighted}" ` +
      `style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;cursor:pointer">` +
      `<span style="display:block;width:${dot}px;height:${dot}px;border-radius:9999px;background:${color};` +
      `border:4px solid #FFFFFF;box-shadow:0 0 0 2px ${color},0 2px 6px rgba(0,0,0,.45)"></span></span>`,
  });
}

const userIcon = L.divIcon({
  className: 'bm-user-pin',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html:
    '<span data-testid="gym-map-user" style="display:block;width:22px;height:22px;border-radius:9999px;' +
    'background:#2563EB;border:4px solid #FFFFFF;box-shadow:0 0 0 2px #2563EB"></span>',
});

export const GymMap: React.FC<GymMapProps> = ({
  points,
  activeGymId,
  selectedId,
  userPos,
  onSelect,
  className = '',
  draggable = false,
  onDragEnd,
  testId = 'gym-finder-map',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const fittedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const onDragEndRef = useRef(onDragEnd);
  onSelectRef.current = onSelect;
  onDragEndRef.current = onDragEnd;
  const [unavailable, setUnavailable] = useState<boolean>(
    typeof navigator !== 'undefined' && navigator.onLine === false
  );

  // Karte einmal anlegen
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: SWITZERLAND,
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);
    let loadedTiles = 0;
    const tiles = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    });
    tiles.on('tileload', () => {
      loadedTiles++;
      setUnavailable(false);
    });
    tiles.on('tileerror', () => {
      if (loadedTiles === 0) setUnavailable(true);
    });
    tiles.addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Sheet-Animation: Größe nach dem Einblenden neu messen
    const t = window.setTimeout(() => map.invalidateSize(), 320);
    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      userMarkerRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  // Pins aktualisieren
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const located = points.filter(hasCoordinates) as Array<GymMapPoint & LatLng>;
    for (const p of located) {
      const highlighted = p.id === selectedId || (!selectedId && p.id === activeGymId);
      const marker = L.marker([p.lat, p.lng], {
        icon: pinIcon(p, highlighted),
        title: p.name,
        keyboard: true,
        zIndexOffset: highlighted ? 1000 : 0,
        draggable,
      });
      marker.on('click', () => onSelectRef.current(p.id));
      if (draggable) {
        marker.on('dragend', () => {
          const ll = marker.getLatLng();
          onDragEndRef.current?.({ lat: ll.lat, lng: ll.lng });
        });
      }
      marker.addTo(layer);
    }

    if (!fittedRef.current && located.length > 0) {
      fittedRef.current = true;
      if (located.length === 1) {
        map.setView([located[0].lat, located[0].lng], draggable ? 16 : 12);
      } else {
        map.fitBounds(L.latLngBounds(located.map(p => [p.lat, p.lng] as L.LatLngTuple)), { padding: [40, 40], maxZoom: 13 });
      }
    }
  }, [points, selectedId, activeGymId, draggable]);

  // Admin: verschobene Koordinaten von außen (z. B. nach Adresssuche) neu zentrieren
  useEffect(() => {
    if (!draggable) return;
    const map = mapRef.current;
    const p = points.find(hasCoordinates) as (GymMapPoint & LatLng) | undefined;
    if (map && p) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 16));
  }, [draggable, points]);

  // Ausgewählte Halle in den Blick holen
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const p = points.find(x => x.id === selectedId);
    if (p && hasCoordinates(p)) map.panTo([p.lat, p.lng]);
  }, [selectedId, points]);

  // Eigener Standort
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (userPos) {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: userIcon, interactive: false }).addTo(map);
      map.setView([userPos.lat, userPos.lng], Math.max(map.getZoom(), 10));
    }
  }, [userPos]);

  return (
    <div className={`relative overflow-hidden bg-[#E8E4DC] ${className}`} data-testid={testId}>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {unavailable && (
        <div
          className="absolute inset-0 z-[500] flex items-center justify-center bg-[#E8E4DC] text-[#1A1918] text-[17px] font-semibold"
          data-testid="gym-map-unavailable"
        >
          Karte nicht verfügbar
        </div>
      )}
    </div>
  );
};
