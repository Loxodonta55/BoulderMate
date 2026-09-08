# SPEC-012: Turnier & Boulder Jam Events (Hallen-Wettkämpfe, Live-Scoring & Leaderboard)

## Status: APPROVED / READY FOR BACKLOG
**Created**: 2026-09-08  
**Author / Lead**: Boris & Antigravity  
**Domain**: Gym Event Management, Live Competition Scoring & Realtime Leaderboards  

---

## 1. Executive Summary & Problemstellung

Viele Boulderhallen veranstalten ca. **1 bis 2 Mal pro Jahr** ein großes Community-Turnier (z. B. Sommer-Jam, Herbst-/Winter-Cup, Season-Opener oder Hallen-Meisterschaft).
Bislang erfolgt die Erfassung der Begehungen bei solchen Breitensport-Events häufig über analoge Papier-Laufzettel ("Scorecards") mit Bleistift oder über isolierte, unhandliche Web-Formulare von Drittanbietern. Das führt zu:
- Hohen organisatorischen Aufwänden (manuelles Abtippen hunderter Zettel durch das Hallenpersonal am Wettkampfabend).
- Intransparenz während des Events (kein Live-Zwischenstand für Teilnehmer und Zuschauer).
- Kreidestift- und Zettel-Chaos in der Halle.
- Einem Medienbruch zum regulären Kletterer-Profil in BoulderMate (Erfolge aus dem Cup landen nicht im persönlichen Logbuch).

**Die Lösung mit SPEC-012**: Ein nativer, chalk-proof **Turnier-Event-Modus** in BoulderMate.
- Hallenbetreiber/Schrauber können Events in wenigen Minuten anlegen und Boulder (#1 bis #50) markieren.
- Kletterer treten dem Event mit 1 Tap bei und haken vor der Wand mit extrem schneller 2-Tap-Bedienung ihre Bouldererfolge (`⚡ Flash` oder `✅ Top`) ab.
- Punkte werden in Echtzeit berechnet und über ein Supabase-Realtime **Live-Leaderboard** (in der App sowie als Beamer-Dashboard für die Halle) visualisiert.
- Erfolgreich getoppte Event-Boulder fließen auf Wunsch automatisch in das persönliche BoulderMate-Logbuch ein.

---

## 2. "Grill Me" — Kritische Fragen, Randfälle & Architekturentscheidungen

Im Rahmen des "Grill Me"-Architekturreviews wurden alle kritischen Fragen und Edge-Cases beleuchtet und entschieden:

### Frage 1: Welches Punktesystem für Flash vs. Top?
*Hintergrund*: Es gibt feste Punkte pro Boulder, Stufen-Boni oder dynamische Punktepools (wie HardMoves/Blocsport, wo ein Boulder 1.000 Punkte durch die Anzahl der Topper teilt).
- **Entscheidung**: In Phase 1 ein **transparentes Stufen- & Bonus-Modell**:
  - Jeder Boulder hat einen Basiswert (z.B. gestaffelt nach Bouldernummer: Boulder #1–10 = 100 Pkt, #11–20 = 200 Pkt, #41–50 = 500 Pkt ODER jeder Boulder hat 100 Basis-Punkte).
  - **Top**: 100% der Boulder-Punkte.
  - **Flash (Durchstieg im 1. Versuch)**: Basis-Punkte + definierter Flash-Bonus (Standard: **+20%** bzw. 120 Punkte).
  - *Grill-Erkenntnis*: Dynamische Punktepools verwirren Freizeitkletterer während des Events ("Warum habe ich plötzlich weniger Punkte als vor 1 Stunde?"). Feste Punkte mit Flash-Bonus sind sofort verständlich, motivierend und rechnen deterministisch. Dynamische Pools werden als optionale Hallen-Einstellung für spätere Phasen vorbereitet.

### Frage 2: Braucht es Versuchs-Zählung (Attempts) oder Zonen-Wertung?
*Hintergrund*: Im IFSC-Weltcup zählt jede Zone und jeder Fehlversuch.
- **Entscheidung**: **Nein für die Qualifikationsphase von Breitensport-Cups.**
  - Mit Chalk an den Fingern tippt niemand 7 Fehlversuche sauber mit.
  - Das Interface muss "chalk-proof" sein: Nur 2 Statuswerte neben "Offen": `⚡ Flash` (1. Versuch) oder `✅ Top` (ab 2. Versuch).
  - Bei Punktegleichstand im Leaderboard zählt:
    1. Höchste Gesamtpunktzahl
    2. Meiste Flashes
    3. Meiste Tops
    4. Früherer Zeitstempel des letzten getoppten Boulders (Time-Tie-Breaker).

### Frage 3: Wie handhaben wir schlechten Hallenempfang (Offline-Sicherheit)?
*Hintergrund*: Boulderhallen sind oft massive Stahlbetonbauten oder Industriehallen mit Funklöchern. Wenn 200 Kletterer gleichzeitig loggen, bricht das Mobilfunknetz oft ein.
- **Entscheidung**: **Optimistic UI mit LocalStorage Sync Queue**.
  - Jeder Tap auf `Flash` oder `Top` wird sofort lokal im IndexedDB/LocalStorage persistiert und visuell als getoppt markiert.
  - Eine Hintergrund-Synchronisation (`EventSyncQueue`) sendet die Ticks sukzessive an Supabase.
  - Ein subtiles Statussymbol (`☁️ Gespeichert` vs. `🔄 2 Ticks in Warteschlange`) zeigt dem Kletterer die Netzwerksynchronisation.
  - Ticks tragen einen clientseitigen Signatur-Zeitstempel. Bei nachträglicher Netzwerkrückkehr kurz nach Wettkampfende gilt der lokale Erfassungszeitpunkt (mit max. 5 Min. Offline-Grace-Period).

### Frage 4: Wie verhindern wir Cheating & Trolling?
*Hintergrund*: Da Teilnehmer ihre Ticks selbst erfassen (Self-Scoring), könnte jemand kurz vor Schluss alle 50 Boulder auf Flash setzen.
- **Entscheidung**: 
  1. **Radikale Transparenz**: Jedes Profil im Leaderboard ist anklickbar. Jeder Teilnehmer sieht genau, wann welcher Konkurrent welchen Boulder getoppt hat. Bei Unstimmigkeiten greift soziale Kontrolle der Community.
  2. **Audit-Log**: Supabase speichert Erstellungszeitpunkte (`created_at`) exakt ab. Ungewöhnliche Häufungen (z.B. 10 Tops innerhalb von 30 Sekunden) werden für Admins geflaggt.
  3. **Finale-Schnitt**: Bei Top 6 / Finals für die Siegerehrung werden die Scores durch das Orga-Team vor Ort validiert.

### Frage 5: Wie werden Event-Boulder mit bestehenden Wand-Bouldern verknüpft?
*Hintergrund*: Schraubt die Halle für den Cup komplett neu, oder sind es bestehende Sektor-Boulder?
- **Entscheidung**: **Hybrides Modell**:
  - `tournament_boulders` können entweder auf einen existierenden Boulder in `boulders` verweisen ODER als eigenständige Event-Routen mit Startnummer, Wandsektor und Grifffarbe angelegt werden.
  - Ist der Boulder verknüpft, wird beim Event-Top automatisch ein regulärer Eintrag in der Tabelle `ascents` erzeugt (sofern noch nicht vorhanden). Der Kletterer muss also nicht am nächsten Tag alles nochmals im Profil nachtragen!

---

## 3. User Stories

### Kletterer & Teilnehmer
- **US-1**: Als Kletterer möchte ich auf der Hallen-Übersicht sehen, ob aktuell ein Turnier-Event stattfindet oder bevorsteht, und mich mit 1 Klick registrieren.
- **US-2**: Als Teilnehmer möchte ich meine Startkategorie auswählen (z. B. *Damen Fun*, *Herren Open*, *Ü40*).
- **US-3**: Als Teilnehmer möchte ich vor der Wand ein optimiertes **Event-Dashboard** öffnen können, das alle Wettkampf-Boulder (#1 bis #50) übersichtlich darstellt.
- **US-4**: Als Teilnehmer möchte ich einen Boulder mit genau 1 Tap als `⚡ Flash` oder `✅ Top` abhaken können (und Fehleingaben rückgängig machen können).
- **US-5**: Als Teilnehmer möchte ich live meinen aktuellen Rang, meine Gesamtpunkte und den Abstand zur Spitze sehen.
- **US-6**: Als Teilnehmer möchte ich das Live-Leaderboard nach meiner Kategorie filtern und sehen, welche Boulder meine Freunde/Konkurrenten geschafft haben.
- **US-7**: Als Teilnehmer möchte ich, dass getoppte Event-Boulder automatisch in mein normales BoulderMate-Logbuch übernommen werden.

### Hallenbetreiber & Schrauber (Event-Admin)
- **US-8**: Als Hallenbetreiber möchte ich einen neuen Cup anlegen (Titel, Datum, Start- und Endzeit, Wertungsklassen, Punktesystem).
- **US-9**: Als Schrauber möchte ich die Wettkampf-Boulder schnell zuweisen (entweder bestehende Boulder aus den Wandsektoren mit Nummern #1–50 versehen oder neue Event-Boulder erfassen).
- **US-10**: Als Hallenbetreiber möchte ich das Event mit einem Klick von `Draft` auf `Live` und später auf `Scoring Closed` schalten.
- **US-11**: Als Hallenbetreiber möchte ich eine für Hallen-Beamer / Großbildschirme optimierte URL aufrufen können (`Public Beamer Mode`), die das Leaderboard vollautomatisch im Split-Screen durchwechselt.
- **US-12**: Als Hallenbetreiber möchte ich die finalen Resultate sperren, die Sieger ehren und die Rangliste als CSV/PDF exportieren können.

---

## 4. Phasen-Modell des Event-Lifecycles

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   1. DRAFT   │ ──►  │ 2. UPCOMING  │ ──►  │   3. LIVE    │ ──►  │  4. CLOSED   │ ──►  │ 5. ARCHIVED  │
│ (Setup Bld.) │      │(Reg. offen)  │      │(Tick-Phase)  │      │(Siegerehrung)│      │(Hall of Fame)│
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
```

1. **Draft (Planung)**: Schrauber definieren Routen, Kategorien und Punkte. Für Kletterer unsichtbar.
2. **Upcoming (Ankündigung & Voranmeldung)**: Event wird in der Halle angezeigt. Teilnehmer können sich einschreiben und Kategorie wählen.
3. **Live (Wettkampf / Tick-Fenster)**:
   - Z.B. Samstag 13:00 bis 18:00 Uhr.
   - Kletterer können Ticks erfassen.
   - Realtime-Leaderboard läuft live mit.
4. **Scoring Closed (Wertungsstopp & Siegerehrung)**:
   - Ticks werden gesperrt.
   - Orga verifiziert Top-Platzierungen für evtl. Finals.
   - Beamer-Ansicht friert das Finale ein oder zeigt den Endstand.
5. **Archived (Historie & Hall of Fame)**:
   - Endstand dauerhaft einsehbar.
   - Event-Badge im Teilnehmer-Profil ("Teilnehmer Boulder Jam 2026 — Rang 12").

---

## 5. UI/UX-Spezifikation (Design System Konform)

Entsprechend SPEC-005 im rauen Bergführer- / Granit-Stil:
- **Hintergrund**: Obsidian/Granit (`#121316` / `#1A1C20`).
- **Akzentfarben**:
  - Event-Gold / Messing (`#C9A96E` / `#E5C383`) für Event-Badges, Trophäen und Rang 1.
  - Silber (`#A0A5AD`) für Rang 2, Bronze (`#A86D4A`) für Rang 3.
  - Flash-Symbol: Helles Blitz-Gelb (`#F6D365`).
  - Top-Symbol: Schiefergrün (`#4E9F74`).
- **Formensprache**: 0–2px Border-Radius, kantige Buttons, Space Grotesk Headlines.

### 5.1 Event-Quick-Tick Interface (Der Wettkampf-Screen)

Zwei umschaltbare Ansichten für maximale Flexibilität vor der Wand:

#### Ansicht A: Nummern-Grid (#1 bis #50) — Die High-Speed Matrix
- Kompakte Kacheln im 4er- oder 5er-Grid.
- Jede Kachel zeigt:
  - Bouldernummer prominent (z.B. `#14`).
  - Grifffarben-Punkt oder Rand in Original-Farbe.
  - Sektor-Kürzel (z.B. `S2`).
  - Punkteanzeige (z.B. `150 Pkt`).
  - Status:
    - Grau/Dunkel = Offen
    - Grün = Top (`✅ 150`)
    - Gold/Gelb = Flash (`⚡ 180`)
- **Interaction**:
  - Kurzer Tap auf Kachel öffnet das schlanke 2-Button BottomSheet: `[ ⚡ Flash ]` | `[ ✅ Top ]` | `[ ✖️ Reset ]`.
  - Haptisches Vibrations-Feedback bei erfolgreichem Loggen.

#### Ansicht B: Wandfoto mit Event-Badges
- In den regulären Sektor-Wandfotos erhalten Wettkampf-Pins ein auffälliges, gold umrandetes Nummern-Badge (`#14`).
- Tippen auf den Pin öffnet den Event-Quick-Logger direkt am Wandfoto.

### 5.2 Live-Leaderboard & Beamer-Modus
- **Leaderboard-Header**:
  - Live-Countdown ("Noch 01:24:12").
  - Filter-Pills: `Gesamt`, `Damen Fun`, `Herren Fun`, `Damen Open`, `Herren Open`.
  - Suchfeld für Teilnehmer.
  - "Mein Rang"-Sticky-Bar am unteren Bildschirmrand.
- **Beamer-Modus (`/gyms/[slug]/events/[eventSlug]/beamer`)**:
  - Vollbild, ablenkungsfrei, ultra-kontrastreich.
  - Automatische Paginierung / Karussell (durchscrollen der Ränge 1–30 alle 15 Sekunden).
  - Prominente Sponsoren- & Hallenlogos.

---

## 6. Technisches Design & Datenmodell (Supabase PostgreSQL)

### 6.1 Tabellen-Definitionen

```sql
-- 1. Status & Scoring Enums
CREATE TYPE tournament_status AS ENUM (
  'draft', 
  'upcoming', 
  'active', 
  'scoring_closed', 
  'completed', 
  'archived'
);

CREATE TYPE tournament_scoring_mode AS ENUM (
  'fixed_points',       -- Basis-Punkte pro Boulder + Flash-Bonus
  'dynamic_split',      -- 1000 Punkte / Anzahl Topper
  'zone_and_top'        -- IFSC-Style (Top & Zone)
);

CREATE TYPE tournament_tick_type AS ENUM (
  'flash',
  'top'
);

-- 2. Das Event
CREATE TABLE tournament_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,                             -- z.B. "Winter Boulder Jam 2026"
  slug TEXT NOT NULL,                              -- z.B. "winter-jam-2026"
  description TEXT,
  banner_url TEXT,
  status tournament_status DEFAULT 'draft' NOT NULL,
  scoring_mode tournament_scoring_mode DEFAULT 'fixed_points' NOT NULL,
  flash_bonus_percent SMALLINT DEFAULT 20 NOT NULL, -- Standard 20%
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  sync_to_regular_logbook BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(gym_id, slug)
);

-- 3. Wertungsklassen / Kategorien
CREATE TABLE tournament_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                              -- z.B. "Damen Fun", "Herren Open", "Ü40"
  gender TEXT,                                     -- 'female', 'male', 'all'
  sort_order SMALLINT DEFAULT 0 NOT NULL
);

-- 4. Event-Boulder
CREATE TABLE tournament_boulders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE NOT NULL,
  comp_number INT NOT NULL,                        -- 1 bis 50
  boulder_id UUID REFERENCES boulders(id) ON DELETE SET NULL, -- Optional verknüpft mit Wandfoto-Boulder
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  color_name TEXT NOT NULL,
  hex_color TEXT NOT NULL,
  base_points INT DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, comp_number)
);

-- 5. Teilnehmer
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES tournament_categories(id) ON DELETE RESTRICT NOT NULL,
  start_number INT,
  display_name TEXT NOT NULL,                      -- Name / Nickname für Leaderboard
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- 6. Ticks / Begehungen im Event
CREATE TABLE tournament_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES tournament_participants(id) ON DELETE CASCADE NOT NULL,
  tournament_boulder_id UUID REFERENCES tournament_boulders(id) ON DELETE CASCADE NOT NULL,
  tick_type tournament_tick_type NOT NULL,
  points_awarded INT NOT NULL,                     -- Berechnete Punkte zum Zeitpunkt des Ticks
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(participant_id, tournament_boulder_id)
);

-- Index für ultraschnelle Leaderboard-Abfragen
CREATE INDEX idx_tournament_ticks_event_part ON tournament_ticks(event_id, participant_id);
CREATE INDEX idx_tournament_boulders_event ON tournament_boulders(event_id, comp_number);
```

### 6.2 High-Performance Leaderboard View

```sql
CREATE OR REPLACE VIEW tournament_leaderboard_view AS
SELECT 
  p.id AS participant_id,
  p.event_id,
  p.user_id,
  p.display_name,
  p.start_number,
  c.id AS category_id,
  c.name AS category_name,
  COALESCE(SUM(t.points_awarded), 0) AS total_points,
  COUNT(CASE WHEN t.tick_type = 'flash' THEN 1 END) AS flash_count,
  COUNT(CASE WHEN t.tick_type = 'top' THEN 1 END) AS top_count,
  COUNT(t.id) AS total_ascents,
  MAX(t.created_at) AS last_tick_at
FROM tournament_participants p
JOIN tournament_categories c ON c.id = p.category_id
LEFT JOIN tournament_ticks t ON t.participant_id = p.id
GROUP BY p.id, p.event_id, p.user_id, p.display_name, p.start_number, c.id, c.name;
```

---

## 7. Akzeptanzkriterien (Acceptance Criteria)

### Setup & Verwaltung (Admin / Setter)
- [ ] **AC-1: Event-Erstellung**: Gym-Admins können unter `Halle > Turniere` ein neues Event mit Titel, Datum, Uhrzeit, Kategorien und Bonusregeln anlegen.
- [ ] **AC-2: Boulder-Zuweisung**: Admins können 1–60 Bouldernummern definieren und entweder existierende Wand-Boulder per Klick zuordnen oder Schnellerfassung (Nummer + Grifffarbe + Sektor) nutzen.
- [ ] **AC-3: Status-Transitionen**: Admins können den Status steuern (`Draft` -> `Upcoming` -> `Active` -> `Scoring Closed` -> `Archived`).

### Teilnahme & Tick-Erfassung (Kletterer)
- [ ] **AC-4: Event-Teilnahme**: Kletterer können in der Halle dem Event beitreten, ihren Teilnehmernamen bestätigen und ihre Kategorie wählen.
- [ ] **AC-5: 2-Tap High-Speed Logging**:
  - Klick auf Boulderkachel im Nummern-Grid öffnet Schnellauswahl: `Flash ⚡` (100 Pkt + Bonus) oder `Top ✅` (100 Pkt).
  - Zweiter Klick loggt und schließt den Dialog.
  - Kachel färbt sich sofort entsprechend ein.
- [ ] **AC-6: Tick-Rücknahme / Korrektur**: Versehentlich geloggte Ticks können während des aktiven Events mit 1 Tap gelöscht oder zwischen Flash und Top gewechselt werden.
- [ ] **AC-7: Automatische Logbuch-Synchronisation**: Ist `sync_to_regular_logbook` aktiv und der Boulder verknüpft, wird zeitgleich ein regulärer Eintrag in `ascents` erzeugt.
- [ ] **AC-8: Offline-Toleranz**: Bei Verbindungsabbruch werden Ticks lokal in der Queue zwischengespeichert und beim nächsten Reconnect automatisch synchronisiert.

### Leaderboard & Auswertung
- [ ] **AC-9: Live-Leaderboard**: Die Rangliste sortiert primär nach Gesamtpunkten, sekundär nach Flashes, tertiär nach Tops.
- [ ] **AC-10: Kategorie-Filterung**: Ranglisten können blitzschnell nach Gesamtwertung oder einzelnen Kategorien (z.B. *Damen Fun*) gefiltert werden.
- [ ] **AC-11: Realtime-Updates**: Bei neuen Ticks aktualisiert sich die Rangliste im Vordergrund per Supabase-Realtime ohne Neuladen der Seite.
- [ ] **AC-12: Beamer-Modus**: Eine öffentlich erreichbare Großbildschirm-Ansicht (`/events/[slug]/beamer`) stellt die Top-Platzierten mit Auto-Scroll für Hallenmonitore dar.
- [ ] **AC-13: Wettkampf-Ende**: Sobald das Event `scoring_closed` erreicht, werden Logging-Buttons deaktiviert und das Endresultat fixiert.

---

## 8. Rollout-Plan & Meilensteine

1. **M1: Datenmodell & Backend-Migration**:
   - Tabellen `tournament_events`, `tournament_categories`, `tournament_boulders`, `tournament_participants`, `tournament_ticks`.
   - RLS-Policies (Teilnehmer dürfen nur eigene Ticks schreiben; Leaderboard ist öffentlich lesbar).
2. **M2: Kletterer Quick-Tick Interface & Leaderboard**:
   - Grid-Ansicht `#1 bis #50` im Klettererbereich.
   - Live-Leaderboard mit Kategorie-Tabs und Realtime-Subscription.
3. **M3: Admin-Verwaltung & Beamer-Modus**:
   - Event-Wizard für Hallenbetreiber.
   - Vollbild Beamer-View für die Hallen-Wand.
4. **M4: Logbuch-Integration & Profil-Badges**:
   - Auto-Sync in reguläre `ascents`.
   - Turnier-Erfolge und Rang-Auszeichnung im Kletterer-Profil.
