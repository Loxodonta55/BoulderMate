# Gemeinsamer Agenten-Chat («AgentChat»: Claude Code ⇄ Antigravity)

> **Gilt für:** die direkte Zusammenarbeit zwischen **Claude Code (Desktop App)** und **Antigravity** im Projekt BoulderMate. Diese Datei ist die verbindliche Quelle; Skills und Workflows verweisen hierher.
> **Chat- & Auftrags-Datei:** [docs/agent-chat/CHAT.md](../agent-chat/CHAT.md)

## Zweck & Prinzip

Claude Code und Antigravity programmieren gemeinsam an BoulderMate. Über die zentrale Projektdatei **[`docs/agent-chat/CHAT.md`](../agent-chat/CHAT.md)** tauschen sie sich direkt aus, ohne dass der Auftraggeber (Hans/Boris) Texte per Copy-Paste zwischen den beiden Apps hin- und herkopieren muss.

Typische Einsatzzwecke:
- **Aufträge übergeben (`AUFTRAG`)**: Z. B. *„Ich habe SPEC-052 entworfen, bitte übernimm die Playwright-E2E-Tests"* oder *„Bitte implementiere die Supabase-Migration für Feature X"*.
- **Gegenprüfung & Code-Review (`REVIEW`)**: Z. B. *„Bitte prüfe meine Änderungen in `src/components/...` gegen CONSTITUTION §13 und Design System v2"*.
- **Architektur- & UX-Empfehlungen (`EMPFEHLUNG`)**: Zweitmeinung einholen, bevor eine größere Änderung oder Spec-Entscheidung getroffen wird.
- **Übergabe (Handover / `STATUS`)**: Kurz dokumentieren, was gerade erledigt wurde und wo der andere Agent nahtlos weitermachen kann.

---

## Aufbau von `docs/agent-chat/CHAT.md`

Die Datei `docs/agent-chat/CHAT.md` besteht aus zwei festen Bereichen:

### 1. Offenes Auftrags- & Empfehlungs-Board (oben)

Eine Markdown-Tabelle aller aktuellen Aufgaben, Reviews und Empfehlungen:

| ID | Datum | Von | An | Typ | Bezug (Spec / Datei) | Kurzbeschreibung | Status |
|----|-------|-----|----|-----|----------------------|------------------|--------|
| `AC-001` | 2026-10-27 | Antigravity | Claude | `EMPFEHLUNG` | `SPEC-052` | Kanal eingerichtet – bereit für gemeinsame Reviews & Aufträge | `OFFEN` |

**Erlaubte Status-Werte:**
- `OFFEN` – Neu eingestellt, wartet auf Bearbeitung durch den Empfänger.
- `IN_ARBEIT` – Empfänger hat den Auftrag übernommen und arbeitet daran.
- `ERLEDIGT` – Abgeschlossen (Ergebnis steht unten im Chat-Verlauf).
- `VERWORFEN` – Nach Rücksprache nicht umgesetzt (Begründung im Chat-Verlauf).

### 2. Chronologischer Chat-Verlauf (darunter, neueste Nachrichten unten)

Jede Nachricht folgt diesem klaren Block-Format:

```markdown
### [YYYY-MM-DD HH:MM] Von: <Claude | Antigravity | Boris> ──► An: <Antigravity | Claude | Alle> (Bezug: `AC-xxx` / `SPEC-xxx`)
**Typ:** `AUFTRAG` | `EMPFEHLUNG` | `REVIEW` | `ANTWORT` | `STATUS`

<Inhalt der Nachricht: präzise, technisch konkret, mit direkten Dateipfaden, Empfehlungen oder Akzeptanzkriterien.>
```

---

## Ablauf für beide Agenten (Claude Code & Antigravity)

### Wann wird `docs/agent-chat/CHAT.md` geprüft?
1. **Auf Zuruf / Workflow (`/agent-chat`)**: Sobald der Nutzer sagt *„Schau in den Agent-Chat"*, *„Was sagt Claude?"*, *„Was sagt Antigravity?"* oder `/agent-chat` aufruft.
2. **Vor & nach größeren Arbeitspaketen**: Vor Start einer neuen Spec oder Feature-Umsetzung kurz prüfen, ob ein offener Hinweis (`OFFEN`) für das eigene Werkzeug vorliegt.

### Wie reagiert ein Agent beim Prüfen des Chats?
1. **`docs/agent-chat/CHAT.md` lesen**.
2. Alle Einträge im Board filtern, bei denen **`An` = eigenes Werkzeug** (oder `Alle`) und **`Status` = `OFFEN`** ist.
3. **Handeln**:
   - Bei einer **Frage / Empfehlung / Review-Bitte**: Direkt fachlich prüfen, Antwort als neuen Nachrichtenblock unten an `docs/agent-chat/CHAT.md` anhängen und den Status in der Tabelle auf `ERLEDIGT` setzen (oder einen Folgeauftrag `AC-xxx` für den anderen Agenten anlegen).
   - Bei einem **Implementierungs- oder Test-Auftrag**: Status auf `IN_ARBEIT` setzen, Aufgabe gemäß `CONSTITUTION.md` und `GEMINI.md` erledigen, Ergebnis unten im Chat-Verlauf dokumentieren und Status auf `ERLEDIGT` setzen.
   - Bei **Grundsatzfragen** (Zweck, Zielgruppe, Umfang, Datenschutz): Nicht eigenmächtig zwischen den Agenten entscheiden, sondern mit einer gemeinsamen Empfehlung an den Auftraggeber (Hans/Boris) wenden.

### Wie vergibt ein Agent einen neuen Auftrag / eine Empfehlung an den anderen?
1. Nächste freie ID (`AC-002`, `AC-003`, …) in der Tabelle unter **Offenes Auftrags- & Empfehlungs-Board** eintragen (`Status: OFFEN`).
2. Unten im **Chat-Verlauf** die vollständige Nachricht mit Kontext, betroffenen Dateien und klarer Erwartung anhängen.
3. Dem Nutzer kurz melden: *„Ich habe `AC-xxx` für Claude/Antigravity in `docs/agent-chat/CHAT.md` eingetragen."*

---

## Optional: Direkter CLI-Aufruf & Schnellbefehle (`scripts/agent-chat.mjs`)

Für schnellen Zugriff über das Terminal stehen folgende Befehle bereit:
- `node scripts/agent-chat.mjs status` – Zeigt alle offenen Aufträge und die letzten Nachrichten.
- `node scripts/agent-chat.mjs post --from Antigravity --to Claude --type AUFTRAG --ref SPEC-052 --summary "..." --body "..."` – Fügt sauber einen neuen Eintrag samt Tabellenzeile hinzu.
- `node scripts/agent-chat.mjs insta --from Antigravity --to Claude --ref SPEC-052 --files "pfad/a,pfad/b" --summary "..." --body "..." [--ping]` – Legt eine **Insta-Aufgabe (`INSTA`)** inkl. Dateisperre/Ownership an und weckt bei `--ping` Claude direkt auf.
- `node scripts/agent-chat.mjs ping-claude` – *(Nur aus Antigravity/Terminal)* Startet die lokale Claude-Code-Instanz im Projektkontext, damit Claude offene `OFFEN`-Aufträge in `docs/agent-chat/CHAT.md` sofort liest und direkt beantwortet.

---

## ⚡ Insta-Aufgaben-Protokoll beim gemeinsamen Programmieren (`INSTA`)

Wenn Claude Code und Antigravity **gleichzeitig** am selben Feature programmieren, gelten für den sofortigen Austausch von Teilaufgaben («Insta-Aufgaben») folgende vier Regeln:

1. **Atomare Pakete mit klarer Dateisperre (`Files / Ownership`)**:
   - Jede Insta-Aufgabe bekommt den Typ `INSTA` und nennt im Nachrichtenblock zwingend:
     - **`Dateien (Empfänger darf schreiben):`** exakte Pfade/Ordner, die der beauftragte Agent anlegt oder ändert.
     - **`Gesperrte Dateien (Sender arbeitet daran):`** Dateien, die der Sender gerade selbst bearbeitet (Finger weg für den Empfänger, um Überschreibungen im Working Tree zu verhindern!).
2. **Sofort-Statuswechsel (`OFFEN` ──► `IN_ARBEIT` ──► `ERLEDIGT`)**:
   - Sobald ein Agent eine `INSTA`-Aufgabe aufnimmt, setzt er den Status in `docs/agent-chat/CHAT.md` **sofort** auf `IN_ARBEIT`, bevor er Code-Dateien anfasst.
3. **Schneller Trigger in beide Richtungen**:
   - **Antigravity ──► Claude**: Antigravity trägt den `INSTA`-Auftrag via `node scripts/agent-chat.mjs insta ... --ping` ein (oder ruft `node scripts/agent-chat.mjs ping-claude` auf), sodass Claude ohne Wartezeit reagiert.
   - **Claude ──► Antigravity**: Claude trägt den `INSTA`-Auftrag in `docs/agent-chat/CHAT.md` (`An: Antigravity`, `Typ: INSTA`, `Status: OFFEN`) ein. Der in Antigravity laufende Daemon (`agent-chat-sync.mjs --watch`) sowie der regelmäßige Check erkennen offene `INSTA`-Aufträge automatisch.
4. **Kein ungefragter `git commit`**:
   - Beide Agenten arbeiten im selben Working Tree, committen aber niemals eigenmächtig, solange der Auftraggeber (Hans/Boris) nicht explizit `commit` sagt.
