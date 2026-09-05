# SPEC-005: Sektor-Wandfoto Datei-Upload (Laptop & Lokale Bilder)

## Status: APPROVED

## Summary
Ermöglicht Hallen-Admins und Schraubern das direkte Hochladen von Sektor-Wandfotos von ihrem lokalen Laptop oder Rechner (JPEG, PNG, WebP) über Drag & Drop und Dateiauswahl. Eine integrierte client-seitige Bildoptimierung skaliert und komprimiert hochauflösende Fotos automatisch, bevor sie als persistente Data-URLs gespeichert werden, um Browser-Speichergrenzen einzuhalten und maximale Performance zu garantieren.

---

## User Stories
- **US-1**: Als Hallen-Admin möchte ich beim Erstellen eines neuen Sektors ein Foto direkt von meiner Festplatte/Laptop hochladen können, ohne das Bild erst extern hosten zu müssen.
- **US-2**: Als Hallen-Admin möchte ich beim Bearbeiten eines bestehenden Sektors das Wandfoto durch eine lokale Datei ersetzen können.
- **US-3**: Als Schrauber möchte ich im Batch-Erfassungs-Workflow ein neu geschraubtes Sektorfoto direkt von meinem Laptop hochladen und sofort auf der Wand markieren können.
- **US-4**: Als Nutzer möchte ich vor dem Speichern eine klare Vorschau des hochgeladenen Bildes sehen und die Datei bei Bedarf wechseln oder entfernen können.
- **US-5**: Als Nutzer möchte ich auch große Fotos (z. B. 10 MB Smartphone-Kameraaufnahmen) hochladen können, ohne dass der Browser-Speicher blockiert wird oder die App abstürzt.

---

## Acceptance Criteria

- [ ] **AC-1**: **Lokaler Datei-Upload im Sektor-Manager (Erstellung)**:
  Beim Anlegen eines Sektors steht eine Upload-Zone mit Datei-Picker und Drag & Drop bereit (`accept="image/*"`).
- [ ] **AC-2**: **Lokaler Datei-Upload im Sektor-Manager (Aktualisierung)**:
  Beim Aktualisieren des Fotos eines vorhandenen Sektors kann eine neue lokale Datei ausgewählt werden.
- [ ] **AC-3**: **Lokaler Datei-Upload im Schrauber-Batch-Workflow**:
  Im Dialog "Wandfoto aktualisieren" im Schrauber-Batch kann ein neues Wandfoto direkt vom Laptop geladen werden.
- [ ] **AC-4**: **Client-seitige Komprimierung & Formatierung (`imageUtils.ts`)**:
  - Konvertierung und Skalierung auf maximal 1600px (Breite/Höhe) unter Beibehaltung des Seitenverhältnisses.
  - Komprimierung auf JPEG-Qualität ~0.82 (typische Zielgröße: 150–300 KB).
  - Validierung von Dateityp (`image/jpeg`, `image/png`, `image/webp` etc.) und Dateigröße.
  - Generierung einer sauberen Data-URL (`data:image/jpeg;base64,...`).
- [ ] **AC-5**: **Haptische Kletterer-Vorschau & UI (`SectorPhotoUploader.tsx`)**:
  - Aufgeräumtes Old School Kletterer Design (`topo-plate`, Sandsteinrahmen, Granit-Hintergrund).
  - Drag-over-Effekt, Dateiauswahl-Button und Kamera-Glyph.
  - Vorschau-Thumbnail mit Badge "Vom Laptop geladen" und "Entfernen"-Aktion.
- [ ] **AC-6**: **Optionale URL-Alternative**:
  - Umschaltung per Reiter zwischen "📁 Datei vom Laptop" und "🔗 Bild-URL eingeben", sodass auch externe URLs weiterhin unterstützt werden.
- [ ] **AC-7**: **Testabdeckung & Regression**:
  - Unit-Tests für `imageUtils.ts` (Validierung, Skalierung, Fehlerfälle).
  - Komponententests für `SectorPhotoUploader.tsx`.
  - Alle 56 bestehenden Tests laufen weiterhin fehlerfrei.

---

## Technical Design

### Client-Side Compression Flow
```
[Lokale Datei vom Laptop (.jpg / .png)]
         │
         ▼
[FileReader / createImageBitmap]
         │
         ▼
[HTMLCanvasElement (Max Dimension: 1600px, Proportionale Skalierung)]
         │
         ▼
[canvas.toDataURL('image/jpeg', 0.82)] (~150-300 KB Data-URL)
         │
         ▼
[Persistierung in Sector.wall_photo_url / Sector.wallPhotoUrl]
```

### Components & Modules
1. `src/lib/imageUtils.ts`:
   - `processLocalImageFile(file: File, maxDimension = 1600, quality = 0.82): Promise<string>`
   - `validateImageFile(file: File): { valid: boolean; error?: string }`
2. `src/components/SectorPhotoUploader.tsx`:
   - Wiederverwendbare Komponente mit Drag & Drop, Dateiauswahl, URL-Modus und Vorschau.
3. Integration in:
   - `src/components/SectorManager.tsx` (Neu & Bearbeiten)
   - `src/components/BatchBoulderWorkflow.tsx` (Foto-Aktualisierungs-Modal)
