# SPEC-004: Persönlicher Bereich & Statistiken (Overall Statistik & Deep Dive)

## Status: APPROVED (Konsolidierung: 2-Pfeiler-Navigation mit Sub-Bereichen Overall & Deep Dive)

## Summary
Konsolidiert den persönlichen Kletterer-Bereich in eine klare 2-Pfeiler-Architektur: In der Hauptnavigation für Kletterer gibt es exklusiv die zwei Kernbereiche **Wand & Sektoren** (Routen bewerten & Hallen-Topo) und **Meine Statistiken** (Persönlicher Bereich). Die bisherigen separaten Menüpunkte „Mein Profil“ und „Kletterlogbuch“ entfallen als getrennte Top-Level-Tabs und sind nun nahtlos im persönlichen Statistikbereich gebündelt.

Unter **Meine Statistiken** stehen zwei fokussierte Sub-Bereiche zur Verfügung:
1. **Overall Statistik**: Sehr nah am bisherigen Profil – Header (Avatar, Nickname, Mitglied seit, Settings), Hallenfilter, vier Kernkennzahlen (Tops, Flashes, Bester Top, Bester Flash auf Basis der allgemeinen **Fontainebleau-Skala**), visuelle Fontainebleau-Grad-Verteilung, Athleten-Performance & Stil-Radar (SPEC-008) sowie ein kompaktes persönliches Logbuch der letzten Begehungen.
2. **Deep Dive**: Detaillierte Kletterlogbuch- und Routenanalyse – analog zum bisherigen Logbuch mit vollständiger Filterschnittstelle (Suche, Begehungsart Flash/Top/Projekt, Wandneigung Platte/Überhang/Dach, Grifftypen Leisten/Sloper/Zangen etc., Standort/Halle), aggregiertem Kennzahlen-Breakdown (Flash-Rate, Winkel- und Griffartenverteilung), interaktiver Routenliste mit Detailkarten sowie Werkzeugen zur Schnellerfassung und Datenverwaltung/Backup.

Header und aggregierte Statistiken sind öffentlich sichtbar, detaillierte Einträge und das private Logbuch bleiben geschützt.

## User Stories
- **US-1**: Als Kletterer möchte ich im Kletterbereich eine aufgeräumte 2-Pfeiler-Navigation („Wand & Sektoren“ und „Meine Statistiken“) haben, ohne durch separate Profil- und Logbuch-Tabs verwirrt zu werden.
- **US-2**: Als Kletterer möchte ich unter „Meine Statistiken“ im Sub-Bereich „Overall Statistik“ mein Kletterer-Profil, den Hallenfilter, vier Kern-KPIs (Tops, Flashes, Bester Top Fb, Bester Flash Fb) und die Fontainebleau-Gradverteilung sehen.
- **US-3**: Als Kletterer möchte ich im Sub-Bereich „Deep Dive“ tief in mein persönliches Logbuch eintauchen, nach Wandneigungen, Grifftypen, Begehungsarten und Hallen filtern und detaillierte Kennzahlen zu meinem Kletterstil analysieren.
- **US-4**: Als Kletterer möchte ich im Sub-Bereich „Deep Dive“ auch direkt Begehungen erfassen, bearbeiten oder meine Logbuch-Daten als Backup sichern können.
- **US-5**: Als Kletterer möchte ich mein Profilbild, meinen Nickname und Account-Einstellungen über das Gear-Icon im Statistik-Header verwalten können.
- **US-6**: Als Kletterer möchte ich, dass andere User mein öffentliches Profil (Header + KPIs + Fontainebleau-Grad-Verteilung) sehen können, aber mein Deep-Dive-Logbuch privat bleibt.

## Acceptance Criteria
- [x] **AC-1: 2-Pfeiler-Hauptnavigation**: Die Kletterer-Hauptnavigation enthält nur noch 2 Tabs:
  - `Wand & Sektoren` (Routen erfassen/bewerten, Wandfoto-Topo, Bouldernavigation)
  - `Meine Statistiken` (Persönlicher Bereich)
  - Es gibt keine separaten Top-Level-Tabs „Mein Profil“ oder „Kletterlogbuch“ mehr.
- [x] **AC-2: Sub-Bereich „Overall Statistik“**: Bietet die vertraute Gesamtübersicht:
  - Header mit Avatar, Nickname, Mitglied seit, Settings-Icon
  - Hallenfilter („Alle Hallen“ vs. Einzelspeicher)
  - 4 KPI-Kacheln (Tops, Flashes, Bester Top Fb, Bester Flash Fb)
  - Gestapeltes horizontales Fontainebleau-Balkendiagramm (Flash ⚡ vs. Top ✅)
  - Umschaltbar auf Stil & Performance (5-Achsen-Radar SPEC-008)
  - Kompaktes persönliches Logbuch der jüngsten Begehungen
- [x] **AC-3: Sub-Bereich „Deep Dive“**: Bietet die detaillierte Kletterlogbuch-Analyse:
  - Detaillierte BoulderStatsBar (Total Boulders, Tops, Flashes, Flash Rate %, Durchschnittsgrad, Wandwinkel- und Grifftypen-Breakdown)
  - Vollwertige Filterleiste (Textsuche, Begehungsart, Wandneigung, Grifftyp, Location, Sortierung)
  - Detaillierte Liste der erfassten Routen mit Status-Badges und Edit/Delete-Möglichkeiten
  - Aktionsbuttons für „Begehung erfassen“ und „Backup / Datenverwaltung“
- [x] **AC-4: Nahtloser Sub-Wechsel**: Zwischen „Overall Statistik“ und „Deep Dive“ kann mit einem Klick ohne Seitenneuladen gewechselt werden.
- [x] **AC-5: Öffentliches Profil**: Zeigt ausschließlich den Header + KPIs + Fontainebleau-Grad-Verteilung. Weder private Einstellungen noch der Deep-Dive-Logbuch-Bereich sind öffentlich zugänglich.
- [x] **AC-6: Settings & Auth-Aktionen**: Einstellungen (Nickname, Avatar, Logout, Account löschen) bleiben über das Zahnrad-Icon im Header des persönlichen Statistikbereichs verfügbar.

## Technical Design

### Data Model

Die Statistiken werden aus den bestehenden Tabellen `ascents` (SPEC-003) und `boulders` (SPEC-002) aggregiert. Keine neuen Haupttabellen nötig, lediglich ein `profiles`-Eintrag pro User.

```sql
-- Profil-Erweiterung für öffentliche Darstellung
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Automatische Profil-Erstellung bei Registrierung (Supabase Trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Kletterer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Statistik-Queries

```sql
-- KPIs für einen User (optional nach gym_id gefiltert)
SELECT
  COUNT(*) FILTER (WHERE a.type IN ('flash', 'top')) AS total_tops,
  COUNT(*) FILTER (WHERE a.type = 'flash') AS total_flashes
FROM ascents a
JOIN boulders b ON b.id = a.boulder_id
JOIN sectors s ON s.id = b.sector_id
WHERE a.user_id = :user_id
  AND (:gym_id IS NULL OR s.gym_id = :gym_id);

-- Grad-Verteilung: Tops & Flashes pro Farbe/Schwierigkeitsband
SELECT
  gs.id AS grade_scale_id,
  gs.color_name,
  gs.color_hex,
  gs.difficulty_label,
  gs.sort_order,
  COUNT(*) FILTER (WHERE a.type = 'flash') AS flash_count,
  COUNT(*) FILTER (WHERE a.type = 'top') AS top_count,
  COUNT(*) FILTER (WHERE a.type IN ('flash', 'top')) AS total_count
FROM ascents a
JOIN boulders b ON b.id = a.boulder_id
JOIN grade_scales gs ON gs.id = b.grade_scale_id
JOIN sectors s ON s.id = b.sector_id
WHERE a.user_id = :user_id
  AND a.type IN ('flash', 'top')
  AND (:gym_id IS NULL OR s.gym_id = :gym_id)
GROUP BY gs.id, gs.color_name, gs.color_hex, gs.difficulty_label, gs.sort_order
ORDER BY gs.sort_order;

-- Bester Top / Bester Flash (höchstes Farbband)
SELECT
  gs.color_name,
  gs.color_hex,
  gs.difficulty_label,
  gs.font_range_max
FROM ascents a
JOIN boulders b ON b.id = a.boulder_id
JOIN grade_scales gs ON gs.id = b.grade_scale_id
JOIN sectors s ON s.id = b.sector_id
WHERE a.user_id = :user_id
  AND a.type = :ascent_type  -- 'flash' oder IN ('flash','top')
  AND (:gym_id IS NULL OR s.gym_id = :gym_id)
ORDER BY gs.sort_order DESC
LIMIT 1;

-- Logbuch (chronologisch, neueste zuerst)
SELECT
  a.id,
  a.type,
  a.created_at,
  gs.color_name,
  gs.color_hex,
  b.name AS boulder_name,
  s.name AS sector_name,
  g.name AS gym_name,
  b.id AS boulder_id
FROM ascents a
JOIN boulders b ON b.id = a.boulder_id
JOIN grade_scales gs ON gs.id = b.grade_scale_id
JOIN sectors s ON s.id = b.sector_id
JOIN gyms g ON g.id = s.gym_id
WHERE a.user_id = :user_id
  AND (:gym_id IS NULL OR s.gym_id = :gym_id)
ORDER BY a.created_at DESC
LIMIT 50;
```

### API / RLS Policy
- `profiles`: SELECT öffentlich (jeder kann Nickname + Avatar + created_at anderer User sehen). UPDATE nur eigenes Profil (`auth.uid() = id`).
- `ascents`: SELECT für eigene Einträge; für andere User nur COUNT-Aggregationen sichtbar (über Views/RPC), keine Einzeleinträge.
- Statistik-Daten werden über Supabase RPC-Funktionen oder Views bereitgestellt (kein direkter Tabellenzugriff für fremde Logbücher).

### UI / UX (Design System SPEC-005 Konform)
- **Visuelle Ästhetik**: Dark-Mode First (`--bg-primary: #121212`, `--bg-surface: #1E1E1E`, `--bg-subtle: #333333`), keine abgerundeten Ecken (`0px` Radius für Kacheln, Karten, Avatare).
- **Typografie**: Space Grotesk Bold Uppercase für Headlines, Space Mono für KPIs und Zahlen, Inter für Fließtext.
- **Avatar**: Quadratisch (`0px` Radius), bewusst gegen den Kreis-Standard.
- **Navigation**: Kletterer sehen 2 Haupt-Tabs (`WAND & SEKTOREN` und `MEINE STATISTIKEN`).
- **Sub-Navigation**: Unter `MEINE STATISTIKEN` gibt es zwei Sub-Bereiche: `OVERALL STATISTIK` und `DEEP DIVE`.

**Persönlicher Bereich: Meine Statistiken Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  [■ Avatar]  NICKNAME                            [⚙️]      │
│              Mitglied seit Mai                              │
├─────────────────────────────────────────────────────────────┤
│  [  OVERALL STATISTIK  ]  │  [       DEEP DIVE       ]      │
├─────────────────────────────────────────────────────────────┤
│  SUB-VIEW 1: OVERALL STATISTIK                              │
│  [Hallenfilter: Alle Hallen ▼]                              │
│  ┌──────┐  ┌──────┐  ┌───────────┐  ┌───────────┐           │
│  │  42  │  │  12  │  │  Fb 7a    │  │  Fb 6c+   │           │
│  │ Tops │  │Flash │  │ Best Top  │  │Best Flash │           │
│  └──────┘  └──────┘  └───────────┘  └───────────┘           │
│  FONTAINEBLEAU-GRAD-VERTEILUNG                              │
│  6a  ████████░░░░  8 (3⚡)                                  │
│  6b  ██████████░░  12 (4⚡)                                 │
│  6c  ██████░░░░░░  10 (2⚡)                                 │
│  Stil & Performance Radar (SPEC-008)                        │
│  Kompaktes persönliches Logbuch                             │
├─────────────────────────────────────────────────────────────┤
│  SUB-VIEW 2: DEEP DIVE                                      │
│  [BoulderStatsBar: Flash-Quote % | Avg-Grade | Neigung/Griff│
│  [BoulderFilter: Suche | Stil | Neigung | Griff | Ort | Sort]│
│  [Erfasste Routen Liste mit Cards, Edit, Delete, Plus-Btn]  │
│  [Backup / Datenverwaltung]                                 │
└─────────────────────────────────────────────────────────────┘
             │  🪨 WAND & SEKTOREN  │ 📊 MEINE STATISTIKEN
             └──────────────────────┴─────────────────────┘
```

**Öffentliches Profil (anderer User):**
- Gleicher Header + KPIs + Grad-Verteilung
- Kein Logbuch-Bereich, kein Settings-Icon
- „Zurück"-Navigation statt Tab-Navigation

**Settings-Screen:**
```
┌─────────────────────────────────┐
│  ← Einstellungen                │
│                                 │
│  Profilbild                     │
│  [Avatar]  [Foto ändern]        │
│                                 │
│  Nickname                       │
│  ┌─────────────────────────┐    │
│  │ BoulderMax              │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    Speichern             │    │
│  └─────────────────────────┘    │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│                                 │
│  [Ausloggen]                    │
│  [Account löschen]   ← rot     │
│                                 │
└─────────────────────────────────┘
```

## Dependencies
- Depends on: SPEC-001 (Gyms & Sectors), SPEC-002 (Boulders), SPEC-003 (Ascents & Ratings)
- Blocks: Post-MVP Features (Ranking/Leaderboard, erweitertes Statistik-Dashboard)

## Out of Scope
- Persönliches 5-Achsen Radar-Chart (Stärken/Schwächen-Profil) → Umgesetzt in [SPEC-008](file:///c:/Users/boris/Repos/BoulderApp/docs/specs/SPEC-008-climber-performance-attributes-statistics.md)
- Aktivitäts-Kalender / Heatmap → Post-MVP
- Flash-Rate als Prozentzahl → Post-MVP (aktuell implizit über KPIs ablesbar)
- Zeitverlauf / Fortschrittsgraph → Post-MVP
- Hallen-Ranking / Leaderboard → Post-MVP
- Freundesliste / Social Feed → Post-MVP

## Open Questions
- Keine (im Grill-Me Interview geklärt).
