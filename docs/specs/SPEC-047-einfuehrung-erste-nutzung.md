# SPEC-047: Einführung beim ersten Mal

## Status: READY (v4, 2026-10-11)

> **Owner:** Hans · **Created:** 2026-10-11 · **Version:** v4 (nach 3 Loops «FeatureDefinition»)
> **Baut auf:** SPEC-011 (Landing Page), SPEC-022 (Kletterer-UX), SPEC-023 (Admin-UX), SPEC-029 (QR-Codes), SPEC-032 (Hinweise am Ort C/D, Lesbarkeit), SPEC-033 (Sichtbarkeit), SPEC-039 (Englisch via t()), SPEC-045 (App)
> **Ersetzt teilweise:** SPEC-032 C («kurze Erklärung beim ersten Boulder») und D (Spitzname-Hinweis vor dem ersten Loggen) – die Sätze bleiben, laufen aber über den gemeinsamen Speicher dieser Spec (§6).
> **Prozess:** [Loop «FeatureDefinition»](../prozesse/feature-definition.md). Grill-me am 2026-10-11, Hans: «geh immer mit der Empfehlung». Feedback-Runden: [`docs/feedback-runden/2026-10-11-einfuehrung/`](../feedback-runden/2026-10-11-einfuehrung/) (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

Wer BoulderMate zum ersten Mal öffnet, versteht **in unter einer Minute**, wozu es gut ist und wie man den ersten Boulder abhakt. Die Einführung ist **kurz, groß, kontrastreich und jederzeit überspringbar**, erscheint **einmal** und dann nie wieder von selbst. Wer per QR-Code direkt an einer Wand landet, wird **nicht aufgehalten**.

## 2. Ausgangslage

> Hinweis: Dieser Abschnitt stützt sich auf die Specs und Notizen im Projektordner; der Code-Stand wird bei der Umsetzung geprüft.

| # | Befund | Wo |
|---|---|---|
| A1 | SPEC-032 C zeigt beim ersten Öffnen des Boulder-Sheets drei Sätze zu Flash / Top / Projekt; SPEC-032 D vor dem ersten Loggen den Spitznamen-Hinweis. Beide merken sich «gesehen» nur lokal. | SPEC-032 |
| A2 | Die Landing Page (SPEC-011) erklärt BoulderMate als Werbung, nicht die Bedienung. | SPEC-011 |
| A3 | Gäste kommen oft per QR-Code direkt auf einen Boulder (SPEC-029). | SPEC-029 |
| A4 | Rollen: Kletterer, Schrauber (Studio), Hallen-Admin (Tabs Sektoren · Farben · Team · Halle). | SPEC-021/023 |
| A5 | Ohne Konto liegen Begehungen lokal; der Spitzname erscheint bei «Wer war schon oben», abschaltbar (SPEC-033). | SPEC-022/033 |
| A6 | Englisch läuft über `t()` und folgt dem Handy (SPEC-039); Studio und Admin sind sonst noch deutsch. | SPEC-039 |
| A7 | Die App (SPEC-045) zeigt beim ersten Start «Dein Konto von bouldermate.ch gilt auch hier.» | SPEC-045 |

## 3. Grill-me: Fragen und Entscheidungen (alle nach Empfehlung)

**F1 – Form?** ✔ **Drei große Karten** in einem Dialog. Keine Tour mit Pfeilen auf Knöpfe, kein Video.
**F2 – Wann?** ✔ Beim **ersten Öffnen einer Wand**, nie über der Landing Page (v2).
**F3 – QR-Gäste?** ✔ Keine Karten. Eine schmale Zeile **«Neu hier? Kurz erklärt»** unter dem Kopf des Boulder-Sheets; Tippen öffnet die Karten.
**F4 – Rollen?** ✔ Schrauber und Admins bekommen je **zwei eigene Karten** beim ersten Öffnen ihres Bereichs.
**F5 – Inhalt Kletterer?** ✔ «Worum geht's · So hakst du ab · Deine Daten».
**F6 – Wieder aufrufbar?** ✔ Ich → Einstellungen → **«Einführung ansehen»**.
**F7 – Sprache?** ✔ Deutsch und Englisch über `t()`, auch für die Studio- und Admin-Karten (v2).
**F8 – Bilder?** ✔ Ein **Ausschnitt** pro Karte statt eines ganzen Screenshots; gezeichnet (SVG) mit Theme-Farben (v3).
**F9 – SPEC-032 C/D doppeln?** ✔ Nein, **zusammenführen** in einen gemeinsamen Speicher und eine feste Liste von Hinweisen am Ort (§6).
**F10 – Messen, wer überspringt?** ✔ Nein. **Kein Tracking.**
**F11 – App?** ✔ Dieselbe Komponente in der Web-App und in der Store-App (SPEC-045).

## 4. Kletterer-Einführung

**Start:** Beim ersten Öffnen einer Wand in der App (nicht per QR-Direktlink), wenn `bm_intro.climber` nicht gesehen ist und in dieser Sitzung noch keine andere Einführung lief (v3).

Dialog `intro-dialog` mit Karten `intro-card-1` … `intro-card-3`. Jede Karte: Überschrift, höchstens drei kurze Sätze (≤ 12 Wörter, einfache Sprache, v2), ein Bild-Ausschnitt.

| Karte | Überschrift | Text (DE) | Bild |
|---|---|---|---|
| 1 | **Worum geht's?** | «Finde die Boulder deiner Halle. Hak ab, was du geschafft hast. Sieh, was andere mögen, und lies Tipps von anderen.» (v4: ohne «Beta») | Wandfoto-Ausschnitt mit drei Pins |
| 2 | **So hakst du ab** | «Tippe auf einen Punkt an der Wand. Dann wähle: ⚡ Flash = im ersten Versuch. ✓ Top = geschafft. ◎ Projekt = willst du noch schaffen.» – darunter, falls vorhanden, **der Hallen-Satz** (§7) | Pin + die drei Knöpfe, groß; mit gewählter Halle deren echte Farbskala, jede Farbe **mit Namen** (v2) |
| 3 | **Deine Daten** | «Ohne Konto bleibt alles auf diesem Handy. Mit Konto ist es sicher gespeichert. Dein Spitzname steht bei ‹Wer war schon oben›. Das kannst du abschalten.» + kleiner Link «Mehr zum Datenschutz» (v3) | Schloss-Symbol + Schalter |

**Knopfleiste** (bleibt bei 200 % Schrift immer sichtbar, Inhalt scrollt darüber, v2):
- `intro-back` «Zurück» (ab Karte 2), `intro-next` «Weiter» (gefüllt), `intro-skip` «Überspringen» (umrandet, gleich breit) – alle ≥ 48 px hoch (v3).
- Letzte Karte: `intro-done` **«Los geht's»** statt «Weiter» (v4).
- Fortschritt als Text `intro-progress` «1 von 3» (keine Pünktchen allein, v2).
- Wischen geht zusätzlich, ist aber nie nötig (v2).

**Nach «Überspringen»:** Meldung unten für 4 s `intro-skip-toast`: «Du findest die Einführung jederzeit unter Ich → Einstellungen.» (v2)

## 5. QR-Gäste und neue Hallen

- **QR-Direktlink** (SPEC-029): Das Boulder-Sheet öffnet sofort. Unter dessen Kopf, nie davor, die Zeile `intro-qr-hint` «Neu hier? **Kurz erklärt**» mit Schließen-Kreuz. Tippen öffnet die Kletterer-Karten. Schließen oder Ansehen merkt sich das dauerhaft (v2). An der Theke kann man sagen: «Tipp auf ‹Kurz erklärt›.» (v4)
- **Erste Wand einer anderen Halle** (wer die Einführung schon kennt): nur eine Zeile `intro-gym-note` mit dem Hallen-Satz, einmal pro Halle; ohne Hallen-Satz nichts (v3).

## 6. Hinweise am Ort (feste Liste, ersetzt SPEC-032 C/D)

Höchstens **ein** Hinweis gleichzeitig, nie während einer Einführung (v3). Jeder erscheint einmal, als Zeile mit «OK».

| Schlüssel | Wann | Text (DE) |
|---|---|---|
| `sheet` | erstes Öffnen eines Boulder-Sheets, **nur wenn Karte 2 nicht erreicht** | Flash / Top / Projekt wie Karte 2 (SPEC-032 C) |
| `nickname` | vor dem ersten Loggen, **nur wenn Karte 3 nicht erreicht** (v4) | «Andere sehen deinen Spitznamen bei diesem Boulder. Ändern in den Einstellungen.» (SPEC-032 D) |
| `treff` | erstes Öffnen von «Wer ist da?» | «Hier siehst du, wer heute klettert. Es gibt keinen Chat.» (v4) |
| `projects` | erstes Öffnen von «Meine Projekte» | «Hier sammelst du Boulder, die du noch schaffen willst. Mit +1 zählst du Versuche.» |

Die Liste wird nicht erweitert, ohne diese Spec zu ändern (v3).

## 7. Hallen-Satz (eigener kleiner Teil, mit Migration)

- Im Admin-Tab **Halle** zwei optionale Felder: «Ein Satz zu eurer Halle» (`gyms.intro_note_de`) und «… auf Englisch» (`gyms.intro_note_en`), je **≤ 140 Zeichen**, mit Zeichenzähler. Beispiel: «Bei uns zeigen Farben den Bereich. Neue Boulder jeden Montag.» (v3)
- Erscheint auf Kletterer-Karte 2 und in `intro-gym-note`.
- Englische Oberfläche zeigt **nur** den englischen Satz; fehlt er, entfällt die Zeile. Kein Sprachmix (v3).
- **Migration** `2026xxxx_spec047_hallen_satz.sql` (zwei Spalten, Schreibrecht wie übrige Hallenfelder nach SPEC-034). Hans spielt sie ein. Bis dahin entfällt der Satz; die übrige Einführung braucht keine Migration.

## 8. Schrauber- und Admin-Einführung

**Start:** beim ersten Öffnen von Studio bzw. Admin-Bereich, nur wenn noch nicht gesehen und in dieser Sitzung keine andere Einführung lief (v3). Wer nie eine Wand als Kletterer öffnet, sieht die Kletterer-Karten nie (v3).

**Schrauber** (`intro-setter-1/2`):
1. **Dein Studio** – «Hier setzt du Boulder. Tippe auf die Wand, wähle Farbe und Grad. Ganze Wand neu? Tippe ‹Umschrauben›.» (v4)
2. **Was du darfst** – «Du kannst Boulder setzen, ändern und abschrauben. Die Hallenleitung sieht, wer was gesetzt hat. Unter ‹Meine Routen› siehst du, wie sie ankommen.» (v2; Verweis auf SPEC-044, sobald umgesetzt)

**Hallen-Admin** (`intro-admin-1/2`):
1. **Deine Halle** – «Hier richtest du deine Halle ein. Kletterer sehen sie danach in BoulderMate.»
2. **Startklar in 4 Schritten** – Liste mit Haken **aus echten Daten** (v2, v4):
   - ✓/○ Sektoren angelegt (≥ 1 Sektor)
   - ✓/○ Farbskala festgelegt
   - ✓/○ Team eingeladen (≥ 1 weitere Person mit Rolle)
   - Knopf «QR-Codes erstellen» **ohne Haken** (Druck lässt sich nicht sicher erkennen, v4)
   Jede Zeile springt in den passenden Tab. Sind alle drei Haken gesetzt: «Alles da.»

## 9. «Gesehen» speichern

- Gemeinsamer Zustand `bm_intro` = `{ v: 1, climber: { seen, reached }, setter: { seen }, admin: { seen }, hints: { sheet, nickname, treff, projects }, gyms: [gymId…], qrHintClosed }`.
- **Lokal** (`localStorage`, in der App `@capacitor/preferences`) **und** für Angemeldete in `auth.user_metadata.bm_intro` (keine Migration) (v2).
- Zusammenführen = **ODER**: was lokal oder am Konto gesehen ist, gilt als gesehen; beim Anmelden wird der lokale Stand ins Konto übernommen (v3).
- **Altnutzer** (vor Freischaltung mit mindestens einer Begehung bzw. einem gesetzten Boulder bzw. Admin-Rolle) gelten für die jeweilige Rolle als gesehen (v2).
- Zugriffe in `try/catch`; schlägt Speichern fehl, gilt die Einführung für diese Sitzung als gesehen (nie Endlosschleife).
- `v` erlaubt, später bewusst eine neue Fassung zu zeigen – nur auf Entscheidung von Hans.

## 10. App (SPEC-045)

- Dieselbe Komponente. Neue Nutzer sehen die Karten; der Satz «Dein Konto … gilt auch hier» entfällt dann (Karte 3 erklärt das Konto). Wer schon «gesehen» hat, sieht nur den Satz (v4).
- Bilder liegen im App-Paket, kein Netz nötig; der Hallen-Satz kommt mit den lokal gespeicherten Hallendaten (v4).

## 11. Wieder ansehen

Ich → Einstellungen → `settings-intro` «Einführung ansehen» mit Auswahl **Kletterer · Schrauber · Admin**, je nach Rechten (v3). Zeigt die Karten, ändert nichts am Gesehen-Stand.

## 12. Lesbarkeit und Barrierefreiheit (Hans, SPEC-032)

- Überschrift ≥ 24 px, Text ≥ 18 px, Knöpfe ≥ 48 px hoch; Kontrast ≥ 4,5 : 1 in hell und dunkel; funktioniert bei 200 % Schrift (v2).
- Farbe nie allein: Farbpunkte mit Farbnamen, Flash/Top/Projekt mit Symbol **und** Wort.
- `role="dialog"`, `aria-modal="true"`, Fokus auf die Überschrift, Fokus bleibt im Dialog; **Esc und Zurück-Geste = Überspringen**; «2 von 3» per `aria-live` (v3).
- Überblenden ≤ 200 ms, bei «Bewegung reduzieren» keine Animation; keine Töne, keine Vibration (v4).
- Bilder mit Alternativtext.

## 13. Umsetzung (Plan)

- `src/lib/introState.ts` – reine Funktionen: `loadIntroState`, `mergeIntroState(local, remote)` (ODER), `shouldShowIntro(role, ctx)`, `nextPlaceHint(key, state)`, `isLegacyUser(role, data)`, `adminChecklist(gymData)`.
- `src/components/intro/IntroDialog.tsx` (Karten, Knopfleiste, Fokus), `IntroCards.ts` (Inhalte je Rolle, alle Texte über `t()`), `IntroQrHint.tsx`, `PlaceHint.tsx`, SVG-Ausschnitte unter `src/components/intro/art/`.
- Einbau: Wand-Ansicht (Kletterer), `BatchBoulderWorkflow.tsx` (Schrauber), `GymManagement.tsx` (Admin, Tab Halle für den Hallen-Satz), Boulder-Sheet (QR-Zeile, Hinweise `sheet`/`nickname`), Treff, Meine Projekte, Einstellungen.
- SPEC-032 C/D: bestehenden Code auf `PlaceHint` umstellen, alte lokale Schlüssel beim ersten Laden in `bm_intro` übernehmen.
- Übersetzungen DE/EN in den `t()`-Dateien; englische Texte vor Freigabe von einer englischsprachigen Person gegenlesen (offen für Hans, v4).

## 14. Akzeptanzkriterien

- **AC-1** Neues Gerät ohne Konto: erstes Öffnen einer Wand zeigt `intro-dialog` mit 3 Karten; nach «Los geht's» oder «Überspringen» erscheint er nie wieder von selbst.
- **AC-2** Jede Karte hat `intro-next`/`intro-done` und `intro-skip`, ab Karte 2 `intro-back`; `intro-progress` zeigt «n von 3»; Bedienung ohne Wischen möglich.
- **AC-3** Esc und Zurück-Geste schließen wie «Überspringen»; danach `intro-skip-toast`.
- **AC-4** QR-Direktlink: das Boulder-Sheet ist sofort sichtbar, kein Dialog; `intro-qr-hint` unter dem Sheet-Kopf; Schließen merkt sich das dauerhaft; Tippen öffnet die Karten.
- **AC-5** Landing Page zeigt nie die Einführung.
- **AC-6** Angemeldet mit `user_metadata.bm_intro.climber.seen` auf neuem Gerät: keine Karten. Altnutzer mit Begehungen: keine Karten.
- **AC-7** Pro Sitzung höchstens eine Einführung; nie gleichzeitig mit einem Hinweis am Ort.
- **AC-8** Hinweise am Ort nur nach §6; `sheet` und `nickname` entfallen, wenn Karte 2 bzw. 3 erreicht wurde.
- **AC-9** Schrauber-Karten beim ersten Öffnen des Studios, Admin-Karten beim ersten Öffnen des Admin-Bereichs; Admin-Karte 2 zeigt Haken für Sektoren, Farbskala, Team aus echten Daten und «QR-Codes erstellen» ohne Haken.
- **AC-10** Hallen-Satz (nach Migration): Karte 2 zeigt ihn in der passenden Sprache; englisch ohne `intro_note_en` keine Zeile; ≤ 140 Zeichen.
- **AC-11** Englisches Handy: alle Einführungstexte englisch, auch Studio und Admin.
- **AC-12** `settings-intro` zeigt die Auswahl nach Rechten.
- **AC-13** Lesbarkeit nach §12, auch bei 200 % Schrift und im Dunkelmodus.
- **AC-14** App: Neue sehen die Karten statt des Konto-Satzes.

## 15. Nicht Teil dieser Spec

- Interaktive Tour mit Pfeilen auf echte Knöpfe, Video, Ton.
- Eigene Kinder-Einführung (einfache Sprache gilt für alle).
- Zählen, wer überspringt, oder andere Auswertung (kein Tracking).
- «Was ist neu» nach Updates.
- Dauerhaftes Fortschritts-Widget «Halle startklar» im Admin-Tab.
- Weitere Hinweise am Ort (Statistik, Deep Dive, Challenge).

## 16. Tests (CONSTITUTION §13, bei Umsetzung)

**Unit (Vitest)**
- `tests/spec047IntroState.test.ts`: ODER-Zusammenführen lokal/Konto, Altnutzer-Regel, eine Einführung pro Sitzung, Hinweis-Auswahl (nie zwei, `reached`-Regel), Admin-Checkliste, Fehler beim Speichern.
- `tests/spec047IntroDialog.test.tsx`: Karten, Knöpfe, «n von 3», Esc, Fokus, Toast, Englisch, Hallen-Satz-Sprachregel.

**Playwright (`tests/e2e/einfuehrung.spec.ts`, Desktop und Mobile Chrome)**
- Neues Gerät → Wand → 3 Karten → «Los geht's» → Neuladen: keine Karten.
- QR-Link → Sheet sofort, Zeile «Kurz erklärt» → schließen → neuer Scan: keine Zeile.
- Überspringen → Toast → Einstellungen → «Einführung ansehen».
- Schrauber und Admin über Test-Konten (SPEC-027): eigene Karten, Admin-Haken.
- 200 % Schrift (Viewport-Zoom): Knopfleiste sichtbar.

## 17. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-11 | – | Grill-me F1–F11, alles nach Empfehlung (→ v1) | – |
| 1 | 2026-10-11 | **hoch:** nur Wischen/Pünktchen, 200 % schiebt Knöpfe weg; **hoch:** Erfahrene sehen Karten auf neuem Gerät wieder; mittel: Daten-Karte, QR-Zeile, Sprache, Bild, Zeitpunkt, Admin-Startliste | Große Knöpfe + «1 von 3» + feste Knopfleiste; «gesehen» am Konto, Altnutzer-Regel; ehrliche Daten-Karte; QR-Zeile unter dem Sheet-Kopf; einfache Sprache; Ausschnitt mit Farbnamen; Start erst an der Wand; Toast; Rechte-Satz; Admin-Haken; alles englisch (→ v2) | Kinder-Einführung (einfache Sprache reicht); Überspringen zählen (kein Tracking) |
| 2 | 2026-10-11 | **hoch:** mehrere Rollen → Einführungen hintereinander; **hoch:** Bildschirmleser/Tastatur; mittel: Hallen-Satz, Sprachmix, zweite Halle, Treff/Projekte unbekannt, Dunkelmodus | Start pro Bereich, max. 1 pro Sitzung; Dialog-Semantik, Esc/Zurück; Hallen-Satz DE/EN mit eigener Migration; neue Halle = eine Zeile; feste Liste von 4 Hinweisen am Ort; SVG mit Theme-Farben; Anmelden übernimmt lokalen Stand; Auswahl in Einstellungen (→ v3) | Weitere Hinweise (Überladung); komplette Einführung pro Halle |
| 3 | 2026-10-11 | mittel: Animation, App-Satz doppelt, QR-Haken unzuverlässig; sonst niedrig | Reduzierte Bewegung, keine Töne; App ohne doppelten Satz; QR als Knopf ohne Haken; Spitzname-Hinweis nur ohne Karte 3; «Umschrauben» erwähnt; Treff «kein Chat»; «Beta» raus; «Los geht's» (→ v4) | – |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen in Loop 3 nur Feinschliff → Status **READY**.
