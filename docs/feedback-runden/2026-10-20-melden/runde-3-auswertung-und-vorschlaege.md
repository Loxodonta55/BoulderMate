# Runde 3 – Auswertung und Vorschläge (SPEC-046 v3 → v4)

> Simuliert. Grundlage: [runde-3-unterhaltung.md](runde-3-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Knöpfe oben im Profil wirken nach Ärger; ruhig gestalten, aber nicht verstecken | 5 (Jörg, Laura, Elke, Lisa, Bernd) | Handwerk, Social Media, Gleichstellung, Therapie, Ältere | mittel |
| T2 | Prüfer müssen Melden finden; Test-Konto braucht eine meldbare Person | 2 (Annika, Jan) | Studierende, Product | mittel (Ablehnungsrisiko) |
| T3 | Welche Kontakt-Adresse? Private web.de-Adresse auf Dauer unpassend | 2 (Philipp, Robert) | Recht, Unternehmer | mittel (Grundsatzfrage an Hans) |
| T4 | Alte Treff-Ausblendungen gelten jetzt überall; still in der Liste sagen | 2 (Clara, Miriam) | Datenbank, Therapie | niedrig |
| T5 | Rückmeldung soll die verletzte Regel nennen | 2 (Daniel, Miriam) | Inklusion, Therapie | niedrig |
| T6 | Sperre: «Wenn du denkst, das ist ein Fehler» statt «Fragen» | 1 (Raphael) | Soziologie | niedrig |
| T7 | Melden offline in die Sende-Warteschlange, Ausblenden sofort lokal | 2 (Max, Clara) | Bergführer, Datenbank | niedrig |
| T8 | Kleines Display: Knöpfe im Sheet immer sichtbar, Gründe als große Zeilen | 2 (Doris, Ursula) | Ältere, Ergotherapie | mittel |
| T9 | Satz für Eltern auf «Fair bleiben» | 2 (Heike, Petra) | Eltern, Schule | niedrig |
| T10 | EN-Name der Seite «Play fair» | 1 (Matteo) | Touristen | niedrig |
| T11 | Hallen erfahren nichts von Sperren | 1 (Robert, akzeptiert) | Investor | – (entschieden) |

Keine Kritik mit Schweregrad **hoch**. Die Spec ändert sich nur noch in Details.

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Knöpfe im Profilfenster **ruhig**: eine Zeile rechts unter dem Namen, grau umrandet, Symbol + Wort, Trefferfläche 48 px; kein Rot. | mittel | klein | **1** | schützt den Hauptzweck (Profil zeigt Leistung) |
| V2 | **Prüfer-Hinweis** in `docs/app/store-eintrag.md`: Weg zu Melden/Ausblenden; Test-Konto `test-kletterer` sieht in der Demo-Halle mindestens eine andere Person in «Wer war schon oben» (z. B. `test-schrauber` mit Begehung). | mittel | klein | **1** | Voraussetzung |
| V3 | **Grundsatzfrage an Hans:** Kontakt-Adresse für Meldungen und Regeln. Empfehlung: bis es ein Postfach auf bouldermate.ch gibt, die Adresse der Datenschutzseite; in der App steht sie an **einer** Stelle (Konstante), damit der Wechsel ein Handgriff ist. | mittel | klein | 2 | – |
| V4 | In «Ausgeblendete Personen» ein Satz: «Gilt in der ganzen App: Treff, Ranglisten, ‹Wer war schon oben›.» Kein Pop-up. | niedrig | klein | 3 | neutral |
| V5 | Rückmeldung nennt die Regel: «… entfernt, weil {Regel} nicht erlaubt ist.» (Nacktheit, Gewalt, Hass, Werbung) | niedrig | klein | 3 | neutral |
| V6 | Sperr-Hinweis: «Dein Profil ist nicht öffentlich sichtbar. Wenn du denkst, das ist ein Fehler, schreib uns: …» | niedrig | klein | 3 | neutral |
| V7 | Melden ohne Netz geht in die **Sende-Warteschlange** (SPEC-032), Ausblenden wirkt sofort lokal und wird nachgesendet. | niedrig | klein | 3 | stärkt (offline) |
| V8 | Melde-Sheet: Gründe als **große Zeilen** (ganze Zeile antippbar), «Meldung senden» und «Abbrechen» **fest unten**, auch mit Tastatur sichtbar. | mittel | klein | 2 | Barriere |
| V9 | «Fair bleiben» bekommt den Satz: «Eltern und Trainer: Bei ernsten Vorfällen schreibt uns direkt: …» | niedrig | klein | 3 | neutral |
| V10 | EN-Seitenname «Play fair». | niedrig | klein | 3 | neutral |

## Was nicht umgesetzt werden sollte

- **«Es gelten unsere Regeln» statt «stimmst zu»** (Hamid): «stimmst zu» ist rechtlich klarer und für Apple eindeutig; ein Satz.
- **Neutraler Sheet-Titel, damit der Trainer nichts sieht** (Oskar/Heike): nicht verhinderbar; wer meldet, tut es nicht neben der Person.
- **Hallen über Sperren informieren** (Robert): bleibt entschieden (G5).
- **Weitere Notrufnummern pro Land**: 112 gilt in ganz Europa.

## Abbruchregel

Loop 3 erreicht, keine Kritik «hoch», Änderungen sind Feinschliff → **Abschluss, Status READY**. Grundsatzfrage V3 (Kontakt-Adresse) geht mit Empfehlung an Hans.
