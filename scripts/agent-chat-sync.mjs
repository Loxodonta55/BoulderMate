#!/usr/bin/env node
/**
 * Bi-direktionaler Live-Transkript-Spiegel (Claude Code ⇄ Antigravity)
 *
 * 1. Spiegelt laufend das aktuelle Antigravity-Gespräch aus
 *    C:\Users\boris\.gemini\antigravity\brain\<id>\.system_generated\logs\transcript.jsonl
 *    nach docs/agent-chat/ANTIGRAVITY_LIVE.md (damit Claude sieht, was Antigravity geschrieben hat).
 *
 * 2. Spiegelt lokale Claude-Code-Sitzungen aus
 *    C:\Users\boris\.claude\projects\C--Users-boris-Repos-BoulderMate\*.jsonl
 *    nach docs/agent-chat/CLAUDE_LIVE.md (damit Antigravity sieht, was Claude geschrieben hat).
 *    Einträge aus Remote-Sessions in CLAUDE_LIVE.md bleiben dabei vollständig erhalten.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const AGENT_CHAT_DIR = path.join(REPO_ROOT, 'docs', 'agent-chat');
const ANTIGRAVITY_LIVE_FILE = path.join(AGENT_CHAT_DIR, 'ANTIGRAVITY_LIVE.md');
const CLAUDE_LIVE_FILE = path.join(AGENT_CHAT_DIR, 'CLAUDE_LIVE.md');

const USER_HOME = process.env.USERPROFILE || 'C:\\Users\\boris';
const AGY_BRAIN_DIR = path.join(USER_HOME, '.gemini', 'antigravity', 'brain');
const CLAUDE_PROJECT_DIR = path.join(USER_HOME, '.claude', 'projects', 'C--Users-boris-Repos-BoulderMate');

function cleanUserRequest(raw) {
  if (!raw) return '';
  const m = raw.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
  return (m ? m[1] : raw).trim();
}

function syncAntigravityToRepo() {
  if (!fs.existsSync(AGY_BRAIN_DIR)) return false;

  // Finde die neuesten 2 Konversationen in Antigravity
  const dirs = fs
    .readdirSync(AGY_BRAIN_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const tPath = path.join(AGY_BRAIN_DIR, d.name, '.system_generated', 'logs', 'transcript.jsonl');
      if (!fs.existsSync(tPath)) return null;
      const stat = fs.statSync(tPath);
      return { id: d.name, path: tPath, mtime: stat.mtimeMs };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 2);

  if (dirs.length === 0) return false;

  const sections = [];
  for (const conv of dirs) {
    const lines = fs.readFileSync(conv.path, 'utf8').trim().split(/\r?\n/);
    const messages = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const step = JSON.parse(line);
        const ts = (step.created_at || '').replace('T', ' ').replace('Z', ' UTC');
        if (step.type === 'USER_INPUT' && step.content) {
          const text = cleanUserRequest(step.content);
          if (text) {
            messages.push(`#### [${ts}] 👤 Boris (in Antigravity)\n\n${text}`);
          }
        } else if (step.type === 'PLANNER_RESPONSE' && step.content && step.content.trim()) {
          messages.push(`#### [${ts}] 🚀 Antigravity\n\n${step.content.trim()}`);
        }
      } catch {
        // ignore malformed line
      }
    }
    if (messages.length > 0) {
      sections.push(`### Sitzung \`${conv.id}\`\n\n` + messages.slice(-15).join('\n\n---\n\n'));
    }
  }

  const out = `# Live-Protokoll: Antigravity Chat\n\n> **Zweck:** Hier sieht **Claude Code** im Wortlaut, was **Boris** und **Antigravity** im Antigravity-Chat geschrieben haben (wird automatisch synchronisiert).\n> **Gegenstück:** [CLAUDE_LIVE.md](CLAUDE_LIVE.md) · **Auftrags-Board:** [CHAT.md](CHAT.md)\n\n---\n\n${sections.join('\n\n===\n\n')}\n`;

  if (!fs.existsSync(AGENT_CHAT_DIR)) fs.mkdirSync(AGENT_CHAT_DIR, { recursive: true });
  const prev = fs.existsSync(ANTIGRAVITY_LIVE_FILE) ? fs.readFileSync(ANTIGRAVITY_LIVE_FILE, 'utf8') : '';
  if (prev !== out) {
    fs.writeFileSync(ANTIGRAVITY_LIVE_FILE, out, 'utf8');
    return true;
  }
  return false;
}

function cleanClaudeUserText(content) {
  if (!content) return '';
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  const msgMatch = str.match(/<message[^>]*>([\s\S]*?)<\/message>/);
  if (msgMatch) return msgMatch[1].trim();
  const noteMatch = str.match(/<note>([\s\S]*?)<\/note>/);
  if (noteMatch) return `[Koordinator-Notiz]:\n${noteMatch[1].trim()}`;
  if (str.startsWith('<')) return '';
  return str.trim();
}

function initOrSyncClaudeLive() {
  if (!fs.existsSync(AGENT_CHAT_DIR)) fs.mkdirSync(AGENT_CHAT_DIR, { recursive: true });

  const MANUAL_MARKER = '<!-- LIVE_ENTRIES_START -->';
  let manualEntries = '';
  if (fs.existsSync(CLAUDE_LIVE_FILE)) {
    const existing = fs.readFileSync(CLAUDE_LIVE_FILE, 'utf8');
    const idx = existing.indexOf(MANUAL_MARKER);
    if (idx !== -1) {
      manualEntries = existing.slice(idx + MANUAL_MARKER.length).trim();
    }
  }

  // Lese neueste lokale Claude-Code-Session falls vorhanden
  let localHistory = '';
  if (fs.existsSync(CLAUDE_PROJECT_DIR)) {
    const files = fs
      .readdirSync(CLAUDE_PROJECT_DIR)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => {
        const full = path.join(CLAUDE_PROJECT_DIR, f);
        return { name: f.replace('.jsonl', ''), full, mtime: fs.statSync(full).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 1);

    if (files.length > 0) {
      const f = files[0];
      const lines = fs.readFileSync(f.full, 'utf8').trim().split(/\r?\n/);
      const turns = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          const ts = (obj.timestamp || '').replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
          if (obj.type === 'user' && obj.message) {
            const txt = cleanClaudeUserText(obj.message.content);
            if (txt) turns.push(`#### [${ts}] 👤 Boris / Koordinator (in Claude Code)\n\n${txt}`);
          } else if (obj.type === 'assistant' && obj.message && Array.isArray(obj.message.content)) {
            const texts = obj.message.content
              .filter((c) => c.type === 'text' && c.text)
              .map((c) => c.text.trim())
              .filter(Boolean);
            if (texts.length > 0) {
              turns.push(`#### [${ts}] 🤖 Claude Code\n\n${texts.join('\n\n')}`);
            }
          }
        } catch {
          // ignore
        }
      }
      if (turns.length > 0) {
        localHistory = `### Letzte lokale Claude-Sitzung (\`${f.name}\`)\n\n` + turns.slice(-10).join('\n\n---\n\n');
      }
    }
  }

  const out = `# Live-Protokoll: Claude Code (Desktop App)

> **Zweck:** Hier sieht **Antigravity** im Wortlaut, was in **Claude Code** geschrieben, besprochen und geantwortet wurde.
> **Gegenstück:** [ANTIGRAVITY_LIVE.md](ANTIGRAVITY_LIVE.md) · **Auftrags-Board:** [CHAT.md](CHAT.md)

---

${localHistory ? localHistory + '\n\n---\n\n' : ''}## 🔴 Laufende Claude-Code-Nachrichten (Live & Remote-Sessions)

${MANUAL_MARKER}
${manualEntries ? '\n' + manualEntries + '\n' : '\n*(Noch keine neuen Live-Einträge seit Einrichtung – Claude schreibt ab sofort jede neue Antwort hier hinein.)*\n'}`;

  const prev = fs.existsSync(CLAUDE_LIVE_FILE) ? fs.readFileSync(CLAUDE_LIVE_FILE, 'utf8') : '';
  if (prev !== out) {
    fs.writeFileSync(CLAUDE_LIVE_FILE, out, 'utf8');
    return true;
  }
  return false;
}

function runOnce() {
  const a = syncAntigravityToRepo();
  const c = initOrSyncClaudeLive();
  return a || c;
}

const isWatch = process.argv.includes('--watch');
runOnce();
console.log('Agent-Chat Live-Spiegel synchronisiert (ANTIGRAVITY_LIVE.md & CLAUDE_LIVE.md).');

if (isWatch) {
  console.log('Starte Live-Watcher (Intervall: 3s)...');
  setInterval(() => {
    try {
      runOnce();
    } catch {
      // ignore transient read errors
    }
  }, 3000);
}
