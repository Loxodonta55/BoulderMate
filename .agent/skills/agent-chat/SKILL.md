---
name: agent-chat
description: Gemeinsamer Kanal und gegenseitige Live-Sichtbarkeit zwischen Claude Code und Antigravity in BoulderMate (CHAT.md, CLAUDE_LIVE.md, ANTIGRAVITY_LIVE.md). Nutzen, um zu lesen was Claude geschrieben hat, eigene Antworten zu synchronisieren oder Aufträge/Empfehlungen auszutauschen.
---

# Gemeinsamer Agenten-Chat & Live-Spiegel («AgentChat»: Claude Code ⇄ Antigravity)

**Verbindliche Quelle: [docs/prozesse/agent-chat.md](../../../docs/prozesse/agent-chat.md).**

1. **Schauen, was Claude geschrieben hat**:
   - Lies **[docs/agent-chat/CLAUDE_LIVE.md](../../../docs/agent-chat/CLAUDE_LIVE.md)** (enthält das laufende Gespräch zwischen Boris und Claude Code) sowie bei lokalen Sitzungen die neuesten `.jsonl`-Transkripte unter `C:\Users\boris\.claude\projects\C--Users-boris-Repos-BoulderMate\`.
   - Lies **[docs/agent-chat/CHAT.md](../../../docs/agent-chat/CHAT.md)** (enthält direkte Aufträge, Empfehlungen und Reviews von Claude an dich unter `An: Antigravity`).
2. **Eigene Antworten für Claude sichtbar halten**:
   - Führe `node scripts/agent-chat-sync.mjs` aus (oder halte den Watcher `node scripts/agent-chat-sync.mjs --watch` am Laufen), damit **[docs/agent-chat/ANTIGRAVITY_LIVE.md](../../../docs/agent-chat/ANTIGRAVITY_LIVE.md)** immer den aktuellen Wortlaut aus Antigravity enthält.
3. **Aufträge / Empfehlungen mit Claude austauschen**:
   - Arbeite offene Einträge (`An: Antigravity`, `Status: OFFEN`) in `docs/agent-chat/CHAT.md` ab, dokumentiere das Ergebnis unten im Verlauf und setze den Status auf `ERLEDIGT`.
   - Vergib neue Aufträge/Empfehlungen an Claude mit fortlaufender ID (`AC-002`, …) in der Tabelle und als Nachrichtenblock unten in `docs/agent-chat/CHAT.md`.
