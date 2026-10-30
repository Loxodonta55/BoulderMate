# KI-Routenerfassung (SPEC-052) – Skripte für Hans' PC

Alles hier läuft **lokal auf dem Windows-PC** (Internet nötig). Ergebnisse und Fotos landen in
`ai-capture/` (gitignored). Aufruf immer aus dem Repo-Ordner mit `npx vite-node`.

## Gemini anbinden (eins von drei)

| Weg | Einstellung | Hinweis |
|---|---|---|
| `cli` (Standard) | Gemini-CLI installieren: `npm i -g @google/gemini-cli`, einmal `gemini` starten und mit Google anmelden | nutzt das Google-Abo; Datenschutz-Einstellung prüfen (keine Nutzung zum Training) |
| `api` | `GEMINI_API_KEY=…` in `.env.worker` | nur **bezahlte** Stufe (die kostenlose Stufe darf Daten zum Training nutzen) |
| `manual` | nichts | Skript legt je Sektor `prompt.txt` + `photo.jpg` ab; Antigravity (Gemini) schreibt `result.json` daneben |

Optional: `GEMINI_MODEL=gemini-2.5-pro` (Standard), `GEMINI_CLI=<pfad zu gemini>`.

## Testlauf gegen Hans' Routen

```bash
# 1. Hans' Routen + Wandfotos holen (liest mit dem Anon-Key, schreibt nichts)
npx vite-node scripts/ai-capture/reference.ts -- --gym 6a

# 2. Gemini auf alle Sektorfotos loslassen und vergleichen
npx vite-node scripts/ai-capture/eval.ts -- --backend cli --marker tape --label gemini-v1

#    nur ein Sektor:            --sector cave
#    anderes Modell:            --model gemini-2.5-flash
#    manual (Antigravity):      --backend manual   → result.json schreiben → nochmal mit --from <run-ordner>
#    vorhandenes Ergebnis:      --from ai-capture/test-6aplus-2026-10-27/claude/ergebnis.json --label claude
```

Bericht: `ai-capture/eval/runs/<zeit>-<label>/report.md`, Prüfbild je Sektor `<sektor>/overlay.jpg`
(Ring = Hans, Punkt mit Nummer = KI). Verlauf aller Läufe: `ai-capture/eval/history.md`.

Gezählt wird: gefundene Routen (Abstand ≤ 8 % der Bildhöhe), richtige Grad-Farbe, zusätzliche KI-Routen
(Fehler **oder** von Hans nicht eingetragen) und die Merkmal-Abweichung – **nur** für Routen, bei denen Hans
die Merkmale bewertet hat (alles 3 = nicht bewertet, zählt nicht).

Qualitäts-Tor (SPEC-052 F11): ≥ 90 % gefunden, ≥ 95 % Farbe richtig, ≤ 5 % erfunden.

## Worker für echte Aufträge aus der App

```bash
npx vite-node scripts/ai-capture/worker.ts -- --backend cli          # einmal alle offenen Aufträge
npx vite-node scripts/ai-capture/worker.ts -- --backend cli --loop 15 # alle 15 Minuten
```

`.env.worker` (nicht im Repo):

```
WORKER_EMAIL=ki-worker@bouldermate.ch
WORKER_PASSWORD=…
```

Das Worker-Konto ist ein normales Konto mit Rolle **Schrauber** in jeder Halle mit KI-Erfassung.
Windows-Aufgabenplanung: Aufgabe «BoulderMate KI» → Trigger «bei Anmeldung», wiederholen alle 15 Minuten →
Aktion `cmd /c cd /d C:\Users\boris\Repos\BoulderMate && npx vite-node scripts/ai-capture/worker.ts -- --backend cli`.
