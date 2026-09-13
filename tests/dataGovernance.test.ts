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

  it('AC-2: No static prodSnapshot.json exists in repository (prevents stale snapshot and mock pollution)', () => {
    const snapshotPath = path.join(projectRoot, 'src', 'data', 'prodSnapshot.json');
    expect(fs.existsSync(snapshotPath)).toBe(false);
  });

  it('AC-2: .gitignore prevents committing any JSON snapshot dumps in src/data/', () => {
    const gitignorePath = path.join(projectRoot, '.gitignore');
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    expect(gitignore).toContain('src/data/*.json');
  });
});
