# SPEC-018: Multi-Sektor-Batch-Erstellung & Multi-Foto-Upload (Hallen-Setup)

## Status: DONE

## Summary
Ermöglicht Hallen-Administratoren das gleichzeitige Hochladen mehrerer Wandfotos und die Batch-Erstellung mehrerer Sektoren in einem einzigen Durchgang. Dies beschleunigt das initiale Einrichten einer Boulderhalle um ein Vielfaches: Statt jeden Sektor einzeln anzulegen, können Admins auf dem Smartphone (z. B. Mehrfachauswahl aus der Galerie) oder am Desktop beliebig viele Wandfotos auswählen oder Vorlagen (Presets) aktivieren, Namen inline prüfen oder automatisch durchnummerieren und alle Sektoren auf einmal speichern.

---

## User Stories
- **US-1**: Als Hallen-Admin möchte ich beim initialen Einrichten einer Halle mehrere Fotos auf einmal auswählen können, damit ich nicht für jeden Sektor das Formular neu öffnen muss.
- **US-2**: Als Hallen-Admin möchte ich aus Dateinamen automatisch abgeleitete Sektornamen erhalten (z. B. `Wettkampfwand_Nord.jpg` -> `Wettkampfwand Nord`), um Tipparbeit zu sparen.
- **US-3**: Als Hallen-Admin möchte ich Sektoren mit einem Klick automatisch durchnummerieren können (z. B. `Sektor 1`, `Sektor 2` etc.).
- **US-4**: Als Hallen-Admin möchte ich vor dem Speichern einzelne ausgewählte Fotos aus der Liste entfernen oder umbenennen können.
- **US-5**: Als Hallen-Admin möchte ich auch ohne eigene Fotos mehrere Wandvorlagen (Presets) gleichzeitig als Sektoren anlegen können.

---

## Acceptance Criteria

- [x] **AC-1 (Multi-Foto Upload im Modal)**:
  - Ein Multi-File-Input (`<input type="file" multiple accept="image/*" />`) sowie eine Drag & Drop Dropzone erlauben das gleichzeitige Auswählen beliebig vieler Wandfotos.
  - Auf Smartphones (iOS / Android) öffnet sich die Fotomediathek mit Mehrfachauswahl.
- [x] **AC-2 (Dateinamen-Bereinigung & automatische Benennung)**:
  - `cleanFileNameToSectorName`: Dateiendungen (`.jpg`, `.png` etc.) und Trennzeichen (`_`, `-`) werden bereinigt.
  - Bei generischen Fotos (z. B. `IMG_1234.jpg`) oder fehlenden Namen greift eine verständliche Fallback-Nummerierung (`Sektor X`).
- [x] **AC-3 (Batch-Vorlagen / Presets)**:
  - Reiter „Wandvorlagen“ zeigt alle definierten `WALL_PRESETS` mit Klick-Toggle zur schnellen Mehrfachauswahl.
- [x] **AC-4 (Entwurfsliste & Bearbeitung)**:
  - Vorschau aller ausgewählten Sektoren mit Miniaturansicht, editierbarem Namensfeld, laufender Nummerierung (#1, #2...) und Lösch-Button.
  - Button „Durchnummerieren“ zum automatischen Setzen eines einheitlichen Präfixes (z. B. `Sektor 1`, `Sektor 2`...).
- [x] **AC-5 (Atomares Persistieren via `createSectorsBatch`)**:
  - `createSectorsBatch(gymId, userId, inputs)` validiert alle Einträge, vergibt aufsteigende `sort_order`-Werte, persistiert in `gymStorage` und triggert die Supabase-Synchronisation.
  - Client-seitige Komprimierung via `processLocalImageFile` stellt sicher, dass auch hochauflösende Kamerabilder speicherschonend verarbeitet werden.
- [x] **AC-6 (UI Integration im `SectorManager`)**:
  - Neuer Button `Mehrere anlegen` im Admin-Header neben `Neuer Sektor`.
  - Direkter Call-to-Action `Mehrere Sektoren auf einmal anlegen` im Empty-State bei leeren Hallen.
  - Verlinkung im Einzel-Anlegeformular („Mehrere Sektoren auf einmal anlegen? Zum Multi-Upload“).

---

## Technical Design

### Komponenten & Datenfluss
```
[User wählt N Fotos / Presets]
               │
               ▼
     [BatchSectorModal.tsx]
               │ (Vorschau, Inline-Umbenennen, Auto-Nummerieren)
               ▼
[processLocalImageFile (Client-Komprimierung)]
               │
               ▼
[createSectorsBatch in gymStorage.ts]
               │
       ┌───────┴────────┐
       ▼                ▼
[localStorage]   [Supabase Sync]
```

### Betroffene Dateien
- `src/lib/gymStorage.ts`: `createSectorsBatch` Funktion.
- `src/lib/imageUtils.ts`: `cleanFileNameToSectorName` Helper.
- `src/components/BatchSectorModal.tsx`: Neues Modal für Multi-Upload & Batch-Erstellung.
- `src/components/SectorManager.tsx`: Integration des Multi-Upload-Buttons im Header, Empty-State und Single-Form.
- `tests/batchSectorCreation.test.tsx`: 10 umfassende Unit- und Integrationstests.
