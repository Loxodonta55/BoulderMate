# SPEC-052 · Loops 4–6: Grad-Markierung je Halle (simuliert, kein echtes Nutzerfeedback)

Anlass (Hans, 2026-10-29): «Es ist in den Hallen unterschiedlich gehandhabt, wie die Schwierigkeitsgrade an den Routen erkennbar sind. Das 6a plus hat den Zettel am Startstein mit der Farbe. Andere Hallen haben die Farbe der Steine, wieder andere haben Symbole angeschrieben. Am besten bauen wir in der Hallen-Admin-Seite die Möglichkeit ein, dies zu individualisieren.»

## Grill-me (nach Empfehlung, Hans: «geh immer mit der Empfehlung»)

| # | Frage | Entscheidung |
|---|---|---|
| G13 | Welche Arten? | drei: Farbe der Griffe · farbiger Zettel am Start · Zeichen am Start (Zahl, Sterne, Fb-Grad) |
| G14 | Wo einstellen? | Admin → Halle, im Abschnitt «Routen per Foto erkennen» (dort, wo der Tape-Schalter schon steht) |
| G15 | Zeichen ↔ Grad | je Farbe des Farbsystems ein Textfeld, mehrere Schreibweisen mit Komma |
| G16 | Sonderfälle | ein freies Hinweis-Feld an die KI (≤ 300 Zeichen) statt weiterer Schalter |
| G17 | Art je Sektor? | nein, vorerst je Halle |

## Runde 1 (30 Personen: 6 Hallen-Admins, 8 Schrauber, 6 Kletternde 50+, 4 Thekenkräfte, 3 Jugendliche, 3 Barrierefreiheit/Sehbehinderung)

Top-Kritik
- **hoch** – Admin einer Kletterhalle mit Zahlen-Schildern: «Bei uns gibt es keine Farben, nur Zahlen 1–8.» → Art «Zeichen am Start», Zuordnung zu den Einträgen des Farbsystems (die Farbe ist dort nur der Name des Bereichs).
- **mittel** – Schrauberin: «Wir schreiben mal 6a+, mal 6A+.» → mehrere Schreibweisen, Vergleich ohne Groß/Klein und Leerzeichen.
- **mittel** – Thekenkraft 58: «Tape, Symbol – was ist gemeint?» → Klartext-Knöpfe mit einem Beispielsatz, untereinander statt nebeneinander.
- niedrig – Kinderrouten mit Tierbildern, Wettkampfrouten: Hinweis-Feld.
Verworfen: Art je Sektor (selten, Hinweis-Feld genügt), Beispielfoto hochladen (später).

## Runde 2

- **hoch** – Schrauber: «Wenn der Admin falsch eingestellt hat, merke ich das erst an falschen Graden.» → Studio zeigt «KI liest den Grad an: …» unter dem Kamera-Knopf.
- **mittel** – Admin: leeres Zeichen-Feld → Hinweis direkt darunter; solche Routen bekommen «Grad folgt», nie geraten.
- **mittel** – Datenschutz/Technik: Hinweis-Feld als Hintertür in die KI → nur Admins, ≤ 300 Zeichen, im Auftrag ausdrücklich als Information der Halle markiert.
Verworfen: Fb-Grad automatisch aus dem Zeichen ableiten (Fehlerquelle; die Zuordnung reicht).

## Runde 3

Keine «hoch». Wechsel der Art gilt nur für neue Fotos; Admin und Studio bleiben deutsch (O2). → v5 READY.
