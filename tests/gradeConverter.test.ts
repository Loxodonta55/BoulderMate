import { describe, it, expect } from 'vitest';
import {
  fontToVGrade,
  vToFontGrade,
  isValidGrade,
  getGradeScore,
  normalizeFontGrade,
  compareFontGrades,
  resolveBoulderFontGrade,
  findMatchingGradeScale,
} from '../src/lib/gradeConverter';

describe('Grade Converter (AC-2)', () => {
  it('correctly maps Fontainebleau grades to V-Scale equivalents', () => {
    expect(fontToVGrade('6A')).toBe('V3');
    expect(fontToVGrade('6C')).toBe('V5');
    expect(fontToVGrade('7A')).toBe('V6');
    expect(fontToVGrade('7B+')).toBe('V8/V9');
    expect(fontToVGrade('8A')).toBe('V11');
  });

  it('correctly maps V-Scale grades to Fontainebleau equivalents', () => {
    expect(vToFontGrade('V3')).toBe('6A');
    expect(vToFontGrade('V5')).toBe('6C');
    expect(vToFontGrade('V7')).toBe('7A+');
    expect(vToFontGrade('V11')).toBe('8A');
  });

  it('validates supported grade scales properly', () => {
    expect(isValidGrade('font', '6B+')).toBe(true);
    expect(isValidGrade('font', '9Z')).toBe(false);
    expect(isValidGrade('v_scale', 'V4')).toBe(true);
    expect(isValidGrade('v_scale', 'V99')).toBe(false);
    expect(isValidGrade('color', 'Blau')).toBe(true);
    expect(isValidGrade('color', 'Türkis')).toBe(false);
  });

  it('correctly ranks grades by difficulty score', () => {
    const score6A = getGradeScore('font', '6A');
    const score7A = getGradeScore('font', '7A');
    const score8A = getGradeScore('font', '8A');
    expect(score7A).toBeGreaterThan(score6A);
    expect(score8A).toBeGreaterThan(score7A);
  });

  describe('Fontainebleau Smart Translation (SPEC-004)', () => {
    it('normalizes various font grade representations', () => {
      expect(normalizeFontGrade('6A')).toBe('6a');
      expect(normalizeFontGrade('6B+')).toBe('6b+');
      expect(normalizeFontGrade('4')).toBe('4a');
      expect(normalizeFontGrade('4+')).toBe('4c');
      expect(normalizeFontGrade('5')).toBe('5a');
      expect(normalizeFontGrade('5+')).toBe('5c');
      expect(normalizeFontGrade('7C+')).toBe('7c+');
    });

    it('correctly compares Fontainebleau grades on the canonical ladder', () => {
      expect(compareFontGrades('6a', '6b')).toBeLessThan(0);
      expect(compareFontGrades('6c+', '6c')).toBeGreaterThan(0);
      expect(compareFontGrades('7a', '7a')).toBe(0);
      expect(compareFontGrades('5c', '6a')).toBeLessThan(0);
    });

    it('translates gym color band red [6b+, 6c+] to 6c by default / fair (user specification)', () => {
      const redScale = { fontRangeMin: '6b+', fontRangeMax: '6c+' };

      // Default (no feel)
      expect(resolveBoulderFontGrade(redScale, null)).toBe('6c');
      // Fair
      expect(resolveBoulderFontGrade(redScale, 'fair')).toBe('6c');
    });

    it('translates gym color band red [6b+, 6c+] to 6c+ when evaluated as stiff (user specification)', () => {
      const redScale = { fontRangeMin: '6b+', fontRangeMax: '6c+' };
      expect(resolveBoulderFontGrade(redScale, 'stiff')).toBe('6c+');
    });

    it('translates gym color band red [6b+, 6c+] to 6b+ when evaluated as soft', () => {
      const redScale = { fontRangeMin: '6b+', fontRangeMax: '6c+' };
      expect(resolveBoulderFontGrade(redScale, 'soft')).toBe('6b+');
    });

    it('respects boulder explicit fontGrade override with +/- 1 ladder step adjustments for stiff/soft', () => {
      expect(resolveBoulderFontGrade(null, null, '7a')).toBe('7a');
      expect(resolveBoulderFontGrade(null, 'fair', '7a')).toBe('7a');
      expect(resolveBoulderFontGrade(null, 'stiff', '7a')).toBe('7a+');
      expect(resolveBoulderFontGrade(null, 'soft', '7a')).toBe('6c+');
    });

    it('finds the appropriate gym grade scale matching a Fontainebleau grade', () => {
      const scales = [
        { id: 's1', gymId: 'g1', colorName: 'Grün', colorHex: '#22c55e', difficultyLabel: 'Leicht', fontRangeMin: '4a', fontRangeMax: '5b', sortOrder: 1 },
        { id: 's2', gymId: 'g1', colorName: 'Blau', colorHex: '#3b82f6', difficultyLabel: 'Mittel', fontRangeMin: '5c', fontRangeMax: '6b', sortOrder: 2 },
        { id: 's3', gymId: 'g1', colorName: 'Rot', colorHex: '#ef4444', difficultyLabel: 'Schwer', fontRangeMin: '6b+', fontRangeMax: '6c+', sortOrder: 3 },
      ];

      expect(findMatchingGradeScale('5a', scales)?.colorName).toBe('Grün');
      expect(findMatchingGradeScale('6a', scales)?.colorName).toBe('Blau');
      expect(findMatchingGradeScale('6c', scales)?.colorName).toBe('Rot');
      expect(findMatchingGradeScale('6c+', scales)?.colorName).toBe('Rot');
    });
  });
});
