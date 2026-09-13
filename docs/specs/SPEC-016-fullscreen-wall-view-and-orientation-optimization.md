# SPEC-016: Immersive Vollbild-Wandansicht, Smartphone-Rotation & Sofortiger Sektorwechsel

## Status: APPROVED (IMPLEMENTIERT)
- **Erstellt am**: 2026-09-13
- **Autor**: Boris & AI Pair Programming
- **Scope**: Kletterer-App — Sektor-Wandansicht (`ClimberSectorView.tsx`, `WallPhotoCanvas.tsx`)

---

## 1. Problemstellung & Motivation
Beim Klettern in der Boulderhalle wird das Smartphone oft mit einer Hand bedient und quer (Landscape) gehalten, um breite Boulderwände in voller Pracht zu studieren. Im bisherigen Vollbildmodus nahmen jedoch feste Header- und Footer-Leisten über 110px an vertikaler Höhe ein (~30% des Bildschirms im Querformat). Zudem war das Wandbild bei festen Container-Größen nicht optimal an die Bildproportionen angepasst und das Wechseln zwischen Sektoren erforderte vollständiges Loslassen des Fingers nach Wischgesten.

---

## 2. Zielsetzung & Kernanforderungen

1. **Smartphone-Drehung & Maximale Wandnutzung (Edge-to-Edge)**:
   - Der Vollbildmodus nutzt 100% der Viewport-Fläche (`w-screen h-[100dvh]`).
   - Beim Drehen des Smartphones (Portrait <-> Landscape) passt sich die Wandansicht dynamisch und ohne Neuladen sofort an die neuen Bildschirmdimensionen an.

2. **Kein Header-Bereich (1a)**:
   - Keine fixen Header-Leisten, die vertikale Layout-Höhe blockieren.
   - Dezentes, schwebendes Minimal-HUD oben links (`selectedSector.name` + Index-Zähler) und schwebender Schließen-Button oben rechts, die über dem Bild liegen, ohne Layout-Platz zu verbrauchen.

3. **Kein Footer (1b)**:
   - Keine fixen Footer- oder Bottom-Navigation-Leisten im Vollbild. Die gesamte Bildschirmhöhe steht der Wand zur Verfügung.

4. **Intuitives Durchscrollen & Sofortiger Sektorwechsel (2)**:
   - **Sofortiger Sektorwechsel**: Horizontales Wischen wechselt den Sektor *sofort* (`onTouchMove` Schwellenwert 35px), ohne dass der Finger erst abgehoben werden muss.
   - **Endlos-Navigation (Wrap-Around)**: Vom letzten Sektor nach links wischen führt nahtlos zum ersten Sektor und umgekehrt.
   - **Multi-Input**: Unterstützt Wischgesten, Mausrad/Trackpad-Horizontalscroll (`onWheel`), Tastatur-Pfeile (`ArrowLeft` / `ArrowRight`, `A` / `D`) sowie dezente seitliche Schwebepfeile.
   - **Intuitives Durchscrollen**: Bei gezoomter Wand kann flüssig vertikal und horizontal über die gesamte Wand gescrollt/gepaned werden (`overscroll-contain`, `touch-action: pan-x pan-y`).

5. **Ideale automatische Bildanpassung (3)**:
   - Automatische Erkennung des nativen Bild-Seitenverhältnisses (`aspectRatio`).
   - Bei 1x Zoom wird das Bild so eingepasst, dass die gesamte Wand ohne Abschneiden oder ungewollte Scrollbalken sichtbar ist, während die maximal verfügbare Bildschirmfläche genutzt wird (`margin: auto`).
   - Mathematisch exakte Platzierung der Routen-Pins auf den Griffen in jeder Orientierung und Zoomstufe.
   - **Double-Tap**: Doppeltippen schaltet auf mobilen Geräten direkt zwischen 1x (Gesamtansicht) und 1.8x (Detail-Zoom) um.
   - Schwebende Zoom-Toolbar unten rechts (+, -, Reset) für präzise Skalierung bis 300%.

---

## 3. Akzeptanzkriterien (ACs)

- **AC-16.1**: Der Vollbildmodus blendet jegliche statischen Header- und Footer-Balken aus.
- **AC-16.2**: Bei Orientierungswechsel (Portrait <-> Landscape) passt sich die Bildgröße sofort optimal an die neuen Abmessungen an.
- **AC-16.3**: Horizontales Wischen wechselt den Sektor unmittelbar während der Geste mit nahtlosem Wrap-Around.
- **AC-16.4**: Das Wandbild wird mit korrekter Aspect-Ratio zentriert, Pins behalten ihre relativen Koordinaten exakt bei.
- **AC-16.5**: Double-Tap schaltet zwischen Einpassung (1x) und Zoom (1.8x) um; freies Scrollen über die Wand ist jederzeit möglich.

---

## 4. Verifikation
Vollständig getestet und verifiziert durch:
- `tests/climberFullscreenWallOptimization.test.tsx` (8 Tests, 100% grün)
- `tests/pinCoordinateAlignment.test.tsx` (4 Tests, 100% grün)
- `tests/mobileFirstExperience.test.tsx` (Integrationstest, 100% grün)