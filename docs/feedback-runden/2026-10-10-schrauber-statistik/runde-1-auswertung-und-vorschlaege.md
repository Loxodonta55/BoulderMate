# Runde 1 – Auswertung und Vorschläge (SPEC-044 v1 → v2)

> Simuliert. Grundlage: [runde-1-unterhaltung.md](runde-1-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Hallenvergleich unfair für schwere Farben («kaum geklettert» trifft Schwarz immer) | 6 (Ralf, Daniel, Yuki, Tim, Sven, Gisela) | Hallenpersonal, MINT | **hoch** |
| T2 | Versuche sind laut SPEC-035 privat; bei wenigen Tops erkennbar | 4 (Ulrike, Hakan, Tim, Oliver) | Ältere/Schicht, MINT, Kaufleute | **hoch** (Datenschutz) |
| T3 | Nur Kritik, kein Lob – Neue verlieren die Lust | 5 (Aylin, Petra, Nina, Jonas, Lea) | Hallenpersonal, Lehrkräfte, Trainer | mittel |
| T4 | Zahl ohne Handlung – «und jetzt?» | 4 (Mehmet, Thomas, Jonas, Daniel) | Handwerk, Hallenpersonal | mittel |
| T5 | Leere Ansicht am Anfang | 3 (Sophie, Lea, Ines) | Anfänger, Eltern | mittel |
| T6 | Farbe allein / Balken ohne Wort unlesbar | 4 (Karl, Lukas, Clara, Bernd) | Ältere, Einschränkungen, Handwerk | mittel (Barriere) |
| T7 | Begriffe («Grad-Gefühl», «Begehungen» mit/ohne Projekt) | 3 (Ahmed, Oliver, Tim) | Pflege/Zweitsprache, Kaufleute | niedrig |
| T8 | Englisch für Gast-Schrauber | 2 (Pedro, Chloe) | Englischsprachige | niedrig |
| T9 | Wunsch Rangliste / Push / Schrauber folgen | 3 (Felix, Gisela, Felix) | Azubis, Betreiber | – (widerspricht Zweck) |

**Zitate**
- T1: «Acht Leute pro Woche probieren eine 7c. Das ist kein Problem der Route.» (Daniel) – «Wenn meine Schrauber sagen ‹das ist unfair›, benutzt es keiner.» (Sven)
- T2: «… dann weiß der Schrauber, dass ich 14 Versuche gebraucht habe.» (Hakan)
- T3: «Nur Fehler aufzählen motiviert niemanden.» (Petra)
- T4: «Sonst sieht man die Zahl, sagt ‹aha› und vergisst es.» (Thomas)
- T6: «Rot und Grün sind für mich gleich.» (Lukas)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Hallenvergleich **farbgewichtet**; «Kaum geklettert» gegen den Schnitt **derselben Farbe** (< ⅓) | hoch | klein | **1** | stärkt (fairer Vergleich) |
| V2 | Versuche nur als **Median ab 3 Tops**; Folgeänderung SPEC-035 F4 + Datenschutzseite | hoch | klein | **1** | stärkt (Vertrauen) |
| V3 | Mindestens **ein positiver Hinweis** («Lieblingsroute») | mittel | klein | 2 | stärkt |
| V4 | Knopf **«Im Studio öffnen»** in der Route | mittel | klein | 2 | stärkt (Handlung) |
| V5 | «noch n Bewertungen» statt Strich; **leere Zustände** mit Satz | mittel | klein | 2 | stärkt |
| V6 | **Farbname neben jedem Farbpunkt**; Grad-Gefühl als **Wort + Zahl** | mittel | klein | 2 | stärkt (Barrierefreiheit) |
| V7 | Kachel-Untertitel «Flash + Top»; Grad-Gefühl im Sheet als «leicht · passt · hart» | niedrig | klein | 3 | neutral |
| V8 | Englische Texte für das Studio | niedrig | mittel | später | überlädt diese Spec |

## Entscheidung (eingearbeitet in v2)

- **Übernommen:** V1, V2, V3, V4, V5, V6, V7.
- **Angepasst:** keine.
- **Verworfen:**
  - **Rangliste unter Schraubern** (Felix): widerspricht Grill-me F3, erzeugt Druck im Team (Mara, Ralf, Sven).
  - **Push bei neuem Kommentar** (Gisela): Grill-me F9; Schrauber wollen selbst entscheiden (Ralf).
  - **Kletterer folgen Schraubern** (Felix): anderes Feature, nicht Zweck dieser Spec.
  - **Englisch jetzt** (Pedro): Studio ist insgesamt nicht übersetzt; kommt mit dem Studio (§11).

## Nicht umsetzen

- Automatisches Umstufen des Grades aus dem Grad-Gefühl (Daniel): Entscheidung bleibt beim Menschen.
- Kommentar-Moderation in dieser Spec: Kommentare sind schon öffentlich; neu ist nur die gesammelte, namenlose Sicht.
