# Runde 3 – Auswertung und Vorschläge (SPEC-047 v3 → v4)

> Simuliert. Grundlage: [runde-3-unterhaltung.md](runde-3-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Animation kann schwindelig machen; keine Töne/Vibration | 3 (Hannelore, Marie, Karl) | Ältere, Kreative | mittel |
| T2 | App-Satz «Konto gilt auch hier» und Einführung nicht doppeln | 2 (Lena, Tim) | Schicht, MINT | mittel |
| T3 | Admin-Haken «QR-Codes» unzuverlässig → nur Daten-Haken, QR als Verweis | 3 (Gisela, Tim, Oliver) | Betreiber, MINT | mittel |
| T4 | Spitzname-Hinweis doppelt zu Karte 3 | 3 (Ulrike, Yuki, Tim) | Ärzte, MINT | niedrig |
| T5 | Schrauber-Karte: auch «Umschrauben» nennen | 2 (Ralf, Mara) | Hallenpersonal | niedrig |
| T6 | Treff-Hinweis: «Es gibt keinen Chat» | 2 (Nina, Petra) | Trainer, Ältere | niedrig |
| T7 | Fachwort «Beta» raus; englische Texte gegenlesen lassen | 2 (Ahmed, Chloe) | Zweitsprache, Englischsprachige | niedrig |
| T8 | Letzter Knopf «Los geht's» | 2 (Sophie, Tim) | Anfänger | niedrig |
| T9 | Offline-Fähigkeit in der App | 1 (Pedro) | Englischsprachige | niedrig (schon erfüllt) |

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Überblenden ≤ 200 ms; bei `prefers-reduced-motion` keine Animation; keine Töne, keine Vibration | mittel | klein | 2 | neutral |
| V2 | App: Neue sehen Karten statt des Satzes; wer «gesehen» hat, sieht nur den Satz aus SPEC-045 | mittel | klein | 2 | stärkt |
| V3 | Admin-Karte: Haken nur für Sektoren, Farbskala, Team (aus Daten); QR-Codes als Knopf «QR-Codes erstellen» ohne Haken | mittel | klein | 2 | stärkt |
| V4 | Spitzname-Hinweis (SPEC-032 D) nur, wenn Karte 3 nicht erreicht wurde (`bm_intro.climber.reached`) | niedrig | klein | 3 | stärkt |
| V5 | Schrauber-Karte 1 ergänzt: «Ganze Wand neu? Tippe ‹Umschrauben›.» | niedrig | klein | 3 | neutral |
| V6 | Treff-Hinweis: «Hier siehst du, wer heute klettert. Es gibt keinen Chat.» | niedrig | klein | 3 | neutral |
| V7 | «Beta» auf Karte 1 → «Tipps von anderen»; englische Texte vor Freigabe von einer englischsprachigen Person gegenlesen (offen für Hans) | niedrig | klein | 3 | neutral |
| V8 | Letzter Knopf «Los geht's» / «Let's go» schließt den Dialog | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v4)

- **Übernommen:** V1–V8.
- **Angepasst:** keine.
- **Verworfen:** keine. (V9 ist bereits erfüllt: gezeichnete Bilder im App-Paket, Hallen-Satz kommt mit den lokal gespeicherten Hallendaten.)

## Abbruch

Keine Kritik «hoch» mehr, alle Änderungen in Runde 3 sind Feinschliff. Mindestzahl von 3 Durchläufen erreicht → **READY**.
