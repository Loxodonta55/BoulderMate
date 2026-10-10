# SPEC-034: Datenbank-Schreibrechte – nur Berechtigte ändern Hallen, Wände und Boulder

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-000 (Rollen), SPEC-006 (Rollen-Gateway), SPEC-023 (Admin/Team), SPEC-027 (Plattform-Admin), SPEC-028 (Treff-Rechte, E-Mail)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **E** (Ralf, Thomas). Die Lücke ist seit 2026-10-08 in den Projektnotizen vermerkt. Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Ausgangslage (laut `supabase/schema.sql`, Prod nicht direkt prüfbar)

| # | Befund |
|---|---|
| A1 | `sectors`, `boulders`, `grade_scales`, `gyms`: Regel `FOR ALL USING (true) WITH CHECK (true)` – jeder mit dem öffentlichen Schlüssel darf ändern und löschen, auch ohne Anmeldung. |
| A2 | Speicher `sector-photos`: Hochladen ohne Anmeldung erlaubt. |
| A3 | Für `ascents`, `ratings`, `gym_members` stehen in `schema.sql` keine Schreibregeln, die App schreibt dort aber erfolgreich. **Prod hat also Regeln, die nicht in `schema.sql` stehen.** Deshalb darf die Migration keine Namen raten, sondern muss die vorhandenen Regeln selbst finden. |
| A4 | Die Oberfläche versteckt Knöpfe, die Datenbank prüft aber nichts. |

---

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Wer darf was?**
✔ *Entschieden (Empfehlung):*

| Tabelle | Lesen | Anlegen / Ändern / Löschen |
|---|---|---|
| `gyms` | alle | Anlegen und Löschen: Plattform-Admin. Ändern: Plattform-Admin oder Admin dieser Halle. |
| `sectors`, `grade_scales` | alle | Plattform-Admin, Admin oder Schrauber dieser Halle |
| `boulders` | alle | Plattform-Admin, Admin oder Schrauber der Halle, zu der der Sektor gehört |
| `gym_members` | eigene Rollen; Admins sehen alle Rollen ihrer Halle; Plattform-Admin alle | Plattform-Admin oder Admin dieser Halle |
| `ascents`, `ratings` | alle | nur eigene Zeilen (`user_id = auth.uid()`) |
| Speicher `sector-photos` | alle | nur angemeldet |

**F2 – Wie wird «Admin/Schrauber dieser Halle» geprüft?**
✔ *Entschieden (Empfehlung):* Eine Funktion `public.bm_can_edit_gym(gym UUID)` (SECURITY DEFINER, fester `search_path`), die `true` liefert für Plattform-Admins (`user_profiles.is_platform_admin`) und für Einträge in `gym_members` mit Rolle `admin` oder `setter`. Dazu `bm_is_gym_admin(gym UUID)` nur für `admin`.
*Warum:* Eine Stelle für die Regel; die Regeln der Tabellen bleiben kurz.

**F3 – Wie geht die Migration mit unbekannten Prod-Regeln um?**
✔ *Entschieden (Empfehlung):* Ein `DO`-Block liest `pg_policies` und entfernt **alle Schreib-Regeln** (`INSERT`, `UPDATE`, `DELETE`, `ALL`) dieser Tabellen; Lese-Regeln bleiben. Danach werden die neuen Regeln angelegt. Alles in einer Transaktion.

**F4 – Wie verhindern wir, dass sich jemand aussperrt?**
✔ *Entschieden (Empfehlung):* Drei Schritte, alle in der Migrationsdatei beschrieben:
1. **Vorher-Abfrage** (nur lesen): Wer hat in den letzten 60 Tagen Boulder geschraubt (`boulders.setter_id`), hat aber keine Rolle in `gym_members` dieser Halle und ist kein Plattform-Admin? Diese Personen müssen zuerst im Admin-Tab «Team» eingetragen werden.
2. **Migration** ausführen.
3. **Nachher-Abfrage**: Liste der Regeln. Und eine Datei `…_spec034_notfall_zurueck.sql`, die die alten offenen Regeln wiederherstellt, falls in der Halle etwas nicht mehr geht.

**F5 – Reihenfolge mit dem App-Code?**
✔ *Entschieden (Empfehlung):* Keine Code-Änderung nötig; die App schreibt schon als angemeldeter Nutzer. Test-Personen (Simulation) schreiben ohnehin nicht nach Supabase. Wer nicht angemeldet ist, sieht keine Schreib-Knöpfe.

**F6 – Und die volle Anonymität aus SPEC-033?**
✔ *Entschieden (Empfehlung):* Nicht in dieser Runde. `ascents.user_id` bleibt lesbar, weil der Abgleich ihn braucht. Eine Sicht ohne `user_id` ist ein eigener, größerer Umbau.

---

## 3. Dateien

- `supabase/migrations/20261009_spec034_schreibrechte.sql` – Vorher-Abfrage (auskommentiert), Funktionen, DO-Block, neue Regeln, Nachher-Abfrage.
- `supabase/migrations/20261009_spec034_notfall_zurueck.sql` – stellt die offenen Regeln von vorher wieder her.
- `supabase/schema.sql` – Abschnitt «SPEC-034» ersetzt die offenen Regeln (für neue Installationen).

## 4. Akzeptanzkriterien (geprüft in lokalem Postgres 16 mit nachgebauten Supabase-Rollen `anon`, `authenticated` und `auth.uid()`)

- **AC-1** `anon` kann in `sectors`, `boulders`, `grade_scales`, `gyms`, `gym_members`, `ascents`, `ratings` nicht schreiben.
- **AC-2** Ein angemeldeter Kletterer ohne Rolle kann nicht schreiben, außer eigene `ascents`/`ratings`.
- **AC-3** Ein Schrauber der Halle X kann Sektoren/Boulder/Farben in X anlegen, ändern, löschen; in Halle Y nicht.
- **AC-4** Ein Admin der Halle X kann Rollen in X vergeben; ein Schrauber nicht.
- **AC-5** Der Plattform-Admin kann alles.
- **AC-6** Fremde `ascents`/`ratings` kann niemand ändern oder löschen.
- **AC-7** Die Migration läuft zweimal hintereinander ohne Fehler.
- **AC-8** Die Notfall-Datei stellt den alten Zustand her (Schreiben wieder offen).

## 5. Tests

- Datenbank: `tests/db/spec034_rls.sql` + `scripts/test-rls-spec034.sh` (lokales Postgres, prüft AC-1 bis AC-8). Läuft nicht in `npm test`, weil Postgres nötig ist.
- Unit: `tests/spec034Schreibrechte.test.ts` (Migrationsdatei enthält keine `USING (true)`-Schreibregel mehr, beide Dateien vorhanden, `schema.sql` ohne offene Schreibregeln).
- Playwright: keine sichtbare Änderung; bestehende Admin-/Schrauber-Tests müssen grün bleiben.

## 6. Nicht Teil dieser Spec

- Kommentar-/Beta-Tabelle (liegt noch lokal).
- Sicht ohne `user_id` (F6).

## Umsetzung (2026-10-09)
- Migration `supabase/migrations/20261009_spec034_schreibrechte.sql` (mit Vor- und Nach-Prüfabfrage), Notfall-Datei `20261009_spec034_notfall_zurueck.sql`.
- Abweichung F1: **Lesen bleibt für alle offen, auch `gym_members`** (die App braucht die Rollen zum Anzeigen; geschützt wird nur das Schreiben).
- Da die Regeln in Prod unbekannt sind, löscht die Migration alle bestehenden Schreib-Regeln der betroffenen Tabellen und legt die neuen «bm …»-Regeln an.
- Geprüft mit lokalem Postgres: `scripts/test-rls-spec034.sh` (48 Prüfungen, zweimal angewendet, Notfall hin und zurück).
- Testdateien: tests/spec034Schreibrechte.test.ts; scripts/test-rls-spec034.sh (tests/db/*.sql)
