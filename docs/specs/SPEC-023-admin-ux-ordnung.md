# SPEC-023: Admin-UX – Ordnung, Übersicht, wenig Text

## Status: IMPLEMENTED (2026-10-08, Commit durch Hans offen)

> **Owner:** Hans · **Created:** 2026-10-08 · **Baut auf:** SPEC-000 (Rollen), SPEC-001 (Hallen & Sektoren), SPEC-018 (mehrere Sektoren), SPEC-020 (Design System «Kreide»), SPEC-021 (Umschrauben), SPEC-022 (Kletterer-UX, gleiche Methode)
> **Bezug:** SPEC-025 (Halle suchen, Karte): Im Kletterer-Header öffnet der Hallenname das Karten-Sheet. Im Admin-Header öffnet er ein eigenes, kartenloses Sheet «Halle wählen» (F7). Den Standort-Editor aus SPEC-025 AC-8 baut der SPEC-025-Thread als eigene Komponente; sie wird in der Admin-Konsole eingehängt und ändert `GymManagement` nicht selbst.
>
> Geplant nach der Grill-me-Methode. Hans hat F1–F8 am 2026-10-08 selbst entschieden. F9–F16 sind die Empfehlung von Claude nach derselben Linie und können geändert werden.

---

## 1. Ausgangslage (Analyse 2026-10-08, Handy 390×844, dunkel, Boris/OverAdmin)

Screenshots und Volltext: Projektordner `ux-analyse/admin/` (`ANALYSE-admin-vorher.md`, `vorher-*.png`).

| # | Befund | Wo |
|---|---|---|
| A1 | Halle **dreimal** gewählt/gezeigt (Header, Hallen-Karten, Banner) plus Suchfeld. | `AppHeader`, `GymManagement` |
| A2 | 4 Blöcke vor dem Inhalt; der erste Sektor beginnt unter dem ersten Bildschirm. | `GymManagement` |
| A3 | Sektor-Karten mit 16:9-Foto: 8 Sektoren ≈ 9 Bildschirme. | `SectorManager` |
| A4 | Reihenfolge ändern **vierfach** (Griff, Pfeile im Foto, Hoch/Runter-Leiste, Modus) plus Erklärtext. | `SectorManager` |
| A5 | Löschen von Sektor und Rolle **ohne Rückfrage**. | `SectorManager`, `GymManagement` |
| A6 | Farbsystem: 7 Farben ≈ 6 Bildschirme, «Speichern» nur ganz unten, Ungespeichertes unsichtbar. | `GradeScaleConfig` |
| A7 | Team: Erklärabsatz, «(SPEC-000)», Eingabe «Nutzer-ID», Test-Personen in Produktion, IDs, US-Datum, Doppel-Einträge. | `GymManagement` |
| A8 | Jargon: «Topo-Tafeln», «SECTOR #1», «Grade Scales», «Gebietsführer». | alle |
| A9 | Erfolg/Fehler als Kästen im Layout statt Toast. | alle |
| A10 | Kaputtes Logo-Bild; seltenes «Halle registrieren» als größter Knopf. | `GymManagement` |
| A11 | Rollen-Gateway mit langen Texten, «Step 1», Fußnote. | `RoleGatewayModal` |
| A12 | Admin sieht nicht, welche Wand «Im Umbau» ist. | `SectorManager` |

---

## 2. Grill-me: Fragen und Antworten

**F1 – Was sieht der Admin zuerst?**
✔ *Hans, 2026-10-08:* Direkt die Tabs `Sektoren · Farben · Team`. Die Halle wählt man nur im Header. Hallen-Karten, Suchfeld und Banner entfallen. «Neue Halle» steht im Hallen-Menü des Headers.

**F2 – Wie sehen die Sektoren aus?**
✔ *Hans:* Kompakte Zeilen: kleines Vorschaubild, Name, «n Boulder», ggf. «Im Umbau». Tippen öffnet ein Sheet mit Foto ändern, Umbenennen, Löschen. 8 Sektoren passen auf einen Bildschirm.

**F3 – Wie ändert man die Reihenfolge?**
✔ *Hans:* Knopf «Sortieren». Normal ohne Sortier-Bedienelemente. Im Modus hat jede Zeile einen Griff (Ziehen) und ↑/↓; «Fertig» beendet ihn. Kein Erklärtext.

**F4 – Wie wird Löschen geschützt?**
✔ *Hans:* Rückfrage, die nennt, was verloren geht («Sektor «Slab Vorne» löschen?»). «Abbrechen» ist vorausgewählt. Gilt für Sektor, Farbe und Team-Rolle. Hat ein Sektor noch aktive Boulder, ist Löschen gesperrt und die Rückfrage sagt «Erst die 9 Boulder abschrauben» (Regel aus SPEC-001 AC-6).

**F5 – Wie bearbeitet man das Farbsystem?**
✔ *Hans:* Liste + Sheet. Eine Zeile pro Farbe: Farbpunkt, Name, Hallengrad, «Font 6a–6b». Tippen öffnet ein Sheet mit Farbe, Name, Hallengrad, Font von/bis; «Sichern» speichert sofort (lokal + Supabase). Sortieren wie bei den Sektoren. Kein globaler Speichern-Knopf.

**F6 – Wie sieht «Team» aus?**
✔ *Hans:* Personen-Liste, eine Zeile pro Person mit Avatar, Name und Rollen-Chips (`Admin`, `Schrauber`). «+ Person» öffnet ein Sheet: Name suchen (Profile), Rolle wählen (Schrauber / Admin), «Hinzufügen». Tippen auf eine Person zeigt ihre Rollen mit «Entziehen» (mit Rückfrage). Keine IDs, kein Datum, keine SPEC-Texte; Test-Personen nur im Dev-Build.

**F7 – Was enthält der Admin-Header?**
✔ *Hans:* Links Symbol + `Hallenname ▾`, rechts genau ein Knopf «Bereich» (öffnet das Rollen-Gateway). «← Wand» entfällt. `Hallenname ▾` öffnet das Sheet «Halle wählen» mit den Hallen, die der Nutzer verwalten darf, und – nur für Plattform-Admins – «+ Neue Halle».

**F8 – Neue Halle / Hallendaten ändern?**
✔ *Hans:* «Neue Halle» fragt nur **Name** und **Stadt**; Admin der neuen Halle wird, wer sie anlegt. Hallendaten (Adresse, Website, Logo) bearbeiten kommt in einer späteren Runde (Ausnahme: Standort-Editor aus SPEC-025).

**F9 – Wie meldet die Konsole Erfolg und Fehler?**
→ *Empfehlung (gilt):* Toast (`showToast`, SPEC-020), z. B. «Sektor angelegt», «Reihenfolge gespeichert», «Farbe gesichert». Fehler als Toast mit dem Grund. Keine Kästen, die den Inhalt verschieben.

**F10 – Welche Wörter?**
→ *Empfehlung (gilt):* Tabs `Sektoren`, `Farben`, `Team`. «Sektor», «Wandfoto», «Hallengrad», «Font». Weg: «Topo-Tafeln», «SECTOR #», «Grade Scales», «Fontainebleau-Bänder», «Gebietsführer», SPEC-Nummern, Erklärsätze.

**F11 – Rollen-Gateway?**
→ *Empfehlung (gilt):* Bleibt (SPEC-022 F13), aber kürzer: Titel bleibt «Arbeitsbereich wählen» (Tests und SPEC-006 hängen daran), je Karte eine Zeile (Kletterer: «Wand und Logbuch», Schrauber-Studio: «Routen setzen und umschrauben», Hallen-Administration: «Sektoren, Farben, Team»). «Berechtigter Zugang • Step 1» und die Fußnote entfallen.

**F12 – Zeigt die Sektor-Zeile den Umbau?**
→ *Empfehlung (gilt):* Ja, Chip «Im Umbau», wenn das Schrauber-Studio die Wand neu schraubt (SPEC-021 `rebuildStartedAt`). Nur Anzeige.

**F13 – Wie legt man Sektoren an?**
→ *Empfehlung (gilt):* Zwei Knöpfe in der Werkzeugleiste: `+ Sektor` (Sheet: Name, Wandfoto wählen) und `Mehrere` (SPEC-018-Dialog, unverändert). Leerer Zustand: «Noch keine Sektoren.» mit denselben zwei Knöpfen.

**F14 – Umbenennen braucht neue Speicherlogik?**
→ *Empfehlung (gilt):* Ja, klein: `renameSector()` in `gymStorage` (nur Admin, Name nicht leer, kein doppelter Name in der Halle), hält den v2-Cache nach ID gleich und synct über `syncBridge.syncSector` wie das Wandfoto.

**F15 – Desktop?**
→ *Empfehlung (gilt):* Gleicher Aufbau, mittig, max. 768 px breit. Ziehen per Maus im Sortier-Modus.

**F16 – Tests?**
→ Siehe §5.

---

## 3. Akzeptanzkriterien

- **AC-1** Im Admin-Modus steht unter dem Header direkt die Tab-Leiste `admin-tabs` mit `admin-tab-sectors`, `admin-tab-grades`, `admin-tab-team`, `admin-tab-gym` («Halle»: Standort-Editor `GymLocationEditor` aus SPEC-025 AC-8) (Farben und Team nur für Hallen-Admins/Plattform-Admins). Es gibt keine Hallen-Karten, kein Suchfeld, kein Hallen-Banner.
- **AC-2** Der Admin-Header enthält `admin-gym-button` (Hallenname ▾) und genau einen weiteren Knopf `admin-switch-workspace-btn`. `admin-back-to-climber-btn` existiert nicht mehr.
- **AC-3** `admin-gym-button` öffnet `admin-gym-sheet` mit einer Zeile pro verwaltbarer Halle (`admin-gym-row-<id>`); Tippen wählt die Halle und schließt das Sheet. Plattform-Admins sehen `admin-new-gym-btn`; das Formular fragt nur Name (Pflicht) und Stadt.
- **AC-4** Sektoren erscheinen als Zeilen `sector-row-<id>` mit Vorschaubild, Name, «n Boulder» und ggf. Chip `sector-rebuild-chip-<id>`. Tippen öffnet `sector-sheet` mit `sector-photo-btn`, `sector-rename-input` + `sector-rename-save`, `sector-delete-btn`.
- **AC-5** Sortier-Bedienelemente erscheinen nur nach `toggle-reorder-mode-btn` («Sortieren»/«Fertig»): Griff `drag-handle-<id>` und `move-up-<id>` / `move-down-<id>`. Die Reihenfolge wird lokal und in Supabase gespeichert (wie bisher).
- **AC-6** Löschen (Sektor, Farbe, Rolle) öffnet `confirm-dialog` mit Text, `confirm-cancel` und `confirm-ok`. Erst `confirm-ok` löscht. Ein Sektor mit aktiven Bouldern kann nicht gelöscht werden; der Dialog nennt die Anzahl.
- **AC-7** Farben erscheinen als Zeilen `grade-row-<index>` (Farbpunkt, Name, Hallengrad, «Font a–b»). Tippen öffnet `grade-sheet`; `grade-save-btn` speichert sofort lokal und in Supabase. `add-grade-btn` legt eine neue Farbe über dasselbe Sheet an. Sortieren wie AC-5 (`toggle-grade-reorder-btn`).
- **AC-8** Team zeigt eine Zeile pro Person `team-row-<userId>` mit Rollen-Chips. `add-team-member-btn` öffnet `team-add-sheet` (Suche `team-search-input`, Treffer `team-candidate-<userId>`, Rolle `team-role-setter`/`team-role-admin`, `team-add-confirm`). Tippen auf eine Person öffnet `team-member-sheet` mit `team-revoke-<role>`.
- **AC-9** Kein sichtbarer Text enthält «SPEC-», «Topo-Tafeln», «Grade Scales», «Gebietsführer», «Nutzer-ID». Der Team-Tab hat keine Test-Personen-Knöpfe und zeigt keine IDs.
- **AC-10** Erfolg/Fehler erscheinen als Toast (`toast`).
- **AC-11** Rollen-Gateway: Titel «Arbeitsbereich wählen», Begrüßung «Hallo {Name}!», einzeilige Beschreibungen, kein «Step 1», keine Fußnote. Der Admin-Knopf hat `role-gateway-admin-btn`.
- **AC-12** 8 Sektoren passen auf dem Handy (390×844) ohne Scrollen unter Header und Tabs.

## 4. Betroffene Dateien
`src/components/GymManagement.tsx` (Admin-Konsole, neu aufgebaut), `src/components/SectorManager.tsx`, `src/components/GradeScaleConfig.tsx`, neu `src/components/admin/AdminGymSheet.tsx`, `src/components/ui/ConfirmDialog.tsx`, `src/lib/adminTeam.ts` (Team nach Person gruppieren, Kandidaten-Suche), `src/lib/gymStorage.ts` (`renameSector`), `AppHeader.tsx` (nur Admin-Zweig), `App.tsx` (Props), `RoleGatewayModal.tsx` (Texte).

## 5. Tests (CONSTITUTION §13)
- **Unit:** `tests/spec023AdminUx.test.tsx` – Tabs ohne Karten/Banner/Suche, Sektor-Zeilen + Sheet, Sortieren nur im Modus, Rückfrage vor Löschen (Sektor/Farbe/Rolle), gesperrtes Löschen bei aktiven Bouldern, Farben-Liste + Sheet speichert, Team nach Person gruppiert, Rolle hinzufügen/entziehen, keine verbotenen Texte, `renameSector`, `groupTeamByPerson`, `searchTeamCandidates`, Admin-Header mit einem Knopf und Hallen-Sheet. Bestehende Tests (`mobileFirstExperience`, `sectorDragAndDrop`, `gradeScaleConfigMobile`, `gradeScaleSync`, `spec006RoleGateway`, `mobileBackNavigation`, `batchSectorCreation`, `crossDeviceSectorSync`) werden auf die neue Oberfläche umgestellt.
- **Playwright:** `tests/e2e/admin-ux.spec.ts` (Supabase per `route.abort()` blockiert): Admin öffnen → Tabs direkt sichtbar, keine Hallen-Karten; 8 Sektor-Zeilen im ersten Bildschirm (Handy); Sektor umbenennen; Sortieren ↓ ändert Reihenfolge; Löschen fragt nach und «Abbrechen» behält den Sektor; Farbe im Sheet ändern → Zeile zeigt neuen Namen; Team: Person suchen, als Schrauber hinzufügen, Rolle entziehen mit Rückfrage; Halle über das Header-Sheet wechseln.

## 6. Nicht Teil dieser Runde
- Hallendaten (Website, Logo) bearbeiten (F8). Den Standort (Adresse → Pin) pflegt der Tab «Halle» mit dem Editor aus SPEC-025.
- Rollen-Gateway abschaffen (SPEC-020 AC-8.3).
- Einladungen per E-Mail für Personen ohne Profil.

## 7. Umsetzung (2026-10-08)
- Neu: `src/components/admin/TeamManager.tsx`, `src/components/admin/AdminGymSheet.tsx`, `src/components/ui/ConfirmDialog.tsx`, `src/lib/adminTeam.ts`; `renameSector` in `gymStorage.ts`.
- Tab «Halle» hängt `GymLocationEditor` (SPEC-025) ein; `tests/e2e/gym-finder.spec.ts` Admin-Test ist dadurch aktiv (kein `fixme` mehr).
- Umgebaut: `GymManagement.tsx`, `SectorManager.tsx`, `GradeScaleConfig.tsx`, `AppHeader.tsx` (Admin-Zweig), `RoleGatewayModal.tsx`, `App.tsx` (`onGymsChanged`).
- Farben: «Sichern» wartet wie bisher auf den Supabase-Abgleich (SPEC-001 AC-2.3) und zeigt so lange «Wird gesichert …».
- Lokal hat eine Person pro Halle genau eine Rolle (`roleService` überschreibt); `groupTeamByPerson` fasst trotzdem mehrere Einträge aus Supabase zusammen.
- Tests: `tests/spec023AdminUx.test.tsx` (18), `tests/e2e/admin-ux.spec.ts` (5 × Desktop/Mobile Chrome). Mobile Safari nicht getestet (kein WebKit in der Testumgebung).
