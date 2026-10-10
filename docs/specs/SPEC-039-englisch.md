# SPEC-039: Englisch als zweite Sprache (Kletterer-Bereich)

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-020 (Texte «Kreide»), SPEC-022, SPEC-028, SPEC-032–038
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **O** (Thomas, Hannah, Elif). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Ausgangslage

Die App ist nur Deutsch; es gibt keine Übersetzungs-Bibliothek (geprüft 2026-10-09). Texte stehen direkt in den Komponenten.

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Welche Teile zuerst?**
✔ *Entschieden (Empfehlung):* **Runde 1: was Kletterer sehen**: Startseite (Landing), Header und untere Leiste, Wand (Filter, Sektor-Pill, Liste, leere Zustände), Boulder-Sheet, Bewerten, «Ich», Einstellungen, Toasts beim Loggen. **Später:** Treff, Deep Dive, Schrauber-Studio und Admin (Personal spricht Deutsch).
*Warum:* Größter Nutzen bei kleinstem Risiko; parallele Arbeiten an Treff/Admin bleiben ungestört.

**F2 – Wie wird übersetzt?**
✔ *Entschieden (Empfehlung):* Kleines eigenes Modul `src/lib/i18n.ts` ohne neue Abhängigkeit: Wörterbücher `de` und `en`, Funktion `t('wall.filter.open')` mit Platzhaltern (`{n}`), Hook `useLang()`. Deutsch ist die Quelle; fehlt ein englischer Text, erscheint der deutsche.

**F3 – Wie wählt man die Sprache?**
✔ *Entschieden (Empfehlung):* Standard folgt dem Handy (`navigator.language`: beginnt mit «de» → Deutsch, sonst Englisch). In Ich → Einstellungen → «Sprache / Language»: Deutsch · English. Merker im Gerät.

**F4 – Was bleibt Deutsch?**
✔ *Entschieden (Empfehlung):* Namen von Hallen, Sektoren, Bouldern und Farben (kommen von der Halle), Font-Grade, Beta-Kommentare. «Flash», «Top», «Projekt» → «Flash», «Top», «Project». «Soft/Fair/Stiff» bleibt (Kletter-Englisch).

**F5 – Französisch (Thomas, Romandie)?**
✔ *Entschieden (Empfehlung):* Nicht jetzt. Das Modul ist so gebaut, dass `fr` später nur ein weiteres Wörterbuch ist.

## 3. Akzeptanzkriterien

- **AC-1** Mit Sprache Englisch zeigen Landing, Header/Leiste, Wand, Boulder-Sheet, Bewerten, «Ich» und Einstellungen englische Texte.
- **AC-2** Ohne Einstellung folgt die Sprache dem Gerät.
- **AC-3** Umschalten wirkt sofort, ohne Neuladen, und bleibt nach Neuladen.
- **AC-4** Fehlende Übersetzungen fallen auf Deutsch zurück (kein leerer Text, kein Schlüssel sichtbar).
- **AC-5** Alle bestehenden Tests laufen weiter auf Deutsch (Tests setzen `de`).

## 4. Tests

- Unit: `tests/spec039Englisch.test.tsx` (t() mit Platzhalter, Rückfall, Gerätesprache, Umschalten, alle `en`-Schlüssel existieren in `de`).
- Playwright: `tests/e2e/englisch.spec.ts` (Einstellung English → Wand-Filter «All · Open · New», Sheet «Flash · Top · Project»).

## Umsetzung (2026-10-09)
- `src/lib/i18n.ts` mit `t()`; Wörterbücher `src/lib/i18n/en-base.ts`, `en-wall.ts`, `en-sheet.ts`, `en-me.ts` (rund 290 Texte).
- Übersetzt: Startseite, Kopf und untere Leiste, Wand, Boulder-Sheet, Bewerten, «Ich» mit Einstellungen, Gruppen, Challenge, Import, Auslastung.
- Noch Deutsch: Schrauber- und Admin-Bereich, Treff, CSV-Spalten (Daten).
- Wortwahl: Flash, Top, Project; «Trainer» → Coach; «Im Umbau» → Being reset; «Wer war schon oben» → Who topped it.
- Tests: `tests/spec039Englisch.test.tsx` (prüft u. a., dass jeder englische Text einen deutschen Schlüssel im Code hat und dieselben Platzhalter).
- Testdateien: tests/spec039Englisch.test.tsx; tests/e2e/spec039-040-043-sprache-apple-import.spec.ts
