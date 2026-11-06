# Runde 2 – Auswertung und Vorschläge (SPEC-047 v2 → v3)

> Simuliert. Grundlage: [runde-2-unterhaltung.md](runde-2-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Mehrere Rollen → mehrere Einführungen hintereinander | 4 (Ralf, Gisela, Tim, Oliver) | Hallenpersonal, MINT, Kaufleute | **hoch** |
| T2 | Bildschirmleser / Tastatur: Dialog, Fokus, Esc, Zurück-Geste | 3 (Karl, Clara, Tim) | Einschränkungen, MINT | **hoch** (Barriere) |
| T3 | Hallen-Satz: jede Halle tickt anders (Farben = Bereich, Umschraubtag) | 5 (Sven, Thomas, Gisela, Pedro, Chloe) | Betreiber, Englischsprachige | mittel |
| T4 | Kein Sprachmix: englischer Hallen-Satz nur, wenn vorhanden | 3 (Tim, Ahmed, Chloe) | Zweitsprache, MINT | mittel |
| T5 | Zweite Halle: allgemeine Karten nicht wieder, Hallen-Satz einmal als Zeile | 2 (Lena, Tim) | Schicht, MINT | mittel |
| T6 | Treff/Projekte/Statistik unbekannt → Hinweise am Ort, aber feste kurze Liste, nie zwei gleichzeitig | 6 (Nina, Felix, Petra, Mehmet, Oliver, Yuki) | Trainer, Azubis, Ältere, Handwerk | mittel |
| T7 | Dunkelmodus: Bilder nicht grell; gezeichnete Grafik schärfer | 2 (Hannelore, Marie) | Ältere, Kreative | mittel |
| T8 | Anmelden nach Gast-Start: lokaler Stand ins Konto | 2 (Sophie, Tim) | Anfänger, MINT | niedrig |
| T9 | Rollen-Einführungen wieder aufrufbar (für neue Kollegen) | 2 (Mara, Ralf) | Hallenpersonal | niedrig |
| T10 | Knopf «Überspringen» gleichwertig, aber unterscheidbar | 2 (Jonas, Karl) | Studierende, Ältere | niedrig |
| T11 | Link «Mehr zum Datenschutz» auf Karte 3 | 1 (Ulrike) | Ärzte | niedrig |

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Jede Einführung startet erst beim **ersten Öffnen ihres Bereichs** (Wand → Kletterer, Studio → Schrauber, Admin → Admin); **höchstens eine pro Sitzung** | hoch | klein | **1** | stärkt |
| V2 | Barrierefreiheit: `role="dialog"`, `aria-modal`, Fokus auf Überschrift, Fokus bleibt im Dialog, Esc und Zurück-Geste = Überspringen, `aria-live` für «2 von 3» | hoch | klein | **1** | stärkt |
| V3 | Optionaler **Hallen-Satz** (≤ 140 Zeichen, DE + optional EN) im Admin-Tab Halle; erscheint auf Karte 2 | mittel | mittel (Migration: 2 Spalten an `gyms`) | 2 | stärkt |
| V4 | Englische Oberfläche zeigt nur den englischen Hallen-Satz; fehlt er, entfällt die Zeile | mittel | klein | 2 | stärkt |
| V5 | Erste Wand einer **anderen Halle**: nur eine Zeile mit dem Hallen-Satz (falls vorhanden), einmal pro Halle | mittel | klein | 2 | stärkt |
| V6 | **Hinweise am Ort** als feste Liste von 4: erstes Boulder-Sheet (SPEC-032 C), erstes Loggen (SPEC-032 D), erster Treff, erste «Meine Projekte»; nie zwei gleichzeitig, nie während der Karten | mittel | klein | 2 | stärkt (ersetzt Statistik-/Projekte-Karten) |
| V7 | Bilder als gezeichnete SVG-Ausschnitte mit Theme-Farben (hell/dunkel), keine Fotos | mittel | mittel | 2 | stärkt |
| V8 | Beim Anmelden lokalen Stand ins Konto übernehmen (ODER-Verknüpfung) | niedrig | klein | 3 | neutral |
| V9 | Einstellungen → «Einführung ansehen» mit Auswahl Kletterer / Schrauber / Admin nach Rechten | niedrig | klein | 3 | stärkt |
| V10 | «Weiter» gefüllt, «Überspringen» umrandet, beide ≥ 48 px, gleich breit | niedrig | klein | 3 | neutral |
| V11 | Kleiner Link «Mehr zum Datenschutz» auf Karte 3 → `datenschutz.html` | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v3)

- **Übernommen:** V1, V2, V4, V5, V6, V7, V8, V9, V10, V11.
- **Angepasst:** V3 – Hallen-Satz kommt, aber als **eigener kleiner Teil** (§7), der auch ohne ihn funktioniert: Die Einführung wird zuerst ohne Migration gebaut; die zwei Spalten `gyms.intro_note_de` / `intro_note_en` folgen als eigene Migration, die Hans einspielt. Bis dahin entfällt die Zeile.
- **Verworfen:** Kletterer-Karten für Admins, die nie eine Wand öffnen (Oliver) – ergibt sich von selbst aus V1.

## Nicht umsetzen

- Weitere Hinweise am Ort (Statistik, Deep Dive, Challenge): Liste bleibt bei 4 (Felix, Mehmet).
- Einführung pro Halle komplett neu: nur der Hallen-Satz (Lena).
