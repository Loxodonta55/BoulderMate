#!/usr/bin/env node
/**
 * Claude Code Hook Logger & Insta-Task-Bridge für BoulderMate
 * Wird über .claude/settings.json bei UserPromptSubmit und Stop aufgerufen:
 * 1. Protokolliert alles, was im Claude-Chat geschrieben wird, nach docs/agent-chat/CLAUDE_LIVE.md.
 * 2. Prüft docs/agent-chat/CHAT.md auf offene Aufgaben (Status: OFFEN) für Claude:
 *    - Bei UserPromptSubmit: Gibt offene AC-IDs auf stdout aus (wird von Claude Code automatisch als Kontext injiziert).
 *    - Bei Stop: Falls eine neue Aufgabe (AC-xxx) für Claude offen ist, die noch nicht gemeldet wurde,
 *      wird Claude einmalig per {"decision":"block","reason":...} direkt zur Abarbeitung angestoßen.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const CLAUDE_LIVE_FILE = path.join(REPO_ROOT, 'docs', 'agent-chat', 'CLAUDE_LIVE.md');
const CHAT_FILE = path.join(REPO_ROOT, 'docs', 'agent-chat', 'CHAT.md');
const SEEN_FILE = path.join(REPO_ROOT, '.claude', '.last_insta_notified.json');

function nowStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ensureHeader() {
  const dir = path.dirname(CLAUDE_LIVE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CLAUDE_LIVE_FILE)) {
    fs.writeFileSync(
      CLAUDE_LIVE_FILE,
      `# Live-Protokoll: Claude Code (Desktop App)\n\n> **Zweck:** Hier sieht **Antigravity** im Wortlaut, was in **Claude Code** geschrieben und besprochen wurde.\n> **Gegenstück:** [ANTIGRAVITY_LIVE.md](ANTIGRAVITY_LIVE.md) · **Auftrags-Board:** [CHAT.md](CHAT.md)\n\n---\n\n## 🔴 Laufende Claude-Code-Nachrichten (Live & Remote-Sessions)\n\n<!-- LIVE_ENTRIES_START -->\n`,
      'utf8'
    );
  }
}

function appendEntry(block) {
  ensureHeader();
  let content = fs.readFileSync(CLAUDE_LIVE_FILE, 'utf8');
  content = content.replace(
    '\n*(Noch keine neuen Live-Einträge seit Einrichtung – Claude schreibt ab sofort jede neue Antwort hier hinein.)*\n',
    '\n'
  );
  if (!content.includes('<!-- LIVE_ENTRIES_START -->')) {
    content += '\n## 🔴 Laufende Claude-Code-Nachrichten (Live & Remote-Sessions)\n\n<!-- LIVE_ENTRIES_START -->\n';
  }
  content = content.trimEnd() + '\n' + block;
  fs.writeFileSync(CLAUDE_LIVE_FILE, content, 'utf8');
}

function extractLastAssistantFromTranscript(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      const entry = JSON.parse(lines[i]);
      if (entry.type === 'assistant' && entry.message && Array.isArray(entry.message.content)) {
        const texts = entry.message.content
          .filter((c) => c.type === 'text' && c.text)
          .map((c) => c.text.trim())
          .filter(Boolean);
        if (texts.length > 0) return texts.join('\n\n');
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function getOpenTasksForClaude() {
  try {
    if (!fs.existsSync(CHAT_FILE)) return [];
    const lines = fs.readFileSync(CHAT_FILE, 'utf8').split(/\r?\n/);
    const open = [];
    for (const line of lines) {
      const match = line.match(
        /^\|\s*`(AC-\d+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*`?([^|`]+)`?\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*`?([^|`]+)`?\s*\|/
      );
      if (match) {
        const id = match[1].trim();
        const to = match[4].trim().toLowerCase();
        const type = match[5].trim();
        const summary = match[7].trim();
        const status = match[8].trim();
        if ((to.includes('claude') || to.includes('alle')) && status === 'OFFEN') {
          open.push({ id, type, summary });
        }
      }
    }
    return open;
  } catch {
    return [];
  }
}

function loadSeenIds() {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8'));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveSeenIds(ids) {
  try {
    const dir = path.dirname(SEEN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SEEN_FILE, JSON.stringify(ids, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  try {
    if (!raw.trim()) process.exit(0);
    const data = JSON.parse(raw);
    ensureHeader();
    const event = data.hook_event_name || process.argv[2] || 'Event';
    const ts = nowStr();
    const openForClaude = getOpenTasksForClaude();

    if (event === 'UserPromptSubmit') {
      if (data.prompt) {
        const block = `\n### [${ts}] 👤 Boris (in Claude Code)\n\n${String(data.prompt).trim()}\n`;
        appendEntry(block);
      }
      if (openForClaude.length > 0) {
        const list = openForClaude.map((t) => `${t.id} [${t.type}]: ${t.summary}`).join(' | ');
        process.stdout.write(
          `\n[AGENT-CHAT INSTA-SYNC]: In docs/agent-chat/CHAT.md liegen offene Einträge von Antigravity für Claude vor (${list}). Bitte lies docs/agent-chat/CHAT.md und berücksichtige/beantworte sie!\n`
        );
      }
    } else if (event === 'Stop') {
      const msg =
        data.last_assistant_message ||
        extractLastAssistantFromTranscript(data.transcript_path);
      if (msg) {
        const block = `\n### [${ts}] 🤖 Claude Code\n\n${String(msg).trim()}\n`;
        appendEntry(block);
      }

      if (openForClaude.length > 0 && !data.stop_hook_active) {
        const seen = new Set(loadSeenIds());
        const unseen = openForClaude.filter((t) => !seen.has(t.id));
        if (unseen.length > 0) {
          for (const t of unseen) seen.add(t.id);
          saveSeenIds([...seen]);
          const list = unseen.map((t) => `${t.id} (${t.type}): ${t.summary}`).join('; ');
          process.stdout.write(
            JSON.stringify({
              decision: 'block',
              reason: `[Agent-Chat Insta-Aufgabe]: Antigravity hat in docs/agent-chat/CHAT.md neue offene Einträge für dich hinterlegt: ${list}. Bitte lies jetzt docs/agent-chat/CHAT.md und beantworte/bearbeite sie direkt.`,
            })
          );
        }
      }
    }
  } catch {
    // Niemals Claude blockieren, falls beim Logging ein Fehler auftritt
  }
  process.exit(0);
});
