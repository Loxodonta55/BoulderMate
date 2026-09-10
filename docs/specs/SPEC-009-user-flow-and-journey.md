# SPEC-009: End-to-End User Flow & Journey (Von der Registrierung bis zum Kletterer-Herzstück)

## Status: APPROVED

## Summary
Definiert die ganzheitliche Nutzererfahrung und den durchgängigen Workflow der BoulderApp gemäß den Leitprinzipien der [CONSTITUTION.md](../../CONSTITUTION.md):
1. **Schlank, aufgeräumt, reduziertes Design** (kein Visual Clutter, Stone-Spacing, Ruhe und Fokus).
2. **Die 95/5-Präsenz**: Die App gehört zu 95%+ dem Kletterer vor der Wand. Schrauber- und Admin-Funktionen bleiben dezent im Hintergrund.
3. **Absolute Feature-Isolation**: Keine Vermischung der 3 Sphären (Kletterer-App, Schrauber-Studio, Hallen-Admin-Konsole).
4. **Vollständiger Nutzer-Lebenszyklus**:
   - **Phase 1: Zero-Friction Registrierung & Onboarding**: Social Sign-In (Google/Apple) in < 5 Sekunden ohne Hürden, direkt vor der Wand.
   - **Phase 2: Das Fundament (Hallen-Admin)**: Stammdaten, Farbsysteme / Hallengrade, Wandfotos & Schrauber-Rechte.
   - **Phase 3: Der Schrauber-Flow (Routenerfassung in Rekordzeit)**: Batch-Foto-Workflow (< 3 Min pro Wand), Grifffarben, 5-Achsen-Radar, Archivierung.
   - **Phase 4: Das Herzstück (Kletterer-Nutzen & Flow)**: Wandansicht mit visuellen Pins, Loggen in unter 2 Klicks (Flash/Top/Projekt), Soft/Fair/Stiff, Spassfaktor, persönliches 5-Achsen-Athleten-Radar & Stärken/Baustellen-Analyse.

---

## 1. Onboarding & Registrierung (Phase 1)

### 1.1 Das Problem
Boulderer stehen in der Halle – oft bereits mit Chalk an den Händen – und möchten einen Boulder nachsehen oder ein Top eintragen. Traditionelle Registrierungsformulare (Passwortregeln, E-Mail-Bestätigungslinks, lange Profilfragebögen) führen zu Frustration und Nutzungsabbruch.

### 1.2 Der Ablauf (Zero Friction)
1. **App öffnen**: Sofortiger Gast-Modus oder 1-Tap-Login via Social Provider (`Google Sign-In` / `Apple Sign-In`).
2. **Automatisches Profil**: Das Nutzerprofil (`user_profiles`) wird im Hintergrund initialisiert (Display-Name und Avatar übernommen).
3. **Standort & Halle**: Automatische Zuordnung zur nächstgelegenen Boulderhalle oder Standardhalle.
4. **Keine Splash-Orgien**: Die App öffnet direkt die visuelle Wandansicht der Halle (`ClimberSectorView`).

---

## 2. Der Hallen-Admin Flow (Phase 2 — Das Fundament)

### 2.1 Der Nutzen für Hallenbetreiber
- Einheitliche, digitale Präsenz aller Wände und Routen.
- Wegfall von Papier-Laufzetteln und manuellen Schichtberichten.
- Exakte Konfiguration des Hallen-Grading-Systems (Farbskalen, Font-Äquivalente).
- Schnelle Zuweisung von Schrauber-Rechten per Klick.

### 2.2 Der Ablauf
1. **Admin-Konsole betreten**: Exklusiv erreichbar für Nutzer mit `admin`-Rolle in der aktiven Halle via dezentem Role Gateway.
2. **Farbsystem konfigurieren**: Definition der Grifffarben und Hallen-Schwierigkeitsgrade (z. B. Gelb = leicht, Rot = schwer) in `GradeScaleConfig`.
3. **Sektoren & Wandfotos anlegen**: Upload hochauflösender Wandfotos (Laptop oder Tablet) via `SectorPhotoUploader`.
4. **Schrauber ernennen**: Sucht registrierte Kletterer nach Nickname und teilt ihnen die Rolle `setter` für diese Halle zu.

---

## 3. Das Schrauber-Studio (Phase 3 — Geschwindigkeit & Entlastung)

### 3.1 Der Nutzen für Schrauber
- **Geschwindigkeit**: Erfassung einer 8-Boulder-Wand in **unter 3 Minuten** direkt an der Wand.
- **Transparenz**: Kein Vergessen von Routen, automatische Archivierung alter Boulder beim Umschrauben.
- **Echtes Community-Feedback**: Direkter Einblick in die Wahrnehmung der Routen (Grad-Realitätscheck, Spaßbewertungen).

### 3.2 Der Ablauf
1. **Schrauber-Studio öffnen**: Zugänglich über den dezenten Bereichswechsler.
2. **Sektor wählen**: Auswählen der umgeschraubten Wand.
3. **Wandfoto erfassen/nutzen**: Neues Foto schießen oder hochgeladenes Bild verwenden.
4. **Pins setzen (Batch-Modus)**: Nacheinander auf die Startgriffe tippen.
5. **Schnell-Parametrisierung**:
   - Grifffarbe (1 Tap)
   - Initiales 5-Achsen-Radar (Kraft, Technik, Balance, Koordination, Flexibilität)
   - Optional: Name / Crux-Notiz
6. **"Alle Freigeben"**: Alle erfassten Boulder werden mit einem Klick veröffentlicht und stehen den Kletterern sofort zur Verfügung.
7. **Archivieren**: Nicht mehr existierende Routen werden mit einem Klick archiviert (bleiben in den persönlichen Kletterer-Logbüchern erhalten).

---

## 4. Die Kletterer-App (Phase 4 — Das absolute Herzstück)

### 4.1 Der Nutzen für Kletterer
- **Optische Orientierung**: Wandfoto mit Pins in Griff-Farben – kein langes Suchen nach Routennamen oder Nummern an der Wand.
- **2-Klick-Logging**: Blitzschnelles Erfassen ohne Ablenkung vom Klettern.
- **Objektives Feedback**: Basiert auf echten Community-Einschätzungen (Soft / Fair / Stiff) und 5-Sterne-Spaßwertung.
- **Persönliche Entwicklung (Athleten-Radar)**: Transparente Visualisierung der eigenen Stärken und Baustellen im Vergleich zum Hallenschnitt (SPEC-008).

### 4.2 Der Ablauf Schritt für Schritt
1. **Wand & Sektor wählen**: Der Kletterer steht z. B. vor dem "Überhang" und öffnet den Sektor auf dem Smartphone.
2. **Boulder anwählen**: Tap auf den farbigen Pin auf dem Wandfoto öffnet das kompakte `BoulderBottomSheet`.
3. **Begehung loggen**:
   - 1 Klick auf **Flash ⚡**, **Top ✅** oder **Projekt 🎯**.
   - Optional: Subjektive Schwierigkeit (**Soft 🟢 / Fair 🟡 / Stiff 🔴**) und **1–5 Sterne**.
4. **Profil & Reflexion**:
   - Der Eintrag fließt unmittelbar in das persönliche Logbuch und in das 5-Achsen-Athleten-Radar ein.
   - Das System errechnet automatisch individuelle Empfehlungen (z. B. *"Sehr starke Balance auf Platten – Ausbaufähig: Dynamische Koordination im Überhang"*).

---

## 5. UI- & Design-Prinzipien (Constitution Compliance)

1. **Stone-Spacing & Minimalismus**:
   - Dunkles, augenschonendes Hallen-Design (`#121212`, `#1E1E1E`, `#2A2A2A`, `#E8E0D4`).
   - Keine visuellen Ablenkungen, großzügiger Raum zwischen Interaktionselementen.
2. **Fokusierte Navigation**:
   - Für 95% der Nutzer gibt es nur 2 Haupt-Pfeiler: **Wand & Sektoren** und **Meine Statistiken** (mit den beiden Sub-Bereichen „Overall Statistik“ und „Deep Dive“).
3. **Dezente Werkzeuge**:
   - Schrauber- und Admin-Werkzeuge sind unaufdringlich im Profil oder über einen minimalistischen Header-Button erreichbar und für Standard-User komplett unsichtbar.
4. **Feature-Isolation**:
   - Keinerlei Feature-Leckagen zwischen den 3 Sphären.

---

## 6. Acceptance Criteria

- [x] **AC-1 (Zero-Friction Auth)**: Social Sign-In (Google/Apple) ermöglicht sofortigen Zugang; Profil wird automatisch initialisiert.
- [x] **AC-2 (Hallenspezifisches Scoping)**: Alle administrativen und schrauberischen Aktionen sind strikt an die aktive Halle gebunden.
- [x] **AC-3 (Hallen-Admin Workflow)**: Farbskalen, Sektoren, Wandfotos und Schrauber-Berechtigungen sind in einer aufgeräumten Konsole gebündelt.
- [x] **AC-4 (Schrauber Batch-Workflow)**: Neuerfassung von Routen erfolgt per Pin-Drop auf dem Wandfoto in unter 3 Minuten pro Wand.
- [x] **AC-5 (Kletterer-Kern-Flow)**: Finden über Wandfoto, Loggen in unter 2 Klicks, Community-Bewertung und dynamisches Athleten-Radar.
- [x] **AC-6 (Constitution Design-Treue)**: Vollständige visuelle Ruhe, Stone-Spacing, keine überfrachteten Menüs oder Feature-Mischungen.
