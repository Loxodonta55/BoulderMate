# SPEC-004: Profil, Statistiken & Logbuch

## Status: DONE

## Summary
Stellt Kletterern ein persönliches Profil mit vier Kernkennzahlen (Anzahl Tops, Anzahl Flashes, bester Top, bester Flash), einer visuellen Grad-Verteilung als gestapeltes horizontales Balkendiagramm (Flash/Top pro Hallenfarbe) und einem chronologischen Logbuch der eigenen Begehungen bereit. Ein Hallenfilter erlaubt das Umschalten zwischen globalem Gesamtüberblick und hallenspezifischer Auswertung. Das Profil ist als eigener Tab in der Bottom-Navigation erreichbar. Header und Statistiken sind öffentlich sichtbar, das Logbuch ist privat.

## User Stories
- **US-1**: Als Kletterer möchte ich einen eigenen Profil-Tab mit meinem Nickname, Avatar und „Mitglied seit"-Datum sehen, damit ich eine persönliche Heimat in der App habe.
- **US-2**: Als Kletterer möchte ich auf einen Blick vier Kennzahlen sehen (Total Tops, Total Flashes, bester Top, bester Flash), um meinen aktuellen Leistungsstand zu kennen.
- **US-3**: Als Kletterer möchte ich ein horizontales Balkendiagramm meiner getoppten Boulder pro Hallenfarbe/Schwierigkeitsband sehen, mit visueller Unterscheidung zwischen Flashes und regulären Tops.
- **US-4**: Als Kletterer möchte ich die Statistiken nach einer bestimmten Halle filtern können oder „Alle Hallen" als Gesamtüberblick sehen.
- **US-5**: Als Kletterer möchte ich unter den Statistiken eine chronologische Liste meiner letzten Begehungen (Logbuch) sehen und per Tap zur Boulder-Detailseite navigieren.
- **US-6**: Als Kletterer möchte ich meinen Nickname und mein Profilbild über einen Settings-Screen ändern können, sowie mich ausloggen oder meinen Account löschen.
- **US-7**: Als Kletterer möchte ich, dass andere User mein öffentliches Profil (Header + KPIs + Grad-Verteilung) sehen können, wenn sie in einem Ascent-Feed auf meinen Namen tippen, aber mein Logbuch privat bleibt.

## Acceptance Criteria
- [x] **AC-1: Profil-Tab**: Ein dedizierter Tab in der Navigation zeigt das eigene Profil mit Header (Avatar, Nickname, Mitglied seit) und einem Gear-Icon für Settings.
- [x] **AC-2: KPI-Kacheln**: Vier Kennzahl-Kacheln werden prominent über der Grad-Verteilung angezeigt:
  - Anzahl getoppte Boulder (Flash + Top)
  - Anzahl Flashes
  - Bester Top (höchstes Farbband getoppt)
  - Bester Flash (höchstes Farbband geflasht)
- [x] **AC-3: Grad-Verteilung**: Horizontales gestapeltes Balkendiagramm mit einer Zeile pro Hallenfarbe/Schwierigkeitsband. Balken in der Hallenfarbe, visuell unterteilt in Flashes (hellerer Abschnitt) und Tops (dunklerer Abschnitt). Gesamtzahl als Label am Balkenende.
- [x] **AC-4: Hallenfilter**: Ein Dropdown oder Chip-Leiste oberhalb der Statistiken erlaubt die Auswahl zwischen „Alle Hallen" (Default) und einzelnen Hallen. Filter wirkt auf KPIs, Grad-Verteilung und Logbuch gleichzeitig.
- [x] **AC-5: Logbuch (privat)**: Unterhalb der Grad-Verteilung zeigt eine scrollbare Liste die eigenen Begehungen in umgekehrt chronologischer Reihenfolge. Jede Zeile enthält: Farb-Badge, Hallenname, Sektorname, Begehungstyp-Icon (⚡/✅/🎯) und Datum. Tap navigiert zur Boulder-Detailseite.
- [x] **AC-6: Öffentliches Profil**: Wenn ein anderer User auf den Nickname/Avatar (z.B. im Ascent-Feed der Boulder-Detailseite) tippt, sieht er Header + KPIs + Grad-Verteilung. Das Logbuch wird dort **nicht** angezeigt.
- [x] **AC-7: Settings-Screen**: Erreichbar über Gear-Icon im Profil-Header. Bietet: Nickname ändern, Avatar-Foto hochladen/ändern, Logout-Button, Account-löschen-Button (mit Bestätigungsdialog).
- [x] **AC-8: Leerer Zustand**: Bei null Begehungen zeigen KPIs „0" / „–" und die Grad-Verteilung einen motivierenden Leer-Zustand (z.B. „Logge deinen ersten Boulder!").

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
- **Navigation**: Kletterer sehen 2 Tabs (`HALLE` und `PROFIL` mit integriertem Logbuch).

**Profil-Screen Layout:**

```
┌─────────────────────────────────┐
│  [■ Avatar]  NICKNAME      ⚙️   │
│              Mitglied seit Mai  │
│─────────────────────────────────│
│  [Alle Hallen ▼]               │
│─────────────────────────────────│
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  │  42  │ │  12  │ │ 🔴   │ │ 🟡   │
│  │ Tops │ │Flash │ │Best  │ │Best  │
│  │      │ │      │ │ Top  │ │Flash │
│  └──────┘ └──────┘ └──────┘ └──────┘
│─────────────────────────────────│
│  GRAD-VERTEILUNG                │
│                                 │
│  Grün   ████████░░░░  8 (3⚡)   │
│  Blau   ██████████░░  12 (4⚡)  │
│  Gelb   ██████░░░░░░  10 (2⚡)  │
│  Orange ████░░░░░░░░  6 (1⚡)   │
│  Rot    ██░░░░░░░░░░  4 (1⚡)   │
│  Schwarz█░░░░░░░░░░░  2 (1⚡)   │
│                                 │
│  ░ = Flash │ █ = Top            │
│─────────────────────────────────│
│  LOGBUCH (Privat)               │
│                                 │
│  🔴 Minimum · Überhang  ⚡ Heute│
│  🔵 Minimum · Platte    ✅ Heute│
│  🟡 Minimum · Wand A    ✅ Gest.│
│  🟢 Kraftwerk · Dach    ⚡ 02.09│
│  🔴 Minimum · Überhang  🎯 01.09│
│  ...                            │
│                                 │
└────────────┬────────────────────┘
             │  🪨 HALLE  │ 🎒 PROFIL
             └────────────┴────────────┘
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
- Persönliches 5-Achsen Radar-Chart (Stärken/Schwächen-Profil) → Post-MVP
- Aktivitäts-Kalender / Heatmap → Post-MVP
- Flash-Rate als Prozentzahl → Post-MVP (aktuell implizit über KPIs ablesbar)
- Zeitverlauf / Fortschrittsgraph → Post-MVP
- Hallen-Ranking / Leaderboard → Post-MVP
- Freundesliste / Social Feed → Post-MVP

## Open Questions
- Keine (im Grill-Me Interview geklärt).
