# 💡 Ideenspeicher & Backlog — BoulderMate

> **Status**: Aktiv & gepflegt  
> **Konzept**: Spec Driven Development (SDD) — Sammlungsort für produktstrategische Ideen, UX-Optimierungen und Architektur-Konzepte vor der Spezifikationsreife.

---

## Übersicht der Ideen

| ID | Thema | Bereich | Priorität | Status |
|---|---|---|---|---|
| **IDEA-001** | **UX-Klarheit & Entrümpelung im Klettererbereich** | Kletterer-App / UI/UX | Hoch | In Konzeption |
| **IDEA-002** | **Universelles Skalen-Mapping für hallenübergreifende Statistiken** | Analytics / Kletterer-Profil | Hoch | In Konzeption / Entwurf |

---

## IDEA-001: UX-Klarheit & Entrümpelung im Klettererbereich

### 1. Ausgangslage & Problemstellung
* **Ist-Zustand**: Die Kletterer-Ansicht ist gegenüber den ersten Entwürfen bereits deutlich aufgeräumter, leidet jedoch noch unter Übergangsartefakten:
  - In der Hauptnavigation koexistiert teilweise noch das alte, tabellarische Logbuch ("Erfasste Routen" mit manuellen CRUD-Formularen aus Feature 1) neben der modernen, visuellen Wandansicht.
  - Zu viele verschachtelte Kacheln, sekundäre Toolbars und Buttons lenken vor der Wand ab.
  - Kletterer haben beim Bouldern Chalk an den Händen und wollen keine Desktop-artigen Filtermenüs oder Formularfelder bedienen.
* **Ziel**: Radikaler Minimalismus, strikte 2-Tab-Navigation (`WAND` und `PROFIL`), blitzschnelle Orientierung vor der Wand und 2-Tap-Logging.

### 2. UX-Leitlinien für die Kletterer-App
1. **Strikte 2-Tab-Navigation**:
   - Tab 1: **Wand / Sektoren (`HALLE`)**: Die visuelle Wand steht im Mittelpunkt. Foto, Pins in Grifffarben, Sektor-Wechsler als horizontale Wischleiste (Pill-Chips).
   - Tab 2: **Mein Profil (`PROFIL`)**: Persönliche Heimat mit KPIs, Leistungsradar, Grad-Verteilung und chronologischem Logbuch.
   - *Entrümpelung*: Die alte separate Logbuch-Tabelle in `App.tsx` wird für den Kletterer vollständig entfernt.
2. **Chalk-Proof 2-Tap Logging**:
   - Tap 1 auf den Pin am Wandfoto öffnet das schlanke `BoulderBottomSheet`.
   - Tap 2 auf `Flash ⚡`, `Top ✅` oder `Projekt 🎯` loggt die Begehung sofort mit haptischem/visuellem Feedback.
   - Keine Pflichtformulare oder zwingende Zwischenabfragen während der Klettersession.
3. **Reduzierter Header & Stone-Spacing**:
   - Weg mit doppelten Hallen-Auswahlen im Header.
   - Großzügige Abstände (Granit-Flächen), kontraststarke Typografie (Space Grotesk & Space Mono), keine unruhigen Trennlinien.
4. **Fokus-Zustand an der Wand**:
   - Schnelles Ein-/Ausblenden getoppter Boulder (z.B. "Nur offene Projekte anzeigen").

---

## IDEA-002: Universelles Skalen-Mapping für hallenübergreifende Statistiken

### 1. Ausgangslage & Problemstellung
* **Ist-Zustand**:
  - Persönliche Statistiken und das Logbuch sind hallenübergreifend angelegt (ein Kletterer bouldert in Halle A, B und C).
  - Jede Halle definiert jedoch ihr **eigenes Farbsystem / Hallensystem** (z. B. Halle A: *Gelb = 3–4*, *Rot = 6C–7A+*; Halle B: *Gelb = 6B–6C*, *Blau = 4–5* oder fortlaufende Ziffern 1–8).
  - Wenn Statistiken im Filter **"Alle Hallen"** zusammengefasst werden, führt das unweigerlich zu fehlerhaften Daten:
    - Hallenfarben lassen sich nicht 1:1 addieren (Gelb aus Halle A ist sportlich nicht Gelb aus Halle B).
    - Lokale Sortierreihenfolgen (`sort_order`) verfälschen "Bester Top" und "Bester Flash" (Stufe 4 in Halle A kann leichter sein als Stufe 3 in Halle B).
* **Ziel**: Ein mathematisch sauberes, klettersportlich fundiertes **Mapping auf eine universelle Benchmark-Skala**, bevor Daten hallenübergreifend aggregiert werden.

### 2. Konzeption des Universal-Mappings

#### A. Die universelle Benchmark-Skala (Fontainebleau-Referenzbänder)
Als übergeordnete, hallenunabhängige Referenzskala dienen standardisierte Fontainebleau-Schwierigkeitsbänder:

| Universal-Band | Name / Level | Font-Äquivalent | Benchmark-Farbwelt (Profil-Gesamt) |
|---|---|---|---|
| **Band 1 (U1)** | Leicht / Intro | `3` bis `4+` | Sandstein Hell (#D4C5B0) |
| **Band 2 (U2)** | Moderat | `5` bis `5+` | Schiefergrün (#6A8E7F) |
| **Band 3 (U3)** | Fortgeschritten | `6A` bis `6B+` | Tiefblau / Kobalt (#3B7A9E) |
| **Band 4 (U4)** | Ambitioniert | `6C` bis `7A+` | Ocker / Bernstein (#C98A2C) |
| **Band 5 (U5)** | Schwer | `7B` bis `7C+` | Rostrot / Karmin (#A84232) |
| **Band 6 (U6)** | Experte | `8A` bis `8B+` | Obsidian / Granit (#2C2C34) |
| **Band 7 (U7)** | Elite | ab `8C` | Alabaster / Kreide (#EBE6DC) |

#### B. Mapping-Algorithmus (`GymGradeScale` ➔ `UniversalBand`)
Jede Hallen-Grading-Skala besitzt in den Hallen-Stammdaten bereits:
- `font_range_min` (z. B. `"6a"`)
- `font_range_max` (z. B. `"6b+"`)

Der Algorithmus:
1. Ermittelt den Median-Schwierigkeitsscore der Hallenstufe über die Fontainebleau-Indexierung (`getGradeScore`).
2. Mappt die Hallenstufe deterministisch auf das entsprechende Universal-Band (U1 bis U7).
3. Weist der Begehung für die globale Aggregation das berechnete Universal-Band zu.

#### C. Zweistufige Ansichtslogik im Profil & Dashboard

```
                    ┌───────────────────────────────┐
                    │     HALLEN-FILTER IM PROFIL   │
                    └───────────────┬───────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     FILTER: SPEZIFISCHE HALLE │   │      FILTER: "ALLE HALLEN"    │
├───────────────────────────────┤   ├───────────────────────────────┤
│ • 100% Original-Hallenfarben  │   │ • Normalisiert auf Universal- │
│   (z.B. "Gelb", "Rot", "Grün")│   │   Bänder U1 bis U7            │
│ • Balken in Hallengrifffarben │   │ • Bänder in neutraler Berg-   │
│ • Bester Top nach Hallengrad  │   │   führer-/Granit-Ästhetik     │
│ • Hallenbezogener Schnitt     │   │ • Echte sportliche Leistung   │
└───────────────────────────────┘   └───────────────────────────────┘
```

#### D. KPIs (Bester Top / Bester Flash) hallenübergreifend
- Anstelle der lokalen `sortOrder` wird für die globale Auswertung der **universelle Schwierigkeitsscore** verglichen.
- Die Anzeige im Header lautet bei "Alle Hallen":
  - `Bester Top: 7A+ (Rot, Minimum Zürich)` oder als Universalband `Ambitioniert (6C-7A+)`.
  - Dadurch bleibt die konkrete Hallenreferenz transparent, während die Rangordnung sportlich absolut wahrheitsgetreu ist.

---

## Nächste Schritte & Umsetzungs-Roadmap

1. **Spezifikationsanpassung (SPEC-004 & SPEC-008)**:
   - Formale Ergänzung der Akzeptanzkriterien um das universelle Grade-Mapping bei globaler Filterung.
2. **Implementierung Normalisierungs-Modul (`gradeConverter.ts`)**:
   - `UNIVERSAL_GRADE_BANDS` definieren.
   - Funktion `mapGymScaleToUniversalBand(scale: GymGradeScale): UniversalGradeBand`.
3. **Anpassung `profileService.ts`**:
   - Wenn `selectedGymId === 'all'`, Aggregation über Universal-Bänder statt lokaler Skalen-IDs.
   - Bester Top / Flash ermitteln via Font-Score-Vergleich über alle Hallen hinweg.
4. **UX-Refactoring Klettererbereich (`App.tsx` & `ClimberSectorView.tsx`)**:
   - Entfernen des veralteten Tabellen-Tabs "Logbuch" für Kletterer.
   - Bereinigung doppelter Controls, Maximierung der Wand-Präsenz.
