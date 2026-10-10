---
name: feature-definition
description: Pflicht-Loop für jedes neue BoulderMate-Feature - Grill-me mit Empfehlungen, Spec v1, dann 3 bis 5 Runden "Feedback einholen" mit Einarbeitung in die Spec, erst danach Status READY und Umsetzung. Nutzen, sobald ein neues Feature geplant, spezifiziert oder gebaut werden soll.
---

# Loop «FeatureDefinition»

**Verbindliche Quelle: [docs/prozesse/feature-definition.md](../../../docs/prozesse/feature-definition.md). Zuerst vollständig lesen und genau danach arbeiten.** Diese Datei fasst nur zusammen.

1. **Schritt 0 Grill-me**: Zweck, Zielgruppe, Ort in der App, was es nicht sein soll, Abgrenzung zum Hauptzweck. Jede Frage mit klarer Empfehlung, mit einem Wort beantwortbar. Ergebnis: Spec v1 in `docs/specs/` mit Akzeptanzkriterien (Status DRAFT, Eintrag in INDEX.md).
2. **Loops (mind. 3, max. 5)**: Skill `feedback-einholen` auf den aktuellen Spec-Stand (Ablage `docs/feedback-runden/<datum>-<feature>/runde-<n>-…`). Jeden Vorschlag übernehmen, anpassen oder begründet verwerfen. Spec-Version hochzählen. Im Spec-Abschnitt «FeatureDefinition-Verlauf» festhalten: Loop-Nr., Datum, Top-Kritik, Änderungen, Verworfenes.
3. **Abbruch**: nach Loop 3 weiter, solange Kritik «hoch» kommt oder die Spec sich wesentlich ändert; spätestens nach Loop 5 stoppen. Grundsatzfragen mit Empfehlung an den Auftraggeber.
4. **Abschluss**: Status READY, kurze Meldung (Anzahl Loops, wichtigste Änderungen). Erst dann umsetzen, mit Unit- (Vitest) und Playwright-Tests (CONSTITUTION §13).
