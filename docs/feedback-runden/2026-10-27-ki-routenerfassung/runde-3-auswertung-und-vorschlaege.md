# Runde 3 – Auswertung und Vorschläge (SPEC-052 v3 → v4)

> Simuliert. 30 neue Personen, 9 aus Hallenleitung/Schrauber/Theke/Admin, dazu Screenreader-Nutzerin, Senioren, Kinder, Englischsprachige. Gegenstand: SPEC-052 v3.

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | **Qualität messen vor dem Einschalten** (Testsatz mit echten Fotos, Schwellen) | 3 | KI-Forscherin, IT-Admin, Investor | mittel |
| T2 | **Screenreader**: Kamera-Knopf beschriften, Statusänderung vorlesen | 1 | Sehbehinderte | mittel |
| T3 | **«Grad folgt»** nicht als graue Farbe darstellen (Farbschwache) | 2 | Rot-Grün-Schwacher, Designerin | mittel |
| T4 | **Schrauber-Zuordnung**: wer fotografiert, steht als Schrauber drin, änderbar | 3 | Setter, Admins | niedrig |
| T5 | «geschätzt» nur **einmal** im BoulderSheet | 2 | Physio, Trainer | niedrig |
| T6 | Manuell verschobene Pins bleiben beim Teil-Umbau | 2 | Schrauber, KI-Forscherin | niedrig (in v3 schon gelöst, Klarstellung) |
| T7 | Kamera-Rahmen | 2 | Schrauberin, Fotograf | niedrig |
| T8 | Namen nicht immer dieselben Witze | 1 | Abiturientin | niedrig |

Keine Kritik mit Schweregrad **hoch**. Kletterer ohne Schrauber-Rolle berichten: für sie ändert sich nichts außer «Stimmt was nicht?» (gewünscht).

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung | Entscheidung |
|---|-----------|--------|---------|-----------|-------------------------|--------------|
| V1 | **Qualitäts-Tor**: Skript mit ≥ 20 echten Sektorfotos der Pilot-Halle; Einschalten erst bei ≥ 90 % gefundenen Routen und ≥ 95 % richtiger Farbe (bzw. Tape-Grad) | hoch | mittel | 1 | stärkt | **übernehmen** (F11, AC-17) |
| V2 | `aria-label` «Foto für Sektor <Name>» am Kamera-Knopf, Statuszeile mit `aria-live="polite"` | mittel | gering | 1 | Pflicht | **übernehmen** (F1, F7) |
| V3 | «Grad folgt» als **Fragezeichen-Symbol** mit Text, nicht als graue Farbe | mittel | gering | 2 | stärkt | **übernehmen** (F2) |
| V4 | Schrauber = wer das Foto macht (Standard), änderbar wie bisher | niedrig | gering | 3 | neutral | **übernehmen** (F5) |
| V5 | «geschätzt» einmal neben der Überschrift der Merkmale im BoulderSheet | niedrig | gering | 3 | neutral | **übernehmen** (F4) |
| V6 | Klarstellung: zugeordnete Routen behalten Position, Name, Merkmale | niedrig | – | 3 | – | **übernehmen** (Text F5) |
| V7 | Eigene Kamera-Ansicht mit Rahmen | niedrig | hoch | – | würde überladen | **verworfen**: System-Kamera ist vertraut und robust; ein Satz Hinweis reicht |
| V8 | Namen hallenübergreifend eindeutig | niedrig | mittel | – | unnötig | **verworfen**: nur innerhalb der Halle eindeutig |

## Nicht umsetzen

- Eigene Kamera-Ansicht (s. V7).
- Weitere Hinweise «KI» an Routen für Kletterer: «geschätzt» an den Merkmalen genügt.

## Ergebnis

Keine Kritik «hoch», Änderungen klein. Abbruchregel erfüllt nach Loop 3 → **v4, READY**.
