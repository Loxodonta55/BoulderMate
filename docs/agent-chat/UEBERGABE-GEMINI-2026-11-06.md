# Übergabe an Gemini (Antigravity) – Stand 2026-11-06

> **Von:** Claude Code · **Für:** Gemini in Antigravity, zusammen mit Hans
> **Repo:** `C:\Users\boris\Repos\BoulderMate`, Branch `feat/ux-overhaul-v2`
> **Agent-Chat:** Eintrag **AC-019** in `docs/agent-chat/CHAT.md`
> Hans arbeitet ab jetzt mit dir weiter. Claude ist bis auf Weiteres nicht dabei. Diese Datei ist die Liste dessen, was noch offen ist.

---

## 0. Was Claude schon erledigt hat (nicht nochmal machen)

- **Commit `ca5cf31`** auf `feat/ux-overhaul-v2`: alle offenen Änderungen im Arbeitsordner (SPEC-025 «Karte eingeloggt», SPEC-053 «Warum BoulderMate für Hallen» mit `HallenNutzen.tsx`, Gesamttest-Runde, Spec-Index, `CHAT.md`). Keine Secrets, kein `.env`, keine `.agent/mcp_config.json` (beide sind in `.gitignore`).
- **Bewusst NICHT committet:**
  - `docs/agent-chat/CLAUDE_LIVE.md`: 26 MB groß, fast nur Null-Bytes (Datei ist kaputt, das Protokoll-Skript schreibt sich selbst hinein). Nicht committen. Vorschlag: `git checkout -- docs/agent-chat/CLAUDE_LIVE.md` und das Skript, das sie schreibt, reparieren.
  - `docs/agent-chat/ANTIGRAVITY_LIVE.md`: enthält **private Unterhaltungen von Hans, die nichts mit BoulderMate zu tun haben** (Finanzen, Versicherungen). Die dürfen nicht ins Repo und nicht auf GitHub. Bitte nie mit `git add -A` committen.
- Diese Übergabe, SPEC-047 und SPEC-048 (mit ihren Feedback-Runden) liegen ab dem zweiten Commit von Claude im Repo (`docs/agent-chat/UEBERGABE-GEMINI-2026-11-06.md`, `docs/specs/`, `docs/feedback-runden/`).
- **Nicht gepusht.** Lokal liegen 4 Commits vor `origin/main` (`cb489b7`, `77a3ecf`, `5a7af20`, `ca5cf31`) plus der Übergabe-Commit.

---

## 1. Schritt 1 für Gemini: aufräumen, committen, pushen

1. `git status` prüfen. Wenn Hans oder du seit Claudes Commit etwas geändert habt, die Änderungen **gezielt** committen (Dateien einzeln nennen, nie `git add -A`). Nie committen: `.env*`, `.env.worker`, `.agent/mcp_config.json`, `docs/agent-chat/*_LIVE.md`.
2. **Empfehlung (Hans entscheidet):** `docs/agent-chat/*_LIVE.md` in `.gitignore` aufnehmen und mit `git rm --cached` aus dem Repo nehmen. Die Protokolle mischen BoulderMate mit privaten Themen.
3. Falls Git meldet `File exists` / `.lock`: Claude hat alte Sperrdateien unter `.git/stale-*` umbenannt. Die kann man gefahrlos löschen.
4. `npm run test:all` (Unit + Playwright). Ergebnis in AC-019 eintragen.
5. Pushen nur nach Hans' Ja: `git push origin feat/ux-overhaul-v2` und, wenn er es will, als Fast-Forward nach `main` (`git push origin HEAD:main`, kein Force-Push). Vercel deployt `main` automatisch auf bouldermate.ch.
6. Danach AC-015 und AC-017 auf `ERLEDIGT` setzen, falls Migrationen und Push wirklich durch sind: `node scripts/agent-chat.mjs set-status AC-015 ERLEDIGT`.

---

## 2. Projektregeln (gelten für jede Änderung)

1. **Loop «FeatureDefinition»** für jedes neue Feature: zuerst Grill-me (Fragen mit klarer Empfehlung, Hans: «geh immer mit der Empfehlung»), dann eine simulierte Runde mit 30 Personen aus verschiedenen Gruppen (Handwerk, Studierende, Eltern, 55+, Hallenpersonal, Anfänger, Sehschwäche, Englischsprachige, nicht nur MINT). Auswertung in die Spec einarbeiten. **Mindestens 3, höchstens 5 Runden**, erst dann READY. Ablage: `docs/feedback-runden/<datum>-<feature>/runde-<n>-…`, Verlauf in der Spec unter «FeatureDefinition-Verlauf». Quelle: `docs/prozesse/feature-definition.md`, `CONSTITUTION.md` §14.
2. **Testpflicht** (CONSTITUTION §13): jedes Feature braucht **Unit-Tests (Vitest) UND Playwright-Tests**. Ohne beides nicht fertig.
3. **Specs synchron halten:** jede Code-Änderung auch in `docs/specs/SPEC-xxx` und `docs/specs/INDEX.md` nachführen (Status, Abweichungen, Dateien).
4. **Große, kontrastreiche Oberfläche:** Hans sieht schlechter. Schrift und Symbole groß, starker Kontrast, Tippflächen mindestens 44 × 44 px (SPEC-020/032). Neue Kletterer-Texte über `t()` aus `src/lib/i18n` mit englischem Eintrag (SPEC-039).
5. **Nicht umkehrbare Schritte nur mit Hans' ausdrücklichem Ja:** Migrationen in Prod, Push nach `main`, Fotos in Prod tauschen, Nachrichten an Hallen oder Partner verschicken.
6. Migrationen spielst du über den Supabase-MCP ein. Vorher immer lokal oder in einem Supabase-Branch testen, wenn die Spec «ungetestet» sagt.

---

## 3. Aufgaben für Gemini (der Reihe nach)

### 3.1 Offene Agent-Chat-Aufträge abschließen
- **AC-015 / AC-017:** Prüfen, ob die Migrationen `20261020_spec045_konto_loeschen.sql`, `20261022_spec046_melden.sql`, `20261027_spec052_ki_routenerfassung.sql` in Prod sind. Laut Gesamttest vom 2026-10-30 sind 046, 052 und 053 schon drin (Spalten antworten). 045 (`delete_my_account`) bitte nachprüfen. Dann Status setzen.
- **AC-018:** SPEC-053-E2E (`tests/e2e/spec053-noch-nicht-dabei.spec.ts`) war rot, weil `remoteDirectory()` in `src/lib/hallenVerzeichnis.ts` geändert wurde. Im Commit steht jetzt `!isTestEnv`. Bitte Playwright für spec053 und spec054 laufen lassen und bestätigen, dass sie grün sind.

### 3.2 Fehler aus dem Gesamttest beheben (Datei `docs/feedback-runden/2026-10-30-gesamttest/0-testlauf-befunde.md`)
Jeweils mit Unit- und Playwright-Test und Spec-Nachtrag:
- **H1** Schrauber-Studio: «Speichern & Veröffentlichen» ist auf jedem Handy halb abgeschnitten (`BatchBoulderWorkflow.tsx`, feste Leiste unten). Auf Handybreite zweizeilig, Knopf in voller Breite.
- **H2** «Ansehen als …» liegt über dem Fenster «Arbeitsbereich wählen». Ausblenden, solange ein Fenster offen ist.
- **H3** Startseite passt auf dem iPhone 15 nicht auf einen Bildschirm (`google-login.spec.ts:151`, `redesign-kreide.spec.ts:41`). Der Google-Knopf muss ohne Scrollen sichtbar sein.
- **N2 / iPhone Safari:** Sektor löschen im Admin klappt nicht (`admin-ux.spec.ts:41`, Mobile Safari). Zuerst wiederholen, dann beheben.
- **M1** Hauptknopf der Startseite mal schwarz, mal weiß (`redesign-kreide.spec.ts:14`). Hans fragen, welche Variante gewollt ist (siehe 4.), Test anpassen.
- **M2** Englisch fehlt bei Hallenwahl, «Arbeitsbereich wählen» und Treff-Einstellungen.
- **M3** Tippflächen unter 44 px (Lupe, Logo, Sektor-Chips, Studio-Kopf, Karten-Zoom, Treff-Schalter).
- **M4** Admin «Zahlen»: bei jeder Kachel den Zeitraum nennen.
- **M5** Unit-Tests hängen von der Reihenfolge ab (`spec028TreffView`, `spec051ChallengeToday`). `beforeEach` sauber aufräumen, damit `npm run test:all` verlässlich grün ist.
- Niedrig: N1, N3–N6 (siehe Datei).

### 3.3 SPEC-052 KI-Routenerfassung (AC-016, mit Hans am PC)
- **Qualität:** Ziel ≥ 90 % Routen gefunden, ≥ 95 % Farbe, ≤ 5 % erfunden. Stand blind `cli-v6-farbcheck`: 78 % / 88 %. **Nur Blindläufe zählen** (`--backend cli`, Median-Abstand ≥ 0.012; abgeschriebene «manual»-Läufe sind ungültig).
  - Zuerst mit Hans die fehlenden Routen der Sektoren Ecke Vorne, Verlängerung Überhang, Zwischenwand Vorne und Cave Wand in der App nachtragen (Vergleichsdaten unvollständig).
  - Dann bis zu 3 Runden `src/lib/aiCapture/prompt.ts` / `colorCheck.ts` verbessern, blind laufen lassen, in `history.md` festhalten. Neueres Modell mit `--model` probieren. `npx vitest run tests/spec052AiCapture` muss grün bleiben.
- **Teil-Umbau mit echten Fotos (F5):** Mit einem Vorher-Nachher-Paar desselben Sektors den Worker im Modus `partial` blind laufen lassen: gleiche Routen bleiben, neue kommen dazu, verschwundene werden archiviert.
- **Worker auf Hans' PC** (`scripts/ai-capture/README.md`): Worker-Konto (Rolle Schrauber in 6a plus), `.env.worker` (Passwort nie in Chat oder Repo), Gemini-CLI-Anmeldung ohne Training prüfen (kostenlose API-Stufe ist verboten), Windows-Aufgabenplanung, Probelauf mit Testsektor.
- Die KI bleibt in Admin → Halle **aus**, bis das Qualitätsziel erreicht ist.
- Datenschutzseite: KI-Abschnitt in `public/datenschutz.html` (Commit `77a3ecf`) gegenlesen (Anbieter, Training, USA/Standardvertragsklauseln), Unstimmigkeiten an Hans melden.

### 3.4 SPEC-054 Vertriebspartner (Commit `5a7af20`)
- Migration `supabase/migrations/20261030_spec054_vertriebspartner.sql` ist **nie gegen Postgres getestet**. Zuerst in einem Supabase-Branch oder lokalem Postgres prüfen (setzt SPEC-053 voraus), dann erst nach Hans' Ja in Prod.
- Unit- und Playwright-Tests (`spec054*`) nach dem Push nochmal laufen lassen.

### 3.5 SPEC-053 «Noch nicht dabei»
- Gemini-Hinweis aus AC-012 umsetzen: Insert-Policy für Wünsche und `hallen_wunsch_rangliste` sollen Hallen mit `pruef_status = 'unsicher'` ausschließen (prüfen, Migration nachziehen, testen).

### 3.6 SPEC-047 «Einführung beim ersten Start» bauen (READY v4, noch nicht gebaut)
- Spec: `docs/specs/SPEC-047-einfuehrung-erste-nutzung.md`, Runden: `docs/feedback-runden/2026-10-11-einfuehrung/`.
- Einmalige, überspringbare Einführung (unter einer Minute), QR-Gäste werden nicht aufgehalten, «gesehen» lokal und in `user_metadata.bm_intro`. Kleiner Teil «Hallen-Satz» braucht eine Migration (`2026xxxx_spec047_hallen_satz.sql`). Beim Bauen den Code-Stand gegen §2 der Spec abgleichen (Spec ist vom 2026-10-11).
- Unit + Playwright laut §16, INDEX-Eintrag ergänzen.

### 3.7 SPEC-048 «Hallen-Rangliste für Kletterer» bauen (READY v4, noch nicht gebaut)
- Spec: `docs/specs/SPEC-048-hallen-rangliste.md`, Runden: `docs/feedback-runden/2026-10-16-kletterer-rangliste/`.
- Kalendermonat, Punkte 10 × Farbstufe (Flash 12 ×), jeder Boulder einmal, max. 25/Tag, Opt-in pro Halle nur mit Spitzname, Ligen nach Farben, Admin kann jemanden pro Monat herausnehmen. Block «Wettbewerb» in «Ich» zusammen mit der Challenge (SPEC-038).
- Migration `20261016_spec048_rangliste.sql` (`ranking_participants`, `ranking_exclusions`) neu schreiben, lokal testen, Einspielen erst nach Hans' Ja.
- Spec ist vom 2026-10-16: vor dem Bauen gegen SPEC-050/051 und den aktuellen «Ich»-Bereich abgleichen.

### 3.8 SPEC-045 App
- Platzhalter in `public/.well-known/apple-app-site-association` (`TEAMID`) und `public/.well-known/assetlinks.json` (`SHA256_AUS_GOOGLE_PLAY_CONSOLE`) ersetzen, sobald Hans die Werte liefert (siehe 4.). Schritte für Hans stehen in `docs/app/einrichtung-hans.md`.

---

## 4. Nur Hans kann das entscheiden oder erledigen

| # | Thema | Was Hans tun muss |
|---|---|---|
| 1 | Push / Deploy | Ja geben, dass `feat/ux-overhaul-v2` nach `main` geht (bouldermate.ch wird sofort aktualisiert). |
| 2 | Migrationen in Prod | Ja je Migration: SPEC-054 (erst nach Test), SPEC-047 Hallen-Satz, SPEC-048 Rangliste. |
| 3 | Private Protokolle | Entscheiden, ob `docs/agent-chat/*_LIVE.md` aus dem Repo raus und in `.gitignore` sollen (Empfehlung: ja). |
| 4 | Hallenpreis | Preis für Hallen festlegen (Einführungsgebühr / Jahresbetrag). Davon hängen das 30-%-Dankeschön (SPEC-053) und die Partnerprovision 30/40 % (SPEC-054) ab. Bis dahin zeigt die App «Betrag folgt» bzw. ein Rechenbeispiel. |
| 5 | Rechtstexte | Rechtlich prüfen lassen: `public/datenschutz.html` (inkl. KI-Abschnitt), `public/empfehlungsprogramm.html` (SPEC-053), Partnerbedingungen (SPEC-054). |
| 6 | Datenschutzseite SPEC-024 | Platzhalter «[Anschrift]» ausfüllen, AVV-Satz mit Supabase bestätigen, E-Mail-Schreibweise prüfen (steht dort `bors.dolic@web.de`, vermutlich Tippfehler für `boris…`). |
| 7 | SPEC-050 offene Frage | Soll die Schrauber-Auswertung jeden Schrauber mit der **ganzen Halle** oder mit den **anderen Schraubern** (ohne ihn selbst, gleiche Farben) vergleichen? Umgesetzt ist «andere Schrauber». Empfehlung: so lassen. |
| 8 | Startseite (M1) | Welcher Hauptknopf ist gewollt: schwarz «Konto erstellen» oder weiß «Mit Google fortfahren»? |
| 9 | KI-Fotos (SPEC-052) | Sagen, welche neuen Fotos gemeint sind (bisher gefunden: nur `Bilder6aPlus/` vom September), und je Sektor Ja zum Austausch in Prod geben. Fehlende Routen in 4 Sektoren nachtragen. KI in Admin → Halle erst einschalten, wenn das Qualitätsziel erreicht ist. |
| 10 | KI-Worker | Worker-Konto anlegen, Passwort selbst in `.env.worker` schreiben, Gemini-Anmeldung ohne Training bestätigen. |
| 11 | App-Stores (SPEC-045) | Apple-Developer- und Google-Play-Konto (als Person), dann Apple Team-ID und SHA-256 aus der Play Console an Gemini geben. |
| 12 | Echte Tests | Startseite und «Sektor löschen» auf einem echten iPhone prüfen; die 210 Testpersonen waren nur simuliert. |
| 13 | Vertrieb | Partner-Nachrichten und Hallen-Ansprachen verschickt nur Hans selbst (Liste: `marketing/hallen-akquise-muenchen-frauenfeld.xlsx` im Projektordner, Strategie: `docs/vertrieb/vertriebsstrategie.md`). |

---

## 5. Nützliche Orte

- Specs: `docs/specs/INDEX.md` · Prozesse: `docs/prozesse/` · Verfassung: `CONSTITUTION.md` (§13 Tests, §14 FeatureDefinition)
- Agent-Chat: `node scripts/agent-chat.mjs status | post | set-status`
- Gesamttest-Befunde: `docs/feedback-runden/2026-10-30-gesamttest/0-testlauf-befunde.md`
- KI-Erfassung: `scripts/ai-capture/README.md`, `src/lib/aiCapture/`
- Test-Konten (SPEC-027): test-admin / test-schrauber / test-kletterer @bouldermate.ch (Passwörter hat Hans)
- Live: https://bouldermate.ch (Vercel deployt `main`)
