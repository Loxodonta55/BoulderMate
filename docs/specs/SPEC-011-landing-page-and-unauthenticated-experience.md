# SPEC-011: Standalone Landing Page & Unangemeldete Besucher-Experience

## Status: APPROVED

## Summary
Definiert die Landing Page für unangemeldete Besucher von BoulderMate:
1. **Striktes Informations-Gate**: Unangemeldete User sehen **ausschließlich** die Landing Page mit allen Produktinformationen und Screenshots. Es gibt keinen anonymen Gast-Bypass in die interne Wandansicht oder in Sektoren.
2. **Schlankes, aufgeräumtes Design (SPEC-005)**: Vollständig standalone, ohne überladene Navigationsleisten oder interne App-Tools.
3. **Rollen-Differenzierung mit Kletterer-Fokus**:
   - **Kletterer (Hauptfokus / Standard)**: Visuelle Fotowand, Chalk-Proof 2-Tap Logging, Performance-Profil & Fontainebleau-Bänder (U1–U7), Community Barometer.
   - **Schrauber (Studio-Workflow)**: Batch-Umschrauben, direkte Pin-Platzierung, Kletterer-Feedback und Sektor-Monitoring.
4. **Einfache Registrierung & Login**: Schnelle Kontoerstellung (E-Mail, Google OAuth oder 1-Klick Test-Personas).
5. **Rollenwahl & Abbruch-Verhalten ('X')**:
   - Nach dem Login privilegierter Nutzer (Boris, Schrauber, Admin) erscheint das **Role Gateway** zur Bereichswahl.
   - Drückt der Nutzer im Role Gateway auf das **'X'** (Schließen-Button), schließt sich das Auswahlfenster sofort, die Session wird verworfen (`signOut`), und der Nutzer befindet sich wieder unangemeldet auf der Landing Page.

---

## User Stories
- **US-1**: Als unangemeldeter Besucher möchte ich auf einer aufgeräumten, schnellen Landing Page sofort verstehen, was BoulderMate kann, ohne von internen App-Menüs abgelenkt zu werden.
- **US-2**: Als Boulderer möchte ich im Zentrum der Erklärung stehen und anhand von Screenshots sehen, wie die Fotowand, das 2-Tap-Logging und mein persönliches Profil funktionieren.
- **US-3**: Als Routenbauer möchte ich in einem separaten Tab sehen, wie das Schrauber-Studio den Umschraub-Prozess digitalisiert und mir direktes Feedback der Kletterer liefert.
- **US-4**: Als neuer Nutzer möchte ich mich mit minimalem Aufwand registrieren oder mit einem Klick einen Demo-Account ausprobieren können.
- **US-5**: Als eingeloggter Nutzer möchte ich im Role Gateway die Wahl per 'X' abbrechen können, um mich abzumelden und unangemeldet auf die Landing Page zurückzukehren.

---

## Acceptance Criteria
- [x] **AC-1**: **Ausschließliche Landing Page für unangemeldete Besucher**:
  - Solange keine gültige Session existiert (`!authSession`), wird ausnahmslos die Landing Page gerendert.
  - Keine Wandansichten, Filterbars, Sektor-Wechsler oder Profil-Tabs sind ohne Anmeldung zugänglich.
- [x] **AC-2**: **SPEC-005 Design System**:
  - Farbpalette: Schweizer Alpen / Granit `#121212`, `#1E1E1E`, `#2A2A2A`, `#333333`, Chalk-Akzente `#F5F0E8` und Sandstein `#C9A96E`.
  - Typografie: Space Grotesk (Headlines) und Space Mono (Metadaten/Badges).
- [x] **AC-3**: **Rollen-Schalter mit Kletterer-Fokus**:
  - Segment-Schalter zwischen „Für Kletterer“ (Default, Tag: „Fokus“) und „Für Schrauber & Routenbau“.
  - Kletterer-Showcase umfasst: Interaktive Wand, Chalk-Proof 2-Tap Logging, Performance-Radar, Community Barometer.
  - Schrauber-Showcase umfasst: Batch-Umschrauben, Feedback-Loop.
- [x] **AC-4**: **Interaktive Screenshot- & Mockup-Vorschau**:
  - Jedes Feature verfügt über eine visuelle Mockup-Karte basierend auf realen Wandfotos (`six-a-comp.jpg`, `overhang.jpg`, `roof.jpg`, `six-a-slab.jpg`).
- [x] **AC-5**: **Schnell-Registrierung & Login**:
  - Login-Modal bietet Schnell-Registrierung (Kletter-Name + E-Mail), Google-Login und 1-Klick Demo-Personas.
- [x] **AC-6**: **Role Gateway Abbruch ('X')**:
  - Erscheint nach dem Login das Role Gateway („Arbeitsbereich wählen“), besitzt es immer einen Schließen-Button (`data-testid="role-gateway-close-btn"`).
  - Ein Klick auf das 'X' bricht die Anmeldung ab (`signOut()`), schließt das Fenster und versetzt den Nutzer zurück auf die Landing Page als unangemeldeter User (`Gast`).
- [x] **AC-7**: **Logout-Verhalten**:
  - Das Abmelden aus dem Profil führt direkt zurück auf die Landing Page.
