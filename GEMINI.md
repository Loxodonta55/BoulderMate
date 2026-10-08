# BoulderMate

> Boulder & Climbing App — Spec Driven Development

## Project Overview

BoulderMate is a boulder/climbing application built with Spec Driven Development (SDD).
Every feature starts as a specification that aligns user requirements before implementation begins.

## Spec Driven Development Workflow (2-Phasen-Prinzip)

```
1. PLANUNG & BRAINSTORMING (Kollaborativ & Dialogstark)
   └── Sehr viel nachfragen, brainstormen, Alternativen & Vorschläge einbringen, ask_question aktiv nutzen

2. SPEZIFIKATION FESTHALTEN
   └── Abgestimmte Anforderungen präzise in docs/specs/ dokumentieren

3. UMSETZUNG (Sehr autonom)
   └── Zügig, selbstständig und end-to-end implementieren ohne Mikropausen

4. VERIFIKATION & SELF-HEALING
   └── Selbstständig testen, Fehler eigenständig beheben, Funktion sicherstellen
```

### Arbeitsweise & Leitprinzipien

#### 1. Planungs- & Brainstorming-Phase: Sehr viel nachfragen & beraten
- **Aktiv Nachfragen & Brainstormen**: Bei neuen Ideen, Anforderungen, Architektur- oder UX-Entscheidungen nicht voreilig Annahmen treffen. Stattdessen intensiv nachfragen, den Kontext ergründen und kreative Ideen austauschen.
- **Proaktive Vorschläge**: Dem User mehrere Optionen, Vor- und Nachteile sowie Best Practices vorschlagen.
- **Nutzung von `ask_question`**: Bei Mehrfachauswahlen, unklaren Anforderungen oder Design-Entscheidungen gezielt und strukturiert nachfragen.
- **Gemeinsames Schärfen der Specs**: Spezifikationen in `docs/specs/` werden im engen Dialog mit dem User iteriert und erst begonnen umzusetzen, wenn das Konzept steht.

#### 2. Umsetzungs- & Implementierungs-Phase: Sehr autonom
- **Hohe Autonomie**: Sobald die Richtung und Spezifikation geklärt sind, erfolgt die technische Realisierung extrem eigenständig.
- **End-to-End Execution**: Aufgaben in einem Durchlauf ohne unnötige Zwischenstopps oder wiederholte Genehmigungsfragen fertigstellen.
- **Self-Healing**: Schlagen Builds, Typen-Checks oder Unit-Tests fehl, werden die Fehler selbstständig analysiert und repariert.
- **Qualitätssicherung**: Vor Abschluss wird der Code durch automatisierte Tests gegen die Akzeptanzkriterien verifiziert.

#### 3. Striktes Verbot von unaufgeforderten Mocks & Fakes (Real-Implementation First)
- **NICHTS faken ohne expliziten Befehl**: Es ist strengstens verboten, Authentifizierung, Datenbanken, APIs, Backend-Dienste oder Benutzerdaten stillschweigend zu mocken, zu faken oder durch simulierte Dummy-Daten zu ersetzen, es sei denn, der User hat dies ausdrücklich und unmissverständlich befohlen.
- **Transparenz vor Simulation**: Fehlen Credentials, Backend-Services, API-Keys oder OAuth-Konfigurationen (z. B. Supabase URL, Google Cloud OAuth Client ID), muss dies sofort und transparent offengelegt werden. Es darf niemals ein Fake-Login oder Fake-Backend vorgegaukelt werden.
- **Echte Protokolle & echte Infrastruktur**: Features sind stets gegen echte Services (Supabase Auth, echte OAuth 2.0 PKCE-Flows, echte PostgreSQL-Tabellen) zu implementieren. Keine Mocks, keine Dummy-Personas, keine Fake-Logins ohne explizite Anweisung!

## Agent Configuration

### Primary Agents (Auto-routed via intelligent-routing)

| Agent | Domain | Use When |
| ------- | -------- | ---------- |
| `orchestrator` | Multi-Agent Coordination | Complex, multi-domain tasks |
| `project-planner` | Task Breakdown | New features, planning |
| `backend-specialist` | Server/API | API endpoints, business logic |
| `frontend-specialist` | UI/UX | Components, pages, styling |
| `database-architect` | Database | Schema, migrations, queries |
| `mobile-developer` | Mobile | React Native / Flutter |
| `test-engineer` | Testing | Unit, integration, E2E |
| `debugger` | Debugging | Bugs, errors, crashes |

### Supporting Agents

| Agent | Domain | Use When |
| ------- | -------- | ---------- |
| `security-auditor` | Security | Auth, vulnerabilities |
| `devops-engineer` | Deployment | CI/CD, production |
| `performance-optimizer` | Performance | Speed, Core Web Vitals |
| `explorer-agent` | Discovery | Codebase analysis |
| `documentation-writer` | Docs | Only when explicitly requested |
| `product-owner` | Product | Requirements, backlog |
| `product-manager` | Product | PRDs, user stories |

## Design Principles & UI Guidelines (Design System v2 «Chalk»)

> Vollständige Spezifikation: siehe [SPEC-020](docs/specs/SPEC-020-ux-overhaul-design-system-v2.md) (Design System v2 «Chalk»).

1. **Apple-like & Fokussiert**: Geordnet, leicht bedienbar, in 3 Sekunden verständlich (orientiert an Apple HIG / iOS-Fitness-App). Chrome schwebt als dezentes Overlay über dem Wandfoto.
2. **Auto Light / Dark**: Automatische Umschaltung nach Systempräferenz (`prefers-color-scheme`). Neutrale Graustufen; Hallenfarben sind die einzigen bunten Elemente.
3. **Ruhige Typografie**: Schriftfamilie **Inter** / Apple System Font, konsequentes **Sentence case** (kein generisches Uppercase), 4 feste Schriftgrößen (28/20/16/13), Zahlen in `tabular-nums`.
4. **Moderne Rundungen**: Abgerundete Formen (Karten 16px, Buttons 12px, Sheets 20px, Pins rund) statt harter Ecken; visuelle Trennung durch Flächen und Abstände.
5. **Navigation (2 Tabs)**: Kletterer navigieren über exakt 2 Tabs: **«Wand»** (Edge-to-Edge Wandfoto $\ge 70\,\%$ Viewport-Höhe, Sektorwahl per Swipe & Sektor-Pill) und **«Ich»** (Statistik, Pyramide, Verlauf).
6. **Bereichswechsel in Einstellungen**: Wechsel in Schrauber-Studio und Admin-Konsole ausschließlich über `Ich → Einstellungen → Arbeitsbereich`. Kein Pflicht-Role-Gateway; Verlassen über `«Fertig»` (oben links).
7. **2-Tap Chalk-Proof Logging**: 1 Tap auf Pin $\rightarrow$ 1 Tap auf Flash/Top $\rightarrow$ sofortiges Schließen des Sheets mit nicht-blockierendem Undo-Toast.
8. **Gast-Modus (Read-Only)**: Unangemeldete Besucher können die Wandansicht frei erkunden; erst Aktionen wie Loggen/Bewerten fordern zum Login auf.

## Code Quality & Deployment Pipeline

- Run `lint` and `type-check` (`npm run build`) before committing
- All code changes require tests: **Unit-Tests (Vitest) UND Playwright-E2E-Tests** für jedes Feature und jede sichtbare UI-Änderung, auch reine Design-/Text-Änderungen (CONSTITUTION §13). Fertig erst bei grünem `npm run test:all`; die Spec nennt die Testdateien.
- Follow clean-code principles
- Use the spec as acceptance criteria
- **Niemals unaufgefordert mocken/faken**: Echte Services und Protokolle implementieren; keine Fake-Logins oder Mocks ohne expliziten User-Befehl.

### 🚀 End-to-End Deployment Pipeline (Code-Only: Git ──► Vercel)
Jedes Deployment MUSS vollständig und geschlossen über diese Schritte laufen:
1. **Pre-Flight (Lokal)**: `npm run build` und `npm run test:all` (Unit + Playwright) müssen fehlerfrei grün sein.
2. **Git & GitHub**: Saubere Semantic Commits auf `main` und `git push origin main`.
3. **STRIKTE REGEL (KEINE DATENÜBERTRAGUNG BEIM DEPLOYMENT)**:
   - Beim Deployment werden **KEINERLEI Daten** (Farbskalen, Boulder, Sektoren, Fotos) übertragen oder synchronisiert.
   - Supabase auf PROD ist die Single Source of Truth.
   - Daten-Sync-Skripte (`sync-all-to-supabase.js`, `sync-images-to-supabase.js`) dürfen beim Deployment **NIEMALS** automatisch ausgeführt werden, sondern **AUSSCHLIESSLICH**, wenn der User explizit darum bittet.
   - Schema-Migrationen (neue Spalten/Tabellen via MCP) werden nur bei tatsächlichen Schema-Änderungen ausgeführt.
4. **Vercel & Domain Verification**: Vercel-Deployment per Vercel-MCP auf Status `READY` prüfen und `https://bouldermate.ch` live verifizieren.

## Tech Stack

- **Frontend**: React 19 + Vite PWA (mobile-first; nativer Wrapper optional)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Vercel (Production Domain: bouldermate.ch)
- **Auth**: Social Login (Google / Apple) + E-Mail
- **Styling**: Design System v2 «Chalk» (Apple-like, Auto Dark/Light, Inter, Tailwind CSS, siehe [SPEC-020](docs/specs/SPEC-020-ux-overhaul-design-system-v2.md))
- **Testing**: Vitest & React Testing Library
