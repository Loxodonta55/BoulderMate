# Runde 1 – Auswertung und Vorschläge (SPEC-048 v1 → v2)

> Simuliert. Grundlage: [runde-1-unterhaltung.md](runde-1-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Punkte nach Schwierigkeit: Anfänger und Ältere sind chancenlos, oben stehen immer dieselben | 7 (Lea, Hannelore, Petra, Sophie, Yuki, Nina, Tim) | Anfänger, Ältere, Trainer, MINT | **hoch** |
| T2 | Schummeln: jeder kann alles abhaken; Streit an der Theke | 5 (Ralf, Sven, Thomas, Tim, Felix) | Hallenpersonal, MINT, Azubis | **hoch** |
| T3 | Kinder und Datenschutz: echter Name? Profil-Link? Uhrzeiten verraten Anwesenheit | 4 (Ulrike, Markus, Nina, Yuki) | Ärzte, Eltern, Trainer | **hoch** (Datenschutz) |
| T4 | Punkte unverständlich, «neu» unklar | 5 (Ahmed, Karl, Oliver, Tim, Lukas) | Zweitsprache, Ältere, Kaufleute | mittel |
| T5 | Schrauber kennen ihre eigenen Routen | 2 (Mara, Aylin) | Hallenpersonal | mittel |
| T6 | Monat lang, kurzer Ansporn fehlt | 3 (Jonas, Felix, Lena) | Studierende, Azubis, Schicht | mittel |
| T7 | Nicht-Teilnehmer fühlen sich durch die Karte bedrängt; Ton bei hinteren Plätzen | 2 (Sophie, Petra) | Anfänger, Lehrkräfte | mittel |
| T8 | Farbe nur mit Namen, Lesbarkeit in zwei Sekunden | 3 (Lukas, Karl, Mehmet) | Einschränkungen, Ältere, Handwerk | niedrig |
| T9 | Wünsche: Frauen-Liste, Gutschein, hallenübergreifend, Push «überholt» | 5 (Marie, Gisela, Pedro, Felix, Felix) | Kreative, Betreiber, Englischsprachige, Azubis | – |

**Zitate**
- T1: «Ich wäre immer Letzte. Das brauche ich in meinem Alter nicht mehr.» (Hannelore) – «Das ist keine Rangliste ‹wer war der Beste›, sondern ‹wer ist ohnehin stark›.» (Yuki)
- T2: «Ich brauche einen Knopf, mit dem ich jemanden rausnehmen kann. Ohne Diskussion in der App.» (Sven)
- T3: «Wenn die Liste zeigt ‹heute 19:30 drei Tops›, weiß jeder, wann ich in der Halle bin.» (Ulrike)
- T5: «Wenn ich meine eigenen Boulder flashe, ist das kein echter Flash.» (Mara)
- T7: «Lieber ‹Du hast diesen Monat 4 neue Boulder geschafft›.» (Petra)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | **Ligen nach Niveau**: Farbstufen der Halle in bis zu 3 Gruppen; Einteilung automatisch aus den letzten 8 Wochen; nach oben freiwillig, nach unten nie | hoch | mittel | **1** | stärkt («bester Kletterer» wird fair) |
| V2 | **Tagesgrenze 25** gewertete Boulder (die schwersten zählen); Hallen-Admin kann eine Person für den Monat **aus der Rangliste nehmen** | hoch | klein | **1** | stärkt (Vertrauen) |
| V3 | Nur **Spitzname**, kein Profilbild, **kein Profil-Link**, **keine Uhrzeiten**; im Mitmachen-Dialog «Unter 16? Frag zuerst deine Eltern.» | hoch | klein | **1** | stärkt |
| V4 | **«So zählt's»** im Sheet: Punktetabelle mit Farbnamen + ein Satz (neu = erster Top, einmal pro Boulder, Flash +20 %) | mittel | klein | 2 | stärkt |
| V5 | **Eigene geschraubte Boulder** (`setterId` = ich) zählen nicht | mittel | klein | 2 | stärkt |
| V6 | Eigene Zeile zeigt **«Diese Woche: +n Punkte»**; keine Wochenliste | mittel | klein | 2 | stärkt |
| V7 | Ohne Teilnahme: Karte schrumpft auf **eine Zeile** und lässt sich mit «Nicht mehr zeigen» ausblenden; eigene Zeile positiv formuliert («4 neue Boulder diesen Monat») | mittel | klein | 2 | stärkt |
| V8 | Farbname neben jedem Farbpunkt, große Zahlen, eigene Zeile mit dem Wort «Du» | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v2)

- **Übernommen:** V1–V8.
- **Angepasst:** V1 Ligen nur, wenn die Halle mindestens 4 Farbstufen hat (sonst eine Liste); bei 4–5 Stufen zwei Ligen, ab 6 drei.
- **Verworfen:**
  - **Frauen-Rangliste** (Marie): verlangt Abfrage des Geschlechts, die BoulderMate nicht hat und nicht will (Yuki, Clara). Ligen nach Niveau lösen einen Teil.
  - **Gutschein aus der App** (Gisela): macht die Halle an der Theke (Sven); Monatsbeste sieht die Hallenleitung in derselben Liste.
  - **Hallenübergreifende Rangliste** (Pedro): Hallen schrauben unterschiedlich (Jonas, SPEC-037 F5).
  - **Push «Du wurdest überholt»** (Felix): erzeugt Druck (Sophie), Grill-me F7.

## Nicht umsetzen

- Wochen-Rangliste: Monat bleibt fair für Schicht und Eltern (Lena, Hakan, Ines); die Wochenzahl in der eigenen Zeile reicht als Ansporn.
