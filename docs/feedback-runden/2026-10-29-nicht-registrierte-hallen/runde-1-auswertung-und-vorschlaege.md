# Runde 1 – Auswertung und Vorschläge (Spec v1 → v2)

> SPEC-053 · 2026-10-29 · simuliert

## Kritikpunkte

| # | Kritik | Wer | Schwere |
|---|---|---|---|
| K1 | Kunden, die das Thekenpersonal für Geld «bearbeiten», sind unangenehm; Personal entscheidet nicht | Katrin, Nils, Lukas | **hoch** |
| K2 | Geld fürs Weitersagen wirkt wie Schneeballsystem; Halle muss davon wissen | Jürgen, Andreas, Rafael, Greta | **hoch** |
| K3 | 100 graue Pins verdecken die aktive Halle; App wirkt leer | Leonie, Stefan, Marco | mittel |
| K4 | Hellgrau unlesbar | Ilse, Rolf | mittel |
| K5 | «In meiner Nähe» muss die nächste Halle zeigen, auch wenn sie nicht aktiv ist | Hanna | mittel |
| K6 | Ohne Betrag glaubt das keiner | Kemal | mittel |
| K7 | Link muss bei der Halle eine eigene Seite öffnen, nicht Login | Nils, Elena | mittel |
| K8 | Nach dem Wunsch passiert nichts sichtbar | Aylin, Fatima | mittel |
| K9 | Code nicht mit Namen; vorlesbar (keine 0/O, 1/I) | Julia, Sara | niedrig |
| K10 | Jugendliche wollen mitmachen; Alter unbekannt | Jonas, Ben, Tom | niedrig |
| K11 | Infoblatt zum Ausdrucken nutzt keiner; lieber großer QR auf dem Handy | Rolf, Nils | niedrig |
| K12 | Abrechnung: Gutschrift braucht Name/Adresse, «netto ohne MwSt.» | David | niedrig |
| K13 | Romandie/Tessin fehlen; Italienisch | Chloé, Paolo | niedrig |
| K14 | Barrierefreiheit der Hallen | Nora | niedrig |
| K15 | Bild für Instagram | Mia | niedrig |

## Vorschläge und Entscheidung

| # | Vorschlag | Entscheidung |
|---|---|---|
| V1 (K1) | «Mit der Halle reden» empfiehlt: **einmal**, freundlich, Link an die **Hallenleitung** (E-Mail-Adresse der Halle aus dem Verzeichnis, sonst Kontaktformular der Website), nicht ans Thekenpersonal drängen. Wunsch-Zähler ist das Hauptargument. Plattform-Admin (Hans) bekommt eine Liste «Meiste Wünsche» und schreibt Hallen selbst an. | **übernehmen** |
| V2 (K2) | Im UI **«Dankeschön»** statt «Provision». Satz «Eine Stufe, kein Schneeballsystem: Du bekommst nur etwas für die Halle, die du selbst vermittelst.» Die Seite für die Halle sagt offen: «Diese Empfehlung kommt von einem eurer Kletterer. Er oder sie bekommt von BoulderMate ein Dankeschön; euch kostet das nichts extra.» | **übernehmen** |
| V3 (K3) | Schalter **«Nur aktive Hallen»** über der Liste; aktive Pins liegen immer obenauf (z-Index) und sind größer; graue Pins kleiner (36 px Tippfläche bleibt ≥ 44 px durch Rand). | **übernehmen** |
| V4 (K4) | Grauer Pin = **weiß gefüllt, dicker dunkelgrauer gestrichelter Rand** (#4A4744, Kontrast ≥ 7:1 auf Kartenhintergrund), aktive = voll schwarz. Schild «Noch nicht dabei» dunkler Text auf hellem Grund mit Rahmen. | **übernehmen** |
| V5 (K5) | Mit Standort: **eine** Liste nach Entfernung, aktive und nicht aktive gemischt (Schild unterscheidet). Ohne Standort: zwei Abschnitte, aktive zuerst, dann «Noch nicht bei BoulderMate» alphabetisch. | **übernehmen** |
| V6 (K6) | Konfig `EINFUEHRUNGSGEBUEHR_CHF`; ist sie gesetzt, zeigt die App «Dein Dankeschön: CHF X (30 %)». Sonst «30 % der Einführungsgebühr». **Hans-Entscheidung: Betrag.** | **übernehmen** |
| V7 (K7) | Geteilter Link öffnet **Seite «Für Hallen»** (ohne Login): Hallenname, Wunsch-Zahl, was BoulderMate kann (3 Punkte), Knopf «Demo ansehen» (6a plus als Gast), «Kontakt aufnehmen» (mailto hallen@bouldermate.ch mit Hallenname und Code vorausgefüllt). | **übernehmen** |
| V8 (K8) | Nach dem Wunsch: «Danke! Du bist Nummer 12.» und Zeile unter «Ich → Halle empfehlen»: «Gewünscht: Boulderlounge Winterthur». Wird die Halle aktiv: einmaliger Hinweis (G13). | **übernehmen** |
| V9 (K9) | Code zufällig, 6 Zeichen aus `ACDEFGHJKLMNPQRTUVWXY3479`, Form `BM-XXXXXX`, groß und gesperrt angezeigt. | **übernehmen** |
| V10 (K10) | Wünschen und Teilen ohne Code für alle; **Code nur nach Haken «Ich bin mindestens 18 und akzeptiere die Teilnahmebedingungen»**. Geteilter Link ohne Code funktioniert genauso, nur ohne Dankeschön. | **übernehmen** |
| V11 (K11) | A6-PDF streichen; statt dessen **«QR an der Theke zeigen»**: großer QR-Code (Vollbild, weiß auf schwarz-frei, hell) mit demselben Link. | **übernehmen** |
| V12 (K12) | Teilnahmebedingungen: Auszahlung nur nach Zahlungseingang + 30 Tage; Gutschrift mit Name/Adresse, per E-Mail abgefragt; 30 % vom Nettobetrag. | **übernehmen** |
| V13 (K13) | Text «Bisher Deutschschweiz. Halle fehlt? Melden» (mailto). Sprachen bleiben DE/EN (SPEC-039). | **übernehmen**; Italienisch/Französisch verworfen (eigene Spec) |
| V14 (K14) | Barrierefreiheit | **verworfen** (keine Daten; eigene Spec) |
| V15 (K15) | Instagram-Bild | **verworfen** für v1 (Aufwand; Text + Link reichen) |
