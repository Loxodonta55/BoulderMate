# BoulderMate – Claude Code

@AGENTS.md
@GEMINI.md

## 🔄 Bi-direktionale Live-Sichtbarkeit (Claude Code ⇄ Antigravity) – PFLICHT

Damit **Antigravity** jederzeit lesen kann, was du (Claude) geschrieben hast, und **du (Claude)** jederzeit lesen kannst, was **Antigravity** geschrieben hat, gelten in diesem Projekt folgende 3 Dateien unter `docs/agent-chat/`:

1. **[`docs/agent-chat/ANTIGRAVITY_LIVE.md`](docs/agent-chat/ANTIGRAVITY_LIVE.md)** – **Was Antigravity geschrieben hat (Wortlaut-Spiegel)**
   - Wird automatisch aus den laufenden Antigravity-Sitzungen synchronisiert.
   - **Deine Pflicht (Claude):** Wenn der Nutzer sich auf Antigravity bezieht, du wissen willst, was dort besprochen wurde, oder du ein Arbeitspaket startest, lies zuerst das Ende von `docs/agent-chat/ANTIGRAVITY_LIVE.md` und `docs/agent-chat/CHAT.md`.
2. **[`docs/agent-chat/CLAUDE_LIVE.md`](docs/agent-chat/CLAUDE_LIVE.md)** – **Was du (Claude) geschrieben hast (für Antigravity)**
   - **Deine Pflicht (Claude):** Da Remote-Sessions der Claude Desktop App nicht lokal in `~/.claude` liegen, hänge bei **jeder inhaltlichen Antwort** in BoulderMate automatisch unten an `docs/agent-chat/CLAUDE_LIVE.md` (unter `<!-- LIVE_ENTRIES_START -->`) einen kompakten Block an:
     ```markdown
     ### [YYYY-MM-DD HH:MM] 👤 Boris ──► 🤖 Claude Code
     **Frage/Thema:** <Kurzzusammenfassung der Nutzer-Anfrage>
     **Claudes Antwort & Änderungen:** <Was du geantwortet, empfohlen oder im Code geändert hast>
     ```
3. **[`docs/agent-chat/CHAT.md`](docs/agent-chat/CHAT.md)** – **Gemeinsames Auftrags- & Empfehlungs-Board (`AC-xxx`)**
   - Für direkte Aufträge, Code-Reviews und Architektur-Empfehlungen zwischen dir und Antigravity (Ablauf: [`docs/prozesse/agent-chat.md`](docs/prozesse/agent-chat.md)).
4. **⏱️ Automatischer 30-Minuten-Check (`*/30 * * * *`)**:
   - Antigravity prüft alle 30 Minuten automatisch `CLAUDE_LIVE.md` und `CHAT.md` auf neue Nachrichten und Aufträge von dir.
   - Richte in deiner laufenden Claude-Code-Sitzung (falls `CronCreate` verfügbar ist) ebenfalls einen 30-Minuten-Check (`*/30 * * * *`) ein, der `docs/agent-chat/CHAT.md` und `docs/agent-chat/ANTIGRAVITY_LIVE.md` prüft und offene `An: Claude`-Punkte bearbeitet.
