# SPEC-021: Umschrauben im Schrauber-Studio

## Status: DONE (bis auf Anzeige der Foto-Historie, AC-11)

## Ausgangslage (Ist-Stand im Code)
- Schrauber-Studio (`BatchBoulderWorkflow`) kann bereits: neues Wandfoto setzen (`updateSectorPhoto`, ersetzt das alte Foto ohne Historie), bestehende Boulder einzeln zum Archivieren vormerken, aktive Boulder bearbeiten (Farbe, Name, Radar, Position), neue Drafts setzen und alles per `publishBatch` veröffentlichen.
- Boulder-Status: `draft | active | archived`. Archivierte Boulder bleiben in Logbüchern erhalten.
- Ein Sektor hat genau ein `wallPhotoUrl`; archivierte Boulder verweisen auf Koordinaten des alten Fotos.
- Änderung von Farbe/Grad an einem aktiven Boulder überschreibt in place; bestehende Begehungen und Bewertungen (soft/fair/stiff) bleiben am Boulder hängen.

## Szenarien
- **a) Komplett umgeschraubt**: alle alten Routen weg, alle neuen Routen da.
- **b) Komplett abgeschraubt, teilweise neu geschraubt**: wird später fertig.
- **c) Kleine Änderungen**: einzelne Routen geändert, evtl. nur Grad.

## Entscheidungen
- **E1 – Explizite Moduswahl**: Beim Öffnen einer Wand wählt der Schrauber zwischen zwei Buttons:
  - «Wand neu schrauben» (Szenario a + b): alle aktiven Routen werden auf einen Schlag zum Abschrauben vorgemerkt, ein neues Wandfoto wird verlangt.
  - «Routen anpassen» (Szenario c): heutiger Ablauf, unverändert schnell.
- **E2 – Neue Routen erst bei fertiger Wand**: Bei Szenario b sehen Kletterer keine neuen Routen, bis die Wand komplett fertig ist. Neue Routen bleiben bis dahin Entwürfe.
- **E3 – Umstellung erst bei «Wand fertig»**: Bis der Schrauber «Wand fertig» tippt, sehen Kletterer die Wand unverändert (altes Foto, alte Routen, weiter loggbar). Beim Tippen auf «Wand fertig» passiert alles auf einmal: alte Routen werden archiviert, neue veröffentlicht, das neue Foto wird live.
  - Folge: Das neue Foto muss als Entwurfsfoto getrennt vom Live-Foto gespeichert werden (heute überschreibt `updateSectorPhoto` sofort das Live-Foto).
- **E4 – Umbau gehört der Wand, nicht der Person**: Jeder Schrauber der Halle sieht einen laufenden Umbau, kann weitere Entwürfe setzen und «Wand fertig» tippen.
  - Folge: Die RLS-Regel «Drafts nur für Ersteller und Admins sichtbar» (SPEC-002) muss für Drafts eines Umbaus auf alle Schrauber der Halle erweitert werden.
- **E5 – Foto-Historie**: Alte Wandfotos werden aufbewahrt. Archivierte Routen werden im Logbuch auf dem Foto angezeigt, auf dem sie gesetzt wurden.
  - Folge: Neue Tabelle für Wandfotos pro Sektor (z. B. `sector_photos`), jeder Boulder verweist auf sein Foto. Bestehende Boulder werden dem aktuellen Foto zugeordnet.
- **E6 – Nur Grad geändert**: Die Route bleibt dieselbe (gleiche ID). Begehungen, Sterne und Kommentare bleiben erhalten. Die Grad-Einschätzungen (soft/fair/stiff) werden zurückgesetzt, weil sie sich auf den alten Grad beziehen.
- **E7 – «Neu geschraubt» für einzelne Routen**: Im Bearbeiten-Sheet einer aktiven Route gibt es den Button «Neu geschraubt». Die alte Route wird archiviert, an derselben Position entsteht ein neuer Entwurf mit vorausgewählter Farbe. Kletterer können ihn nach dem Veröffentlichen neu loggen.
- **E8 – «Neu»-Badge**: Neue Routen und neu geschraubte Wände tragen 7 Tage ab Veröffentlichung ein kleines «Neu»-Badge (Sektorliste und Pin). Basis: `publishedAt` der Route bzw. Zeitpunkt von «Wand fertig».
- **E9 – Umbau verwerfen**: Ein laufender Umbau kann mit «Umbau verwerfen» (mit Rückfrage) abgebrochen werden. Alle Entwürfe des Umbaus und das Entwurfsfoto werden gelöscht, die Live-Wand bleibt unverändert.
- **E10 – Hinweis «Im Umbau»**: Während ein Umbau läuft, sehen Kletterer über der Wand (und in der Sektorliste) einen kleinen Hinweis «Im Umbau». Alte Routen bleiben sichtbar und loggbar.

## User Stories
- **US-1**: Als Schrauber möchte ich «Wand neu schrauben» starten, damit alle alten Routen gesammelt ersetzt werden, ohne jede einzeln zu archivieren.
- **US-2**: Als Schrauber möchte ich einen Umbau über mehrere Tage und mit Kollegen fortsetzen, bevor die Wand für Kletterer umschaltet.
- **US-3**: Als Schrauber möchte ich mit einem Tap auf «Wand fertig» Foto und Routen auf einmal live schalten.
- **US-4**: Als Schrauber möchte ich bei einzelnen Routen nur den Grad korrigieren oder sie als «Neu geschraubt» ersetzen.
- **US-5**: Als Kletterer möchte ich sehen, welche Wand im Umbau ist und was neu ist.
- **US-6**: Als Kletterer möchte ich alte Routen im Logbuch auf dem damaligen Wandfoto sehen.

## Acceptance Criteria
- [x] **AC-1 Moduswahl**: Das Studio öffnet wie bisher im Modus «Routen anpassen»; daneben steht der Button «Wand neu schrauben». Läuft für den Sektor bereits ein Umbau, öffnet sich direkt der Umbau. *(E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [x] **AC-2 Umbau starten**: «Wand neu schrauben» verlangt ein neues Wandfoto (Kamera oder Mediathek) und startet damit den Umbau. Das Foto wird als Entwurfsfoto gespeichert; das Live-Foto bleibt unverändert. *(Unit: `tests/spec021Rebuild.test.ts`, E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [x] **AC-3 Umbau-Ansicht**: Im Umbau zeigt das Studio das Entwurfsfoto und nur die Entwürfe. «Wand fertig» ist erst mit mindestens einem Entwurf aktiv. *(E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [x] **AC-4 Persistenz und Team**: Umbau-Status, Entwurfsfoto und Entwürfe werden nach Supabase synchronisiert und sind für alle Schrauber der Halle sichtbar. Voraussetzung: Migration `supabase/migrations/20261006_spec021_umschrauben.sql` ist eingespielt. *(Nicht automatisiert getestet: E2E läuft absichtlich ohne Supabase.)*
- [x] **AC-5 Kletterer während Umbau**: Kletterer sehen Live-Foto und alte Routen unverändert und können sie loggen. Über der Wand, im Sektor-Tab und im Vollbild steht «Im Umbau». Entwürfe sind für Kletterer nie sichtbar. *(E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [x] **AC-6 Wand fertig**: «Wand fertig» zeigt die Zusammenfassung und führt dann aus: alle aktiven Routen → `archived` (mit Foto), alle Entwürfe → `active`, Entwurfsfoto → Live-Foto, Umbau beendet. *(Unit: `tests/spec021Rebuild.test.ts`, E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [x] **AC-7 Umbau verwerfen**: «Umbau verwerfen» fragt nach und löscht dann alle Entwürfe und das Entwurfsfoto. Live-Wand und alte Routen bleiben unverändert. *(Unit: `tests/spec021Rebuild.test.ts`, E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [x] **AC-8 Grad ändern**: Ändert ein Schrauber bei einer aktiven Route Farbe oder Font-Grad, bleiben ID, Begehungen, Sterne und Kommentare erhalten; die Grad-Einschätzungen (soft/fair/stiff) werden gelöscht. Erneutes Speichern derselben Farbe setzt nichts zurück. *(Unit: `tests/spec021Rebuild.test.ts`)*
- [x] **AC-9 Neu geschraubt**: Im Bearbeiten-Sheet einer aktiven Route merkt «Neu geschraubt» die Route zum Abschrauben vor und legt an derselben Position einen Entwurf mit derselben Farbe an; beides geht über die Veröffentlichen-Leiste live. *(E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [x] **AC-10 Neu-Badge**: Sektoren, deren Umbau vor weniger als 7 Tagen abgeschlossen wurde, zeigen im Sektor-Tab «Neu». Einzeln neue Routen (jünger als 7 Tage, nicht Teil eines Wand-Umbaus) zeigen am Pin «Neu». *(Unit: `tests/spec021Rebuild.test.ts`, E2E: `tests/e2e/spec021-umschrauben.spec.ts`)*
- [ ] **AC-11 Foto-Historie**: Jede abgeschraubte Route speichert das Wandfoto, auf dem sie hing (`wallPhotoUrl`). *(Speichern umgesetzt, Unit + E2E.)* Offen: Anzeige in Logbuch und Detailansicht, die heute kein Wandfoto zeigen.
- [x] **AC-12 Migration**: Die Migration ist rein additiv (4 Spalten). Ohne sie läuft die App weiter und synchronisiert ohne die neuen Felder. Ältere archivierte Routen bleiben ohne Foto. Keine Daten gehen verloren (SPEC-013).

## Tests
Jedes Feature braucht Unit- und Playwright-Tests.
- **Unit (Vitest)**: `tests/spec021Rebuild.test.ts`, 6 Tests (Service: Umbau starten, abschließen, verwerfen, Grad-Reset, Foto-Historie, Neu-Badge).
- **E2E (Playwright)**: `tests/e2e/spec021-umschrauben.spec.ts`, 3 Abläufe (Wand neu schrauben bis «Wand fertig» inkl. Kletterer-Sicht, Umbau verwerfen, Neu geschraubt). Grün auf Desktop Chrome und Mobile Chrome (Pixel 7); Mobile Safari nicht geprüft.
- Die E2E-Tests blockieren Supabase, damit kein Lauf Routen in der Produktion abschraubt.

## Technical Design (umgesetzt)

Bewusst schlanker als ursprünglich skizziert: statt eigener Tabellen tragen Sektor und Boulder die nötigen Felder direkt.

### Data Model (Migration `supabase/migrations/20261006_spec021_umschrauben.sql`)
```sql
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS draft_photo_url TEXT;        -- Entwurfsfoto im Umbau
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuild_started_at TIMESTAMPTZ; -- gesetzt = Umbau läuft
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuilt_at TIMESTAMPTZ;        -- «Wand fertig» (Neu-Badge)
ALTER TABLE public.boulders ADD COLUMN IF NOT EXISTS wall_photo_url TEXT;         -- Foto beim Abschrauben
```
- Ein Umbau pro Sektor (ergibt sich aus den Feldern). Während des Umbaus gehören alle Entwürfe des Sektors zum Umbau.
- Beim Abschluss werden alle `active` Routen des Sektors archiviert; eine eigene Vormerk-Spalte ist nicht nötig.
- Foto-Historie: Eine Route bekommt beim Abschrauben (`archived`) das damalige Live-Foto in `wall_photo_url`. Ältere archivierte Routen bleiben ohne Foto.
- Ohne eingespielte Migration synchronisiert die App ohne die neuen Spalten weiter; Umbau-Status bleibt dann nur lokal auf dem Gerät.

### Service (`batchBoulderService.ts`)
- `setRebuildPhoto(sectorId, url)`: startet den Umbau bzw. tauscht das Entwurfsfoto.
- `completeSectorRebuild(sectorId)`: AC-6.
- `discardSectorRebuild(sectorId)`: AC-7.
- `isSectorInRebuild`, `isRecentlyNew` (7 Tage).
- Entwürfe eines laufenden Umbaus werden sofort nach Supabase synchronisiert (AC-4).
- `updateBoulderDetails`: Farb- oder Font-Grad-Änderung an aktiver Route ruft `clearGradeFeels` (AC-8).
- `publishBatch`: archivierte Routen bekommen `wallPhotoUrl` (AC-11).

### UI
- `BatchBoulderWorkflow.tsx`: Button «Wand neu schrauben» neben «Foto» (der normale Studio-Modus ist «Routen anpassen»), Badge «Im Umbau», «Umbau verwerfen», Leiste «X neu · Y abgeschraubt · Wand fertig» mit Zusammenfassung.
- `BoulderBottomSheet.tsx`: «Neu geschraubt» (AC-9).
- `ClimberSectorView.tsx` / `WallPhotoCanvas.tsx`: «Im Umbau» über der Wand, im Sektor-Tab und im Vollbild-HUD; «Neu» am Sektor-Tab nach «Wand fertig». Am Pin nur für einzeln neue Routen, damit eine komplett neue Wand nicht mit Badges übersät ist.

### Noch offen
- Logbuch und Detailansicht zeigen heute kein Wandfoto. Die Foto-Historie wird gespeichert, angezeigt wird sie erst, wenn das Logbuch ein Wandbild bekommt.

### UX-Texte (bewusst knapp)
«Wand neu schrauben» · «Routen anpassen» · «Wand fertig» · «Umbau verwerfen» · «Neu geschraubt» · «Im Umbau» · «Neu»

## Dependencies
- Baut auf SPEC-002, SPEC-017, SPEC-019, SPEC-020 (AC-10) auf.

## Out of Scope
- Push-Benachrichtigungen über neue Wände.
- Teil-Umbau einer Wand (nur ein Bereich wird neu geschraubt): wird über «Routen anpassen» + «Neu geschraubt» abgedeckt.
- Mehrere parallele Umbauten am selben Sektor.

## Offene Fragen
- Keine (im Grill-Me Interview geklärt).
