---
name: bouldermate-deployment
description: Verbindlicher End-to-End Deployment-Workflow für BoulderMate. Regelt den automatischen Ablauf über Git (GitHub), Supabase (Datenbank/Schema via MCP) und Vercel (Production Build & Domain Check).
when_to_use: "Immer wenn Code, Features, Bugfixes oder DB-Änderungen live auf Produktion (bouldermate.ch) gebracht werden sollen."
allowed-tools: Bash, Read, Grep, call_mcp_tool, read_url_content
---

# BoulderMate End-to-End Deployment Workflow

Dieser Skill definiert den verbindlichen Standardprozess für jedes Deployment von **BoulderMate**.

---

## Die 4-Stufen-Pipeline

```
[1. Pre-Flight Verification] ──► [2. Git & GitHub Push] ──► [3. Supabase Schema Sync] ──► [4. Vercel & Live-Check]
   • TypeScript (tsc)               • git add & commit          • Schema/Migrations prüfen      • Vercel Deployment-Status
   • Vite Production Build          • git push origin main      • Supabase MCP nutzen           • bouldermate.ch verifizieren
   • Vitest Suite (alle Tests)
```

---

## 1. Stufe: Pre-Flight Verification (Lokal)
Vor jedem Push MÜSSEN zwingend die lokalen Qualitäts-Gates bestanden sein:
```powershell
# 1. Type-Check und Production-Build
npm run build

# 2. Test-Suite komplett durchlaufen
npm test -- --run
```
> Wenn ein Test fehlschlägt oder TypeScript-Fehler auftreten: **Sofort stoppen, Fehler eigenständig beheben und erneut testen.** Niemals fehlerhaften Code pushen!

---

## 2. Stufe: Git & GitHub Push
1. Status prüfen: `git status -u`
2. Änderungen stagen und mit Semantic Commit Messages committen (z.B. `feat(...)`, `fix(...)`):
   ```powershell
   git add .
   git commit -m "feat(scope): prägnante Beschreibung"
   ```
3. Push auf den Haupt-Branch:
   ```powershell
   git push origin main
   ```
> Hinweis: GitHub `origin/main` ist direkt mit dem Vercel-Projekt `boulder-mate` verdrahtet.

---

## 3. Stufe: Supabase Schema & Non-destructive Upward Data Sync
> **⚠️ ZWINGENDE REGEL (NON-DESTRUCTIVE / IMMER NUR AUFWÄRTS)**:
> Es darf **NIEMALS** etwas auf der Produktions-Umgebung (`bouldermate.ch` / Supabase) gelöscht oder zurückgesetzt werden (`DELETE`, `TRUNCATE`, `DROP`). Alle Synchronisationen erfolgen **ausschließlich aufwärts (Local ──► Supabase)** im **Append-Only / Upsert-Modus** (`ON CONFLICT DO UPDATE` oder `ON CONFLICT DO NOTHING`).

1. **Schema & Migrationen prüfen**:
   - Supabase-Tabellen und Status prüfen via Supabase MCP (`list_tables`, `list_migrations`).
   - Neue Tabellen, RLS-Policies oder Spalten bei Bedarf via `execute_sql` anlegen.
2. **Wandfotos nach Supabase Storage synchronisieren**:
   - Alle lokalen Wandfotos aus `public/images/walls/` in den Storage-Bucket `sector-photos` abgleichen (`node scripts/sync-images-to-supabase.js`).
3. **Stammdaten & Sektoren aufwärts synchronisieren**:
   - Hallen, Farbskalen, Sektoren und Boulder non-destruktiv via Sync-Skript synchronisieren:
     ```powershell
     node scripts/sync-all-to-supabase.js
     ```
   - Verifizieren, dass alle Sektoren beider Hallen (6a plus mit 8 Sektoren, Minimum mit 3 Sektoren) in Supabase vorhanden sind.

---

## 4. Stufe: Vercel Production Deployment & Live-Check
Nach dem Push triggert Vercel automatisch den Production-Build.
1. Deployment-Status abfragen via Vercel MCP:
   - Tool: `vercel` -> `list_deployments` mit `teamId: "team_0VDh9N0SkupdBzTJPjAgUvGF"`, `projectId: "prj_U2cs0Aad9PhGQhZOQx63RvS5qnm1"`
   - Tool: `vercel` -> `get_deployment` prüfen, bis `readyState == "READY"`
2. Live-Domain prüfen:
   - Production URL: `https://bouldermate.ch` (bzw. `https://boulder-mate.vercel.app`)
   - HTTP Status 200 sicherstellen und verifizieren, dass die App fehlerfrei lädt.
