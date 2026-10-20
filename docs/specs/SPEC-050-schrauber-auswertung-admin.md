# SPEC-050: Schrauber-Auswertung für die Hallenleitung

## Status: IMPLEMENTED (2026-10-20; Spec READY v4 nach 3 Loops)

> **Owner:** Hans · **Created:** 2026-10-20 · **Version:** v4 (nach 3 Loops «FeatureDefinition»)
> **Baut auf:** SPEC-003 (Bewertungen, Grad-Gefühl, Beta), SPEC-023 (Admin-UX), SPEC-030 (Hallen-Auswertung «Zahlen», «Geschraubt von»), SPEC-032 (Lesbarkeit), SPEC-035 (Versuche privat), SPEC-044 (Schrauber-Statistik «Meine Routen»)
> **Prozess:** [Loop «FeatureDefinition»](../prozesse/feature-definition.md). Grill-me am 2026-10-20; Hans: «geh immer mit der Empfehlung». Feedback-Runden: [`docs/feedback-runden/2026-10-20-schrauber-auswertung-admin/`](../feedback-runden/2026-10-20-schrauber-auswertung-admin/) (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

Die Hallenleitung soll sehen, **wie die Routen jedes Schraubers bei den Kletterern ankommen**: Sterne, ob der Grad passt, wie oft die Routen geklettert werden und was die Leute schreiben. Hans (2026-10-20): «Hier sollen Statistiken über alle Schrauber einsehbar sein und deren Bewertungen durch die Kletterer.»

Die Zahlen sind ein **Gesprächsanlass im Team, keine Note**: «Blau von Jonas wirkt hart» soll besprochen werden können, ohne Ranglisten, Pokale oder Export.

## 2. Ausgangslage (Code-Stand 2026-10-20)

| # | Befund | Wo |
|---|---|---|
| A1 | Der Admin-Tab «Zahlen» hat einen Abschnitt «Schrauber»: pro Person Routen, Top-Routen, Ø Sterne, Begehungen, Stiff/Soft in %, sortiert nach Top-Routen. Keine Detailansicht, kein Vergleich nach Farben. | `gymInsights.ts`, `GymInsightsView.tsx` (SPEC-030 F7) |
| A2 | Begehungen, Bewertungen und Beta-Kommentare aller Kletterer liegen nach dem Abgleich im lokalen Speicher. | `syncService`, `ratingAndAscentService` |
| A3 | SPEC-044 gibt Schraubern «Meine Routen» mit farbgewichtetem Hallenvergleich und verbietet dort eine Rangliste; der Vergleich zwischen Schraubern bleibt der Hallenleitung vorbehalten. | SPEC-044 §3, §11 |
| A4 | Versuche sind privat (SPEC-035 F4). | SPEC-035 |

## 3. Abgrenzung

| | SPEC-030 «Zahlen · Halle» | SPEC-044 «Meine Routen» | **SPEC-050 «Zahlen · Schrauber»** |
|---|---|---|---|
| Wer | Hallen-/Plattform-Admin | jeder Schrauber, nur eigene Routen | **Hallen-/Plattform-Admin** |
| Was | Farben, Sektoren, Beliebteste, Kaum geklettert | eigene Routen, Hinweise, Versuche (Median) | **alle Schrauber: Übersicht + Detail pro Schrauber** |
| Vergleich | – | nur Hallenschnitt gleicher Farben | Hallenschnitt gleicher Farben; Sortierung, **keine Plätze** |
| Versuche | – | Median ab 3 Tops | **gar nicht** |

Gleiche Rechenregeln wie SPEC-044: Mindestzahl 3 Bewertungen, Top-Route = Ø ≥ 4,0 Sterne bei ≥ 3 Bewertungen, Hallenvergleich **gewichtet nach der Farbverteilung der Routen des Schraubers**.

## 4. Grill-me: Fragen und Entscheidungen (alle nach Empfehlung)

**F1 – Wo?** ✔ Admin-Tab «Zahlen», oben Umschalter **«Halle» · «Schrauber»**. Der bisherige Abschnitt «Schrauber» (SPEC-030 F7) zieht in die Ansicht «Schrauber» um und wird dort erweitert.
**F2 – Wer sieht es?** ✔ Nur wer die Admin-Konsole öffnen darf (Hallen-Admin, Plattform-Admin), wie SPEC-030 F9.
**F3 – Kennzahlen pro Schrauber?** ✔ Routen, Ø Sterne mit Hallenwert, Grad «passt n von m», «im 1. Versuch», Begehungen pro Woche (v3), Top-Routen.
**F4 – Rangliste?** ✔ Nein: keine Platznummern, keine Medaillen. Sortierung nur als Werkzeug.
**F5 – Detail pro Schrauber?** ✔ Ja: Lieblingsroute, Werte pro Farbe, Routenliste mit Beta.
**F6 – Beta-Kommentare?** ✔ Ja, **ohne Namen und ohne Profilbild**.
**F7 – Versuche?** ✔ Nein (privat, SPEC-035).
**F8 – Zeitraum?** ✔ «An der Wand» (Standard) / «Alle» wie SPEC-030, gilt für Halle und Schrauber gemeinsam.
**F9 – Export/Druck?** ✔ Nein (SPEC-030 F11; Runde 1: landet in der Personalakte).
**F10 – Wissen die Schrauber davon?** ✔ Ja: Satz in «Meine Routen» (SPEC-044 Transparenz-Zeile, Folgeänderung §9) und Hinweis in der Admin-Ansicht.

**Grundsatzfrage (Runde 1, Datenschutz):** Dürfen Admins Werte einzelner Schrauber sehen? ✔ Ja (Wunsch Hans), mit Transparenz, Mindestzahlen und ohne Export.

## 5. Aufbau

### 5.1 Umschalter und Zeitraum
- `insights-mode-hall` «Halle» (Standard) · `insights-mode-setters` «Schrauber», Segment-Knopf, je ≥ 48 px hoch.
- Darunter die Zeitraum-Knöpfe aus SPEC-030 (`insights-scope-active`, `insights-scope-all`); die Wahl gilt für beide Ansichten.

### 5.2 Übersicht «Schrauber» (`setter-report`)
1. **Hinweis** `setter-report-note`: «Die Zahlen sind ein Gesprächsanlass, keine Note. Deine Schrauber sehen ihre eigenen Zahlen unter ‹Meine Routen›.»
2. **Sortierung** in 2 × 2 Knöpfen (v3), je ≥ 48 px: `setter-report-sort-routes` «Routen» (Standard) · `setter-report-sort-stars` «Sterne» · `setter-report-sort-grade` «Grad passt» · `setter-report-sort-name` «Name».
   - «Routen»: meiste Routen zuerst. «Sterne»: größter Abstand **über** dem Hallenwert zuerst (v2). «Grad passt»: höchster Anteil «passt» zuerst. «Name»: alphabetisch.
   - Wer bei «Sterne» bzw. «Grad passt» zu wenige Bewertungen hat, steht **unten, ohne Zahl** (v2). «Unbekannt» steht immer ganz unten.
3. **Liste** `insights-setters`, eine Karte `insights-setter-<setterId>` pro Schrauber (antippbar, ganze Karte ≥ 56 px):
   - Zeile 1: **Name** (17 px, fett) · `insights-setter-<id>-routes` «n Routen» · `insights-setter-<id>-top` «n Top»
   - Zeile 2 (16 px): `-stars` «3,9 ★ · Halle 3,6» (v4: kein Vorzeichen, keine Ampelfarbe) · `-grade` «Grad passt: 7 von 10» · `-weekly` «2,1 pro Woche · Halle 1,8» (v3)
   - Bei zu wenigen Bewertungen statt Sternen/Grad: «noch zu wenige Bewertungen».
   - Bei «An der Wand» erscheinen nur Schrauber mit mindestens einer aktiven Route (v3).
   - «Unbekannt» (`insights-setter-unknown`) mit Satz «Routen ohne Schrauber. Im Studio unter ‹Geschraubt von› nachtragen.» (v2)
   - Keine Teilansicht der Farbverteilung in der Übersicht (v3, knapp halten).

### 5.3 Detailseite (`setter-report-detail`)
Ersetzt die Übersicht im Tab (kein Overlay), oben **«‹ Zurück zur Übersicht»** `setter-report-back` (≥ 48 px, v2).
1. **Kopf**: Name, «n Routen · m an der Wand».
2. **Vier Kacheln** (Zahl ≥ 28 px, Beschriftung ≥ 15 px, je `aria-label` als ganzer Satz):
   - `setter-detail-kpi-stars` **Ø Sterne**, darunter «Halle, gleiche Farben: 3,6»
   - `setter-detail-kpi-grade` **Grad passt**, «7 von 10»
   - `setter-detail-kpi-firsttry` **Im 1. Versuch**, «4 von 10», darunter «Halle: 38 %» (v3, statt «Flash-Quote»)
   - `setter-detail-kpi-weekly` **Pro Woche**, Begehungen pro Route und Woche, darunter «Halle: 1,8»
3. **Lieblingsroute** `setter-detail-favorite` (v2): beste Route mit ≥ 3 Bewertungen und Ø ≥ 4,0: Farbpunkt + Farbname, Name, «4,6 ★ aus 9 Bewertungen», Satz «Diese Route mögen die Leute besonders.» (v3). Entfällt ohne solche Route.
4. **Pro Farbe** `setter-detail-colors` (v2), eine Zeile `setter-detail-color-<scaleId>` pro Farbe, in der dieser Schrauber Routen hat (Hallen-Reihenfolge):
   - Farbpunkt **mit Farbname**, «n Routen»
   - «3,9 ★ · Halle 3,6» (ab 3 Bewertungen in dieser Farbe)
   - Grad-Gefühl als Wörter mit Zahl: «zu leicht 1 · passt 2 · zu hart 7» (ab 3 Stimmen) und Tendenz `-tendency` «wirkt eher hart» bzw. «wirkt eher leicht», wenn ≥ 60 % der Stimmen hart bzw. leicht sind
5. **Routen** `setter-detail-routes`, neueste zuerst, Zeile `setter-detail-route-<boulderId>` (≥ 56 px): Farbpunkt + Farbname, Name oder «Ohne Name», Sektor, Begehungen, Ø Sterne oder «noch n Bewertungen», Grad-Gefühl als Wort («meist zu hart») ab 3 Stimmen; abgeschraubte Routen (Zeitraum «Alle») mit «abgeschraubt am 3.10.».
   - **Antippen klappt auf** `setter-detail-route-<id>-more` (v3): «im 1. Versuch n · Top n · Projekt n», Grad-Gefühl «zu leicht · passt · zu hart» mit Zahlen, die **5 neuesten Beta-Kommentare** `setter-detail-comment` **ohne Namen**, Datum als «vor 3 Tagen».
6. **Leerer Zustand** `setter-detail-empty` (v4): «Noch zu wenige Bewertungen. Ab 3 Bewertungen pro Route erscheinen hier Sterne und Grad-Gefühl.»

## 6. Rechenregeln

- Grundlage: Boulder der Halle im Zeitraum (aktiv bzw. aktiv + abgeschraubt), gruppiert nach `normalizeSetterId(setterId)` (SPEC-030).
- **Begehungen** = Flash + Top, pro Person die neueste (wie `computeBoulderStatsAggregate`); Projekte zählen nicht.
- **Ø Sterne** über alle Bewertungen der Routen; angezeigt ab **3 Bewertungen**.
- **Grad passt** = Stimmen «fair» / alle Grad-Stimmen; angezeigt ab **3 Stimmen**.
- **Im 1. Versuch** = Flash / (Flash + Top); angezeigt ab **5 Begehungen**.
- **Pro Woche**: je Route Begehungen ÷ max(1, Tage an der Wand ÷ 7); Tage von `publishedAt` (sonst `createdAt`) bis `archivedAt` bzw. heute. Wert des Schraubers = Mittel über seine Routen.
- **Hallenwert gleicher Farben**: pro Farbe der Hallenwert über **alle** Routen dieser Farbe im Zeitraum; gewichtet mit der Anzahl Routen des Schraubers in dieser Farbe; Farben ohne Hallenwert fallen aus der Gewichtung.
- **Top-Route**: ≥ 3 Bewertungen und Ø ≥ 4,0.
- **Tendenz** einer Farbe: ≥ 3 Stimmen und ≥ 60 % «stiff» → «wirkt eher hart», ≥ 60 % «soft» → «wirkt eher leicht».

## 7. Datenschutz und Fairness

- **Keine Kletterer-Namen, keine Profilbilder**, auch nicht bei Beta-Kommentaren; keine einzelnen Bewertungen einer Person.
- **Keine Versuche.**
- Mindestzahlen nach §6; darunter «noch zu wenige Bewertungen».
- **Keine Platznummern, keine Medaillen, kein Export.**
- Daten nur aus dem lokalen Speicher; keine Migration, keine neue Abfrage.

## 8. Lesbarkeit (Hans, SPEC-032)

Fließtext ≥ 16 px, Tap-Flächen ≥ 48 px, Kontrast ≥ 4,5 : 1 hell und dunkel, Farbpunkt immer mit Farbname, Grad-Gefühl immer mit Wort und Zahl, keine Ampelfarben für «über/unter Halle» (v4). Sprache Deutsch (Admin-Konsole ist nicht übersetzt).

## 9. Folgeänderungen

- **SPEC-030:** Abschnitt «Schrauber» (F7, AC-7) zieht in die Ansicht «Schrauber» um; die Ansicht «Halle» zeigt Kacheln, Farben, Beliebteste, Kaum geklettert, Sektoren. `computeGymInsights().setters` bleibt unverändert bestehen.
- **SPEC-044 Transparenz-Zeile** (an den Thread «Schrauber-Statistik» gegeben, dessen Datei): «Was sieht die Hallenleitung? Im Tab ‹Zahlen› deine Kennzahlen im Vergleich zur Halle und jede deiner Routen mit Sternen, Grad-Gefühl und Beta-Kommentaren, ohne Namen der Kletterer. Keine Versuche, keine Hinweise, kein Export.» (v3/v4)

## 10. Umsetzung

- `src/lib/setterReport.ts` – reine Funktionen:
  - `computeSetterReport({ gymId, scope, now, … })` → `{ setters: SetterReportRow[], hallByColor }`
  - `sortSetterReport(rows, sort)`
  - `computeSetterDetail(setterId, input)` → Kacheln, Lieblingsroute, Pro Farbe, Routen mit Beta (ohne Namen)
  - nutzt `normalizeSetterId`, `setterDisplayName`, `INSIGHTS_TOP_MIN_RATINGS`, `UNKNOWN_SETTER_ID` (SPEC-030) und `computeBoulderStatsAggregate` (SPEC-003), `TOP_RATED_MIN_STARS`.
- `src/components/admin/SetterReportView.tsx` – Übersicht und Detailseite.
- `src/components/admin/GymInsightsView.tsx` – Umschalter «Halle · Schrauber», Abschnitt «Schrauber» entfällt in «Halle».
- Keine Migration.

## 11. Akzeptanzkriterien

- **AC-1** Tab «Zahlen» zeigt `insights-mode-hall` (Standard) und `insights-mode-setters`; «Schrauber» zeigt `setter-report`, «Halle» zeigt den Abschnitt «Schrauber» nicht mehr.
- **AC-2** Der Zeitraum gilt für beide Ansichten; bei «An der Wand» nur Schrauber mit aktiver Route.
- **AC-3** Jede Karte `insights-setter-<id>` zeigt Routen, Top, Sterne mit Hallenwert, Grad passt «n von m», Begehungen pro Woche mit Hallenwert; unter der Mindestzahl «noch zu wenige Bewertungen».
- **AC-4** Sortierung Routen (Standard) / Sterne (Abstand zum Hallenwert) / Grad passt / Name; ohne genug Daten unten; «Unbekannt» immer zuletzt; keine Platznummern.
- **AC-5** Antippen öffnet `setter-report-detail`; `setter-report-back` führt zurück.
- **AC-6** Detail: vier Kacheln nach §5.3, Lieblingsroute nur mit ≥ 3 Bewertungen und Ø ≥ 4,0, Pro Farbe mit Farbname, Wort+Zahl und Tendenz ab 60 %.
- **AC-7** Routenliste aufklappbar mit Flash/Top/Projekt, Grad-Gefühl und höchstens 5 Beta-Kommentaren **ohne Namen**.
- **AC-8** Nirgends Kletterer-Namen, Profilbilder oder Versuche; kein Export.
- **AC-9** `setter-report-note` sichtbar.
- **AC-10** Lesbarkeit nach §8.

## 12. Tests (CONSTITUTION §13)

**Unit (Vitest)**
- `tests/spec050SetterReport.test.ts`: Gruppierung, Mindestzahlen, farbgewichteter Hallenwert, pro Woche, Zeitraum, Sortierung (Abstand, ohne Daten unten, Unbekannt zuletzt), Detail (Lieblingsroute, Pro Farbe, Tendenz, Kommentare ohne Namen, höchstens 5).
- `tests/spec050SetterReportView.test.tsx`: Umschalter, Karten, Sortieren, Detail öffnen/zurück, Aufklappen, keine Kletterer-Namen.
- `tests/spec030GymInsightsView.test.tsx`: angepasst (Schrauber über Umschalter).

**Playwright (`tests/e2e/setter-report.spec.ts`, Desktop und Mobile Chrome)**
- Admin: «Zahlen» → «Schrauber» → Karten und Hinweis sichtbar; sortieren; Schrauber öffnen → Kacheln, Pro Farbe, Route aufklappen; zurück.
- `tests/e2e/gym-insights.spec.ts`: angepasst (Schrauber über Umschalter).

## 13. Nicht Teil dieser Spec

Export/Druck, Verlaufsdiagramme, Benachrichtigungen an Admins, Sprung ins Studio aus der Admin-Ansicht (Runde 3), Rolle «Chefschrauber» ohne Admin-Rechte, «Routen von …» für Kletterer, Englisch, mehrere Schrauber pro Route.

## 14. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-20 | – | Grill-me F1–F10 nach Empfehlung (→ v1) | – |
| 1 | 2026-10-20 | **hoch:** Sterne-Sortierung = verdeckte Rangliste, unfair für schwere Farben; **hoch:** Zufallswerte bei wenigen Bewertungen; **hoch:** Schrauber müssen wissen, was die Leitung sieht; mittel: Begriffe, Pro Farbe, Lob zuerst, Lesbarkeit | Sortierung nach Abstand zum farbgewichteten Hallenwert; Mindestzahlen (3 / 3 / 5) und «noch zu wenige Bewertungen»; Hinweis «Gesprächsanlass» + Transparenz in SPEC-044; «zu leicht · passt · zu hart» mit «n von m»; Pro Farbe mit Tendenz; Lieblingsroute; Farbname, große Knöpfe; «Unbekannt» erklärt (→ v2) | Export (Personalakte); Pokal/Bestenliste (Zweck); Englisch (Admin nicht übersetzt) |
| 2 | 2026-10-20 | **hoch:** Begehungen hängen von der Hängedauer ab; mittel: Transparenz-Satz zu vage, Schrauber ohne aktive Routen, Beta pro Route, «Flash-Quote» unverständlich, Sortierung zu eng | «Pro Woche» mit Hallenwert; konkreter Transparenz-Satz; nur Schrauber mit aktiven Routen bei «An der Wand»; Routen aufklappbar mit 5 Beta ohne Namen; «im 1. Versuch»; Sortierung 2 × 2; Farbverteilung nur im Detail (→ v3) | «Routen von …» für Kletterer (SPEC-044 §11) |
| 3 | 2026-10-20 | mittel: «+0,3» schwer lesbar und wertend; sonst niedrig | «3,9 ★ · Halle 3,6» ohne Vorzeichen/Ampel; leerer Zustand; Transparenz-Satz «kein Export» (→ v4) | Sprung ins Studio (Aufgabe der Schrauber über SPEC-044, überlädt) |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen nur Feinschliff → Status **READY**.

**Umsetzung 2026-10-20:** Vitest 663/663 grün (davon `spec050SetterReport` 11, `spec050SetterReportView` 5), Playwright `setter-report.spec.ts` + angepasstes `gym-insights.spec.ts` grün in Desktop und Mobile Chrome. Mobile Safari ungetestet (WebKit fehlt in der Testumgebung). Screenshots: Projektordner `schrauber-auswertung-admin/screens/`.
