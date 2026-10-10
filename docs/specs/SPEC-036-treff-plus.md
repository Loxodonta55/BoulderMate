# SPEC-036: Treff+ – wöchentlich wiederholen, «Anfänger willkommen», «mit Kind», Termine der Halle

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-028 (Treff «Wer ist da?»), SPEC-023 (Admin, Halle)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **J** (Felix, Nora, Julia, Dennis, Anna, Thomas, Max, Verena). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans). Die Leitlinie aus SPEC-028 §0 gilt weiter: kein Chat, keine Zahl am Tab, nichts drängt von der Wand weg.

---

## 1. Ausgangslage

| # | Befund |
|---|---|
| A1 | Jeder Eintrag gilt für einen Tag. Wer jede Woche kommt, muss jedes Mal neu eintragen. |
| A2 | Man sieht nicht, ob Anfänger oder Kinder willkommen sind. Anfänger trauen sich nicht. |
| A3 | Die Halle kann keine eigenen Termine (Technik-Abend, Anfänger-Runde) zeigen. |
| A4 | Ein leerer Treff wirkt schlechter als keiner (Max). |

---

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Wie funktioniert «jede Woche»?**
✔ *Entschieden (Empfehlung):* Beim Eintragen ein Schalter **«Jede Woche wiederholen»**. Der Eintrag bekommt `repeat_weekly = true`. Sobald ein solcher Termin begonnen hat, legt die App des Besitzers beim nächsten Öffnen von Treff den **Termin der Folgewoche** an (gleiche Zeit, gleiche Angaben). So gibt es pro Serie höchstens zwei offene Termine. Im eigenen Eintrag steht «Jede Woche» und ein Knopf **«Wiederholung beenden»** (entfernt die Wiederholung, der nächste Termin bleibt). Löschen eines Termins fragt nicht nach der Serie; die Serie läuft dann ab dem nächsten Termin nicht weiter.
*Warum:* Felix kommt Di und Do; das sind zwei Serien. Kein Hintergrunddienst nötig.

**F2 – Gilt die Grenze von 3 offenen Einträgen weiter?**
✔ *Entschieden (Empfehlung):* Grenze auf **5** erhöhen. Zwei Serien brauchen bis zu 4 offene Termine.

**F3 – Welche Markierungen?**
✔ *Entschieden (Empfehlung):* Zwei Häkchen beim Eintragen: **«Anfänger willkommen»** und **«Mit Kind»**. In der Liste als Chips mit Wort («🌱 Anfänger willkommen», «👧 Mit Kind»). Keine weiteren Tags.
*Warum:* Julia, Dennis, Anna. Mehr Tags machen das Formular länger.

**F4 – Wie trägt die Halle Termine ein?**
✔ *Entschieden (Empfehlung):* Admins der Halle (und Plattform-Admin) sehen beim Eintragen den zusätzlichen Schalter **«Als Termin der Halle»**. Solche Einträge zeigen statt Spitzname den **Hallennamen** und das Abzeichen **«Halle»**, stehen in der Liste oben im jeweiligen Abschnitt und zählen nicht zur Grenze der Person. Die Datenbank prüft, dass nur Admins der Halle sie anlegen.
*Warum:* Thomas («Technik-Abend Mittwoch 19 Uhr»), Dennis (Anfänger-Runde).

**F5 – Zeigt Treff eine anonyme Zahl «Heute 23 Leute»?**
✔ *Entschieden (Empfehlung):* **Nein.** Bei wenigen Leuten ist das nicht anonym (Georg, Ralf). Die Auslastung kommt getrennt in SPEC-041.

**F6 – Was sehen Gäste ohne Anmeldung (Landing)?**
✔ *Entschieden (Empfehlung):* Termine der Halle mit Titel (Hallenname + Notiz) und die Markierungen; persönliche Einträge weiter anonym wie in SPEC-028.

---

## 3. Datenmodell (Migration spielt Hans im SQL-Editor ein)

`supabase/migrations/20261009_spec036_treff_plus.sql`:
- `treff_entries`: neue Spalten `repeat_weekly BOOLEAN NOT NULL DEFAULT false`, `beginners_welcome BOOLEAN NOT NULL DEFAULT false`, `with_kids BOOLEAN NOT NULL DEFAULT false`, `is_gym_event BOOLEAN NOT NULL DEFAULT false`.
- Regel «treff_entries insert» erweitert: `is_gym_event` nur, wenn der Nutzer Admin der Halle (`gym_members.role = 'admin'`) oder Plattform-Admin ist.
- `UPDATE (repeat_weekly)` für eigene Einträge (Wiederholung beenden).
- Sicht `treff_entries_public` um die drei Markierungen, `is_gym_event` und – nur bei Hallen-Terminen – `note` erweitert.
- **Reihenfolge:** Code ausliefern, dann Migration. Der Code fällt ohne neue Spalten auf das alte Einfügen zurück.

## 4. Akzeptanzkriterien

- **AC-1** Formular hat «Jede Woche wiederholen», «Anfänger willkommen», «Mit Kind»; Admins zusätzlich «Als Termin der Halle».
- **AC-2** Hat ein wöchentlicher Termin begonnen, legt das Öffnen von Treff den Termin +7 Tage an (genau einmal).
- **AC-3** «Wiederholung beenden» verhindert weitere Folgetermine.
- **AC-4** Grenze offener Einträge pro Person: 5; Hallen-Termine zählen nicht.
- **AC-5** Markierungen erscheinen als Chips mit Wort; Hallen-Termine zeigen Hallenname + «Halle» und stehen oben.
- **AC-6** Ein Nicht-Admin kann keinen Hallen-Termin anlegen (Oberfläche und Datenbank).
- **AC-7** Kein Chat, keine Zahl am Tab (SPEC-028 bleibt).

## 5. Tests

- Unit: `tests/spec036TreffPlus.test.tsx` (Folgetermin genau einmal, Wiederholung beenden, Grenze 5, Chips, Hallen-Termin nur für Admins, Sortierung).
- Playwright: `tests/e2e/treff-plus.spec.ts` (wöchentlich eintragen, Chips sichtbar, Admin-Termin mit Abzeichen «Halle»).

## Umsetzung (2026-10-09)
- Umgesetzt. Migration `supabase/migrations/20261009_spec036_treff_plus.sql`. Grenze jetzt 5 offene persönliche Einträge (SPEC-028 angepasst); Hallen-Termine zählen nicht.
- Die Hallen-Admin-Prüfung steht in einer eigenen Funktion `treff_is_gym_admin`, damit SPEC-036 auch ohne SPEC-034 funktioniert.
- Testdateien: tests/spec036TreffPlus.test.tsx; tests/e2e/spec036-041-treff-auslastung.spec.ts; RLS in tests/db/weitere_rls.sql
