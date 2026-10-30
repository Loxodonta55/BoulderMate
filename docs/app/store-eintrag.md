# Store-Eintrag BoulderMate (SPEC-045, Entwurf zum Eintragen)

> Hans prüft und trägt ein. Texte kurz (Runde 2: «Drei Sätze. Was es ist, was es kostet, was man braucht.»).

## Name und Untertitel

| | Deutsch | English |
|---|---|---|
| Name | BoulderMate (Ersatz, falls belegt: BoulderMate – Boulder-Tagebuch) | BoulderMate |
| Untertitel (Apple, max. 30) | Boulder finden, loggen, bewerten | Bouldering log for your gym |
| Kurzbeschreibung (Google, max. 80) | Boulder in deiner Halle finden, Tops loggen, Routen bewerten. Kostenlos. | Find boulders in your gym, log your sends, rate problems. Free. |
| Stichwörter (Apple, max. 100) | boulder,bouldern,kletterhalle,klettern,tick,logbuch,tagebuch,flash,top,grad | bouldering,climbing,gym,logbook,tick,send,flash,grade,boulder |
| Kategorie | Sport | Sports |

## Beschreibung

**Deutsch**

BoulderMate zeigt dir die Boulder deiner Halle auf dem Foto der Wand. Du loggst Flash, Top oder Projekt mit einem Tipp und siehst, welche Routen den anderen gefallen.

Kostenlos für Kletterer und Hallen, ohne Werbung und ohne Tracking. Dein Konto von bouldermate.ch gilt auch in der App.

- QR-Code an der Wand scannen: die Wand öffnet sich sofort
- Funktioniert auch im Keller ohne Netz; Einträge werden nachgesendet
- Große Schrift, Nummern an jedem Boulder, Farben immer mit Namen
- Für Schrauber: Wandfotos direkt mit der Handy-Kamera

Auf dem iPad läuft die App im iPhone-Format; dort ist bouldermate.ch im Browser bequemer.

**English**

BoulderMate shows the boulders of your gym on a photo of the wall. Log flash, top or project with one tap and see which problems others enjoy.

Free for climbers and gyms, no ads, no tracking. Your bouldermate.ch account works in the app.

- Scan the QR code on the wall and the wall opens right away
- Works without signal in the basement; entries are sent later
- Large text, a number on every boulder, colours always named
- For setters: wall photos straight from the phone camera

On iPad the app runs in iPhone size; bouldermate.ch in the browser is more comfortable there.

## Screenshots (4 Stück, große Schrift, echte Wände)

1. Wand mit Pin-Nummern und Farbnamen
2. Boulder-Details mit Grad, Sternen, «Flash · Top · Projekt»
3. «Ich» mit Statistik
4. QR-Scanner an der Wand
Größen: iPhone 6,9" (1320 × 2868) · Android-Handy (1080 × 1920 oder größer) · Google zusätzlich Grafik 1024 × 500.

## Datenschutz-Angaben (Apple «App Privacy») / Datensicherheit (Google)

| Daten | Erhoben | Mit Person verknüpft | Zweck | Tracking |
|---|---|---|---|---|
| E-Mail-Adresse | ja | ja | App-Funktion (Anmeldung) | nein |
| Name (Anzeigename) | ja | ja | App-Funktion | nein |
| Nutzer-ID | ja | ja | App-Funktion | nein |
| Fotos (nur Schrauber: Wandfotos) | ja | ja | App-Funktion | nein |
| Weitere Nutzerinhalte (Profilbild, Treff-Einträge) | ja | ja | App-Funktion | nein |
| Spielinhalt / Aktivität (Begehungen, Bewertungen) | ja | ja | App-Funktion | nein |
| Standort, Kontakte, Gesundheit, Finanzen, Werbe-ID, Absturz-/Nutzungsanalyse | **nein** | – | – | – |

- Google: Daten werden **verschlüsselt übertragen** (HTTPS): ja · **Löschen auf Wunsch**: ja, in der App unter Einstellungen → Konto löschen, und per E-Mail · Weitergabe an Dritte: nein (Supabase und Vercel sind Auftragsverarbeiter).
- Apple «Tracking»: **Nein** (keine Werbe-ID, kein «Erlauben, dass die App dich verfolgt?»).
- Datenschutz-Adresse: `https://bouldermate.ch/datenschutz.html` (muss vorher fertig sein, kein «Entwurf»).

## Altersfreigabe (Fragebogen ehrlich)

- Nutzer können Inhalte erstellen und sehen (Anzeigenamen, Profilbilder, Treff «Wer ist da?») → **ja**
- Nutzer können privat miteinander chatten → **nein**
- Gewalt, Glücksspiel, Alkohol usw. → **nein**
- Melden und Ausblenden: Treff (SPEC-028/036) hat es; Personen (Name, Bild) überall mit SPEC-046 (Voraussetzung vor dem Einreichen). Regeln: `https://bouldermate.ch/regeln.html`

## Hinweise für die Prüfer (App Review / Google)

- Zugang: `test-kletterer@bouldermate.ch` (SPEC-027), Passwort trägt Hans im Store-Formular ein (nicht hier).
- Demo-Halle mit echten Wandfotos und mindestens 20 Bouldern wählen («Halle wählen» oben).
- QR-Scanner: Knopf oben rechts. Ein Bild eines Wand-QR-Codes der Demo-Halle (SPEC-029) als Anhang für die Prüfer mitschicken.
- Konto löschen: Ich → Zahnrad → Konto löschen → «LÖSCHEN» eintippen.
- Melden und Ausblenden (SPEC-046): Wand → Boulder → «Wer war schon oben» → Person antippen → «Melden» / «Ausblenden». Vorher sicherstellen, dass dort in der Demo-Halle mindestens `test-schrauber` mit einer Begehung steht.
