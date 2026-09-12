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
* **Problemstellung & Rahmenbedingungen**:
  - Eine generelle Community-Note (z. B. 4.8 Sterne, Grad 6B) sagt nichts darüber aus, ob die Bewegungen und Anforderungen der Route zu den Stärken oder Vorlieben eines spezifischen Kletterers passen.
  - **Wichtige Rahmenbedingung**: Es gibt **weder** eine hinterlegte Körpergröße des Kletterers **noch** eine manuelle Kennzeichnung an Routen bzgl. Vor-/Nachteil durch Körpergröße.
  - **Die Lösung**: Das Matching muss **vollständig datengetrieben auf Basis der bereits existierenden Kletter- und Routenparameter** funktionieren – rein über Durchstiegsmuster, das 6-Achsen-Kletterprofil und implizite Stil-Resonanz!

---

### 2. Die Methode: Der datengetriebene „Boulder-Fit Score“ (BFS)

Der Boulder-Fit Score berechnet für einen Kletterer $U$ und einen Boulder $B$ einen normalisierten Passungs-Wert von **0% bis 100%**:

$$\text{BFS}(U, B) = w_{\text{Grade}} \cdot S_{\text{Grade}}(U, B) + w_{\text{Style}} \cdot S_{\text{Style}}(U, B) + w_{\text{Cohort}} \cdot S_{\text{Cohort}}(U, B)$$

*(Standard-Gewichtung: $w_{\text{Grade}} = 0.40$, $w_{\text{Style}} = 0.40$, $w_{\text{Cohort}} = 0.20$)*

#### A. Grad- & Progressions-Affinität ($S_{\text{Grade}}$)
Basiert auf den realen Begehungen des Kletterers (`ascents`):
- **Median-Niveau ($G_{\text{median}}$)** und **Maximal-/Projekt-Limit ($G_{\text{max}}$)** aus [SPEC-008](specs/SPEC-008-climber-performance-attributes-statistics.md).
- **Sweet-Spot (100% Match)**: Boulder im Bereich $[G_{\text{median}}, G_{\text{max}} + 0.5]$ (die ideale Zone zwischen Flow und sportlicher Progression).
- **Warm-Up Zone ($G_B < G_{\text{median}} - 1.5$)**: Geringerer Match für Projekt-Sessions, aber separat filterbar für Warm-ups.
- **Out-of-Range ($G_B > G_{\text{max}} + 2$)**: Exponentieller Abzug, um Frustration an der Wand zu vermeiden.

#### B. 6-Achsen Stil- & Radar-Resonanz ($S_{\text{Style}}$)
Nutzt die bestehenden 6 Kletterattribute (**Maximalkraft**, **Kraft-Ausdauer**, **Technik**, **Balance**, **Koordination**, **Flexibilität**):
- Das persönliche **Athleten-Radar $\vec{A}_U$** (ermittelt aus erfolgreichen Flashs/Tops im Grenzbereich) wird mit dem **Boulder-Profil $\vec{R}_B$** verglichen.
- **Zwei umschaltbare Match-Modi**:
  1. **Modus „Stärken-Flow“ (Mein Style)**:
     $$S_{\text{Style, Flow}} = \frac{\vec{A}_U \cdot \vec{R}_B}{\|\vec{A}_U\| \|\vec{R}_B\|}$$
     *Effekt*: Hebt Boulder hervor, bei denen die dominanten Eigenschaften des Boulders mit den Paradedisziplinen des Kletterers übereinstimmen (z. B. Route fordert hohe Balance & Flexibilität $\rightarrow$ maximale Flash-Chance und Flow-Gefühl).
  2. **Modus „Trainings-Booster“ (Baustellen-Fokus)**:
     *Effekt*: Hebt Boulder hervor, die gezielt die in SPEC-008 identifizierte Baustelle fordern (z. B. Kletterer hat Nachholbedarf bei dynamischer Koordination, Route bietet Koordination $\ge 3.8$, liegt aber in machbarem Grad).

#### C. Implizite Kletter-DNA / „Kletter-Zwillinge“ ($S_{\text{Cohort}}$)
* **Kompensation fehlender Körpergrößen-Daten**:
  - Kletterer mit ähnlicher Hebelgeometrie, Reichweite und Bewegungsdynamik zeigen statistisch hochgradig ähnliche Durchstiegs- und Scheiter-Muster über dieselben Boulder.
  - Das System identifiziert Kletterer mit hoher Schnittmenge geloggter Boulder (**Kletter-Zwillinge / Kohorte**).
  - Haben Kletterer aus dieser ähnlichen Gruppe einen Boulder überdurchschnittlich oft im 1. Versuch geschafft oder als besonders passend bewertet, steigt der Score $S_{\text{Cohort}}$ – ganz ohne Zentimeter-Messungen!

---

### 3. Das individuelle Bewertungs-System (Zwei Ebenen)

Wenn der Kletterer einen Boulder loggt, kann er ihn auf zwei Ebenen bewerten:

| Dimension | Ebene 1: Generische Bewertung (Community) | Ebene 2: Individuelle Resonanz (Persönlich) |
|---|---|---|
| **Kernfrage** | „Wie objektiv gelungen & wie schwer ist die Route an sich?“ | „Wie gut lag dieser Boulder DIR persönlich?“ |
| **Grad-Eindruck** | Soft / Fair / Stiff (Grad-Ehrlichkeit bezogen auf das Schild) | *„Subjektiv für mich:“* `Viel leichter als Grad` · `Passt genau` · `Sehr hart für mich` |
| **Qualitätsnote** | 1–5 Sterne (Linienführung, Griffe, Schrauberqualität) | *Persönlicher Style-Fit* (1–5 Punkte: *„Gar nicht mein Ding“* bis *„Genau mein Kletterstil“*) |
| **Verwendung** | Fließt in den globalen Hallendurchschnitt ein | Kalibriert die persönliche Match-Engine des Kletterers nach |

---

### 4. UI/UX-Integration an der Wand & im Profil

1. **Intelligente Schnellfilter an der Wand (`ClimberSectorView`)**:
   - `🎯 Top-Match für mich`: Zeigt die Boulder mit dem höchsten Gesamt-Match ($\text{BFS} \ge 80\%$).
   - `✨ Liegt mir (Stärken)`: Zeigt Routen, die den eigenen Stärken schmeicheln.
   - `🏋️ Trainings-Projekt`: Zeigt Routen im Projektgrad, die gezielt an der eigenen Schwäche feilen.
2. **Match-Badge an den Pins im Wandfoto**:
   - Boulder mit Spitzen-Match erhalten ein dezentes goldenes `🎯 92%`-Badge am Pin.
3. **Boulder-Detailansicht**:
   - Box **„Dein Match: 92%“**:
     - Transparente Erklärung: *„Matcht deine Stärken in Balance & Technik und liegt optimal in deiner Projekt-Zone.“*
4. **Schlankes Bewertungs-Sheet (`RatingModal`)**:
   - Zusätzlicher, optionaler 1-Tap-Regler: *„Lag mir persönlich:“* (1–5).

---

### 5. Technische Architektur & Umsetzungs-Fahrplan (Später)

1. **Reines In-Memory / Client-Matching (`boulderFitService.ts`)**:
   - Keine zusätzlichen Backend-Felder oder Pflichtabfragen nötig.
   - Berechnet die Ähnlichkeiten direkt aus den im LocalStorage/Cache vorhandenen Daten (`ascents`, `ratings`, `GymGradeScale`).
2. **Datensparsamkeit & Zero Friction**:
   - Funktioniert ab dem ersten geloggten Boulder und verfeinert sich mit jeder Begehung automatisch.


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
