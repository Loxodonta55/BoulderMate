# SPEC-035: Meine Projekte und Versuche

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-022 (Filter «Offen», Boulder-Sheet), SPEC-004 («Ich»), SPEC-003 (Begehungen)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **F** (Lena, Tobias, Claudia, Leon; Sabine braucht es nicht). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Ausgangslage

| # | Befund | Wo |
|---|---|---|
| A1 | Der Filter «Projekte» entfiel mit SPEC-022 F4; Projekte zählen als «Offen». Wer drei Projekte in drei Sektoren hat, muss sie suchen. | `climberWallFilters.ts` |
| A2 | Versuche werden nicht gezählt. Supabase hat die Spalte `ascents.attempts` schon (immer 1). | `syncService.syncAscentToSupabase` |

---

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Wo stehen «Meine Projekte»?**
✔ *Entschieden (Empfehlung):* In **«Ich»**, als eigener Abschnitt direkt unter den drei Zahlen: «Meine Projekte (3)». Eine Zeile pro Projekt: Nummer + Farbpunkt, Name, Sektor, Halle (nur bei «Alle Hallen»), «5 Versuche». Tippen öffnet das Boulder-Sheet. Nur Boulder, die noch an der Wand hängen. Ohne Projekte entfällt der Abschnitt.
*Warum:* Die Wand bleibt wie sie ist (Sabine), Lena findet alles an einem Ort. Der Halle/Alle-Umschalter gilt auch hier.

**F2 – Wie zählt man Versuche, ohne Formular?**
✔ *Entschieden (Empfehlung):* Im halben Boulder-Sheet unter den drei Log-Knöpfen eine schmale Zeile: «Versuche: **4**  [ +1 ]». Ein Tap auf «+1» zählt hoch, kurzes Vibrieren, Toast «5. Versuch» mit «Rückgängig». Ist der Boulder noch nicht geloggt, macht der erste «+1» ihn zum **Projekt** (mit 1 Versuch). Das Sheet bleibt offen (man will vielleicht gleich nochmal).
*Warum:* Claudia: «Ein Plus-Knopf reicht». Tobias: freiwillig.

**F3 – Was passiert beim Top?**
✔ *Entschieden (Empfehlung):* Top übernimmt die gezählten Versuche plus den erfolgreichen (Projekt mit 4 Versuchen → Top im 5.). Der Toast sagt «Top im 5. Versuch». Flash setzt immer 1. Ohne gezählte Versuche bleibt alles wie bisher («Top geloggt», Versuche leer).

**F4 – Sieht man Versuche anderer?**
✔ *Entschieden (Empfehlung):* Nein. Versuche sind privat und erscheinen nur in «Ich», im Sheet und im CSV-Export.

**F5 – Sync?**
✔ *Entschieden (Empfehlung):* `Ascent.attempts?: number`, geschrieben in `ascents.attempts`; beim Abgleich gelesen. Keine Migration nötig.

---

## 3. Akzeptanzkriterien

- **AC-1** «Ich» zeigt «Meine Projekte (n)» mit allen eigenen Projekten an aktiven Bouldern; Halle/Alle-Umschalter wirkt.
- **AC-2** Tippen auf ein Projekt öffnet das Boulder-Sheet.
- **AC-3** «+1» erhöht die Versuche, bei nicht geloggtem Boulder wird er Projekt; Toast mit «Rückgängig» stellt den alten Stand her.
- **AC-4** Top nach n gezählten Versuchen speichert n+1 und zeigt «Top im (n+1). Versuch»; Flash speichert 1.
- **AC-5** `attempts` wird nach Supabase geschrieben und beim Abgleich gelesen.
- **AC-6** Die Wand und ihre Filter bleiben unverändert.

## 4. Tests

- Unit: `tests/spec035Projekte.test.tsx` (Service `addAttempt`, Top/Flash-Versuche, Projekte-Abschnitt, Rückgängig).
- Playwright: `tests/e2e/projekte-versuche.spec.ts` (+1 zweimal, Top → Toast, Projekt erscheint in «Ich»).

## 5. Nicht Teil dieser Spec

- Sessions («Session starten», Leon) – Sitzungen ergeben sich aus dem Datum.
- «Letzte Chance» für Projekte vor dem Umschrauben: läuft in SPEC-031 (Thread «Ideen für neue Features»).

## Umsetzung (2026-10-09)
- Umgesetzt wie entschieden.
- Testdateien: tests/spec035Projekte.test.tsx; tests/e2e/spec033-035-037-ich.spec.ts
