#!/usr/bin/env node
/**
 * BoulderMate Agent-Chat Helper (Claude Code ⇄ Antigravity)
 * Verwaltet docs/agent-chat/CHAT.md und ermöglicht optional einen direkten
 * Ping an die lokale Claude-Code-Instanz der Claude Desktop App.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const CHAT_FILE = path.join(REPO_ROOT, 'docs', 'agent-chat', 'CHAT.md');

function nowFormatted() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    dateTime: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function readChat() {
  if (!fs.existsSync(CHAT_FILE)) {
    throw new Error(`Chat-Datei nicht gefunden: ${CHAT_FILE}`);
  }
  return fs.readFileSync(CHAT_FILE, 'utf8');
}

function parseTable(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    const match = line.match(/^\|\s*`(AC-\d+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*`?([^|`]+)`?\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*`?([^|`]+)`?\s*\|/);
    if (match) {
      rows.push({
        id: match[1].trim(),
        date: match[2].trim(),
        from: match[3].trim(),
        to: match[4].trim(),
        type: match[5].trim(),
        ref: match[6].trim(),
        summary: match[7].trim(),
        status: match[8].trim(),
      });
    }
  }
  return rows;
}

function nextId(rows) {
  let max = 0;
  for (const r of rows) {
    const n = parseInt(r.id.replace('AC-', ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `AC-${String(max + 1).padStart(3, '0')}`;
}

function cmdStatus() {
  const content = readChat();
  const rows = parseTable(content);
  const openRows = rows.filter((r) => r.status === 'OFFEN' || r.status === 'IN_ARBEIT');
  console.log('=== BoulderMate Agent-Chat Status ===');
  console.log(`Datei: ${CHAT_FILE}`);
  console.log(`Gesamt-Einträge: ${rows.length} | Offen / In Arbeit: ${openRows.length}\n`);
  if (openRows.length === 0) {
    console.log('Keine offenen Aufträge oder Empfehlungen.');
  } else {
    for (const r of openRows) {
      console.log(`[${r.id}] (${r.status}) ${r.from} -> ${r.to} [${r.type}] (${r.ref}): ${r.summary}`);
    }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

function cmdPost(argv) {
  const args = parseArgs(argv);
  const from = args.from || 'Antigravity';
  const to = args.to || (from === 'Antigravity' ? 'Claude' : 'Antigravity');
  const type = args.type || 'EMPFEHLUNG';
  const ref = args.ref || '-';
  const summary = args.summary || 'Neue Nachricht im Agent-Chat';
  const body = args.body || summary;
  const status = args.status || 'OFFEN';

  let content = readChat();
  const rows = parseTable(content);
  const id = args.id || nextId(rows);
  const { date, dateTime } = nowFormatted();

  const newRow = `| \`${id}\` | ${date} | ${from} | ${to} | \`${type}\` | ${ref} | ${summary.replace(/\|/g, '/')} | \`${status}\` |`;

  // Füge Tabellenzeile direkt vor dem "---" nach dem Board ein
  const boardSplit = content.indexOf('\n---\n\n## 💬 Chronologischer Chat-Verlauf');
  if (boardSplit !== -1) {
    content = content.slice(0, boardSplit) + '\n' + newRow + content.slice(boardSplit);
  } else {
    content += `\n${newRow}\n`;
  }

  const msgBlock = `\n### [${dateTime}] Von: ${from} ──► An: ${to} (Bezug: \`${id}\` / ${ref})\n**Typ:** \`${type}\`\n\n${body}\n`;
  content = content.trimEnd() + '\n' + msgBlock;

  fs.writeFileSync(CHAT_FILE, content, 'utf8');
  console.log(`Eintrag ${id} (${from} -> ${to}) erfolgreich in docs/agent-chat/CHAT.md gespeichert.`);
  return id;
}

function cmdInsta(argv) {
  const args = parseArgs(argv);
  const files = args.files || '(keine Dateisperre angegeben)';
  const locked = args.locked || '(keine)';
  const rawBody = args.body || args.summary || 'Insta-Aufgabe';
  const enrichedBody = `**Dateien (Empfänger darf schreiben):** \`${files}\`\n**Gesperrte Dateien (Sender arbeitet daran):** \`${locked}\`\n\n${rawBody}`;

  const postArgs = [
    '--from', args.from || 'Antigravity',
    '--to', args.to || 'Claude',
    '--type', 'INSTA',
    '--ref', args.ref || '-',
    '--summary', args.summary || 'Insta-Aufgabe',
    '--body', enrichedBody,
    '--status', 'OFFEN',
  ];
  const id = cmdPost(postArgs);
  if (args.ping === 'true') {
    cmdPingClaude(
      `Lies bitte docs/prozesse/agent-chat.md und docs/agent-chat/CHAT.md. Es liegt eine neue INSTA-Aufgabe (${id}) für dich vor. Bitte prüfe sie, beantworte oder bearbeite sie gemäß den Regeln in docs/prozesse/agent-chat.md und aktualisiere den Status in docs/agent-chat/CHAT.md.`
    );
  }
}

function cmdUpdateStatus(id, newStatus) {
  if (!id || !newStatus) {
    console.error('Verwendung: node scripts/agent-chat.mjs set-status <AC-xxx> <OFFEN|IN_ARBEIT|ERLEDIGT|VERWORFEN>');
    process.exit(1);
  }
  const content = readChat();
  const regex = new RegExp(`^(\\|\\s*\`${id}\`\\s*\\|(?:[^|]+\\|){6}\\s*)\`?[^|\`]+\`?(\\s*\\|)`, 'm');
  if (!regex.test(content)) {
    console.error(`Eintrag ${id} nicht in der Tabelle gefunden.`);
    process.exit(1);
  }
  const updated = content.replace(regex, `$1\`${newStatus}\`$2`);
  fs.writeFileSync(CHAT_FILE, updated, 'utf8');
  console.log(`Status von ${id} auf ${newStatus} gesetzt.`);
}

function findClaudeExe() {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\boris', 'AppData', 'Local');
  const claudeDataRoot = path.join(localAppData, 'Claude-Data');
  if (!fs.existsSync(claudeDataRoot)) return 'claude';

  const candidates = [];
  function walk(dir, depth = 0) {
    if (depth > 4) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full, depth + 1);
      } else if (e.isFile() && e.name.toLowerCase() === 'claude.exe') {
        const stat = fs.statSync(full);
        candidates.push({ full, mtime: stat.mtimeMs });
      }
    }
  }
  walk(claudeDataRoot, 0);
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates.length > 0 ? candidates[0].full : 'claude';
}

function cmdPingClaude(extraPrompt) {
  const claudeExe = findClaudeExe();
  console.log(`Nutze Claude Code Binary: ${claudeExe}`);
  const prompt =
    extraPrompt ||
    'Lies bitte docs/prozesse/agent-chat.md und docs/agent-chat/CHAT.md. Prüfe alle offenen Einträge (Status: OFFEN) an Claude, beantworte sie direkt in docs/agent-chat/CHAT.md und aktualisiere den Status in der Tabelle.';

  const res = spawnSync(
    claudeExe,
    ['-p', prompt, '--allowedTools', 'Read,Edit,Write,Glob,Grep'],
    {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      encoding: 'utf8',
    }
  );
  if (res.error) {
    console.error('Fehler beim Aufruf von Claude Code:', res.error.message);
    process.exit(1);
  }
  process.exit(res.status ?? 0);
}

const [, , subcmd, ...rest] = process.argv;

switch (subcmd) {
  case 'status':
  case undefined:
    cmdStatus();
    break;
  case 'post':
    cmdPost(rest);
    break;
  case 'insta':
    cmdInsta(rest);
    break;
  case 'set-status':
    cmdUpdateStatus(rest[0], rest[1]);
    break;
  case 'ping-claude':
    cmdPingClaude(rest.join(' ').trim());
    break;
  default:
    console.log(`Unbekannter Befehl: ${subcmd}`);
    console.log('Verfügbare Befehle: status | post | set-status | ping-claude');
    process.exit(1);
}
