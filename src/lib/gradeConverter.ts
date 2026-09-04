import { FONT_GRADES, V_GRADES, COLOR_GRADES, GradeScale } from '../types/boulder';

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
