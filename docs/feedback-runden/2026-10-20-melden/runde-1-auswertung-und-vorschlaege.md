# Runde 1 – Auswertung und Vorschläge (SPEC-046 v1 → v2)

> Simuliert. Grundlage: [runde-1-unterhaltung.md](runde-1-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Ausgeblendete Person merkt es am Wort «Ausgeblendet» in der Rangliste | 5 (Nadine, Svetlana, Tobias, Ole, Lukas) | Soziales, Pflege/Schicht, IT, Profis, Anfänger | **hoch** (Sicherheit) |
| T2 | Ein Admin allein schafft keine Reaktion in 24 Stunden; Urlaub | 4 (Pascal, Dirk, Uwe, Tobias) | Moderation, Hallenbetrieb, Polizei | **hoch** (Store-Pflicht, Schutz) |
| T3 | Melden als Waffe (Cliquen, Massenmeldungen) | 3 (Pascal, Hans-Peter, Mira) | Moderation, Ältere, Kreative | mittel |
| T4 | Betroffene erfahren nichts und können nicht widersprechen | 3 (Marlon, Ruth, Mira) | Studierende, Juristin, Kreative | mittel |
| T5 | Wortliste blockt echte Namen (Teilwörter); strafbare Codes fehlen | 6 (Hakan, Kai, Chloe, Tobias, Uwe, Murat) | Zweitsprache, Azubis, Englisch, IT, Polizei, Handwerk | mittel |
| T6 | Wer sieht die Meldung? Meldende bleibt geheim? Trainer melden | 3 (Leonie, Lukas, Pascal) | Jugend, Anfänger | **hoch** (Barriere für Jugendliche) |
| T7 | Trainer-Gruppe: ausblenden innerhalb der Gruppe unklar | 2 (Frank, Nadine) | Trainer, Soziales | mittel |
| T8 | Löschfrist der Meldungen, Datenschutzseite | 2 (Andreas, Ruth) | Datenschutz, Recht | mittel |
| T9 | Knöpfe ganz unten im langen Profilfenster werden übersehen | 2 (Gisela, Henrik) | Ältere, Farbsehschwäche | mittel |
| T10 | Wörter: «Melden» klingt nach Polizei, «Belästigung» schwer | 3 (Sevgi, Fatma, Amélie) | Erziehung, Zweitsprache, Touristen | niedrig |
| T11 | Bei Belästigung gleich ausblenden; bei Bedrohung Notruf-Hinweis | 3 (Nadine, Svetlana, Uwe) | Soziales, Pflege, Polizei | mittel |
| T12 | Was sieht ein Gesperrter? Zählen seine Tops weiter? | 3 (Marlon, Tobias, Ole) | Studierende, IT, Profis | niedrig |
| T13 | Hallen-Admin will von Sperren wissen | 2 (Dirk dafür, Ruth dagegen) | Hallenbetrieb, Recht | – (Grundsatz, G5 bleibt) |
| T14 | Schraubernamen melden? | 1 (Beatrice) | Hallenpersonal | niedrig (abgrenzen) |
| T15 | Profilbilder nur für Angemeldete; Kinderfotos | 2 (Ilse, Johanna) | Ältere, Eltern | niedrig |
| T16 | Thekenpersonal braucht einen Hilfe-Satz für Gäste | 1 (Jonas) | Hallenpersonal | niedrig |
| T17 | Zittern: kein versehentliches Melden | 1 (Rainer) | Einschränkung | niedrig (Grund-Schritt reicht) |

**Zitate**
- T1: «Der Ausgeblendete sieht dann bei Platz 4 ‹Ausgeblendet›, wo vorher Svetlana stand. Er weiß es sofort.» (Nadine)
- T2: «Was ist, wenn Hans zwei Wochen im Urlaub ist und einer hat ein Nacktbild als Profilbild?» (Dirk)
- T5: «Ich hab mal in einem Spiel nicht ‹Hakan› heißen dürfen.» (Hakan)
- T6: «Ich würde mich nicht trauen, wenn ich nicht weiß, wer das sieht.» (Lukas)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Ausgeblendete erscheinen **genau wie anonyme Personen** (SPEC-033): gleicher Text «Jemand» (`ANONYMOUS_NAME`), gleiches Platzhalter-Bild, nicht antippbar. Kein eigenes Wort «Ausgeblendet». | hoch | klein | **1** | neutral (Schutz) |
| V2 | **Vorläufig verstecken**: Bild oder Name wird automatisch durch den Platzhalter ersetzt, sobald **3 verschiedene Konten** dasselbe melden; Admin stellt wieder her oder bestätigt. | hoch | mittel | **1** | neutral |
| V3 | **Betroffene bekommen Bescheid** (Hinweis in «Ich»: «Dein Profilbild ist vorläufig versteckt, weil es gemeldet wurde. Wir prüfen das.») mit Knopf «Das ist ein Fehler» (schreibt eine Notiz an die Meldung). | mittel | klein | 2 | neutral |
| V4 | Melde-Grenze: **5 Meldungen pro Person und Tag**; Admin sieht pro Meldung, wie oft die Person schon gemeldet hat und gemeldet wurde. | mittel | klein | 2 | neutral |
| V5 | Wortliste: **ganze Wörter**, Ziffern-Tricks normalisieren (4→a, 3→e, 0→o, 1→i), kurze Liste DE/EN, plus strafbare Codes als **eigenständige Wörter** («88» nur allein, nicht in «Klettermax1988»); bei Ablehnung Satz «Ist das dein echter Name? Schreib uns: [Kontakt-E-Mail]». Testfälle: Hakan, Dick, Dickfinger, Klettermax1988 gehen durch. | mittel | klein | **1** | neutral |
| V6 | Im Melde-Sheet fester Satz: **«Deine Meldung sieht nur das BoulderMate-Team. Nicht die Halle, nicht der Trainer, nicht die gemeldete Person.»** | hoch | klein | **1** | stärkt Vertrauen |
| V7 | Trainer-Gruppe: dort **kein Ausblenden**, stattdessen «Gruppe verlassen» und «Melden»; Trainer können gemeldet werden wie alle. | mittel | klein | 2 | neutral |
| V8 | **Löschfrist**: erledigte Meldungen nach **6 Monaten** löschen; Konto der meldenden Person gelöscht → `reporter_id` leer. Abschnitt in der Datenschutzseite. | mittel | klein | 2 | Pflicht |
| V9 | Melden/Ausblenden **oben im Profilfenster** neben dem Namen (Symbol + Wort, 48 px), nicht am Ende. | mittel | klein | 2 | neutral |
| V10 | Texte: Knopf **«Melden»** bleibt (bekannt, kurz; EN «Report»), Gründe in einfacher Sprache: **«Name ist beleidigend · Bild ist anstößig · Belästigt mich · Etwas anderes»**. | niedrig | klein | 3 | neutral |
| V11 | Grund «Belästigt mich» → Häkchen **«Person auch ausblenden»** (vorausgewählt). Fester Satz unten: «Bei Bedrohung: Polizei 110 (DE) · 117 (CH)». | mittel | klein | 2 | Schutz |
| V12 | Gesperrte sehen in «Ich»: «Dein Profil ist nicht öffentlich sichtbar. Fragen: [Kontakt-E-Mail]». Ihre Tops zählen für sie weiter, öffentlich erscheinen sie als «Jemand». | niedrig | klein | 3 | neutral |
| V13 | Hilfe-Eintrag «Jemand stört dich?» (3 Sätze), den die Theke zeigen kann. | niedrig | klein | 3 | neutral |
| V14 | Abgrenzung: Schraubernamen vergibt die Halle, nicht Teil dieser Spec; Beschwerden über Schrauber an die Halle. | niedrig | – | 3 | – |

## Was nicht umgesetzt werden sollte

- **Hallen-Admin über Sperren informieren** (T13): Eine App-Sperre ist kein Hausverbot, und die Halle bekäme Daten, die sie nicht braucht. Bleibt bei G5. Wenn etwas in der Halle passiert, ist das Sache der Halle vor Ort.
- **Profilbilder nur für Angemeldete** (T15): eigene Frage zur Sichtbarkeit (SPEC-033), nicht hier. Als Idee notieren.
- **Hinweis zu Kinderfotos beim Hochladen** (T15): eigenes Thema, nicht Melden.
- **Zweiter Bestätigungsschritt beim Melden** (T17): Der Grund-Schritt reicht als Bremse; mehr Schritte schrecken Betroffene ab.
- **KI-Bildprüfung**: Kosten, Datenschutz, Fehlalarme; erst wenn die Meldungen es zeigen.
