# Runde 1 – Auswertung und Vorschläge (SPEC-050 v1 → v2)

> Simuliert. Grundlage: [runde-1-unterhaltung.md](runde-1-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Sortierung nach absoluten Sternen ist eine verdeckte Rangliste und unfair für schwere Farben | 5 (Ralf, Aylin, Tim, Daniel, Yuki) | Hallenpersonal, MINT | **hoch** |
| T2 | Kleine Stichproben: Werte bei wenigen Bewertungen sind Zufall und stempeln Neue ab | 4 (Aylin, Yuki, Oliver, Tim) | Hallenpersonal, MINT, Kaufleute | **hoch** |
| T3 | Schrauber müssen wissen, dass die Leitung ihre Werte sieht (Arbeitsrecht, Vertrauen) | 3 (Mara, Marco, Ralf) | Hallenpersonal, Personalwesen | **hoch** (Grundsatz Datenschutz) |
| T4 | «Grad-Gefühl» / «passt» unklar; Prozente bei wenigen Stimmen irreführend | 3 (Ahmed, Oliver, Sven) | Zweitsprache, Kaufleute, Betreiber | mittel |
| T5 | Wichtigster Nutzen: pro Farbe sehen, wo ein Schrauber zu hart/zu leicht liegt | 3 (Thomas, Ralf, Nina) | Hallenpersonal, Trainer | mittel |
| T6 | Positives zuerst: Lieblingsroute pro Schrauber | 2 (Jonas, Petra) | Hallenpersonal, Ältere | mittel |
| T7 | Farbe allein, Lesbarkeit, großer Zurück-Knopf | 5 (Karl, Lukas, Mehmet, Bernd, Clara) | Ältere, Einschränkungen, Handwerk | mittel (Barriere) |
| T8 | «Unbekannt» ohne Erklärung | 1 (Ewa) | kleine Halle | niedrig |
| T9 | Export / Ausdruck fürs Teamtreffen | 2 (Gisela, Ewa) | Betreiber | niedrig |
| T10 | Bestenliste mit Pokal | 1 (Felix) | Azubi | – (widerspricht Zweck) |
| T11 | Englisch | 2 (Pedro, Chloe) | Englischsprachige | niedrig (keine Admins) |

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Sortierung «Sterne» nach **Abstand zum farbgewichteten Hallenschnitt** («+0,3 über Halle»), Anzeige des Abstands statt nur des absoluten Werts | hoch | klein | **1** | stärkt (fair) |
| V2 | **Mindestzahl**: Sterne erst ab 3 Bewertungen, Grad-Gefühl ab 3 Stimmen, Flash-Quote ab 5 Begehungen; sonst «noch zu wenige Bewertungen». Schrauber ohne genug Daten stehen bei jeder Sortierung (außer Name/Routen) **unten**, ohne Zahl | hoch | klein | **1** | stärkt |
| V3 | **Transparenz**: Hinweis in der Admin-Ansicht «Die Zahlen sind ein Gesprächsanlass, keine Note. Deine Schrauber sehen ihre eigenen Zahlen unter ‹Meine Routen›.» + Folgeänderung SPEC-044 Transparenz-Zeile | hoch | klein | **1** | stärkt (Vertrauen) |
| V4 | Begriffe «zu leicht · passt · zu hart», immer **«n von m»** statt nur Prozent | mittel | klein | 2 | neutral |
| V5 | Detailseite beginnt mit **«Pro Farbe»**: Routen, Ø Sterne gegen Halle dieser Farbe, Grad-Gefühl mit Wort + Zahl, Tendenz «wirkt eher hart» ab 60 % | mittel | klein | 2 | stärkt |
| V6 | **Lieblingsroute** des Schraubers (beste Route ab 3 Bewertungen) ganz oben auf der Detailseite | mittel | klein | 2 | stärkt |
| V7 | Farbname neben jedem Farbpunkt; Zurück-Knopf «Zurück zur Übersicht» ≥ 48 px; Sortier-Knöpfe ≥ 48 px | mittel | klein | 2 | stärkt (Barrierefreiheit) |
| V8 | «Unbekannt» mit Satz «Routen ohne Schrauber. Im Studio unter ‹Geschraubt von› nachtragen.» | niedrig | klein | 3 | neutral |
| V9 | Export / Druck | niedrig | mittel | später | Datenschutz, überlädt |

## Entscheidung (eingearbeitet in v2)

- **Übernommen:** V1, V2, V3, V4, V5, V6, V7, V8.
- **Angepasst:** V2 – Flash-Quote ab 5 Begehungen (Flash ist pro Begehung ein Ja/Nein, bei 3 zu sprunghaft).
- **Verworfen:** V9 Export (SPEC-030 F11; Ralf/Marco: landet in der Personalakte; Ansicht auf dem Tablet reicht). T10 Pokal (widerspricht dem Zweck «Gesprächsanlass»). T11 Englisch (Admin-Konsole ist noch nicht übersetzt, eigene Spec).

**Grundsatzfrage an Hans (mit Empfehlung, Hans geht mit der Empfehlung):** Dürfen Admins die Werte einzelner Schrauber sehen? *Empfehlung: Ja*, weil Hans es ausdrücklich wünscht, mit Transparenz (V3), Mindestzahlen (V2) und ohne Export.
