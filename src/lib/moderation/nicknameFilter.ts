/**
 * SPEC-046 §4.6: Wortliste für Spitznamen.
 * Ganze Wörter, Ziffern-Tricks normalisiert (4→a, 3→e, 0→o, 1→i, 5→s).
 * Gleiche Liste wie die Tabelle `blocked_words` (Migration 20261022_spec046_melden.sql);
 * die Datenbank prüft noch einmal und ist die Wahrheit, neue Wörter wirken dort ohne neue App-Version.
 */
export const BLOCKED_WORDS: readonly string[] = [
  'arschloch', 'wichser', 'wixer', 'fotze', 'hurensohn', 'hure', 'nutte', 'schlampe',
  'missgeburt', 'spast', 'spasti', 'schwuchtel', 'kanake', 'neger', 'zigeuner',
  'ficken', 'fick', 'ficker', 'titten', 'porno', 'vergewaltiger', 'kinderficker',
  'judensau', 'untermensch', 'nazi', 'hitler', 'siegheil',
  'fuck', 'fucker', 'motherfucker', 'shit', 'bitch', 'cunt', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'rapist', 'porn', 'cock',
  'pussy', 'asshole', 'dickhead', 'wanker', 'twat',
  '88', '1488', '14words', 'hh', 'kkk',
];

const BLOCKED = new Set(BLOCKED_WORDS);
const LEET: Record<string, string> = { '4': 'a', '3': 'e', '0': 'o', '1': 'i', '5': 's' };

export function nicknameTokens(name: string): string[] {
  return (name || '')
    .toLowerCase()
    .split(/[^a-z0-9äöüß]+/)
    .filter(Boolean);
}

function unleet(token: string): string {
  return token.replace(/[43015]/g, c => LEET[c]);
}

/** true = Name ist erlaubt */
export function isNicknameAllowed(name: string, extraWords: Iterable<string> = []): boolean {
  const list = new Set(BLOCKED);
  for (const w of extraWords) list.add(w.toLowerCase());
  return !nicknameTokens(name).some(tok => list.has(tok) || list.has(unleet(tok)));
}
