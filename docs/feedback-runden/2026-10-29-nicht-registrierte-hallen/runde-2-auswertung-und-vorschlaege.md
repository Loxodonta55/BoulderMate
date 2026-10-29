# Runde 2 – Auswertung und Vorschläge (Spec v2 → v3)

> SPEC-053 · 2026-10-29 · simuliert

## Kritikpunkte

| # | Kritik | Wer | Schwere |
|---|---|---|---|
| K1 | Halle darf nie als «hat abgelehnt» erscheinen; ausgeblendete Halle sammelt keine Wünsche | Andreas | **hoch** |
| K2 | Vier gleich große Knöpfe im Hallen-Blatt, unklar was wichtig ist | Sophie, Greta, Elena, Aylin | mittel |
| K3 | Wunsch-Zahl 1 oder 2 wirkt traurig und verrät Personen | Marco, Rafael, Stefan | mittel |
| K4 | «Kontakt aufnehmen» per mailto geht am Hallen-PC nicht | Katrin, Elena | mittel |
| K5 | Schalter «Nur aktive Hallen» soll gemerkt werden | Leonie | mittel |
| K6 | «Betrag folgt» statt Schweigen | Kemal | niedrig |
| K7 | «Eine Stufe, kein Schneeballsystem» ganz oben | Jürgen | niedrig |
| K8 | Dankeschön bleibt, auch wenn die Halle später kündigt (nach 30 Tagen) | David | niedrig |
| K9 | QR weiß, mit Rand | Nils, Rolf | niedrig |
| K10 | Teilen-Text per Du, drei Sätze | Paolo, Mia | niedrig |
| K11 | Leerer Zustand unter «Ich» | Fatima | niedrig |
| K12 | Liste «Meiste Wünsche» mit Ort und E-Mail | Lukas | niedrig |
| K13 | Klick-Zähler für geteilte Links | Ben | niedrig |

## Vorschläge und Entscheidung

| # | Vorschlag | Entscheidung |
|---|---|---|
| V1 (K1) | Es gibt **keinen** Status «abgelehnt» im UI. Ausgeblendete Hallen erscheinen nirgends und nehmen keine Wünsche an (RLS: Insert nur, wenn Halle sichtbar). | **übernehmen** |
| V2 (K2) | Hallen-Blatt: großer Hauptknopf **«Ich will BoulderMate hier»** (bzw. «Gewünscht ✓ · zurücknehmen»), darunter Zweitknopf **«Mit der Halle reden»**, darunter eine Zeile mit Textlinks «Website» · «Navigation». | **übernehmen** |
| V3 (K3) | Zahl erst ab **3**: «12 Kletterer wünschen sich BoulderMate hier». Darunter «Sei unter den Ersten». Die Seite «Für Hallen» zeigt die Zahl ebenfalls erst ab 3. | **übernehmen** |
| V4 (K4) | Seite «Für Hallen»: Adresse `hallen@bouldermate.ch` groß mit **Kopieren**-Knopf, Code groß mit Kopieren-Knopf, zusätzlich mailto-Knopf. | **übernehmen** |
| V5 (K5) | Schalter-Stellung in localStorage (pro Gerät). | **übernehmen** |
| V6 (K6) | Ohne Betrag: «30 % der Einführungsgebühr (Betrag folgt)». | **übernehmen** |
| V7 (K7) | Satz ganz oben im Blatt «Mit der Halle reden» unter der Überschrift «Dankeschön». | **übernehmen** |
| V8 (K8) | In Teilnahmebedingungen: einmal ausgezahlt, bleibt es, auch bei späterer Kündigung. | **übernehmen** |
| V9 (K9) | QR-Vollbild: weißer Grund, Ruhezone 4 Module, mind. 260 px, Text «Scannen für die Hallenleitung». | **übernehmen** |
| V10 (K10) | Teilen-Text: «Hallo zusammen! Ich klettere gern bei euch und würde mich freuen, wenn ihr eure Routen in BoulderMate zeigt. [n Kletterer wünschen sich das schon.] Infos für euch: <Link>» | **übernehmen** |
| V11 (K11) | Leerer Zustand «Halle empfehlen»: ein Satz + Knopf «Halle auf der Karte suchen». | **übernehmen** |
| V12 (K12) | Admin-Liste «Meiste Wünsche» (Plattform-Admin): Halle, Ort, Wünsche, E-Mail/Website. | **übernehmen** (als SQL-Abfrage/RPC in v1; eigene Admin-Ansicht später) |
| V13 (K13) | Klick-Zähler | **verworfen** (Tracking, Datenschutz) |
