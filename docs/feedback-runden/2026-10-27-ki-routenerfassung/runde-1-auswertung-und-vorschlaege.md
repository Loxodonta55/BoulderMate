# Runde 1 – Auswertung und Vorschläge (SPEC-052 v1 → v2)

> Simuliert. 30 Personen, 11 davon Hallenpersonal oder Hallen-Admin. Gegenstand: SPEC-052 v1.

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Grad steht in vielen Hallen am **Tape**, nicht an der Griff-Farbe | 4 | Schrauber (fremde Halle), Hallen-Admin, Fotografin | **hoch** |
| T2 | **Zwei Routen gleicher Farbe** in einem Sektor, geteilte Volumes | 5 | Schrauber, Entwickler, Trainer | **hoch** |
| T3 | **Umschrauben teilweise**: alte Route als neu erkannt (Tops weg) oder umgekehrt | 5 | Schrauber, Entwickler, Admin | **hoch** |
| T4 | **Datenschutz**: Personen im Foto, Foto an KI-Anbieter, Halle muss zustimmen | 3 | Steuerberaterin, Juristin, Ältere | **hoch** |
| T5 | **Direkt live oder erst prüfen** | 5 | Hallenleitung, Inhaber, Schrauber | mittel |
| T6 | **Farberkennung bei Hallenlicht** (Neon, Chalk, Orange/Rot) | 4 | Theke/Grafik, Fotografin, Entwickler, Rot-Grün-Schwacher | mittel |
| T7 | **Fehler melden** und **übersehene Route** melden | 5 | Hebamme, Trainer, Hallenleitung, Schrauberin | mittel |
| T8 | **Namen**: Schrauber wollen taufen, keine peinlichen/anzüglichen Namen; Namen helfen Kindern und Farbschwachen | 7 | Schrauberin, Schüler, Eltern, Rot-Grün-Schwacher | mittel |
| T9 | **Merkmale aus dem Foto** sind nur Schätzung; Anfänger verstehen sie nicht | 5 | Studenten, Trainer, Kursleiterin, Anfängerin | mittel |
| T10 | **Pin am Startgriff** | 3 | Trainer, Jugendtrainerin, Seniorin | mittel |
| T11 | **Kosten und Obergrenze** | 3 | Inhaber, Kette, Entwickler | mittel |
| T12 | **Foto-Hinweis**: ganze Wand, gerade, ohne Personen, kein Blitz – in einem Satz | 3 | Fotografin, Theke | niedrig |
| T13 | **Offline / Funkloch**: Foto später senden, nicht warten | 2 | Dachdecker, Aushilfe | mittel |
| T14 | **Große, kontrastreiche Statusanzeige** | 2 | Optiker, Seniorin | niedrig |
| T15 | Englische Oberfläche, Namen bleiben in Hallensprache | 1 | Touristin | niedrig |

## Zitate

- T1 Thomas: «Bei uns sagt die Griff-Farbe gar nichts über den Grad. Der Grad steht am Start-Tape.»
- T2 Hakan: «Wenn die KI aus zwei gelben Routen eine macht, fehlt eine.»
- T3 Marco: «Wenn sie eine alte Route für neu hält, verlieren die Leute ihre Tops.»
- T4 Julia: «Fotos von Personen an einen KI-Anbieter, ohne dass das irgendwo steht, ist heikel.»
- T5 Marco: «Wenn Prüfen Standard ist, macht es am Ende keiner.»
- T7 Petra: «Eine übersehene Route kann man gar nicht melden, weil es sie nicht gibt.»

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung | Entscheidung |
|---|-----------|--------|---------|-----------|-------------------------|--------------|
| V1 | Admin → Farben: Schalter **«Grad steht an: Griff-Farbe / Tape»**. Bei Tape bekommt jede Route zusätzlich eine Griff-Farbe (zum Finden). | hoch | mittel | 1 | stärkt (Boulder finden) | **übernehmen** (F2, neue Spalte `hold_color`) |
| V2 | KI bekommt **Farbliste der Halle** (Name + Hex) und darf nur daraus wählen | hoch | gering | 1 | stärkt | **übernehmen** (F3) |
| V3 | KI trennt Routen gleicher Farbe räumlich; jede Route mit **Sicherheit 0–1** | hoch | gering (Prompt) | 1 | stärkt | **übernehmen** (F3) |
| V4 | Beim Foto **ein Tap: «Ganze Wand neu» / «Nur einzelne Routen neu»**; bei «einzelne» wird das alte Foto mitgeschickt und die KI ordnet zu | hoch | mittel | 1 | stärkt | **übernehmen** (F5) |
| V5 | Bei unsicherer Zuordnung **alte Route behalten** (Tops bleiben) und in «Kurz prüfen» legen | hoch | gering | 1 | stärkt | **übernehmen** (F5) |
| V6 | Hallen-Einstellung **«KI-Ergebnis: direkt live (Standard) / erst prüfen»** | mittel | gering | 2 | neutral | **übernehmen** (F6) |
| V7 | KI-Erfassung pro Halle **einmal einschalten** (Admin, mit Datenschutz-Hinweis); Datenschutzseite ergänzen; KI ignoriert Personen | hoch | gering | 1 | Pflicht | **übernehmen** (F9) |
| V8 | **«Stimmt was nicht?»** an der Route (Farbe/Grad falsch · gibt es nicht · Pin falsch) und **«Hier fehlt eine Route»** per Tipp aufs Wandfoto; gesammelt in «Kurz prüfen» statt Einzelnachrichten | hoch | mittel | 2 | stärkt | **übernehmen** (F8) |
| V9 | Namen: KI-Name immer änderbar (ein Tap im Studio), **familienfreundlich**, keine Personen-/Markennamen, eindeutig in der Halle; Halle wählt **Namensstil** | mittel | gering | 2 | stärkt (Kinder, Farbschwache) | **übernehmen** (F4) |
| V10 | Merkmale als **«geschätzt»** markieren, bis 3 Kletterer bewertet haben; KI-Werte vorsichtig (nur 1 oder 5 bei klarem Bild) | mittel | gering | 2 | neutral | **übernehmen** (F4) |
| V11 | Pin am **Startgriff** | mittel | gering | 2 | stärkt | **übernehmen** (F3) |
| V12 | **Obergrenze** 30 Fotos pro Halle und Tag; Kostenschätzung in der Spec | mittel | gering | 2 | neutral | **übernehmen** (F10) |
| V13 | Foto wird **im Hintergrund** hochgeladen und auf dem Server verarbeitet, App darf zu, Funkloch → später senden | hoch | mittel | 1 | stärkt | **übernehmen** (F7) |
| V14 | Ein Satz Foto-Hinweis über dem Auslöser; Foto **nicht** unter 2000 px verkleinern | niedrig | gering | 3 | neutral | **übernehmen** (F1) |
| V15 | Mehrere Fotos pro Sektor (Panorama) | mittel | hoch | – | würde überladen | **verworfen** für v1: zu breite Sektoren in Admin teilen; Handy-Panorama-Modus geht als ein Foto |
| V16 | KI schätzt zusätzlich den genauen Fb-Grad innerhalb der Farbe | niedrig | gering | – | Fehlerquelle | **verworfen**: Farbe gibt den Bereich vor, genauer Grad kommt aus Grad-Gefühl der Kletterer (SPEC-022 F24) |

## Nicht umsetzen

- **Pflicht-Prüfschritt für Schrauber**: widerspricht dem Anlass (keine Handyzeit). Nur als Hallen-Einstellung.
- **Einzelbenachrichtigungen pro Fehlermeldung**: nervt Schrauber; Meldungen sammeln.
- **Namen auf Englisch übersetzen**: Namen sind Eigennamen, bleiben in Hallensprache; nur die Oberfläche ist zweisprachig.

## Ergebnis

4 Themen «hoch» (T1–T4), alle mit Vorschlägen gelöst. Spec wesentlich geändert → **v2**.
