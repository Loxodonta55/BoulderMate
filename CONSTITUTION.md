# 🧗 BoulderMate — Constitution

> **Projektname**: BoulderMate
> **Version**: 1.0 — Erstellt am 04.09.2026
> **Status**: Genehmigt durch Grill-Me Interview

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
| **Frontend**      | React Native (Cross-Platform: iOS + Android)            |
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
- **Hauptnavigation (2 Säulen)**:
  - **Wand & Sektoren**: Interaktive Wand- & Sektoransicht mit markierten Bouldern, Bouldernavigation, Filter & Sortierung, Begehungen erfassen (Flash/Top/Projekt), Boulder bewerten (Grad-Einschätzung Soft/Fair/Stiff, Sterne-Qualität, Radar-Chart).
  - **Meine Statistiken (Persönlicher Bereich)**:
    - *Sub-Bereich Overall Statistik*: Profil-Header, Fontainebleau-KPIs, Grad-Verteilung, Stil- & Athleten-Radar (SPEC-008), kompakte Begehungshistorie, Account-Einstellungen.
    - *Sub-Bereich Deep Dive*: Umfassendes Kletterlogbuch, erweiterte Filter nach Wandneigung/Grifftypen/Stil, detaillierte Kennzahlen-Bar, Routen-Erfassung & Daten-Backup.
- **Strikte Isolation**: Keine Schrauber-Werkzeuge, kein Erstellen/Archivieren von Bouldern, keine Sektor- oder Hallenverwaltung.

### 3.2 Schrauber-Bereich (Schrauber-Studio / Route Setter)
- **Exklusive Schrauber-Features**:
  - Batch-Foto-Workflow zur visuellen Neuerfassung von Bouldern auf Wandfotos
  - Setzen initialer Parameter (Grifffarbe, Hallengrad, 5-Achsen-Radar)
  - Bearbeiten und Archivieren eigener/aktiver Boulder
  - Schrauber-spezifische Feedback-Übersicht (Community-Resonanz auf eigene Routen)
- **Strikte Isolation**: Kein persönliches Logbuch, keine Begehungs-Einträge, keine Hallen-Stammdaten-/Rechteverwaltung.

### 3.3 Hallen-Admin-Bereich (Admin-Konsole)
- **Exklusive Admin-Features**:
  - Verwaltung der Hallenstammdaten (Name, Anschrift, Basisdaten)
  - Sektoren- und Wand-Management (Sektoren anlegen, sortieren, Sektorfotos hochladen/aktualisieren)
  - Farbsystem- und Grading-Konfiguration (Hallenskalen, Farbwerte, Font-Mapping)
  - Team- & Rechteverwaltung (Schrauber ernennen/entziehen, Hallen-Admins verwalten)
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
| **Radar-Chart**     | 5× Wert (1-5)           | Kraft, Technik, Balance, Koordination, Flexibilität |
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

## 6. Schrauber-Workflow: Batch-Foto-Erfassung

> **Ziel**: Nach dem Schraubtag soll eine Wand mit ~8 Bouldern in **unter 3 Minuten** komplett erfasst sein.

### Ablauf:

```
1. Schrauber öffnet App → wählt Sektor
2. Fotografiert die fertige Wand (oder nutzt bestehendes Foto)
3. Tippt auf die Position jedes neuen Boulders im Foto
4. Pro Boulder erscheint ein Schnell-Formular:
   ┌─────────────────────────────────┐
   │  Farbe:   [🔴 Rot]  ▼ (Pflicht) │
   │                                 │
   │  Radar-Chart (optional, 1-5):  │
   │  Kraft:         ●●●○○  (3/5)   │
   │  Technik:       ●●●●○  (4/5)   │
   │  Balance:       ●●○○○  (2/5)   │
   │  Koordination:  ●●●○○  (3/5)   │
   │  Flexibilität:  ●○○○○  (1/5)   │
   │                                 │
   │  Name / Notizen (optional)      │
   │                                 │
   │  [Speichern]                    │
   └─────────────────────────────────┘
5. Nach dem letzten Boulder: "Zusammenfassung & Veröffentlichen ✓"
```

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

### 7.3 Radar-Chart: 5 Achsen
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

## 10. Design-Prinzipien & UI-Architektur

1. **Stets sehr aufgeräumtes, reduziertes Design (Klarheit vor Masse)**:
   - Wenige, dafür klar erkennbare und strikt getrennte Features.
   - Ruhiges, aufgeräumtes Layout mit großzügigem Weißraum / Stone-Spacing, klaren visuellen Hierarchien und Verzicht auf visuelle Überladung (*Visual Clutter*).
   - Jede Ansicht erfüllt genau einen Hauptzweck (Fokus-Design).

2. **Schrauber- & Admin-Bereich unprominent halten**:
   - Die App wird zu über 95% von Kletterern im Hallenalltag genutzt.
   - Schrauber- und Hallenverwaltungs-Funktionen dürfen das Kletterer-Erlebnis niemals dominieren oder die primäre Navigation überfrachten.
   - Routenbau- und Admin-Werkzeuge sind dezent platziert (sekundäres Einstellungsmenü / dezenter Schrauber-Schalter) und treten nur bei gezielter Nutzung in den Vordergrund.

3. **Visuell > Text & Blitzschnelle Bedienung**:
   - Wandfotos, interaktive Marker, klare Grad-Badges und Radar-Charts statt langer Textpassagen.
   - Loggen einer Route in unter 2 Klicks.

4. **Keine Datenverluste, saubere Datenhaltung & Zero Dummy-Daten**:
   - Archivierung statt Löschung – jeder Send bleibt im persönlichen Profil erhalten.
   - Strikte Trennung zwischen Hallen-Ebene, Wand-Ebene und persönlichem Logbuch.
   - **Strikte Zero-Dummy-Policy (Abschnitt 12)**: Unter keinen Umständen dürfen fingierte Mock-, Seed- oder Testdaten in Caches oder Speicher geschrieben werden.

5. **Vollständige Trennung der 3 Bereiche & absolute Feature-Isolation**:
   - **Völlige Isolation**: Die drei Bereiche (**Kletterer-App**, **Schrauber-Studio**, **Hallen-Admin-Konsole**) sind streng voneinander abgegrenzt.
   - **Kein Feature-Leak**: **Keines der Features darf aus zwei Bereichen aufrufbar sein.** Jede Funktionalität (z.B. Routenerfassung, Sektorverwaltung, Bewertungsabgabe, Rollenverwaltung) existiert exklusiv in genau einem der drei Bereiche.
   - Es gibt keine bereichsübergreifenden Aktionen, Misch-Masken oder Querverweise. Berechtigte Nutzer wechseln explizit über das Rollen-/Modus-Gateway zwischen den Bereichen.

---

## 11. Mobile-First Paradigma (Zwingende Grundregel)

> **Verbindliche Direktive**: Die gesamte App wird **Mobile-First** konzipiert, gestaltet und entwickelt. Desktop ist die Erweiterung, niemals der Ausgangspunkt. An der Bouldermatte wird die App einhändig und oft mit eingekreideten Fingern bedient.

### 11.1 Die 5 Mobile-First Säulen
1. **Sektor muss Vollbild (Immersive Wandansicht)**:
   - Sektoren und Wandfotos dürfen auf Smartphones nicht durch riesige Header, Ränder oder verschachtelte Boxen zusammengestaucht werden.
   - Die Wandansicht nutzt auf Mobilgeräten die maximale Displaybreite (Edge-to-Edge) und bietet einen dedizierten **Vollbild-/Fokus-Modus**, in dem das Wandfoto den gesamten Screen füllt.
2. **Aufpop-Menü beim Schrauber übersichtlich & handy-optimiert**:
   - Beim Erfassen von Bouldern im Schrauber-Studio öffnen sich touch-optimierte Bottom-Sheets, die am unteren Bildschirmrand verankert sind.
   - Große, kreide- und daumentaugliche Touch-Targets (mindestens 44×44px für Farbchips und Radar-Einstufungen).
   - Sticky Speichern-Button: Schrauber müssen nicht scrollen, um den neuen Boulder zu bestätigen und zum nächsten Pin überzugehen.
3. **Schlanke, übersichtliche Menüführung (Kein Visual Overload)**:
   - Auf Smartphones keine horizontal überfrachteten Desktop-Headerzeilen mit Tabs, Dropdowns und Buttons nebeneinander.
   - Mobile Bottom Navigation Bar mit den Kernbereichen (Wand, Logbuch, Profil) für ergonomische Daumenerreichbarkeit.
   - Aufgeräumter, kompakter Top-Header beschränkt auf Hallenwechsel und Profil-/Login-Status.
4. **Swipen zwischen den Sektoren**:
   - Schneller, nativer Wechsel zwischen Sektoren und Wänden per horizontaler Wischgeste (Touch-Swipe links/rechts).
   - Visuelle Orientierungshilfe (Sektor-Zähler, Dot-Indikatoren, Vor/Zurück-Indikatoren).
5. **Mobiles Umordnen der Sektoren (Touch-Reordering)**:
   - Die Anordnung von Sektoren im Hallen-Admin-Bereich darf nicht auf Desktop-Maus-Drag-and-Drop beschränkt sein.
   - Große, fingerbedienbare Rauf-/Runter-Tasten (Move Up / Move Down) und ein touch-optimierter Sortier-Modus ermöglichen müheloses Umordnen direkt am Smartphone.

### 11.2 Blitzschnelle Interaktion: Unmittelbares Schließen nach Bewertung
- **Fokus Kletterflow**: Nach dem Speichern (oder Überspringen) einer Bewertung schließt sich das Bewertungs- und Detailfenster im Kletterbereich augenblicklich. Der Kletterer landet sofort wieder auf der interaktiven Wandansicht, ohne zusätzliche Schließen-Klicks durchführen zu müssen.

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


