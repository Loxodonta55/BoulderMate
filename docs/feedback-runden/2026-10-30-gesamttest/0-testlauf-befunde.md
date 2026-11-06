# Gesamttest 2026-10-30: Befunde nach Schwere

> **Stand:** `62839c5` auf `feat/ux-overhaul-v2`, als eingefrorene Kopie getestet (Vite auf eigenem Port). Grund: Während des Tests hat Antigravity alles als `62839c5` committet und danach weiter an `App.tsx`, `FuerHallenPage.tsx` und `hallenVerzeichnis.ts` gearbeitet. Der laufende Dev-Server lud dadurch alle 2 bis 3 Sekunden neu, zeitweise fehlte `./components/partner/PartnerPage` (Import ohne Datei). Ergebnisse gegen das bewegliche Arbeitsverzeichnis wären wertlos gewesen.
> **Getestet von:** Claude Code. Simulierte Nutzerrunde mit 210 Personen: [1-unterhaltung.md](1-unterhaltung.md), Auswertung: [2-auswertung-und-vorschlaege.md](2-auswertung-und-vorschlaege.md).

## Ergebnis auf einen Blick

| Prüfung | Ergebnis |
|---|---|
| Typecheck `tsc --noEmit` | grün (Arbeitsstand und `62839c5`) |
| Unit-Tests (Vitest) | 919 von 921 grün, 2 rot; beide laufen einzeln grün (siehe M5) |
| Playwright, 3 Geräte | **364 grün, 4 rot, 4 übersprungen** (26 Min). Die 4 roten wiederholt: alle wieder rot (siehe H3, M1, M6) |
| Supabase-Migrationen SPEC-046, 052, 053 | eingespielt (nur lesend geprüft: neue Spalten in `boulders`, `gyms`, `user_profiles`, Tabellen `hallen_verzeichnis`, `hallen_wuensche`, `hallen_empfehlungen` antworten). Fehlende Migrationen sind **nicht** Ursache der Befunde |
| Rollen-Durchgang | Gast, Kletterer, Schrauber, Admin auf Desktop hell DE, iPhone 15 dunkel EN, iPhone SE hell DE; Fundstellen bei 375 und 390 px nachgemessen |

Nicht getestet: echte Anmeldung mit den SPEC-027-Konten (Passwörter liegen mir nicht vor), native App (Capacitor), echte Kamera, Offline-Verhalten. Die Rollen liefen über die lokalen Testprofile mit blockiertem Supabase, damit nichts nach PROD geschrieben wird; der Gast las echte Daten.

## Hoch

**H1 · Studio: «Speichern & Veröffentlichen» auf jedem Handy abgeschnitten.**
Die feste Leiste unten in `BatchBoulderWorkflow.tsx` (`flex justify-between`, kein Umbruch) schiebt `publish-batch-btn` über den rechten Rand. Gemessen: x = 294 bis 443 px bei 320, 375 und 390 px Breite (iPhone SE bis iPhone 15). Sichtbar ist nur «Speicher… / Veröffentl…». Schrauber finden den Knopf nicht und verlieren Arbeit. Vorschlag: Zähler und Knopf auf Handybreite in zwei Zeilen, Knopf volle Breite.

**H2 · «Ansehen als …» liegt über dem Fenster «Arbeitsbereich wählen».**
Nur für Plattform-Admins sichtbar. Bei 320 px verdeckt er die Karte «Hallen-Administration», und die Pfeile der Karten ragen rechts über den Kartenrand; bei 375 px verdeckt er «Abbrechen & Zurück». Die Überschrift berührt bei 375 px den Schließen-Knopf. Vorschlag: «Ansehen als …» ausblenden, solange ein Fenster offen ist.

**H3 · Startseite passt auf dem iPhone 15 nicht mehr auf einen Bildschirm** (Playwright, Mobile Safari: `google-login.spec.ts:151` und `redesign-kreide.spec.ts:41`, Überlauf 197 bzw. 133 px).
Seit SPEC-053 und SPEC-028 kamen «Hallen ansehen», «Wer ist heute da?» und «Als Kletterer testen» dazu. Ein Teil des Überlaufs sind die Dev-Knöpfe (Hans, Schrauber, Boris), die es nur lokal gibt; ob der Google-Knopf auf PROD ohne Scrollen sichtbar bleibt, ist auf einem echten iPhone zu prüfen. Gilt nach SPEC-024 als Pflicht.

## Mittel

**M1 · Hauptknopf der Startseite wechselt zwischen schwarz und weiß** (Playwright `redesign-kreide.spec.ts:14`: im ersten Lauf rot auf Mobile Chrome, in der Wiederholung grün auf Chrome und rot auf Mobile Safari; erwartet Graphit `rgb(26,25,24)`, bekommen Weiß).
Im Durchgang gab es zwei Fassungen der Startseite: «Konto erstellen» (schwarz) und «Mit Google fortfahren / Mit E-Mail fortfahren» (weiß mit Rand). Welche erscheint, hing im Test davon ab, ob Supabase erreichbar war. Zu klären, ob gewollt; der Test erwartet die schwarze.

**M2 · Englisch nur halb.** Bei englischem Gerät sind deutsch: das Hallenwahl-Sheet («Halle wählen», «Halle oder Ort», «In meiner Nähe», «Zur Wand», «97 Boulder»), das Fenster «Arbeitsbereich wählen» und der Block Treff in den Einstellungen («Niveau zeigen», «Treff ausblenden», «Meine Einträge löschen»), obwohl der Tab «Meet» heißt. Studio und Admin sind laut SPEC-039 bewusst noch deutsch; die Hallenwahl ist aber der erste Bildschirm für Gäste.

**M3 · Tippflächen unter 44 px** (Regel aus SPEC-020): Lupe +/− und Vollbild im Wandfoto 28 × 28, Logo-Knopf 28 breit, Sektor-Chips im Studio 28–30 hoch, Studio-Kopf (`studio-switch-workspace-btn` 30 × 22, `studio-back-to-climber-btn` 68 × 26), Karten-Zoom 30 × 30, Treff-Schalter im Admin 28 × 28, Dev-Quick-Login 24 hoch.

**M4 · Admin «Zahlen» ohne Zeitraum.** «7 Begehungen» neben «0 Kletterer (30 Tage)» wirkt widersprüchlich, weil nur eine Kachel ihren Zeitraum nennt.

**M5 · Unit-Tests hängen von der Reihenfolge ab.** Rot im Gesamtlauf, grün einzeln:
- `spec028TreffView.test.tsx` «AC-12: Halle ohne Treff zeigt einen Satz statt der Knöpfe»
- `spec051ChallengeToday.test.tsx` «Top auf der Challenge: Challenge geschafft! (AC-11)» (`candidate` ist `null`) und wackelnd «Neu an der Wand hat Vorrang (AC-8)».
Wahrscheinlich bleibt Zustand eines vorherigen Tests übrig (AC-8 setzt einen geplanten Umbau, `beforeEach` räumt nur `localStorage` und Begehungen auf). Kein App-Fehler, aber `npm run test:all` ist dadurch nicht verlässlich grün.

**M6 · Admin: Sektor löschen auf dem iPhone** (Playwright Mobile Safari `admin-ux.spec.ts:41`, zweimal rot, auf Desktop und Android grün): Nach «Löschen» mit Rückfrage ist der Sektor noch da (erwartet 0, gefunden 1). Entweder löscht Safari wirklich nicht, oder die Rückfrage wird dort anders bestätigt. Auf einem echten iPhone nachprüfen.

## Niedrig

**N1 · Erklärkarte beim ersten Loggen** schiebt Flash/Top/Projekt auf kleinen Handys unter den Rand; man muss scrollen.

**N3 · «Batch-Schraubermodus»** steht doppelt über «Wand auswählen & Boulder erfassen».

**N4 · Lange Namen** (Hallenname, Spitzname) werden in der Kopfzeile abgeschnitten; Hallenname im Studio-Kopf und im Hallen-Pill doppelt.

**N5 · Weiß** hat im hellen Modus einen sehr blassen Rand.

**N6 · Feedback-Knopf** ist am Desktop das dunkelste, auffälligste Element der Kopfzeile.

## Hinweise zum Ablauf (kein App-Fehler)

- Paralleles Arbeiten von Antigravity im selben Ordner macht Testläufe unbrauchbar (Dauer-Neuladen, fehlende Importe). Für künftige Gesamttests: vorher committen und einen Stand einfrieren, oder getrennte Worktrees.
- Im eingefrorenen Stand lieferte Vite die Inter-Schrift nicht aus (403 wegen verlinktem `node_modules`). Bildschirmfotos zeigen deshalb die Ersatzschrift; die Maße weichen leicht ab, die Größenordnung von H1 (fast 150 px zu breit) und H2 ändert das nicht. H3 kommt aus der normalen Playwright-Suite und ist auf einem echten iPhone nachzuprüfen.
- Die Antigravity-Einträge AC-010 und AC-011 in `docs/agent-chat/CHAT.md` (KI-Erfassung) gehören nicht zu diesem Test und sind hier nicht bearbeitet.
