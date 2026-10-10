# SPEC-033: Sichtbarkeit und meine Daten – Namens-Schalter, CSV-Export, Datenschutz

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-003 («Wer war schon oben»), SPEC-004 (Logbuch-Export), SPEC-024 (Datenschutzerklärung), SPEC-028 (Treff)
>
> **Anlass:** Simulierte Nutzer-Runde (`/mnt/project-files/nutzer-simulation/`), Vorschläge **D** und **K** sowie der Datenschutz-Teil von **E**. Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Ausgangslage (Code-Stand 2026-10-09)

| # | Befund | Wo |
|---|---|---|
| A1 | «Wer war schon oben» zeigt Spitzname und Anfangsbuchstaben jedes Kletterers; Tippen öffnet das öffentliche Profil. Es gibt keine Einstellung dagegen. | `BoulderSheet.tsx` |
| A2 | Niemand wird gefragt oder informiert, bevor der Name dort erscheint. | – |
| A3 | Export existiert als JSON («Logbuch exportieren»). Für Tabellen-Nutzer (Excel, R, Python) ist JSON umständlich. | `MeView.tsx` |
| A4 | Die Datenschutzerklärung nennt den Treff und den Speicherort nicht ausdrücklich. | `public/datenschutz.html` |

---

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Opt-in oder Opt-out für «mit Namen zeigen»?**
✔ *Entschieden (Empfehlung):* **Opt-out mit Hinweis.** Standard: sichtbar. Schalter in Ich → Einstellungen → Gruppe **«Sichtbarkeit»**: «Mit Namen in ‹Wer war schon oben›». Beim ersten Öffnen eines Boulders sagt die Erste-Schritte-Karte (SPEC-032 F9): «Andere sehen deinen Spitznamen bei Bouldern, die du loggst. Ändern unter Ich → Einstellungen.»
*Warum:* Georg und Katrin wollen gefragt werden; Felix will, dass die App lebendig bleibt.

**F2 – Was sehen andere, wenn der Schalter aus ist?**
✔ *Entschieden (Empfehlung):* Eine Zeile **«Jemand»** mit neutralem Symbol, ohne Anfangsbuchstaben und ohne Profil-Link. Stern-Bewertung, Soft/Fair/Stiff und Status bleiben sichtbar (sie zählen auch im Schnitt). Die eigene Zeile sieht man selbst weiterhin mit Namen und dem Zusatz «(nur für dich sichtbar)».
*Warum:* Die Werte helfen allen; nur die Person wird verborgen.

**F3 – Gilt das auch für Beta-Kommentare?**
✔ *Entschieden (Empfehlung):* Ja. Kommentare zeigen dann «Jemand». Löschen kann man den eigenen Kommentar weiter.

**F4 – Wo wird die Einstellung gespeichert?**
✔ *Entschieden (Empfehlung):* Im Profil, lokal und in Supabase als neue Spalte `user_profiles.show_in_lists BOOLEAN NOT NULL DEFAULT true`, nur vom Besitzer änderbar (Spalten-Recht wie bei `nickname`). Andere Geräte lesen den Wert beim Abgleich der Profile.
*Hinweis:* Die Datenbank-ID in `ascents.user_id` bleibt technisch lesbar. Volle Anonymität verlangt eine Sicht ohne `user_id`; das gehört zu SPEC-034 (Datenbank-Rechte), nicht zu dieser Runde. Die Spec sagt das ehrlich, die App verspricht deshalb nur «andere sehen deinen Namen nicht».

**F5 – Braucht es «So sehen dich andere»?**
✔ *Entschieden (Empfehlung):* Ja, klein: Unter dem Schalter eine **Vorschau-Zeile**, genau so, wie andere einen sehen (Name + Buchstabe oder «Jemand»). Kein eigener Bildschirm.

**F6 – Welches Export-Format?**
✔ *Entschieden (Empfehlung):* Zusätzlich zur JSON-Datei eine **CSV-Datei** («Als Tabelle (CSV)»). Spalten: `Datum;Halle;Sektor;Nummer;Boulder;Farbe;Grad;Stil;Versuche`. Trennzeichen **Semikolon**, UTF-8 mit BOM, damit Excel in DACH Umlaute und Spalten richtig liest. Datum `JJJJ-MM-TT HH:MM`. Stil ausgeschrieben (Flash, Top, Projekt).
*Warum:* Jonas und Aylin.

**F7 – Was kommt in die Datenschutzerklärung?**
✔ *Entschieden (Empfehlung):* Drei Absätze ergänzen: (1) Sichtbarkeit in «Wer war schon oben» und der Schalter, (2) Treff: Einträge verschwinden nach dem Termin und werden nach 24 h gelöscht, (3) Speicherort: Supabase (Anbieter) mit der Region des Projekts. Die Region trägt Hans ein (Platzhalter deutlich markiert: «[Region, z. B. EU – Frankfurt]»), weil sie nur im Supabase-Dashboard steht.

---

## 3. Datenmodell (Migration spielt Hans im SQL-Editor ein)

`supabase/migrations/20261009_spec033_sichtbarkeit.sql`:
- `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS show_in_lists BOOLEAN NOT NULL DEFAULT true;`
- `GRANT SELECT (show_in_lists)` an `anon, authenticated`; `GRANT UPDATE (show_in_lists)` an `authenticated` (Regel «Own profile update» gilt schon).
- **Reihenfolge:** Code ausliefern, dann Migration. Der Code liest die Spalte so, dass ein Fehlen nichts kaputt macht (Rückfall auf die Spalten ohne `show_in_lists`).

## 4. Akzeptanzkriterien

- **AC-1** Einstellungen haben die Gruppe «Sichtbarkeit» mit Schalter (Standard an) und Vorschau-Zeile.
- **AC-2** Schalter aus: Andere sehen in «Wer war schon oben» und bei Beta «Jemand», ohne Buchstabe, ohne Profil-Link; Sterne/Status bleiben.
- **AC-3** Die eigene Zeile bleibt für einen selbst mit Name und «(nur für dich sichtbar)».
- **AC-4** Die Erste-Schritte-Karte (SPEC-032) enthält den Satz zur Sichtbarkeit.
- **AC-5** «Als Tabelle (CSV)» lädt eine Datei mit BOM, Semikolon und den Spalten aus F6 herunter.
- **AC-6** `datenschutz.html` enthält die drei Absätze aus F7.
- **AC-7** Ohne die neue Spalte (Migration nicht eingespielt) lädt der Profil-Abgleich weiter.

## 5. Tests

- Unit: `tests/spec033Sichtbarkeit.test.tsx` (Schalter, «Jemand»-Darstellung, eigene Zeile, CSV-Inhalt, Rückfall ohne Spalte).
- Playwright: `tests/e2e/sichtbarkeit-export.spec.ts` (Schalter umlegen, Anzeige bei anderer Person, CSV-Download).

## 6. Nicht Teil dieser Spec

- Volle Anonymisierung auf Datenbank-Ebene (SPEC-034 / später).
- Privates Profil (ganzes Profil verstecken).

## Umsetzung (2026-10-09)
- Umgesetzt. Migration `supabase/migrations/20261009_spec033_sichtbarkeit.sql` (Spalte `show_in_lists`, Standard an).
- Testdateien: tests/spec033Sichtbarkeit.test.tsx; tests/e2e/spec033-035-037-ich.spec.ts
