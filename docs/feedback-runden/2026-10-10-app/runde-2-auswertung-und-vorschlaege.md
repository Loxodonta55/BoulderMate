# Runde 2 – Auswertung und Vorschläge (SPEC-045 v2 → v3)

> Simuliert. Grundlage: [runde-2-unterhaltung.md](runde-2-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Nutzerinhalte (Beta, Treff, Anzeigenamen) ohne **Melden, Blockieren, Moderation** → Ablehnung durch Apple/Google; Schutz von Kindern | 6 (Felix, Jana, Moritz, Andreas, Katrin, Rolf) | MINT, Trainer, Jura, Betreiber, Eltern, Ehrenamt | **hoch** (Zulassung, Sicherheit) |
| T2 | Google Play: als Privatperson **14 Tage Test mit mindestens 12 Testern** vor Veröffentlichung | 4 (Daniel, Andreas, Nele, Margot) | MINT, Betreiber, FSJ, Ältere | **hoch** (Zeitplan blockiert) |
| T3 | Wandfotos offline nicht da → graue Wand im Keller | 2 (Sami, Hasan) | MINT, Schicht | mittel |
| T4 | Hans' Aufgaben als echte **Checkliste in Reihenfolge**, mit Wartezeiten; EU-Händlerstatus als Entscheidung | 4 (Daniel, Anja, Moritz, Felix) | MINT, Kaufleute, Jura | mittel |
| T5 | Prüfer-Konto braucht eine Halle **mit Daten** | 1 (Felix) | MINT | mittel |
| T6 | Große Systemschrift darf das Layout nicht zerbrechen; VoiceOver/TalkBack im Scanner | 3 (Hermann, Ingrid, Kai) | Ältere, Einschränkungen, Schicht | mittel |
| T7 | **Kein Tracking** festschreiben (keine Analyse-Dienste, keine Werbe-ID, kein Hintergrund) | 3 (Matthias, Hasan, Felix) | IT-Sicherheit, Schicht | mittel |
| T8 | Startbild und Statusleiste folgen hell/dunkel | 2 (Vera, Selin) | Kreative, Gesundheit | mittel |
| T9 | Zwei Symbole (Webseite + App) verwirren; «gleiches Konto» sagen | 3 (Erika, Paula, Margot) | Ältere, Anfänger | mittel |
| T10 | Android beendet die App während der Kamera → Foto weg | 2 (Svenja, Sami) | Schrauber, MINT | mittel |
| T11 | Store-Seite: kurz, «kostenlos für Gäste und Hallen», echte Wände in den Screenshots, DE/EN | 5 (Leonie, Grace, Claudio, Olga, Anja) | Kreative, Englischsprachige, Zweitsprache, Kaufleute | niedrig |
| T12 | Startzeit messbar machen | 2 (Raphael, Sami) | Azubis, MINT | niedrig |
| T13 | Fremde Halle per QR → App wechselt die Halle | 2 (Luca, Jana) | Profis, Trainer | niedrig (schon durch App-Links abgedeckt, AC ergänzen) |
| T14 | Gleicher Stand wie Webseite (Pin-Nummern, Farbnamen) | 1 (Tobias) | Lehrkräfte, Farbsehschwäche | niedrig (Release-Regel) |
| T15 | Ein-Tipp-Loggen | 1 (Birgit) | Gesundheit | – (anderes Feature) |

**Zitate**
- T1: «… an der fast jede Community-App beim ersten Mal scheitert: Inhalte von Nutzern.» (Felix) – «Wenn da Fremde ‹bin heute 17 Uhr da› posten, will ich wissen, dass man blockieren kann.» (Rolf)
- T2: «Wenn ihr das nicht einplant, wartet ihr ewig.» (Daniel) – «12 Tester? Die hab ich in einer Stunde.» (Andreas)
- T3: «Im Keller seh ich dann eine graue Fläche mit Pins.» (Sami)
- T9: «Wenn ich jetzt die App habe, hab ich zwei Symbole. Welches nehme ich?» (Erika)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | **Melden und Blockieren**: «Melden» an jedem Beta-Kommentar und Treff-Eintrag, «Person ausblenden» für eigene Ansicht; Meldungen landen beim Hallen-Admin (eigene Halle) und Plattform-Admin; gemeldeter Inhalt ist ab 3 Meldungen bis zur Prüfung ausgeblendet. **Eigene Spec SPEC-046, Voraussetzung für das Einreichen** | hoch | mittel | **1** | stärkt (Sicherheit), Pflicht |
| V2 | **Testphase** einplanen: Android geschlossener Test mit ≥ 12 Testern über ≥ 14 Tage, iPhone über TestFlight; Tester aus den Partnerhallen; Anleitungszettel mit QR-Code | hoch | klein | **1** | Voraussetzung |
| V3 | **Wandfotos der zuletzt geöffneten Halle** bleiben auf dem Gerät (höchstens 1 Halle, ca. 50 MB, wird beim Halle-Wechsel ersetzt) | mittel | mittel | 2 | stärkt (Boulder finden offline) |
| V4 | **Checkliste Hans** in Reihenfolge mit Wartezeiten; EU-Händlerstatus als Grundsatzfrage | mittel | klein | 2 | Voraussetzung |
| V5 | **Prüfer-Zugang**: Test-Konto `test-kletterer@bouldermate.ch` (SPEC-027) in einer Demo-Halle mit echten Wandfotos und ≥ 20 Bouldern | mittel | klein | 2 | Voraussetzung |
| V6 | Große Schrift: Layout bis **200 %** ohne abgeschnittene Texte prüfen; Scanner mit Vorlese-Text und Knopf «Code eintippen» | mittel | mittel | 2 | stärkt (Barrierefreiheit) |
| V7 | **Kein Tracking**: keine Analyse- oder Absturzdienste Dritter, keine Werbe-ID, nichts im Hintergrund | mittel | klein | 2 | stärkt (Vertrauen) |
| V8 | Startbild und Statusleiste **hell/dunkel nach System** | mittel | klein | 2 | neutral |
| V9 | Erster Start: einmal «Dein Konto von bouldermate.ch gilt auch hier»; Zeile «Auch als App» ergänzt «Hast du die App schon? Deine Daten sind dieselben.» | mittel | klein | 2 | stärkt |
| V10 | Kamera: Foto nach Neustart der App durch Android wiederherstellen | mittel | klein | 2 | stärkt (Schrauber) |
| V11 | Store-Text: 3 Sätze, «kostenlos für Gäste und Hallen», 4 Screenshots mit echten Wänden in großer Schrift, DE und EN | niedrig | klein | 3 | neutral |
| V12 | Startzeit-Ziel: Wand sichtbar < 2 s auf einem Mittelklasse-Handy | niedrig | klein | 3 | neutral |
| V13 | AC: QR-Code einer anderen Halle wechselt die Halle | niedrig | klein | 3 | stärkt |
| V14 | Release-Regel: App-Version entsteht aus demselben Commit wie die Webseite; Versionsnummer in den Einstellungen sichtbar | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v3)

- **Übernommen:** V2, V4, V5, V7–V9, V11–V14.
- **Angepasst:**
  - V1: **Eigene Spec SPEC-046 «Melden und Blockieren»**, eigener FeatureDefinition-Loop (sie betrifft auch die Webseite). SPEC-045 nennt sie als **Voraussetzung vor dem ersten Einreichen**. Die Zahlen (3 Meldungen) bleiben dort zu klären.
  - V3: übernommen, Grenze **eine Halle**, Speicher wird in den Einstellungen angezeigt («Wandfotos offline: 38 MB, löschen»).
  - V6: übernommen bis 200 %; «Code eintippen» als Ausweg, falls der Scanner nicht geht (z. B. kaputte Kamera).
  - V10: übernommen.
- **Verworfen:**
  - **Erkennen, ob die App installiert ist**, und Webseite automatisch umleiten (Leonie): technisch unzuverlässig; die Zeile «Auch als App» reicht.
  - **Ein-Tipp-Loggen** (Birgit): anderes Feature, gilt dann für Web und App.

## Grundsatzfragen an Hans

- **EU-Händlerstatus** bei Apple: Empfehlung **«kein Händler»**, solange die App kostenlos ist und keine Einnahmen bringt. Bitte selbst prüfen; bei «Händler» stehen Adresse und Telefon öffentlich im Store.
- **Konto als Person oder Firma** (aus Grill-me F7) bleibt offen; Empfehlung weiter «Person». Bei «Firma» entfällt bei Google die Testpflicht mit 12 Testern, dafür braucht es die D-U-N-S-Nummer.

## Nicht umsetzen

- Widgets, Apple Watch, Sperrbildschirm-Anzeigen: überladen, kein Bezug zum Hauptzweck in v1.
- Hintergrund-Abgleich: kostet Akku, die Warteschlange (SPEC-032) sendet beim nächsten Öffnen.
