import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * SPEC-034 · Schreibrechte. Die echte Prüfung der Regeln läuft in Postgres:
 * scripts/test-rls-spec034.sh (AC-1 bis AC-8). Hier nur die Dateien.
 */
const root = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const MIGRATION = 'supabase/migrations/20261009_spec034_schreibrechte.sql';
const NOTFALL = 'supabase/migrations/20261009_spec034_notfall_zurueck.sql';

/** Kommentare entfernen, damit nur ausgeführtes SQL geprüft wird. */
function sqlOnly(text: string): string {
  return text
    .split('\n')
    .filter(l => !l.trim().startsWith('--'))
    .join('\n');
}

describe('SPEC-034: Datenbank-Schreibrechte', () => {
  it('Migration, Notfall-Datei und Postgres-Test sind vorhanden', () => {
    for (const f of [MIGRATION, NOTFALL, 'tests/db/spec034_rls.sql', 'scripts/test-rls-spec034.sh']) {
      expect(fs.existsSync(path.join(root, f)), f).toBe(true);
    }
  });

  it('Migration hat keine offene Schreibregel mehr und läuft in einer Transaktion (F1/F3)', () => {
    const sql = sqlOnly(read(MIGRATION));
    expect(sql).not.toMatch(/FOR\s+(ALL|INSERT|UPDATE|DELETE)[^;]*WITH CHECK\s*\(\s*true\s*\)/i);
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
    expect(sql).toContain("cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')");
    for (const fn of ['bm_can_edit_gym', 'bm_is_gym_admin', 'bm_is_platform_admin']) {
      expect(sql).toMatch(new RegExp(`FUNCTION public\\.${fn}\\([\\s\\S]*?SECURITY DEFINER[\\s\\S]*?SET search_path = public`));
    }
  });

  it('Begehungen/Bewertungen nur eigene, Fotos nur angemeldet (F1)', () => {
    const sql = sqlOnly(read(MIGRATION));
    expect(sql).toMatch(/"bm ascents insert"[\s\S]*?user_id = auth\.uid\(\)/);
    expect(sql).toMatch(/"bm ratings delete"[\s\S]*?user_id = auth\.uid\(\)/);
    expect(sql).toMatch(/"bm sector photos upload" ON storage\.objects FOR INSERT TO authenticated/);
  });

  it('Vorher-Abfrage für Schrauber ohne Rolle steht in der Datei (F4)', () => {
    expect(read(MIGRATION)).toMatch(/VORHER-ABFRAGE[\s\S]*b\.setter_id[\s\S]*gym_members/);
  });

  it('schema.sql hat keine offenen Schreibregeln mehr', () => {
    const sql = sqlOnly(read('supabase/schema.sql'));
    expect(sql).not.toMatch(/"Allow insert (sectors|boulders|grade_scales|gyms)"/);
    expect(sql).not.toMatch(/CREATE POLICY "Public upload for sector photos"/);
  });

  it('Notfall-Datei öffnet die alten Regeln wieder (AC-8)', () => {
    const sql = sqlOnly(read(NOTFALL));
    expect(sql).toContain('CREATE POLICY "Allow insert boulders" ON public.boulders FOR ALL USING (true) WITH CHECK (true)');
    expect(sql).toContain("policyname LIKE 'bm %'");
  });
});
