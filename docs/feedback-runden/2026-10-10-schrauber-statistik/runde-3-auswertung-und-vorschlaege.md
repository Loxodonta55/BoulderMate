# Runde 3 – Auswertung und Vorschläge (SPEC-044 v3 → v4)

> Simuliert. Grundlage: [runde-3-unterhaltung.md](runde-3-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Hinweis-Texte klingen wertend («zu hart») | 4 (Anton, Rosa, Tobias, Philipp) | Studierende, Theke, Kreative, Profis | mittel |
| T2 | Gleicher Hinweis jede Woche, obwohl bewusst so gelassen | 4 (Lars, Philipp, Moritz, Uwe) | Schrauber, Profis, Azubis | mittel |
| T3 | Abgeschraubte Routen im Zeitraum «Alle» nur an Grau erkennbar | 3 (Horst, Carina, Frank) | Ältere, Farbsehschwäche, Handwerk | mittel (Barriere) |
| T4 | Bewertungen nach Grad-Änderung | 3 (Selin, Dennis, Tobias) | Eltern, Ausbilder, UX | niedrig |
| T5 | Zustimmung: «Seit letztem Blick», Transparenz-Zeile, Merkmale, ruhige Karten, vier Kacheln | 12 | alle Gruppen | – (positiv) |
| T6 | Wünsche außerhalb: Schwellen einstellbar, Englisch, «gefährlich»-Bewertung, keine Töne | 5 (Leonie, Ruben, Sabrina, Ingrid, Rafael) | gemischt | niedrig |

**Zitate**
- T1: «Wenn da steht ‹7 von 10 finden sie hart für Blau›, ist es eine Info.» (Anton)
- T2: «Manchmal ist eine Route hart, weil sie hart sein soll.» (Philipp)
- T3: «Grau allein reicht nicht. Bei mir verschwimmt das.» (Carina)
- T5: «Wenig, aber das Richtige.» (Brigitte)

Keine Kritik mit Schweregrad **hoch**.

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Hinweis-Texte **sachlich mit Zahlen**, Routenname vorne, ohne «zu» | mittel | klein | 1 | stärkt |
| V2 | **«Erledigt»** blendet einen Hinweis **14 Tage** aus (lokal), danach wieder, falls er noch gilt | mittel | klein | 1 | stärkt |
| V3 | Abgeschraubte Routen mit **«abgeschraubt am …»** und Kontrast ≥ 4,5 : 1 | mittel | klein | 1 | stärkt (Barrierefreiheit) |
| V4 | Vermerk «Grad geändert am …» im Routen-Sheet | niedrig | mittel | später | eher überladen jetzt |
| V5 | Keine Töne und keine Vibration in «Meine Routen» | niedrig | keiner | 3 | neutral (ist schon so, festhalten) |

## Entscheidung (eingearbeitet in v4)

- **Übernommen:** V1, V2, V3, V5 (als Klarstellung).
- **Später:** V4 (Vermerk bei Grad-Änderung) – Bewertungen bleiben ehrlich an der Route; steht in SPEC-044 §11.
- **Verworfen:**
  - **Schwellen einstellbar** (Leonie): Einstellungen liest niemand, überlädt (Tobias, Uwe).
  - **Bewertungsfeld «gefährlich»** (Sabrina): Sicherheit läuft über Theke/Feedback (SPEC-026), nicht Statistik.
  - **Englisch** (Ruben): wie Runde 1 und 2, mit dem ganzen Studio.

## Abbruchregel

Nach Loop 3: keine Kritik «hoch», Änderungen nur Feinschliff → **kein 4. Loop nötig**, Spec v4 geht auf **READY**.
