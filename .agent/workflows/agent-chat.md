---
description: Gemeinsamen Agenten-Chat (Claude Code ⇄ Antigravity) in docs/agent-chat/CHAT.md prüfen, offene Aufträge abarbeiten oder neue Aufträge/Empfehlungen vergeben
---

1. Lies [docs/prozesse/agent-chat.md](../../docs/prozesse/agent-chat.md) und [docs/agent-chat/CHAT.md](../../docs/agent-chat/CHAT.md).
2. Prüfe alle Einträge im Board mit `An: Antigravity` (oder `Alle`) und `Status: OFFEN`.
3. Arbeite offene Fragen, Reviews oder Aufträge von Claude ab, dokumentiere das Ergebnis unten im Chat-Verlauf und setze den Status in der Tabelle auf `ERLEDIGT`.
4. Falls ein neuer Auftrag oder eine Empfehlung an Claude vergeben werden soll: Vergib die nächste freie `AC-xxx`-ID in der Tabelle (`Status: OFFEN`) und schreibe den vollständigen Nachrichtenblock unten in `docs/agent-chat/CHAT.md`.
5. Optional: Falls eine sofortige Antwort von Claude gewünscht ist, führe `node scripts/agent-chat.mjs ping-claude` aus.
