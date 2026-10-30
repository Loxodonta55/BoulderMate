# Runde 3 – Unterhaltung: KI erfasst Routen aus dem Sektorfoto (SPEC-052 v3)

> Simuliert, kein echtes Nutzerfeedback. Datum: 2026-10-27. Gegenstand: SPEC-052 v3 (Kamera-Knopf in der Sektorliste, «Grad folgt», «Ergebnis zurücknehmen» 24 h, Namensstil, «Kurz prüfen» läuft nach 7 Tagen ab).
> **Leitfrage:** Bleibt noch etwas, das den Einsatz in der Pilot-Halle verhindert oder Kletterern schadet?
> Neue Mischung: Schwerpunkt Hallenleitung/Admins und Kletterer, die die Ergebnisse sehen.

## Teilnehmende

| # | Name | Alter | Beruf / Population | Kletterniveau | Gerät | Erwartung |
|---|------|-------|--------------------|---------------|-------|-----------|
| 1 | Stefan | 45 | Hallenleiter der Pilot-Halle | 6b | iPhone | Schrauber entlasten |
| 2 | Kim | 30 | Schrauberin, Pilot-Halle | 7a | Android | 15 Sekunden |
| 3 | Andi | 26 | Schrauber, Pilot-Halle | 7b+ | iPhone | Namen taufen |
| 4 | Martina | 53 | Theke Frühschicht | 5a | Android, große Schrift | Fragen beantworten können |
| 5 | Georg | 64 | pensionierter Ingenieur, Hallen-Admin | 5c | PC | Kontrolle |
| 6 | Pia | 35 | Schrauberin, Mutter | 6c | iPhone | schnell, Kind wartet |
| 7 | Robert | 42 | Hallen-Admin, Polizist | 6a | Android | klare Einstellungen |
| 8 | Aylin | 28 | Physiotherapeutin | 6b | iPhone | Merkmale |
| 9 | Jörg | 60 | Maurer, Kletterer seit 30 Jahren | 6a | altes Android | Grade |
| 10 | Nele | 18 | Abiturientin | 5c | iPhone | Namen |
| 11 | Frank | 39 | Rot-Grün-Schwäche, Koch | 5c | Android | Farben |
| 12 | Sarah | 33 | Ärztin, Schichtdienst | 6a+ | iPhone | was ist neu |
| 13 | David | 27 | Kanadier, Software | 6c | iPhone | English |
| 14 | Hilde | 70 | Rentnerin, Seniorenkurs | 4a | iPad | lesbar |
| 15 | Bastian | 31 | Wettkampf-Routensetzer | 7c | Pixel | Pins genau |
| 16 | Emine | 41 | Mutter, Reinigungskraft | 4c | Android | einfach |
| 17 | Max | 22 | Student BWL | 6b | iPhone | Kosten |
| 18 | Laura | 29 | Sehbehindert (Restsehen 20 %), Juristin | 5a | iPhone, VoiceOver | Screenreader |
| 19 | Uwe | 50 | Elektriker | 6a | Android | Funkloch |
| 20 | Carina | 24 | Theke, Studentin Psychologie | 5c | iPhone | Beschwerden |
| 21 | Tom | 36 | Fotograf, Hobby | 6a | iPhone Pro | Bildqualität |
| 22 | Jasmin | 19 | Azubi Friseurin, Anfängerin | 4b | iPhone | wenig Text |
| 23 | Holger | 58 | Unternehmer, Hallen-Investor | 5a | iPhone | Imagewirkung |
| 24 | Mira | 32 | Lehrerin, Englisch | 6a | iPhone | Sprache |
| 25 | Ali | 37 | Taxifahrer | 5c | Android | abends kurz |
| 26 | Johanna | 26 | KI-Forscherin | 6c | Pixel | Qualität messen |
| 27 | Ben | 44 | Trainer Ü40-Gruppe | 6b | Android | Routen für Gruppe |
| 28 | Leni | 12 + Mutter Petra 43 | Kind mit Mutter (Bäckerin) | 4c / 4a | Mutters iPhone | Tiernamen |
| 29 | Konrad | 55 | Hallen-Admin zweier Hallen, IT | 6a | PC | mehrere Hallen |
| 30 | Ella | 21 | Studentin Design | 6a+ | iPhone | Optik |

## Gespräch

**Stefan (Leiter Pilot-Halle):** Ich habe das unseren Schraubern so erklärt: Kamera-Symbol neben dem Sektor, «Ganze Wand neu», Foto, Handy weg. Das versteht jeder. Das war unser Hauptproblem.

**Kim (Schrauberin):** Ja. Ich habe es gezählt: zehn bis fünfzehn Sekunden. Einziger Wunsch: Wenn die Kamera aufgeht, soll da ein Rahmen sein, damit ich weiß, ob die ganze Wand drauf ist.

**Tom (Fotograf):** Ein Rahmen geht nur mit eigener Kamera-Ansicht. Die System-Kamera ist besser, die kann jeder. Der Satz «ganze Wand, gerade davor» reicht.

**Andi (Schrauber):** Ich will meine Route taufen, das geht laut Spec mit einem Tap im Studio. Aber dann muss ich mich erinnern, welcher Pin meiner ist.

**Bastian (Wettkampf-Setter):** Die KI kann mit dem Namen vom Fotografen nichts anfangen, aber der Schrauber, der das Foto macht, steht bei allen Routen als Schrauber drin. Bei uns schraubt jede Wand aber ein Team.

**Georg (Admin):** Dann wird der Fotograf als Schrauber eingetragen, und wer will, ändert es. Wie bisher: Standard ist der letzte Schrauber.

**Robert (Admin):** Das passt, das ist ja auch für die Schrauber-Statistik wichtig.

**Johanna (KI-Forscherin):** Was mir fehlt: Bevor ihr das in der Pilot-Halle live schaltet, wie wisst ihr, dass es gut genug ist? Ihr braucht einen Testsatz: 20 echte Sektorfotos, bei denen ihr die richtigen Routen kennt, und messt, wie viele gefunden werden.

**Konrad (IT, zwei Hallen):** Und das Ergebnis pro Halle, weil jede Halle anderes Licht und andere Farben hat.

**Johanna:** Ich würde vor dem Einschalten mindestens 90 % gefundene Routen und 95 % richtige Farbe verlangen.

**Holger (Investor):** Gut. Peinliche Fehler in der ersten Woche sind schlimmer als ein paar Tage später starten.

**Martina (Theke):** Wenn mich eine Kundin fragt, warum der Grad falsch ist, was sage ich dann?

**Carina (Theke):** «Tipp auf ‹Stimmt was nicht?›, dann sieht es der Schrauber.» Das ist eine gute Antwort.

**Frank (Rot-Grün-Schwäche):** Ich habe eine Frage zu «Grad folgt»: Ist das dann grau? Grau sieht bei mir wie eine echte Farbe aus.

**Ella (Design):** Dann lieber ein Fragezeichen statt einer Farbe im Grad-Feld, plus der Text «Grad folgt».

**Laura (Screenreader):** Der Kamera-Knopf braucht eine Beschriftung für VoiceOver: «Foto für Sektor Slab Vorne». Und die Statuszeile muss vorgelesen werden, wenn sie sich ändert.

**Hilde (Seniorin):** Die Zahl «12 Routen erkannt» schön groß. Und nicht in Hellgrau.

**Aylin (Physio):** Bei den Merkmalen: «geschätzt» ist gut. Wo steht das genau? Ich will nicht lauter kleine Hinweise überall.

**Ben (Ü40-Trainer):** Einmal im BoulderSheet neben «Merkmale», das reicht.

**Jörg (Maurer):** Mir ist das alles egal, solange die Grade stimmen. Und die stimmen, wenn die Farbe stimmt.

**Nele (Abiturientin):** Die Namen in «Witzig»: bitte nicht dieselben fünf Witze in jeder Halle.

**Johanna:** Die KI bekommt die aktiven Namen der Halle mit. Hallenübergreifend wiederholt sich vielleicht etwas, das ist okay.

**Leni (Kind):** Ich will, dass die Route «Faultier» heißt.

**Petra (Mutter):** Tiernamen sind ja bei «Witzig» mit drin. Passt.

**Pia (Schrauberin, Mutter):** Wenn das Kind am Rockzipfel zieht und ich das Foto abbreche, ist dann was kaputt?

**Uwe (Elektriker):** Abbrechen vor dem Auslösen ändert nichts. Und wenn das Hochladen hängt, macht die App es später.

**Max (BWL):** Die Kosten stehen jetzt drin, 10 bis 25 Cent pro Foto. Das ist für eine Halle nichts. Wer zahlt, entscheidet Hans.

**Konrad:** Für mich als Admin zweier Hallen: Der Schalter «KI-Erfassung» ist pro Halle, richtig? Gut.

**David (Canada):** "Something wrong?" in English, good. Is the route name translated? – Okay, it's a name, fine.

**Mira (Lehrerin):** Englisch passt so.

**Sarah (Ärztin):** Ich sehe abends «Neu» an den Routen, wie bisher. Mehr brauche ich nicht.

**Emine (Mutter):** Ich auch. Für mich ändert sich nichts, das ist gut.

**Jasmin (Anfängerin):** Mir auch.

**Ali (Taxifahrer):** Geht schnell, ja.

**Andi:** Letzte Sache: Wenn ich im Studio einen Pin von Hand verschiebe, darf die KI ihn beim nächsten Teil-Umbau nicht wieder zurückschieben.

**Johanna:** Zugeordnete Routen behalten ihre Position, die KI liefert nur die Zuordnung. So steht es schon in v3.

**Stefan:** Dann sind wir durch. Ich will es testen.
