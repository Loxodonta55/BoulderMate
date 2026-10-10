# SPEC-032: Kletterer-Basis – App-Icon, Offline, Lesbarkeit, erste Schritte, Beta-Spoilerschutz

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-020 (Design «Kreide»), SPEC-022 (Kletterer-UX), SPEC-003 (Boulder-Sheet, Beta)
>
> **Anlass:** Simulierte Nutzer-Runde mit 30 Kletterern (`/mnt/project-files/nutzer-simulation/`), Vorschläge **A**, **B**, **C** und **I**. Die Runde ist simuliert, kein echtes Nutzerfeedback.
> Geplant nach der Grill-me-Methode. Hans hat vorgegeben: **jede Frage nach der Empfehlung.**

---

## 1. Ausgangslage (Code-Stand 2026-10-09)

| # | Befund | Wo |
|---|---|---|
| A1 | Kein Web-Manifest, kein App-Icon. Auf dem Startbildschirm landet nur ein Lesezeichen mit Browser-Leiste. | `index.html`, `public/` |
| A2 | Eine Begehung wird lokal gespeichert und **einmal** nach Supabase geschickt. Schlägt das fehl (kein Netz), wird es **nie wiederholt**. Der nächste Abgleich von Supabase kann den lokalen Stand sogar überschreiben (z. B. «Top» offline geloggt, Server hat noch «Projekt»). | `ratingAndAscentService.logAscent`, `syncService.syncRatingsAndAscentsQuietly` |
| A3 | Der Nutzer sieht nie, ob etwas noch nicht gesendet ist. | – |
| A4 | Beschriftung unter den drei Zahlen in «Ich» ist 13 px (Rest 15–17 px). | `MeView.tsx` |
| A5 | «Rückgängig»-Toasts stehen 4 s (mit Sternen 6 s). Für Menschen, die erst die Brille aufsetzen, zu kurz. | `BoulderSheet.tsx` |
| A6 | Der Pin zeigt den Anfangsbuchstaben der Farbe oder ein Status-Symbol. Bei Rot-Grün-Schwäche sind die Pins nicht zu unterscheiden; man kann einen Boulder nicht benennen («die 7»). | `WallPhotoCanvas.tsx` |
| A7 | Begriffe Flash/Top/Projekt, Soft/Fair/Stiff und «Font» werden nirgends erklärt. | `BoulderSheet.tsx`, `RatingModal.tsx` |
| A8 | Beta-Kommentare stehen offen in den Details und verraten die Lösung. | `BoulderSheet.tsx` |

---

## 2. Grill-me: Fragen und Entscheidungen

### App-Icon und Offline (A)

**F1 – Wie wird BoulderMate zur «richtigen» App auf dem Handy?**
✔ *Entschieden (Empfehlung):* Web-Manifest (`public/manifest.webmanifest`) mit Name «BoulderMate», `display: standalone`, Farben aus «Kreide», Icons 192 px, 512 px und «maskable» 512 px, dazu `apple-touch-icon` (180 px) für iPhone. Kein Installations-Pop-up.
*Warum:* Wolfgang findet die App nicht. Ein Pop-up widerspricht «ruhig» (SPEC-028 Leitlinie).

**F2 – Braucht es einen Service Worker (Offline-Cache)?**
✔ *Entschieden (Empfehlung):* **Nein, nicht in dieser Runde.** Daten liegen schon lokal (localStorage). Ein Cache für die App-Dateien kann nach einem Vercel-Deploy alte Versionen festhalten; das Risiko ist größer als der Nutzen.
*Warum:* Was fehlt, ist das Nachsenden (F3), nicht das Laden der App.

**F3 – Was passiert mit Einträgen ohne Netz?**
✔ *Entschieden (Empfehlung):* Eine **Sende-Warteschlange** für Begehungen und Bewertungen (anlegen, ändern, löschen). Schlägt das Senden fehl, kommt der Eintrag in die Warteschlange (`boulderapp_pending_sync_v1`). Sie wird beim Start, beim Ereignis `online` und nach jedem erfolgreichen Senden abgearbeitet. Solange ein Eintrag wartet, überschreibt der Abgleich von Supabase diesen Boulder nicht.
*Warum:* Behebt A2. Ohne das wäre jede Anzeige (F4) eine Lüge.

**F4 – Wie sieht der Nutzer, dass etwas wartet?**
✔ *Entschieden (Empfehlung):* (a) Nach dem Loggen ohne Netz sagt der Toast «Top gespeichert · wird gesendet, sobald Netz da ist». (b) Im Kletterer-Header erscheint ein kleiner Chip **«Offline»** (Wolke durchgestrichen + Wort), solange das Gerät offline ist oder etwas wartet. Tippen zeigt «3 Einträge warten. Sie werden automatisch gesendet.» Ist alles gesendet, verschwindet der Chip ohne Meldung.
*Warum:* Georg und Max wussten im Keller nicht, ob ihr Top gespeichert ist. Symbol immer mit Wort (Lesbarkeits-Regel).

### Lesbarkeit (B)

**F5 – Welche Texte werden größer?**
✔ *Entschieden (Empfehlung):* Beschriftung der drei Zahlen in «Ich» 15 px; Legende der Grad-Pyramide 14 px. Neue Untergrenze für Kletterer-Seiten: **14 px** für Nebentexte, 15 px für Beschriftungen.
*Warum:* Rainer sah «47» und wusste nicht, was es ist.

**F6 – Wie lange bleibt «Rückgängig» stehen?**
✔ *Entschieden (Empfehlung):* Jeder Toast mit einer Aktion steht mindestens **8 Sekunden**. Toasts ohne Aktion bleiben wie bisher.
*Warum:* Rainer wünschte 5 s; 8 s geben Spielraum für die Brille, ohne zu stören (der Toast verdeckt nichts Wichtiges).

**F7 – Wie unterscheidet man Pins ohne Farbe?**
✔ *Entschieden (Empfehlung):* Jeder Boulder bekommt eine **Nummer pro Wand**. Die Nummer steht groß im Pin (Schriftfarbe hell oder dunkel je nach Grifffarbe, damit der Kontrast stimmt) und vorne in der Listenzeile. Nummeriert wird nach Reihenfolge des Schraubens (Datum der Veröffentlichung, dann Anlage), damit Nummern stabil bleiben: Neue Boulder bekommen die nächste Nummer; nach dem Umschrauben beginnt die Wand wieder bei 1. Der Status (Flash/Top/Projekt) steht nur noch im Abzeichen am Pin; neu gibt es auch ein Abzeichen für «Projekt» (◎).
*Warum:* Patrick (Rot-Grün-Schwäche) und Elif («Probier mal die 7»). Status wandert ins Abzeichen, damit die Nummer immer sichtbar ist.

**F8 – Dunkler Modus?**
✔ *Entschieden (Empfehlung):* Nebentext-Farbe `--bm-text-2` im dunklen Modus etwas heller, sodass Kontrast ≥ 4,5 : 1 auf `--bm-surface` gilt (WCAG AA). `--bm-text-3` nur für Deko, nie für lesbaren Text.

### Erste Schritte (C)

**F9 – Wie lernt man die Begriffe?**
✔ *Entschieden (Empfehlung):* Beim **ersten** Öffnen eines Boulders steht über den drei Log-Knöpfen eine Karte mit drei Zeilen: «⚡ Flash – im ersten Versuch geschafft», «✓ Top – geschafft», «◎ Projekt – willst du noch schaffen», dazu ein Satz zur Sichtbarkeit (siehe SPEC-033) und ein Knopf **«Verstanden»**. Danach nie wieder (Merker im Gerät).
*Warum:* Julia und Dennis; Sophie will es nicht jedes Mal sehen.

**F10 – Und Soft/Fair/Stiff und «Font»?**
✔ *Entschieden (Empfehlung):* Ein rundes **«?»** (44 px Tippfläche) neben «Soft · Fair · Stiff» (Details und Bewerten-Fenster) und neben dem Grad im Sheet-Kopf. Tippen klappt **einen Satz** auf: «Soft = fühlt sich leichter an als angeschrieben, Fair = passt, Stiff = fühlt sich schwerer an.» bzw. «Font ist die übliche Boulder-Skala (z. B. 6a). Jede Halle ordnet ihre Farben einem Font-Bereich zu.» Nochmal tippen klappt zu.

### Beta-Spoilerschutz (I)

**F11 – Wie wird Beta vor Spoilern geschützt?**
✔ *Entschieden (Empfehlung):* Der Abschnitt «Beta» ist zugeklappt: eine Zeile **«Beta anzeigen (3)»**. Tippen öffnet Liste und Eingabefeld. Gibt es keine Beta, steht «Beta schreiben». Kein Merker: jedes Öffnen beginnt zugeklappt.
*Warum:* Hannah hat sich ihr Projekt verdorben. Billig, kein Nachteil.

---

## 3. Akzeptanzkriterien

- **AC-1** `index.html` verlinkt `manifest.webmanifest`, `theme-color` und `apple-touch-icon`; das Manifest hat `name`, `short_name`, `start_url: "/"`, `display: "standalone"` und Icons 192/512/maskable.
- **AC-2** Schlägt das Senden einer Begehung oder Bewertung fehl, steht sie in der Warteschlange; nach `online` wird sie gesendet und aus der Warteschlange entfernt.
- **AC-3** Ein wartender Eintrag wird vom Abgleich mit Supabase nicht überschrieben.
- **AC-4** Offline oder mit wartenden Einträgen zeigt der Kletterer-Header den Chip «Offline»; Tippen zeigt die Anzahl. Ohne Wartendes und mit Netz ist kein Chip da.
- **AC-5** Loggen ohne Netz zeigt im Toast «… gespeichert · wird gesendet, sobald Netz da ist».
- **AC-6** Beschriftungen der drei Zahlen in «Ich» sind ≥ 15 px.
- **AC-7** Toasts mit Aktion stehen ≥ 8 s.
- **AC-8** Jeder Pin der Kletterer-Wand zeigt seine Nummer; die Listenzeile zeigt dieselbe Nummer. Nummern folgen der Schraub-Reihenfolge und ändern sich nicht, wenn ein Filter aktiv ist.
- **AC-9** Projekt-Pins haben ein Abzeichen «◎».
- **AC-10** Erste-Schritte-Karte erscheint beim ersten Öffnen eines Boulders und nach «Verstanden» nie wieder.
- **AC-11** «?» neben Soft/Fair/Stiff und neben dem Grad klappt einen Erklärsatz auf und zu.
- **AC-12** Beta ist beim Öffnen der Details zugeklappt («Beta anzeigen (n)»); Tippen zeigt Kommentare und Eingabe.

---

## 4. Tests (CONSTITUTION §13)

- Unit: `tests/spec032KlettererBasis.test.tsx` (Manifest-Datei, Warteschlange `pendingSync`, Pin-Nummern `boulderNumbers`, Toast-Dauer, Erste-Schritte-Karte, «?»-Erklärungen, Beta zugeklappt, Offline-Chip).
- Playwright: `tests/e2e/kletterer-basis.spec.ts` (Manifest erreichbar, Nummer im Pin und in der Liste, Erste-Schritte-Karte nur einmal, Beta zugeklappt, Offline-Chip mit `context.setOffline(true)` und Nachsenden nach `setOffline(false)`).

## 5. Nicht Teil dieser Spec

- Service Worker / Offline-Cache der App-Dateien (F2).
- Installations-Hinweis oder -Knopf.
- Eigene Einstellung «Große Schrift» (zuerst die Untergrenzen anheben, dann beobachten).

## Umsetzung (2026-10-09)
- Umgesetzt wie entschieden. Abweichung F4: Ist man online und es warten noch Einträge, zeigt der Chip «Senden …» statt nur offline.
- F8 Kontrast: `--bm-text-3` ist hell #736E67, dunkel #948E85 (beide ≥ 4,5:1 auf Hintergrund und Fläche, Test in `tests/spec032KlettererBasis.test.tsx`).
- Testdateien: tests/spec032KlettererBasis.test.tsx; tests/e2e/spec032-kletterer-basis.spec.ts
