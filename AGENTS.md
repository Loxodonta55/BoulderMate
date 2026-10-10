# BoulderMate – Hinweise für KI-Agenten

> Werkzeugneutral (Claude Code, Antigravity, Codex, Cursor u. a.). Projektregeln: [CONSTITUTION.md](CONSTITUTION.md), Arbeitsweise und Tech-Stack: [GEMINI.md](GEMINI.md), Specs: [docs/specs/](docs/specs/INDEX.md).

## Neue Features: Loop «FeatureDefinition» (Pflicht seit 2026-10-10)

Jedes neue Feature durchläuft vor der Umsetzung den Loop **FeatureDefinition**:

1. **Grill-me** mit klaren Empfehlungen → Spec v1 mit Akzeptanzkriterien in `docs/specs/`.
2. **3 bis 5 Runden «Feedback einholen»** (30 simulierte Personen aus gemischten Populationen, nicht nur MINT), jeweils in die Spec eingearbeitet und im Abschnitt «FeatureDefinition-Verlauf» festgehalten.
3. Status **READY**, kurze Meldung, **erst dann** Umsetzung mit Unit- und Playwright-Tests.

Ablauf im Detail:
- [docs/prozesse/feature-definition.md](docs/prozesse/feature-definition.md)
- [docs/prozesse/feedback-einholen.md](docs/prozesse/feedback-einholen.md)

Feedback-Runden liegen unter `docs/feedback-runden/<datum>-<thema>/`.

Werkzeug-Anbindung: Claude Code `.claude/skills/`, Antigravity `.agent/skills/` und `.agent/workflows/` (je `feedback-einholen` und `feature-definition`). Die Dateien unter `docs/prozesse/` sind die Quelle; bei Änderungen dort die Kurzfassungen mitziehen.
