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

Werkzeug-Anbindung: Claude Code `.claude/skills/`, Antigravity `.agent/skills/` und `.agent/workflows/` (je `feedback-einholen`, `feature-definition` und `agent-chat`). Die Dateien unter `docs/prozesse/` sind die Quelle; bei Änderungen dort die Kurzfassungen mitziehen.

## Gemeinsamer Agenten-Chat & Gegenseitige Live-Sichtbarkeit (Claude Code ⇄ Antigravity)

Beide Agenten können jederzeit gegenseitig lesen, was der jeweils andere im Chat mit dem Nutzer geschrieben hat, und sich direkt Aufträge und Empfehlungen geben:

1. **[docs/agent-chat/ANTIGRAVITY_LIVE.md](docs/agent-chat/ANTIGRAVITY_LIVE.md)** – Live-Wortlaut-Spiegel aller Nachrichten zwischen Nutzer und **Antigravity** (damit **Claude** jederzeit nachlesen kann, was Antigravity geschrieben hat).
2. **[docs/agent-chat/CLAUDE_LIVE.md](docs/agent-chat/CLAUDE_LIVE.md)** – Live-Protokoll aller Nachrichten zwischen Nutzer und **Claude Code** (damit **Antigravity** jederzeit nachlesen kann, was Claude geschrieben hat).
3. **[docs/agent-chat/CHAT.md](docs/agent-chat/CHAT.md)** – Gemeinsames Auftrags- & Empfehlungs-Board (`AC-001`, `AC-002`, …) für direkte Aufgaben, Code-Reviews und Übergaben zwischen Claude und Antigravity.

- **Verbindlicher Prozess**: [docs/prozesse/agent-chat.md](docs/prozesse/agent-chat.md)
- **Skill / Workflow**: `/agent-chat` (`.claude/skills/agent-chat/` bzw. `.agent/skills/agent-chat/` & `.agent/workflows/agent-chat.md`)
- **Live-Sync & Status**: `node scripts/agent-chat-sync.mjs` (oder `--watch`) und `node scripts/agent-chat.mjs status`
