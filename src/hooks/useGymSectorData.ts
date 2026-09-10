import { useState, useEffect, useCallback, useMemo } from 'react';
import { Gym, Sector, GymGradeScale } from '../types/boulder';
import { getGyms, getSectors, getGradeScales } from '../lib/batchBoulderService';

export interface UseGymSectorDataReturn {
  gyms: Gym[];
  gym: Gym | null;
  selectedGymId: string;
  sectors: Sector[];
  selectedSectorId: string;
  selectedSector: Sector | null;
  gradeScales: GymGradeScale[];
  scaleMap: Map<string, GymGradeScale>;
  setSectors: React.Dispatch<React.SetStateAction<Sector[]>>;
  setSelectedGymId: (gymId: string) => void;
  setSelectedSectorId: (sectorId: string) => void;
  handleGymChange: (newGymId: string) => void;
  refreshGymData: () => void;
}

export function useGymSectorData(
  activeGymId?: string,
  onSelectGym?: (gymId: string) => void
): UseGymSectorDataReturn {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gym, setGym] = useState<Gym | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<string>(activeGymId || '');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [gradeScales, setGradeScales] = useState<GymGradeScale[]>([]);

  const loadGymData = useCallback((gymIdToLoad: string, allGymsList: Gym[]) => {
    const currentGym = allGymsList.find(g => g.id === gymIdToLoad) || allGymsList[0] || null;
    setGym(currentGym);
    if (currentGym) {
      setSelectedGymId(currentGym.id);
      const gymSectors = getSectors(currentGym.id);
      setSectors(gymSectors);
      setSelectedSectorId(gymSectors.length > 0 ? gymSectors[0].id : '');
      const scales = getGradeScales(currentGym.id);
      setGradeScales(scales);
    } else {
      setSectors([]);
      setSelectedSectorId('');
      setGradeScales([]);
    }
  }, []);

  const refreshGymData = useCallback(() => {
    const all = getGyms();
    setGyms(all);
    if (all.length > 0) {
      const targetId = selectedGymId && all.some(g => g.id === selectedGymId)
        ? selectedGymId
        : (activeGymId && all.some(g => g.id === activeGymId) ? activeGymId : all[0].id);
      loadGymData(targetId, all);
    }
  }, [activeGymId, selectedGymId, loadGymData]);

  useEffect(() => {
    const all = getGyms();
    setGyms(all);
    if (all.length > 0) {
      const targetId = activeGymId && all.some(g => g.id === activeGymId)
        ? activeGymId
        : (selectedGymId && all.some(g => g.id === selectedGymId) ? selectedGymId : all[0].id);
      loadGymData(targetId, all);
    }
  }, [activeGymId, loadGymData]);

  // SPEC-001 AC-2.1: Reaktiv auf Änderungen im Admin-Farbsystem hören und sofort synchronisieren
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleGradeScalesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ gymId?: string; normalizedGymId?: string }>;
      const updatedGymId = customEvent.detail?.gymId;
      const normalizedGymId = customEvent.detail?.normalizedGymId;
      if (
        !updatedGymId ||
        updatedGymId === selectedGymId ||
        updatedGymId === activeGymId ||
        normalizedGymId === selectedGymId ||
        normalizedGymId === activeGymId
      ) {
        refreshGymData();
      }
    };
    window.addEventListener('bouldermate:gradescales_updated', handleGradeScalesUpdated);
    return () => {
      window.removeEventListener('bouldermate:gradescales_updated', handleGradeScalesUpdated);
    };
  }, [selectedGymId, activeGymId, refreshGymData]);

  const handleGymChange = useCallback((newGymId: string) => {
    setSelectedGymId(newGymId);
    onSelectGym?.(newGymId);
    loadGymData(newGymId, gyms);
  }, [gyms, onSelectGym, loadGymData]);

  const selectedSector = useMemo(
    () => sectors.find(s => s.id === selectedSectorId) || null,
    [sectors, selectedSectorId]
  );

  const scaleMap = useMemo(() => {
    const map = new Map<string, GymGradeScale>();
    gradeScales.forEach(scale => {
      map.set(scale.id, scale);
      if (scale.colorName) {
        const colorLower = scale.colorName.toLowerCase().trim();
        const colorAscii = colorLower === 'weiß' ? 'weiss' : colorLower;
        map.set(`scale_6a_${colorAscii}`, scale);
        map.set(`scale_minimum_${colorAscii}`, scale);
        map.set(colorLower, scale);
        map.set(colorAscii, scale);
      }
    });
    return map;
  }, [gradeScales]);

  return {
    gyms,
    gym,
    selectedGymId,
    sectors,
    selectedSectorId,
    selectedSector,
    gradeScales,
    scaleMap,
    setSectors,
    setSelectedGymId,
    setSelectedSectorId,
    handleGymChange,
    refreshGymData,
  };
}
