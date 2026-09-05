# SPEC-008: Persönliche Kletterer-Performance & Stärken/Schwächen-Statistik

## Status: APPROVED (SDD Autonomous Mode)

## Summary
Erweitert das persönliche Kletterer-Profil (SPEC-004) um eine tiefgehende multidimensionale Performance-Analyse. Das Feature setzt die individuellen Begehungserfolge (Flash, Top, Projekt) in direkte Relation zu den 5 Boulder-Attributen (**Kraft**, **Technik**, **Balance**, **Koordination**, **Flexibilität**) und dem jeweiligen Schwierigkeitsgrad. Über einen grad-normalisierten Performance-Index (GNPI) mit Relevanz-Filterung für den Grenzbereich (Limit-Klettern) wird ein persönliches **Athleten-Radar** berechnet. Dieses wird dem **Hallen-Anforderungsprofil** gegenübergestellt, leitet automatisch primäre **Stärken** und **Baustellen (Schwächen)** ab und liefert kletterspezifische Trainingsempfehlungen.

---

## 1. Detaillierte Berücksichtigung des Schwierigkeitsgrads (Grade Modeling)

Die bloße Zählung von Tops führt zu groben Verzerrungen: Ein Aufwärmboulder im leichten Bereich (Grad 4) liefert kaum Information über Stärken oder Schwächen, da dort fast alles getoppt wird. Echte Stärken und Baustellen zeigen sich **im Grenzbereich (Limit-Klettern)**.

### 1.1 Das 3-Stufen-Modell zur Grad-Berücksichtigung

1. **Persönlicher Benchmark (Median-Grad $G_{\text{median}}$)**:
   * Ermittlung des Medians aller getoppten/geflashten Routen (z.B. Rang 4 = *Blau / 6B*).
   * Alle Boulderschwierigkeiten werden als Delta $\Delta G_i = G_i - G_{\text{median}}$ relativ zum Klettererniveau gemessen.

2. **Grenzbereich-Relevanzfilter (Limit-Climbing Relevance $R_i$)**:
   * Bouldern, die weit unter dem persönlichen Niveau liegen ($\Delta G < -2$, z.B. Aufwärmboulder), wird nur eine geringe statistische Relevanz beigemessen ($R_i = 0.25$).
   * Boulder im Grenzbereich ($\Delta G \in [-1, +2]$) und darüber erhalten volles Gewicht ($R_i = 1.0$).
   $$R(G_i) = \begin{cases} 
   1.0 & \text{wenn } G_i \ge G_{\text{median}} - 1 \\ 
   0.5 & \text{wenn } G_i = G_{\text{median}} - 2 \\ 
   0.25 & \text{wenn } G_i \le G_{\text{median}} - 3 
   \end{cases}$$

3. **Asymmetrischer Performance-Multiplikator ($S_i$)**:
   * **Top über Limit ($\Delta G > 0$)**: Gibt massiven Stärke-Bonus auf die beteiligten Attribute.
   * **Projekt unter Limit ($\Delta G \le 0$)**: Ein ungelöster Boulder *unter* dem eigenen Normalniveau ist der stärkste statistische Indikator für eine kletterspezifische **Baustelle (Schwäche)**.
   * Gewichtungsformel:
     - $\text{Flash}: S_i = 1.30 \times (1 + 0.25 \cdot \Delta G_i)$
     - $\text{Top}: S_i = 1.00 \times (1 + 0.20 \cdot \Delta G_i)$
     - $\text{Projekt}: S_i = 0.15 \times (1 + 0.20 \cdot \Delta G_i) \quad \text{(bei } \Delta G_i < 0 \text{ sinkt der Wert drastisch)}$

4. **Grade-Ceiling pro Attribut (Härtester Top je Stil)**:
   * Neben dem Radar-Wert wird für jedes Attribut der maximal erreichte Grad bei dominanten Routen (Attribut $\ge 4$) festgehalten.
   * *Beispiel*: Kraft-Ceiling = *Rot (7A)* vs. Balance-Ceiling = *Grün (6A)* $\rightarrow$ 2 Stufen Delta belegen das Ungleichgewicht objektiv.

---

## 2. Hallenschnitt vs. Deine Leistung (Referenzierung)

### 2.1 Was stellt der Hallenschnitt dar?
Der Hallenschnitt bildet das **Schrauber- und Anforderungsprofil** der gewählten Halle ab. Er berechnet sich aus dem Mittelwert aller aktiven Boulder dieser Halle über die 5 Achsen:
$$H_a = \frac{1}{|B_{\text{Gym}}|} \sum_{b \in B_{\text{Gym}}} r_{b, a}$$

### 2.2 Der visuelle Mehrwert (Doppel-Radar)
Im 5-Achsen Radar-Chart werden zwei Polygone übereinandergelegt:
- **Fläche mit Sandstein-Glow**: Dein persönliches Performance-Profil ($P_a$).
- **Gestrichelte Granit-Linie**: Das Anforderungsprofil der Halle ($H_a$).

**Erkenntnis für den Kletterer**:
- *Polygon beult über die Hallenlinie hinaus*: „Du beherrschst diesen Stil besser, als die Halle ihn durchschnittlich fordert.“
- *Polygon bleibt deutlich hinter der Hallenlinie zurück*: „Die Halle verlangt hier viel (z.B. Koordination 4.0), während du bei 2.6 stehst – der Hauptgrund für Fehlversuche in dieser Halle!“

---

## 3. Berechnungslogik für Stärken & Schwächen

### 3.1 Attribut-Gewichtung eines Boulders
$$w_{B, a} = \frac{r_{B, a}}{\sum_{k=1}^5 r_{B, k}}$$

### 3.2 Aggregierter Achsen-Score $P_a$
$$P_a = \frac{\sum_{i} R(G_i) \cdot w_{B_i, a} \cdot S_i \cdot r_{B_i, a}}{\sum_{i} R(G_i) \cdot w_{B_i, a}}$$

Normierung auf 1.0 bis 5.0 ($3.0 = \text{ausgeglichen}$):
$$\text{AthletenRadar}_a = \text{clamp}\left(1.0, \, 5.0, \, 3.0 + 1.5 \cdot (P_a - \overline{P})\right)$$

### 3.3 Automatische Ableitung
1. **Größte Stärke**: $\max_a(P_a - H_a)$ (wo übertriffst du die Hallenanforderung am stärksten?)
2. **Größte Baustelle**: $\min_a(P_a - H_a)$ (wo ist die Lücke zwischen Hallenanforderung und deiner Leistung am größten?)

---

## 4. User Stories & Acceptance Criteria

### User Stories
- **US-1**: Als Kletterer möchte ich, dass leichte Aufwärmboulder mein Stärken/Schwächen-Profil nicht verfälschen, sondern Routen an meinem Limit zählen.
- **US-2**: Als Kletterer möchte ich mein Athleten-Radar direkt im Vergleich zum Anforderungsprofil der Halle sehen (Doppel-Polygon).
- **US-3**: Als Kletterer möchte ich in zwei markanten Infokarten meine größte Stärke und meine größte Schwachstelle mit konkreten Daten und Empfehlungen lesen.
- **US-4**: Als Kletterer möchte ich das Grade-Ceiling (härtester Top) pro Klettereigenschaft sehen.

### Acceptance Criteria
- [x] **AC-1**: Profil-Screen bietet Segmentierung: `[ÜBERSICHT]` und `[STIL & PERFORMANCE]`.
- [x] **AC-2**: 5-Achsen SVG-Chart rendert dein Profil (Glow) + Hallen-Anforderungsprofil (gestrichelte Granit-Linie).
- [x] **AC-3**: Grad-Normalisierung filtert Aufwärmboulder mit geringerem Gewicht und gewichtet Limit-Tops/Drops exponentiell.
- [x] **AC-4**: Stärken-Karte (Moosgrün `#4A5D3A`) und Baustellen-Karte (Lehmrot `#A0522D`) nennen konkrete Kennzahlen (Send-Quote, Delta zum Hallenschnitt, Grade-Ceiling).
- [x] **AC-5**: Konkrete Boulder-Empfehlung: Schlägt 1–2 aktive Boulder der Halle vor, die genau die aktuelle Baustelle trainieren.
- [x] **AC-6**: Umschaltbar zwischen einzelner Halle (zeigt spezifischen Hallenschnitt) und „Alle Hallen" (zeigt globalen Boulder-Schnitt).
- [x] **AC-7**: Mindestanzahl $\ge 5$ Logs für Freischaltung; sonst Fortschritts-Felsblock.

---

## 5. UI / UX Design (SPEC-005 Konformität)

```
┌────────────────────────────────────────────────────────┐
│  [■ Avatar]  BORIS                                 ⚙️  │
│  [ Minimum Boulder Zürich ▼ ]                          │
├────────────────────────────────────────────────────────┤
│  [ ÜBERSICHT ]  │ [★ STIL & PERFORMANCE ]              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  DEIN ATHLETEN-PROFIL                                  │
│                                                        │
│                    Kraft (4.4)                         │
│                        ▲                               │
│            Flex (2.1) / \ Technik (3.6)               │
│                     /     \                            │
│                     \     /                            │
│           Koord (2.4)\   / Balance (3.9)               │
│                        ▼                               │
│                                                        │
│  ─── Deine Leistung   - - - Hallenschnitt Minimum      │
│                                                        │
├────────────────────────────────────────────────────────┤
│  🟢 DEINE STÄRKE: KRAFT & ZUGKRAFT                     │
│  +0.9 über Hallenschnitt · Max-Grad: 7A (Rot)          │
│  Du flashst 64% aller Routen mit hoher Kraftanforderung│
├────────────────────────────────────────────────────────┤
│  🔴 DEINE BAUSTELLE: KOORDINATION & TIMING             │
│  -1.3 unter Hallenschnitt · Max-Grad: 6A (Grün)        │
│  Hohe Projektrate bei dynamischen Zügen und Sprüngen.  │
│  💡 Empfohlener Fokus: Sektor Überhang, Blau #08       │
├────────────────────────────────────────────────────────┤
│  ATTRIBUT-VERGLEICH (DU VS. HALLE)                     │
│                                                        │
│  Kraft         4.4  vs  3.5 Hallenschnitt  (+0.9) 🟢   │
│  Balance       3.9  vs  3.2 Hallenschnitt  (+0.7) 🟢   │
│  Technik       3.6  vs  3.4 Hallenschnitt  (+0.2) 🟡   │
│  Flexibilität  2.1  vs  2.3 Hallenschnitt  (-0.2) 🟡   │
│  Koordination  2.4  vs  3.7 Hallenschnitt  (-1.3) 🔴   │
│                                                        │
└────────────────────────────────────────────────────────┘
```
