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

## Design Principles & UI Guidelines

> Vollständiges Design-System: siehe [SPEC-005](docs/specs/SPEC-005-design-system.md)

**Zielgruppe**: 20–50 Jahre, alternativ, naturverbunden, problemlösungsorientiert.

1. **Schlank & Aufgeräumt**: Wenige Elemente pro Screen, grosszügiger Schwarzraum, klare Hierarchien. Kein visual clutter.
2. **Dark-Mode First**: Granit-Hintergrund, Sandstein-/Kreide-/Messing-Akzente. Hallenfarben sind die einzigen kräftigen Farben.
3. **Kantig & Geometrisch**: Border-Radius 0–2px, keine Glassmorphismus-Bubbles, keine Pill-Shapes. Felsblock-Ästhetik.
4. **Old School Kletterer Charakter**: Markante Typografie (Uppercase Headlines), subtile Granit-Texturen, Kreide-Patina. Patagonia-Katalog trifft Bergführer-Handbuch.
5. **Schrauber unprominent**: Kletterer sehen 2 Tabs (Halle + Profil), Setter/Admins sehen 3 (+Schrauben). Admin-Tools drängen sich nicht auf.
6. **Nur funktionale Animationen**: Mikro-Transitions (250ms max). Kein Bounce, kein Confetti, kein Parallax.

## Code Quality & Deployment Pipeline

- Run `lint` and `type-check` (`npm run build`) before committing
- All code changes require tests (`npm test -- --run`)
- Follow clean-code principles
- Use the spec as acceptance criteria
- **Niemals unaufgefordert mocken/faken**: Echte Services und Protokolle implementieren; keine Fake-Logins oder Mocks ohne expliziten User-Befehl.

### 🚀 End-to-End Deployment Pipeline (Git ──► Supabase ──► Vercel)
Jedes Deployment MUSS vollständig und geschlossen über diese 4 Schritte laufen:
1. **Pre-Flight (Lokal)**: `npm run build` und `npm test -- --run` müssen fehlerfrei grün sein.
2. **Git & GitHub**: Saubere Semantic Commits auf `main` und `git push origin main`.
3. **Supabase Sync**: Schema- und Migrationsstand in Supabase per Supabase-MCP verifizieren (Tabellen, RLS, DDL).
4. **Vercel & Domain Verification**: Vercel-Deployment per Vercel-MCP auf Status `READY` prüfen und `https://bouldermate.ch` live verifizieren.

## Tech Stack

- **Frontend**: React Native / Web (Cross-Platform: iOS + Android + Web via Vite)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Vercel (Production Domain: bouldermate.ch)
- **Auth**: Social Login (Google / Apple) + E-Mail
- **Styling**: Dark-Mode First, kantige Formensprache (siehe SPEC-005)
- **Testing**: Vitest & React Testing Library
