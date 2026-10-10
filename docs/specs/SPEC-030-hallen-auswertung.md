# SPEC-030: Hallen-Auswertung für Betreiber

## Status: IMPLEMENTED (2026-10-09, uncommitted)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-002 (Boulder-Erfassung), SPEC-003 (Bewertungen & Logging), SPEC-021 (Umschrauben), SPEC-023 (Admin-UX)
>
> Geplant nach der Grill-me-Methode. Hans hat am 2026-10-09 gesagt: «Gehe immer mit der Empfehlung und setze dann um.» Dazu kam sein Wunsch, auszuwerten, welcher Schrauber wie viele Top-Routen hat (F7, F8).

---

## 1. Ziel

Hallenbetreiber und Schrauber-Chefs sollen auf einen Blick sehen, was an ihren Wänden passiert: Welche Boulder sind beliebt, welche werden kaum geklettert, wo fehlen Grade, wie alt ist eine Wand und welcher Schrauber baut die Routen, die am besten ankommen.

Das ist das stärkste Verkaufsargument gegenüber Hallen (Akquise München und Frauenfeld) und hebt BoulderMate von Tickboard ab.

## 2. Ausgangslage (Code-Stand 2026-10-09)

| # | Befund | Wo |
|---|---|---|
| A1 | Begehungen (`ascents`) und Bewertungen (`ratings`) aller Kletterer werden beim Abgleich vollständig in den lokalen Speicher geladen. Eine Auswertung braucht keine neue Abfrage. | `syncService.syncFromSupabase` |
| A2 | Jeder Boulder hat `setterId` (Spalte `boulders.setter_id`). Beim Erfassen wird der angemeldete Schrauber eingetragen. Es gibt keine Stelle, um ihn zu ändern. | `BatchBoulderWorkflow`, `createDraftBoulder` |
| A3 | Abgeschraubte Boulder bleiben als `archived` mit `archivedAt` erhalten (SPEC-021). | `batchBoulderService` |
| A4 | Die Admin-Konsole hat die Tabs Sektoren · Farben · Team · Halle. | `GymManagement.tsx` |

## 3. Grill-me: Fragen und Entscheidungen

**F1 – Wo steht die Auswertung?**
✔ *Entschieden (Empfehlung):* Admin-Konsole, neuer **fünfter Tab «Zahlen»**. Kurzer Name, damit fünf Tabs auf dem Handy nebeneinander passen.
*Warum:* Feature-Isolation (CONSTITUTION §3.3). Kletterer sehen davon nichts; die Kletterer-App wird nicht voller.

**F2 – Welcher Zeitraum?**
✔ *Entschieden (Empfehlung):* Zwei Knöpfe oben: **«An der Wand»** (nur aktive Boulder, Standard) und **«Alle»** (auch abgeschraubte). Begehungen und Bewertungen gehören jeweils zu den gezeigten Bouldern.
*Warum:* «Was hängt jetzt?» ist die tägliche Frage; «Alle» zeigt den langen Trend, z. B. für die Schrauber-Auswertung.

**F3 – Welche Kennzahlen oben?**
✔ *Entschieden (Empfehlung):* Vier große Zahlen-Kacheln: **Boulder**, **Begehungen** (Flash + Top), **Kletterer** (verschiedene Personen mit mindestens einer Begehung in den letzten 30 Tagen) und **Ø Sterne**.

**F4 – Wie sieht man Lücken bei den Graden?**
✔ *Entschieden (Empfehlung):* Abschnitt **«Farben»**: pro Hallenfarbe eine Zeile mit Farbpunkt, Anzahl Boulder (als Balken), Begehungen, Ø Sterne und dem häufigsten Grad-Gefühl (Soft/Fair/Stiff). Eine Farbe ohne Boulder steht mit «0» da und fällt so auf.

**F5 – Beliebt und unbeliebt?**
✔ *Entschieden (Empfehlung):* Zwei kurze Listen mit je höchstens 5 Bouldern:
- **«Beliebteste»**: höchste Ø Sterne, mindestens 3 Bewertungen.
- **«Kaum geklettert»**: aktive Boulder, die mindestens 7 Tage hängen, mit den wenigsten Begehungen. Kandidaten fürs Umschrauben.
Jede Zeile: Farbpunkt, Name oder Farbe, Sektor, Zahl.

**F6 – Pro Sektor?**
✔ *Entschieden (Empfehlung):* Abschnitt **«Sektoren»**: pro Sektor Boulder, Begehungen, Ø Sterne und **Alter der Wand** («seit 42 Tagen»). Alter = Tage seit `rebuiltAt`; ohne Umbau seit dem ältesten aktiven Boulder.
*Warum:* Zeigt, welche Wand als nächste umgeschraubt werden sollte.

**F7 – Pro Schrauber (Wunsch Hans)?**
✔ *Entschieden (Hans + Empfehlung):* Abschnitt **«Schrauber»**: pro Person Anzahl Routen, Ø Sterne, Anzahl **Top-Routen** (Ø ≥ 4 Sterne, wie der Filter «★ Top» in SPEC-022), Begehungen und das Grad-Gefühl als Anteil «Stiff» und «Soft». Sortiert nach Anzahl Top-Routen. Unbekannte Schrauber (alte Daten ohne Konto) stehen als «Unbekannt».

**F8 – Wer ist «der Schrauber» eines Boulders?**
✔ *Entschieden (Hans):* Zunächst die Person, die den Boulder **erfasst** (heute schon so, A2). Die Angabe kann überschrieben werden.
✔ *Entschieden (Empfehlung) – wo und wie:* Im Schrauber-Studio steht im Boulder-Sheet unter der Farbe eine Zeile **«Geschraubt von»** mit einer Auswahl aus dem Hallen-Team (Schrauber und Admins). Die letzte Wahl gilt für die nächsten neuen Boulder in derselben Halle weiter (wie die zuletzt gewählte Farbe). So kann eine Person nach dem Schraubtag alle Routen eines Kollegen schnell eintragen.
*Folge:* «Veröffentlichen» im Schrauber-Studio schaltet alle Entwürfe der Wand live, auch die für einen Kollegen eingetragenen (vorher nur die eigenen; der Playwright-Test hat das aufgedeckt).
*Warum nur Team-Mitglieder:* `boulders.setter_id` verweist auf ein echtes Konto. Schrauber ohne Konto werden über «Team» (SPEC-023) eingeladen.

**F9 – Wer sieht die Schrauber-Zahlen?**
✔ *Entschieden (Empfehlung):* Nur Hallen-Admin und Plattform-Admin (also wer die Admin-Konsole öffnen kann). Kletterer und Schrauber sehen sie nicht.

**F10 – Datenschutz für Kletterer?**
✔ *Entschieden (Empfehlung):* Die Auswertung zeigt **nur Summen**, keine Namen von Kletterern.

**F11 – Export als Tabelle (CSV/Excel)?**
✔ *Entschieden (Empfehlung):* Nicht in dieser Spec. Kommt, wenn eine Halle danach fragt.

## 4. Umsetzung

- `src/lib/gymInsights.ts`: reine Funktionen `computeGymInsights(gymId, scope, now)` mit Kennzahlen, Farben, Beliebteste, Kaum geklettert, Sektoren, Schrauber. Liest Boulder, Sektoren, Farben, Begehungen, Bewertungen, Team und Profile aus dem lokalen Speicher. `setterDisplayName()` löst Namen über Profil und Demo-Konten auf.
- `src/components/admin/GymInsightsView.tsx`: Tab-Inhalt mit Zeitraum-Knöpfen, Kacheln und Abschnitten.
- `src/components/GymManagement.tsx`: Tab `insights` «Zahlen».
- `src/lib/batchBoulderService.ts`: `getLastSelectedSetterId` / `setLastSelectedSetterId` (pro Halle), `updateBoulderDetails` übernimmt `setterId`.
- `src/components/BoulderBottomSheet.tsx`: optionale Props `setterOptions` und `defaultSetterId`; Zeile «Geschraubt von» (`setter-select`), `onSave` liefert `setterId` mit.
- `src/components/BatchBoulderWorkflow.tsx`: neue Boulder bekommen den zuletzt gewählten Schrauber (sonst den Erfasser); Team-Liste für die Auswahl; «Veröffentlichen» schaltet alle Entwürfe der Wand live.
- Keine Migration nötig (`setter_id` gibt es schon und wird schon synchronisiert).

## 5. Akzeptanzkriterien

- **AC-1** Admin-Konsole hat den Tab `admin-tab-insights` «Zahlen»; er zeigt `gym-insights`.
- **AC-2** Zeitraum-Knöpfe `insights-scope-active` («An der Wand», Standard) und `insights-scope-all` («Alle»); «Alle» zählt abgeschraubte Boulder mit.
- **AC-3** Kacheln `insights-kpi-boulders`, `insights-kpi-ascents` (Flash + Top, keine Projekte), `insights-kpi-climbers` (verschiedene Personen, letzte 30 Tage), `insights-kpi-stars` (Ø Sterne aller Bewertungen, «–» ohne Bewertung).
- **AC-4** Abschnitt `insights-grades`: eine Zeile `insights-grade-<scaleId>` pro Hallenfarbe in Hallen-Reihenfolge, auch mit 0 Bouldern.
- **AC-5** `insights-top`: höchstens 5 Boulder mit ≥ 3 Bewertungen, absteigend nach Ø Sterne. `insights-unloved`: höchstens 5 aktive Boulder, die ≥ 7 Tage hängen, aufsteigend nach Begehungen.
- **AC-6** `insights-sectors`: Zeile `insights-sector-<sectorId>` mit Boulder, Begehungen, Ø Sterne und «seit n Tagen».
- **AC-7** `insights-setters`: Zeile `insights-setter-<setterId>` mit Routen, Top-Routen (Ø ≥ 4,0), Ø Sterne, Begehungen, Anteil Stiff/Soft; sortiert nach Top-Routen, dann Routen.
- **AC-8** Schrauber-Studio: Das Boulder-Sheet zeigt `setter-select` mit dem Hallen-Team; vorausgewählt ist der gespeicherte Schrauber, bei neuen Bouldern die letzte Wahl in dieser Halle, sonst der Erfasser. Speichern schreibt `setterId` (und damit `setter_id` nach Supabase).
- **AC-9** Keine Kletterer-Namen in der Auswertung.

## 6. Tests (CONSTITUTION §13)

**Unit (Vitest)**
- `tests/spec030GymInsights.test.ts`: Kennzahlen, Zeitraum, Farben mit 0, Beliebteste (Mindestanzahl Bewertungen), Kaum geklettert (7-Tage-Regel), Wand-Alter, Schrauber-Zahlen und Sortierung, unbekannter Schrauber, letzte Schrauber-Wahl pro Halle.
- `tests/spec030GymInsightsView.test.tsx`: Tab-Inhalt mit Kacheln und Abschnitten, Zeitraum umschalten, Boulder-Sheet mit «Geschraubt von» und `setterId` beim Speichern.

**Playwright (`tests/e2e/gym-insights.spec.ts`, Desktop und Mobile Chrome)**
- Admin: Tab «Zahlen» → Kacheln, Farben, Sektoren, Schrauber sichtbar; «Alle» umschalten.
- Schrauber-Studio: neuen Boulder setzen → «Geschraubt von» umstellen → speichern → Tab «Zahlen» zeigt den Boulder beim gewählten Schrauber.

## 7. Nicht Teil dieser Spec
- Export als CSV/Excel.
- Zeitverläufe (Diagramme über Wochen).
- Zahlen für Schrauber selbst («meine Routen»).
- QR-Scan-Zählung (siehe SPEC-029 F9).
