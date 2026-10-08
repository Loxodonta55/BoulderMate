# SPEC-022: Kletterer-UX – Ordnung, Übersicht, wenig Text

## Status: IN PROGRESS (umgesetzt 2026-10-06/07, uncommitted)

> **Owner:** Hans · **Created:** 2026-10-06 · **Baut auf:** SPEC-020 (Design System v2 «Kreide»), SPEC-021 (Umschrauben)
>
> Geplant nach der Grill-me-Methode. Hans hat die Fragen nicht selbst beantwortet (nachts beauftragt, «beantworte alle Fragen selbst mit der Empfehlung»). Jede Antwort unten ist die Empfehlung von Claude und kann geändert werden.

---

## 1. Ausgangslage (Analyse 2026-10-06, iPhone 390×844, dunkel)

Screenshots: Wand, Boulder-Detail und Statistik vor dem Umbau. Befunde:

| # | Befund | Wo |
|---|---|---|
| B1 | Die Halle wird **dreimal** gezeigt: Header-Auswahl, Sektor-Karte («6a plus …»), zweite Hallen-Auswahl in der Wand. | `AppHeader`, `ClimberSectorView` |
| B2 | Bis zum Wandfoto stehen **4 Blöcke** übereinander (Sektor-Karte, Chip-Leiste, «1/8», Filterleiste). Das Foto beginnt erst bei ca. 40 % der Höhe. | `ClimberSectorView` |
| B3 | Die Routenliste liegt **unter** der Bottom-Nav und ist ohne Scrollen nicht sichtbar. | `ClimberSectorView` |
| B4 | Routenkarten sind groß (Notiz-Zitat, «+ Bewerten / 0 Wertung»-Kasten, «Votes», Ribbon «5.0 HALLEN-KLASSIKER»). Pro Bildschirm passen 2–3 Routen. | `ClimberSectorView` |
| B5 | Filter «Top» und «Beliebt» sind schwer zu unterscheiden; «Projekte» zeigt nur eigene Projekte, «noch nicht geklettert» fehlt. Dazu Sortier-Dropdown und «Filter zurücksetzen»-Link. | `ClimberSectorView` |
| B6 | Boulder-Detail ist ein Vollbild-Modal mit 7 Karten (Begehung, Community, Barometer, Charakter, Begehungen, Wertungen, Diskussion). Loggen braucht 2–3 Taps, danach geht automatisch noch ein Bewertungs-Dialog auf. | `BoulderDetailModal` |
| B7 | «Ich» hat **zwei Ebenen Unter-Tabs** (Overall/Deep Dive, darin Übersicht/Stil) plus Hallen-Dropdown. Logbuch-Zeilen tragen 6 Infos und brechen um («Sektor Unbekannt»). | `UserProfileView` |
| B8 | Die Bottom-Nav hat 3–4 Knöpfe; zwei davon (Login mit abgeschnittenem Namen, Studio) sind keine Tabs. Header zeigt zusätzlich Login-Knopf, Personen-Umschalter und Arbeitsbereich-Knopf. | `MobileBottomNav`, `AppHeader` |
| B9 | Fertige, schlankere Komponenten (`MeView`, `BoulderSheet`, `Sheet`, `Toast`) existieren, sind aber nicht eingebunden. Der Toast-Host fehlt in `App`. | `App.tsx` |

---

## 2. Grill-me: Fragen und gewählte Antworten

**F1 – Was sieht der Kletterer zuerst, wenn er die App öffnet?**
→ Das Wandfoto, direkt unter dem Header, randlos über die volle Breite. Darüber steht nichts. Darunter in dieser Reihenfolge: Sektor-Pill, Filter, Routenliste.
*Warum:* Die Wand ist das Interface (SPEC-020 §1); alles andere ist Steuerung dafür.

**F2 – Wo wählt man die Halle?**
→ Nur im Header (`Hallenname ▾`). Die zweite Auswahl in der Wand und die Hallen-Zeile in der Sektor-Karte entfallen. Auf dem Handy entfällt das Wort «BoulderMate» im Header, damit der Hallenname Platz hat.
*Warum:* Ein Ort pro Funktion (SPEC-020 §3).

**F3 – Wie wechselt man den Sektor?**
→ Eine Sektor-Pill direkt unter dem Foto: `‹  Sektorname · 2/8  ›`. Pfeile springen zum vorherigen/nächsten Sektor, Tippen auf den Namen öffnet ein Sheet mit allen Sektoren (Name, Anzahl Boulder, «Neu»/«Im Umbau»). Wischen auf dem Foto bleibt. Die Chip-Leiste entfällt.
*Warum:* Die Chip-Leiste zeigte bei 8 Sektoren nur 2 Namen und brauchte eine eigene Zeile plus Zähler.

**F4 – Welche Filter braucht ein Kletterer?**
→ Genau vier Chips: `Alle` · `Offen` · `Neu` · `★ Top`.
- *Offen* = von mir noch nicht getoppt/geflasht (Projekte zählen als offen).
- *Neu* = «Neu»-Badge aus SPEC-021 (7 Tage); der Chip erscheint nur, wenn es neue Boulder gibt.
- *★ Top* = Schnitt ≥ 4,0 Sterne.
- «Beliebt» und «Projekte» entfallen, ebenso «Filter zurücksetzen» (Tippen auf «Alle» genügt).
*Warum:* Die häufigste Frage an der Wand ist «was fehlt mir noch?». Entspricht SPEC-020 AC-3.1.

**F5 – Braucht es eine Sortierung?**
→ Nein, keine Auswahl. Die Liste ist fest nach Schwierigkeit sortiert (Reihenfolge der Hallenfarben, leicht → schwer), danach nach Name.
*Warum:* Kletterer denken in Graden; ein Bedienelement weniger.

**F6 – Wie sieht eine Route in der Liste aus?**
→ Eine Zeile: Farbpunkt · Name · Grad · `★ 4,5` · Status-Symbol rechts (⚡ Flash, ✓ Top, ◎ Projekt). «Neu» als kleines Badge. Hallen-Klassiker (≥ 4,8 ★) bekommen einen Messing-Ring um den Farbpunkt statt eines Banners. Keine Notizen, kein «+ Bewerten»-Kasten, keine «Votes».
*Warum:* 8–10 Routen pro Bildschirm statt 2–3; Status ist ohne Lesen erkennbar (SPEC-020 AC-3.3).

**F7 – Was passiert beim Tippen auf einen Pin oder eine Route?**
→ Das `BoulderSheet` öffnet halb: Farbe, Name, Grad, Sterne, drei große Knöpfe ⚡ Flash / ✓ Top / ◎ Projekt. Ein Tap loggt, das Sheet schließt, ein Toast «Top geloggt · Rückgängig» mit Mini-Sternen erscheint. «Details» zieht das Sheet ganz auf. Das alte `BoulderDetailModal` wird im Kletterer-Bereich nicht mehr verwendet (Datei bleibt bis zu einer Aufräum-Runde, weil Tests sie direkt prüfen).
*Warum:* 2-Tap-Logging (SPEC-020 AC-5); der automatische Bewertungs-Dialog nach dem Loggen nervt an der Wand.

**F8 – Geht beim Wechsel aufs Sheet etwas verloren?**
→ Nein. Die Liste «Wer war schon oben» (Begehungen und Wertungen anderer, inkl. Soft/Fair/Stiff) wandert in die Voll-Ansicht des Sheets. Tippen auf einen Namen öffnet wie bisher das öffentliche Profil. Beim Öffnen wird wie bisher still mit Supabase synchronisiert.
*Warum:* SPEC-015 AC-16 («Was haben Freunde bewertet?») bleibt erfüllt.

**F9 – Was passiert, wenn man den bereits aktiven Status nochmal antippt?**
→ Nichts. Entfernen geht nur über «Eintrag entfernen» in den Details (mit Rückgängig).
*Warum:* Mit Kreide an den Fingern löscht man sonst versehentlich.

**F10 – Wie sieht «Ich» aus?**
→ `MeView` ersetzt `UserProfileView`: eine Seite ohne Unter-Tabs. Kopf mit Avatar und Name, Umschalter `Halle | Alle Hallen`, drei Zahlen (Tops, Flash-Quote, Bester Grad), Grad-Pyramide, Stil, Verlauf nach Tagen. Einstellungen über das Zahnrad.
*Warum:* SPEC-020 AC-7; flache Navigation.

**F11 – Welche Knöpfe hat die untere Leiste?**
→ Nur `Wand` und `Ich` (Person-Symbol). «Studio» und «Login/Name» entfallen. Arbeitsbereich wechseln und Abmelden gibt es unter Ich → Einstellungen.
*Warum:* Tabs sind Orte, keine Aktionen (SPEC-020 §3).

**F12 – Was bleibt rechts im Kletterer-Header?**
→ Für reine Kletterer nichts. Schrauber und Admins behalten einen kleinen Werkzeug-Knopf (`climber-switch-workspace-btn`), weil sie oft wechseln. Auf dem Desktop zusätzlich die zwei Tabs `Wand` / `Ich`. Der Personen-Umschalter (Test-Personas) erscheint nur noch im Dev-Build. Der Login-Knopf entfällt.
*Warum:* Wer die App sieht, ist angemeldet; Konto liegt in den Einstellungen. Der Werkzeug-Knopf stört Kletterer nicht, weil sie ihn nie sehen, und spart Schraubern drei Taps.

**F13 – Bleibt das Rollen-Gateway nach dem Login?**
→ Ja, vorerst. Es betrifft nur Schrauber und Admins, und SPEC-006-Tests hängen daran. Wegfall laut SPEC-020 AC-8.3 ist eine eigene Runde.

**F14 – Muss das Foto ≥ 70 % der Höhe füllen (SPEC-020 AC-1.1)?**
→ Nicht in dieser Runde. Hallenfotos sind Querformat; ohne Beschnitt passen sie auf dem Handy nur in voller Breite. Das Foto steht deshalb ganz oben, randlos, ohne Rahmen; der Vollbild-Knopf bleibt. AC-1.1 bleibt offen.
*Warum:* Beschneiden würde Pins verstecken (SPEC-016 Koordinaten-Treue).

**F15 – Welche Texte fallen im Vollbild weg?**
→ «← Wischen für Sektorwechsel →» entfällt. Ein leerer Sektor zeigt nur «Noch keine Boulder».

**F16 – Wie sehen leere Zustände aus?**
→ Ein kurzer Satz, ggf. mit einem Knopf: «Noch keine Boulder an dieser Wand.» bzw. bei leerem Filter «Nichts gefunden.» mit Knopf «Alle zeigen».

**F17 – Desktop?**
→ Gleiche Reihenfolge, Inhalt mittig auf max. 768 px Breite. Kein eigenes Desktop-Layout in dieser Runde.

**F18 – Was wird getestet?**
→ Unit-Tests: `tests/spec022ClimberUx.test.tsx` (Filter/Sortierung als reine Funktionen in `src/lib/climberWallFilters.ts`, Wand-Aufbau, Sektor-Pill und -Sheet, Sheet statt Modal, Bottom-Nav, Ich-Seite). Bestehende Tests werden auf die neue Oberfläche umgestellt. Playwright: `tests/e2e/climber-ux.spec.ts` (Handy-Viewport: Foto ist erstes Element, eine Hallenwahl, 2-Tap-Logging mit Toast und Rückgängig, Sektorwechsel per Pill, Ich ohne Unter-Tabs, Bottom-Nav mit 2 Tabs). `ascents-logging.spec.ts` wird auf das Sheet umgestellt.

---

## 3. Akzeptanzkriterien

- **AC-1** Im Kletterer-Modus ist das Wandfoto das erste Inhaltselement unter dem Header; davor steht kein Sektor-Block und keine Filterleiste.
- **AC-2** Es gibt im Kletterer-Modus genau eine Hallenauswahl (`header-gym-select`).
- **AC-3** Unter dem Foto steht die Sektor-Pill (`sector-pill`) mit Name und `n/m`; ‹ und › wechseln den Sektor; Tippen auf den Namen öffnet das Sektor-Sheet (`sector-list-sheet`) mit einer Zeile pro Sektor (`sector-list-item-<id>`), inkl. «Neu»/«Im Umbau» aus SPEC-021.
- **AC-4** Filter-Chips: `Alle`, `Offen`, `Neu` (nur wenn vorhanden), `★ Top`. Kein Sortier-Dropdown, kein «Filter zurücksetzen».
- **AC-5** Routenliste ist nach Hallenfarben-Reihenfolge sortiert; jede Zeile (`route-row-<id>`) zeigt Farbpunkt, Name, Grad, Sterne-Schnitt (falls vorhanden) und Status-Symbol.
- **AC-6** Pin oder Zeile öffnet `BoulderSheet`; ein Tap auf Flash/Top/Projekt loggt, schließt das Sheet und zeigt einen Toast mit «Rückgängig».
- **AC-7** Die Voll-Ansicht des Sheets enthält «Wer war schon oben» (`community-ratings-section`, Zeilen `community-rating-row-<userId>`).
- **AC-8** Tab «Ich» zeigt `MeView` (keine Unter-Tabs); Einstellungen enthalten Arbeitsbereich (nur berechtigte Rollen) und Abmelden.
- **AC-9** Bottom-Nav enthält genau zwei Tabs: `mobile-tab-wall`, `mobile-tab-stats`.
- **AC-10** Kletterer-Header enthält keinen Login-Knopf; der Arbeitsbereich-Knopf erscheint nur für Schrauber/Admins; der Personen-Umschalter existiert nur im Dev-Build.
- **AC-11** `ToastHost` ist einmal in `App` gerendert.
- **AC-12** Vollbild ohne Wisch-Hinweis; leerer Sektor zeigt «Noch keine Boulder».

## 4. Nicht Teil dieser Runde
- Rollen-Gateway nach Login entfernen (SPEC-020 AC-8.3).
- Peek-Sheet für die Routenliste (SPEC-020 AC-3.2) und Foto ≥ 70 % (AC-1.1).
- Gast-Modus «Ohne Konto umsehen» (SPEC-020 AC-9.2).
- Löschen der nicht mehr eingebundenen Dateien `UserProfileView`, `BoulderDetailModal` (erst wenn deren Tests umgezogen sind).
- Hinweis «Pin antippen» im `WallPhotoCanvas` (Datei gehört gerade dem Umschrauben-Thread).
