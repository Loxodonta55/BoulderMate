# Auswertung und Vorschläge: Gesamttest der App mit 210 simulierten Personen

> **Simuliert**, kein echtes Nutzerfeedback. Ablauf nach [feedback-einholen.md](../../prozesse/feedback-einholen.md), auf 210 Personen hochskaliert (30 Admins, 60 Schrauber, 120 Kletterer), Auftrag von Hans am 2026-10-30.
> **Grundlage:** Stand `62839c5` (Branch `feat/ux-overhaul-v2`), als eingefrorene Kopie getestet. Alles, was die Runde bewertet, war im echten Testlauf auf Bildschirmfotos zu sehen (Desktop hell Deutsch, iPhone 15 dunkel Englisch, iPhone SE hell Deutsch). Die technischen Befunde stehen in [0-testlauf-befunde.md](0-testlauf-befunde.md).
> **Keine echten Konten:** Die 210 Personen sind nicht in Supabase angelegt. Es gibt nur die Produktionsdatenbank, und 210 Konten mit Begehungen und Bewertungen hätten die echten Hallenzahlen verfälscht. Die Personen haben die App über die lokalen Testprofile (Hans, Schrauber 6aPlus, Boris) und als Gast durchlaufen.

## Kennzahlen der Runde

| | Admins | Schrauber | Kletterer | Gesamt |
|---|---|---|---|---|
| Personen | 30 | 60 | 120 | 210 |
| Durchschnittsnote (1–5) | 3,1 | 2,8 | 3,3 | 3,2 |
| Alter | 22–68 | 19–65 | 18–70 | 18–70 |

33 Personen nutzten die App auf Englisch, 72 im Dunkelmodus, 47 auf einem kleinen Gerät (iPhone SE, iPhone 13 mini, Admins «nur Handy»). Gemischt wurden 24 Populationen bei den Kletterern (u. a. Pflege im Schichtdienst, Handwerk, Eltern, Rentner, Landwirtschaft, Touristen, Lernende), 9 bei den Schraubern und 8 bei den Admins.

Die Schrauber geben die schlechteste Note. Das liegt vor allem an einem Fehler: Der Knopf «Speichern & Veröffentlichen» ist auf Handys halb abgeschnitten. In der Simulation haben ihn vor allem die iPhone-SE-Leute bemerkt; nachgemessen ist er auch auf dem iPhone 15 abgeschnitten.

## Themen nach Schweregrad

### Hoch

| Thema | Nennungen | Populationen | Problem | Zitat |
|---|---|---|---|---|
| **«Speichern & Veröffentlichen» im Studio auf jedem Handy abgeschnitten** | 11 Schrauber mit iPhone SE, dazu Chefschrauber am Samsung, Plenum | 5 | Die untere Leiste «neu · geändert · archiviert» schiebt den Knopf über den rechten Rand: nachgemessen bei 320, 375 und 390 px Breite (iPhone SE bis iPhone 15) liegt er bei x = 294 bis 443. Schrauber halten das für «kein Speichern» und riskieren Datenverlust. | «Wenn Speichern nicht sichtbar ist, verliere ich nach einer Stunde Arbeit alles.» (Werner, 40) |
| **«Ansehen als …» verdeckt Knöpfe im Arbeitsbereich-Fenster** | 6 Admins (nur Handy), Plenum | 4 | Der schwebende Knopf «Ansehen als …» liegt über dem Fenster «Arbeitsbereich wählen»: bei 320 px auf der Karte «Hallen-Administration» (Pfeile ragen über den Rand), bei 375 px auf «Abbrechen & Zurück». Sichtbar nur für Plattform-Admins, trotzdem Fehlklicks. | «Ich hab zweimal auf ‹Ansehen als› getippt statt auf Admin.» (Corinne, 7) |

### Mittel

| Thema | Nennungen | Populationen | Problem | Zitat |
|---|---|---|---|---|
| Kleine Tippflächen (Lupe, Vollbild, Logo 28 px; Sektor-Chips 28–30 px; Studio-Kopf 22–26 px; Karten-Zoom 30 px) | 38 Kletterer, 18 Schrauber | 26 | Unter der eigenen 44-px-Regel aus SPEC-020. Mit Kreide, Handschuhen oder Lesebrille Fehlgriffe. | «Mit Kreide treffe ich die nicht.» (Werner, 204) |
| Englisch nur halb: Hallenwahl, Arbeitsbereich, Treff-Einstellungen deutsch | 13 Kletterer, 11 Schrauber, 4 Admins | 12 | Die erste Ansicht für Gäste («Halle wählen», «In meiner Nähe», «Zur Wand») ist deutsch, der Tab heißt «Meet», die Einstellungen darunter «Treff ausblenden». Studio und Admin sind laut SPEC-039 bewusst noch deutsch. | «That's where I decide whether I keep the app.» (Mei, 105) |
| Zahlen ohne Zeitraum | 5 Admins, Plenum | 4 | «7 Begehungen» und «0 Kletterer (30 Tage)» nebeneinander wirken widersprüchlich. | «Ich würde das so in den Monatsbericht schreiben und mich blamieren.» (Mei, 9) |
| Schrauber-Auswertung als heimliche Rangliste | 6 Admins, 21 Schrauber (bei «Meine Routen») | 9 | Vereine mit Freiwilligen fürchten Druck. Wunsch: eigene Zahlen zuerst, als Gesprächsgrundlage, nicht als Rangliste. | «Wenn da eine Rangliste steht, schraubt nächstes Jahr keiner mehr.» (Sofia, 2) |
| Empfehlungs-Dankeschön (30 %) unklar | 9 Admins, 9 Kletterer | 12 | Wer zahlt, wer bekommt es? Klingt nach Provision. Passt zu SPEC-053 «Betrag offen». | «Ich will das vor dem Start schriftlich.» (Kenji, 23) |
| Erklärkarte beim ersten Loggen schiebt Knöpfe nach unten | 14 Kletterer | 12 | Auf kleinen Handys müssen Flash/Top/Projekt erst gesucht werden. Anfänger lieben die Karte, Geübte nicht. | «Auf meinem kleinen Handy musste ich scrollen.» (Tamara, 144) |

### Niedrig

| Thema | Nennungen | Populationen | Problem |
|---|---|---|---|
| «Batch-Schraubermodus» als Begriff | 20 Schrauber | 5 | Doppelte Überschrift, Fachjargon. |
| Lange Namen abgeschnitten (Hallenname, Spitzname) | 18 Kletterer, 1 Admin | 11 | Wunsch nach Kurzname pro Halle. |
| Weiß und Pin-Nummern schlecht sichtbar | 15 Kletterer | 11 | Rand von Weiß im hellen Modus blass, Pin-Nummern für 55+ grenzwertig. |
| Ich ohne Verlauf | 22 Kletterer | 16 | Mehrheit will nur drei Zahlen, eine Minderheit einen Wochenverlauf. Ob die Statistik aus SPEC-037 das schon abdeckt und nur nicht gefunden wurde, ist zu prüfen. |
| KI-Erfassung: Belichtung und Kosten | 16 Schrauber, 9 Admins | 9 | Fotos unter Strahlern überbelichtet; wer zahlt die KI? Einschalten erst nach Test. |
| Feedback-Knopf am Desktop dominant | 1 Kletterer | 1 | Schwarzer Knopf ist das Auffälligste der Kopfzeile. |
| Benachrichtigung bei Meldungen | 6 Admins | 5 | Mail an die Hallenleitung, wenn etwas gemeldet wird. |

### Was ausdrücklich gelobt wurde

- **2-Tap-Logging mit Rückgängig** (16 Kletterer, 12 Populationen). Das ist der Grund, warum Leute bleiben.
- **Umbau ankündigen und «Wand neu schrauben»** (11 Schrauber, alle positiv).
- **QR-Aufkleber pro Sektor**, Treff pro Halle abschaltbar, Auslastung mit 90 Minuten (Admins).
- **Gast-Modus**: Wand ohne Konto ansehen, Anmeldung erst beim Loggen.
- **Ruhiges Design**, Dunkelmodus automatisch, Hallenfarben als einzige Farbe.
- **Challenge heute** mit Begründung und «?» (Lucía: «hat mich an eine 6a+ gebracht, die ich nie probiert hätte»).
- **Melden, Ausblenden, «Fair bleiben»** als ein Satz.

## Vorschläge, priorisiert

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck oder Überladung |
|---|---|---|---|---|---|
| 1 | Studio-Leiste unten auf Handybreite umbrechen: Zähler in eine Zeile, «Speichern & Veröffentlichen» als volle Breite darunter | hoch | klein | **sofort** | stärkt den Hauptzweck (Routen kommen an die Wand) |
| 2 | «Ansehen als …» im Arbeitsbereich-Fenster ausblenden oder in den Kopf verschieben; Karten-Pfeile in die Karte | hoch | klein | **sofort** | stärkt |
| 3 | Tippflächen auf 44 px: Lupe/Vollbild im Wandfoto, Logo, Sektor-Chips, Studio-Kopf, Karten-Zoom | hoch | klein bis mittel | hoch | stärkt |
| 4 | Hallenwahl-Sheet, Arbeitsbereich-Fenster und Treff-Einstellungen über `t()` übersetzen (Studio/Admin bleiben wie in SPEC-039 entschieden deutsch) | mittel | klein | hoch | stärkt (Gäste) |
| 5 | Jede Zahlen-Kachel nennt ihren Zeitraum («Begehungen gesamt», «Kletterer 30 Tage») | mittel | klein | mittel | stärkt |
| 6 | Erklärkarte beim ersten Loggen unter die drei Knöpfe statt darüber | mittel | klein | mittel | stärkt |
| 7 | Schrauber-Auswertung: Hinweis «für das Gespräch, keine Rangliste», keine Sortierung nach Sternen als Standard | mittel | klein | mittel | neutral |
| 8 | Empfehlungs-Dankeschön erst live, wenn Betrag und Zahler feststehen (SPEC-053 offen) | mittel | Entscheid | mittel | würde ohne Klärung schaden |
| 9 | «Batch-Schraubermodus» streichen | niedrig | sehr klein | niedrig | stärkt |
| 10 | Weiß mit kräftigerem Rand, Pin-Nummern etwas größer | niedrig | klein | niedrig | stärkt |
| 11 | Kurzname pro Halle (Admin, Feld «Kurzname») | niedrig | mittel | niedrig | neutral |

## Nicht umsetzen

- **Nichts am 2-Tap-Logging ändern**, auch keine zusätzliche Frage vor dem Speichern. Das ist das am meisten gelobte Element.
- **Kein vollständig englisches Studio und Admin jetzt.** Die Schrauber selbst sagen: zuerst die Kletterer. SPEC-039 hat das bewusst so entschieden.
- **Keine Rangliste der Schrauber**, auch nicht «für Admins only». Das Vertrauen der Freiwilligen ist wichtiger.
- **Kein Wochenverlauf direkt in «Ich»**, die drei Zahlen bleiben. Falls die Statistik (SPEC-037) den Verlauf schon hat, lieber den Weg dorthin sichtbarer machen.
- **Keine Push-Mitteilungen für die Challenge.** Schon der Streifen an der Wand ist manchen zu viel.
