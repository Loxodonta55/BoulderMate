# Runde 2 – Auswertung und Vorschläge (SPEC-048 v2 → v3)

> Simuliert. Grundlage: [runde-2-unterhaltung.md](runde-2-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Liga-Einteilung unklar und anfällig: Glückstreffer, Wechsel mitten im Monat, Neue | 6 (Tim, Yuki, Lea, Nina, Felix, Sophie) | MINT, Anfänger, Trainer, Azubis | **hoch** |
| T2 | Liga-Namen («Einsteiger», «Liga 3») wirken abwertend oder unverständlich | 4 (Hannelore, Karl, Petra, Lukas) | Ältere, Lehrkräfte, Einschränkungen | mittel |
| T3 | Kleine Ligen («Platz 1 von 2») | 2 (Gisela, Yuki) | Betreiber, MINT | mittel |
| T4 | Eigene Zeile: Ziel statt Urteil; kompakte Liste mit Nachbarn | 4 (Petra, Mehmet, Jonas, Clara) | Lehrkräfte, Handwerk, Studierende, Einschränkungen | mittel |
| T5 | Herausgenommene Person soll es erfahren, ohne Diskussion | 3 (Sven, Ulrike, Thomas) | Hallenpersonal, Ärzte | mittel |
| T6 | «Ich» wird voll; Challenge und Rangliste zusammenfassen | 3 (Sophie, Oliver, Ines) | Anfänger, Kaufleute, Eltern | mittel |
| T7 | Hinweis «eigene Routen zählen nicht», «Projekte zählen nicht» | 3 (Mara, Aylin, Ahmed) | Hallenpersonal, Zweitsprache | niedrig |
| T8 | Zeitzone, Nachtragen | 3 (Tim, Pedro, Hakan) | MINT, Englischsprachige, Schicht | niedrig |
| T9 | Englisch: «League», Farbnamen übersetzen | 1 (Chloe) | Englischsprachige | niedrig |
| T10 | Wünsche: Glückwunsch-Knopf, Beamer-Ansicht | 3 (Nina, Sven, Jonas) | Trainer, Betreiber | – |

**Zitate**
- T1: «Dann reicht ein Glückstreffer in Blau, und ich bin für immer in der oberen Liga.» (Tim)
- T2: «Nennt sie nach den Farben. Dann klingt es nicht nach Schulnote.» (Petra)
- T4: «‹Noch 20 Punkte bis Platz 13›. Das ist ein Ziel, kein Urteil.» (Mehmet)
- T5: «Kommentarlos verschwinden ist schlimmer als ein Satz.» (Ulrike)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Liga = höchste Liga, in deren Farben man in den 8 Wochen vor Monatsbeginn **mindestens 3 Tops** hat; festgelegt am Monatsanfang; **Aufstieg im Monat** ab dem Tag nach dem 3. Top in einer höheren Liga, Punkte gehen mit; Abstieg nur zum Monatswechsel; Neue starten unten | hoch | klein | **1** | stärkt |
| V2 | Liga-Namen aus den Farben: «Liga Gelb–Grün» (Farbnamen ausgeschrieben, übersetzt) | mittel | klein | 2 | stärkt |
| V3 | Liga mit **weniger als 3** Teilnehmenden wird mit der nächstniedrigeren zusammengelegt (unterste mit der nächsthöheren) | mittel | klein | 2 | stärkt |
| V4 | Eigene Zeile: «Noch 20 Punkte bis Platz 13»; Liste: Top 10, «…», Platz davor, du, Platz danach; Zeilen ohne Tipp-Aktion | mittel | klein | 2 | stärkt |
| V5 | Herausgenommene Person sieht im Sheet einen festen Satz mit Verweis auf die Theke; kein Begründungsfeld | mittel | klein | 2 | stärkt |
| V6 | In «Ich» **ein Block «Wettbewerb»**: je eine Zeile für laufende Challenge und Rangliste | mittel | klein | 2 | stärkt (weniger Last) |
| V7 | «So zählt's» ergänzt: «Projekte und deine eigenen Routen zählen nicht.» | niedrig | klein | 3 | neutral |
| V8 | Monat nach Ortszeit der Halle (Europe/Berlin); gewertet wird der Zeitpunkt des Loggens | niedrig | klein | 3 | neutral |
| V9 | Englisch «League», Farbnamen über t() | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v3)

- **Übernommen:** V1–V9.
- **Angepasst:** keine.
- **Verworfen:**
  - **Glückwunsch-Knopf** (Nina): Interaktion zwischen Personen braucht Melden/Blockieren (SPEC-046, Ulrike); später.
  - **Beamer-Ansicht** (Sven, Jonas): eigene Zustimmung nötig, gehört zu SPEC-012 (Wettkämpfe); später.
  - **Nachtragen rückdatieren** (Hakan): Randfall, einfache Regel schlägt perfekte Regel (Tim).
