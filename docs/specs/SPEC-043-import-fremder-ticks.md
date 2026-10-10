# SPEC-043: Import alter Ticks (z. B. aus Tickboard)

## Status: IN PROGRESS – Runde 1 umgesetzt, Tickboard offen (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-004 («Ich»), SPEC-033 (CSV-Export), SPEC-037 (Verlauf, Pro Halle)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **N** (Max, Verena: «Ohne Import bleibe ich zweigleisig»). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Ausgangslage

- Ob und in welchem Format Tickboard einen Export anbietet, ist **nicht geprüft** (in der Runde unsicher). Ohne Beispieldatei lässt sich kein verlässlicher Import bauen.
- Fremde Ticks gehören zu Bouldern, die es in BoulderMate nicht gibt. Sie können also nicht an der Wand erscheinen.

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Wo erscheinen importierte Ticks?**
✔ *Entschieden (Empfehlung):* Nur in der Statistik: Grad-Pyramide, Verlauf 8 Wochen und «Pro Halle» bei **«Alle Hallen»**, mit Halle-Namen aus der Datei und dem Zusatz «importiert». Nicht an der Wand, nicht bei «Wer war schon oben», nicht in Challenges.

**F2 – Welche Formate?**
✔ *Entschieden (Empfehlung):* (1) Die **eigene CSV aus SPEC-033** (Rückweg, z. B. für Hallen ohne BoulderMate). (2) **Tickboard**, sobald Hans eine Beispieldatei aus einem echten Konto in den Projektordner legt (Datum, Halle, Grad, Stil genügen). (3) Allgemeine CSV mit Spalten-Zuordnung erst, wenn (2) nicht reicht.

**F3 – Doppelte Einträge?**
✔ *Entschieden (Empfehlung):* Ein Tick gilt als doppelt, wenn Datum (Tag), Halle, Grad und Stil gleich sind; Doppelte werden übersprungen und gezählt («12 übersprungen»).

**F4 – Löschen?**
✔ *Entschieden (Empfehlung):* «Importierte Ticks löschen» in Einstellungen → Daten, mit Rückfrage. Gespeichert vorerst nur im Gerät; Sync nach Supabase erst, wenn der Import angenommen wird.

## 3. Was fehlt, damit es weitergeht

- **Eine Exportdatei aus Tickboard** (oder der Hinweis, dass es keinen Export gibt). Bitte in `/mnt/project-files/import/` ablegen.

## 4. Akzeptanzkriterien (für die Umsetzung)

- **AC-1** Import der eigenen CSV legt Ticks an, die nur in der Statistik «Alle Hallen» mit «importiert» erscheinen.
- **AC-2** Doppelte werden übersprungen und gemeldet.
- **AC-3** «Importierte Ticks löschen» entfernt alle importierten Ticks.

## 5. Tests (bei Umsetzung)

- Unit: `tests/spec043Import.test.ts`; Playwright: `tests/e2e/import.spec.ts`.

## Umsetzung (2026-10-09) – Runde 1
- Import der eigenen BoulderMate-CSV (SPEC-033) umgesetzt, nur im Gerät gespeichert. Projekte werden nicht übernommen.
- Tickboard-Import offen, bis eine echte Beispieldatei vorliegt.
- Testdateien: tests/spec043Import.test.tsx; tests/e2e/spec039-040-043-sprache-apple-import.spec.ts
