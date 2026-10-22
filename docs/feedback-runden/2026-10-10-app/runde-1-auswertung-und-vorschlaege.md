# Runde 1 – Auswertung und Vorschläge (SPEC-045 v1 → v2)

> Simuliert. Grundlage: [runde-1-unterhaltung.md](runde-1-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Store-Pflichten fehlen: Konto in der App löschen, fertige Datenschutzseite, Datenschutz-Angaben im Store | 4 (Priya, Julia, Peter, Jakob) | MINT, Kaufleute, Studierende | **hoch** (ohne das keine Zulassung) |
| T2 | QR-Code mit der normalen Kamera öffnet die Webseite statt der App → zwei BoulderMates, Tops «weg» | 5 (Jens, Stefan, Ben, Bettina, Helga) | Hallenpersonal, MINT, Polizei | **hoch** (Hauptzweck: Boulder finden) |
| T3 | Systemschriftgröße und Zoom werden ignoriert | 4 (Aisha, Georg, Rosemarie, Priya) | Ältere 55+, Einschränkungen, Lehrkräfte | **hoch** (Barriere) |
| T4 | Login: angemeldet bleiben; Rücksprung nach Google; Apple-Login auf iPhone als Systemfenster | 5 (Rosemarie, Jakob, Priya, Yannick, Tamara) | Ältere, MINT, Profis, Kreative | mittel |
| T5 | Android-Zurück schließt die App statt das offene Fenster | 2 (Sarah, Dragan) | Eltern, Handwerk | mittel |
| T6 | Knöpfe unter Kamera-Insel bzw. Home-Balken (sichere Ränder) | 2 (Sabine, Tamara) | Einschränkungen, Kreative | mittel |
| T7 | Erster Start offline ohne Daten: was sieht man? | 3 (Fabio, Jakob, Priya) | Schicht, Studierende, MINT | mittel |
| T8 | App hinkt der Webseite hinterher; Update-Hinweise nicht nervig | 4 (Werner, Ben, Kevin, Monika) | Handwerk, Azubis, Hallenpersonal | mittel |
| T9 | Wandfoto: Größe vor dem Hochladen, aber nicht matschig | 2 (Kevin, Dana) | Schrauber, Kreative | mittel |
| T10 | Wie finden Gäste die App? Store-Knöpfe, ruhiger Hinweis auf der Webseite, Flyer | 3 (Bettina, Monika, Helga) | Hallenpersonal | mittel |
| T11 | Berechtigungen erst beim Bedarf, in einfachen Worten | 2 (Ömer, Julia) | Zweitsprache, Datenschutz | mittel |
| T12 | Englisch: Store-Eintrag und Sprache nach Handy | 2 (Liam, Marco) | Englischsprachige | niedrig |
| T13 | Mindest-Systemversion und App-Größe unklar | 3 (Noah, Elif, Ben) | Schüler, Pflege-Azubi | niedrig |
| T14 | Tablets (Studio auf Android-Tablet und iPad) | 3 (Stefan, Georg, Carla) | Hallenpersonal, Ältere | niedrig |
| T15 | Push «Neue Boulder» | 4 (Lina dafür; Tamara, Yannick, Monika dagegen bzw. nur freiwillig) | Trainer, Kreative | – (später, eigene Spec) |
| T16 | Kein «Bewerte uns»-Fenster | 2 (Mia, Tamara) | Anfänger, Kreative | niedrig |
| T17 | Was, wenn das Apple-Konto ausläuft? | 2 (Peter, Priya) | Kaufleute | niedrig (wissen, nicht ändern) |

**Zitate**
- T1: «Wenn eure Datenschutzseite noch ‹Entwurf› ist, kommt ihr da gar nicht durch.» (Julia)
- T2: «Ich öffne doch nicht erst die App und such dann den Scanner.» (Jens) – «… hat der Gast zwei BoulderMates und weiß nicht, wo seine Tops sind.» (Stefan)
- T3: «Wenn die App kleiner schreibt als mein Handy eingestellt ist, ist sie für mich wertlos.» (Rosemarie)
- T5: «Zurück heißt zurück, nicht raus.» (Dragan)
- T7: «Wenn ich die App zum ersten Mal im Keller öffne, was sehe ich dann?» (Fabio)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Abschnitt **Store-Pflichten**: Konto löschen in der App, Datenschutzseite fertig, Datenschutz-Angaben (Apple) und Datensicherheit (Google), Test-Konto für die Prüfer (SPEC-027) | hoch | mittel | **1** | Voraussetzung |
| V2 | **Universal Links / App Links** für `bouldermate.ch`: QR-Code und geteilte Links öffnen die App, wenn installiert; sonst Webseite | hoch | klein | **1** | stärkt (Boulder finden) |
| V3 | **Systemschriftgröße übernehmen** (Android-Schriftgröße, iPhone-Textgröße), Zoom mit zwei Fingern erlaubt | hoch | klein | **1** | stärkt (Lesbarkeit) |
| V4 | Angemeldet bleiben: Sitzung im sicheren App-Speicher; **Apple-Login auf iPhone im Systemfenster** (Face ID), sonst Browser + Rücksprung; Rücksprung-Adresse in Supabase eintragen | mittel | mittel | 2 | stärkt |
| V5 | **Android-Zurück**: schließt erst Sheet/Dialog, dann vorherige Ansicht, auf der Startansicht «Nochmal drücken zum Beenden» | mittel | klein | 2 | stärkt |
| V6 | **Sichere Ränder** (Kamera-Insel, Home-Balken) für Kopf- und Tab-Leiste | mittel | klein | 2 | stärkt |
| V7 | Erster Start offline: Satz «Noch keine Daten …» statt leerer Wand | mittel | klein | 2 | stärkt |
| V8 | Update: **ruhiger Hinweis** höchstens einmal pro Version; **Sperre nur** bei Mindestversion | mittel | klein | 2 | neutral |
| V9 | Wandfoto: lange Seite auf 2400 px, JPEG-Qualität 0,85, offline in die Warteschlange (SPEC-032) | mittel | klein | 2 | stärkt (Schrauber) |
| V10 | **Store-Knöpfe** auf der Startseite und im Flyer; auf der Webseite eine schließbare Zeile «Auch als App», kein Pop-up | mittel | klein | 2 | stärkt (Verbreitung) |
| V11 | Berechtigungen **erst beim Tippen**, Texte in einfacher Sprache (DE/EN) | mittel | klein | 2 | stärkt |
| V12 | Store-Eintrag **Deutsch und Englisch**; App-Sprache folgt Handy (SPEC-039) | niedrig | klein | 3 | neutral |
| V13 | Mindestversionen und Größe in die Spec (Ziel < 30 MB) | niedrig | klein | 3 | neutral |
| V14 | Tablets: Android-Tablets erlaubt; iPhone-App läuft auf iPad im iPhone-Format; Studio auf dem Tablet weiter im Web | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v2)

- **Übernommen:** V1–V3, V5–V7, V10–V14.
- **Angepasst:**
  - V4: Systemfenster für Apple auf dem iPhone übernommen. Für **Google auf Android** ebenfalls Systemfenster (nativer Google-Login mit Konto-Auswahl), weil das für Android-Nutzer genauso vertraut ist; Browser + Rücksprung bleibt nur für Apple auf Android.
  - V8: ruhiger Hinweis als **eine Zeile in den Einstellungen und ein Punkt am Zahnrad**, kein Fenster.
  - V9: Werte übernommen, Warteschlange nur wenn Netz fehlt.
- **Verworfen:**
  - **Push in v1** (Lina): Grill-me F4; Leitlinie «ruhig». Später eigene Spec, nur freiwillig.
  - **iPad-optimierte App** (Stefan): eigene Bildschirmgrößen und Screenshots, wenig Nutzen; Web reicht für das Studio.
  - **Anmeldung erzwingen** (Werner fragte): nein, Anschauen ohne Konto bleibt wie im Web.

## Nicht umsetzen

- «Bewerte uns»-Fenster (Mia, Tamara): passt nicht zu «ruhig».
- Installations-Pop-up auf der Webseite (SPEC-032 F1 bleibt).
- Inhalte live über das Netz in die App nachladen (Live-Updates): Grill-me F3, Prüfungsrisiko bei Apple.
