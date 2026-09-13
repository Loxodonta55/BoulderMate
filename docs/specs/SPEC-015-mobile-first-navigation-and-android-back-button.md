# SPEC-015: Mobile-First Hierarchische Navigation & Android Hardware Back-Button Handling

## Status: APPROVED (Konzipiert via Grill-Me Methodik)

## Summary
In mobilen Browsern, Progressive Web Apps (PWA) und Android WebViews führt das Betätigen der hardware- oder systemseitigen Zurück-Taste (bzw. der seitlichen Wischgeste) in Single-Page-Applications (SPA) häufig zum unabsichtlichen Verlassen der Applikation. 
Dieses Dokument spezifiziert das durchgängige, hierarchische Mobile-First Navigations- und Verlaufskonzept für BoulderMate. Das System fängt den Android Back-Button auf allen Ebenen (Overlays, Modals, Fullscreen, Sub-Tabs, Workspaces) deterministisch ab und führt den Kletterer schrittweise entlang des Navigationsbaums zurück, anstatt die Anwendung zu beenden.

---

## 1. Grill-Me Kernanalyse: Systemische Fragen & Architekturentscheidungen

### Q1: Warum verlässt die App beim Drücken auf „Zurück“ aktuell die Anwendung?
- **Ursache**: Bisherige Zustandswechsel (Tab-Wechsel, Modal-Öffnungen, Vollbildansichten) änderten lediglich lokalen React-State (`useState`), ohne Einträge in den HTML5-Browserverlauf (`window.history.pushState`) zu schreiben.
- **Folge**: Für das Android-Betriebssystem und den mobilen Browser existiert im Session-Verlauf nur ein einziger Eintrag (die Einstiegsseite). Das Betätigen der Zurück-Taste veranlasst den Browser sofort, den Tab zu schließen, zur vorherigen Website zurückzukehren oder die installierte PWA zu minimieren/beenden.
- **Lösung**: Einführung eines globalen, leichtgewichtigen `NavigationHistoryManager` bzw. `useBackHandler`-Stacks. Jeder hierarchische Zustandsschritt (Modal, Sheet, Vollbild, Sub-Tab, Moduswechsel) synchronisiert sich transparent mit dem Browser-Verlauf via `history.pushState` und fängt `popstate`-Events ab.

### Q2: Wie sieht die exakte hierarchische Navigations-Pyramide (LIFO - Last In, First Out) aus?
Wenn ein Nutzer die Zurück-Taste drückt, muss die App stets die **spezifischste und tiefste Ebene** zuerst schließen, ohne die darunterliegenden Ebenen zu beeinträchtigen:

```
[Ebene 4: Verschachtelte Modals (Tertiary Overlays)]
  ├── RatingModal (aus BoulderDetailModal)
  ├── PublicProfileModal (aus BoulderDetailModal)
  ├── ProfileSettingsModal (aus UserProfileView)
  ├── WallPhotoUploadModal (aus BatchBoulderWorkflow)
  └── BatchSummaryModal (aus BatchBoulderWorkflow)
       │  (Back schließt nur das Child-Modal; Parent bleibt offen)
       ▼
[Ebene 3: Primäre Overlays, Bottom-Sheets & Vollbild (Secondary Layer)]
  ├── BoulderDetailModal (aus ClimberSectorView / UserProfileView)
  ├── BoulderBottomSheet (Entwurf im Schrauber-Studio)
  ├── isSectorFullscreen (Vollbild-Wandansicht)
  ├── RoleGatewayModal (Bereichswahl nach Login)
  └── LoginModal (Auth-Eingabemaske)
       │  (Back schließt Sheet/Modal oder beendet Vollbild)
       ▼
[Ebene 2: Sub-Tabs & Werkbereiche (Sub-Views)]
  ├── UserProfileView: 'deep_dive' Sub-Tab  ──Back──►  'overall' Sub-Tab
  ├── UserProfileView: 'performance' Segment ──Back──►  'overview' Segment
  ├── GymManagement: 'grading' / 'team' Tab ──Back──►  'sectors' Tab
  └── App-Modus: 'setter' / 'admin' Mode    ──Back──►  'climber' Mode
       │  (Back kehrt zur Basiskonfiguration des Bereichs zurück)
       ▼
[Ebene 1: Haupt-Tabs der Kletterer-App (Primary Tabs)]
  └── activeTab: 'stats' (Meine Statistiken) ──Back──► 'wall' (Wand & Sektoren)
       │  (Wand & Sektoren ist die Home-Base des Kletterers)
       ▼
[Ebene 0: Root Base (Kletterer-App, Wandansicht, keine Modals)]
  └── Standard-Zustand: Kletterer vor der Wand.
       (Back erlaubt hier das reguläre, kontrollierte Verlassen der App)
```

### Q3: Das „Ghost Entry“-Problem: Wie wird verhindert, dass UI-Schaltflächen (z. B. das „X“-Icon) den Verlauf desynchronisieren?
- **Problem**: Wenn das Öffnen eines Modals `pushState` ausführt, das Schließen über das „X“-Icon jedoch nur `setIsOpen(false)` aufruft, bleibt ein verwaister Verlaufseintrag im Browser zurück. Drückt der Nutzer später auf „Zurück“, feuert ein unerwartetes `popstate` auf ein bereits geschlossenes Modal.
- **Lösung**: 
  1. Der `NavigationHistoryManager` unterscheidet atomar zwischen einem **Browser-Pop** (Zurück-Taste / Geste) und einem **UI-Close** (Klick auf X, Backdrop oder Fertig).
  2. Schließt der Nutzer ein Element über die UI, ruft der Manager automatisch `window.history.back()` auf oder bereinigt den Stack synchron, sodass niemals Ghost Entries oder Double-Back-Bedarfe entstehen.
  3. Re-entrancy Protection: Das durch `window.history.back()` ausgelöste `popstate` wird als internes Cleanup erkannt und führt nicht zur doppelten Ausführung von Callbacks.

### Q4: Funktioniert das nahtlos in Android Chrome, PWA (Standalone), Samsung Internet und Desktop?
- **Ja**: Die HTML5 History API (`pushState`, `replaceState`, `popstate`) ist der universelle Standard aller mobilen und Desktop-Browser.
- In installierten PWAs (Home-Screen-Apps) leitet Android die Hardware-Zurück-Taste direkt an den WebView-Verlauf weiter. Durch unsere Interzeption verhält sich die WebApp exakt wie eine native Android-App (z. B. WhatsApp, Instagram, 27 Crags).
- Auf Desktops reagiert das System identisch auf den Browser-Zurück-Button und die Tastenkombination `Alt + Pfeil links`.

### Q5: Bleiben bestehende Tests und SSR/JSDOM kompatibel?
- **Ja**: Der `NavigationHistoryManager` prüft `typeof window !== 'undefined'` und initialisiert in Node/JSDOM ohne Fehler. In Vitest-Tests kann über standardmäßige Events (`fireEvent(window, new PopStateEvent('popstate'))`) die Zurück-Navigation zu 100% deterministisch getestet werden.

---

## 2. Akzeptanzkriterien (AC)

- **AC-15.1: Modal & Sheet Back-Navigation**:
  - Wenn `BoulderDetailModal` geöffnet ist und der Android Back-Button betätigt wird, schließt sich das Modal und der Kletterer bleibt auf der Wandansicht.
  - Wenn `RatingModal` innerhalb von `BoulderDetailModal` geöffnet ist, schließt ein Back-Event nur das `RatingModal`; das `BoulderDetailModal` bleibt geöffnet.
  - Wenn `PublicProfileModal` innerhalb von `BoulderDetailModal` geöffnet ist, schließt ein Back-Event nur das Profil-Modal.
- **AC-15.2: Vollbild-Wandansicht Back-Navigation**:
  - Wenn `isSectorFullscreen` in `ClimberSectorView` aktiv ist, beendet die Zurück-Taste den Vollbildmodus und kehrt zur Standard-Wandansicht zurück.
- **AC-15.3: Tab-Navigation (Stats -> Wall)**:
  - Befindet sich der Nutzer auf dem Tab `Meine Statistiken` (`activeTab === 'stats'`), wechselt die Zurück-Taste zurück zu `Wand & Sektoren` (`activeTab === 'wall'`).
- **AC-15.4: Sub-Tab Navigation im Profil**:
  - Befindet sich der Nutzer im Sub-Bereich `Deep Dive` des Profils, führt die Zurück-Taste zunächst zurück zum Sub-Bereich `Overall Statistik`, bevor ein weiterer Klick zur Wand führt.
  - Befindet sich der Nutzer im Segment `Athleten-Performance & Stil-Radar`, führt die Zurück-Taste zurück zu `Übersicht`.
- **AC-15.5: Bereichswechsel (Schrauber / Admin -> Kletterer)**:
  - Befindet sich ein Schrauber im `Schrauber-Studio` (`appMode === 'setter'`) oder ein Hallen-Admin in der `Admin-Konsole` (`appMode === 'admin'`), führt die Zurück-Taste sicher zurück in die Kletterer-App (`appMode === 'climber'`).
- **AC-15.6: UI-Schließen ohne Ghost Entries**:
  - Das Schließen über das „X“-Icon, Backdrop oder Speichern hinterlässt keine verwaisten History-States; nachfolgende Zurück-Tastendrücke arbeiten präzise auf der verbleibenden Hierarchie.
- **AC-15.7: Keine Sackgassen an der Root-Ebene**:
  - An der Basis der Kletterer-App (Wandansicht, keine Overlays) wird die Zurück-Taste nicht blockiert, sodass der Nutzer die App bei Bedarf regulär verlassen oder minimieren kann.
