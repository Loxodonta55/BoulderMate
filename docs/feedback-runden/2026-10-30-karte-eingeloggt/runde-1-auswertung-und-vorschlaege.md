# Runde 1 – Auswertung und Vorschläge (Spec v1 → v2)

> **Datum:** 2026-10-30 · **Gegenstand:** SPEC-025 / SPEC-053 – Hallen-Karte im eingeloggten Zustand sichtbar & erreichbar machen.

## 1. Themen-Cluster nach Schweregrad

| Cluster | Nennungen | Populationen | Problem in einem Satz | Typische Zitate | Schweregrad |
|---|---|---|---|---|---|
| **C1 · Hallenname im Header wird nicht als «Karte» erkannt** | 19 / 30 | Anfänger, 55+, Handwerk, Hallenpersonal, Pflege | Nach dem Login fehlt jedes Karten-Symbol (`MapPin`) und das Wort «Karte» im Header; der abgeschnittene Hallenname wirkt wie eine bloße Überschrift. | «Auf eine Überschrift tippe ich doch nicht, wenn da kein Karten-Zeichen dran ist.» (Toni, 60) · «Vor dem Anmelden war die Karte da, nach dem Anmelden weg!» (Hanna, 24) | **hoch** |
| **C2 · Karte im Admin- und Schrauber-Modus komplett blockiert** | 9 / 30 | Hallenpersonal (Admins, Schrauber), Trainer | `GymFinderSheet` hat in `App.tsx` die Bedingung `open={isGymFinderOpen && appMode === 'climber'}` und `AdminGymSheet` bietet keinen Absprung zur Gesamtkarte. | «Im Admin-Modus tippe ich oben links auf 6a plus und sehe nur meine Halle – keine Karte, nirgends!» (Reto, 45) | **hoch** |
| **C3 · Englische Übersetzung im Karten-Sheet unvollständig** | 6 / 30 | Englischsprachige, Touristen, IT | Grundtexte in `GymFinderSheet.tsx` und `GymMap.tsx` («Halle wählen», «Halle oder Ort», «In meiner Nähe», «Zur Wand», «Navigation starten», «Karte nicht verfügbar») sind noch nicht in `t()` gewrappt. | «The search box says ‹Halle oder Ort› and the button says ‹Zur Wand› even in English.» (Liam, 29) | **mittel** |
| **C4 · Unter «Ich» & «Einstellungen» zu weit unten versteckt** | 14 / 30 | 55+, Verwaltung, Gesundheit, Eltern | Wer im Profil («Ich») beim Umschalter «Diese Halle / Alle Hallen» oder in den «Einstellungen» nach der Karte sucht, findet sie erst ganz am Seitenende unter «Halle empfehlen». | «Wenn ich auf ‹Alle Hallen› tippe, will ich direkt daneben oder darunter die Hallen-Karte öffnen können.» (Valentina, 31) | **mittel** |
| **C5 · Platz im Header auf kleinen Handys (320–375 px)** | 8 / 30 | Azubis, Pflege, Kreative (iPhone SE / mini) | Ein zusätzlicher breiter Knopf im Header darf den Hallennamen auf 375 px nicht unlesbar abschneiden. | «Passt auf den Platz auf dem iPhone SE auf!» (Silvan, 20) | **mittel** |
| **C6 · «Zur Wand» aus jedem Bereich muss wirklich zur Wand führen** | 7 / 30 | Handwerk, Hallenpersonal, Azubis | Wird die Karte aus «Ich», «Einstellungen», Admin oder Studio geöffnet, muss «Zur Wand» immer in den Kletterer-Modus auf den Tab «Wand» wechseln. | «‹Zur Wand› heißt ‹Zur Wand› – egal von wo ich die Karte geöffnet habe.» (Kevin, 21) | **mittel** |

## 2. Priorisierte Vorschläge (Nutzen vs. Aufwand)

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck vs. Überladung | Entscheidung |
|---|---|---|---|---|---|---|
| **V1** | **Kletterer-Header (`AppHeader.tsx`):** `header-gym-select` bekommt links ein `MapPin`-Icon und wird immer gerendert (auch falls `gyms` leer ist). Zusätzlich gibt es einen kompakten, barrierefreien Knopf `header-map-btn` (`MapPin` + Label «Karte»), der auf schmalen Screens platzsparend mit dem Header harmoniert (≥ 44 px Tippfläche). | hoch | klein | **sofort** | stärkt den Hauptzweck (Halle & Wand finden) | **übernehmen** |
| **V2** | **Sperre in `App.tsx` aufheben + Admin/Studio-Zugang:** `GymFinderSheet` hat `open={isGymFinderOpen}` (ohne `&& appMode === 'climber'`). Bei «Zur Wand» (`onSelectGym`) wird `setAppMode('climber'); setActiveTab('wall');` gesetzt. In `AdminGymSheet.tsx` kommt unten der Knopf `admin-open-gym-map` («Alle Hallen auf der Karte») hinzu; im Admin- und Studio-Header je ein kompakter Karten-Knopf (`admin-map-btn`, `studio-map-btn`). | hoch | klein | **sofort** | stärkt | **übernehmen** |
| **V3** | **Direkteinstieg in «Ich» (`MeView.tsx`) & «Einstellungen»:** Unter dem Umschalter «Diese Halle / Alle Hallen» in «Ich» ein flacher Knopf `me-open-gym-map` («Hallen-Karte · Alle Hallen & Noch nicht dabei») und in «Einstellungen» (unter «Arbeitsbereich» bzw. eigener Punkt) eine Zeile `settings-open-gym-map` («Hallen-Karte»). | hoch | klein | **hoch** | stärkt | **übernehmen** |
| **V4** | **Vollständige `t()`-Übersetzung in `GymFinderSheet.tsx` & `GymMap.tsx`:** Alle restlichen deutschen Strings in `t()` fassen und in `src/lib/i18n/en-hallen.ts` / `en-base.ts` ergänzen. | mittel | klein | **hoch** | stärkt (Gäste & Expats) | **übernehmen** |

## 3. Nicht umsetzen (begründet verworfen)

- **Kein 4. Tab «Karte» in der unteren Navigationsleiste (`MobileBottomNav`):** Würde gegen SPEC-022 F2/F11 verstoßen; man wechselt die Halle nicht alle 2 Minuten während des Kletterns.
- **Kein schwebendes Karten-Banner über dem Wandfoto:** Das Wandfoto gehört den Routen (SPEC-022 F1).
