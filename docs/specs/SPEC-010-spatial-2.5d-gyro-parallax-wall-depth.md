# SPEC-010: Spatial 2.5D Gyro-Parallax & Multi-Facet Wall Depth Engine

## Status: APPROVED
**Owner:** Boris  
**Created:** 2026-09-06  
**Zielgruppe:** Kletterer (Wow-Effekt & Beta-Lesen) & Schrauber (0 Sekunden Mehraufwand)

---

## 1. Executive Summary & Vision

Bisher wirken steile Boulderwände (Caves, 45°-Überhänge, Dächer) auf flachen 2D-Smartphone-Fotos oft optisch flach und undynamisch („Photograph flattens the wall“). Kletterer können kaum erfassen, wo ein senkrechter Sockel aufhört und die eigentliche Höhle beginnt.

**SPEC-010** führt die **Spatial 2.5D Gyro-Parallax Wall Depth Engine** in BoulderMate ein:
1. **Räumliches Raumgefühl beim Neigen des Smartphones**: Durch Auslesen des Gyroskops (`DeviceOrientationEvent`) verschiebt sich die Perspektive des Wandfotos in Echtzeit (60–120 FPS). Griffe, Tritte und Holzvolumen heben sich plastisch von der Wand ab.
2. **Multi-Facet & Knickwand-Erkennung**: Das System meistert typische Hallenstrukturen (z. B. 90° Sockeleinstieg $\rightarrow$ harter Knick $\rightarrow$ 50° Dach) pixelgenau.
3. **Absolutes Zero-Friction-Prinzip für Schrauber**: Der Schrauber nutzt weiterhin seine ganz normale Smartphone-Kamera. Die Tiefenkarte wird vollautomatisch im Hintergrund in < 500 ms berechnet. Der **< 3-Minuten-Workflow** nach dem Schrauben bleibt zu 100 % unangetastet.

---

## 2. User Stories

* **US-1 (Kletterer - Raumerlebnis):** Als Kletterer möchte ich mein Smartphone leicht nach links, rechts, oben und unten neigen, damit die Wand plastisch im Raum kippt und ich die tatsächliche Steilheit der Boulderwand spüre.
* **US-2 (Kletterer - Knickwand & Beta-Lesen):** Als Kletterer möchte ich an verwinkelten Wänden (z. B. Cave mit Sockel) genau sehen, welche Griffe noch im senkrechten Bereich und welche bereits tief im Dach liegen, um Bewegungsabläufe besser planen zu können.
* **US-3 (Schrauber - 0-Klick Workflow):** Als Routenschrauber möchte ich nach dem Schrauben einfach 1 normales Handyfoto wie gewohnt hochladen, ohne Spezialkamera, ohne LiDAR und ohne zusätzliche manuelle 3D-Einstellungen.
* **US-4 (Kletterer - Pin-Präzision):** Als Kletterer möchte ich, dass gesetzte Boulder-Pins millimetergenau auf den Griffen verankert bleiben, selbst wenn sich das Bild im 2.5D-Parallaxen-Effekt neigt.
* **US-5 (Desktop & Barrierefreiheit):** Als Nutzer an einem Laptop ohne Neigungssensor möchte ich den 2.5D-Effekt per Maus-Hover/Drag erleben können sowie einen einfachen Schalter (2D / 3D), um den Effekt jederzeit ein- oder auszuschalten.

---

## 3. Acceptance Criteria (ACs)

### AC-1: Vollautomatische Tiefenkarten-Generierung (Monocular Depth AI & Facet-Fallback)
* **AC-1.1**: Beim Upload eines neuen Wandfotos wird client- oder edge-seitig in < 1 Sekunde eine komprimierte Tiefenkarte (Grayscale Depth-Map, WebP, 8-Bit, typisch < 35 KB) generiert.
* **AC-1.2**: Hellere Pixel repräsentieren den Vordergrund (herausragende Griffe, Sockel), dunklere Pixel den Hintergrund (hintere Dachebenen, Hallenhintergrund).
* **AC-1.3**: Ist keine KI-Verbindung verfügbar (Offline-First), greift ein mathematischer **Facet-Fallback-Generator** (`proceduralDepthGenerator`), der anhand des Sektor-Wandtyps (Platte, Senkrecht, Überhang, Dach) einen kontinuierlichen Tiefenverlauf erzeugt.

### AC-2: Multi-Winkel & Knickkanten-Unterstützung (Cave / Bulge / Roof)
* **AC-2.1**: Die Tiefenberechnung unterstützt Wände mit mehreren Neigungsebenen (z. B. vertikaler Sockel 90° mit abruptem Übergang in 45°/60° Dach).
* **AC-2.2**: Im Kantenbereich erfolgt die Parallax-Verschiebung gebrochen: Der Sockel bleibt stabil im Vordergrund, während die Dachfläche dahinter tiefer in den Raum kippt.
* **AC-2.3**: Optional im Sektor-Manager: Der HallenAdmin kann einmalig bei der Sektorerstellung eine optionale Knicklinie festlegen (z. B. `transition_y: 0.25`), falls die Wand eine architektonisch definierte Kante besitzt.

### AC-3: 60 FPS WebGL / Canvas Parallax Shader Pipeline
* **AC-3.1**: Das Rendering erfolgt über einen leichtgewichtigen WebGL-Fragment-Shader (alternativ Canvas-Displacement), der das Originalfoto und die Tiefenkarte über 2 Texturen verknüpft.
* **AC-3.2**: Der maximale Parallax-Offset ist harmonisch begrenzt ($\Delta x, \Delta y \in [-18\text{px}, +18\text{px}]$), um Verzerrungsartefakte an Griffkanten zu verhindern.
* **AC-3.3**: Es werden Edge-Clamping und weiche Randmasken verwendet, damit die Bildränder beim Neigen nicht unschön abreißen.

### AC-4: Gyroskop-Sensorik & Bewegungs-Dämpfung (Smoothing)
* **AC-4.1**: Auf Mobilgeräten wird die `DeviceOrientationEvent`-Schnittstelle (`beta` und `gamma`) verwendet.
* **AC-4.2**: Die Sensordaten werden über einen Low-Pass-Filter / LERP (Lineare Interpolation mit Dämpfungsfaktor $\alpha = 0.12$) geglättet, um nervöses Handzittern vollständig zu eliminieren.
* **AC-4.3**: Auf iOS 13+ wird der Nutzer bei Bedarf dezent nach der Sensorfreigabe gefragt (`DeviceMotionEvent.requestPermission`). Wird diese abgelehnt, wechselt das System lautlos auf Touch-Pan-Parallaxe.

### AC-5: Desktop-Fallback & Interaktions-Modi
* **AC-5.1**: Auf Desktop-Geräten (kein Gyroskop) steuert die Mausposition über dem Wandfoto die Blickwinkelverschiebung (Mouse-Tilt).
* **AC-5.2**: Ein dezenter Toggle-Button `[3D Spatial / 2D]` oben rechts im Bild erlaubt jederzeit das Umschalten auf die klassische statische 2D-Ansicht.

### AC-6: Synchrone Pin- & Topo-Verankerung
* **AC-6.1**: Gesetzte Boulder-Pins (Startgriff, Crux, Top) werden entsprechend der Tiefe ihres Bezugspixels mitverschoben.
* **AC-6.2**: Pins auf stark herausragenden Griffen bewegen sich synchron mit dem Griff im Vordergrund, sodass niemals ein "Auseinanderdriften" von Pin und Griffbild entsteht.

### AC-7: Datenmodell & Persistenz
* **AC-7.1**: Erweiterung der `Sector`-Schnittstelle in `src/types/gym.ts`:
  ```typescript
  export interface SectorWallDepth {
    depthMapUrl?: string;          // Optional: Generierte 8-bit Depth Map (Data-URL oder CDN)
    wallProfileType?: 'flat' | 'overhang' | 'cave_socket' | 'roof' | 'slab';
    foldLineY?: number;            // 0.0 - 1.0 (Optionale Kanten-Linie)
    maxDepthIntensity?: number;    // Standard: 1.0 (Skalierung des Effekts)
  }
  ```
* **AC-7.2**: Volle Abwärtskompatibilität: Existierende Sektoren ohne Tiefenfeld funktionieren nahtlos im Standardmodus weiter.

### AC-8: Testabdeckung & Verifikation
* **AC-8.1**: Unit-Tests für den `spatialDepthService`:
  - Test der mathematischen Tiefen-Shader-Berechnung und Clamping.
  - Test der Gyroscope-Dämpfungsfunktion (LERP-Stabilisierung).
  - Test der synchronen Pin-Positionskorrektur.
* **AC-8.2**: Komponenten-Tests für `SpatialWallCanvas.tsx`:
  - Rendert Fallback im 2D-Modus.
  - Reagiert auf Neigungs-Events.
* **AC-8.3**: Regression: Alle bestehenden 137 Tests in `BoulderMate` laufen weiterhin grün.

---

## 4. Technische Architektur & Datenfluss

```
[Kamera-Foto (Standard JPEG / PNG)] 
              │
              ├──► [imageUtils.ts: Standard-Kompression 1600px]
              │
              ▼
   [Hintergrund-Tiefenanalyse (< 500 ms)]
   ┌───────────────────────────────────────────────┐
   │ 1. Primär: Monocular Depth Estimation         │
   │    (Depth Anything V2 Edge ONNX / Worker)     │
   │ 2. Fallback: Sektor-Knick-Geometrie           │
   │    (Sockel 90° + Dach 50° Gradient)           │
   └───────────────────────────────────────────────┘
              │
              ▼ [Depth-Map (WebP / 8-Bit Grayscale, ~25 KB)]
              │
  ┌───────────┴───────────────────────────────┐
  │                                           │
  ▼                                           ▼
[Kletterer-Smartphone (Gyro)]         [Desktop (Mouse Move)]
(DeviceOrientation beta/gamma)        (pointermove offset X/Y)
  │                                           │
  └───────────────────┬───────────────────────┘
                      ▼
       [Low-Pass Glättungsfilter (LERP)]
                      ▼
     [Spatial 2.5D WebGL Fragment Shader]
     - Texture 0: Original Wandfoto (RGB)
     - Texture 1: Tiefenkarte (R-Channel as Depth)
     - Uniform: u_offset (X, Y Neigung)
                      ▼
       [Plastisches 60 FPS 2.5D Bild]
       + Tiefenkorrigierte Boulder-Pins
```

---

## 5. UI & Haptik (Old School Kletterer Design)

Im Sinne des BoulderMate Design Systems (SPEC-005):
* **Steuerung**: Unaufdringliches Badge am oberen Bildrand:  
  `[ 🧭 3D SPATIAL ]` (Aktiv: Bernstein `#C9A96E` mit leichtem Pulsieren bei Bewegung).
* **Haptisches Feedback**: Beim ersten Neigen und Spüren der Raumtiefe kurzes, subtiles Haptic-Feedback (10ms Vibrationsimpuls auf unterstützten Geräten).
* **Ladezeit**: Exakt 0 Sekunden sichtbare Latenz, da das normale 2D-Bild sofort angezeigt wird und der 3D-Shader unbemerkt im Hintergrund einklinkt.
