# Runde 2 – Auswertung und Vorschläge (SPEC-052 v2 → v3)

> Simuliert. 30 andere Personen, 10 davon Hallenpersonal/Admin. Gegenstand: SPEC-052 v2.

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | **Falsches Foto / falscher Sektor** bei «direkt live» nicht rückgängig zu machen | 3 | Theke, Admin, Tester | **hoch** |
| T2 | **Tape nicht lesbar** → Route ohne oder mit falschem Grad | 4 | Tape-Schrauber, Informatik, Wettkampf-Jugend, Schrauber | **hoch** |
| T3 | **Kamera-Knopf direkt in der Sektorliste**, Frage «ganze Wand / einzelne» **vor** dem Foto | 3 | Schrauber (3) | mittel |
| T4 | «Kurz prüfen» darf **nicht wachsen** und nicht drängeln | 2 | Hallenleiterin, Admin | mittel |
| T5 | **KI-Merkmale** fließen in Deep Dive, «Für dich», «Challenge heute» | 3 | Physio, Tester, Informatik | mittel |
| T6 | **Namen bleiben** bei zugeordneten Routen; aktive Namen nicht doppelt | 2 | Schrauberin, Tester | mittel |
| T7 | **Namensstil** klein halten: Witzig / Schlicht / Keine | 4 | Erzieherin, Vater+Kind, Informatik, Admin | niedrig |
| T8 | **Datenschutz-Text** in einem verständlichen Satz; Rollen (Halle verantwortlich, Anbieter Unterauftragsverarbeiter, kein Training) | 2 | Datenschutzbeauftragte, Gründer | mittel |
| T9 | **Status sichtbar bis fertig**, Ergebniszahl groß | 2 | Gehörlose, Seniorin | mittel |
| T10 | **Melden nur angemeldet**; Meldetexte auf Englisch | 2 | Tourist, Admin | niedrig |
| T11 | **Zähler** «Fotos diesen Monat» für Admin; wer zahlt | 3 | Controlling, Buchhaltung, Schrauber | niedrig (Grundsatz → Hans) |
| T12 | Studio auf Englisch | 1 | Schrauberin | niedrig |
| T13 | Personen automatisch unkenntlich machen | 1 | Fotografin | niedrig |

## Zitate

- T1 Elif: «Was mache ich, wenn ich den falschen Sektor fotografiert habe?»
- T2 Jan: «Lieber kein Grad als ein falscher.» – Nico: «Eine Route ohne Grad ist für mich nutzlos.»
- T3 Henrik: «Die Frage bitte vor dem Foto, danach bin ich schon weg.»
- T5 Florian: «Sonst trainiert jemand nach KI-Fantasie.»

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung | Entscheidung |
|---|-----------|--------|---------|-----------|-------------------------|--------------|
| V1 | **«Ergebnis zurücknehmen»** 24 h lang im Studio: stellt archivierte Routen und altes Foto wieder her, löscht die KI-Routen dieses Laufs (Begehungen daran gibt es in der Regel noch nicht; wenn doch, Rückfrage mit Anzahl) | hoch | mittel | 1 | stärkt | **übernehmen** (F6) |
| V2 | **Tape nicht lesbar**: Route geht mit **«Grad folgt»** live (kletterbar, abhakbar), landet in «Kurz prüfen»; nie geraten | hoch | gering | 1 | stärkt | **übernehmen** (F2) |
| V3 | **Kamera-Knopf pro Sektor** in der Studio-Sektorliste (min. 56 px); Frage «Ganze Wand neu / Nur einzelne Routen» erscheint **vor** der Kamera; neuer Sektor ohne Routen fragt nicht | hoch | gering | 1 | stärkt | **übernehmen** (F1) |
| V4 | «Kurz prüfen»: kleine Zahl ohne Rot, Einträge **verschwinden nach 7 Tagen** | mittel | gering | 2 | neutral | **übernehmen** (F8) |
| V5 | KI-Merkmale zählen wie Schrauber-Werte (gleiche Rechnung in `computeAggregatedRadar`), sind aber als «geschätzt» markiert; Kletterer-Bewertungen überstimmen sie wie bisher | mittel | gering | 2 | neutral | **übernehmen** (F4) |
| V6 | Zugeordnete Routen behalten Name, Merkmale, Begehungen; neue KI-Namen dürfen nicht einem **aktiven** Namen der Halle gleichen | mittel | gering | 2 | stärkt | **übernehmen** (F4, F5) |
| V7 | Namensstil: **Witzig (Standard) / Schlicht / Keine Namen** | niedrig | gering | 3 | neutral | **übernehmen** (F4) |
| V8 | Einschalt-Text in einem Satz + Datenschutzseite mit Rollen | mittel | gering | 2 | Pflicht | **übernehmen** (F9) |
| V9 | Status-Zeile am Sektor bleibt bis fertig: «KI erkennt Routen …», danach «12 Routen erkannt · 2 kurz prüfen» (groß, Toast + Zeile) | mittel | gering | 2 | stärkt | **übernehmen** (F7) |
| V10 | Melden nur angemeldet; Texte über `t()` auf Englisch | niedrig | gering | 3 | neutral | **übernehmen** (F8) |
| V11 | Admin → Halle: **«KI-Fotos diesen Monat: 37»** | niedrig | gering | 3 | neutral | **übernehmen** (F10) |
| V12 | Wer zahlt (Halle / BoulderMate) | – | – | – | Grundsatzfrage | **an Hans** (offene Frage O1) |
| V13 | Studio auf Englisch | niedrig | hoch | – | eigener Umfang | **verworfen** für SPEC-052; Kandidat für eigene Spec |
| V14 | Personen automatisch verpixeln | niedrig | hoch | – | eigener Umfang | **verworfen** für v1: gilt für alle Wandfotos, nicht nur KI; KI ignoriert Personen, Hinweis «ohne Personen» |
| V15 | Kletterer schlagen Namen vor | niedrig | mittel | – | würde überladen | **verworfen** (Missbrauch, Schrauber-Hoheit) |

## Nicht umsetzen

- Routen ohne Grad **verstecken**: Kletterer könnten eine real existierende Route nicht abhaken. Stattdessen «Grad folgt».
- Rote Warn-Badges für «Kurz prüfen».

## Ergebnis

2 Themen «hoch» (T1, T2), gelöst. Spec wesentlich geändert → **v3**. Weiterer Loop nötig.
