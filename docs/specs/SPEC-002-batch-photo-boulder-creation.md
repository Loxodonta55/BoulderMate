# SPEC-002: Batch-Foto-Boulder-Erfassung

## Status: DONE

## Summary
Ermöglicht Schraubern (Route Settern) nach einem Schraubtag, alle neuen Boulder einer Wand in unter 3 Minuten direkt auf dem Wandfoto zu erfassen und veraltete Boulder zu archivieren. Durch einfachen Tap auf das Wandfoto wird die Position markiert, ein schlankes Bottom-Sheet öffnet sich und erfordert lediglich die Auswahl der Hallenfarbe. Zusätzliche Charakteristiken (Radar-Chart mit 5 Achsen, Name, Notizen) sind optional mit Smart-Defaults belegt. Änderungen werden gesammelt als Draft geführt und am Ende per Bestätigung im Batch veröffentlicht.

## User Stories
- **US-1**: Als Schrauber möchte ich nach dem Schrauben ein frisches Foto der Wand aufnehmen oder das bestehende Foto wählen, um den aktuellen Griffzustand der Wand abzubilden.
- **US-2**: Als Schrauber möchte ich durch Antippen der Wandposition im Foto direkt einen Boulder-Pin setzen können, um die Position intuitiv festzuhalten.
- **US-3**: Als Schrauber möchte ich im Bottom-Sheet mit einem einzigen Tap die Farbe/Schwierigkeit festlegen, wobei die zuletzt genutzte Farbe vorausgewählt ist, um minimale Zeit pro Boulder zu benötigen.
- **US-4**: Als Schrauber möchte ich optional ein 5-Achsen Radar-Chart (Kraft, Technik, Balance, Koordination, Flexibilität) zur Stil-Charakterisierung ausfüllen (Default 3/3/3/3/3).
- **US-5**: Als Schrauber möchte ich bestehende Boulder an der Wand als halbtransparente Pins sehen und durch Antippen unkompliziert als "abgeschraubt" archivieren können.
- **US-6**: Als Schrauber möchte ich gesetzte Pins nachträglich per Drag verschieben oder per Tap bearbeiten können.
- **US-7**: Als Schrauber möchte ich vor Veröffentlichung eine Zusammenfassung aller neuen und archivierten Boulder prüfen und die Veröffentlichung im Batch bestätigen.

## Acceptance Criteria
- [x] **AC-1**: Der Workflow ist nur für Nutzer mit Rolle `setter` oder `admin` für das gewählte Gym zugänglich. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-2**: Schrauber kann für einen Sektor ein neues Wandfoto hochladen (welches das Sektorfoto aktualisiert) oder das vorhandene nutzen. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-3**: Tap auf eine freie Stelle des Fotos erzeugt einen neuen Pin mit relativen Koordinaten `position_x` und `position_y` (0.0 bis 1.0) und öffnet das Bottom-Sheet. *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*
- [x] **AC-4**: Das Bottom-Sheet verlangt als einziges Pflichtfeld die Auswahl einer aktiven Hallenfarbe (`grade_scale_id`). Radar-Slider (1-5), Name und Notizen sind optional. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-5**: Nach Speichern eines Pins schließt sich das Sheet sofort und der Nutzer kann direkt den nächsten Pin setzen. Die zuletzt gewählte Farbe bleibt als Vorauswahl aktiv. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-6**: Bestehende aktive Boulder des Sektors werden als semitransparente Marker gerendert. Ein Klick darauf bietet "Archivieren" und "Bearbeiten". *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*
- [x] **AC-7**: Pins können per Long-Press und Drag auf dem Bild verschoben werden; Pinch-to-Zoom unterstützt präzise Platzierung. *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*
- [x] **AC-8**: Neu erfasste Boulder verbleiben im Status `draft`, bis der Nutzer in der Zusammenfassungsansicht auf "Veröffentlichen" tippt. *(Getestet in `tests/spec002.test.ts`)*
- [x] **AC-9**: Beim Klick auf "Veröffentlichen" werden alle Drafts transaktional auf `active` gesetzt und als archiviert markierte Boulder auf `archived` gesetzt. *(Getestet in `tests/spec002.test.ts` & `spec002Components.test.tsx`)*

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
  radar_kraft SMALLINT CHECK (radar_kraft BETWEEN 1 AND 5) DEFAULT 3,
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

### UI / UX
- **Canvas / Bild-Interaktion**: Responsive Bildkomponente mit Pan/Zoom und SVG/HTML-Pin-Overlay.
- **Marker-Zustände**:
  - Neu/Draft: Vollfarbiger Kreis in Boulder-Farbe mit weißem Rand und Schatten.
  - Bestehend: Halbtransparenter Kreis.
  - Zur Archivierung markiert: Durchgestrichen mit rotem X-Badge.
- **Bottom-Sheet Formular**: Native/BottomSheet-Komponente, horizontaler Farb-Button-Scroll/Grid, 5 Slider für Radar-Werte, Speichern-Button mit direktem Feedback.
- **Summary Dialog**: Modal mit Zähler (z.B. "+6 neu, -2 archiviert") und finalem Action-Button "Jetzt veröffentlichen".

## Dependencies
- Depends on: SPEC-001 (Gym & Sector Management)
- Blocks: SPEC-003 (Boulder-Detail & Bewertung)

## Out of Scope
- Automatische Erkennung von Klettergriffen per KI / Computer Vision.
- Video-Upload während des Erfassens.
- Zeichnen von Linien/Topos über mehrere Griffe (im MVP genügt Start-/Schwerpunkt-Pin).

## Open Questions
- Keine (im Grill-Me Interview geklärt).
