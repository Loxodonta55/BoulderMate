# SPEC-001: Hallen- & Sektor-Verwaltung

## Status: DONE

## Summary
Ermöglicht Hallen-Betreibern und Admins das Abbilden ihrer Boulderhalle in der App: Anlegen der Halle, Konfigurieren des halleneigenen Bewertungssystems (Farben gemappt auf Fontainebleau-Schwierigkeitsbänder) sowie Erstellen und Verwalten von Sektoren inklusive Wandfotos und Priorisierungsreihenfolge. Dies bildet das fundamentale Datenmodell für die Routenerfassung und Kletterer-Navigation.

## User Stories
- **US-1**: Als Hallen-Admin möchte ich meine Boulderhalle mit Namen und optionalen Kontaktdaten registrieren, damit Kletterer und Schrauber sie finden und nutzen können.
- **US-2**: Als Hallen-Admin möchte ich das Farbsystem meiner Halle definieren und den Farben Referenzbereiche der Fontainebleau-Skala zuordnen, damit Kletterer und Schrauber ein einheitliches Verständnis der Schwierigkeit haben.
- **US-3**: Als Hallen-Admin möchte ich Sektoren (Wandbereiche) mit Name und aktuellem Wandfoto anlegen sowie per Drag & Drop sortieren, damit Boulder auf einer visuellen Wandkarte verortet werden können.
- **US-4**: Als Hallen-Admin möchte ich das Wandfoto eines Sektors bei Umbauten aktualisieren können, ohne dass bestehende Boulder-Markierungen verloren gehen.
- **US-5**: Als Kletterer möchte ich eine Übersicht der Sektoren einer Halle mit Wandfotos sehen, um mich in der Halle visuell zu orientieren.

## Acceptance Criteria
- [x] **AC-1**: Ein eingeloggter Nutzer kann eine neue Halle mit Pflichtfeld `name` anlegen (optionale Felder: `address`, `city`, `logo_url`, `website`). Der Ersteller erhält automatisch die Rolle `admin` in `gym_members`.
- [x] **AC-2**: Ein Hallen-Admin kann das hallenspezifische Farbsystem (`grade_scales`) anlegen und bearbeiten. Jede Farbe besitzt `color_name`, `color_hex`, `difficulty_label`, `font_range_min`, `font_range_max` und `sort_order`.
- [x] **AC-3**: Sektoren erfordern `name` und ein valides `wall_photo_url`.
- [x] **AC-4**: Sektoren können per Drag & Drop in ihrer Anzeigereihenfolge (`sort_order`) sortiert werden.
- [x] **AC-5**: Bei Aktualisierung des Sektor-Wandfotos bleiben bestehende relative Boulder-Koordinaten (`position_x`, `position_y` als 0.0–1.0) unverändert erhalten.
- [x] **AC-6**: Sektoren mit aktiven Bouldern können nicht versehentlich gelöscht werden (Sicherheitsabfrage / Validierung).
- [x] **AC-7**: Kletterer können Hallen suchen und eine Übersicht aller Sektoren mit Wandfoto und aktiver Boulder-Anzahl einsehen.

## Technical Design

### Data Model

```sql
-- Gyms (Hallen)
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  website TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Gym Members & Roles (Admin, Setter, Member)
CREATE TABLE gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'setter', 'member')) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (gym_id, user_id)
);

-- Grade Scales (Halleneigene Farbskala mit Font-Mapping)
CREATE TABLE grade_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  difficulty_label TEXT NOT NULL,
  font_range_min TEXT NOT NULL,
  font_range_max TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Sectors (Wandbereiche)
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  wall_photo_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### API / RLS Policy
- `gyms`: SELECT für alle; INSERT für authentifizierte User; UPDATE/DELETE nur für Admins des Gyms.
- `gym_members`: SELECT für alle Hallenmitglieder; INSERT/UPDATE/DELETE nur für Admins.
- `grade_scales`: SELECT öffentlich; INSERT/UPDATE/DELETE nur Gym-Admins.
- `sectors`: SELECT öffentlich; INSERT/UPDATE/DELETE nur Gym-Admins.

### UI / UX (Design System SPEC-005 Konform)
- **Visuelle Ästhetik**: Dark-Mode First (`--bg-primary: #121212`, `--bg-surface: #1E1E1E`), kantige Formensprache (0px Radius für Karten und Eingabefelder, 2px für Buttons), keine Drop-Shadows.
- **Typografie**: Space Grotesk Bold Uppercase für Headlines (`Hallen-Verwaltung`, `Sektoren`), Inter für Body, Space Mono für Grade und Zähler.
- **Hallen-Erstellung**: Minimalistisches Formular mit 0px Ecken, 1px Border `#333333` und großzügigem Schwarzraum.
- **Grading-Konfiguration**: Farb-Badges im soliden Look; Farben der Hallenskala sind die einzigen gesättigten Akzente im sonst monochrom-granitfarbenen Interface.
- **Sektoren-Verwaltung**: Block-Karten (`0px` Radius) mit Wandfoto-Thumbnail, Reorder-Handle und klarem 24px Screen-Padding.
- **Kletterer-Übersicht**: Übersichtliche Wandkarten mit Wandfoto, Routenzähler in Space Mono und 1px Granit-Bordüre (`#333333`).

## Dependencies
- Depends on: Supabase Auth & Storage Setup
- Blocks: SPEC-002 (Batch-Foto-Boulder-Erfassung), SPEC-003 (Boulder-Detail & Bewertung)

## Out of Scope
- Point-of-Sale / Hallen-Kassensystem-Integration
- GPS-Ortung oder automatische Check-ins
- Komplexe Hallenpläne (3D oder Vektor-CAD)

## Open Questions
- Keine (im Grill-Me Interview geklärt).

## Verification Evidence
- **Automatisierte Tests**: `tests/gymSectorManagement.test.ts` (7 von 7 Tests erfolgreich bestanden)
  - AC-1: Gym-Erstellung mit Name als Pflichtfeld & automatische Zuweisung der Admin-Rolle an den Ersteller in `gym_members` ✓
  - AC-2: Farb- & Gradingsystem (`grade_scales`) Konfiguration nur für Gym-Admins autorisiert ✓
  - AC-3: Validierung von `name` und `wall_photo_url` als Pflichtfelder für Sektoren ✓
  - AC-4: Neu-Sortierung und Aktualisierung von `sort_order` für Sektoren ✓
  - AC-5: Aktualisierung des Wandfotos erhält relative Boulder-Koordinaten (`position_x`, `position_y`) lückenlos unverändert ✓
  - AC-6: Sicherheits-Sperre verhindert versehentliches Löschen von Sektoren mit aktiven Bouldern ✓
  - AC-7: Hallen-Suche und Sektor-Übersicht inklusive aktiver Boulder-Zähler für Kletterer ✓
- **Type-Check & Build**: `tsc --noEmit` fehlerfrei, `vite build` erfolgreich generiert (3.71s).

