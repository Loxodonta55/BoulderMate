import { FONT_GRADES, V_GRADES, COLOR_GRADES, GradeScale, GradeFeel, GymGradeScale } from '../types/boulder';

// Conversion mapping index: 0 = easiest (3 / VB), increasing
export const FONT_GRADE_ORDER: Record<string, number> = {
  '3': 0, '4': 1, '4+': 2, '5': 3, '5+': 4,
  '6A': 5, '6A+': 6, '6B': 7, '6B+': 8, '6C': 9, '6C+': 10,
  '7A': 11, '7A+': 12, '7B': 13, '7B+': 14, '7C': 15, '7C+': 16,
  '8A': 17, '8A+': 18, '8B': 19, '8B+': 20, '8C': 21, '8C+': 22
};

export const V_GRADE_ORDER: Record<string, number> = {
  'VB': 0, 'V0': 1, 'V1': 2, 'V2': 3, 'V3': 4, 'V4': 5, 'V5': 6,
  'V6': 7, 'V7': 8, 'V8': 9, 'V9': 10, 'V10': 11, 'V11': 12,
  'V13': 13, 'V14': 14, 'V15': 15, 'V16': 16, 'V17': 17
};

export const COLOR_GRADE_ORDER: Record<string, number> = {
  'Gelb': 1,
  'Grün': 3,
  'Blau': 6,
  'Rot': 10,
  'Schwarz': 14,
  'Weiß': 18,
  'Lila': 21
};

export function getGradeScore(scale: GradeScale, grade: string): number {
  if (scale === 'font') {
    return FONT_GRADE_ORDER[grade] ?? -1;
  }
  if (scale === 'v_scale') {
    // scale roughly to font score
    const vOrder = V_GRADE_ORDER[grade];
    if (vOrder === undefined) return -1;
    // VB->0, V0->1, V1->3, V2->4, V3->5, V4->6, V5->7, V6->8, V7->9, V8->11, V9->12, V10->13, etc.
    const vToFontScoreMap: Record<string, number> = {
      'VB': 0, 'V0': 1, 'V1': 3, 'V2': 4, 'V3': 6, 'V4': 7, 'V5': 8,
      'V6': 9, 'V7': 10, 'V8': 11, 'V9': 12, 'V10': 13, 'V11': 14,
      'V12': 15, 'V13': 16, 'V14': 17, 'V15': 18, 'V16': 19, 'V17': 20
    };
    return vToFontScoreMap[grade] ?? vOrder;
  }
  if (scale === 'color') {
    return COLOR_GRADE_ORDER[grade] ?? -1;
  }
  return -1;
}

export function fontToVGrade(fontGrade: string): string {
  const map: Record<string, string> = {
    '3': 'VB',
    '4': 'V0',
    '4+': 'V0',
    '5': 'V1',
    '5+': 'V2',
    '6A': 'V3',
    '6A+': 'V3',
    '6B': 'V4',
    '6B+': 'V4/V5',
    '6C': 'V5',
    '6C+': 'V5/V6',
    '7A': 'V6',
    '7A+': 'V7',
    '7B': 'V8',
    '7B+': 'V8/V9',
    '7C': 'V9',
    '7C+': 'V10',
    '8A': 'V11',
    '8A+': 'V12',
    '8B': 'V13',
    '8B+': 'V14',
    '8C': 'V15',
    '8C+': 'V16'
  };
  return map[fontGrade] || fontGrade;
}

export function vToFontGrade(vGrade: string): string {
  const map: Record<string, string> = {
    'VB': '3',
    'V0': '4',
    'V1': '5',
    'V2': '5+',
    'V3': '6A',
    'V4': '6B',
    'V5': '6C',
    'V6': '7A',
    'V7': '7A+',
    'V8': '7B',
    'V9': '7C',
    'V10': '7C+',
    'V11': '8A',
    'V12': '8A+',
    'V13': '8B',
    'V14': '8B+',
    'V15': '8C',
    'V16': '8C+',
    'V17': '9A'
  };
  return map[vGrade] || vGrade;
}

export function isValidGrade(scale: GradeScale, grade: string): boolean {
  if (scale === 'font') {
    return (FONT_GRADES as readonly string[]).includes(grade);
  }
  if (scale === 'v_scale') {
    return (V_GRADES as readonly string[]).includes(grade);
  }
  if (scale === 'color') {
    return COLOR_GRADES.some(c => c.value === grade);
  }
  return false;
}

export const FONT_GRADE_LADDER = [
  '3',
  '4a', '4b', '4c',
  '5a', '5b', '5c',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a'
] as const;

export type FontLadderGrade = typeof FONT_GRADE_LADDER[number];

export function normalizeFontGrade(grade: string): string {
  if (!grade) return '6a';
  const clean = grade.trim().toLowerCase();
  if (clean === '4') return '4a';
  if (clean === '4+') return '4c';
  if (clean === '5') return '5a';
  if (clean === '5+') return '5c';
  const exact = FONT_GRADE_LADDER.find(g => g.toLowerCase() === clean);
  if (exact) return exact;
  return clean;
}

export function getFontGradeIndex(grade: string): number {
  const norm = normalizeFontGrade(grade);
  return FONT_GRADE_LADDER.indexOf(norm as any);
}

export function compareFontGrades(gradeA: string, gradeB: string): number {
  const idxA = getFontGradeIndex(gradeA);
  const idxB = getFontGradeIndex(gradeB);
  if (idxA === -1 && idxB === -1) return gradeA.localeCompare(gradeB);
  if (idxA === -1) return -1;
  if (idxB === -1) return 1;
  return idxA - idxB;
}

/**
 * Dynamically resolves a boulder's universal Fontainebleau grade.
 * - If boulder has an explicit fontGrade override:
 *     - 'stiff' -> +1 ladder step
 *     - 'soft' -> -1 ladder step
 *     - 'fair' or null -> explicit grade
 * - Otherwise, derives from the gym color band [fontRangeMin, fontRangeMax] and community gradeFeel:
 *     - 'stiff' -> fontRangeMax (upper bound)
 *     - 'soft' -> fontRangeMin (lower bound)
 *     - 'fair' or null -> midpoint of the band (e.g. Red [6b+, 6c+] -> 6c)
 */
export function resolveBoulderFontGrade(
  gradeScale?: { fontRangeMin?: string; fontRangeMax?: string } | null,
  gradeFeel?: GradeFeel | null,
  overrideFontGrade?: string | null
): string {
  if (overrideFontGrade) {
    const norm = normalizeFontGrade(overrideFontGrade);
    const idx = getFontGradeIndex(norm);
    if (idx === -1) return norm;
    if (gradeFeel === 'stiff') {
      return FONT_GRADE_LADDER[Math.min(FONT_GRADE_LADDER.length - 1, idx + 1)];
    }
    if (gradeFeel === 'soft') {
      return FONT_GRADE_LADDER[Math.max(0, idx - 1)];
    }
    return norm;
  }

  const minStr = gradeScale?.fontRangeMin ? normalizeFontGrade(gradeScale.fontRangeMin) : '6a';
  const maxStr = gradeScale?.fontRangeMax ? normalizeFontGrade(gradeScale.fontRangeMax) : minStr;

  let minIdx = getFontGradeIndex(minStr);
  let maxIdx = getFontGradeIndex(maxStr);

  if (minIdx === -1 && maxIdx === -1) return '6a';
  if (minIdx === -1) minIdx = maxIdx;
  if (maxIdx === -1) maxIdx = minIdx;

  if (minIdx > maxIdx) {
    const temp = minIdx;
    minIdx = maxIdx;
    maxIdx = temp;
  }

  if (minIdx === maxIdx) {
    if (gradeFeel === 'stiff') {
      return FONT_GRADE_LADDER[Math.min(FONT_GRADE_LADDER.length - 1, maxIdx + 1)];
    }
    if (gradeFeel === 'soft') {
      return FONT_GRADE_LADDER[Math.max(0, minIdx - 1)];
    }
    return FONT_GRADE_LADDER[minIdx];
  }

  if (gradeFeel === 'stiff') {
    return FONT_GRADE_LADDER[maxIdx];
  }
  if (gradeFeel === 'soft') {
    return FONT_GRADE_LADDER[minIdx];
  }
  const midIdx = Math.round((minIdx + maxIdx) / 2);
  return FONT_GRADE_LADDER[midIdx];
}

/**
 * Finds the gym grade scale in the given scales list that corresponds to or is closest
 * to the given Fontainebleau grade, used for color styling in charts and badges.
 */
export function findMatchingGradeScale(
  fontGrade: string,
  scales: GymGradeScale[]
): GymGradeScale | undefined {
  if (!scales || scales.length === 0) return undefined;

  const targetIdx = getFontGradeIndex(fontGrade);
  if (targetIdx === -1) return scales[0];

  // 1. Direct enclosing scale
  const enclosing = scales.filter(scale => {
    const minIdx = getFontGradeIndex(scale.fontRangeMin);
    const maxIdx = getFontGradeIndex(scale.fontRangeMax);
    if (minIdx === -1 || maxIdx === -1) return false;
    const lower = Math.min(minIdx, maxIdx);
    const upper = Math.max(minIdx, maxIdx);
    return targetIdx >= lower && targetIdx <= upper;
  });

  if (enclosing.length === 1) return enclosing[0];
  if (enclosing.length > 1) {
    let best = enclosing[0];
    let bestDist = 999;
    for (const s of enclosing) {
      const minI = getFontGradeIndex(s.fontRangeMin);
      const maxI = getFontGradeIndex(s.fontRangeMax);
      const mid = (minI + maxI) / 2;
      const dist = Math.abs(targetIdx - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    }
    return best;
  }

  // 2. Closest scale if none encloses directly
  let closest = scales[0];
  let minDistance = 999;
  for (const s of scales) {
    const minI = getFontGradeIndex(s.fontRangeMin);
    const maxI = getFontGradeIndex(s.fontRangeMax);
    if (minI === -1 && maxI === -1) continue;
    const validMin = minI !== -1 ? minI : maxI;
    const validMax = maxI !== -1 ? maxI : minI;
    const mid = (validMin + validMax) / 2;
    const dist = Math.abs(targetIdx - mid);
    if (dist < minDistance) {
      minDistance = dist;
      closest = s;
    }
  }

  return closest;
}

