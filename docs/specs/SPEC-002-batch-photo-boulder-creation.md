# SPEC-002: Batch-Foto-Boulder-Erfassung

## Status: DONE

## Summary
Ermöglicht Schraubern (Route Settern) nach einem Schraubtag, alle neuen Boulder einer Wand in unter 3 Minuten direkt auf dem Wandfoto zu erfassen und veraltete Boulder zu archivieren. Durch einfachen Tap auf das Wandfoto wird die Position markiert, ein schlankes Bottom-Sheet öffnet sich und erfordert lediglich die Auswahl der Hallenfarbe. Zusätzliche Charakteristiken (Radar-Chart mit 6 Achsen: Maximalkraft, Kraft-Ausdauer, Technik, Balance, Koordination, Flexibilität, Name, Notizen) sind optional mit Smart-Defaults belegt. Änderungen werden gesammelt als Draft geführt und am Ende per Bestätigung im Batch veröffentlicht. Bestehende Routen werden mit Kraft $\rightarrow$ Maximalkraft und Kraft-Ausdauer $= 3$ migriert.

## User Stories
- **US-1**: Als Schrauber möchte ich nach dem Schrauben ein frisches Foto der Wand direkt aus der App mit der Kamera aufnehmen oder eine Datei von meinem Computer hochladen, um den aktuellen Griffzustand der Wand abzubilden.
- **US-2**: Als Schrauber möchte ich durch Antippen der Wandposition im Foto direkt einen Boulder-Pin setzen können, um die Position intuitiv festzuhalten.
- **US-3**: Als Schrauber möchte ich im Bottom-Sheet mit einem einzigen Tap die Farbe/Schwierigkeit festlegen, wobei die zuletzt genutzte Farbe vorausgewählt ist, um minimale Zeit pro Boulder zu benötigen.
- **US-4**: Als Schrauber möchte ich optional ein 6-Achsen Radar-Chart (Maximalkraft, Kraft-Ausdauer, Technik, Balance, Koordination, Flexibilität) zur Stil-Charakterisierung ausfüllen (Default 3/3/3/3/3/3). Bei bestehenden Routen wird die bisherige Kraft als Maximalkraft übernommen und Kraft-Ausdauer initial auf 3 gesetzt.
- **US-5**: Als Schrauber möchte ich bestehende Boulder an der Wand als halbtransparente Pins sehen und durch Antippen unkompliziert als "abgeschraubt" archivieren können.
- **US-6**: Als Schrauber möchte ich gesetzte Pins nachträglich per Drag verschieben oder per Tap bearbeiten können.
- **US-7**: Als Schrauber möchte ich vor Veröffentlichung eine Zusammenfassung aller neuen und archivierten Boulder prüfen und die Veröffentlichung im Batch bestätigen.
- **US-8**: Als Schrauber möchte ich durch Gedrückt-Halten der Maus ein Auswahl-Quadrat (Rechteck) aufziehen können, um mehrere Boulder auf einmal zu markieren und im Batch zu löschen.
- **US-9**: Als Schrauber möchte ich eine Route direkt im Schrauberbereich vollständig und endgültig löschen können (nicht nur als "abgeschraubt" archivieren), wenn sie versehentlich angelegt wurde oder komplett entfernt werden soll.

## Acceptance Criteria
- [x] **AC-1**: Der Workflow ist nur für Nutzer mit Rolle `setter` oder `admin` für das gewählte Gym zugänglich. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-2**: **Wandfoto-Aktualisierung (Kamera & Datei-Upload)**: Schrauber kann für einen Sektor ein neues Wandfoto direkt aus der App per Kamera aufnehmen (Live-Kamera-Viewfinder via WebRTC oder nativer Kamera-Trigger) oder von der Festplatte/Laptop hochladen, welches das Sektorfoto aktualisiert, während bestehende relative Boulder-Koordinaten unberührt bleiben. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-3**: Tap auf eine freie Stelle des Fotos erzeugt einen neuen Pin mit relativen Koordinaten `position_x` und `position_y` (0.0 bis 1.0) und öffnet das Bottom-Sheet. *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*
- [x] **AC-4**: Das Bottom-Sheet verlangt als einziges Pflichtfeld die Auswahl einer aktiven Hallenfarbe (`grade_scale_id`). Die 6 Radar-Slider (Maximalkraft, Kraft-Ausdauer, Technik, Balance, Koordination, Flexibilität von 1-5, Default 3), Name und Notizen sind optional. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-5**: Nach Speichern eines Pins schließt sich das Sheet sofort und der Nutzer kann direkt den nächsten Pin setzen. Die zuletzt gewählte Farbe bleibt als Vorauswahl aktiv. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-6**: Bestehende aktive Boulder des Sektors werden als semitransparente Marker gerendert. Ein Klick darauf bietet "Archivieren" und "Bearbeiten". *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*
- [x] **AC-7**: Pins können per Long-Press und Drag auf dem Bild verschoben werden; Pinch-to-Zoom unterstützt präzise Platzierung. *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*
- [x] **AC-8**: Neu erfasste Boulder verbleiben im Status `draft`, bis der Nutzer in der Zusammenfassungsansicht auf "Veröffentlichen" tippt. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-9**: Beim Klick auf "Veröffentlichen" werden alle Drafts transaktional auf `active` gesetzt und als archiviert markierte Boulder auf `archived` gesetzt. *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*
- [x] **AC-10**: **Präzise 1:1 Koordinaten-Ausrichtung (Schrauber ⟷ Kletterer)**: Das Wandfoto und die Pins werden in beiden Bereichen (`BatchBoulderWorkflow` und `ClimberSectorView`) über dieselbe einheitliche Komponente `WallPhotoCanvas` (`mode="setter"` bzw. `mode="climber"`) unbeschnitten im natürlichen Seitenverhältnis gerendert (ohne `object-cover`, ohne Flexbox-Zentrierungsclipping und ohne ungleiche vertikale Höhenbeschränkungen), sodass relative Koordinaten `(position_x, position_y)` auf allen Bildschirmgrößen und Zoomstufen exakt auf denselben Griffen liegen. Pin-Marker sind über identische Pin-Zentrierung (`-translate-x-1/2 -translate-y-1/2`) mathematisch exakt ausgerichtet. *(Getestet in `tests/pinCoordinateAlignment.test.tsx`)*
- [x] **AC-11**: **Dynamische Farbsystem-Alignierung (Schrauber ⟷ Admin & Single Source of Truth)**:
  - Das Schrauber-Studio (`BatchBoulderWorkflow`, `BoulderBottomSheet`, `WallPhotoCanvas`) bindet keine statischen Farblisten ein, sondern bezieht alle Farbstufen dynamisch aus der Single Source of Truth des hallenspezifischen Farbsystems (`gymStorage` via `useGymSectorData`).
  - Für "6a plus Winterthur" und "Minimum Zürich" stehen exakt die realen Hallenfarben aus Supabase zur Verfügung:
    - 6a plus: Sonnengelb, Blau, Grün, Gelb, Rot, Weiss, Schwarz, Beige.
    - Minimum Zürich: Grün, Blau, Gelb, Rot, Schwarz, Weiß, Pink, Türkis.
  - Im Bottom-Sheet (`BoulderBottomSheet`) wird die Farbauswahl-Palette direkt aus den aktiven `gradeScales` der ausgewählten Halle gerendert.
  - Jede Admin-Änderung (Farbanpassungen, Umbenennungen, Reihenfolgen, Ergänzungen oder Deaktivierungen) wird reaktiv über das Event `bouldermate:gradescales_updated` ohne Neuladen der Seite sofort in die Schrauber-Farbauswahl übertragen.
  - Gesetzte Pins erhalten ihren Hex-Farbcode strikt über das aufgelöste `gradeScale`-Objekt ihrer `grade_scale_id`. *(Getestet in `tests/gradeScaleSync.test.tsx`)*
- [x] **AC-12**: **Rechteck- & Quadrat-Mehrfachauswahl & Multi-Löschung (Marquee Selection)**:
  - Durch Gedrückt-Halten der linken Maustaste und Ziehen über das Wandfoto wird ein sichtbares Auswahl-Quadrat (Rechteck mit gestricheltem Rand und Eck-Markern) aufgespannt.
  - Alle Boulder-Pins, deren Koordinaten innerhalb des aufgespannten Bereichs liegen, werden visuell hervorgehoben (Goldener Auswahlring und Selektionsbadge) und in die Mehrfachauswahl übernommen.
  - Eine schwebende Aktionsleiste zeigt die Anzahl der markierten Boulder („X Boulder ausgewählt“) und bietet die Aktionen „Ausgewählte löschen“ (sowie Tastatur-Shortcut `Delete`/`Backspace`) und „Abbrechen“.
  - Beim Klick auf „Löschen“ werden alle selektierten Boulder (sowohl Entwürfe als auch bestehende Routen) aus dem System entfernt. *(Getestet in `tests/boxSelectionDelete.test.tsx`)*
- [x] **AC-13**: **Permanentes Löschen von Routen im Schrauber-Bereich (Alle Sektoren & Zero-Mock-Garantie)**:
  - Im Bottom-Sheet (`BoulderBottomSheet`) existiert für bestehende Routen neben der Archivierungsoption ("Abgeschraubt") ein expliziter Button zum endgültigen Löschen der Route ("Route löschen").
  - Ein Bestätigungsdialog fragt vor der Durchführung ab ("Route unwiderruflich löschen?"), um versehentliche Klicks abzufangen.
  - Nach Bestätigung wird die Route über `deleteWallBoulder` kaskadierend aus allen lokalen Stores (`boulderapp_wall_boulders_v2`, `boulderapp_gym_boulders`, `boulderapp_boulders`), allen verknüpften Begehungen, Bewertungen und Kommentaren sowie aus Supabase entfernt.
  - **Sektor-übergreifende Produktions-Konsistenz**: Für **alle Sektoren** (nicht nur Slab Vorne, sondern ebenso Ecke Vorne, Zwischenwand Vorne, Überhang Vorne, Ecke Mitte, Cave usw.) gilt strikt Supabase als Single Source of Truth. Veraltete oder fiktive Mock-Routen (IDs beginnend mit `boulder-6a-`, `boulder-existing-`, `boulder-overhang-`) werden unwiderruflich getombstonet (`PERMANENTLY_PURGED_BOULDER_IDS`) und können weder auf Mobilgeräten noch auf Desktop wiederauferstehen.
  - Das Wandfoto und die Routenliste aktualisieren sich ohne Seiten-Reload in Echtzeit. *(Getestet in `tests/spec002Components.test.tsx`)*

## Technical Design

### Data Model

```sql
CREATE TYPE boulder_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE boulders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE NOT NULL,
  grade_scale_id UUID REFERENCES grade_scales(id) NOT NULL,
  position_x REAL NOT NULL CHECK (position_x >= 0.0 AND position_x <= 1.0),
  position_y REAL NOT NULL CHECK (position_y >= 0.0 AND position_y <= 1.0),
  name TEXT,
  notes TEXT,
  setter_id UUID REFERENCES auth.users(id) NOT NULL,
  status boulder_status NOT NULL DEFAULT 'draft',
  radar_maximalkraft SMALLINT CHECK (radar_maximalkraft BETWEEN 1 AND 5) DEFAULT 3,
  radar_kraftausdauer SMALLINT CHECK (radar_kraftausdauer BETWEEN 1 AND 5) DEFAULT 3,
  radar_technik SMALLINT CHECK (radar_technik BETWEEN 1 AND 5) DEFAULT 3,
  radar_balance SMALLINT CHECK (radar_balance BETWEEN 1 AND 5) DEFAULT 3,
  radar_koordination SMALLINT CHECK (radar_koordination BETWEEN 1 AND 5) DEFAULT 3,
  radar_flexibilitaet SMALLINT CHECK (radar_flexibilitaet BETWEEN 1 AND 5) DEFAULT 3,
  font_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_boulders_sector_status ON boulders(sector_id, status);
```

### API / RLS Policy
- `boulders`:
  - SELECT: `status = 'active'` für alle sichtbar. `status = 'draft'` nur für Ersteller (`setter_id`) und Gym-Admins.
  - INSERT: Nur Nutzer mit `role IN ('setter', 'admin')` im verknüpften Gym.
  - UPDATE: Ersteller oder Gym-Admin.
  - Veröffentlichungs-RPC: Eine atomare Datenbankfunktion `publish_boulder_batch(sector_id, draft_ids, archive_ids)` führt Veröffentlichung und Archivierung in einer einzigen Transaktion aus.

### UI / UX (Design System SPEC-005 Konform)
- **Canvas & Pins**:
  - Pins auf dem Wandfoto sind kreisrund (`border-radius: 50%`) als einzige funktionale Ausnahme der kantigen Geometrie.
  - Neuer Pin (Draft): Volle Hallenfarbe mit 2px Kreide-Rand (`#F5F0E8`).
  - Bestehender Pin: 40% Deckkraft (`opacity: 0.4`).
  - Zur Archivierung vorgemerkt: Durchgestrichen mit diagonalem Strich und dezentem Lehm-Rot (`#A0522D`).
  - Selektierter Pin: Statischer Kreide-Ring (`#F5F0E8`), kein animiertes Pulsieren.
- **Bottom-Sheet Formular**:
  - Konsequent kantig (`border-radius: 0px`), keine weichen Rundungen oder Bubble-Looks.
  - Hintergrund in Granit-Surface (`#1E1E1E`), 1px Border `#333333`.
  - Farbauswahl als Reihe quadratischer Farb-Blöcke (Hallenfarben).
  - 5 Radar-Slider in Sandstein-Optik mit Space Mono Ziffern (1–5).
  - Speichern-Button in Kreide-Weiß (`#F5F0E8`) mit 2px Ecken-Radius.
- **Zusammenfassungs-Dialog**:
  - Felsblock-Modal (`0px` Radius) mit Space Grotesk Headline, Space Mono Mengenangaben und klarem Kontrast.

## Dependencies
- Depends on: SPEC-001 (Gym & Sector Management)
- Blocks: SPEC-003 (Boulder-Detail & Bewertung)

## Out of Scope
- Automatische Erkennung von Klettergriffen per KI / Computer Vision.
- Video-Upload während des Erfassens.
- Zeichnen von Linien/Topos über mehrere Griffe (im MVP genügt Start-/Schwerpunkt-Pin).

## Open Questions
- Keine (im Grill-Me Interview geklärt).
