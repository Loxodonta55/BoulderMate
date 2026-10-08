# SPEC-027: Test-Login – «Ansehen als …» und echte Test-Konten

## Status: IN PROGRESS (umgesetzt 2026-10-08, uncommitted; Einrichtung in Supabase durch Hans offen)

> **Owner:** Hans · **Created:** 2026-10-08 · **Baut auf:** SPEC-000 (Rollen), SPEC-006 (Arbeitsbereich-Wahl), SPEC-024 (Google-Login)
>
> Hans hat aus drei Vorschlägen die Kombination A + B gewählt: A «Ansehen als …» für Plattform-Admins und B echte Test-Konten in Supabase. Vorschlag C (Test-Personen live einschalten) wurde verworfen, weil die Knöpfe im ausgelieferten Code stünden.

---

## 1. Ziel

- Live (bouldermate.ch) meldet sich niemand ohne echtes Konto an.
- Hans kann in der Testphase lokal und live schnell alle Rollen sehen: Plattform-Admin, Hallen-Admin (Admin + Schrauber + Kletterer), Schrauber (+ Kletterer), nur Kletterer.
- Alles lässt sich später ohne Code-Änderung abschalten.

## 2. Ausgangslage (Code-Stand 2026-10-08)

| # | Befund | Wo |
|---|---|---|
| A1 | Test-Personen (Boris, Admin 6a Plus, Schrauber, Hans Kletterer, …) sind reine Browser-Profile; die Knöpfe erscheinen nur im Dev-Build. | `LandingPage.tsx`, `LoginModal.tsx` |
| A2 | **Hintertür live:** Schlug die echte Anmeldung fehl, meldete `signInWithPassword` bei einer Test-E-Mail mit dem Passwort `bouldermate2026` trotzdem als Test-Person an, auch als Boris (OverAdmin). | `authService.ts` |
| A3 | Live wurde eine im Browser gespeicherte Test-Person beim Start übernommen, und `boris@bouldermate.ch` galt allein wegen der Adresse als Plattform-Admin. | `authService.ts` |
| A4 | `gym_members` hat RLS, aber keine Lese-Regel; die App konnte die Rollen echter Nutzer nicht lesen. | `supabase/schema.sql` |

## 3. Anforderungen

**AC-1 – Nur Plattform-Admins sehen den Umschalter.** Unten links schwebt «Ansehen als …», nur wenn der angemeldete Nutzer echter Plattform-Admin ist (live: `user_profiles.is_platform_admin`, den Nutzer selbst nicht ändern können).

**AC-2 – Vorschau nimmt nur Rechte weg.** Vier Ansichten: Meine echten Rechte · Hallen-Admin · Schrauber · Nur Kletterer. Sie ersetzen die Rollen des Plattform-Admins durch eine Teilmenge (`applyViewAs`). Sie gelten nur für den angemeldeten Admin selbst, nie für andere Nutzer. Gespeichert wird immer unter dem echten Konto. In der Vorschau «Hallen-Admin» ist man Admin jeder Halle, aber ohne Plattform-Rechte (kein «Halle anlegen»).

**AC-3 – Wechsel.** Nach einer neuen Wahl geht es zurück zur Wand. Hat die neue Ansicht Sonderrechte, fragt die Arbeitsbereich-Wahl (SPEC-006) neu. Die Wahl bleibt nach dem Neuladen erhalten (`localStorage`, Schlüssel `bm_view_as_v1`).

**AC-4 – Gut erkennbar.** Knopf mindestens 48 px hoch, Schrift 16 px, Auge-Symbol. In einer Vorschau ist der Knopf dunkel gefüllt und zeigt «Ansicht: …». Auf dem Handy sitzt er über der unteren Leiste.

**AC-5 – Abschalten.** `VITE_ROLLEN_VORSCHAU=aus` (Vercel-Umgebungsvariable oder `.env.local`) und neu bauen: Umschalter weg, gespeicherte Vorschau wirkungslos.

**AC-6 – Keine Test-Personen live.** Test-Personen nur im Dev-Build, in Tests oder ohne Supabase (`allowDemoLogins`). Live: kein Passwort-Fallback, keine Anmeldung ohne Passwort, gespeicherte Test-Personen werden beim Start verworfen, ohne gültige Supabase-Session ist man abgemeldet, Plattform-Admin nur über die Datenbank.

**AC-7 – Echte Test-Konten.** Migration `supabase/migrations/20261008_spec027_test_konten.sql`:
- Lese-Regel «eigene Hallen-Rollen» auf `gym_members`
- `is_platform_admin` für Hans' Konto und `boris@bouldermate.ch`
- Profile und Rollen in «6a Plus» für `test-admin@`, `test-schrauber@` und `test-kletterer@bouldermate.ch`

Die Konten selbst legt Hans im Dashboard an (Authentication → Users → Add user, «Auto Confirm User»).

## 4. Einrichtung durch Hans

1. Im Supabase-Dashboard die drei Test-Konten mit Passwort anlegen (Auto Confirm an).
2. In der Migration bei «2.» die eigene Login-Adresse eintragen und im SQL-Editor ausführen; die Kontrolle am Ende zeigt Konten und Rollen.
3. Passwörter im Passwort-Manager speichern. Wechsel zwischen Konten: abmelden, anmelden.

## 5. Bewusst nicht Teil dieser Spec

- Schreibrechte in Supabase sind für Sektoren, Boulder, Farben und Hallen weiterhin für alle offen (`Allow insert … USING (true)`). Das schützt diese Spec nicht; dafür braucht es eine eigene Spec mit RLS je Rolle.

## 6. Tests

- Unit: `tests/spec027ViewAs.test.tsx` (Abbildung der Rollen, nur eigener Admin, Abschalten, Live-Sperre, Komponente, App-Integration)
- Playwright: `tests/e2e/view-as.spec.ts` (Boris durch alle Rollen, Neuladen, Kletterer ohne Umschalter, Handy-Position)

## 7. Dateien

`src/lib/viewAsService.ts` (neu) · `src/components/ViewAsSwitcher.tsx` (neu) · `src/lib/authService.ts` · `src/lib/roleService.ts` · `src/lib/gymStorage.ts` · `src/App.tsx` (Einhängen) · `supabase/migrations/20261008_spec027_test_konten.sql`
