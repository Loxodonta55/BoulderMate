# SPEC-013: Sauberer Datenhaushalt, Produktions-Integrität & Environment-Isolation

## Status: APPROVED (Konzipiert via Grill-Me Methodik)

## Summary
Garantiert den 100% verlässlichen, sauberen und unantastbaren Datenhaushalt auf der Produktions-Umgebung (`bouldermate.ch` / Supabase). Verhindert technisch und architektonisch, dass Deployments, Builds oder Client-Initialisierungen bestehende Hallen, Sektoren, Farbskalen, Boulder, Rollen/Rechte, Begehungen oder Statistiken überschreiben, verdoppeln oder verfälschen. Etabliert einen strikten **Code-Only Deployment-Workflow**, eine kontrollierte **Downward-Sync-Pipeline** (PROD ──► Lokal) für realistische Testdaten und DB-Constraints gegen Datenanomalien.

---

## 1. Grill-Me Kernanalyse: Ursachenforschung & Pain Points

In der Grill-Me Analyse wurden die konkreten Ursachen identifiziert, warum Deployments bisher Sektoren, Farbschemata und Routen zerschossen haben:

1. **Destruktiver & unkontrollierter Upward-Sync beim Deployment**:
   - Skripte wie `sync-all-to-supabase.js` enthielten statische Hardcoded-Sektoren und Testboulder. Wurden diese im Deployment-Prozess ausgeführt, wurden mühsam vom Schrauber oder Admin gepflegte Live-Daten mit veralteten Testdaten überschrieben oder dupliziert.
2. **Fehlende Unique Constraints in Supabase PostgreSQL**:
   - Die Tabellen `grade_scales` und `sectors` besaßen bisher keine eindeutigen Indizes auf `(gym_id, lower(trim(color_name)))` bzw. `(gym_id, lower(trim(name)))`.
   - Bei jedem versehentlichen Push wurden Farben mehrfach angelegt (z. B. 7x „Weiß“ / „Weiss“ in der Halle 6a plus).
3. **Client-seitige Mock-Injektion bei leerem Browser-Cache**:
   - Rief ein Nutzer die Seite mit leerem Browser-Cache auf, führte `App.tsx` synchron `ensureInitialGymData()` und `SEED_CRUD_BOULDERS` aus, *bevor* der asynchrone Supabase-Abruf abgeschlossen war.
   - Führte der Nutzer danach eine Speicherung aus, wurden lokale Mock-Objekte nach Supabase hochgespielt.
4. **Fehlende Trennung von Test- und Produktionsdaten**:
   - Es gab keinen sauberen Einbahnstraßen-Mechanismus, um Live-Daten als Testdaten nach unten (lokal) zu ziehen. Entwickler experimentierten gegen dieselbe Datenbank, wodurch Testdaten in die Produktion schwappten.

---

## 2. Die 5 Säulen des Sauberen Datenhaushalts

```
                  ┌──────────────────────────────────────────────────┐
                  │          SUPABASE PRODUKTION (SACRED)            │
                  │  Hallen • Sektoren • Farbskalen • Boulder        │
                  │  Rollen & Rechte • Begehungen • Statistiken      │
                  └─────────────────────────┬────────────────────────┘
                                            │
                             DOWNWARD ONLY  │  npm run db:pull
                            (Kein Push!)   │  (Schnappschuss für Dev)
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │               LOKALE TEST-UMGEBUNG               │
                  │   • Realistischer Offline-Snapshot               │
                  │   • Gefahrloses Testen und Experimentieren       │
                  │   • Keine Schreibrechte auf PROD-Stammdaten      │
                  └─────────────────────────┬────────────────────────┘

   DEPLOYMENT (Git ──► Vercel):
   ┌───────────────┐        ┌──────────────┐        ┌──────────────────┐
   │  Git Commit   │ ────►  │ Vercel Build │ ────►  │ bouldermate.ch   │
   │  (TypeScript) │        │ (Static App) │        │ (HTML/CSS/JS)    │
   └───────────────┘        └──────────────┘        └──────────────────┘
       ⛔ ABSOLUT ZERO DATEN-MUTATIONEN / ZERO SEEDING IM DEPLOYMENT!
```

### Säule 1: Code-Only Deployments (Strict Zero-Data Release)
- Ein Deployment über Git und Vercel überträgt **ausschließlich Code, Styles und statische Assets**.
- Im gesamten Deployment-Prozess wird **niemals** ein Daten-Seed, DB-Reset oder ein Upward-Sync-Skript ausgeführt.
- Es kommen durch ein Deployment **keine neuen Test-Daten auf Produktion** hinzu.

### Säule 2: Produktions-Unberührbarkeit (Immutability from Dev/Deploy)
- Produktion ist die lebende *Single Source of Truth*.
- Alle Daten-Sync-Skripte (`sync-all-to-supabase.js`, `sync-images-to-supabase.js`) werden mit einer **Sicherheitssperre** (`--confirm-production-push`) versehen und standardmäßig blockiert.
- Niemals dürfen Hallen, Sektoren, Sektor-Reihenfolgen (`sort_order`), Farbschemata oder Routen via Skript auf Supabase überschrieben werden. Sektor-Reihenfolgen werden über `syncSectorOrderToSupabase` in Supabase persistiert und vor jedem Re-Seeding geschützt.

### Säule 3: Kontrollierter Downward-Sync (PROD ──► Lokal)
- Entwickler benötigen realistische Testdaten auf dem Laptop.
- Bereitstellung des CLI-Tools `npm run db:pull` (`scripts/pull-from-prod.js`):
  - Zieht den aktuellen Live-Bestand von Supabase (Gyms, Sektoren, Farbskalen, aktive Boulder).
  - Speichert ihn lokal als bereinigten Entwicklungs-Snapshot (`src/data/prodSnapshot.json`).
  - Ermöglicht lokales Entwickeln und Testen mit echtem Datenbild, ohne jemals Schreibzugriff auf Produktion zu benötigen.

### Säule 4: Client-seitige Zero-Injektions-Garantie
- Auf `bouldermate.ch` (und generell bei konfigurierter Supabase-Verbindung) werden **keine statischen Mock-Boulder oder Mock-Sektoren injiziert**.
- Wenn Supabase konfiguriert ist, lädt die App autoritativ aus Supabase.
- Lokale Seed-Arrays (`SEED_EXISTING_BOULDERS`, `SEED_CRUD_BOULDERS`) greifen **ausschließlich** im reinen Offline-Modus ohne Supabase-Anbindung.

### Säule 5: Datenbank-Schutz & Deduplizierung (Postgres Constraints)
- Supabase Schema-Härtung:
  - `UNIQUE (gym_id, lower(trim(color_name)))` auf `grade_scales`
  - `UNIQUE (gym_id, lower(trim(name)))` auf `sectors`
- Bereinigung vorhandener Geisterdaten:
  - 6a plus: Zusammenführung der 7 doppelten "Weiß"/"Weiss"-Skalen auf die primäre ID `3e322450-4c56-4422-8c88-7f518b716352`.
  - Harmonische Bereinigung doppelter Sortierordnungen.

---

## 3. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Hallenbetreiber & Schrauber)**: Als Hallenbetreiber oder Schrauber möchte ich mich darauf verlassen können, dass meine mühsam angelegten Sektoren, Wandfotos, Routen und Farbskalen bei keinem Software-Update überschrieben oder verändert werden.
- **US-2 (Kletterer)**: Als Kletterer möchte ich sicherstellen, dass meine persönlichen Begehungen, Grade-Einschätzungen, Notizen und Statistiken bei Deployments unberührt bleiben.
- **US-3 (Entwickler / Boris)**: Als Entwickler möchte ich jederzeit mit einem einfachen Befehl (`npm run db:pull`) den aktuellen Stand von der Produktion auf meinen lokalen Rechner holen, um realitätsnah zu testen, ohne Gefahr zu laufen, die Produktion zu beschädigen.

### Acceptance Criteria
- [x] **AC-1 (Deployment-Schutz)**:
  - Bei `git push origin main` und im Vercel-Build laufen keinerlei SQL-Skripte oder `sync-all-to-supabase.js`.
  - Die Deployment-Dokumentation und Skills verbieten ausdrücklich jeden Daten-Sync beim Deployment.
- [x] **AC-2 (Downward-Sync Tooling)**:
  - Ein Befehl `npm run db:pull` existiert in `package.json`.
  - Das Skript extrahiert Hallen, Sektoren, Farbskalen und Boulder in `src/data/prodSnapshot.json`.
  - Der Downward-Sync ist rein lesend (`SELECT`) und modifiziert zu keinem Zeitpunkt Daten auf Supabase.
- [x] **AC-3 (Skript-Sicherheitssperre)**:
  - Wird `node scripts/sync-all-to-supabase.js` versehentlich aufgerufen, bricht das Skript sofort mit einem Fehler ab, sofern nicht explizit das Flag `--confirm-production-push` übergeben wurde.
- [x] **AC-4 (Client-Startup Guardrail)**:
  - `App.tsx` und `gymStorage.ts` überschreiben keine lokalen Daten mit Beispieldaten, wenn eine Supabase-Verbindung aktiv ist.
  - Das Laden aus Supabase hat Vorrang; lokale Mock-Bouldern werden nicht in Supabase hochgespielt.
- [x] **AC-5 (Datenbank-Integrität & Deduplizierung)**:
  - Duplikate in `grade_scales` (insb. "Weiß"/"Weiss" auf 6a plus) sind vollständig auf die primäre ID `3e322450-4c56-4422-8c88-7f518b716352` bereinigt.
  - Eindeutigkeits-Constraints (`UNIQUE (gym_id, lower(trim(color_name)))`) schützen die Tabellen vor zukünftigen Mehrfacheinträgen; clientseitig werden deutsche Schreibvarianten (`ß` vs `ss`) einheitlich harmonisiert.
- [x] **AC-6 (Sektor-übergreifende Zero-Ghost-Route Policy & Universal Mock-Purge)**:
  - In keinem Sektor einer Halle (weder 6a plus noch Minimum Zürich) dürfen fiktive Mock-/Dummy-Boulder existieren.
  - Veraltete Seed-IDs (z. B. `boulder-6a-...`, `boulder-existing-...`, `boulder-overhang-...`) werden bei Client-Start und Sync-Lauf automatisch getombstonet und aus allen Stores (`boulderapp_wall_boulders_v2`, `boulderapp_gym_boulders`, `boulder_routes_v1`) entfernt.
  - Bei Synchronisation mit Supabase gilt ein strikter Abgleich: Lokale Boulder eines Sektors, die nicht in der Supabase-Produktionsdatenbank existieren, werden bereinigt, sodass Desktop, Mobilgeräte, Schrauber und Kletterer auf exakt denselben 15 aktiven Routen (6a plus) bzw. 27 aktiven Routen (Minimum Zürich) operieren.
