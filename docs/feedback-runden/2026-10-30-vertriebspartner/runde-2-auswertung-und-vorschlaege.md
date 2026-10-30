# Runde 2 – Auswertung und Vorschläge (SPEC-054 v2 → v3)

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|---|---|---|---|
| T1 | Datenschutz: Kanal-Link unnötig, Datenschutzerklärung fehlt, Zweck/Aufbewahrung | 3 (Beatrice, Felix, Kevin) | Datenschutz, Influencer, Trainer | **hoch** |
| T2 | Missbrauch der Betreuung (5 × «Im Gespräch» = 120 Tage Blockade) → Admin muss beenden können | 3 (Max, Martina, Leonie) | IT, Trainer, UX | **hoch** (Fairness) |
| T3 | Einwände ergänzen: Aufwand fürs Schrauber-Team, andere App, Daten der Halle; je max. 2 Sätze | 3 (Andrea, Samuel, Patrick) | Betreiber, Schrauber, Vertrieb | mittel |
| T4 | Eigene Zahlen im «Ich»: Satz, Offen, Ausgezahlt | 3 (Peter, Arjun, Jana) | Bank, Data Science, Forschung | mittel |
| T5 | Allgemeiner Link wird von Kletterern geöffnet → Knopf «Ich klettere – Halle suchen» | 2 (Felix, Patrick) | Influencer, Vertrieb | mittel |
| T6 | Erster Schritt nach «Partner werden» unklar → leerer Zustand mit Schritt 1 | 2 (Hakan, Leonie) | Kleingewerbe, UX | mittel |
| T7 | DE-Partner: Gewerbeanmeldung bei Regelmässigkeit, Gutschrift-Angaben | 1 (Ursula) | Steuerberatung DE | mittel (→ Hans) |
| T8 | Kurze Nachricht lockerer, E-Mail förmlich; «an die Hallenleitung» | 2 (Lara, Sina) | Kommunikation, Theke | niedrig |
| T9 | Ganze Zeile antippbar, VoiceOver liest Status/Betrag | 3 (Vreni, Oskar, Carla) | Ältere, Blinde/Sehschwäche, Farbsehschwäche | niedrig (Barriere vermeiden) |
| T10 | Gemeinden: Partner stellt nur Kontakt her | 1 (Reto) | Gemeinde | niedrig |
| T11 | Seite «Partner werden» verlinkbar, aber ohne Code/Belohnung | 1 (Kevin) | Trainer | niedrig |

Zitate: «Kanal-Link ist schon heikel – wofür braucht Hans den?» (Beatrice) · «Das ist ein Blockier-Hack.» (Max) · «Wieder ein Tool mehr.» (Samuel über sein Team)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Prio | Hauptzweck / Überladung | Entscheidung |
|---|---|---|---|---|---|---|
| V1 | **Kanal-Link streichen**; Angaben nur Rolle, Region, optional Anzeigename; Satz «Sieht nur das BoulderMate-Team. Zweck: Provision abrechnen.» | hoch | klein | 1 | entlastet | **übernommen** |
| V2 | Abschnitt Partnerprogramm in `datenschutz.html` als **Hans-Aufgabe** (Text-Entwurf in der Spec), Gutschriften 10 Jahre (Buchhaltung) | hoch | klein | 1 | neutral | **angepasst**: Entwurf in Spec §9, Einbau nach rechtlicher Prüfung durch Hans |
| V3 | Admin kann **Betreuung beenden** (Status zurück, Halle frei); Bedingungen: Missbrauch → Ausschluss | hoch | klein | 1 | neutral | **übernommen** |
| V4 | Einwände: 6 → 7 (Aufwand Schrauber, andere App, Daten der Halle, Preis, Zeit, Kletterer wollen das nicht, Gemeinde/Verein), je ≤ 2 Sätze | mittel | klein | 2 | neutral | **übernommen** |
| V5 | Zahlenleiste im Partner-Bereich: «Dein Satz», «Offen», «Ausgezahlt» | mittel | klein | 2 | neutral | **übernommen** |
| V6 | Seite «Für Hallen» bekommt Zweitknopf «Ich klettere – Halle suchen» (öffnet Hallen-Karte) | mittel | klein | 2 | stärkt Hauptzweck (neue Nutzer) | **übernommen** |
| V7 | Leerer Zustand: «Schritt 1: Halle auf der Karte suchen und übernehmen.» + Knopf | mittel | klein | 2 | neutral | **übernommen** |
| V8 | Kurze Nachricht locker («Hoi …»), E-Mail «Liebe Hallenleitung»; Leitfaden Punkt 1 «nach der Hallenleitung fragen» | niedrig | klein | 3 | neutral | **übernommen** |
| V9 | Einwände als `<details>` mit ganzer Zeile ≥ 48 px; Status/Beträge als Text (VoiceOver) | niedrig | klein | 3 | neutral | **übernommen** |
| V10 | Einwand «Gemeinde/Verein»: «Ich stelle nur den Kontakt her, die Offerte kommt von BoulderMate.» | niedrig | klein | 3 | neutral | **übernommen** (in V4) |
| V11 | Verlängern erst in den letzten 14 Tagen | niedrig | mittel | – | zu kompliziert | **verworfen** (Leonie: nicht erklärbar; V3 löst Missbrauch) |
| V12 | Hinweis Gewerbeanmeldung DE in den Bedingungen | mittel | klein | 2 | neutral | **übernommen** (Hinweis, keine Beratung) |

## Nicht umsetzen

- Kanal-Link, Follower-Zahlen oder Social-Profile speichern (Datensparsamkeit).
- Komplizierte Fristenlogik für Verlängerungen.
- Code in der Seite «Partner werden» (wäre Partner-werben-Partner).
