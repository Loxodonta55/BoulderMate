# SPEC-052: KI erfasst Routen aus dem Sektorfoto

## Status: UMGESETZT (v5, 2026-10-29: Grad-Markierung je Halle mit drei Arten; v4.2, 2026-10-27 – gebaut mit lokalem Gemini-Worker; offen: Migration, Worker-Konto, Datenschutzseite, echter Blindtest mit Gemini-CLI, siehe Abschnitt 13)

> **Owner:** Hans · **Created:** 2026-10-27 · **Version:** v4 (nach 3 Loops «FeatureDefinition»)
> **Anlass:** Erster Praxistest. Die Halle will ihren Schraubern keine Handyzeit zumuten; die heutigen 1–3 Minuten pro Sektor sind zu viel.
> **Baut auf:** SPEC-001/002 (Schrauber-Studio, Entwürfe), SPEC-004 (Merkmale/Deep Dive), SPEC-019 (Sync), SPEC-021 (Umschrauben, «Wand fertig», «Umbau verwerfen»), SPEC-022 F24 (Grad-Gefühl), SPEC-023 (Admin-Tabs Farben/Halle), SPEC-030/044/050 (Schrauber-Zahlen), SPEC-031 («Neu»), SPEC-034 (Schreibrechte), SPEC-039 (Englisch via `t()`)
> **Prozess:** [Loop «FeatureDefinition»](../prozesse/feature-definition.md). Grill-me am 2026-10-27, Hans: «geh immer mit der Empfehlung». Feedback-Runden: [`docs/feedback-runden/2026-10-27-ki-routenerfassung/`](../feedback-runden/2026-10-27-ki-routenerfassung/) (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

Ein Schrauber (oder die Theke) macht **nur noch ein Foto vom Sektor**. Alles andere erledigt die KI:

1. erkennt **alle Routen** auf dem Foto und setzt je einen Pin an den Startgriff,
2. liest den **Grad aus der Farbe** nach dem Farbsystem der Halle (Admin → Farben), wahlweise Griff-Farbe oder Tape,
3. gibt jeder Route einen **Namen**,
4. schätzt die **Merkmale** (Charakteristik 1–5: Maximalkraft, Kraft-Ausdauer, Technik, Balance, Koordination, Flexibilität),
5. funktioniert genauso beim **Neuschrauben** (neuer Sektor, ganze Wand neu) und beim **Umschrauben einzelner Routen**.

**Messlatte:** Handyzeit des Schraubers **≤ 15 Sekunden pro Sektor** (Studio öffnen, Kamera-Knopf, eine Frage, Foto).

Hinweis zu «5 Eigenschaften»: Hans sprach von 5 Eigenschaften. In der App sind es **6 Merkmale mit Werten 1–5** («Charakteristik (1–5)» im Studio). Die KI setzt alle 6 (Empfehlung, siehe G7).

## 2. Abgrenzung

- **Kein** Pflicht-Prüfschritt für Schrauber. Prüfen ist freiwillig («Kurz prüfen») oder eine Hallen-Einstellung.
- **Kein** genauer Fb-Grad aus dem Foto: die Farbe gibt den Bereich vor (wie heute), Feinheiten kommen aus dem Grad-Gefühl der Kletterer (SPEC-022 F24).
- **Keine** eigene Kamera-Ansicht, **kein** Panorama aus mehreren Fotos, **kein** automatisches Verpixeln (eigener Umfang).
- Der heutige Handweg im Studio (Pins setzen, Farbe wählen, Merkmale tippen) **bleibt unverändert** und ist der Rückfall, wenn die KI ausfällt.
- Für Kletterer ändert sich fast nichts: Routen erscheinen wie bisher mit «Neu». Neu sind nur «Stimmt was nicht?» und «Hier fehlt eine Route».

## 3. Grill-me (Schritt 0, alles nach Empfehlung)

| # | Frage | Entscheidung |
|---|---|---|
| G1 | Zweck | Schrauber-Handyzeit auf ein Foto reduzieren (≤ 15 s pro Sektor) |
| G2 | Wer darf fotografieren | alle mit Schrauber- oder Admin-Rolle der Halle (Theke bekommt dafür die Schrauber-Rolle) |
| G3 | Ort | Studio-Sektorliste: Kamera-Knopf je Sektor. Zusätzlich Admin → Sektoren beim Anlegen eines Sektors |
| G4 | Direkt live oder prüfen | **direkt live** (Standard); Halle kann «erst prüfen» einschalten |
| G5 | Grad | aus dem Farbsystem der Halle; Halle wählt «Farbe der Griffe» (Standard), «Farbiger Zettel am Start» oder «Zeichen am Start» (v5) |
| G6 | Namen | KI vergibt Namen, familienfreundlich, eindeutig unter den aktiven Routen der Halle, im Studio mit einem Tap änderbar |
| G7 | Merkmale | KI setzt alle 6 Merkmale (1–5); markiert «geschätzt», bis 3 Kletterer bewertet haben |
| G8 | Umschrauben | Schrauber sagt mit einem Tap «Ganze Wand neu» oder «Nur einzelne Routen»; bei «einzelne» ordnet die KI alte und neue Routen zu |
| G9 | Technik | Server-Funktion (Supabase Edge Function) ruft Claude (Anthropic API, Vision) auf; API-Schlüssel nur auf dem Server |
| G10 | Datenschutz | KI-Erfassung ist pro Halle **einmal einzuschalten** (Admin), Datenschutzseite wird ergänzt |
| G11 | Was es nicht ist | kein Pflicht-Review, kein Panorama, keine Kletterer-Namensvorschläge, kein genauer Fb-Grad |
| G12 | Hauptzweck | stärkt «Boulder finden»: Wände sind schneller und vollständiger in der App |

## 4. Funktionen

### F1 Foto aufnehmen (Studio)

- In der **Studio-Sektorliste** steht pro Sektor ein **Kamera-Knopf** (mind. 56 × 56 px, hoher Kontrast, Symbol + Text «Foto»), `data-testid="ai-capture-btn-<sectorId>"`, `aria-label="Foto für Sektor <Name>"`.
- Hat der Sektor aktive Routen, erscheint **vor** der Kamera eine Frage mit zwei großen Knöpfen:
  - **«Ganze Wand neu»** (`ai-capture-mode-full`)
  - **«Nur einzelne Routen neu»** (`ai-capture-mode-partial`)
  Ein Sektor ohne aktive Routen fragt nicht (Modus «neu»).
- Danach öffnet sich die **System-Kamera** (Capacitor Camera in der App, `<input type="file" accept="image/*" capture="environment">` im Browser). Auf PC: Datei wählen.
- Ein Satz über dem Auslöser bzw. in der Frage: **«Ganze Wand, gerade davor, ohne Personen, ohne Blitz.»**
- Das Foto wird **nicht unter 2000 px** (lange Seite) verkleinert, JPEG ~85 %.
- Abbrechen vor dem Auslösen ändert nichts.
- Der Fotograf wird als Schrauber der neuen Routen eingetragen (änderbar wie heute).

### F2 Grad erkennen – je Halle einstellbar (v5, 2026-10-29)

Hallen zeigen den Schwierigkeitsgrad unterschiedlich an. Der Hallen-Admin stellt deshalb in **Admin → Halle**, Abschnitt «Routen per Foto erkennen», unter **«Woran erkennt man den Grad?»** eine von drei Arten ein (`grade-marker-toggle`, drei große Knöpfe untereinander, je mit einem Satz Beispiel), gespeichert als `gyms.grade_marker`:

| Art | Knopf (`data-testid`) | Beispiel-Satz | Was die KI liest |
|---|---|---|---|
| `holds` (Standard) | «Farbe der Griffe» (`grade-marker-holds`) | «Alle Griffe einer Route haben die Farbe des Grads.» | Griff-Farbe → Farbe im Farbsystem |
| `tape` | «Farbiger Zettel am Start» (`grade-marker-tape`) | «Am Startgriff klebt ein Zettel oder Tape in der Farbe des Grads (z. B. 6a plus).» | Farbe des Zettels/Tapes am Start → Farbe im Farbsystem |
| `symbol` | «Zeichen am Start» (`grade-marker-symbol`) | «Am Start steht ein Zeichen, eine Zahl oder ein Grad (z. B. ★★, 5, 6b+).» | Zeichen am Start → Eintrag, dem dieses Zeichen zugeordnet ist |

- **Zeichen je Farbe** (nur bei «Zeichen am Start»): Unter den Knöpfen steht für jede Farbe des Farbsystems (Farbpunkt, Name, Fb-Bereich) ein Textfeld **«Zeichen am Start»** (`grade-symbol-<scaleId>`, max. 40 Zeichen). Mehrere Schreibweisen mit Komma, z. B. «★★, 2 Sterne» oder «6a, 6a+». Gespeichert in `gyms.grade_symbols` (`jsonb`, `{ "<scaleId>": "★★, 2 Sterne" }`). Fehlt bei einer Farbe das Zeichen, steht darunter: «Bei dieser Farbe fehlt das Zeichen. Routen damit bekommen «Grad folgt».» Die KI wählt nur Zeichen aus dieser Liste; unbekannte Zeichen → «Grad folgt». Vergleich ohne Groß/Klein und Leerzeichen.
- **Hinweis an die KI** (alle Arten): Textfeld **«Was sollte die KI noch wissen?»** (`ai-grade-hint`, max. 300 Zeichen, Beispiel im Platzhalter: «Zettel klebt unten links am Startgriff. Kinderrouten mit Tierbild ignorieren.»). Gespeichert in `gyms.ai_grade_hint`; geht als Zusatz-Information (nicht als Anweisung an die KI-Regeln) in den Auftrag.
- **Studio zeigt, was die KI sucht:** Unter dem Kamera-Knopf steht klein «KI liest den Grad an: Farbe der Griffe | farbigem Zettel am Start | Zeichen am Start» (`ai-capture-marker-hint`), damit eine falsche Einstellung auffällt.
- Wechselt der Admin die Art, gilt sie nur für neue Fotos; bestehende Routen bleiben.
- **Griff-Farbe:** Die erkannte Griff-Farbe ist eine Farbe des Farbsystems → `gradeScaleId`.
- **Zettel/Tape** und **Zeichen:** Zusätzlich speichert die Route ihre **Griff-Farbe** (`boulders.hold_color`, Text aus der festen Liste `HOLD_COLORS` in `src/lib/aiCapture/colors.ts`: Gelb, Orange, Rot, Rosa, Lila, Blau, Türkis, Grün, Hellgrün, Weiß, Grau, Schwarz, Braun; englische und Schweizer Schreibweisen wie «Weiss», «Pink», «Beige» werden zugeordnet), damit man sie findet. Kletterer sehen im BoulderSheet «Griffe: <Farbe>» (`boulder-sheet-hold-color`).
- Die KI darf **nur Farben bzw. Zeichen aus dem Farbsystem der Halle** wählen (Name, Hex und Zeichen werden mitgeschickt).
- **Zweiter Blick** (`src/lib/aiCapture/colorCheck.ts`, `refineColors` in `scripts/ai-capture/lib.ts`): Nach dem Finden der Routen bekommt das Modell je 16 Starts einen Kontaktbogen mit vergrößerten, nummerierten Ausschnitten (gestrichelter Ring = Start) und liest je nach Art nur die Griff-Farbe, die Zettel-Farbe oder das Zeichen. Sichere Antwort gilt; unsicherer Widerspruch zum ersten Durchgang ergibt «Grad folgt». Läuft im Worker immer, in `eval.ts` abschaltbar mit `--refine off`.
- Nicht in diesem Umfang: verschiedene Arten je Sektor (Hinweis-Feld genügt; bei Bedarf eigene Spec).
- **Grad nicht sicher lesbar** (Tape verdeckt, Farbe zweifelhaft): Route geht trotzdem live, aber mit **«Grad folgt»** (`boulders.grade_pending = true`; `grade_scale_id` bleibt gesetzt, vorläufig die erste Farbe des Farbsystems, damit bestehende Abfragen und Statistiken nicht brechen), dargestellt als **Fragezeichen-Symbol mit Text** («?» im Pin und in der Nummer, «Grad folgt» im Untertitel). Setzt der Schrauber den Grad, wird `grade_pending = false`. Sie ist abhakbar und landet in «Kurz prüfen». Es wird **nie geraten**.
- Genauer Fb-Grad (`fontGrade`) bleibt leer; die Farbe liefert den Bereich wie bisher.

### F3 Routen erkennen und Pins setzen

- Die KI liefert pro Route: Griff-Farbe, Grad-Farbe (Tape-Modus), **Startpunkt** (x/y relativ 0–1 → `positionX/positionY`), grober Umriss (Rechteck, nur für Zuordnung und «Kurz prüfen»), **Sicherheit 0–1**, Name, 6 Merkmale.
- Routen **gleicher Farbe** werden räumlich getrennt (eigene Startgriffe, eigene Linie); geteilte Volumes zählen zu beiden.
- Personen, Matten, Schilder und Griffe ohne Route werden ignoriert.
- Sicherheit < 0,6 → Route geht live, steht aber in «Kurz prüfen».

### F4 Namen und Merkmale

**Namen**
- Hallen-Einstellung **Namensstil** (Admin → Halle): **Witzig** (Standard, z. B. «Faultier», «Gelber Riese») · **Schlicht** («Gelb 3») · **Keine Namen**.
- Steht ein lesbarer Name auf dem Tape, nimmt die KI **immer** diesen (auch bei «Keine»), `name_source = 'tape'`.
- Regeln an die KI: höchstens 24 Zeichen, familienfreundlich, keine Namen realer Personen, keine Marken, keine Anspielungen; **kein Name, der einer aktiven Route der Halle gleicht** (aktive Namen werden mitgeschickt; archivierte dürfen wiederkehren). Namen bleiben in der Hallensprache (Deutsch), auch in der englischen Oberfläche.
- Im Studio: Tap auf den Namen → Textfeld, «Sichern». Ein vom Schrauber geänderter Name wird nie von der KI überschrieben (`name_source = 'setter'`).

**Merkmale**
- Die KI setzt alle 6 Werte 1–5 aus dem Bild (Wandneigung, Griffgrößen, Abstände, Tritte). Vorgabe: 1 oder 5 nur bei klarem Bild, sonst 2–4.
- Die Werte werden wie Schrauber-Werte behandelt (gleiche Rechnung in `computeAggregatedRadar`, damit auch Deep Dive, «Für dich», «Challenge heute»), sind aber mit `radar_source = 'ai'` gekennzeichnet.
- Im BoulderSheet steht **einmal** neben der Überschrift der Merkmale «geschätzt» (EN «estimated»), solange weniger als 3 Kletterer Merkmale bewertet haben.
- Ändert ein Schrauber Merkmale im Studio, wird `radar_source = 'setter'`.

### F5 Neuschrauben und Umschrauben

| Modus | Wann | Was passiert |
|---|---|---|
| **neu** | Sektor ohne aktive Routen (auch frisch angelegter Sektor) | Foto wird Wandfoto, alle erkannten Routen werden neu angelegt |
| **Ganze Wand neu** | SPEC-021 «Wand neu schrauben» | Foto wird Wandfoto, **alle** alten Routen werden archiviert (Begehungen bleiben im Logbuch), alle erkannten Routen neu. Das Foto gilt als «Wand fertig» (SPEC-021 E3): Umschaltung, sobald die KI fertig ist |
| **Nur einzelne Routen neu** | Teil-Umbau | Altes Wandfoto + Liste der aktiven Routen (Id, Farbe, Position, Name) werden mitgeschickt. Die KI ordnet zu: **gleich geblieben** → alte Route bleibt (Id, Name, Position, Merkmale, Begehungen unverändert, nur das Wandfoto wechselt); **neu** → neue Route; **alt, nicht mehr da** → archiviert |

- **Unsichere Zuordnung** (Sicherheit < 0,6): alte Route **bleibt** (Tops gehen nicht verloren), die mögliche neue Route wird **nicht** angelegt, beides steht in «Kurz prüfen».
- Manuell verschobene Pins und geänderte Namen bleiben bei zugeordneten Routen erhalten.
- Neue Routen bekommen wie bisher «Neu» (SPEC-021 E8, SPEC-031); eine angekündigte Umschraubung wird gelöscht.
- Die alte Foto-Historie (SPEC-021 E5) wird wie bisher geführt.

### F6 Veröffentlichen, «erst prüfen», zurücknehmen

- Hallen-Einstellung **«KI-Ergebnis»**: **Direkt live** (Standard) · **Erst prüfen** (`gyms.ai_publish_mode = 'direct' | 'review'`).
  - Direkt live: Ergebnis wird sofort angewendet (veröffentlichen bzw. «Wand fertig»).
  - Erst prüfen: Ergebnis landet als Entwürfe im Umbau des Sektors (SPEC-021), ein Schrauber oder Admin tippt «Wand fertig» bzw. «Veröffentlichen».
- **«Ergebnis zurücknehmen»** (`ai-capture-undo-<runId>`) steht **24 Stunden** in der Studio-Zeile des Sektors: Routen dieses Laufs werden gelöscht, archivierte Routen und das alte Wandfoto kommen zurück. Haben Kletterer an neuen Routen schon etwas abgehakt, fragt die App vorher mit Anzahl («3 Tops gehen verloren. Trotzdem zurücknehmen?», «Abbrechen» vorausgewählt).
- Im Modus «Erst prüfen» heißt die Aktion «Umbau verwerfen» (SPEC-021 E9).

### F7 Verarbeitung im Hintergrund, Status

- Das Foto wird sofort in Supabase Storage hochgeladen und ein Auftrag `ai_capture_jobs` angelegt. **Die App darf danach geschlossen werden.** Ohne Netz merkt sich die App das Foto und sendet es, sobald wieder Netz da ist (Warteschlange wie der bestehende Offline-Sync).
- Die Edge Function `ai-capture` verarbeitet den Auftrag (typisch 20–60 s) und schreibt das Ergebnis; die App erfährt es über den bestehenden Sync (SPEC-019).
- **Status-Zeile** am Sektor im Studio, groß und kontrastreich, `aria-live="polite"`, bleibt bis zum Ende stehen:
  - «Wartet auf Netz …» · «KI erkennt Routen … (ca. 1 Minute)» · «**12 Routen erkannt** · 2 kurz prüfen» · «Erkennung fehlgeschlagen – Routen bitte von Hand setzen».
- Zusätzlich ein Toast, wenn die App offen ist.
- **Fehler:** Das Foto bleibt als (Entwurfs-)Wandfoto, keine Route wird verändert; der Handweg funktioniert wie heute.

### F8 «Kurz prüfen» und Meldungen von Kletterern

**«Kurz prüfen»** (nur Studio)
- Kleine Zahl ohne Rot am Sektor (`ai-review-count-<sectorId>`), Tippen öffnet eine Liste: Ausschnitt des Fotos mit Umriss, Grund («Farbe unsicher», «Grad folgt», «Zuordnung unsicher», «von Kletterern gemeldet: 2×», «Route fehlt laut Kletterer»).
- Je Eintrag große Knöpfe: **Passt** · **Farbe ändern** · **Löschen** · (bei «Route fehlt») **Pin setzen**.
- Einträge **verschwinden nach 7 Tagen** von allein; die Routen sind ohnehin live.

**Kletterer** (nur angemeldet, Texte über `t()` auch auf Englisch)
- Im BoulderSheet ein unauffälliger Link **«Stimmt was nicht?»** (`route-issue-btn`) mit drei Auswahlen: «Farbe/Grad falsch» · «Route gibt es nicht» · «Pin an falscher Stelle». Eine Meldung pro Person und Route.
- Unter dem Wandfoto ein Link **«Hier fehlt eine Route»** (`route-missing-btn`): Tipp auf die Stelle im Foto, optional Farbe wählen.
- Meldungen erzeugen **keine Einzelnachrichten**; sie erscheinen gesammelt in «Kurz prüfen».

### F9 Einschalten pro Halle, Datenschutz

- Admin → **Halle**: Schalter **«Routen per Foto erkennen (KI)»** (`ai-capture-enable`), Standard **aus**. Darunter ein Satz: «Das Sektorfoto wird zur Erkennung an einen KI-Dienst geschickt (im Pilot Google Gemini) und dort nicht zum Training verwendet. Bitte ohne Personen fotografieren.» (`ai-capture-privacy`) Erst nach dem Einschalten erscheinen die Kamera-Knöpfe.
- Auf derselben Seite: Grad-Markierung (F2), Namensstil (F4), «KI-Ergebnis» (F6), Zähler (F10).
- `public/datenschutz.html` bekommt einen Abschnitt: Zweck (Routen erkennen), Daten (Sektorfoto, ggf. zufällig abgebildete Personen), Empfänger (im Pilot Google, später ggf. Anthropic PBC; USA, Unterauftragsverarbeiter, Standardvertragsklauseln), keine Nutzung zum Training, Speicherdauer beim Anbieter gemäß dessen API-Bedingungen, Rechtsgrundlage (Vertrag mit der Halle / berechtigtes Interesse). Text vor Livegang von Hans prüfen lassen.
- Die KI wird angewiesen, Personen zu ignorieren; es werden keine Personendaten aus dem Bild gespeichert.

### F10 Kosten und Grenzen

- Anbieter ist **austauschbar** (Abschnitt 6). Pilot: Gemini über Hans' Google-Abo im lokalen Worker. Server-Stufe: Gemini-API (bezahlte Stufe, ohne Training) oder **Claude Opus 5.5** (`claude-opus-5-5`, Bild-Eingabe, `effort: "medium"`, strukturierte Ausgabe, `fallbacks: "default"`). Entscheidung per Qualitätstest (F11): der günstigere Anbieter, der die Schwellen schafft. Die kostenlose Gemini-API-Stufe wird nicht genutzt (Google darf dort Daten verwenden).
- Geschätzte Kosten: **ca. 0,10–0,25 € pro Foto** (1–2 Bilder à ~4 000 Tokens, Ausgabe einige Tausend Tokens). Eine Halle mit 15 Umbauten im Monat liegt bei wenigen Euro.
- **Obergrenze:** 30 Fotos pro Halle und Tag; dasselbe Foto (Hash) wird nicht zweimal verarbeitet.
- Admin → Halle zeigt **«KI-Fotos diesen Monat: 37»**.

### F11 Qualitäts-Tor vor dem Einschalten

- Skript `scripts/ai-capture/eval.ts` (Vergleichsdaten vorher mit `scripts/ai-capture/reference.ts`) schickt einen Testsatz (≥ 20 echte Sektorfotos der Pilot-Halle mit bekannten Routen, Ablage außerhalb des Repos) durch dieselbe Prompt-/Schema-Logik und misst: gefundene Routen, richtige Farbe/Tape-Grad, Pin-Abstand, Zuordnung bei Teil-Umbau.
- **Schwellen:** ≥ 90 % gefundene Routen, ≥ 95 % richtige Grad-Farbe bei gefundenen Routen, ≤ 5 % erfundene Routen. Erst dann wird die KI-Erfassung für die Halle eingeschaltet. Das Skript kostet Geld (API) und läuft nur auf Anweisung.
- **Merkmale** werden nur mit Routen verglichen, die Hans wirklich bewertet hat: lauter 3er (Standard, nicht bewertet) zählen nicht als Fehler (`isRadarRated`).
- **Nur Blindtests zählen** (`--backend cli` oder `api`): Das Modell sieht nur Foto und Auftrag. Läufe mit `manual` oder `--from` heißen im Bericht «Blindtest: nein». Liegen die KI-Punkte im Median näher als 0.012 an Hans' Pins, ist der Lauf **ungültig** (sieht abgeschrieben aus; echte Bilderkennung liegt bei 0.015–0.04).
- «Zusätzlich» ist nur ein Hinweis, solange die Vergleichsdaten unvollständig sind (Hans hat nicht alle Routen jeder Wand eingetragen); im `overlay.jpg` prüfen.

## 5. Datenmodell (Migration `supabase/migrations/20261027_spec052_ki_routenerfassung.sql`, braucht SPEC-034)

- `gyms`: `ai_capture_enabled boolean default false`, `grade_marker text default 'holds'` (`holds|tape|symbol`), `grade_symbols jsonb default '{}'` (Zeichen je Farbe), `ai_grade_hint text` (≤ 300 Zeichen), `route_name_style text default 'fun'` (`fun|plain|none`), `ai_publish_mode text default 'direct'` (`direct|review`).
- `boulders`: `capture_source text default 'manual'` (`manual|ai`), `ai_confidence real`, `hold_color text`, `name_source text default 'setter'` (`setter|ai`), `radar_source text default 'setter'` (`setter|ai`), `ai_run_id uuid`, `grade_pending boolean default false` («Grad folgt»), `ai_review text[]` (Prüfgründe, bei bestehenden Routen mit Datum, z. B. `old_not_seen:2026-10-27`; die Liste «Kurz prüfen» zeigt sie 7 Tage). `name_source` kennt zusätzlich `tape`.
- Die App schickt die KI-Spalten nur für KI-Routen; fehlen die Spalten noch (Migration nicht eingespielt), synchronisiert sie ohne sie weiter (`spec052ColumnsMissing`).
- Neu `ai_capture_jobs`: `id, gym_id, sector_id, mode (new|full|partial), photo_path, photo_hash, status (queued|running|done|failed|undone), result jsonb, error text, created_by, created_at, finished_at, archived_boulder_ids uuid[], previous_photo_url text`. Eindeutig je Foto-Hash; Trigger begrenzt auf 30 Aufträge pro Halle und Tag (Fehler `ai_capture_daily_limit`); RPC `ai_capture_month_count(gym)` für den Zähler. Anlegen nur, wenn `ai_capture_enabled` und `created_by = auth.uid()`.
- Neu `route_issue_reports`: `id, gym_id, sector_id, boulder_id null, kind (wrong_grade|not_exists|wrong_pin|missing), position_x, position_y, color text, user_id, created_at`; eindeutig je (`boulder_id`, `user_id`, `kind`).
- RLS: Jobs anlegen/lesen nur Schrauber/Admins der Halle; Meldungen anlegen alle Angemeldeten, lesen nur Schrauber/Admins der Halle; Edge Function schreibt mit Service-Rolle.
- Storage-Bucket `sector-photos` (falls nicht vorhanden), Schreiben nur Schrauber/Admins.

## 6. Technik (kurz)

**Grundsatz (Nachtrag Hans, 2026-10-27):** Die App legt nur den Auftrag an (Foto in Storage + Zeile in `ai_capture_jobs`). **Wer den Auftrag abarbeitet, ist austauschbar** («Worker»). Damit ist auch Warten erlaubt: Ein Auftrag darf Minuten bis Stunden in «Warteschlange» stehen; die Status-Zeile sagt dann «In Warteschlange – Routen erscheinen später».

**Stufe 1 – Pilot: lokaler Worker auf Hans' PC** (Empfehlung für den Start, keine API-Kosten außer dem Abo)
Ein Skript `scripts/ai-capture/worker.ts` mit drei Schritten (`fetch`, `run`, `push`; ohne Angabe alle drei, `--loop <Minuten>` wiederholt):
1. **fetch** holt offene Aufträge und Fotos aus Supabase nach `ai-capture/inbox/<jobId>/` (Foto, `context.json` mit Farbsystem, aktiven Routen, Namen, Modus). Der Ordner liegt außerhalb von Git (`/ai-capture/` in `.gitignore`).
2. **run**: Auswertung je Ordner mit **Gemini über Hans' Google-Abo** (Gemini CLI, `--backend cli`; Standard-Modell `gemini-2.5-pro`, änderbar mit `GEMINI_MODEL`) oder Gemini-API bezahlte Stufe (`--backend api`). Prompt und JSON-Schema sind dieselben wie in Stufe 2 (`src/lib/aiCapture/prompt.ts`, `schema.ts`); Ergebnis als `result.json` in denselben Ordner.
3. **push** prüft jedes `result.json` (`processCaptureResponse` = `validateCaptureResult` + Namen + `buildCapturePlan`), schreibt es nach Supabase (`applyPlan`) und verschiebt den Ordner nach `ai-capture/done/`. Ungültige Ergebnisse → Status `failed` mit Grund.
- Anleitung: `scripts/ai-capture/README.md`.
- Die Jobs laufen auf Hans' PC, z. B. per Windows-Aufgabenplanung alle 15 Minuten, solange der PC an ist. Ist der PC aus, warten die Aufträge.
- Schreiben nach Supabase mit einem eigenen **Worker-Konto** (Rolle Schrauber in der Pilot-Halle), nicht mit dem Service-Schlüssel; der Schlüssel des Kontos liegt nur in einer lokalen `.env.worker` (nicht im Repo).
- **Vor dem Einsatz zu prüfen (Hans):** ob die Nutzungsbedingungen des Google-Abos (Gemini CLI/Antigravity mit Privatkonto) die Verarbeitung von Hallenfotos erlauben und ob Google diese Eingaben zum Training nutzen darf. Wenn ja, ist der Datenschutz-Satz in F9 so nicht haltbar; dann Training in den Google-Einstellungen abschalten oder Stufe 2 nutzen.

**Stufe 2 – später: Server-Worker** (wenn mehrere Hallen oder der PC-Betrieb stört)
- `supabase/functions/ai-capture/index.ts` (Deno, `@anthropic-ai/sdk`): lädt Job, Foto(s), Farbsystem, aktive Routen/Namen; ruft Claude mit System-Prompt (Regeln aus F2–F5) und JSON-Schema; prüft das Ergebnis (`validateCaptureResult`), wendet es an (`applyCaptureResult`) und setzt den Status. Secret `ANTHROPIC_API_KEY` nur in Supabase.
- Reine, testbare Logik im Frontend-Repo unter `src/lib/aiCapture/` und von der Edge Function wiederverwendet: Schema, Farb-Zuordnung, Zuordnung alt/neu, Namens-Eindeutigkeit, Merkmal-Begrenzung, Anwenden/Zurücknehmen.

## 7. Akzeptanzkriterien

- **AC-1** Ist `ai_capture_enabled` aus, gibt es keine Kamera-Knöpfe; an, steht in der Studio-Sektorliste je Sektor `ai-capture-btn-<id>` (≥ 56 px, `aria-label` mit Sektorname).
- **AC-2** Sektor mit aktiven Routen: vor der Kamera erscheinen `ai-capture-mode-full` und `ai-capture-mode-partial`; ohne aktive Routen startet direkt die Kamera.
- **AC-3** Nach dem Foto legt die App einen Job an und zeigt «KI erkennt Routen …»; die App kann geschlossen werden, der Job läuft weiter.
- **AC-4** Ohne Netz zeigt die Zeile «Wartet auf Netz …» und sendet automatisch, sobald Netz da ist.
- **AC-5** Modus «neu»/«Ganze Wand neu», Veröffentlichung «direkt»: nach dem Job sind alle erkannten Routen aktiv mit Pin am Start, Farbe aus dem Farbsystem, Name, 6 Merkmalen; bei «Ganze Wand neu» sind alle alten Routen archiviert und das Foto ist Live-Wandfoto.
- **AC-6** Tape-Halle: `gradeScaleId` kommt aus der Tape-Farbe, `hold_color` ist gesetzt und im BoulderSheet sichtbar.
- **AC-7** Nicht sicher lesbarer Grad → Route aktiv mit «Grad folgt» (Fragezeichen + Text), abhakbar, Eintrag in «Kurz prüfen».
- **AC-8** «Nur einzelne Routen neu»: zugeordnete Routen behalten Id, Name, Position, Merkmale und Begehungen; fehlende werden archiviert; neue angelegt mit «Neu»; unsichere Zuordnung lässt die alte Route bestehen und legt einen Prüf-Eintrag an.
- **AC-9** KI-Namen sind ≤ 24 Zeichen und gleichen keinem aktiven Namen der Halle; Namensstil «Schlicht» ergibt «<Farbe> <Nr>», «Keine» lässt den Namen leer. Vom Schrauber geänderte Namen überschreibt die KI nie.
- **AC-10** KI-Merkmale liegen in 1–5 und haben `radar_source = 'ai'`; das BoulderSheet zeigt einmal «geschätzt», bis 3 Kletterer-Bewertungen mit Merkmalen vorliegen.
- **AC-11** Veröffentlichung «Erst prüfen»: Ergebnis liegt als Entwürfe im Umbau; Kletterer sehen die alte Wand bis «Wand fertig».
- **AC-12** «Ergebnis zurücknehmen» ist 24 h sichtbar und stellt alte Routen und Wandfoto wieder her; mit vorhandenen Begehungen erscheint eine Rückfrage mit Anzahl, «Abbrechen» vorausgewählt.
- **AC-13** «Kurz prüfen» zeigt eine Zahl ohne Rot, Einträge mit Grund und den Knöpfen Passt/Farbe ändern/Löschen/Pin setzen; Einträge älter als 7 Tage erscheinen nicht.
- **AC-14** In Hallen mit eingeschalteter KI-Erfassung können angemeldete Kletterer «Stimmt was nicht?» (3 Gründe) und «Hier fehlt eine Route» (Tipp aufs Foto) melden; Gäste sehen die Links nicht; Texte auf Englisch vorhanden; keine Einzelbenachrichtigung.
- **AC-15** Fehlgeschlagener Job: Status «Erkennung fehlgeschlagen …», keine Route verändert, Handweg funktioniert.
- **AC-16** Mehr als 30 Fotos pro Halle und Tag werden abgelehnt (Meldung), gleiches Foto wird nicht doppelt verarbeitet; Admin → Halle zeigt den Monatszähler.
- **AC-17** Das Eval-Skript gibt gefundene Routen, Farbtreffer und erfundene Routen in Prozent aus; die Halle wird erst bei erreichten Schwellen eingeschaltet (manuelle Freigabe durch Hans).
- **AC-20** Admin → Halle bietet drei Arten der Grad-Markierung; die gewählte ist `aria-pressed`. Bei «Zeichen am Start» gibt es je Farbe ein Zeichen-Feld; leere Felder zeigen den Hinweis «Grad folgt». Das Hinweis-Feld nimmt höchstens 300 Zeichen.
- **AC-21** Der KI-Auftrag enthält die gewählte Art, bei «Zeichen» die Zuordnung Zeichen → Farbe, und den Hinweis der Halle. Ein erkanntes Zeichen wird dem richtigen Eintrag zugeordnet (auch bei mehreren Schreibweisen, ohne Groß/Klein); ein unbekanntes ergibt «Grad folgt».
- **AC-22** Das Studio zeigt unter dem Kamera-Knopf, woran die KI den Grad liest.
- **AC-18** Datenschutzseite enthält den Abschnitt KI-Erkennung; der Einschalt-Schalter zeigt den Hinweissatz.
- **AC-19** Alle Bedienelemente groß und kontrastreich (Design System «Chalk», Hell und Dunkel); Status-Zeile `aria-live`.

## 8. Tests (CONSTITUTION §13)

**Unit (Vitest)**
- `tests/spec052AiCaptureSchema.test.ts` – Validierung des KI-Ergebnisses, Farbe nur aus Farbsystem, Merkmale 1–5, Sicherheit, «Grad folgt».
- `tests/spec052AiCaptureMatch.test.ts` – Zuordnung bei Teil-Umbau (gleich/neu/weg/unsicher), Erhalt von Name/Pin/Merkmalen.
- `tests/spec052AiCaptureApply.test.ts` – Anwenden (neu, ganze Wand, teil; direkt/prüfen), Zurücknehmen, Namens-Eindeutigkeit und Stile, Obergrenze, «Kurz prüfen»-Ablauf nach 7 Tagen.
- `tests/spec052AiCaptureColorCheck.test.ts` – zweiter Blick (Kontaktbogen), Zeichen am Start: Zuordnung, Auftrag, «Grad folgt» bei unbekanntem Zeichen.
- `tests/spec052AiCaptureUi.test.tsx` – Kamera-Knopf, Modusfrage, Status-Zeile, «Kurz prüfen», Admin-Schalter, «Stimmt was nicht?», «geschätzt».

**Playwright (Supabase blockiert, Worker-Ergebnis als lokale KI-Route)**
- `tests/e2e/spec052-ki-routenerfassung.spec.ts` – Admin schaltet ein (Datenschutz-Satz, Tape); Studio: Kamera-Knopf ≥ 56 px mit `aria-label`, Modusfrage, «Wartet auf Netz …», «Grad folgt» am Pin, «Kurz prüfen» mit Farbe setzen; Admin stellt «Zeichen am Start» mit Zeichen je Farbe und Hinweis ein, Studio zeigt die Art; Kletterer: «?», «Griffe: Türkis», «geschätzt», «Stimmt was nicht?», «Hier fehlt eine Route».

**Datenbank**
- `tests/db/spec052_ki.sql` mit `scripts/test-db-spec052.sh` – RLS, Tageslimit, Hash, Monatszähler (29 Prüfungen).

**Manuell / kostenpflichtig**
- `scripts/ai-capture/reference.ts` + `scripts/ai-capture/eval.ts` (F11), nur auf Anweisung. Bericht in `ai-capture/eval/runs/<lauf>/report.md`, Verlauf in `ai-capture/eval/history.md`.

## 9. Dateien (gebaut)

- `supabase/migrations/20261027_spec052_ki_routenerfassung.sql`
- `src/lib/aiCapture/`: `colorCheck.ts` (zweiter Blick), `colors.ts` (inkl. Zeichen-Zuordnung), `types.ts`, `schema.ts`, `names.ts`, `plan.ts` (Zuordnung alt/neu), `prompt.ts`, `evaluate.ts`, `exif.ts`, `index.ts`, `boulderFields.ts`, `aiCaptureService.ts` (Warteschlange, Status, Zurücknehmen, «Kurz prüfen», Meldungen)
- `scripts/ai-capture/`: `lib.ts`, `reference.ts`, `eval.ts`, `worker.ts`, `README.md`
- `src/components/setter/AiCapturePanel.tsx`, `AiReviewList.tsx` (eingebunden in `BatchBoulderWorkflow.tsx`)
- `src/components/admin/AiCaptureSettings.tsx` (Admin → Halle, in `GymManagement.tsx`)
- `src/components/RouteIssueSheet.tsx`, Ergänzungen `BoulderSheet.tsx`, `ClimberSectorView.tsx`, `WallPhotoCanvas.tsx`
- Ergänzungen `src/types/boulder.ts`, `src/types/gym.ts`, `src/lib/syncService.ts`, `src/lib/batchBoulderService.ts`
- `src/lib/i18n/en-ai-capture.ts`; offen: `public/datenschutz.html`
- Stufe 2 (Edge Function) noch nicht gebaut.

## 10. Aufgaben für Hans (nicht von Claude machbar)

1. **Pilot (Stufe 1):** Gemini CLI bzw. Antigravity mit Google-Anmeldung auf dem PC bereit; Nutzungsbedingungen/Training prüfen (Abschnitt 6); Worker-Konto anlegen; Windows-Aufgabenplanung für `worker.ts` einrichten (Anleitung in `scripts/ai-capture/README.md`); Migration im SQL-Editor einspielen.
2. **Erst für Stufe 2:** API-Konto beim gewählten Anbieter (Google AI Studio bezahlt oder console.anthropic.com), Edge Function `ai-capture` im Supabase-Dashboard anlegen und Secret setzen.
3. **20+ Testfotos** der Pilot-Halle (Sektoren mit bekannten Routen) für das Qualitäts-Tor bereitstellen.
4. Datenschutz-Text prüfen (lassen) und mit der Pilot-Halle den Auftragsverarbeitungsvertrag ergänzen.

## 11. Offene Grundsatzfragen (mit Empfehlung)

- **O1 Wer zahlt die KI-Kosten?** Empfehlung: in der Pilotphase BoulderMate (wenige Euro pro Halle und Monat), später im Hallen-Preis enthalten.
- **O2 Studio auf Englisch** (internationale Schrauber): Empfehlung: eigene Spec, nicht Teil von SPEC-052.

## 12. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-27 | – (Grill-me) | G1–G12 nach Empfehlung (→ v1) | – |
| 1 | 2026-10-27 | Tape-Hallen (hoch), zwei Routen gleicher Farbe (hoch), Teil-Umbau verliert Tops (hoch), Datenschutz (hoch) | Tape-Schalter + `hold_color`, Farbliste an KI, Sicherheit je Route, Modusfrage ganz/einzeln, unsicher → alte Route bleibt, Einschalten pro Halle, «direkt/erst prüfen», «Stimmt was nicht?» + «Route fehlt», Namensregeln, «geschätzt», Pin am Start, Obergrenze, Hintergrund-Upload (→ v2) | Panorama/mehrere Fotos (überladen), KI schätzt Fb-Grad (Fehlerquelle) |
| 2 | 2026-10-27 | Falsches Foto bei «direkt live» (hoch), Tape unlesbar (hoch) | «Ergebnis zurücknehmen» 24 h, «Grad folgt», Kamera-Knopf in Sektorliste + Frage vor der Kamera, «Kurz prüfen» ohne Rot und 7 Tage, Merkmale wie Schrauber-Werte, Namensstil, Status bis fertig, Datenschutz-Satz, Monatszähler (→ v3) | Studio Englisch (eigene Spec), Verpixeln (eigener Umfang), Kletterer-Namensvorschläge (Missbrauch) |
| 3 | 2026-10-27 | keine «hoch»; Qualität vor Livegang messen (mittel), Screenreader, «Grad folgt» nicht grau | Qualitäts-Tor mit Schwellen, `aria-label`/`aria-live`, Fragezeichen statt Grau, Fotograf = Schrauber, «geschätzt» nur einmal (→ v4, READY) | eigene Kamera-Ansicht mit Rahmen (System-Kamera robuster), hallenübergreifend eindeutige Namen (unnötig) |
| 4 | 2026-10-29 | Nachtrag Hans: Hallen zeigen den Grad verschieden (Zettel am Start, Griff-Farbe, Zeichen). Runde: Zeichen-Hallen ohne Farbsystem (hoch), mehrere Schreibweisen (mittel), ältere Admins verstehen «Tape/Symbol» nicht (mittel) | dritte Art «Zeichen am Start», Zeichen je Farbe mit Komma, Klartext-Knöpfe mit Beispielsatz untereinander, Hinweis-Feld an die KI (→ v5-Entwurf) | Art je Sektor (selten, Hinweis-Feld genügt), Foto-Beispiel je Art hochladen (später) |
| 5 | 2026-10-29 | Falsch eingestellte Art fällt erst spät auf (hoch), leere Zeichen-Felder (mittel), Hinweis-Feld als Hintertür in die KI (mittel) | Studio zeigt «KI liest den Grad an: …», Hinweis bei fehlendem Zeichen + «Grad folgt», Hinweis nur Admin, ≤ 300 Zeichen, im Auftrag als Information markiert (→ v5) | Fb-Grad automatisch aus Zeichen ableiten (Fehlerquelle, Zuordnung genügt) |
| 6 | 2026-10-29 | keine «hoch»; Englisch-Texte, Wechsel der Art | Wechsel gilt nur für neue Fotos (→ v5, READY) | Admin-Texte auf Englisch (Admin und Studio bleiben deutsch, siehe O2) |

## 13. Stand der Qualitätsmessung (2026-10-27)

Pilot-Halle 6a plus, 15 Sektoren, 98 von Hans eingetragene Routen (an mehreren Wänden hängen mehr Routen als eingetragen).

| Lauf | Blind | gefunden | Farbe richtig | Bemerkung |
|---|---|---|---|---|
| claude-v0 | ja | 81 % | 86 % | 8 Sektoren, Farbsystem der Halle noch unbekannt |
| gemini-v0 | ja | 83 % | 88 % | 8 Sektoren, Farbsystem der Halle noch unbekannt |
| gemini-manual-v1 bis v3 | nein | 95–98 % | 98–100 % | **ungültig**: Punkte im Median 0.010 von Hans' Pins, an Wänden mit vielen nicht eingetragenen Routen fand «die KI» fast genau Hans' Routen. Abgeschrieben, nicht erkannt. |
| gemini-cli-v3 (gemini-2.5-pro) | ja | 78 % | 72 % | Median-Abstand 0.018 |
| gemini-cli-v4 (gemini-2.5-pro) | ja | 73 % | 68 % | Hauptfehler Tape-Farbe (Rot ↔ Blau/Weiss/Grün) → zweiter Blick auf die Farbe gebaut |
| cli-v5 (gemini-2.5-pro, ohne Farb-Check) | ja | 78 % | 72 % | Median-Abstand 0.018 |
| cli-v5-farbcheck (mit 4×4-Kontaktbogen) | ja | 78 % | 86 % | Median-Abstand 0.017 (+14 Pp. durch zweiten Blick) |
| cli-v6-farbcheck (mit «Grad folgt»-Fix) | ja | 78 % | 88 % | Median-Abstand 0.017 (+16 Pp.; in 11/15 Sektoren 100 % Farbe; 26 von 32 «zusätzlichen» KI-Routen sind echte, noch nicht in Supabase eingetragene Wand-Routen) |

Nächster Schritt: In den teilweise erfassten Sektoren (`Ecke Vorne`, `Verlängerung Überhang`, `Zwischenwand Vorne`, `Cave Wand`) die restlichen Wand-Routen in den Vergleichsdaten ergänzen und optional mit neuerem Gemini-Modell (`--model`) gegenprüfen. Das Qualitäts-Tor gilt erst als geschafft, wenn ein Blindlauf es besteht.
