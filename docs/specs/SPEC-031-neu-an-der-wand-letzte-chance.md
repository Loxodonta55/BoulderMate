# SPEC-031: «Neu an der Wand» und «Letzte Chance»

## Status: IMPLEMENTED (2026-10-09, uncommitted; Migration muss Hans einspielen)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-021 (Umschrauben, «Neu»-Badge 7 Tage), SPEC-022 (Kletterer-UX)
>
> Geplant nach der Grill-me-Methode. Hans hat am 2026-10-09 gesagt: «Gehe immer mit der Empfehlung und setze dann um.» Alle Fragen F1–F9 sind deshalb wie empfohlen entschieden.

---

## 1. Ziel

Kletterer sollen merken, wann es sich lohnt, wieder in die Halle zu kommen, und bevor eine Wand abgeschraubt wird, ihre offenen Projekte noch schaffen können. Das bringt Besuche und damit Nutzen für die Halle.

## 2. Ausgangslage (Code-Stand 2026-10-09)

| # | Befund | Wo |
|---|---|---|
| A1 | Es gibt schon das «Neu»-Badge für 7 Tage am Sektor und an Bouldern sowie den Filter «Neu» (SPEC-021 AC-10, SPEC-022). Es ist aber pro Sektor; über die ganze Halle sieht man nicht, was seit dem letzten Besuch dazukam. | `ClimberSectorView` |
| A2 | Ein Umbau ist erst sichtbar, wenn er läuft («Im Umbau»). Vorher erfährt niemand, dass eine Wand bald abgeschraubt wird. | `Sector.rebuildStartedAt` |
| A3 | Die App hat keine Push-Mitteilungen (kein Service Worker mit Push, kein Server dafür). | – |

## 3. Grill-me: Fragen und Entscheidungen

**F1 – Über welchen Weg erfährt der Kletterer davon?**
✔ *Entschieden (Empfehlung):* **Nur in der App**, beim Öffnen der Wand. Keine Push-Mitteilungen und keine E-Mails in dieser Spec.
*Warum:* Push braucht einen Server und Einwilligungen (A3). Ein Hinweis in der App ist sofort machbar und nervt nicht.

**F2 – Was zeigt «Neu seit deinem letzten Besuch»?**
✔ *Entschieden (Empfehlung):* Ein Hinweis-Streifen direkt unter dem Wandfoto (das Foto bleibt das erste Element, SPEC-022 F1): **«5 neue Boulder seit deinem letzten Besuch»** mit Knopf **«Zeigen»** und ✕. «Zeigen» öffnet die Sektor-Liste; dort steht bei jedem Sektor mit Neuem **«3 neu»**. Gezählt werden aktive Boulder dieser Halle, die nach dem letzten Besuch veröffentlicht wurden.

**F3 – Was ist «der letzte Besuch»?**
✔ *Entschieden (Empfehlung):* Pro Halle und Gerät wird gespeichert, wann man die Wand zuletzt geöffnet hat (`localStorage`). Ein neuer Besuch beginnt, wenn seit dem letzten Öffnen **mehr als 4 Stunden** vergangen sind. Beim allerersten Besuch einer Halle erscheint kein Hinweis.
*Warum:* Keine Migration, kein Speichern von Bewegungsdaten in Supabase. 4 Stunden trennen zwei Hallenbesuche sicher.

**F4 – Wie lange bleibt der Hinweis?**
✔ *Entschieden (Empfehlung):* Bis zum ✕ oder zu «Zeigen», höchstens für diesen Besuch. Beim nächsten Besuch zählt die App neu.

**F5 – Wer kündigt einen Umbau an, und wie?**
✔ *Entschieden (Empfehlung):* Im **Schrauber-Studio** neben «Wand neu schrauben» der Knopf **«Umbau ankündigen»**. Er öffnet ein kleines Fenster mit einem **Datum** («Wird abgeschraubt am») und den Knöpfen «Ankündigen» und «Ankündigung entfernen». Das Datum darf nicht in der Vergangenheit liegen.
*Warum:* Schrauber planen den Umbau. Feature-Isolation: Umschrauben gehört dem Schrauber-Bereich (SPEC-021).

**F6 – Was sieht der Kletterer bei einer angekündigten Wand?**
✔ *Entschieden (Empfehlung):*
- An der Sektor-Pill und in der Sektor-Liste das Badge **«bis Mo 13.10.»** in Warnfarbe.
- Unter der Sektor-Pill der Satz **«Wird am Mo 13.10. abgeschraubt»**, und wenn man dort offene Projekte hat: **«· 2 Projekte offen»**.
- Im Hinweis-Streifen (F2) zusätzlich, falls eine Wand der Halle in den nächsten 7 Tagen abgeschraubt wird und man dort Projekte hat: **«Letzte Chance: ‹Sektor› wird am Mo abgeschraubt»**.

**F7 – Was passiert beim Umbau selbst?**
✔ *Entschieden (Empfehlung):* «Wand fertig» (SPEC-021) löscht die Ankündigung. Startet der Umbau früher, bleibt die Ankündigung bis «Wand fertig» stehen; «Im Umbau» hat Vorrang in der Anzeige. Liegt das Datum in der Vergangenheit und es gab keinen Umbau, wird die Ankündigung nicht mehr angezeigt.

**F8 – Datenmodell?**
✔ *Entschieden (Empfehlung):* Neue Spalte `sectors.rebuild_planned_for DATE` (nur Datum, keine Uhrzeit). Migration `supabase/migrations/20261009_spec031_umbau_ankuendigen.sql`, spielt Hans im SQL-Editor ein. Fehlt die Spalte noch, arbeitet die App lokal weiter und synchronisiert ohne sie (wie SPEC-021).

**F9 – Zählt «Neu» auch eigene Boulder eines Schraubers?**
✔ *Entschieden (Empfehlung):* Ja, keine Ausnahme. Einfach und für alle gleich.

## 4. Datenmodell

```sql
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuild_planned_for DATE;
```

Typ `Sector` (`src/types/boulder.ts`): `rebuildPlannedFor?: string` (`YYYY-MM-DD`).

## 5. Umsetzung

- `src/lib/wallNews.ts`: Besuchs-Logik (`registerWallVisit`, 4 Stunden), `countNewSince`, `newCountsBySector`, `isRebuildAnnounced`, `formatPlannedDate` («Mo 13.10.»), `lastChanceSectors` (≤ 7 Tage, offene Projekte).
- `src/lib/batchBoulderService.ts`: `setPlannedRebuild(sectorId, date | null)`; `completeSectorRebuild` löscht die Ankündigung.
- `src/lib/syncService.ts`: `rebuild_planned_for` lesen und schreiben, mit Rückfall ohne Spalte.
- `src/components/WallNewsBanner.tsx`: Hinweis-Streifen.
- `src/components/ClimberSectorView.tsx`: Streifen, «n neu» in der Sektor-Liste, Ankündigungs-Badge und -Satz.
- `src/components/RebuildAnnounceDialog.tsx` + `BatchBoulderWorkflow.tsx`: «Umbau ankündigen».

## 6. Akzeptanzkriterien

- **AC-1** Erster Besuch einer Halle: kein Hinweis-Streifen.
- **AC-2** Nächster Besuch (> 4 h später) mit neuen Bouldern seit dem letzten Besuch: Streifen `wall-news-banner` mit «n neue Boulder seit deinem letzten Besuch». Ohne Neues kein Streifen (außer AC-7).
- **AC-3** «Zeigen» (`wall-news-show`) öffnet die Sektor-Liste; Sektoren mit Neuem tragen `sector-new-count-<id>` «n neu». ✕ (`wall-news-dismiss`) schließt den Streifen.
- **AC-4** Schrauber-Studio: `announce-rebuild-btn` öffnet `rebuild-announce-dialog` mit Datumsfeld `rebuild-announce-date`; «Ankündigen» (`rebuild-announce-save`) speichert, «Ankündigung entfernen» (`rebuild-announce-clear`) löscht. Datum in der Vergangenheit wird abgelehnt.
- **AC-5** Kletterer sieht bei angekündigter Wand das Badge `sector-planned-badge` «bis Mo 13.10.» an Pill und Liste und den Satz `climber-planned-notice` «Wird am Mo 13.10. abgeschraubt», mit «· n Projekte offen», wenn er dort Projekte hat.
- **AC-6** «Wand fertig» löscht die Ankündigung. Vergangene Daten werden nicht angezeigt.
- **AC-7** Steht in den nächsten 7 Tagen eine Wand mit eigenen offenen Projekten zum Abschrauben an, zeigt der Streifen `wall-news-last-chance` «Letzte Chance: ‹Sektor› wird am Mo abgeschraubt».
- **AC-8** Die Ankündigung wird als `rebuild_planned_for` nach Supabase synchronisiert; fehlt die Spalte, läuft die App ohne Fehler weiter.

## 7. Tests (CONSTITUTION §13)

**Unit (Vitest)**
- `tests/spec031WallNews.test.ts`: Besuchs-Logik (erster Besuch, < 4 h, > 4 h), Zählen neuer Boulder, Zählen pro Sektor, Datumsformat, Ankündigung aktiv/vergangen, Letzte-Chance-Regel, `setPlannedRebuild` (Vergangenheit abgelehnt, Löschen), `completeSectorRebuild` löscht.
- `tests/spec031WallNewsUi.test.tsx`: Streifen und Sektor-Liste, Badge und Satz an der Wand, Ankündigen-Fenster im Schrauber-Studio.

**Playwright (`tests/e2e/wall-news.spec.ts`, Desktop und Mobile Chrome)**
- Besuch vor 5 Stunden simuliert, neuer Boulder → Streifen → «Zeigen» → «1 neu» in der Liste.
- Schrauber kündigt Umbau an → Kletterer sieht Badge und Satz an der Wand.

## 8. Nicht Teil dieser Spec
- Push-Mitteilungen und E-Mails.
- «Lieblingshalle» als eigene Einstellung.
- Besuchs-Statistik in Supabase.
