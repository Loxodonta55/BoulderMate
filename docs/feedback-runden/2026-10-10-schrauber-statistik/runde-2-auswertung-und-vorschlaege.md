# Runde 2 – Auswertung und Vorschläge (SPEC-044 v2 → v3)

> Simuliert. Grundlage: [runde-2-unterhaltung.md](runde-2-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Unklar, was die Hallenleitung sieht → Misstrauen | 5 (Kemal, Martin, Svenja, Theresa, Ole) | Hallenpersonal, Juristin, Handwerk | **hoch** (Vertrauen, Nutzung bricht weg) |
| T2 | Lange Liste ohne Ordnung (35+ Routen) | 3 (Benedikt, Paul, Jens) | Schrauber, MINT, Handwerk | mittel |
| T3 | «Was ist neu seit letztem Mal?» fehlt | 4 (Paul, Jana, Rüdiger, Hendrik) | Schrauber, MINT, Ältere, Kaufleute | mittel |
| T4 | Grad-Gefühl sagt nicht, **warum** eine Route hart ist | 4 (Marco, Stefan, Jakob, Paul) | Schrauber/Handwerk, Trainer, Kader | mittel |
| T5 | Barrierefreiheit: gedämpfte Zeilen, Screenreader, Tap-Größe | 4 (Gerhard, Wolfgang, Nadia, Jens) | Ältere, Einschränkungen, Handwerk | mittel |
| T6 | Hinweis-Karten nicht rot/alarmierend | 2 (Elif, Ursula) | Kreative, Ältere | niedrig |
| T7 | Rechenweg «Halle: 3,6» unklar | 2 (Anja, Paul) | Kaufleute, MINT | niedrig |
| T8 | Wünsche außerhalb: Englisch, Antworten auf Beta, Kinder-Anteil, Trends, Teilen, Schadensmeldung | 7 (Liam, Kemal, Fatma, Mila, Hendrik, Vincent, Doris) | gemischt | – |

**Zitate**
- T1: «‹Glaube ich› ist das Problem. Wenn das in der App nicht klar steht, gehen die Leute vom Schlimmsten aus.» (Kemal)
- T3: «Ich gucke montags rein. Mich interessiert: Was ist seit letztem Montag passiert?» (Jana)
- T4: «Wenn da steht ‹7 von 10 finden sie hart›, weiß ich nicht, warum.» (Marco)
- T5: «Grau auf Weiß lese ich nicht.» (Gerhard)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | **Transparenz-Zeile**: was die Hallenleitung sieht, was nur der Schrauber sieht | hoch | klein | **1** | stärkt (Vertrauen) |
| V2 | **Sortierung** Neueste / Beliebteste / Wenig geklettert (3 Knöpfe, ≥ 48 px) | mittel | klein | 2 | stärkt |
| V3 | Zeile **«Seit deinem letzten Blick»** (+Begehungen, +Bewertungen, +Beta) | mittel | klein | 2 | stärkt |
| V4 | **Top-2-Merkmale** aus dem Radar im Routen-Sheet, ab 3 Bewertungen | mittel | klein | 2 | stärkt |
| V5 | Kontrast ≥ 4,5 : 1 auch für gedämpfte Zeilen; Kacheln mit Vorlese-Satz (`aria-label`); Tap ≥ 48 px | mittel | klein | 2 | stärkt (Barrierefreiheit) |
| V6 | Hinweis-Karten neutral, nur die positive farbig betont | niedrig | klein | 3 | neutral |
| V7 | Untertitel «Halle, gleiche Farben: 3,6» statt nur «Halle» | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v3)

- **Übernommen:** V1, V2, V3, V4, V5, V6, V7.
- **Verworfen:**
  - **Englisch jetzt** (Liam, Kemal): bleibt bei «mit dem ganzen Studio» (§11).
  - **Antworten auf Beta** (Fatma): führt zu Chat, Namen und Moderation (Jana, Theresa); eigenes Feature.
  - **Anteil Kinder/Alter der Kletterer** (Mila): Profildaten, Datenschutz (Theresa).
  - **Pfeile Woche gegen Woche** (Hendrik): ist Verlauf, Grill-me F10.
  - **Teilen-Knopf** (Vincent): Screenshot reicht (Kemal).
  - **Schadensmeldung** (Doris): gehört ins Nutzer-Feedback (SPEC-026).

## Nicht umsetzen

- Frei konfigurierbare Filter (Sektor, Farbe, Datum) – drei Sortierungen reichen (Paul).
- Rote Warnkarten – wirken wie Fehler (Elif).
