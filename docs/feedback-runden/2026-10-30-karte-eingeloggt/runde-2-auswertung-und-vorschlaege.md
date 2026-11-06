# Runde 2 – Auswertung und Vorschläge (Spec v2 → v3)

> **Datum:** 2026-10-30 · **Gegenstand:** SPEC-025 / SPEC-053 – Hallen-Karte im eingeloggten Zustand (Stand v2).

## 1. Themen-Cluster nach Schweregrad

| Cluster | Nennungen | Populationen | Problem in einem Satz | Typische Zitate | Schweregrad |
|---|---|---|---|---|---|
| **C1 · Schließen (`X`) der Karte im Admin/Studio darf den Modus nicht ungewollt verlassen** | 9 / 30 | Hallenpersonal (Admins, Schrauber), Partner | Wer im Admin- oder Schrauber-Modus die Karte nur zum Nachschauen öffnet und mit `X` schließt, muss im Admin/Studio bleiben; erst «Zur Wand» wechselt in den Kletterer-Modus. | «Wenn ich die Karte mit X zumache, will ich im Admin-Modus bleiben! Nur ‹Zur Wand› soll zur Wand wechseln.» (Stefan, 54) | **mittel** |
| **C2 · Platzverteilung im Kletterer-Header auf 360–375 px** | 8 / 30 | Azubis, Gesundheit, 55+ (iPhone SE / mini) | Im Kletterer-Header müssen `header-gym-select` (`flex-1 min-w-0`) und `header-map-btn` (`shrink-0`) so abgestimmt sein, dass weder der Hallenname unlesbar wird noch Elemente überlaufen. | «Auf 360 px muss `header-map-btn` kompakt bleiben, während `header-gym-select` den restlichen Platz sauber nutzt.» (Alina, 27) | **mittel** |
| **C3 · Englische Detail-Strings in den Zeilen & Karten-Badges** | 5 / 30 | Englischsprachige, Touristen | Neben den Hauptknöpfen müssen auch ` · gewählt`, `Ort fehlt`, `{n} Boulder`, `{n} neu` und `Zurück zur Liste` in `GymFinderSheet.tsx` über `t()` laufen. | «Also translate ` · gewählt`, `{n} neu` and `Ort fehlt` in the list!» (Chloe, 24) | **niedrig** |

*(Keine Kritik mit Schweregrad «hoch» in Runde 2.)*

## 2. Priorisierte Vorschläge (Nutzen vs. Aufwand)

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck vs. Überladung | Entscheidung |
|---|---|---|---|---|---|---|
| **V1** | **Modus-Erhalt beim bloßen Schließen (`onClose`):** `onClose` am `GymFinderSheet` ändert `appMode` nicht; nur `onSelectGym` («Zur Wand») setzt `setAppMode('climber'); setActiveTab('wall');`. | hoch | sehr klein | **sofort** | stärkt | **übernehmen** |
| **V2** | **Kompakte Header-Anordnung auf kleinen Handys:** `header-gym-select` trägt links ein `MapPin`-Icon + Hallenname + `ChevronDown`, und `header-map-btn` zeigt das Karten-Icon + `Karte` als kompakten Pill-Knopf (`min-h-[40px] px-2.5`), sodass auf 360–375 px alles in einer Zeile ohne Überlauf sitzt. | hoch | klein | **hoch** | stärkt | **übernehmen** |
| **V3** | **Restliche Zeilen-Texte in `GymFinderSheet.tsx` übersetzen:** ` · gewählt`, `Ort fehlt`, `{n} Boulder`, `{n} neu`, `Zurück zur Liste` über `t()` und in `en-hallen.ts` aufnehmen. | mittel | sehr klein | **mittel** | stärkt | **übernehmen** |

## 3. Nicht umsetzen

- **Kein automatisches Umschalten in den Kletterer-Modus schon beim bloßen Öffnen der Karte:** Admins und Schrauber wollen die Karte auch als Nachschlagewerk nutzen können, ohne ihren Arbeitsbereich zu verlieren.
