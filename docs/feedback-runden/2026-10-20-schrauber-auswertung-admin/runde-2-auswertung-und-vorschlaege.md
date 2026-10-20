# Runde 2 – Auswertung und Vorschläge (SPEC-050 v2 → v3)

> Simuliert. Grundlage: [runde-2-unterhaltung.md](runde-2-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Begehungen insgesamt sind unfair, weil sie von der Hängedauer abhängen → pro Route und Woche | 3 (Yuki, Tim, Sven) | MINT, Betreiber | **hoch** (Fairness) |
| T2 | Transparenz-Satz für Schrauber muss konkret sagen, was die Leitung sieht | 2 (Mara, Marco) | Hallenpersonal, Personalwesen | mittel |
| T3 | Schrauber ohne aktive Routen bei «An der Wand» | 3 (Ralf, Ewa, Gisela) | Hallenpersonal, Betreiber | mittel |
| T4 | Beta-Kommentare pro Route auf der Detailseite (ohne Namen) | 2 (Thomas, Ulrike) | Hallenpersonal, Ärztin | mittel |
| T5 | «Flash-Quote» unverständlich → «im ersten Versuch» | 2 (Rosa, Ahmed) | Ältere, Zweitsprache | mittel |
| T6 | Vier Sortier-Knöpfe zu eng; «Grad» unklar | 3 (Clara, Bernd, Oliver) | Einschränkungen, Handwerk, Kaufleute | mittel |
| T7 | Farbverteilung in der Übersicht – oder nicht, Übersicht soll knapp bleiben | 3 (Nina, Ines, Karl) | Trainer, Eltern, Ältere | niedrig |
| T8 | Balken leicht/passt/hart mit Wörtern | 1 (Lukas) | Farbsehschwäche | niedrig (schon in v2 §Lesbarkeit) |
| T9 | Satz zur Lieblingsroute | 1 (Petra) | Ältere | niedrig |

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Kennzahl **«Begehungen pro Woche»** (je Route: Begehungen ÷ Wochen an der Wand, mind. 1 Woche; Schnitt über die Routen), Vergleich mit Hallenschnitt gleicher Farben. Ersetzt «Begehungen gesamt» in der Übersicht | hoch | klein | **1** | stärkt (fair) |
| V2 | Konkreter Transparenz-Satz für SPEC-044 (Wortlaut Marco), an den Schrauber-Thread geben | mittel | klein | **1** | stärkt |
| V3 | Bei «An der Wand» erscheinen nur Schrauber mit mindestens einer aktiven Route; bei «Alle» alle | mittel | klein | 2 | stärkt (knapp) |
| V4 | Route auf der Detailseite antippen → klappt auf: im ersten Versuch / Top / Projekt, Grad-Gefühl, bis zu 5 neueste Beta-Kommentare ohne Namen | mittel | klein | 2 | stärkt |
| V5 | «Flash-Quote» → **«im 1. Versuch»** (z. B. «im 1. Versuch: 4 von 10») | mittel | klein | 2 | stärkt |
| V6 | Sortierung als **Auswahl in zwei Zeilen** (2 × 2 Knöpfe): «Routen» · «Sterne», «Grad passt» · «Name» | mittel | klein | 2 | neutral |
| V7 | Farbverteilung **nur auf der Detailseite** («Pro Farbe»), nicht in der Übersicht | niedrig | – | 3 | verhindert Überladung |
| V8 | Lieblingsroute mit Satz «Diese Route mögen die Leute besonders» | niedrig | klein | 3 | stärkt |

## Entscheidung (eingearbeitet in v3)

- **Übernommen:** V1, V2, V3, V4, V5, V6, V7, V8.
- **Angepasst:** V1 – Wochen = Tage an der Wand ÷ 7, mindestens 1, bei abgeschraubten Routen bis `archivedAt`.
- **Verworfen:** keine neuen Verwerfungen. «Routen von …» für Kletterer (Jan) bleibt außerhalb (SPEC-044 §11).
