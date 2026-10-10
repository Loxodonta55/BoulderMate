# Loop «FeatureDefinition»

> **Gilt für:** jedes neue Feature, ab 2026-10-10 (Entscheidung Hans). Gilt für alle Werkzeuge (Claude Code, Antigravity, Menschen). Diese Datei ist die verbindliche Quelle; Skills und Workflows verweisen nur hierher.
> **Nutzt:** [Ablauf «Feedback einholen»](feedback-einholen.md)

## Überblick

```
Schritt 0: Grill-me  ──►  Spec v1
                            │
      ┌─────────────────────┘
      ▼
Loop n (mind. 3, max. 5):
  Feedback einholen  ──►  Vorschläge übernehmen / anpassen / verwerfen
                     ──►  Spec v(n+1) + «FeatureDefinition-Verlauf»
      │
      ├─ n < 3                              → nächster Loop
      ├─ n ≥ 3 und (Kritik «hoch» oder Spec wesentlich geändert) und n < 5 → nächster Loop
      └─ sonst                              → Abschluss
                                               │
Abschluss: Spec-Status READY, Meldung  ──►  Umsetzung mit Unit- und Playwright-Tests
```

## Schritt 0: Grill-me

Fragen an den Auftraggeber (Hans), **jede mit klarer Empfehlung** und **mit einem Wort beantwortbar** (Optionen kurz, Empfehlung markiert). Mindestens zu klären:

1. **Zweck**: Welches Problem löst das Feature, für wen?
2. **Zielgruppe**: Kletterer, Schrauber, Hallen-Admin, Gäste?
3. **Ort in der App**: Wo lebt es (Tab, Sheet, Einstellungen, Admin-Konsole)?
4. **Was es nicht sein soll**: ausdrückliche Abgrenzung.
5. **Abgrenzung zum Hauptzweck**: Wie bleibt Boulder finden, bewerten, Erfolge tracken im Vordergrund?

Ergebnis: **Spec v1** in `docs/specs/SPEC-<nnn>-<name>.md` (Nummer fortlaufend, Eintrag in `docs/specs/INDEX.md`), mit Grill-me-Entscheidungen und **Akzeptanzkriterien**. Status `DRAFT`.

## Loops (mindestens 3, höchstens 5)

Pro Loop *n*:

1. **Feedback einholen** nach [feedback-einholen.md](feedback-einholen.md) auf den **aktuellen Spec-Stand**. Ablage: `docs/feedback-runden/<datum>-<feature>/runde-<n>-unterhaltung.md` und `runde-<n>-auswertung-und-vorschlaege.md` (ein Ordner pro Feature, Datum des ersten Loops).
2. **Jeden Vorschlag entscheiden**: übernehmen, anpassen oder **begründet verwerfen**. Maßstab: stärkt den Hauptzweck, überlädt nicht, passt zu CONSTITUTION und Design System.
3. **In die Spec einarbeiten** und die **Version hochzählen** (v1 → v2 → …).
4. **Im Spec-Abschnitt «FeatureDefinition-Verlauf»** eine Zeile ergänzen:

   | Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
   |------|-------|------------|------------------------|-------------------|
   | 1 | 2026-10-10 | … | … (→ v2) | … |

**Abbruchregel:**
- Nach Loop 3 **weiter**, solange noch Kritik mit Schweregrad **hoch** kommt oder sich die Spec **wesentlich** ändert.
- **Spätestens nach Loop 5 stoppen.**
- **Grundsatzfragen** (Zweck, Zielgruppe, Ort, Umfang, Datenschutz) entscheidet nicht die Runde: Sie gehen mit Empfehlung an den Auftraggeber.

## Abschluss

1. Spec-Status auf **`READY`** setzen (auch in `docs/specs/INDEX.md`).
2. **Kurze Meldung** an den Auftraggeber: Anzahl Loops, wichtigste Änderungen, offene Grundsatzfragen (falls welche).
3. **Erst dann Umsetzung**, mit **Unit-Tests (Vitest) und Playwright-E2E-Tests** gemäß CONSTITUTION §13; die Spec nennt die Testdateien.

## Checkliste

- [ ] Grill-me mit Empfehlungen, Antworten in der Spec festgehalten
- [ ] Spec v1 mit Akzeptanzkriterien, Eintrag in INDEX.md
- [ ] Mind. 3 Loops, je zwei Dateien unter `docs/feedback-runden/<datum>-<feature>/`
- [ ] Jeder Vorschlag übernommen, angepasst oder begründet verworfen
- [ ] Version pro Loop hochgezählt, «FeatureDefinition-Verlauf» gepflegt
- [ ] Abbruchregel geprüft (keine offene Kritik «hoch», höchstens 5 Loops)
- [ ] Status READY, Meldung verschickt
- [ ] Umsetzung mit Unit- und Playwright-Tests, `npm run test:all` grün
