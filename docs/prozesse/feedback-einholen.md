# Ablauf «Feedback einholen»

> **Gilt für:** alle Werkzeuge (Claude Code, Antigravity, Menschen). Diese Datei ist die verbindliche Quelle; Skills und Workflows verweisen nur hierher.
> **Eingeführt:** 2026-10-10 durch Hans · **Wird genutzt von:** [Loop «FeatureDefinition»](feature-definition.md)

## Zweck

Eine simulierte, bunt gemischte Nutzerrunde prüft die ganze App oder ein einzelnes Feature, bevor (oder nachdem) gebaut wird. Ziel ist ehrliche, konkrete Kritik aus vielen Lebenswelten, nicht Bestätigung.

## 1. Gegenstand festlegen

- **Ganze App** oder **ein Feature**.
- Material, das die Runde «sieht»: die Spec (aktueller Stand mit Version), Screenshots, der Code-Stand (Branch, betroffene Komponenten). Was die Runde nicht sehen kann, wird nicht bewertet.
- In einem Satz notieren, was geprüft wird und welche Frage die Runde beantworten soll.

## 2. Runde zusammenstellen

- **30 Personen**, Alter **18 bis 70**.
- Mindestens **20 klar unterschiedliche Typen Mensch** (nicht 30 Varianten von «Software-Entwickler, 32, klettert 7a»).
- **Nicht nur MINT.** Pro Runde mindestens **6 Populationen** mischen, zum Beispiel:
  - Naturwissenschaft, Ingenieurwesen, IT
  - Handwerk und Pflege (Schichtarbeit)
  - Studierende und Azubis
  - Eltern mit Kindern
  - Ältere 55+ mit schlechteren Augen
  - Hallenpersonal (Schrauber, Theke, Betreiber)
  - Profis und Trainer
  - Anfänger
  - Menschen mit Einschränkungen (Seh- oder Farbsehschwäche, motorisch)
  - Englischsprachige und Touristen
  - Kreative, Lehrkräfte, Kaufleute
- Die Mischung **von Runde zu Runde variieren** (andere Personen, andere Schwerpunkte).
- Jede Person bekommt: **Name, Alter, Beruf/Population, Kletterniveau, Gerät, Erwartung an die App.** Als Tabelle am Anfang der Unterhaltung.

## 3. Gruppengespräch führen

- Natürliches Gespräch über **Vor- und Nachteile**, nicht 30 Einzelmonologe.
- **Widerspruch ist erwünscht**: Personen reagieren aufeinander, widersprechen, relativieren.
- **Konkret**: welcher Knopf, welcher Text, welcher Bildschirm, welche Situation (Kreide an den Händen, Sonne auf dem Display, Kind am Arm).
- **Keine Schönfärberei**: Wer etwas nicht braucht oder nicht versteht, sagt das.
- Jede Person kommt mindestens einmal zu Wort; die Lautesten dürfen nicht alles bestimmen.

## 4. Auswerten

1. **Themen clustern**, pro Thema: Anzahl Nennungen und betroffene Populationen.
2. **Pro Thema**: Problem in einem Satz, 1–3 typische Zitate, **Schweregrad hoch / mittel / niedrig**.
   - *hoch*: Hauptzweck gestört, Personen brechen ab, Barriere für eine Gruppe, Datenschutz/Sicherheit.
   - *mittel*: spürbare Reibung, aber lösbar.
   - *niedrig*: Geschmack, Feinschliff.
3. **Priorisierte, umsetzbare Vorschläge** mit Nutzen gegen Aufwand (z. B. Tabelle: Vorschlag, Nutzen, Aufwand, Priorität).
4. Jeden Vorschlag markieren: **stärkt den Hauptzweck** (Boulder finden, bewerten, Erfolge tracken) oder **würde überladen**.
5. Ausdrücklich sagen, **was NICHT umgesetzt werden sollte** und warum.

## 5. Ablage

```
docs/feedback-runden/<datum>-<thema>/
├── 1-unterhaltung.md                   # Teilnehmertabelle + Gespräch
└── 2-auswertung-und-vorschlaege.md     # Cluster, Schweregrade, Vorschläge, Nicht-umsetzen
```

- `<datum>` als `JJJJ-MM-TT`, `<thema>` kurz in Kleinbuchstaben mit Bindestrichen (z. B. `2026-10-10-treff`).
- **Bei Loop-Runden** (aus [FeatureDefinition](feature-definition.md)) liegen alle Runden eines Features im selben Ordner mit Präfix:
  `runde-<n>-unterhaltung.md` und `runde-<n>-auswertung-und-vorschlaege.md`.
- Arbeitet ein Claude-Projekt mit geteiltem Ordner `/mnt/project-files/`, wird derselbe Ordner zusätzlich unter `/mnt/project-files/feedback-runden/` abgelegt. Das Repo bleibt die Quelle.

## Checkliste

- [ ] Gegenstand und Leitfrage notiert
- [ ] 30 Personen, 18–70, ≥ 20 Typen, ≥ 6 Populationen, Mischung anders als letzte Runde
- [ ] Gespräch mit Widerspruch und konkreten Stellen
- [ ] Cluster mit Anzahl, Populationen, Zitaten, Schweregrad
- [ ] Vorschläge nach Nutzen/Aufwand priorisiert, Hauptzweck vs. Überladung markiert
- [ ] «Nicht umsetzen»-Liste
- [ ] Beide Dateien im richtigen Ordner abgelegt
