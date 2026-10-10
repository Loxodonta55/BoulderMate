# SPEC-038: Hallen-Challenge – mitmachen freiwillig, Rangliste nur unter Teilnehmern

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-023 (Admin, Tab «Halle»), SPEC-021 («Neu»-Boulder), SPEC-022 («Ich»), SPEC-033 (Sichtbarkeit)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **Q** (Leon dafür, Sophie dagegen, Kompromiss von Nora). Steht auch auf Hans' Liste «Ideen für später». Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Grundidee

Die Halle startet eine Challenge, z. B. «Oktober-Challenge: alle neuen Boulder». Wer will, tippt **«Mitmachen»**. Nur wer mitmacht, erscheint in der Rangliste und sieht sie. Wer nicht mitmacht, sieht höchstens eine Zeile in «Ich» und wird nie gedrängt.

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Wer legt eine Challenge an und wo?**
✔ *Entschieden (Empfehlung):* Admins der Halle im Admin-Tab **«Halle»**, Gruppe «Challenges»: «+ Challenge». Felder: Name (≤ 40 Zeichen), Start, Ende (höchstens 31 Tage), Regel.

**F2 – Welche Regeln?**
✔ *Entschieden (Empfehlung):* Zwei Regeln, mehr nicht:
1. **«Alle neuen Boulder»**: alle Boulder, die zwischen Start und Ende an die Wand kommen.
2. **«Ein Sektor»**: alle aktiven Boulder eines gewählten Sektors.
Gezählt wird jeder Top oder Flash zwischen Start und Ende.

**F3 – Wo sehen Kletterer die Challenge?**
✔ *Entschieden (Empfehlung):* In **«Ich»**, über «Meine Projekte», eine Karte, solange eine Challenge der aktuellen Halle läuft: Name, «noch 12 Tage», bei Teilnahme «4 von 12» mit Balken und Knopf «Rangliste». Ohne Teilnahme nur eine Zeile mit Knopf «Mitmachen». **Nicht** auf der Wand, kein Pop-up, keine Zahl am Tab.
*Warum:* Sophie: keine Pflicht-Rangliste; Leon: sichtbar genug.

**F4 – Wie sieht die Rangliste aus?**
✔ *Entschieden (Empfehlung):* Sheet mit Platz, Spitzname, «n von m». Gleichstand: wer früher die Zahl erreicht hat, steht vorne. Nur Teilnehmer, mit Namen (wer mitmacht, stimmt dem beim Tippen auf «Mitmachen» zu; der Knopf sagt «Mitmachen · dein Name erscheint in der Rangliste»). «Aussteigen» jederzeit.

**F5 – Konfetti oder Abzeichen?**
✔ *Entschieden (Empfehlung):* Nein. Wenn man alle geschafft hat, sagt die Karte «Alle geschafft 🎉». Mehr nicht.

## 3. Datenmodell (Migration spielt Hans ein)

`supabase/migrations/20261009_spec038_challenge.sql`: Tabellen `challenges` (id, gym_id, name, starts_at, ends_at, rule `'new'|'sector'`, sector_id, created_by, created_at) und `challenge_participants` (challenge_id, user_id, nickname, joined_at). Lesen: alle angemeldeten. Anlegen/Ändern/Löschen von `challenges`: Admin der Halle oder Plattform-Admin. `challenge_participants`: nur eigene Zeile anlegen/löschen. Fortschritt rechnet die App aus den (ohnehin lesbaren) Begehungen.

Ohne Supabase (Tests, Test-Personen) liegen Challenges lokal (`boulderapp_challenges_v1`).

## 4. Akzeptanzkriterien

- **AC-1** Admin legt Challenge mit Name, Zeitraum (≤ 31 Tage) und Regel an; Nicht-Admins sehen den Knopf nicht.
- **AC-2** Fortschritt zählt nur Tops/Flashes im Zeitraum an Bouldern der Regel.
- **AC-3** «Ich» zeigt die Karte nur während der Laufzeit und nur für die aktuelle Halle.
- **AC-4** Rangliste nur für Teilnehmer, sortiert nach Anzahl, dann früherem Erreichen.
- **AC-5** «Aussteigen» entfernt die Person aus der Rangliste.

## 5. Tests

- Unit: `tests/spec038Challenge.test.tsx`.
- Playwright: `tests/e2e/challenge.spec.ts` (Admin legt an, Kletterer macht mit, loggt, sieht 1 von n und Rangliste).

## Umsetzung (2026-10-09)
- Umgesetzt. Migration `supabase/migrations/20261009_spec038_challenge.sql`. Abweichung: `sector_id` ist TEXT (wie die Sektor-IDs der App).
- Testdateien: tests/spec038Challenge.test.tsx; tests/e2e/spec038-042-challenge-gruppen.spec.ts; RLS in tests/db/weitere_rls.sql
