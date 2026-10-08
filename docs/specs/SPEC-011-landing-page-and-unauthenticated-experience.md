# SPEC-011: Standalone Landing Page & Unangemeldete Besucher-Experience

> **Hinweis (04.10.2026):** Gemäß [SPEC-020](SPEC-020-ux-overhaul-design-system-v2.md) wurde das strikte Informations-Gate gelockert: Unangemeldete Gäste dürfen die Wandansicht und Sektoren im **Read-only-Modus** frei erkunden («Ohne Konto umsehen»). Aktionen wie Begehungs-Logging oder Bewerten fordern zur Anmeldung auf. Zudem entfällt das Pflicht-Role-Gateway beim Login.

> **Update (06.10.2026, Text-Diät, SPEC-020 AC-9):** Die Landing Page passt auf einen Screen: Logo mit «Anmelden», Claim «Erkennen, welche Boulder cool sind.», drei Punkte («Perlen finden», «Passt zu dir», «2 Taps loggen») und zwei Buttons («Konto erstellen», «Als Kletterer testen»). Höchstens 40 Wörter. Rollen-Schalter, Mockup-Karten und Schrauber-Showcase entfallen. Test-Personas erscheinen nur im Dev-Build (`import.meta.env.DEV`), auf der Landing Page wie im Login-Modal. Ein Standardpasswort gibt es nicht mehr: Registrierung verlangt mindestens 6 Zeichen. Technische Footer-Texte («Supabase Authentication», «Aktuell nicht angemeldet (Gast)») sind entfernt. Farben: Palette «Kreide» aus SPEC-020 §2.3. Tests: `tests/landingPage.test.tsx`, `tests/spec020RedesignKreide.test.tsx`, `tests/e2e/redesign-kreide.spec.ts`.

## Status: APPROVED (Aktualisiert durch SPEC-020)

## Summary
Definiert die Landing Page für unangemeldete Besucher von BoulderMate:
1. **Striktes Informations-Gate**: Unangemeldete User sehen **ausschließlich** die Landing Page mit allen Produktinformationen und Screenshots. Es gibt keinen anonymen Gast-Bypass in die interne Wandansicht oder in Sektoren.
2. **Schlankes, aufgeräumtes Design (SPEC-005)**: Vollständig standalone, ohne überladene Navigationsleisten oder interne App-Tools.
3. **Rollen-Differenzierung mit Kletterer-Fokus & Constitution-Marketing**:
   - **Kletterer (Hauptfokus / Standard — 5 Säulen nach CONSTITUTION.md Abs. 1.1)**:
     1. **Welche Boulder sind cool?**: Perlen und Spaßgaranten des Schraubzyklus sofort an echten Wandfotos entdecken.
     2. **Welche passen zu mir?**: Style-, Neigungs- & Grad-Match über das 5-Achsen-Leistungsradar.
     3. **Tracken ohne Frust**: Lückenloses 2-Tap-Logging (Flash, Top, Projekt) für kreidige Hände auf der Matte.
     4. **Diskutieren & Beta-Talk**: Die klassische Matten-Diskussion zieht digital direkt an den Pin der Route.
     5. **Faire Grade im Barometer**: Demokratische Grade-Findung statt Schrauber-Willkür (Soft/Fair/Stiff + Sterne).
   - **Schrauber (Mission & Studio-Workflow nach CONSTITUTION.md Abs. 1 & 6)**:
     - Eine Wand mit ~8 Bouldern in **unter 3 Minuten** per Batch-Foto-Workflow erfassen.
     - Echtes Community-Feedback & Barometer-Resonanz von der Matte statt Schrauber-Tunnelblick.
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
- [x] **AC-2**: **Design System** (ersetzt 06.10.2026):
  - Farbpalette «Kreide» laut SPEC-020 §2.3, hell und dunkel automatisch; keine fest codierten Farben.
  - Typografie: Space Grotesk (Headlines) und Space Mono (Metadaten/Badges).
- [x] **AC-3** *(entfällt seit 06.10.2026, ersetzt durch SPEC-020 AC-9.1)*: **Rollen-Schalter mit Kletterer-Fokus**:
  - Segment-Schalter zwischen „Für Kletterer“ (Default, Tag: „Fokus“) und „Für Schrauber & Routenbau“.
  - Kletterer-Showcase umfasst: Interaktive Wand, Chalk-Proof 2-Tap Logging, Performance-Radar, Community Barometer.
  - Schrauber-Showcase umfasst: Batch-Umschrauben, Feedback-Loop.
- [x] **AC-4** *(entfällt seit 06.10.2026, ersetzt durch SPEC-020 AC-9.1)*: **Interaktive Screenshot- & Mockup-Vorschau**:
  - Jedes Feature verfügt über eine visuelle Mockup-Karte basierend auf realen Wandfotos (`six-a-comp.jpg`, `overhang.jpg`, `roof.jpg`, `six-a-slab.jpg`).
- [x] **AC-5**: **Schnell-Registrierung & Login**:
  - Login-Modal bietet Schnell-Registrierung (Kletter-Name + E-Mail + Passwort mit mindestens 6 Zeichen) und Google-Login. 1-Klick Demo-Personas nur im Dev-Build.
- [x] **AC-6**: **Role Gateway Abbruch ('X')**:
  - Erscheint nach dem Login das Role Gateway („Arbeitsbereich wählen“), besitzt es immer einen Schließen-Button (`data-testid="role-gateway-close-btn"`).
  - Ein Klick auf das 'X' bricht die Anmeldung ab (`signOut()`), schließt das Fenster und versetzt den Nutzer zurück auf die Landing Page als unangemeldeter User (`Gast`).
- [x] **AC-7**: **Logout-Verhalten**:
  - Das Abmelden aus dem Profil führt direkt zurück auf die Landing Page.
