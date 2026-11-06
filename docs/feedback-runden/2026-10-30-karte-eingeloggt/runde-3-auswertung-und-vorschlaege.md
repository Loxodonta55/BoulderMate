# Runde 3 – Auswertung und Vorschläge (Spec v3 → v4 READY)

> **Datum:** 2026-10-30 · **Gegenstand:** SPEC-025 / SPEC-053 – Hallen-Karte im eingeloggten Zustand (Stand v3).

## 1. Themen-Cluster nach Schweregrad

| Cluster | Nennungen | Populationen | Problem in einem Satz | Typische Zitate | Schweregrad |
|---|---|---|---|---|---|
| **C1 · Beim Öffnen der Karte aus «Ich → Einstellungen» soll die Einstellungs-Unteransicht direkt schließen** | 3 / 30 | 55+, Kaufleute | Wenn man in «Einstellungen» auf «Hallen-Karte» tippt, ist es noch sauberer, wenn `setIsSettingsOpen(false)` direkt beim Öffnen der Karte ausgeführt wird, damit nach dem Schließen der Karte wieder die Hauptseite «Ich» sichtbar ist. | «Wenn ich in den Einstellungen auf ‹Hallen-Karte› tippe, schließt die Einstellungs-Unterseite direkt und das Karten-Sheet geht auf.» (René, 66) | **niedrig** |

*(Keine Kritik «hoch» oder «mittel» mehr in Runde 3.)*

## 2. Priorisierte Vorschläge & Entscheidung

| # | Vorschlag | Nutzen | Aufwand | Priorität | Entscheidung |
|---|---|---|---|---|---|
| **V1** | Beim Klick auf `settings-open-gym-map` in `MeView.tsx` `setIsSettingsOpen(false)` aufrufen und `onOpenGymFinder?.()` öffnen. | klein | minimal | niedrig | **übernehmen** |

## 3. Abbruchprüfung nach Loop 3

- Mindestens 3 Loops durchgeführt (Loop 1 bis Loop 3 mit je 30 Personen aus gemischten Populationen).
- Keine offene Kritik mit Schweregrad **hoch** oder **mittel**.
- Änderungen in Loop 3 nur noch Feinschliff → **Spec-Status `READY`**, Freigabe zur Umsetzung mit Unit- und Playwright-Tests.
