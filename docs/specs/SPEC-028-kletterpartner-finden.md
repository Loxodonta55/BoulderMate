# SPEC-028: Treff – «Wer ist da?»

## Status: IN PROGRESS (umgesetzt 2026-10-09, nicht committet; Migration noch nicht eingespielt)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-022 (Kletterer-UX, Bottom-Nav Wand/Ich), SPEC-024 (Google-Login), SPEC-025 (Halle suchen), SPEC-026 (Nutzer-Feedback), SPEC-020 (Design «Kreide»)
>
> Anstoß: die «Mitkletterzentrale» von Tickboard (Boulder und Leute finden).
> Geplant nach der Grill-me-Methode. Hans hat am 2026-10-09 entschieden: **alle Fragen wie empfohlen.**
> **Präzisierung von Hans (2026-10-09, 20:49):** «Es ist nicht wirklich eine Partnersuche, sondern mehr ein Bescheid geben, wer da ist. Wer Lust auf einen Austausch hat, kann sich eintragen.» Deshalb wurde der erste Entwurf (Gesuch → Anfrage → Annehmen → Chat) ersetzt durch **Eintragen, wer da ist**. Es gibt **keine** Anfragen und **keinen** Chat; man trifft sich in der Halle.

---

## 0. Leitlinie

Treff ist ein **zusätzlicher** Zweck. Er darf den Kernzweck (Boulder finden, bewerten, Erfolge tracken) nicht übersteuern:

- Die App startet weiterhin auf der **Wand**. Treff erscheint nie ungefragt über der Wand (kein Pop-up, kein Banner, keine Zahl, die zum Antippen drängt).
- Treff ist ein **eigener, klar getrennter Ort** mit eigener Seite. Wand und «Ich» bleiben wie in SPEC-022.
- Gleiche Ordnung wie der Rest: eine Liste, ein Sheet pro Eintrag, wenig Text, große Knöpfe.
- Groß und kontrastreich: Fließtext mind. 17 px, Uhrzeiten 20 px fett, Knöpfe mind. 52 px hoch, Kontrast WCAG AA, Symbole immer mit Wort.

---

## 1. Ausgangslage (Code-Stand 2026-10-09)

| # | Befund | Wo |
|---|---|---|
| A1 | Kletterer-Bereich hat zwei Tabs: `Wand` und `Ich`. Desktop zeigt sie zusätzlich oben im Header. | `MobileBottomNav`, `AppHeader`, SPEC-022 F11/F12 |
| A2 | Es gibt keine Funktion, die zeigt, wer gerade in der Halle ist. Sichtbar sind nur Spitzname/Avatar in «Wer war schon oben». | `BoulderSheet` |
| A3 | **Datenschutz-Lücke:** `user_profiles` ist für alle lesbar (`Public read profiles … USING (true)`) und enthält die Spalte `email`. Laut `schema.sql` kann jeder mit dem öffentlichen Schlüssel alle E-Mail-Adressen abfragen (in Prod nicht geprüft). | `supabase/schema.sql` Z. 9–16, 197–198 |
| A4 | Die Schreibrechte vieler Tabellen sind offen (`FOR ALL USING (true)`). Neue Treff-Tabellen dürfen dieses Muster **nicht** übernehmen. | `supabase/schema.sql` Z. 216–226 |
| A5 | Nicht angemeldete Besucher sehen nur die Landing Page (`App.tsx`), nicht die Kletterer-App. | `App.tsx`, `LandingPage` |
| A6 | `syncService` und `authService` lesen `user_profiles` mit `select('*')`. Sobald `email` nicht mehr lesbar ist, schlägt das fehl (u. a. ginge `is_platform_admin` verloren). | `syncService.ts` Z. 103, `authService.ts` Z. 152 |

---

## 2. Grundidee

Ein Kletterer trägt sich ein: «Ich bin **heute 18–21 Uhr** im 6a plus, klettere um 6A–6B, Lust auf Austausch. Bin meist am gelben Überhang.» Andere sehen in der Liste ihrer Halle **wer jetzt da ist** und **wer heute oder an den nächsten Tagen kommt**. Wer mag, tippt **«Ich komme auch»** und steht dann mit derselben Zeit in der Liste. Man spricht sich in der Halle an. Nach dem Termin verschwindet der Eintrag.

Es gibt **keine** Nachrichten, keine Anfragen und keinen Austausch von E-Mail, Telefonnummer oder Standort. Treffpunkt ist immer die Halle.

---

## 3. Grill-me: Entscheidungen

### Platz in der App

**F1 – Wo findet man Treff?**
✔ *Entschieden:* Ein **dritter Tab ganz rechts**: `Wand · Ich · Treff` (Symbol: zwei Personen, Wort «Treff»). Die App startet weiter auf `Wand`. Auf dem Desktop kommt «Treff» als dritter Tab in den Header. Am Tab steht **keine** Zahl (Leitlinie: nichts drängt weg von der Wand).
*Warum:* Klar getrennt, sofort auffindbar; Wand bleibt Start und Mittelpunkt.

**F2 – Was zeigt die Liste?**
✔ *Entschieden:* Einträge der **gewählten Halle** (Header). Zwei Abschnitte: **«Jetzt da»** (Zeitfenster läuft gerade) und **«Kommt noch»** (später heute und die nächsten Tage, nach Zeit sortiert). Darüber ein großer Schalter `Diese Halle | Alle Hallen`; «Alle Hallen» zeigt den Hallennamen in jeder Zeile.

**F3 – Wie hängt das mit «Boulder finden» zusammen?**
✔ *Entschieden:* Ein Eintrag kann optional **einen Boulder** nennen («Ich bin an Gelb 6B, Sektor Höhle»). Man wählt ihn beim Eintragen aus der Liste der aktiven Boulder der Halle. Im Eintrag ist der Boulder antippbar und öffnet das Boulder-Sheet. Auf der Wand gibt es dafür **keinen** neuen Knopf.

### Was ein Eintrag enthält

**F4 – Welche Angaben hat ein Eintrag?**
✔ *Entschieden:* Pflicht: **Halle**, **Tag**, **Zeit** (von–bis). Optional: **Niveau** (eigener Bereich, Fontainebleau-Grade wie bei «Ich», z. B. 6A–6B), **Boulder** (F3), **ein Satz** bis 120 Zeichen («Bin meist am Überhang, tausche gern Beta»).
Zusätzlich ein Schnellknopf **«Ich bin jetzt da»**: heute, ab jetzt für 2 Stunden, ohne weitere Angaben.
*Nicht:* Alter, Geschlecht, Fotos, Telefonnummer.

**F5 – Wie viele Einträge, wie weit im Voraus?**
✔ *Entschieden:* Höchstens **3 offene Einträge** pro Person, höchstens 14 Tage im Voraus. Ein Eintrag verschwindet nach Ende des Zeitfensters aus der Liste. Man kann ihn jederzeit löschen («Doch nicht»).

### Kontakt

**F6 – Wie kommen Leute in Kontakt?**
✔ *Entschieden (geändert nach Hans' Präzisierung):* **In der Halle, nicht in der App.** Im Eintrag gibt es nur **«Ich komme auch»**: Das legt einen eigenen Eintrag mit derselben Halle und Zeit an. Im Eintrag steht dann «Auch da: Mia, Tom». Es gibt keine Nachrichten.
*Warum:* Das ist der gewünschte Zweck («Bescheid geben, wer da ist»). Ohne Chat entfällt der größte Teil des Missbrauchsrisikos zwischen Fremden.

**F7 – Wie erfährt man, dass jemand kommt?**
✔ *Entschieden:* Nur durch Hineinschauen. Keine Benachrichtigungen, keine Zahl am Tab, keine E-Mails.

**F8 – Wie lange bleiben Einträge gespeichert?**
✔ *Entschieden (geändert):* Ein Eintrag wird **1 Tag nach Ende** des Zeitfensters gelöscht. Gemeldete Einträge bleiben als Kopie in der Meldung, bis der Plattform-Admin sie erledigt.

### Sichtbarkeit und Datenschutz

**F9 – Was sehen andere von mir?**
✔ *Entschieden:* Nur **Spitzname, Avatar**, Zeitfenster, Halle und, wenn ich es einschalte, **mein Niveau**. Nie E-Mail, nie Logbuch, nie Statistik, nie Standort. Vor dem ersten Eintrag steht ein Hinweis: «Andere sehen deinen Spitznamen, dein Bild und wann du in der Halle bist. Sprich Leute nur in der Halle an.» mit Knopf `Verstanden`.

**F10 – Gäste?**
✔ *Entschieden (angepasst an A5):* Auf der Landing Page gibt es den Knopf **«Wer ist heute da?»**. Gäste sehen dort die Einträge **ohne Namen und Bild** («Jemand · 18–21 Uhr · 6A–6B») und `Anmelden, um dich einzutragen`. Eintragen nur **angemeldet** (Google oder E-Mail).

**F11 – Altersgrenze?**
✔ *Entschieden:* **Ab 16 Jahren.** Beim ersten Eintragen bestätigt man mit einem Häkchen «Ich bin mindestens 16 Jahre alt». Keine Prüfung.

**F12 – Ist Treff automatisch an?**
✔ *Entschieden:* Der Tab ist sichtbar; eintragen erst nach Hinweis (F9) und Häkchen (F11). Unter Ich → Einstellungen gibt es die Gruppe **Treff** mit `Niveau zeigen`, `Meine Einträge löschen` und `Treff ausblenden` (blendet den Tab aus; wieder einblendbar).

**F13 – E-Mail-Lücke (A3) zuerst schließen?**
✔ *Entschieden:* **Ja, als Voraussetzung.** Die Migration entzieht `anon` und `authenticated` das Lesen von `user_profiles.email` (Spaltenrechte). Vorher liest die App `user_profiles` nur noch mit ausdrücklichen Spalten (A6), sonst ginge `is_platform_admin` verloren. **Reihenfolge für Hans: erst den Code ausliefern, dann die Migration einspielen.**

### Missbrauch

**F14 – Schutz vor unangenehmen Leuten?**
✔ *Entschieden:*
- **Ausblenden (Blockieren):** Im Eintrag `Person ausblenden`. Ich sehe ihre Einträge nicht mehr, sie sieht meine nicht mehr. Sie erfährt davon nichts. Rückgängig unter Einstellungen → Treff.
- **Melden:** `Melden` am Eintrag mit Grund (`Belästigung · Spam · Unangemessen · Anderes`). Die Meldung speichert eine Kopie des Eintrags.
- **Grenzen:** max. 3 offene Einträge, Text max. 120 Zeichen. Links im Text sind nicht anklickbar.

**F15 – Wer prüft Meldungen?**
✔ *Entschieden:* Der **Plattform-Admin** unter Ich → Einstellungen → Treff → `Meldungen prüfen` (nur für ihn sichtbar). Aktionen: `Eintrag löschen`, `Person für Treff sperren`, `Erledigt`. Hallen-Admins sehen Meldungen nicht.

**F16 – Darf eine Halle Treff abschalten?**
✔ *Entschieden:* Ja, Schalter im Admin-Tab «Halle» (SPEC-023): `Treff in dieser Halle erlauben` (Standard: an). Ist er aus, kann man sich für diese Halle nicht eintragen; die Treff-Seite sagt das in einem Satz.

### Technik

**F17 – Supabase (nur Anon-Key, Hans spielt Migrationen ein)?**
✔ *Entschieden:* Siehe §4. Alle Rechte über **RLS mit `auth.uid()`**. Gäste lesen nur eine Ansicht ohne Personen-Spalten.
Ohne echte Anmeldung (Test-Personen im Dev-Build, Tests) speichert die App Treff-Einträge lokal im Browser. So laufen Unit- und Playwright-Tests ohne Supabase.

**F18 – Ohne Internet?**
✔ *Entschieden:* Die Liste zeigt den zuletzt geladenen Stand mit «Offline». Eintragen geht nur online, mit klarer Meldung.

**F19 – Wie wird aufgeräumt?**
✔ *Entschieden:* Funktion `treff_cleanup()`. Die App ruft sie beim Öffnen der Treff-Seite auf. Optional plant Hans sie mit `pg_cron` täglich ein (Snippet in der Migration).

---

## 4. Datenmodell (Migration spielt Hans im SQL-Editor ein)

Datei: `supabase/migrations/20261009_spec028_treff.sql`

| Tabelle | Inhalt | Lesen | Schreiben |
|---|---|---|---|
| `treff_entries` | `id, user_id, gym_id, starts_at, ends_at, grade_min, grade_max, boulder_ref, note, nickname, avatar_url, created_at` | angemeldet: alle, außer bei Ausblenden in eine der beiden Richtungen | Insert nur `user_id = auth.uid()`, mit Häkchen, nicht gesperrt, Halle erlaubt, < 3 offene, max. 14 Tage; Delete nur eigene (oder Plattform-Admin) |
| `treff_entries_public` (View) | `id, gym_id, starts_at, ends_at, grade_min, grade_max` | `anon`, `authenticated` | – |
| `treff_blocks` | `blocker_id, blocked_id` | nur `blocker_id`; Prüfung «wurde ich ausgeblendet» über Funktion | nur `blocker_id = auth.uid()` |
| `treff_reports` | `id, reporter_id, entry_id, reported_user_id, reason, snapshot, created_at, handled_at` | nur Plattform-Admin | Insert: angemeldet; Update: Plattform-Admin |
| `treff_settings` | `user_id, consent_at, age_confirmed, show_grade, hidden, banned` | selbst + Plattform-Admin | selbst (ohne `banned`); `banned` nur Plattform-Admin über `treff_set_banned()` |
| `gyms.treff_enabled` | `BOOLEAN NOT NULL DEFAULT true` | öffentlich | wie die übrigen Hallen-Spalten (Admin-Konsole) |

`nickname`/`avatar_url` werden beim Eintragen in den Eintrag kopiert, damit für Treff kein Lesen von `user_profiles` nötig ist.
Voraussetzung im selben Skript: Spaltenrechte `user_profiles` ohne `email` (F13).

---

## 5. Oberfläche

**Treff-Seite** (`treff-view`)
- Titel «Wer ist da?» (28 px), darunter großer Schalter `Diese Halle | Alle Hallen` (`treff-scope`).
- Zwei große Knöpfe nebeneinander: **«Ich bin jetzt da»** (`treff-now`) und **«Eintragen»** (`treff-new`).
- «Meine Einträge» (nur wenn vorhanden) mit `Doch nicht` je Eintrag.
- Abschnitt **«Jetzt da»** und **«Kommt noch»** (`treff-section-now`, `treff-section-later`). Zeile (`treff-row-<id>`): links Tag und Zeit groß («Heute», «18–21 Uhr»), Mitte Avatar + Spitzname + Niveau-Plakette («6A–6B»), darunter der Satz (eine Zeile).
- Leerer Zustand: «Noch niemand eingetragen.»

**Eintrag-Sheet** (`treff-entry-sheet`): Spitzname, Zeit, Niveau, Satz, Boulder (antippbar), «Auch da: …», großer Knopf **«Ich komme auch»** (`treff-join`), darunter `Person ausblenden` und `Melden`.

**Eintragen** (`treff-form`): Tag als große Kacheln (Heute, Morgen, dann Wochentage für 14 Tage), Zeit «von» und «bis» als große Auswahlfelder (halbstündlich), Niveau (zwei Auswahlfelder, vorbelegt mit dem besten Grad, wenn «Niveau zeigen» an ist), Boulder (Auswahl), Satz, Knopf «Eintragen».

**Gast** (`treff-guest-sheet` auf der Landing Page): dieselbe Liste ohne Namen/Bild und ohne Knöpfe, unten `treff-login-cta`.

---

## 6. Akzeptanzkriterien

- **AC-1** Die Bottom-Nav hat `Wand · Ich · Treff` (`mobile-tab-treff`), der Desktop-Header `tab-treff`; die App startet auf `Wand`; am Tab steht keine Zahl.
- **AC-2** Die Treff-Seite zeigt Einträge der gewählten Halle in «Jetzt da» und «Kommt noch»; `Alle Hallen` zeigt alle mit Hallenname. Abgelaufene Einträge erscheinen nicht.
- **AC-3** Vor dem ersten Eintrag erscheinen Hinweis und Alters-Häkchen (`treff-consent`); ohne beides kein Eintrag.
- **AC-4** «Ich bin jetzt da» legt einen Eintrag heute, ab jetzt, 2 Stunden an. «Eintragen» verlangt Tag und Zeit (bis > von), höchstens 14 Tage im Voraus; Satz ≤ 120 Zeichen.
- **AC-5** Mehr als 3 offene Einträge sind nicht möglich (Meldung).
- **AC-6** «Ich komme auch» legt einen eigenen Eintrag mit gleicher Halle und Zeit an; der fremde Eintrag zeigt «Auch da: <Name>».
- **AC-7** Ein Boulder im Eintrag ist antippbar und öffnet das Boulder-Sheet.
- **AC-8** «Person ausblenden» blendet ihre Einträge für mich und meine für sie aus.
- **AC-9** «Melden» speichert eine Meldung mit Kopie; nur der Plattform-Admin sieht `Meldungen prüfen` und kann löschen, sperren, erledigen. Gesperrte können sich nicht eintragen.
- **AC-10** Gäste: Landing «Wer ist heute da?» (`landing-show-treff`) zeigt Einträge ohne Namen/Bild und `treff-login-cta`.
- **AC-11** Einstellungen → Treff: `Niveau zeigen`, `Meine Einträge löschen`, `Treff ausblenden` / `Treff einblenden` wirken sofort.
- **AC-12** `treff_enabled = false` → für diese Halle kein Eintragen, Hinweis auf der Seite; Admin-Schalter `gym-treff-toggle` im Tab «Halle».
- **AC-13** Nirgends erscheint eine E-Mail-Adresse; die App liest `user_profiles` nur mit ausdrücklichen Spalten.
- **AC-14** Lesbarkeit: Fließtext ≥ 17 px, Zeiten ≥ 20 px fett, Knöpfe ≥ 52 px hoch.

---

## 7. Tests (CONSTITUTION §13)

**Unit (Vitest)**
- `tests/spec028Treff.utils.test.ts`: Eintrag prüfen (Pflichtfelder, bis > von, max. 14 Tage, Text ≤ 120), «Jetzt da»/«Kommt noch»/abgelaufen, Sortierung, Halle/Alle, Grenze 3, Ausblenden in beide Richtungen, Gast-Ansicht ohne Personen-Daten, Formatierung («Heute», «Morgen», «Do 16.», «18–21 Uhr», «18:30–21 Uhr»), «Ich bin jetzt da» (2 Stunden), «Ich komme auch», Aufräumen nach 1 Tag, Halle gesperrt, Person gesperrt, Meldung mit Kopie.
- `tests/spec028TreffView.test.tsx`: dritter Tab, Start auf Wand, keine Zahl am Tab, Liste und Abschnitte, Hinweis + Häkchen, Formular, «Ich bin jetzt da», «Ich komme auch», Boulder antippen, Ausblenden, Melden, Einstellungen, Admin-Meldungen, Gast-Sheet, Admin-Schalter, Spalten-Select für `user_profiles`.

**Playwright (`tests/e2e/treff.spec.ts`, Desktop und Mobile Chrome)**
- Kletterer A: Tab Treff → Hinweis + Häkchen → «Ich bin jetzt da» → steht unter «Jetzt da».
- Abmelden, Kletterer B anmelden → sieht A → «Ich komme auch» → A's Eintrag zeigt «Auch da: B».
- B blendet A aus → A verschwindet.
- Melden → Plattform-Admin sieht die Meldung → «Eintrag löschen».
- Gast: Landing «Wer ist heute da?» → Einträge ohne Namen → Anmelde-Knopf.
- Wand-Tab unverändert (Foto ist erstes Element, SPEC-022).

**RLS (manuell im SQL-Editor):** Prüf-Abfragen stehen am Ende der Migration.

---

## 8. Nicht Teil dieser Spec
- Nachrichten/Chat, Anfragen, Gruppen.
- Push-Nachrichten und E-Mails.
- Seilklettern / Sicherungspartner.
- Bewertungen von Personen.
- Outdoor-Treffen, Fahrgemeinschaften.

---

## 9. Umsetzung (2026-10-09, nicht committet)

| Was | Wo |
|---|---|
| Logik, Speicher-Wahl (Supabase für echte Konten, sonst lokal), Grenzen, Ausblenden, Melden, Aufräumen | `src/lib/treffService.ts` |
| Treff-Seite mit Formular, Eintrag-Sheet, Hinweis + Häkchen | `src/components/treff/TreffView.tsx` |
| Gast-Ansicht (Landing «Wer ist heute da?») | `src/components/treff/TreffGuestSheet.tsx`, `LandingPage.tsx` |
| Ich → Einstellungen → Treff (Niveau, Ausgeblendete, ausblenden, löschen, Meldungen) | `src/components/treff/TreffSettingsGroup.tsx`, `MeView.tsx` |
| Admin-Tab «Halle»: Schalter | `src/components/treff/GymTreffToggle.tsx`, `GymManagement.tsx` |
| Dritter Tab | `MobileBottomNav.tsx` (`ClimberTab`), `AppHeader.tsx` (`tab-treff`), `App.tsx` |
| `user_profiles` nur mit ausdrücklichen Spalten (A6/F13) | `syncService.ts`, `authService.ts` |
| `gyms.treff_enabled` aus Supabase übernehmen | `syncService.ts`, Typ `src/types/gym.ts` |
| Migration + Prüf-Abfragen | `supabase/migrations/20261009_spec028_treff.sql`, Abschnitt in `supabase/schema.sql` |
| Datenschutz-Abschnitt Treff | `public/datenschutz.html` |

Die Migration wurde in einer lokalen PostgreSQL-16-Datenbank mit nachgebauten Supabase-Rollen (`anon`, `authenticated`, `auth.uid()`) eingespielt (zweimal, wiederholbar) und gegen 23 Fälle geprüft: E-Mail für Gäste gesperrt, Eintragen nur mit Häkchen, nur für sich selbst, max. 14 Tage, max. 3 offen, Ausblenden in beide Richtungen, Meldungen nur für den Plattform-Admin, Sperren nur durch ihn, Sperre lässt sich nicht selbst aufheben, Halle abgeschaltet, Gast-Ansicht ohne Personen-Spalten. Gegen das echte Supabase ist sie nicht getestet.

**Für Hans – Reihenfolge:** 1. Code committen und ausliefern (Vercel). 2. Danach im Supabase-SQL-Editor `20261009_spec028_treff.sql` einspielen. 3. Die drei Kontroll-Abfragen am Ende des Skripts ausführen. Optional: pg_cron einschalten und die `cron.schedule`-Zeile ausführen.
