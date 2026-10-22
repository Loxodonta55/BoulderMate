# Runde 3 – Auswertung und Vorschläge (SPEC-045 v3 → v4)

> Simuliert. Grundlage: [runde-3-unterhaltung.md](runde-3-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | **Konto löschen** technisch unklar (Server-Löschung braucht DB-Funktion), Bestätigung; «App löschen» vs. «Konto löschen» erklären | 4 (Ralf, Oskar, Doris, Franziska) | Datenschutz, MINT, Hallenpersonal | mittel |
| T2 | Große Schrift und Sprachsteuerung: getestete Ansichten benennen, jeder Knopf mit Namen | 3 (Gerda, Nora, Martina) | Ältere, Kreative, Einschränkungen | mittel |
| T3 | App-Name im Store evtl. belegt; Ersatzname und Untertitel mit Suchwörtern | 3 (Jonas, Leila, Emma) | Studierende, Marketing, Englischsprachige | mittel |
| T4 | Store sagt: iPad nutzt besser die Webseite | 2 (Heinz, Wiebke) | Ältere, Schule | niedrig |
| T5 | Flyer und Schild mit Store-Knöpfen | 2 (Murat, Franziska) | Kaufleute, Hallenpersonal | niedrig |
| T6 | Store-Screenshots mit Pin-Nummern, Farbnamen, großer Schrift | 2 (Arne, Leila) | Farbsehschwäche, Marketing | niedrig |
| T7 | Scanner löst automatisch aus, großer Knopf | 2 (Clemens, Kenji) | Rettungsdienst, MINT | niedrig (schon so geplant) |
| T8 | Querformat-Fotos bleiben quer | 2 (Malte, Oskar) | Schrauber, MINT | niedrig (Testfall) |
| T9 | Startbild nur Logo, kurz | 2 (Sophie, Selma) | Kreative, Pflege | niedrig |
| T10 | Zwei Hallen offline | 2 (Tim dafür, Pavel dagegen) | Profis, MINT | niedrig |
| T11 | Studio auf Englisch fehlt | 1 (Jorge) | Englischsprachige | niedrig (nicht App-Thema) |
| T12 | Spätere Kosten | 2 (Barbara, Oskar) | Kaufleute | niedrig (beantwortet) |
| T13 | Sichtbarkeit für Kinder schon über SPEC-033 geregelt, nicht nochmal fragen | 2 (Ayşe, Christoph) | Eltern, Hallenpersonal | niedrig |

Keine Kritik mit Schweregrad **hoch**.

**Zitate**
- T1: «Ein Konto auf dem Server löschen kann man mit dem öffentlichen Schlüssel nicht einfach so.» (Ralf)
- T2: «Bei vielen Apps heißen Knöpfe ‹Knopf 3›.» (Martina)
- T3: «Wenn der Name belegt ist, kann man nicht einreichen.» (Jonas)
- Gesamt: «Für mich ist das fertig. Ich würde es installieren und meinen Gästen empfehlen.» (Franziska)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Konto löschen: Datenbank-Funktion `delete_my_account()` (löscht nur das eigene Konto samt Daten), Migration für Hans; Bestätigung durch Eintippen von «LÖSCHEN»; Erklärtext «App löschen» vs. «Konto löschen». Falls SPEC-033 das schon hat: nur in der App erreichbar machen | mittel | mittel | **1** | Pflicht |
| V2 | Tests benennen: Wand, Boulder-Details, Einstellungen, Login bei 200 %; jeder Knopf mit Namen (Vorlesen, Sprachsteuerung) | mittel | klein | 2 | stärkt |
| V3 | Name vorher prüfen, Ersatz «BoulderMate – Boulder-Tagebuch»; Untertitel DE «Boulder finden, loggen, bewerten», EN «Bouldering log for your gym» | mittel | klein | 2 | neutral |
| V4 | Store-Text: «Auf dem iPad läuft die App im iPhone-Format; dort ist bouldermate.ch im Browser bequemer.» | niedrig | klein | 3 | neutral |
| V5 | Flyer neu mit Store-Knöpfen; Bild «BoulderMate laden» für Hallen | niedrig | klein | 3 | stärkt (Verbreitung) |
| V6 | Screenshots: Wand mit Pin-Nummern, Boulder-Details mit Farbname, «Ich», QR-Scanner; große Schrift | niedrig | klein | 3 | neutral |
| V7 | Testfälle: Scanner löst automatisch aus; Querformat-Foto bleibt quer | niedrig | klein | 3 | neutral |
| V8 | Startbild: nur Logo auf Hintergrundfarbe, verschwindet sobald die Wand bereit ist | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v4)

- **Übernommen:** V1–V8.
- **Verworfen:**
  - **Zwei Hallen offline** (Tim): doppelter Speicher; die aktuelle Halle reicht (Pavel).
  - **Studio auf Englisch** (Jorge): kein App-Thema, steht schon als offen in SPEC-044 §11.
  - **Sichtbarkeit beim ersten Start nochmal abfragen**: SPEC-033 regelt das, kein zweiter Dialog (Ayşe).

## Abbruchregel

Nach Loop 3 keine Kritik «hoch», Änderungen nur Feinschliff (Konto löschen technisch präzisiert, Tests benannt, Store-Details) → **Abschluss, Status READY.**

## Nicht umsetzen

- Push, Widgets, iPad-Layout (schon in Runde 1/2 verworfen).
- Bewertungs-Aufforderung im Store.
