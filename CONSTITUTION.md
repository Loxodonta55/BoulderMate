# 🧗 BoulderMate — Constitution

> **Projektname**: BoulderMate
> **Version**: 2.0 — Aktualisiert am 04.10.2026
> **Status**: Genehmigt (UX-Overhaul v2)

### Changelog
- **v2.0 (04.10.2026)**: UX-Komplettüberarbeitung (SPEC-020 «Chalk»). 2 Tabs («Wand» & «Ich»), PWA (React 19 + Vite), Entfall Pflicht-Role-Gateway zugunsten von Arbeitsbereich in Einstellungen («Fertig»-Button zum Verlassen), Gast-Modus read-only, 5-Achsen-Radar beibehalten, Schrauber-Schnellerfassung (nur Farbe Pflicht, Details eingeklappt, Auswählen-Modus statt Rechteck), Edge-to-Edge Wandfoto (≥ 70 % Viewport-Höhe), sofortiges Schließen mit Undo-Toast nach Logging, Ersetzung der kantigen Design-Prinzipien durch die 8 Leitprinzipien.
- **v1.0 (04.09.2026)**: Initiale Genehmigung nach Grill-Me Interview.

---

## 1. Vision, Mission & Community Core (Marketing-Purpose)

**Vision**: Die lebendigste, inspirierendste und nützlichste Plattform für Indoor-Boulderer – von der perfekten Session-Orientierung bis zur aktiven Matten-Community.

**Mission**: Kletterer sollen in Sekundenschnelle erkennen, **welche Boulder richtig cool sind**, welche Routen **perfekt zum eigenen Kletterstil passen**, Erfolge mühelos festhalten und sich direkt an der Wand mit der Community austauschen. Schrauber erfassen nach dem Schraubtag in unter 3 Minuten pro Wand ihre neuen Linien und sehen die echte Begeisterung der Kletterer.

### 1.1 Der emotionale Kletterer-Nutzen (Marketing-Aussagen & Core Value Proposition)
BoulderMate ist keine Verwaltungssoftware und kein bürokratisches Topo, sondern der **persönliche Session-Begleiter und das sportliche Bindeglied der Kletter-Community**:

1. **Erkennen, welche Boulder richtig cool sind (Highlight- & Perlen-Finder)**:
   - Deine Haut und Energie an der Wand sind kostbar. Niemand will Zeit an langweiligen Zügen verschwenden.
   - Kletterer sehen auf einen Blick, welche Linien die unbestrittenen "Perlen" des aktuellen Schraubzyklus sind, welche Boulder der Community am meisten Spaß machen und wo echter Bewegungsfluss wartet (Sterne-Rating & Beliebtheits-Ranking).
2. **Finden, welche Boulder zu mir passen (Style-, Grad- & Neigungs-Match)**:
   - Jeder Kletterer hat seine eigene DNA: Platte, Überhang, Dynamik, Körperspannung oder filigrane Leisten.
   - BoulderMate zeigt dir genau die Linien, die zu deinem aktuellen Leistungsstand und deinen Vorlieben passen – oder deckt gezielt die Projekte auf, die dein nächstes Level freischalten (Stil-Radar & Stärken/Baustellen-Analyse).
3. **Mühelos tracken & Progression feiern (2-Tap Chalk-Proof Logging)**:
   - Optimiert für eingekreidete Hände direkt auf der Bouldermatte: Ein Tap auf den Pin, ein zweiter auf Flash ⚡, Top ✅ oder Projekt 🎯 – in zwei Sekunden geloggt.
   - Automatische Historie und Kletter-Progression über alle Besuche und Hallen hinweg.
4. **Diskutieren & Beta-Talk direkt am Boulder (Digitale Matten-Kultur)**:
   - Die beste Seite des Boulderns zieht digital an die Wand: Crux-Lösungen, Tritt-Empfehlungen, Hook-Tricks und Beta-Tipps direkt am Pin der Route.
   - Gemeinsam Projekte knacken, Matten-Erfolge feiern und einander weiterbringen.
5. **Routen fair einschätzen (Demokratisches Community-Barometer)**:
   - Demokratische Konsens-Grade statt subjektiver Schrauber-Willkür.
   - Das Barometer (*Soft / Fair / Stiff*) zeigt schonungslos, wie sich die Route in Wirklichkeit klettert – kein Frust mehr über Sandbagging oder geschenkte Grade.

---

## 2. Plattform & Tech-Stack

| Entscheidung      | Wahl                                                    |
| ----------------- | ------------------------------------------------------- |
| **Frontend**      | React 19 + Vite PWA (Web, mobile-first; nativer Wrapper optional später) |
| **Backend**       | Supabase (PostgreSQL + Auth + Storage + Realtime)       |
| **Auth**          | Social Login (Google / Apple) + optionale E-Mail        |
| **Bild-Storage**  | Supabase Storage (Wandfotos, Profilbilder)              |
| **Offline**       | Online-First mit intelligentem Cache (lokaler Write-Cache für Bewertungen/Logs, Sync bei Verbindung) |

---

## 3. Benutzerrollen & die 3 getrennten App-Bereiche

Die App ist strikt in drei autarke, voneinander getrennte Bereiche unterteilt.

> **Fundamentales Architektur-Prinzip (Feature-Isolation)**:
> Die 3 Bereiche der App sind **völlig voneinander getrennt**. **Keines der Features darf aus zwei Bereichen aufrufbar sein.** Jedes Feature, jede Aktion und jeder Dialog gehört exklusiv zu genau einem Bereich. Es gibt keine geteilten oder bereichsübergreifenden Feature-Aufrufe.

### 3.1 Kletterer-Bereich (Standard-User / Kletterer-App)
- **Hauptnavigation (2 Tabs)**:
  - **Wand**: Interaktive Wand- & Sektoransicht mit markierten Bouldern, Bouldernavigation, Filter & Sortierung, Begehungen erfassen (Flash/Top/Projekt), Boulder bewerten (Grad-Einschätzung Soft/Fair/Stiff, Sterne-Qualität, Radar-Chart).
  - **Ich**: Persönlicher Bereich bündelt Statistiken (Tops, Flash-Quote, Bester Grad, Fontainebleau-Gradpyramide, 5-Achsen-Stilprofil), Session-Verlauf und Einstellungen (Zahnrad).
- **Bereichswechsel & Berechtigungen**:
  - Der Wechsel in das Schrauber-Studio oder die Hallen-Admin-Konsole erfolgt **ausschließlich über `Ich → Einstellungen → Arbeitsbereich`** (nur sichtbar bei entsprechenden Rechten).
  - **Kein Pflicht-Gateway nach Login**: Nach der Anmeldung startet der Nutzer direkt in seinem zuletzt genutzten Bereich; die App merkt sich diesen Zustand.
  - Das Schrauber-Studio und die Hallen-Admin-Konsole besitzen eine eigene Shell und werden über die Aktion **«Fertig»** (oben links) verlassen, um zur Kletterer-App zurückzukehren.
- **Gast-Modus (nicht angemeldet)**:
  - Unangemeldete Gäste dürfen die Wand und Sektoren im **Read-only-Modus** ansehen (niedrige Einstiegshürde).
  - Interaktionen wie Loggen (`Flash`/`Top`/`Projekt`) oder Bewerten fordern zur Anmeldung auf.
- **Strikte Isolation**: Keine Schrauber-Werkzeuge, kein Erstellen/Archivieren/Löschen von Bouldern, keine Sektor- oder Hallenverwaltung im Kletterer-Bereich.

### 3.2 Schrauber-Bereich (Schrauber-Studio / Route Setter)
- **Exklusive Schrauber-Features**:
  - Eigene Shell mit «Fertig»-Schaltfläche (oben links) zum Verlassen zurück zur Kletterer-App.
  - Sektorauswahl als übersichtliche Liste/Sheet mit Thumbnails.
  - Schnellerfassung auf Wandfotos (nur Farbe als Pflichtfeld, Details eingeklappt, Ziel: < 3 Min pro Wand).
  - Bearbeiten, Mehrfach-Archivieren und Löschen von Bouldern über den «Auswählen»-Modus.
  - Schrauber-spezifische Feedback-Übersicht (Community-Resonanz auf eigene Routen).
- **Strikte Isolation**: Kein persönliches Logbuch, keine Begehungs-Einträge, keine Hallen-Stammdaten-/Rechteverwaltung.

### 3.3 Hallen-Admin-Bereich (Admin-Konsole)
- **Exklusive Admin-Features**:
  - Eigene Shell mit «Fertig»-Schaltfläche (oben links) zum Verlassen zurück zur Kletterer-App.
  - Verwaltung der Hallenstammdaten (Name, Anschrift, Basisdaten) im Listenstil.
  - Sektoren- und Wand-Management (Sektoren anlegen, per Drag-Handles sortieren, Sektorfotos hochladen/aktualisieren).
  - Farbsystem- und Grading-Konfiguration (Hallenskalen, Farbwerte, Font-Mapping).
  - Team- & Rechteverwaltung (Schrauber ernennen/entziehen, Hallen-Admins verwalten).
- **Strikte Isolation**: Kein Routenbau-/Batch-Editor, kein Loggen von Begehungen oder Kletterer-Funktionen.

---

## 4. Hallen-Struktur

```
Multi-Gym Architektur
├── Halle A (z.B. "Minimum Boulder Zürich")
│   ├── Sektor 1 ("Überhang")     → Wandfoto + markierte Boulder
│   ├── Sektor 2 ("Platte")       → Wandfoto + markierte Boulder
│   ├── Sektor 3 ("Wand A")       → Wandfoto + markierte Boulder
│   └── ...
├── Halle B
│   └── ...
└── ...
```

- **Multi-Gym** von Anfang an: Jeder User kann seine Halle(n) auswählen
- Halle ist in **benannte Sektoren/Wände** unterteilt
- Jeder Sektor hat ein **Foto der Wand** mit markierten Boulder-Positionen
- Navigation: **Halle → Sektor → Boulder**

---

## 5. Boulder-Datenmodell

### 5.1 Kern-Attribute (vom Schrauber gesetzt)

| Attribut            | Typ                      | Beschreibung                                   |
| ------------------- | ------------------------ | ---------------------------------------------- |
| **Farbe/Grad**      | Hallenspezifische Skala  | Farbe der Griffe / Hallen-Schwierigkeitsband   |
| **Sektor**          | Referenz                 | In welchem Sektor/an welcher Wand              |
| **Position**        | Koordinaten auf Wandfoto | Markierung auf dem Sektor-Foto (relativ 0..1)  |
| **Radar-Chart**     | 5× Wert (1-5)           | Kraft, Technik, Balance, Koordination, Flexibilität (5 Achsen, Kraft nicht gesplittet) |
| **Schrauber**       | Referenz                 | Wer hat den Boulder geschraubt                 |
| **Erstelldatum**    | Timestamp                | Wann wurde der Boulder erstellt                |

### 5.2 Community-Bewertungen (von Kletterern)

| Bewertung                | System                      | Anzeige                         |
| ------------------------ | --------------------------- | ------------------------------- |
| **Grad-Einschätzung**    | Soft / Fair / Stiff          | Community-Durchschnitt          |
| **Qualität / Spass**     | 1-5 Sterne                  | Durchschnitt + Anzahl           |
| **Radar-Chart**          | 5× Wert (1-5)               | Gewichteter Durchschnitt (Schrauber-Wertung zählt anfangs mehr, Community relativiert mit wachsender Datenbasis) |

### 5.3 Boulder-Lebenszyklus

```
[Erstellt/Aktiv] ──── Schrauber archiviert ────→ [Archiviert]
       │                                               │
       │ Sichtbar in Hallenansicht                      │ Verschwindet aus Hallenansicht
       │ Kann bewertet & geloggt werden                 │ Bleibt im persönlichen Logbuch
       │                                               │ Bewertungen bleiben erhalten
```

---

## 6. Schrauber-Workflow: Schnellerfassung

> **Ziel**: Nach dem Schraubtag soll eine Wand mit ~8 Bouldern in **unter 3 Minuten** komplett erfasst sein.

### Ablauf:

1. Schrauber öffnet App → wählt Sektor (Liste/Sheet mit Thumbnails).
2. Fotografiert die fertige Wand (Foto aufnehmen oder aus Mediathek).
3. Tippt auf die Position jedes neuen Boulders im Foto.
4. Pro Boulder erscheint das kompakte Schnellerfassungs-Sheet:
   - **Farbe**: [🔴 Rot] ▼ (**einziges Pflichtfeld**)
   - Button: «Weiter zum nächsten»
   - Bereich **«Details (optional)»**: Initial eingeklappt; enthält Name/Notizen und die 5 Radar-Slider (Kraft, Technik, Balance, Koordination, Flexibilität).
5. **Mehrfachauswahl**: Über den **«Auswählen»-Modus** (iOS-Fotos-Muster) können mehrere Pins direkt angetippt und gemeinsam archiviert oder gelöscht werden (kein Desktop-Marquee-Rechteck).
6. Nach dem letzten Boulder: Veröffentlichen-Leiste («X Änderungen · Veröffentlichen»).

---

## 7. Bewertungs-System

### 7.1 Grad-Einschätzung: Soft / Fair / Stiff

| Wert     | Bedeutung                           | Emoji  |
| -------- | ----------------------------------- | ------ |
| **Soft** | Leicht für den angegebenen Grad     | 🟢     |
| **Fair** | Passt zum angegebenen Grad          | 🟡     |
| **Stiff**| Hart für den angegebenen Grad       | 🔴     |

### 7.2 Qualitäts-Bewertung: 5 Sterne ⭐
Unabhängig vom Grad – bewertet Spaßfaktor und Routenbau-Qualität.

### 7.3 Radar-Chart: 5 Achsen (Konsequent 5 Dimensionen)
Das Radar-Chart verwendet einheitlich **5 Achsen** (kein Aufsplitten von Kraft in Maximalkraft und Kraft-Ausdauer — weniger ist mehr):
- **Kraft**: Fingerkraft, Blockierkraft, Zugkraft
- **Technik**: Fußarbeit, Präzision, Körperspannung
- **Balance**: Gleichgewicht, Stabilität
- **Koordination**: Dynamische Züge, Timing, Sprünge
- **Flexibilität**: Beweglichkeit, Reichweite, Spreizen

---

## 8. Logbuch & Statistiken

- **Begehungsarten**: `Flash` (⚡), `Top` (✅), `Projekt` (🎯)
- **Persönliche Statistiken**: Grad-Verteilung (Balkendiagramm) basierend auf der allgemeingültigen Fontainebleau-Skala (dynamisch und klug übersetzt aus Hallen-Farbbändern und Community-Grad-Feel Soft/Fair/Stiff, SPEC-004) sowie multidimensionale Stil- & Performance-Statistik (Athleten-Radar & Stärken/Baustellen-Analyse vs. Hallenschnitt, SPEC-008)

---

## 9. Grading-System

- **Primär (Hallenalltag & Griffe)**: Hallen-eigenes Bewertungssystem (Farben, Nummern, Schwierigkeitsbänder – pro Halle konfigurierbar).
- **Allgemeingültige Kletterer-Statistik**: Statistiken basieren stets auf der Übersetzung auf die Fontainebleau-Skala (3, 4, 5, 6a, 6a+, 6b, 6b+, 6c, 6c+, 7a, ...). Eine Hallenfarbe (z. B. Rot: 6b+ bis 6c+) wird initial mit dem Mittelwert (z. B. 6c) bewertet; bewertet die Community den Boulder als "taff" / "stiff", wandert er auf 6c+; wird er als "soft" eingestuft, auf 6b+. Dies garantiert objektive, hallenübergreifende Vergleichbarkeit.

---

## 10. Design-Prinzipien & UI-Architektur (Design System v2 «Chalk»)

> Vollständige Spezifikation und Design-Tokens siehe [SPEC-020](docs/specs/SPEC-020-ux-overhaul-design-system-v2.md) (Design System v2 «Chalk»).

1. **Ein Screen, eine Frage**: Wand: «Was klettere ich jetzt?» · Ich: «Wie komme ich voran?» Alles andere ist Sheet oder Einstellung.
2. **Inhalt ist das Interface**: Das Wandfoto ist die App. Chrome schwebt (Overlay) statt zu stapeln.
3. **Progressive Disclosure**: Kompakt → Sheet halb → Sheet voll. Details nur auf Wunsch.
4. **Ein Ort pro Funktion**: Hallenwahl, Rollenwechsel, Login — jeweils exakt eine Stelle.
5. **Keine Erklärtexte**: Wenn ein UI-Element erklärt werden muss, ist es falsch. Einmaliges Onboarding-Coachmark statt Dauerhinweise.
6. **Daumenzone first**: Alle primären Aktionen im unteren Drittel, ≥ 44 pt, eingekreidet bedienbar.
7. **Destruktiv = versteckt + rückgängig**: Löschen nur via Swipe/«…»-Menü, immer mit Undo-Toast statt Bestätigungsdialog. Kein Routen-Löschen im Kletterer-Bereich.
8. **Ruhige Typografie**: Sentence case, eine Schriftfamilie (Inter / System Font), max. 3 Schriftgrößen pro Screen, Zahlen in `tabular-nums`.

---

## 11. Mobile-First Paradigma (Zwingende Grundregel)

> **Verbindliche Direktive**: Die gesamte App wird **Mobile-First** konzipiert, gestaltet und entwickelt. Desktop ist die Erweiterung, niemals der Ausgangspunkt. An der Bouldermatte wird die App einhändig und oft mit eingekreideten Fingern bedient.

### 11.1 Die 5 Mobile-First Säulen
1. **Sektor-Vollbild (Edge-to-Edge Wandfoto)**:
   - Sektoren und Wandfotos dürfen auf Smartphones nicht durch riesige Header, Ränder oder verschachtelte Boxen zusammengestaucht werden.
   - Das Wandfoto wird Edge-to-Edge dargestellt und nimmt **mindestens 70 % der Viewport-Höhe** ein. Chrome schwebt dezent als Blur-Overlay.
2. **Aufpop-Menü beim Schrauber übersichtlich & handy-optimiert**:
   - Beim Erfassen von Bouldern im Schrauber-Studio öffnen sich touch-optimierte Bottom-Sheets, die am unteren Bildschirmrand verankert sind.
   - Große, kreide- und daumentaugliche Touch-Targets (mindestens 44×44px für Farbchips und Aktionen).
   - Sticky Speichern-Button: Schrauber müssen nicht scrollen, um den neuen Boulder zu bestätigen und zum nächsten Pin überzugehen. Nur Farbe ist Pflicht.
3. **Schlanke Menüführung (2 Tabs: Wand + Ich)**:
   - Keine horizontal überfrachteten Desktop-Headerzeilen mit Tabs, Dropdowns und Buttons nebeneinander.
   - Mobile Bottom Navigation Bar mit exakt 2 Tabs: **Wand** und **Ich** für ergonomische Daumenerreichbarkeit. Kein Login/Nickname in der Tab-Bar.
   - Aufgeräumter, schwebender Top-Header auf Wandansicht beschränkt auf Hallenwahl (`Halle ▾`) sowie Sektor-Information.
4. **Sektorwahl per Swipe + Sektor-Pill/Sheet**:
   - Schneller, nativer Wechsel zwischen Sektoren per horizontaler Wischgeste (Touch-Swipe links/rechts) auf dem Foto.
   - Ergänzende Sektor-Pill am unteren Rand des Fotos mit Sektorname und Zähler (`‹ Sektor 1/17 ›`). Ein Tap auf die Pill öffnet ein Sheet mit Sektor-Thumbnails (die alte 17-Chip-Leiste entfällt).
5. **Mobiles Umordnen der Sektoren (Touch-Reordering)**:
   - Die Anordnung von Sektoren im Hallen-Admin-Bereich erfolgt per touch-optimiertem Modus mit Drag-Handles (iOS-Listenstil) statt Desktop-CAD.

### 11.2 Blitzschnelle Interaktion: Unmittelbares Schließen nach Loggen mit Undo-Toast
- **Fokus Kletterflow**: Nach dem Antippen von `⚡ Flash`, `✓ Top` oder `◎ Projekt` im Boulder-Sheet schließt sich das Sheet augenblicklich (1 Tap). Der Kletterer landet sofort wieder auf der interaktiven Wandansicht.
- **Rückgängig-Sicherheit**: Ein nicht-blockierender Toast («Top geloggt · Rückgängig») bestätigt den Erfolg und erlaubt sofortiges Widerrufen oder optionales 1-Tap-Sterne-Rating.

---

## 12. Absolute Datenintegrität & Zero-Dummy-Policy (Striktes Verbot von Dummy-Daten)

> **Unumstößliche Grundregel**: In der gesamten App dürfen **unter keinen Umständen Dummy-, Mock-, Seed- oder Beispieldaten erzeugt oder in Speicher injiziert werden** – weder für den lokalen Cache (`localStorage`), noch für Session-Stores, noch bei leerem App-Start, noch als Fallback.

### 12.1 Verbote & Schutzregeln
1. **Keine Dummy-Daten im Cache**:
   - Wenn der Browser-Cache oder `localStorage` auf einem Endgerät (Desktop, Smartphone, Tablet) leer ist, dürfen **keinerlei statische Routen, Dummy-Farbskalen oder Dummy-Sektoren** generiert werden.
   - Die App zeigt bei leerem Speicher saubere Ladezustände (`Skeleton` / Empty-State) und bezieht ihre Daten ausnahmslos direkt aus der produktiven Datenbank (Supabase).
2. **Supabase als einzige Quelle der Wahrheit (Single Source of Truth)**:
   - Es existieren ausschließlich die realen, vom Nutzer oder Schrauber in der Datenbank gepflegten Daten.
   - Veraltete Test-IDs (z. B. `boulder-existing-*`, `boulder-6a-*`, statische `scale-*`-Farben) sind streng verboten und werden bei jeder Synchronisation restlos getombstonet und bereinigt.
3. **Keine Datenverschmutzung beim Start oder Reload**:
   - Kein Programmteil darf bei Initialisierung (`ensureInitial...`, `getWallBoulders`, `getGradeScales` etc.) eigenmächtig Speicher mit Dummy-Objekten füllen.
4. **Code-Only Deployments & Zero Data Loss**:
   - Deployments übertragen ausschließlich reinen Programmcode.
   - Es werden beim Deployment niemals automatische Daten-Push-Skripte gegen Supabase ausgeführt. Produktionsdaten dürfen weder überschrieben noch durch lokale Caches verfälscht werden.

---

## 13. Testkonzept & Automatisierte Qualitätssicherung (Playwright E2E & Mobile Data Sync Testing)

> **Testpflicht für jedes Feature (seit 06.10.2026)**: Jedes Feature und jede sichtbare UI-Änderung braucht **beides**: Unit-/Komponenten-Tests (Vitest + Testing Library, `tests/*.test.ts(x)`) **und** Playwright-E2E-Tests (`tests/e2e/*.spec.ts`, Desktop Chrome, Pixel 7, iPhone 15). Das gilt auch für reine Design- und Text-Änderungen: Sie werden gegen die Akzeptanzkriterien der Spec getestet (z. B. Tokens, Kontraste, entfernte Texte, Layout ohne Scrollen). Ein Feature gilt erst als fertig, wenn `npm run test:all` grün ist und die Spec die zugehörigen Testdateien nennt.

> **Verbindliche Direktive**: Jedes Feature, das Daten schreibt, verändert oder synchronisiert, **MUSS zwingend durch automatisierte Playwright-E2E-Tests abgedeckt sein**. Reine Unit-Tests in JSDOM reichen für Datenübertragung, WebSockets und mobile Gerätelimitationen nicht aus.

### 13.1 Die 5 Säulen des E2E-Testkonzepts

```
┌─────────────────────────────────────────────────────────────────────────┐
│              E2E & MOBILE DATA SYNC TEST-ARCHITEKTUR                    │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. Dual-Device Realtime    │ Mobile (Pixel/iPhone) ↔ Desktop (Laptop)  │
│ 2. Offline-Resilienz       │ context.setOffline(true/false) & Queue     │
│ 3. Mobile OS Lifecycle     │ visibilitychange (Standby / Backgrounding) │
│ 4. Contract & Network API  │ Interception von /rest/v1/ & WebSocket     │
│ 5. Touch & Pin-Präzision   │ Echte Touch-Taps & relative Koordinaten    │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **Dual-Device / Multi-Context Testing (Mobile ↔ Desktop)**:
   - Playwright steuert innerhalb eines einzigen Testlaufs zwei isolierte Browser-Instanzen parallel (Mobile Context mit touch/kleinem Viewport + Desktop Context).
   - Eine Schreibaktion auf dem Smartphone (z. B. Sektor anlegen, Top loggen, Route bewerten) muss ohne Seiten-Reload in Echtzeit (via Supabase Realtime / WebSocket) auf dem Desktop sichtbar werden – und umgekehrt.

2. **Offline-Resilienz & Reconnect-Sync**:
   - Kletterhallen weisen oft schlechten Empfang auf.
   - Der Test simuliert Netzwerkabbrüche (`context.setOffline(true)`), erfasst Schreibvorgänge im lokalen Speicher (`localStorage` / `IndexedDB`), stellt die Verbindung wieder her (`context.setOffline(false)`) und verifiziert, dass die Queue vollständig und duplikatfrei an Supabase übermittelt wird.

3. **Mobile OS Lifecycle & Tab-Freezing (`visibilitychange`)**:
   - Mobile Betriebssysteme frieren inaktive Tabs ein.
   - Der Test simuliert Display-Standby und App-Wechsel (`visibilityState: 'hidden'` gefolgt von `'visible'`).
   - Die App muss beim Aufwachen selbstständig einen Re-Sync (`syncFromSupabase()`) anstoßen und eventuell verpasste Cloud-Änderungen einpflegen.

4. **Payload- & Contract-Validierung (Network Interception)**:
   - Alle ausgehenden Supabase-Requests (`/rest/v1/ratings`, `/rest/v1/ascents`, `/rest/v1/sectors`, `/rest/v1/boulders`) werden überwacht.
   - Validierung auf saubere UUID-Formate (keine veralteten Slugs), korrekte ISO-Timestamps und erfolgreiche HTTP-Statuscodes (200/201/204 – niemals unbemerkte 400er oder 409er).

5. **Touch- & Koordinaten-Präzision**:
   - Wand-Pins und Routenmarkierungen werden mit echten Touch-Events (`hasTouch: true`) getestet.
   - Relative Koordinaten (0..1) müssen auf allen DPI-Skalierungen (`devicePixelRatio: 1, 2, 3`) und Orientierungen pixelgenau am Griff verbleiben.

### 13.2 Pflicht-Testabdeckung für alle datenschreibenden Features

| Feature-Bereich | Datenschreibender Vorgang | Primäre Speicher / Tabellen | E2E-Prüfkriterium |
| :--- | :--- | :--- | :--- |
| **Ratings & Reviews** | Sternvergabe (1–5), Grad-Barometer (Soft/Fair/Stiff), Radar | `boulderapp_ratings_v3`, Supabase `ratings` | Schnitt-Neuberechnung, Barometer-Update, sofortige Sichtbarkeit bei anderen Nutzern |
| **Begehungen (Logging)** | Flash ⚡, Top ✅, Projekt 🎯 | `boulderapp_ascents_v3`, Supabase `ascents` | Zähler-Inkrement, Logbuch-Eintrag, Dual-Tap Flow |
| **Sektoren & Wände** | Sektor anlegen, Foto hochladen, Sektor-Reorder, Löschen | `boulder_sectors_v1`, `boulderapp_sectors_v2`, Supabase `sectors` | Dual-Store Lockstep, Cloud-Persistierung, Touch-Reorder |
| **Boulder & Routen** | Route setzen (Farbe, Grad, Radar), Route bearbeiten/löschen | `boulderapp_wall_boulders_v2`, Supabase `boulders` | Relative Pin-Koordinaten, Archivierung/Löschung ohne Geister-Pins |
| **Profile & Sync-Bridge** | Nickname, Avatar, Multi-User-Wechsel, Sync-Status | `boulderapp_profiles`, Supabase `user_profiles` | Konsistenz über alle Tabs, leise Hintergrund-Synchronisation |



