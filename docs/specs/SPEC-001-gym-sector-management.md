# SPEC-001: Hallen- & Sektor-Verwaltung

## Status: DONE (Erweitert um Drag & Drop Sektor-Sortierung)

## Summary
Ermöglicht Hallen-Betreibern und Admins das Abbilden ihrer Boulderhalle in der App: Anlegen der Halle, Konfigurieren des halleneigenen Bewertungssystems (Farben gemappt auf Fontainebleau-Schwierigkeitsbänder) sowie Erstellen und Verwalten von Sektoren inklusive Wandfotos und Priorisierungsreihenfolge. Sektoren können vom Admin jederzeit intuitiv per **Drag & Drop** sortiert werden, sodass die Abfolge der Wandbereiche exakt der realen Hallengeometrie und dem Hallenrundgang entspricht. Dies bildet das fundamentale Datenmodell für die Routenerfassung und Kletterer-Navigation.

## User Stories
- **US-1**: Als Hallen-Admin möchte ich meine Boulderhalle mit Namen und optionalen Kontaktdaten registrieren, damit Kletterer und Schrauber sie finden und nutzen können.
- **US-2**: Als Hallen-Admin möchte ich das Farbsystem meiner Halle definieren und den Farben Referenzbereiche der Fontainebleau-Skala zuordnen, damit Kletterer und Schrauber ein einheitliches Verständnis der Schwierigkeit haben.
- **US-3**: Als Hallen-Admin möchte ich Sektoren (Wandbereiche) mit Name und Wandfoto anlegen und jederzeit per **Drag & Drop** in eine sinnvolle Hallenrundgangs-Reihenfolge bringen können (auch nachträglich bei Hallenumstellungen), damit Schrauber und Kletterer eine intuitive und logische Navigation vorfinden.
- **US-4**: Als Hallen-Admin möchte ich das Wandfoto eines Sektors bei Umbauten aktualisieren können, ohne dass bestehende Boulder-Markierungen verloren gehen.
- **US-5**: Als Kletterer möchte ich eine Übersicht der Sektoren einer Halle mit Wandfotos in der vom Admin festgelegten Reihenfolge sehen, um mich in der Halle visuell zu orientieren.

## Acceptance Criteria
- [x] **AC-2**: Ein Hallen-Admin kann das hallenspezifische Farbsystem (`grade_scales`) anlegen und bearbeiten. Jede Farbe besitzt `color_name`, `color_hex`, `difficulty_label`, `font_range_min`, `font_range_max` und `sort_order`.
  - **AC-2.1 (Cross-Area Reaktiv-Synchronisation & Kanonische Farbskalen)**:
    - Jede im Admin-Bereich konfigurierte Änderung am Farbsystem (Hinzufügen neuer Farben, Ändern von Farbname, Hex-Farbcode, Schwierigkeitsgrad, Font-Bändern, Umsortieren oder Löschen) synchronisiert sofort und ohne Seitenreload in das Schrauber-Studio (`BatchBoulderWorkflow`) und die Kletterer-App (`ClimberSectorView`).
    - `gymStorage.getGradeScales` fungiert als autoritative Single Source of Truth für das Hallen-Farbsystem und nutzt strikte Deduplizierung deutscher Schreibweisen (z. B. "Weiß" vs. "Weiss" über `color_name.trim().toLowerCase().replace(/ß/g, 'ss')`), sodass niemals doppelte oder divergierende Farbskalen zwischen Admin, Schrauber und Kletterer entstehen.
    - `batchBoulderService.getGradeScales` übernimmt stets die autoritativen Farbskalen aus `gymStorage` und hält den V2-Cache (`boulderapp_grade_scales_v2`) 1:1 synchron, sodass keine Geisterfarben oder gelöschten Skalen verbleiben.
    - Das Speichern im Admin löst das Event `bouldermate:gradescales_updated` aus, worauf der Hook `useGymSectorData` in allen aktiven Ansichten reaktiv anspricht.
  - **AC-2.2 (Non-destruktive Cloud-Synchronisation & Constraint-Harmonie)**:
    - Änderungen an Farbskalen werden via `syncGradeScalesToSupabase` non-destruktiv aufwärts mit der Supabase-Tabelle `grade_scales` abgeglichen. Dabei werden bestehende UUIDs remote über den normalisierten Farbnamen wiederverwendet, um Unique-Constraint-Verletzungen (`uq_grade_scales_gym_norm_color`) und Duplikate zuverlässig auszuschließen.
  - **AC-2.3 (Sofortige UUID-Konsistenz & Verhindern von Farbverfälschungen / Blau-Bug)**:
    - Neu angelegte oder bearbeitete Farbskalen erhalten bereits beim Speichern im Admin-Bereich eine valide UUID v4 (niemals temporäre String-IDs wie `scale_...`).
    - Das Speichern im Admin (`GradeScaleConfig`) synchronisiert sofort (`await syncGradeScalesToSupabase`) mit Supabase, bevor der Vorgang als erfolgreich bestätigt wird.
    - Beide Stores (`boulderapp_grade_scales` und `boulderapp_grade_scales_v2`) sowie Supabase `grade_scales` teilen ausnahmslos dieselben UUIDs.
    - Neu erstellte Boulder in `BatchBoulderWorkflow` speichern sofort die valide UUID der Farbskala.
    - Bei der Cloud-Synchronisation von Bouldern (`syncBouldersToSupabase`) wird die Farbskala strikt innerhalb der jeweiligen Halle aufgelöst, und die lokale Boulder-Entität wird direkt mit der kanonischen `grade_scale_id` aktualisiert.
    - Auf der Wandtafel (`WallPhotoCanvas`) und im Klettererbereich (`ClimberSectorView`) löst `resolveScale` bzw. `resolveBoulderScale` Farbskalen mehrstufig auf (ID -> normalisierter Farbname -> Font-Grad). Es erfolgt niemals ein stummer Fallback auf Blau (`#3b82f6`).
- [x] **AC-3**: Sektoren erfordern `name` und ein valides `wall_photo_url`.
- [x] **AC-4**: **Drag & Drop Sektor-Sortierung & Reihenfolgeverwaltung**:
  - **AC-4.1 (Drag & Drop Interaktion)**: Jede Sektor-Karte im `SectorManager` verfügt über einen deutlichen Drag-Handle (`GripVertical`-Icon) und ist für Hallen-Admins per HTML5 Drag & Drop greifbar (`draggable={isAdmin}`).
  - **AC-4.2 (Visuelles Feedback)**: Während des Ziehens wird das gezogene Element mit reduzierter Deckkraft (`opacity-40`) und Akzent-Rahmen markiert; das Ziel-Element (`dragOver`) erhält eine prominente Hervorhebung (z. B. `#C9A96E` Border / Ring), um die Einfügestelle eindeutig anzuzeigen.
  - **AC-4.3 (Persistenz)**: Beim Loslassen (`onDrop`) wird die neue Reihenfolge unmittelbar in `sort_order` (1..n) für alle Sektoren der Halle überführt und im LocalStorage persistiert (`reorderSectors`).
  - **AC-4.4 (Nachträgliche Veränderbarkeit)**: Die Reihenfolge ist beliebig oft nachträglich durch einfaches Ziehen und Ablegen veränderbar.
  - **AC-4.5 (App-weite Konsistenz)**: Die Sektor-Reihenfolge spiegelt sich konsistent in allen Sektor-Views wider:
    - Admin-Sektorenverwaltung (`SectorManager`)
    - Schrauber Batch-Workflow-Wandtabs (`BatchBoulderWorkflow`)
    - Kletterer-Sektornavigation (`ClimberSectorView`)
    - Sektor-Filter & Auswahl-Dropdowns
  - **AC-4.6 (Barrierefreiheit & Fallback)**: Neben Drag & Drop stehen weiterhin Pfeil-Schaltflächen (Nach oben / Nach unten) zur Verfügung, um barrierefreies und schnelles Verschieben auf Touchgeräten oder per Tastatur zu garantieren.
  - **AC-4.7 (Berechtigung)**: Nur Hallen-Admins und Plattform-Admins sind berechtigt, Sektoren neu zu sortieren; für Nicht-Admins ist das Drag-Handle inaktiv oder ausgeblendet.
- [x] **AC-5**: Bei Aktualisierung des Sektor-Wandfotos bleiben bestehende relative Boulder-Koordinaten (`position_x`, `position_y` als 0.0–1.0) unverändert erhalten.
- [x] **AC-6**: Sektoren mit aktiven Bouldern können nicht versehentlich gelöscht werden (Sicherheitsabfrage / Validierung).
- [x] **AC-7**: Kletterer können Hallen suchen und eine Übersicht aller Sektoren mit Wandfoto und aktiver Boulder-Anzahl in der definierten `sort_order` einsehen.

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

-- Sectors (Wandbereiche mit sort_order)
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  wall_photo_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Drag & Drop Architektur (`SectorManager.tsx`)
- **State Management**:
  - `draggedIndex: number | null`: Index des aktuell gezogenen Sektors.
  - `dragOverIndex: number | null`: Index des Zielsektors, über dem die Maus schwebt.
- **Event Flow**:
  1. `onDragStart(e, index)`: Setzt Datentransfer (`text/plain` mit Sektor-ID), setzt `draggedIndex`, wählt `effectAllowed = 'move'`.
  2. `onDragOver(e, index)`: Verhindert Standardverhalten (`e.preventDefault()`), deklariert `dataTransfer.dropEffect = 'move'`.
  3. `onDragEnter(e, index)`: Setzt `dragOverIndex = index`.
  4. `onDragLeave(e, index)`: Setzt `dragOverIndex = null`, falls die Karte verlassen wird.
  5. `onDrop(e, targetIndex)`: Verschiebt das Element von `draggedIndex` nach `targetIndex`, berechnet die neue `orderedIds`-Liste, ruft `reorderSectors(gymId, userId, orderedIds)` auf und synchronisiert den State via `onRefresh()`.
  6. `onDragEnd()`: Bereinigt `draggedIndex` und `dragOverIndex`.
- **Synchronisation zwischen Modulen**:
  - `gymStorage.reorderSectors`: Aktualisiert `sort_order` im LocalStorage (`boulder_sectors_v1`).
  - `batchBoulderService.getSectors`: Synchronisiert die aktualisierte `sort_order` in den Schrauber-Batch-Store (`boulder_sectors_v2`), sodass alle Views stets dieselbe Reihenfolge nutzen.
  - `gymStorage.setGymGradeScales`: Verwaltet die autoritativen Farbskalen (`boulder_grade_scales_v1`), aktualisiert synchron den V2-Store (`boulderapp_grade_scales_v2`) und feuert das Browser-Event `bouldermate:gradescales_updated`.
  - `batchBoulderService.getGradeScales`: Verwendet `gymStorage` als Single Source of Truth, konvertiert die autoritativen Skalen zu `GymGradeScale[]` und hält Schrauber- sowie Kletterer-Bereich ohne Geisterfarben synchron.
  - `useGymSectorData`: Lauscht reaktiv auf `bouldermate:gradescales_updated` und aktualisiert `gradeScales` und `scaleMap` komponentenweit ohne Seiten-Reload.

### API / RLS Policy
- `gyms`: SELECT für alle; INSERT für authentifizierte User; UPDATE/DELETE nur für Admins des Gyms.
- `gym_members`: SELECT für alle Hallenmitglieder; INSERT/UPDATE/DELETE nur für Admins.
- `grade_scales`: SELECT öffentlich; INSERT/UPDATE/DELETE nur Gym-Admins.
- `sectors`: SELECT öffentlich; INSERT/UPDATE/DELETE/REORDER nur Gym-Admins.

### UI / UX (Design System SPEC-005 Konform)
- **Visuelle Ästhetik**: Dark-Mode First (`--bg-primary: #121212`, `--bg-surface: #1E1E1E`), kantige Formensprache (0px Radius für Karten und Eingabefelder, 2px für Buttons), keine Drop-Shadows.
- **Drag Handle**: Subtiles, aber klar erkennbares `GripVertical`-Icon mit `cursor-grab` (bzw. `cursor-grabbing` während Drag) links im Header jeder Sektorkarte.
- **Drop-Indikator**: Akzentuierter Rand (`border-[#C9A96E]` mit dezentem Ring) auf der Karte, über der sich der Cursor befindet.
- **Positions-Badge**: Nummerierte Plakette `SEKTOR #1`, `SEKTOR #2`, etc. in JetBrains Mono / Space Mono zur sofortigen visuellen Orientierung.
- **Accessibility**: Vollständig per Tastatur und Schaltflächen bedienbar über die integrierten Pfeil-Buttons (Nach oben / Nach unten).

## Dependencies
- Depends on: Supabase Auth & Storage Setup
- Blocks: SPEC-002 (Batch-Foto-Boulder-Erfassung), SPEC-003 (Boulder-Detail & Bewertung)

## Out of Scope
- Point-of-Sale / Hallen-Kassensystem-Integration
- GPS-Ortung oder automatische Check-ins
- Komplexe Hallenpläne (3D oder Vektor-CAD)

## Verification Evidence
- **Automatisierte Tests**:
  - `tests/gymSectorManagement.test.ts` (AC-1 bis AC-7 Backend & Service Tests)
  - `tests/sectorDragAndDrop.test.tsx` (Interaktive Drag & Drop Tests in `SectorManager`)
    - Drag & Drop Event-Handling und `reorderSectors` Aufruf ✓
    - Persistenz der neuen `sort_order` im LocalStorage ✓
    - Synchronisation zwischen `gymStorage` und `batchBoulderService` ✓
    - Berechtigungsprüfung (Nicht-Admins können nicht sortieren) ✓
- **Type-Check & Build**: `tsc --noEmit` fehlerfrei, `npm run build` erfolgreich ohne Warnungen.
