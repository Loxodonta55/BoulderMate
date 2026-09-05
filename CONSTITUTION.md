# 🧗 BoulderApp — Constitution

> **Arbeitstitel**: BoulderApp
> **Version**: 1.0 — Erstellt am 04.09.2026
> **Status**: Genehmigt durch Grill-Me Interview

---

## 1. Vision & Mission

**Vision**: Die intuitivste und nützlichste App für Indoor-Boulderer – vom Betreten der Halle bis zum Loggen des letzten Tops.

**Mission**: Boulderer sollen in Sekundenschnelle alle Routen ihrer Halle sehen, bewerten und loggen können. Schrauber sollen nach dem Schraubtag in unter 3 Minuten pro Wand ihre neuen Boulder erfasst haben.

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

## 3. Benutzerrollen

### 3.1 Kletterer (Standard-User)
- Sieht alle aktiven Boulder der gewählten Halle
- Bewertet Boulder (Soft/Fair/Stiff + 5-Sterne-Qualität + Radar-Chart)
- Loggt Begehungen (Flash / Top / Projekt)
- Sieht persönliche Statistiken (Grad-Verteilung)
- Öffentliches Profil mit Nickname + Statistiken

### 3.2 Schrauber (Route Setter)
- Alle Kletterer-Features +
- Erstellt Boulder via Batch-Foto-Workflow
- Setzt initiale Bewertungen (Grad, Farbe, Radar-Chart)
- Archiviert abgeschraubte Boulder
- Sieht Übersicht aller eigenen aktiven Boulder mit Community-Bewertungen

### 3.3 Hallen-Admin
- Alle Schrauber-Features +
- Verwaltet Hallendaten (Name, Adresse, Sektoren)
- Vergibt Schrauber-Berechtigungen
- Definiert Sektoren/Wände (Name + Foto)

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
- **Persönliche Statistiken**: Grad-Verteilung (Balkendiagramm) sowie multidimensionale Stil- & Performance-Statistik (Athleten-Radar & Stärken/Baustellen-Analyse vs. Hallenschnitt, SPEC-008)

---

## 9. Grading-System

- **Primär**: Hallen-eigenes Bewertungssystem (Farben, Nummern, Schwierigkeitsbänder – pro Halle konfigurierbar).
- **Sekundär / Optional**: Fontainebleau-Skala (4a, 5c, 6b+, 7a, ...) – Mapping durch Admin oder Schätzung durch Community.

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

4. **Keine Datenverluste & saubere Trennung**:
   - Archivierung statt Löschung – jeder Send bleibt im persönlichen Profil erhalten.
   - Strikte Trennung zwischen Hallen-Ebene, Wand-Ebene und persönlichem Logbuch.
