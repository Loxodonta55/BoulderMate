import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('SPEC-013: Sauberer Datenhaushalt, Produktions-Integrität & Environment-Isolation', () => {
  const projectRoot = path.resolve(__dirname, '..');

  it('AC-3: sync-all-to-supabase.js blocks execution without --confirm-production-push', () => {
    const scriptPath = path.join(projectRoot, 'scripts', 'sync-all-to-supabase.js');
    expect(fs.existsSync(scriptPath)).toBe(true);

    let failed = false;
    try {
      execSync(`node "${scriptPath}"`, { stdio: 'pipe' });
    } catch (err: any) {
      failed = true;
      const stderr = err.stderr?.toString() || '';
      expect(stderr).toContain('SAFETY LOCK');
      expect(stderr).toContain('STRIKT VERBOTEN');
    }
    expect(failed).toBe(true);
  });

  it('AC-3: sync-images-to-supabase.js blocks execution without --confirm-production-push', () => {
    const scriptPath = path.join(projectRoot, 'scripts', 'sync-images-to-supabase.js');
    expect(fs.existsSync(scriptPath)).toBe(true);

    let failed = false;
    try {
      execSync(`node "${scriptPath}"`, { stdio: 'pipe' });
    } catch (err: any) {
      failed = true;
      const stderr = err.stderr?.toString() || '';
      expect(stderr).toContain('SAFETY LOCK');
    }
    expect(failed).toBe(true);
  });

  it('AC-2: package.json defines db:pull script', () => {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.scripts['db:pull']).toBe('node scripts/pull-from-prod.js');
  });

  it('AC-2: src/data/prodSnapshot.json contains valid downloaded production data', () => {
    const snapshotPath = path.join(projectRoot, 'src', 'data', 'prodSnapshot.json');
    expect(fs.existsSync(snapshotPath)).toBe(true);

    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    expect(snapshot.stats).toBeDefined();
    expect(snapshot.stats.gyms).toBeGreaterThanOrEqual(2);
    expect(snapshot.stats.sectors).toBeGreaterThanOrEqual(11);
    expect(snapshot.stats.gradeScales).toBe(16);
    expect(snapshot.stats.boulders).toBeGreaterThanOrEqual(70);

    // Verify gym IDs
    const gymIds = snapshot.gyms.map((g: any) => g.id);
    expect(gymIds).toContain('f2b11564-ca86-4ed4-b51c-3affb346144b'); // 6a plus
    expect(gymIds).toContain('814696b2-303e-4897-9bdb-d83505a63489'); // Minimum
  });

  it('AC-5: Farbskalen pro Halle haben keine doppelten Farbnamen', () => {
    const snapshotPath = path.join(projectRoot, 'src', 'data', 'prodSnapshot.json');
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));

    const scalesByGym: Record<string, Set<string>> = {};
    for (const sc of snapshot.gradeScales) {
      if (!scalesByGym[sc.gym_id]) {
        scalesByGym[sc.gym_id] = new Set();
      }
      const normColor = sc.color_name.trim().toLowerCase();
      expect(scalesByGym[sc.gym_id].has(normColor)).toBe(false);
      scalesByGym[sc.gym_id].add(normColor);
    }
  });

  it('AC-5: Sektoren pro Halle haben keine doppelten Sektornamen', () => {
    const snapshotPath = path.join(projectRoot, 'src', 'data', 'prodSnapshot.json');
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));

    const sectorsByGym: Record<string, Set<string>> = {};
    for (const sec of snapshot.sectors) {
      if (!sectorsByGym[sec.gym_id]) {
        sectorsByGym[sec.gym_id] = new Set();
      }
      const normName = sec.name.trim().toLowerCase();
      expect(sectorsByGym[sec.gym_id].has(normName)).toBe(false);
      sectorsByGym[sec.gym_id].add(normName);
    }
  });
});
