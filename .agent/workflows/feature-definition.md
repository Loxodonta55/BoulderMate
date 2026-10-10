---
description: Pflicht-Loop für jedes neue Feature - Grill-me, Spec v1, 3 bis 5 Feedback-Runden, Status READY, dann Umsetzung
---

1. Lies [docs/prozesse/feature-definition.md](../../docs/prozesse/feature-definition.md) vollständig. Sie ist die verbindliche Quelle.
2. Schritt 0 Grill-me: Zweck, Zielgruppe, Ort, was es nicht sein soll, Abgrenzung zum Hauptzweck; jede Frage mit Empfehlung, mit einem Wort beantwortbar.
3. Schreibe Spec v1 mit Akzeptanzkriterien in `docs/specs/` (Status DRAFT, Eintrag in INDEX.md).
4. Führe pro Loop den Workflow `/feedback-einholen` auf den aktuellen Spec-Stand aus, entscheide jeden Vorschlag (übernehmen, anpassen, begründet verwerfen), zähle die Spec-Version hoch und ergänze den Abschnitt «FeatureDefinition-Verlauf».
5. Mindestens 3, höchstens 5 Loops. Nach Loop 3 nur weiter, wenn Kritik «hoch» bleibt oder sich die Spec wesentlich ändert. Grundsatzfragen mit Empfehlung an Hans.
6. Setze den Status auf READY, melde Anzahl Loops und wichtigste Änderungen, dann erst umsetzen mit Unit- und Playwright-Tests.
