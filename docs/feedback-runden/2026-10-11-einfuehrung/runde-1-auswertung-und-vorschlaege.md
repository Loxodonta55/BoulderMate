# Runde 1 – Auswertung und Vorschläge (SPEC-047 v1 → v2)

> Simuliert. Grundlage: [runde-1-unterhaltung.md](runde-1-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Bedienung nur per Wischen / Pünktchen als Fortschritt unbrauchbar; 200 % Schrift schiebt Knöpfe aus dem Bild | 4 (Clara, Hannelore, Karl, Bernd) | Ältere, Einschränkungen | **hoch** (Barriere) |
| T2 | Erfahrene Schrauber/Kletterer mit neuem Gerät sehen die Karten wieder; «gesehen» muss am Konto hängen | 4 (Mara, Ralf, Tim, Felix) | Hallenpersonal, MINT | **hoch** |
| T3 | Datenschutz-Karte muss ehrlich sagen: ohne Konto nur auf dem Handy; Spitzname ist sichtbar | 3 (Ulrike, Tim, Yuki) | Ärzte, MINT | mittel |
| T4 | QR-Zeile: darf den gescannten Boulder nicht verdecken und muss nach einmal Schließen weg sein | 4 (Thomas, Lena, Hakan, Sven) | Hallenpersonal, Pflege/Schicht | mittel |
| T5 | Einfache Wörter, gleiche Worte wie im Sheet (Flash/Top/Projekt), kindgerecht | 4 (Ahmed, Nina, Markus, Sophie) | Zweitsprache, Eltern, Trainer | mittel |
| T6 | Bild: Ausschnitt statt ganzem Screenshot; Farbe mit Namen | 3 (Sophie, Marie, Lukas) | Anfänger, Kreative, Einschränkungen | mittel |
| T7 | Zeitpunkt: nicht über der Landing-Page, erst in der App; ohne Halle allgemeines Bild | 3 (Bernd, Oliver, Sophie) | Handwerk, Kaufleute, Anfänger | mittel |
| T8 | Nach «Überspringen» sagen, wo man es wiederfindet | 2 (Hannelore, Thomas) | Ältere, Hallenpersonal | niedrig |
| T9 | Admin will Startliste «Halle startklar» statt Karten | 2 (Gisela, Sven) | Betreiber | mittel |
| T10 | Schrauber-Karte «Was darf ich?» | 1 (Aylin) | Hallenpersonal | niedrig |
| T11 | Englisch auch für die Studio-Karten | 2 (Pedro, Chloe) | Englischsprachige | niedrig |

**Zitate**
- T1: «Mit meiner linken Hand kann ich das kaum.» (Clara) – «Die Pünktchen sehe ich nicht.» (Hannelore)
- T2: «Die dürfen die Karten nie sehen. Nur wer neu in die Rolle kommt.» (Ralf)
- T4: «Erst der Boulder, dann die Zeile.» (Hakan)
- T9: «Deine Halle ist zu 2 von 4 Schritten fertig.» (Sven)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Große Knöpfe «Zurück» / «Weiter» / «Überspringen» auf jeder Karte; Wischen nur zusätzlich; Fortschritt als Text «1 von 3»; Inhalt scrollt, Knopfleiste bleibt bei 200 % sichtbar | hoch | klein | **1** | stärkt |
| V2 | «Gesehen» lokal **und** für Angemeldete in `user_metadata.bm_intro` (keine Migration); wer vor dem Stichtag schon aktiv war (Begehungen/Boulder gesetzt), gilt als gesehen | hoch | klein | **1** | stärkt |
| V3 | Karte 3 «Deine Daten»: ohne Konto auf diesem Handy; Spitzname bei «Wer war schon oben» sichtbar, abschaltbar (SPEC-033) | mittel | klein | 2 | stärkt |
| V4 | QR-Zeile unter dem Boulder-Sheet-Kopf, nie davor; Schließen merkt sich das dauerhaft | mittel | klein | 2 | stärkt |
| V5 | Texte in einfacher Sprache, gleiche Wörter wie SPEC-032 C; Satzlänge ≤ 12 Wörter | mittel | klein | 2 | stärkt |
| V6 | Bild je Karte als Ausschnitt (Punkt + drei Knöpfe), Farbe mit Namen; mit gewählter Halle deren echte Farbskala | mittel | mittel | 2 | stärkt |
| V7 | Start erst in der App (nach Hallenwahl oder beim ersten Öffnen einer Wand), nie über der Landing-Page | mittel | klein | 2 | stärkt |
| V8 | Nach «Überspringen» kurze Meldung 4 s: «Einführung jederzeit unter Ich → Einstellungen» | niedrig | klein | 3 | neutral |
| V9 | Admin: statt 2 Karten eine **Startliste «Halle startklar»** (Sektoren · Farben · Team · QR-Codes) im Tab Halle | mittel | mittel | 2 | angepasst (s. u.) |
| V10 | Schrauber-Karte 2 nennt kurz die Rechte («Du kannst Boulder setzen und umschrauben. Die Hallenleitung sieht, wer was gesetzt hat.») | niedrig | klein | 3 | stärkt |
| V11 | Alle Einführungskarten über t() auf Englisch, auch die Studio- und Admin-Karten | niedrig | klein | 3 | stärkt |

## Entscheidung (eingearbeitet in v2)

- **Übernommen:** V1, V2, V3, V4, V5, V6, V7, V8, V10, V11.
- **Angepasst:** V9 – Die Admin-Einführung bleibt kurz (2 Karten), die zweite Karte zeigt aber die **vier Schritte als Liste mit Haken** aus echten Daten (Sektor vorhanden? Farbskala? Team? QR-Codes gedruckt = mind. einmal heruntergeladen, lokal gemerkt). Kein dauerhaftes Fortschritts-Widget im Tab, das wäre ein eigenes Feature.
- **Verworfen:** keine.

## Nicht umsetzen

- Getrennte Kinder-Einführung (Markus): einfache Sprache reicht für alle (V5).
- Zählen, wer überspringt (Ulrike, Tim): kein Tracking.
