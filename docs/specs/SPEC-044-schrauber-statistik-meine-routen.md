# SPEC-044: Schrauber-Statistik «Meine Routen»

## Status: READY (v4, 2026-10-10)

> **Owner:** Hans · **Created:** 2026-10-10 · **Version:** v4 (nach 3 Loops «FeatureDefinition»)
> **Baut auf:** SPEC-003 (Bewertungen, Grad-Gefühl, Beta), SPEC-021 (Umschrauben), SPEC-027 («Ansehen als …»), SPEC-030 (Hallen-Auswertung, «Geschraubt von»), SPEC-032 (Lesbarkeit), SPEC-035 (Versuche)
> **Prozess:** [Loop «FeatureDefinition»](../prozesse/feature-definition.md). Grill-me am 2026-10-10, Hans: «geh immer mit der Empfehlung». Feedback-Runden: [`docs/feedback-runden/2026-10-10-schrauber-statistik/`](../feedback-runden/2026-10-10-schrauber-statistik/) (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

Schrauberinnen und Schrauber sehen, **wie ihre eigenen Routen bei den Kletterern ankommen**: wie oft sie geklettert werden, wie sie bewertet werden, ob der Grad passt und was die Leute dazu schreiben. Daraus sollen sie lernen und einzelne Routen gezielt nachbessern können (Grad, Name).

Es ist ein **Werkzeug für die eigene Arbeit**, keine Leistungskontrolle und keine Rangliste.

## 2. Ausgangslage (Code-Stand 2026-10-10, uncommitted SPEC-030 eingeschlossen)

| # | Befund | Wo |
|---|---|---|
| A1 | Begehungen (`ascents`, Typ flash/top/project, seit SPEC-035 mit `attempts`) und Bewertungen (`ratings`: `qualityStars`, `gradeFeel` soft/fair/stiff, `radar`) aller Kletterer liegen nach dem Abgleich vollständig im lokalen Speicher. | `syncService`, `ratingAndAscentService` |
| A2 | Jeder Boulder hat `setterId`; seit SPEC-030 F8 ist er im Studio über «Geschraubt von» änderbar. | `BoulderBottomSheet`, `batchBoulderService` |
| A3 | `computeBoulderStatsAggregate()` liefert pro Boulder Ø Sterne, Grad-Gefühl-Anteile und Beta-Kommentare. | `ratingAndAscentService` |
| A4 | SPEC-030 zeigt im Admin-Tab «Zahlen» pro Schrauber Routen, Top-Routen, Ø Sterne, Begehungen, Stiff/Soft – nur für Hallen- und Plattform-Admins. Schrauber selbst sehen nichts (SPEC-030 §7). | `gymInsights.ts`, `GymInsightsView.tsx` |
| A5 | Das Schrauber-Studio hat oben nur die Sektor-Reiter, keinen Bereich für Auswertungen. | `BatchBoulderWorkflow.tsx` |
| A6 | SPEC-035 F4: Versuche sind privat und erscheinen nur in «Ich», im Sheet und im CSV-Export. | SPEC-035 |

## 3. Abgrenzung zu SPEC-030 (Hallen-Auswertung)

| | SPEC-030 «Zahlen» (Admin) | SPEC-044 «Meine Routen» (Schrauber) |
|---|---|---|
| Wer | Hallen-Admin, Plattform-Admin | jede Person mit Zugang zum Schrauber-Studio |
| Was | ganze Halle: Farben, Sektoren, alle Schrauber im Vergleich | **nur die eigenen Routen**, jede einzeln |
| Vergleich | Schrauber untereinander (sortiert nach Top-Routen) | **nur mit dem Hallen-Durchschnitt in denselben Farben**, keine Rangliste |
| Tiefe | Summen | pro Route: Grad-Gefühl, Flash-Quote, Versuche, Merkmale, Beta-Kommentare |
| Handlung | Wand umschrauben planen | einzelne Route im Studio nachbessern |

Beide nutzen dieselben Rechenregeln (Top-Route = Ø ≥ 4,0 Sterne, Mindestzahl 3 Bewertungen). Gemeinsame Hilfsfunktionen kommen aus `gymInsights.ts`.

## 4. Grill-me: Fragen und Entscheidungen (alle nach Empfehlung)

**F1 – Wer sieht was?** ✔ Jeder Schrauber sieht **nur seine eigenen Routen** (`setterId` = eigenes Konto). Admins, die selbst schrauben, sehen ihre eigenen; fremde Schrauber-Ansichten gibt es nur über «Ansehen als …» (SPEC-027, Plattform-Admin).
**F2 – Wo?** ✔ Im Schrauber-Studio, als Umschalter ganz oben: **«Wände» · «Meine Routen»**.
**F3 – Vergleich mit Kollegen?** ✔ Nur mit dem **Hallen-Durchschnitt**, keine Rangliste. Die Rangliste bleibt im Admin-Tab «Zahlen».
**F4 – Zahlen pro Route?** ✔ Begehungen, Flash-Quote, Ø Sterne, Grad-Gefühl (soft/fair/stiff), Versuche bis zum Top.
**F5 – Beta-Kommentare zeigen?** ✔ Ja, **ohne Namen**.
**F6 – Zeitraum?** ✔ Umschalter **«An der Wand»** (Standard) / **«Alle»** wie in SPEC-030.
**F7 – Automatische Hinweise?** ✔ Ja, **höchstens 3** oben.
**F8 – Mindestzahl Bewertungen?** ✔ **3** für Sterne, Grad-Gefühl und Merkmale.
**F9 – Wochenrückblick als Benachrichtigung?** ✔ Nein, später.
**F10 – Verlaufsdiagramm?** ✔ Nein, später.

## 5. Aufbau «Meine Routen»

Reihenfolge von oben nach unten (Handy zuerst, eine Spalte):

1. **Umschalter Studio** `setter-mode-walls` «Wände» · `setter-mode-stats` «Meine Routen» (Segment-Knopf, je ≥ 48 px hoch).
2. **Zeitraum** `setter-stats-scope-active` «An der Wand» (Standard) · `setter-stats-scope-all` «Alle».
3. **Seit deinem letzten Blick** `setter-stats-since` (v3): eine Zeile «Seit Dienstag: **+14 Begehungen · 3 Bewertungen · 2 Beta**». Entfällt beim ersten Öffnen und wenn nichts Neues dazukam. Der Zeitpunkt «zuletzt angesehen» liegt pro Gerät und Halle im lokalen Speicher.
4. **Vier Kacheln** (Zahl ≥ 32 px, Beschriftung ≥ 16 px):
   - `setter-kpi-routes` **Routen**
   - `setter-kpi-ascents` **Begehungen** (Flash + Top, ohne Projekte)
   - `setter-kpi-stars` **Ø Sterne**, darunter «Halle, gleiche Farben: 3,6» (v3)
   - `setter-kpi-flash` **Flash-Quote**, darunter «Halle, gleiche Farben: 41 %»
   Jede Kachel hat einen Vorlese-Satz (`aria-label`), z. B. «Durchschnitt 3,9 Sterne, Halle mit gleichen Farben 3,6» (v3).
   Der Hallenwert ist der **Durchschnitt aller Hallen-Boulder in denselben Farben, gewichtet nach der Farbverteilung der eigenen Routen** (v2). Wer viel Schwarz schraubt, wird mit Schwarz verglichen, nicht mit Gelb.
5. **Hinweise** `setter-stats-hints`, höchstens 3 Karten (siehe §6). Tippen öffnet die Route. Karten ruhig und neutral; nur die positive Karte ist grün betont, keine roten Warnkarten (v3).
6. **Liste «Meine Routen»** `setter-stats-list` mit drei Sortier-Knöpfen (v3): **«Neueste»** (Standard) · **«Beliebteste»** · **«Wenig geklettert»**. Eine Zeile `setter-route-<boulderId>` pro Route:
   - Farbpunkt **mit Farbname als Text** (nie Farbe allein), Name oder «Ohne Name», Sektor
   - Begehungen
   - Ø Sterne – oder «noch 2 Bewertungen» (v2), solange unter 3
   - Grad-Gefühl als Wort mit Zahl, z. B. «hart · 7 von 10» (v4); unter 3 Bewertungen nichts
   - im Zeitraum «Alle»: abgeschraubte Routen mit Vermerk «abgeschraubt am 3.10.» und gedämpfter Zeile (Kontrast trotzdem ≥ 4,5 : 1) (v4)
7. **Transparenz-Zeile** `setter-stats-transparency` ganz unten (v3): «Was sieht die Hallenleitung? Im Tab ‹Zahlen›: deine Anzahl Routen, Top-Routen, Ø Sterne, Begehungen und Stiff/Soft. Hinweise und diese Liste sieht nur du.»

**Route öffnen** → Sheet `setter-route-sheet` (halbe Höhe, zum Vollbild ziehbar):
- Kopf: Farbpunkt + Farbname, Name, Sektor, «hängt seit 12 Tagen»
- Zahlen: Begehungen (Flash / Top / Projekt getrennt), Flash-Quote, Ø Sterne mit Anzahl Bewertungen
- **Grad-Gefühl**: drei Balken mit Wort und Zahl («leicht 1 · passt 2 · hart 7»), Vergleich «Farbe Blau in der Halle: meist ‹passt›»
- **Versuche bis zum Top**: **Median** «meist im 3. Versuch», nur wenn mindestens 3 Tops mit gezählten Versuchen vorliegen (v2); sonst entfällt die Zeile
- **Merkmale** (v3): die zwei am stärksten bewerteten Radar-Merkmale («Technik, Balance»), ab 3 Bewertungen
- **Beta-Kommentare** ohne Namen und ohne Profilbild, neueste zuerst, höchstens 20, Datum als «vor 3 Tagen»
- Knopf **«Im Studio öffnen»** `setter-route-open-studio` (v2, nur aktive Routen): springt zu «Wände», öffnet die Wand und das Boulder-Sheet dieser Route, um Grad oder Name anzupassen

**Leere Zustände** (v2):
- Noch keine eigenen Routen: «Du hast in dieser Halle noch keine Routen. Routen, bei denen du unter ‹Geschraubt von› stehst, erscheinen hier.»
- Routen, aber noch keine Bewertungen: Kacheln mit «–», ein Hinweis «Sobald Kletterer bewerten, siehst du hier, wie deine Routen ankommen. Ab 3 Bewertungen pro Route.»

## 6. Hinweise (höchstens 3)

Geprüft werden nur eigene Routen im gewählten Zeitraum. Formulierung **sachlich mit Zahlen**, ohne Wertung der Person (v4).

| Hinweis | Bedingung | Text (Beispiel) | Art |
|---|---|---|---|
| Lieblingsroute | Ø ≥ 4,0 bei ≥ 3 Bewertungen, beste eigene Route | «‹Pinke Platte› mögen die Leute: 4,6 ★ aus 9 Bewertungen» | positiv |
| Wirkt hart | ≥ 3 Bewertungen und ≥ 60 % «hart» | «‹Blauer Dachquergang›: 7 von 10 finden ihn hart für Blau» | prüfen |
| Wirkt leicht | ≥ 3 Bewertungen und ≥ 60 % «leicht» | «‹Gelbe Kante›: 5 von 6 finden sie leicht für Gelb» | prüfen |
| Fast alle flashen | ≥ 5 Begehungen und Flash-Quote ≥ 80 % | «‹Grüner Riss›: 9 von 10 Begehungen im ersten Versuch» | prüfen |
| Kaum geklettert | aktiv, hängt ≥ 7 Tage, Begehungen < ⅓ des Hallenschnitts derselben Farbe (v2) | «‹Schwarzer Leisten›: 2 Begehungen in 14 Tagen, Schwarz im Schnitt 8» | prüfen |

Auswahl: **höchstens 3**, davon **mindestens 1 positiver**, sofern es eine Lieblingsroute gibt (v2). Unter den «prüfen»-Hinweisen gilt die Reihenfolge der Tabelle, bei Gleichstand die Route mit den meisten Bewertungen.
**Ausblenden** (v4): Jede Karte hat «Erledigt» `setter-hint-dismiss`; der Hinweis zu dieser Route und dieser Art bleibt 14 Tage aus (lokaler Speicher), danach erscheint er wieder, falls die Bedingung noch gilt.

## 7. Datenschutz und Fairness

- **Keine Namen von Kletterern**, nirgends in «Meine Routen» (auch nicht bei Beta-Kommentaren).
- **Mindestzahl 3** für Sterne, Grad-Gefühl, Merkmale und Versuche, damit niemand an einer Einzelbewertung erkennbar ist.
- **Versuche** erscheinen nur als **Median über mindestens 3 Tops**. Folgeänderung bei der Umsetzung: SPEC-035 F4 wird ergänzt um «… und zusammengefasst (Median, ab 3 Tops, ohne Namen) in der Schrauber-Statistik SPEC-044»; ein Satz dazu in `public/datenschutz.html` (Abschnitt Versuche).
- **Kein Vergleich zwischen Schraubern** in dieser Ansicht. Die Transparenz-Zeile sagt, was die Hallenleitung sieht.
- Daten kommen ausschließlich aus dem lokalen Speicher (keine neue Abfrage, keine Migration).

## 8. Lesbarkeit (Hans, SPEC-032)

- Fließtext ≥ 16 px, Kachel-Zahlen ≥ 32 px, Tap-Flächen ≥ 48 px.
- Kontrast ≥ 4,5 : 1 in hell und dunkel, auch für gedämpfte (abgeschraubte) Zeilen.
- **Farbe nie allein**: Farbpunkte immer mit Farbname, Grad-Gefühl immer mit Wort und Zahl.
- Keine Töne und keine Vibration in «Meine Routen» (v4).
- Sprache Deutsch (das Studio ist noch nicht übersetzt; Englisch kommt mit dem Studio, siehe §11).

## 9. Umsetzung (Plan)

- `src/lib/setterStats.ts` – reine Funktionen:
  - `computeSetterStats(setterId, gymId, scope, now, lastViewedAt?)` → Kacheln mit Hallenvergleich (farbgewichtet), Liste, «seit letztem Blick».
  - `computeSetterHints(stats, now, dismissed)` → höchstens 3 Hinweise nach §6.
  - `computeRouteDetail(boulderId)` → Grad-Gefühl, Flash/Top/Projekt, Median Versuche (≥ 3), Top-2-Merkmale (≥ 3), Beta ohne Namen.
  - nutzt `computeBoulderStatsAggregate`, `TOP_RATED_MIN_STARS`, `INSIGHTS_TOP_MIN_RATINGS` aus SPEC-030/SPEC-003.
- `src/components/setter/SetterStatsView.tsx`, `src/components/setter/SetterRouteStatsSheet.tsx`.
- `src/components/BatchBoulderWorkflow.tsx`: Umschalter «Wände» · «Meine Routen»; Sprung «Im Studio öffnen».
- Lokaler Speicher: `bm_setter_stats_last_viewed_<gymId>`, `bm_setter_hints_dismissed_<gymId>`.
- Keine Migration, keine neue Supabase-Abfrage.

## 10. Akzeptanzkriterien

- **AC-1** Wer das Schrauber-Studio öffnen darf, sieht oben `setter-mode-walls` und `setter-mode-stats`; «Meine Routen» zeigt `setter-stats`. Kletterer sehen nichts davon.
- **AC-2** Es erscheinen nur Routen mit `setterId` = eigenes Konto in der aktuellen Halle; mit «Ansehen als …» die der angesehenen Person.
- **AC-3** Zeitraum `setter-stats-scope-active` (Standard, nur aktive) und `setter-stats-scope-all` (auch abgeschraubte, mit «abgeschraubt am …»).
- **AC-4** Kacheln `setter-kpi-routes`, `setter-kpi-ascents` (Flash + Top), `setter-kpi-stars`, `setter-kpi-flash`; Stern- und Flash-Kachel zeigen den farbgewichteten Hallenwert. Ohne Bewertungen «–».
- **AC-5** `setter-stats-since` zeigt die Zuwächse seit dem letzten Öffnen; beim ersten Öffnen oder ohne Neues fehlt die Zeile.
- **AC-6** `setter-stats-hints` zeigt höchstens 3 Hinweise nach §6, mindestens einen positiven, falls vorhanden; «Erledigt» blendet ihn 14 Tage aus.
- **AC-7** `setter-stats-list` mit Sortierung Neueste/Beliebteste/Wenig geklettert; unter 3 Bewertungen «noch n Bewertungen» statt Sternen und kein Grad-Gefühl.
- **AC-8** `setter-route-sheet` zeigt Flash/Top/Projekt, Ø Sterne, Grad-Gefühl mit Wort und Zahl, Median Versuche nur ab 3 Tops mit Versuchen, Top-2-Merkmale ab 3 Bewertungen und Beta ohne Namen.
- **AC-9** `setter-route-open-studio` öffnet die Route im Studio (nur aktive Routen).
- **AC-10** Nirgends in «Meine Routen» erscheinen Kletterer-Namen oder Profilbilder.
- **AC-11** Keine Rangliste und kein Vergleich mit einzelnen Kollegen; `setter-stats-transparency` ist sichtbar.
- **AC-12** Lesbarkeit nach §8 (Schriftgrößen, Tap-Flächen, Farbname neben jedem Farbpunkt).

## 11. Nicht Teil dieser Spec

- Rangliste unter Schraubern (bleibt Admin-Tab «Zahlen», SPEC-030).
- Benachrichtigungen / Wochenrückblick (F9), Verlaufsdiagramm (F10), Export.
- Mehrere Schrauber pro Route, Gast-Schrauber ohne Konto.
- Auf Beta-Kommentare antworten, Kommentare melden.
- Englische Oberfläche (kommt mit der Übersetzung des Studios, SPEC-039 deckt nur den Kletterer-Bereich).
- Zahlen für Kletterer über Schrauber («Routen von Mara»).
- Vermerk «Grad geändert am …» an Bewertungen nach einer Grad-Änderung (später; Bewertungen bleiben an der Route).
- Frei einstellbare Hinweis-Schwellen, Teilen-Knopf, Bewertungsfeld «gefährlich» (Sicherheit läuft über SPEC-026).

## 12. Tests (CONSTITUTION §13, bei Umsetzung)

**Unit (Vitest)**
- `tests/spec044SetterStats.test.ts`: nur eigene Routen, Zeitraum, farbgewichteter Hallenvergleich, Mindestzahl 3, Median Versuche (≥ 3 Tops), Top-2-Merkmale, Hinweis-Regeln und Auswahl (max. 3, ≥ 1 positiv), Ausblenden 14 Tage, «seit letztem Blick».
- `tests/spec044SetterStatsView.test.tsx`: Umschalter, Kacheln, Sortierung, Sheet ohne Namen, leere Zustände, «Im Studio öffnen».

**Playwright (`tests/e2e/setter-stats.spec.ts`, Desktop und Mobile Chrome)**
- Schrauber: «Meine Routen» öffnen → Kacheln, Hinweise, Liste; Route öffnen → Grad-Gefühl, Beta ohne Namen; «Im Studio öffnen» landet im Boulder-Sheet.
- Kletterer (über «Ansehen als») sieht den Umschalter nicht.

## 13. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-10 | – | Grill-me F1–F10, alles nach Empfehlung (→ v1) | – |
| 1 | 2026-10-10 | **hoch:** Vergleich mit Hallenschnitt ist unfair für Schrauber schwerer Farben; **hoch:** Versuche sind laut SPEC-035 privat; mittel: nur Kritik, kein Lob; Zahlen ohne Handlung; leere Anfangszeit; Farbe allein | Hallenvergleich farbgewichtet, «Kaum geklettert» pro Farbe; Versuche nur Median ab 3 Tops + Datenschutz-Folgeänderung; mind. 1 positiver Hinweis; «Im Studio öffnen»; «noch n Bewertungen» und leere Zustände; Farbname und Wort+Zahl statt Farbe allein (→ v2) | Rangliste «damit es Spaß macht» (F3, Druck auf Kollegen); Push bei neuem Kommentar (F9); Kletterer sehen Schrauber-Namen (nicht Ziel) |
| 2 | 2026-10-10 | **hoch:** Unklar, was der Chef sieht (Angst vor Kontrolle); mittel: lange Liste ohne Sortierung; «Was ist neu?» fehlt; Grad-Gefühl sagt nicht, *warum* | Transparenz-Zeile; Sortierung Neueste/Beliebteste/Wenig geklettert; «Seit deinem letzten Blick»; Top-2-Merkmale aus Radar; Vorlese-Sätze und Kontrast; ruhige Hinweis-Karten; «Halle, gleiche Farben» (→ v3) | Englisch jetzt (Studio noch nicht übersetzt); Antworten auf Beta (eigenes Feature, Moderation); mehrere Schrauber pro Route (Datenmodell) |
| 3 | 2026-10-10 | mittel: Hinweis-Texte klingen wertend; gleiche Hinweise nerven; abgeschraubte Routen schwer erkennbar; sonst niedrig | Texte sachlich mit Zahlen («7 von 10 finden ihn hart»); «Erledigt» blendet 14 Tage aus; «abgeschraubt am …» mit Kontrast ≥ 4,5 : 1; keine Töne/Vibration (→ v4) | Hinweis-Schwellen einstellbar (überlädt); Wochenvergleich-Pfeile (= Verlauf, F10) |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen in Loop 3 nur Feinschliff → Status **READY**.
