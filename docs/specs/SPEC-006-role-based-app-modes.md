# SPEC-006: Rollenbasierte App-Trennung & Role Gateway

## Status: APPROVED

## Summary
Trennt die App-Erfahrung strikt in drei dedizierte, unabhängige Arbeitsbereiche ("Apps"):
1. **Kletterer-App** (Wand & Sektoren, persönliches Logbuch, Profil & Statistiken)
2. **Schrauber-Studio** (visuelle Routenerfassung per Wandfoto, Grifffarben, 5-Achsen-Radar, Batch-Publish)
3. **Hallen-Admin-Konsole** (Hallenstammdaten, Farbsysteme / Font-Mapping, Sektorenverwaltung)

Reine Kletterer landen immer ohne Umwege direkt im aufgeräumten Kletterer-Panel. Nutzer mit erweiterten Rechten (Schrauber oder Hallen-Admin) erhalten direkt nach dem Einloggen (Step 1) das **Role Gateway**, in welchem sie entscheiden, in welchem Modus sie die App nutzen möchten.

---

## User Stories
- **US-1**: Als reiner Kletterer möchte ich nach dem Öffnen der App direkt und ausnahmslos auf der Wandansicht oder im Logbuch landen, ohne mit Schrauber-Werkzeugen oder Admin-Einstellungen überfrachtet zu werden.
- **US-2**: Als Routensetzer oder Hallen-Admin möchte ich nach dem Login in Step 1 explizit gefragt werden, in welcher Rolle ich arbeiten möchte (Kletterer, Schrauber oder Admin), damit ich einen fokussierten Arbeitsbereich erhalte.
- **US-3**: Als Schrauber möchte ich im "Schrauber-Studio" ein auf das Schrauben optimiertes Interface mit Hallen- und Sektorauswahl, Wandfoto-Pins und Batch-Veröffentlichung nutzen.
- **US-4**: Als Admin möchte ich in der "Hallen-Administration" gezielt Hallendaten, Farbsysteme und Sektoren verwalten, ohne Kletterer-Funktionen im Weg zu haben.
- **US-5**: Als berechtigter Nutzer möchte ich jederzeit unkompliziert zwischen den freigeschalteten Arbeitsbereichen wechseln oder zur Kletterer-App zurückkehren können.

---

## Acceptance Criteria
- [x] **AC-1**: Reine Kletterer (`role === 'member'`) haben ausschließlich Zugriff auf die Kletterer-App. Keine Schrauber-Toggles, keine Admin-Bereiche.
- [x] **AC-2**: Besitzt der eingeloggte Nutzer Schrauber- (`setter`) oder Administrator-Rechte (`admin`) in mindestens einer Halle, erscheint in Step 1 nach dem Login das **Role Gateway Modal** zur Rollen- und Bereichsauswahl.
- [x] **AC-3**: Das Role Gateway bietet nur diejenigen Modi an, für die der Nutzer berechtigt ist:
  - **Kletterer-App**: Immer verfügbar für alle Nutzer.
  - **Schrauber-Studio**: Verfügbar für Nutzer mit Rolle `setter` oder `admin`.
  - **Hallen-Administration**: Verfügbar für Nutzer mit Rolle `admin`.
- [x] **AC-4**: Jeder Modus besitzt ein eigenständiges, klares Header-Layout:
  - **Kletterer**: BoulderApp Brand, Hallenauswahl, Wand/Logbuch/Profil-Navigation, Kletterer-Simulator.
  - **Schrauber-Studio**: Studio-Banner mit Wrench-Icon, Hallenauswahl, Schnellwechsel "Bereich wechseln" und "← Zurück zur Kletterer-App".
  - **Hallen-Admin**: Admin-Banner mit Building/Shield-Icon, Hallenauswahl, Schnellwechsel "Routen schrauben" und "← Zurück zur Kletterer-App".
- [x] **AC-5**: Berechtigte Nutzer können aus dem Kletterer-Panel über einen dezenten Umschalter oder über ihr Profil jederzeit das Role Gateway erneut öffnen, um den Bereich zu wechseln.
- [x] **AC-6**: Beim Nutzerwechsel (z.B. Wechsel von Boris (Admin) zu Jonas (Kletterer)) wird die Ansicht sofort an die Berechtigungen des neuen Nutzers angepasst.
