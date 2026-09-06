import { Boulder, BoulderInput, BoulderFilterOptions, BoulderStats } from '../types/boulder';
import { getGradeScore, fontToVGrade, isValidGrade } from './gradeConverter';
import { getStorageJson, setStorageJson } from './storageUtils';

const STORAGE_KEY = 'boulder_app_records_v1';

export class ValidationError extends Error {
  public fieldErrors: Record<string, string>;
  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export function validateBoulderInput(input: Partial<BoulderInput>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Der Name des Boulders muss mindestens 2 Zeichen lang sein.';
  }

  if (!input.location || input.location.trim().length < 2) {
    errors.location = 'Der Ort (Halle oder Felsgebiet) muss mindestens 2 Zeichen lang sein.';
  }

  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = 'Ein gültiges Datum im Format JJJJ-MM-TT ist erforderlich.';
  }

  if (!input.gradeScale || !['font', 'v_scale', 'color'].includes(input.gradeScale)) {
    errors.gradeScale = 'Bitte wähle ein gültiges Bewertungssystem aus.';
  }

  if (!input.grade || !isValidGrade(input.gradeScale!, input.grade)) {
    errors.grade = 'Bitte wähle einen gültigen Schwierigkeitsgrad aus.';
  }

  if (!input.ascentStyle || !['flash', 'onsight', 'top', 'project', 'repeat'].includes(input.ascentStyle)) {
    errors.ascentStyle = 'Bitte wähle einen Begehungsstil aus.';
  }

  if (input.ascentStyle === 'flash' || input.ascentStyle === 'onsight') {
    if (input.attempts !== 1) {
      errors.attempts = 'Bei Flash oder Onsight muss die Versuchsanzahl genau 1 sein.';
    }
  } else if (input.attempts === undefined || input.attempts < 1) {
    errors.attempts = 'Die Versuchsanzahl muss mindestens 1 sein.';
  }

  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
    errors.rating = 'Die Bewertung muss zwischen 1 und 5 Sternen liegen.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function getStoredBoulders(): Boulder[] {
  return getStorageJson<Boulder[]>(STORAGE_KEY, []);
}

export function saveStoredBoulders(boulders: Boulder[]): void {
  setStorageJson(STORAGE_KEY, boulders);
}

export function createBoulder(input: BoulderInput): Boulder {
  // Fix attempts if flash or onsight
  const cleanInput: BoulderInput = {
    ...input,
    attempts: (input.ascentStyle === 'flash' || input.ascentStyle === 'onsight') ? 1 : (input.attempts || 1),
    tags: Array.isArray(input.tags) ? input.tags.map(t => t.trim()).filter(Boolean) : [],
    holdTypes: Array.isArray(input.holdTypes) ? input.holdTypes : []
  };

  const validation = validateBoulderInput(cleanInput);
  if (!validation.isValid) {
    throw new ValidationError('Validierungsfehler beim Speichern des Boulders', validation.errors);
  }

  const now = new Date().toISOString();
  const newBoulder: Boulder = {
    ...cleanInput,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    createdAt: now,
    updatedAt: now
  };

  const existing = getStoredBoulders();
  saveStoredBoulders([newBoulder, ...existing]);
  return newBoulder;
}

export function updateBoulder(id: string, input: BoulderInput): Boulder {
  const cleanInput: BoulderInput = {
    ...input,
    attempts: (input.ascentStyle === 'flash' || input.ascentStyle === 'onsight') ? 1 : (input.attempts || 1),
    tags: Array.isArray(input.tags) ? input.tags.map(t => t.trim()).filter(Boolean) : [],
    holdTypes: Array.isArray(input.holdTypes) ? input.holdTypes : []
  };

  const validation = validateBoulderInput(cleanInput);
  if (!validation.isValid) {
    throw new ValidationError('Validierungsfehler beim Aktualisieren des Boulders', validation.errors);
  }

  const existing = getStoredBoulders();
  const index = existing.findIndex(b => b.id === id);
  if (index === -1) {
    throw new Error(`Boulder mit ID ${id} nicht gefunden.`);
  }

  const updated: Boulder = {
    ...cleanInput,
    id,
    createdAt: existing[index].createdAt,
    updatedAt: new Date().toISOString()
  };

  existing[index] = updated;
  saveStoredBoulders(existing);
  return updated;
}

export function deleteBoulder(id: string): boolean {
  const existing = getStoredBoulders();
  const filtered = existing.filter(b => b.id !== id);
  if (filtered.length !== existing.length) {
    saveStoredBoulders(filtered);
    return true;
  }
  return false;
}

export function filterAndSortBoulders(boulders: Boulder[], options: BoulderFilterOptions): Boulder[] {
  let result = [...boulders];

  // Free text search
  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    result = result.filter(b => {
      return (
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        (b.sector && b.sector.toLowerCase().includes(q)) ||
        (b.cruxDescription && b.cruxDescription.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }

  // Filter grade scale
  if (options.gradeScale && options.gradeScale !== 'all') {
    result = result.filter(b => b.gradeScale === options.gradeScale);
  }

  // Filter ascent style
  if (options.ascentStyle && options.ascentStyle !== 'all') {
    result = result.filter(b => b.ascentStyle === options.ascentStyle);
  }

  // Filter wall angle
  if (options.wallAngle && options.wallAngle !== 'all') {
    result = result.filter(b => b.wallAngle === options.wallAngle);
  }

  // Filter hold type
  if (options.holdType && options.holdType !== 'all') {
    result = result.filter(b => b.holdTypes.includes(options.holdType as any));
  }

  // Filter location
  if (options.location && options.location.trim()) {
    result = result.filter(b => b.location.toLowerCase().includes(options.location!.toLowerCase().trim()));
  }

  // Sorting
  const sortBy = options.sortBy || 'date_desc';
  result.sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return a.date.localeCompare(b.date);
      case 'grade_desc':
        return getGradeScore(b.gradeScale, b.grade) - getGradeScore(a.gradeScale, a.grade);
      case 'grade_asc':
        return getGradeScore(a.gradeScale, a.grade) - getGradeScore(b.gradeScale, b.grade);
      case 'rating_desc':
        return (b.rating || 0) - (a.rating || 0);
      case 'date_desc':
      default:
        return b.date.localeCompare(a.date);
    }
  });

  return result;
}

export function computeStats(boulders: Boulder[]): BoulderStats {
  const totalLogged = boulders.length;
  let totalTops = 0;
  let totalProjects = 0;
  let flashCount = 0;
  let highestScore = -1;
  let hardestGradeFont: string | null = null;
  let hardestGradeV: string | null = null;
  const gradeDistribution: Record<string, number> = {};

  for (const b of boulders) {
    // Top count
    if (b.ascentStyle === 'flash' || b.ascentStyle === 'onsight' || b.ascentStyle === 'top' || b.ascentStyle === 'repeat') {
      totalTops++;
      if (b.ascentStyle === 'flash' || b.ascentStyle === 'onsight') {
        flashCount++;
      }

      // Calculate hardest send
      const score = getGradeScore(b.gradeScale, b.grade);
      if (score > highestScore) {
        highestScore = score;
        if (b.gradeScale === 'font') {
          hardestGradeFont = b.grade;
          hardestGradeV = fontToVGrade(b.grade);
        } else if (b.gradeScale === 'v_scale') {
          hardestGradeV = b.grade;
          hardestGradeFont = b.grade; // fallback or reverse map
        } else {
          hardestGradeFont = b.grade;
          hardestGradeV = b.grade;
        }
      }

      // Grade distribution
      const distKey = b.gradeScale === 'color' ? b.grade : `${b.grade}`;
      gradeDistribution[distKey] = (gradeDistribution[distKey] || 0) + 1;
    } else if (b.ascentStyle === 'project') {
      totalProjects++;
    }
  }

  const flashRatePercent = totalTops > 0 ? Math.round((flashCount / totalTops) * 100) : 0;

  return {
    totalLogged,
    totalTops,
    totalProjects,
    flashRatePercent,
    hardestGradeFont,
    hardestGradeV,
    gradeDistribution
  };
}

export function exportBouldersToJson(boulders: Boulder[]): string {
  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    itemCount: boulders.length,
    boulders
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importBouldersFromJson(jsonString: string, mode: 'merge' | 'replace' = 'merge'): { count: number } {
  const parsed = JSON.parse(jsonString);
  const items: any[] = Array.isArray(parsed) ? parsed : (parsed.boulders || []);

  if (!Array.isArray(items)) {
    throw new Error('Ungültiges Datenformat: Keine Liste von Bouldern gefunden.');
  }

  const validatedBoulders: Boulder[] = [];
  for (const item of items) {
    const check = validateBoulderInput(item);
    if (!check.isValid) {
      throw new Error(`Import-Fehler bei Eintrag "${item.name || 'Unbekannt'}": ${Object.values(check.errors).join(', ')}`);
    }
    validatedBoulders.push({
      ...item,
      id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    });
  }

  if (mode === 'replace') {
    saveStoredBoulders(validatedBoulders);
    return { count: validatedBoulders.length };
  } else {
    // merge by id
    const current = getStoredBoulders();
    const map = new Map<string, Boulder>();
    current.forEach(b => map.set(b.id, b));
    validatedBoulders.forEach(b => map.set(b.id, b));
    const merged = Array.from(map.values());
    saveStoredBoulders(merged);
    return { count: validatedBoulders.length };
  }
}
