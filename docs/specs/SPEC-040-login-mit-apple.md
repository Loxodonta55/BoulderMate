# SPEC-040: Login mit Apple

## Status: IMPLEMENTED – Code fertig, live nach Apple-Einrichtung (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-024 (Login mit Google)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **R** (Wolfgang: iPhone ohne Google-Konto). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Ausgangslage

Login gibt es mit Google (SPEC-024) und mit E-Mail + Passwort. Der Google-Knopf erscheint nur, wenn Supabase Google meldet (`/auth/v1/settings` → `external.google`). Im Code ist `'apple'` als Anbieter-Typ angelegt, aber nicht angebunden.

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Wie wird Apple angebunden?**
✔ *Entschieden (Empfehlung):* Wie Google über Supabase: `signInWithOAuth({ provider: 'apple' })`, Rückkehr auf dieselbe Seite. Profil-Anlage über den bestehenden Trigger (SPEC-024).

**F2 – Wann erscheint der Knopf?**
✔ *Entschieden (Empfehlung):* Nur wenn Supabase Apple meldet (`external.apple`), genau wie bei Google. Ohne Einrichtung bleibt alles wie heute. So kann der Code jetzt ausgeliefert werden.

**F3 – Aussehen und Reihenfolge?**
✔ *Entschieden (Empfehlung):* Schwarzer Knopf mit weißem Apple-Logo und «Mit Apple anmelden» (Apples Vorgabe), gleich groß wie der Google-Knopf (≥ 52 px), **unter** dem Google-Knopf. Im dunklen Modus weißer Knopf mit schwarzer Schrift.

**F4 – «E-Mail verbergen» von Apple?**
✔ *Entschieden (Empfehlung):* Erlaubt. Apple liefert dann eine Weiterleitungs-Adresse; die App braucht die echte Adresse nicht. Als Spitzname wird der Vorname vorgeschlagen, sonst «Kletterer»; ändern in den Einstellungen.

## 3. Was Hans einrichten muss (einmalig)

1. Apple-Entwicklerkonto (kostenpflichtig, 99 USD/Jahr).
2. Bei Apple: «Services ID» und «Sign in with Apple»-Schlüssel anlegen, Rückruf-URL `https://<projekt>.supabase.co/auth/v1/callback`.
3. In Supabase: Authentication → Providers → Apple einschalten, Services ID und Schlüssel eintragen.
4. Danach erscheint der Knopf von selbst.

## 4. Akzeptanzkriterien

- **AC-1** Ohne Apple in Supabase gibt es keinen Apple-Knopf.
- **AC-2** Meldet Supabase Apple, zeigen Landing und Login-Fenster den Knopf unter Google.
- **AC-3** Tippen startet `signInWithOAuth` mit `provider: 'apple'` und Rückkehr auf die aktuelle Seite.
- **AC-4** Nach der Anmeldung ist `provider` im Konto `apple`.

## 5. Tests

- Unit: `tests/spec040AppleLogin.test.tsx` (Knopf nur bei `external.apple`, Aufruf mit richtigem Anbieter, Profil-Anbieter).
- Playwright: `tests/e2e/apple-login.spec.ts` (Settings-Antwort per `route` mit `apple: true` → Knopf sichtbar; ohne → nicht sichtbar).

## Umsetzung (2026-10-09)
- Code fertig: Knopf «Mit Apple anmelden» erscheint nur, wenn Apple in Supabase eingeschaltet ist (`/auth/v1/settings`). Live erst nach Einrichtung durch Hans.
- Testdateien: tests/spec040AppleLogin.test.tsx; tests/e2e/spec039-040-043-sprache-apple-import.spec.ts
