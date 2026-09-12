# 💡 Ideenspeicher & Backlog — BoulderMate

> **Status**: Aktiv & gepflegt  
> **Konzept**: Spec Driven Development (SDD) — Sammlungsort für produktstrategische Ideen, UX-Optimierungen und Architektur-Konzepte vor der Spezifikationsreife.

---

## Übersicht der Ideen

| ID | Thema | Bereich | Priorität | Status |
|---|---|---|---|---|
| **IDEA-001** | **UX-Klarheit & Entrümpelung im Klettererbereich** | Kletterer-App / UI/UX | Hoch | In Konzeption |
| **IDEA-002** | **Universelles Skalen-Mapping für hallenübergreifende Statistiken** | Analytics / Kletterer-Profil | Hoch | In Konzeption / Entwurf |
| **IDEA-003** | **Der Turnier-Event (Hallen-Cups, Live-Scoring & Leaderboards)** | Events / Gamification | Hoch | Spezifiziert in [SPEC-012](specs/SPEC-012-tournament-events.md) |
| **IDEA-004** | **Individuelle Boulder-Passung & Match-Rating („Boulder-Fit Engine“)** | Recommendation / Kletterer-Profil | Hoch | Im Backlog (Konzept) |



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

## IDEA-004: Individuelle Boulder-Passung & Match-Rating („Boulder-Fit Engine“)

### 1. Ausgangslage & First-User-Feedback
* **Feedback eines First-Users**:
  > *„Es wäre am coolsten, wenn die Boulder nicht nur generell bewertet werden, sondern individuell. Also eine Methode, um den oder die für mich am besten passenden Boulder bewerten und finden zu können.“*
* **Problem mit rein generischen Bewertungen**:
  - Ein Boulder mit einer generellen Community-Wertung von 4.8 Sternen und Grad 6B kann für einen Kletterer mit 1,60 m Körpergröße und flexiblem Platten-Stil ein purer Frust-Boulder sein (z. B. weiter dynoartiger Schulterzug).
  - Umgekehrt kann ein mit 3.5 Sternen bewerteter, technisch kleintrittiger Leistenboulder für denselben Kletterer der absolute Lieblingsboulder der Session sein.
  - Generische Ratings (`Sterne`, `Soft/Fair/Stiff`) spiegeln nur die *kollektive Mehrheitsmeinung* wider. Klettersport ist jedoch hochgradig **körper- und stilabhängig** (Morphometrie, Hebelverhältnisse, Fingerkraft vs. Körpergefühl).
* **Ziel**:
  1. **Algorithmus zur individuellen Passgenauigkeit („Boulder-Fit Score“)**: Automatische Berechnung, wie gut ein Boulder sportlich, anatomisch und stilistisch zum individuellen Kletterer passt.
  2. **Zwei-Ebenen-Bewertungssystem**: Erweiterung der Bewertung um die persönliche Resonanz („Wie lag der Boulder mir?“).
  3. **Visualisierung & Navigation an der Wand**: Intelligente Empfehlungen („Top-Matches für deinen Style“ vs. „Gezielter Schwächen-Booster“).

---

### 2. Die Methode: Der „Boulder-Fit Score“ (BFS)

Der Boulder-Fit Score berechnet für einen Kletterer $U$ und einen Boulder $B$ einen normalisierten Passungs-Wert von **0% bis 100%**:

$$\text{BFS}(U, B) = w_{\text{Grade}} \cdot S_{\text{Grade}}(U, B) + w_{\text{Style}} \cdot S_{\text{Style}}(U, B) + w_{\text{Morpho}} \cdot S_{\text{Morpho}}(U, B)$$

*(Standardgewichtung: $w_{\text{Grade}} = 0.45$, $w_{\text{Style}} = 0.40$, $w_{\text{Morpho}} = 0.15$)*

#### A. Grad- & Progressions-Affinität ($S_{\text{Grade}}$)
Ein Boulder ist dann am attraktivsten, wenn er weder trivial noch aussichtslos ist, sondern in der optimalen Progressionszone liegt:
- **Sweet Spot (Maximaler Match = 100%)**:
  - Liegt bei $G_B \in [G_{\text{median}}, G_{\text{max}} + 0.5]$ (die sogenannte Flow- / Wachstumszone).
- **Aufwärmzone ($G_B < G_{\text{median}} - 1.5$)**:
  - Geringerer Match für intensive Sessions, aber ideal für Aufwärm-Listen.
- **Out-of-Range ($G_B > G_{\text{max}} + 2$)**:
  - Exponentieller Abzug, um Frustration an der Wand zu vermeiden.

#### B. Stil-Vektormatching ($S_{\text{Style}}$)
Vergleich des individuellen Athleten-Radars $\vec{A}_U$ (aus [SPEC-008](specs/SPEC-008-climber-performance-attributes-statistics.md): Maximalkraft, Kraft-Ausdauer, Technik, Balance, Koordination, Flexibilität) mit dem Radar-Profil des Boulders $\vec{R}_B$:

1. **Modus „Stärken-Flow“ (Standard-Match)**:
   - Berechnet die Vektor-Kosinus-Ähnlichkeit:
     $$S_{\text{Style, Flow}} = \frac{\vec{A}_U \cdot \vec{R}_B}{\|\vec{A}_U\| \|\vec{R}_B\|}$$
   - *Effekt*: Zeigt Boulder, bei denen der Kletterer seine Paradedisziplinen (z.B. hohe Balance & Flexibilität) voll ausspielen kann $\rightarrow$ hohe Flash-Wahrscheinlichkeit, maximales Flow-Erlebnis.
2. **Modus „Baustellen-Training“ (Schwächen-Fokus)**:
   - Hebt Boulder hervor, die gezielt die in SPEC-008 identifizierte Hauptschwäche $\min_a(P_a - H_a)$ fordern:
     $$S_{\text{Style, Training}} = \frac{R_{B, \text{Schwäche}}}{5.0} \times \text{PenalizeOtherGaps}$$
   - *Effekt*: Perfekt für strukturierte Trainingstage („Heute trainiere ich meine Dyno-/Koordinations-Schwäche“).

#### C. Morpho- & Ergonomie-Faktor ($S_{\text{Morpho}}$)
- Wenn der Kletterer optional seine Körpergröße / Spannweite (Ape-Index) im Profil angegeben hat:
  - Abgleich mit dem Community-Morpho-Feedback („Eher weite Züge / Vorteil für Große“ vs. „Kompakter Box-Boulder / Vorteil für Kleinere“).
  - Bei neutralen Bouldern oder fehlender Angabe $S_{\text{Morpho}} = 1.0$.

---

### 3. Das individuelle Bewertungs-System (Zwei Ebenen)

Wenn ein Kletterer einen Boulder getoppt/geflasht hat oder bewertet, unterscheidet das System künftig klar zwischen:

| Dimension | Ebene 1: Generische Bewertung (Community) | Ebene 2: Individuelle Bewertung (Persönlich) |
|---|---|---|
| **Fokus** | „Wie objektiv gelungen & wie schwer ist die Route für alle?“ | „Wie gut lag dieser Boulder DIR persönlich?“ |
| **Grad** | Soft / Fair / Stiff (Grad-Ehrlichkeit bezogen auf das Schild) | *„Gefühlt für mich wie...“* (Persönlicher Härte-Eindruck) |
| **Qualität** | 1–5 Sterne (Linienführung, Griffe, Schrauberqualität) | *Persönlicher Flow-Faktor* (1–5 Chilis / Blitz-Symbolik) |
| **Morpho** | — | *Morpho-Empfinden*: `Große im Vorteil` · `Fair für alle` · `Kompakt / Kleinere im Vorteil` |
| **Nutzung** | Bestimmt den Hallen-Durchschnitt und die Wand-Aura | Trainiert die persönliche Recommender-Engine des Kletterers |

---

### 4. UI/UX-Integration an der Wand & im Profil

1. **Intelligente Schnellfilter an der Wand (`ClimberSectorView`)**:
   - `🎯 Perfekt für mich`: Filtert auf Boulder mit $\text{BFS} \ge 80\%$.
   - `✨ Stärken-Match`: Zeigt Boulder, die den eigenen Stärken schmeicheln.
   - `🏋️ Trainings-Picks`: Zeigt Boulder im optimalen Projektgrad, die die persönliche Baustelle trainieren.
2. **Match-Badge an den Pins im Wandfoto**:
   - Boulder mit außergewöhnlich hohem Match ($\ge 90\%$) erhalten einen dezenten goldenen Match-Ring oder ein kleines `🎯 95%`-Pill-Badge direkt am Pin.
3. **Erweiterte Boulder-Detailansicht**:
   - Neuer Bereich **„Dein persönlicher Match“**:
     - Prozent-Score mit Erklärung: *„92% Match – Passt perfekt zu deinem Kletterstil (starke Balance & Technik) und liegt genau in deinem Projekt-Sweet-Spot.“*
     - Mini-Radar-Überlagerung: Dein Athleten-Radar vs. Boulder-Anforderung.
4. **Individuelles Bewertungs-Sheet nach Durchstieg**:
   - Ergänzung im bestehenden `RatingModal`:
     - 1-Tap Morpho-Feedback (`Klein`, `Ausgeglichen`, `Groß`).
     - 1-Tap Style-Fit („Hat mir extrem gelegen“ bis „Gar nicht mein Stil“).

---

### 5. Technische Architektur & Umsetzungs-Fahrplan (Später)

1. **Stammdaten & Schema**:
   - `user_profiles`: Optionale Felder `height_cm`, `arm_span_cm`.
   - `boulder_ratings`: Felder `morpho_bias` (`small_friendly`, `neutral`, `tall_friendly`), `personal_style_fit` (1–5).
2. **Engine (`boulderFitService.ts`)**:
   - Reines clientseitiges Vektor- und Score-Matching auf Basis der bereits gecachten Boulder- und Profil-Statistiken (Null zusätzliche Backend-Latenz).
3. **Reaktive Einbindung**:
   - `ClimberSectorView` filtert und sortiert Boulder bei aktivem Match-Filter instant im Speicher.

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
