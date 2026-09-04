import { describe, it, expect } from 'vitest';
import { fontToVGrade, vToFontGrade, isValidGrade, getGradeScore } from '../src/lib/gradeConverter';

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
});
