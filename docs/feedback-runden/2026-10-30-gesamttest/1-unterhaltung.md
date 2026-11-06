# Unterhaltung: Gesamttest der App mit 210 simulierten Personen

> **Simuliert**, kein echtes Nutzerfeedback. Ablauf nach [feedback-einholen.md](../../prozesse/feedback-einholen.md), auf Wunsch von Hans (2026-10-30) auf 30 Admins, 60 Schrauber und 120 Kletterer hochskaliert.
> **Gegenstand:** die ganze App, Stand `62839c5` (Branch `feat/ux-overhaul-v2`), inklusive SPEC-044 bis SPEC-053.
> **Leitfrage:** Funktioniert die App für eure Rolle von der Anmeldung bis zum Alltag? Was stört, was fehlt, was soll bleiben?
> **Was die Runde «gesehen» hat:** echte Bildschirmfotos und Abläufe aus dem Testlauf (siehe [0-testlauf-befunde.md](0-testlauf-befunde.md)): Startseite, Gast-Hallenwahl und Wand, Anmelden über die Testprofile, Route öffnen, Top loggen, «Ich», Treff, Einstellungen, Schrauber-Studio (Wände, Meine Routen, Umbau ankündigen, Wand neu schrauben), Arbeitsbereich wählen, Admin (Sektoren, Farben, Team, Halle, Zahlen). Je auf Desktop hell Deutsch, iPhone 15 dunkel Englisch und iPhone SE hell Deutsch.
> **Keine echten Konten:** Die Personen sind nicht in Supabase angelegt (nur PROD vorhanden; 210 Konten hätten die Hallenzahlen verfälscht).

**Wege durch die App je Rolle**
- *Kletterer:* Startseite → anmelden oder Gast → Halle wählen → Wand, Sektor wechseln → Route öffnen → Top/Flash loggen, bewerten → «Ich» (Tops, Flash-Quote, bester Grad, pro Halle, Challenge heute) → Treff → Einstellungen (Sprache, Sichtbarkeit, Daten, Gruppen, Sicherheit).
- *Schrauber:* Arbeitsbereich «Schrauber-Studio» → Wand wählen → Boulder erfassen und Pins setzen → Umbau ankündigen / Wand neu schrauben → Speichern & Veröffentlichen → «Meine Routen».
- *Admins:* Arbeitsbereich «Hallen-Administration» → Sektoren, Farben, Team, Halle (Standort, Treff, KI, Auslastung, Challenges, QR-Codes), Zahlen (Halle, Schrauber).

**Spalte «Note»:** Gesamteindruck 1 (schlecht) bis 5 (sehr gut). **Spalte «Themen»:** Kürzel der Themen aus der Auswertung (K = Kletterer, S = Schrauber, A = Admin), das erste ist das, worüber die Person spricht.

## Teilnehmende

### Admins (30)

| # | Name | Alter | Beruf / Population | Niveau | Gerät | Sprache · Modus | Themen | Kernaussage | Note |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Fatima | 42 | Kursleitung / Kinderklettern | 7c+ | Laptop + iPhone | DE · auto | A-MOD, A-EMPF | «Meldungen prüfen und Personen sperren können ist Pflicht. Gut gelöst.» | 4 |
| 2 | Sofia | 53 | Vorstand Kletterverein | 6b–6c | Desktop-PC Theke | DE · hell | A-SETTERAUSW, A-EMPF | «Für die Planung super: welche Farbe fehlt, wer schraubt was.» | 3 |
| 3 | Leon | 26 | Marketing/Social Media der Halle | 7c+ | iPad | DE · dunkel | A-ZAHLEN, A-EMPF | «Die Zahlen sind gut, aber ich brauch die Zeitspanne bei jeder Kachel.» | 3 |
| 4 | Fabio | 42 | Schichtleitung Theke | 6a–6a+ | Laptop + Android | DE · hell | A-KI, A-QR | «Der Datenschutztext zur KI ist ehrlich. Gemini im Pilot – ok, wenn's abschaltbar bleibt.» | 4 |
| 5 | Grace | 33 | Hallenleitung, angestellt | 7c+ | Desktop-PC Theke | DE · dunkel | A-TREFF, A-EMPF | «Treff pro Halle an- und abschalten: so mag ich das.» | 4 |
| 6 | Amara | 32 | Hallenleitung, angestellt | 7a–7b | Laptop + iPhone | DE · hell | A-QR, A-SETTERAUSW | «QR-Aufkleber pro Sektor: das hängen wir morgen auf.» | 4 |
| 7 | Corinne | 38 | Hallenleitung, angestellt | 7a–7b | nur Handy | DE · hell | A-GATEWAY, A-TREFF | «Auf dem kleinen Handy deckt «Ansehen als …» die Hallen-Administration zu. Ich hab danebengetippt.» | 2 |
| 8 | Petra | 65 | Hallenbetreiber/in, Inhaber/in | 7a–7b | Laptop + Android | DE · hell | A-TREFF, A-QR | «Auslastung melden mit 90 Minuten – praktisch für die Theke.» | 4 |
| 9 | Mei | 37 | Buchhaltung/Administration der Halle | 7a–7b | Desktop-PC Theke | DE · dunkel | A-EMPF, A-ZAHLEN | «Hallen-Wünsche sehen zu können, ist für uns Marktforschung gratis.» | 3 |
| 10 | Arben | 53 | Buchhaltung/Administration der Halle | 6b–6c | iPad | DE · hell | A-FARBEN, A-KI | «Farbe im Sheet ändern geht schnell.» | 4 |
| 11 | Fabio | 43 | Vorstand Kletterverein | 6b–6c | iPad | DE · auto | A-SETTERAUSW, A-FARBEN | «Für die Planung super: welche Farbe fehlt, wer schraubt was.» | 3 |
| 12 | Dragan | 39 | Technische Leitung Gebäude | 6b–6c | iPad | DE · hell | A-DE, A-SETTERAUSW | «Our staff speaks German, fine. But the gym chooser for guests should be English.» | 3 |
| 13 | Elena | 25 | Schichtleitung Theke | 6a–6a+ | Desktop-PC Theke | DE · dunkel | A-DE, A-SETTERAUSW | «Admin auf Deutsch reicht uns, aber die Gäste sind halb international.» | 3 |
| 14 | Yuki | 68 | Vorstand Kletterverein | 6b–6c | nur Handy | EN · auto | A-DE, A-KI | «Admin auf Deutsch reicht uns, aber die Gäste sind halb international.» | 3 |
| 15 | Anna | 55 | Hallenbetreiber/in, Inhaber/in | 6b–6c | Desktop-PC Theke | DE · hell | A-KI, A-EMPF | «Der Datenschutztext zur KI ist ehrlich. Gemini im Pilot – ok, wenn's abschaltbar bleibt.» | 3 |
| 16 | Grace | 56 | Vorstand Kletterverein | 6b–6c | iPad | DE · hell | A-QR, A-KI | «QR-Aufkleber pro Sektor: das hängen wir morgen auf.» | 4 |
| 17 | Stefan | 56 | Buchhaltung/Administration der Halle | 7a–7b | Desktop-PC Theke | DE · auto | A-KI, A-MOD | «Der Datenschutztext zur KI ist ehrlich. Gemini im Pilot – ok, wenn's abschaltbar bleibt.» | 3 |
| 18 | Simon | 22 | Schichtleitung Theke | 6a–6a+ | iPad | DE · hell | A-SETTERAUSW, A-QR | «Für die Planung super: welche Farbe fehlt, wer schraubt was.» | 4 |
| 19 | Sofia | 25 | Marketing/Social Media der Halle | 7a–7b | iPad | EN · auto | A-DE, A-MOD | «Admin auf Deutsch reicht uns, aber die Gäste sind halb international.» | 3 |
| 20 | Pascal | 50 | Buchhaltung/Administration der Halle | 7a–7b | Laptop + iPhone | DE · auto | A-ZAHLEN, A-KI | «7 Begehungen, aber 0 Kletterer in 30 Tagen? Das muss man erklären.» | 2 |
| 21 | Laura | 65 | Hallenbetreiber/in, Inhaber/in | 7a–7b | nur Handy | DE · auto | A-GATEWAY, A-EMPF | «Auf dem kleinen Handy deckt «Ansehen als …» die Hallen-Administration zu. Ich hab danebengetippt.» | 2 |
| 22 | Ruth | 57 | Buchhaltung/Administration der Halle | 7a–7b | nur Handy | DE · hell | A-GATEWAY, A-MOD | «Auf dem kleinen Handy deckt «Ansehen als …» die Hallen-Administration zu. Ich hab danebengetippt.» | 2 |
| 23 | Kenji | 51 | Vorstand Kletterverein | 7c+ | Laptop + iPhone | DE · hell | A-FARBEN, A-EMPF | «Farbe im Sheet ändern geht schnell.» | 3 |
| 24 | Ömer | 61 | Vorstand Kletterverein | 6b–6c | Laptop + iPhone | DE · hell | A-ZAHLEN, A-MOD | «Die Zahlen sind gut, aber ich brauch die Zeitspanne bei jeder Kachel.» | 3 |
| 25 | Ayla | 43 | Schichtleitung Theke | 7c+ | Laptop + Android | DE · dunkel | A-MOD, A-QR | «Ich will benachrichtigt werden, wenn etwas gemeldet wird.» | 5 |
| 26 | Fabio | 54 | Hallenleitung, angestellt | 6b–6c | Desktop-PC Theke | DE · dunkel | A-ZAHLEN, A-TREFF | «7 Begehungen, aber 0 Kletterer in 30 Tagen? Das muss man erklären.» | 3 |
| 27 | Vanessa | 38 | Marketing/Social Media der Halle | 6b–6c | nur Handy | DE · dunkel | A-GATEWAY, A-KI | «Auf dem kleinen Handy deckt «Ansehen als …» die Hallen-Administration zu. Ich hab danebengetippt.» | 2 |
| 28 | Ayla | 54 | Hallenbetreiber/in, Inhaber/in | 7c+ | Desktop-PC Theke | DE · auto | A-KI, A-EMPF | «Der Datenschutztext zur KI ist ehrlich. Gemini im Pilot – ok, wenn's abschaltbar bleibt.» | 3 |
| 29 | Ethan | 38 | Hallenleitung, angestellt | 7a–7b | nur Handy | DE · auto | A-GATEWAY, A-FARBEN | «Auf dem kleinen Handy deckt «Ansehen als …» die Hallen-Administration zu. Ich hab danebengetippt.» | 2 |
| 30 | Dragan | 61 | Hallenbetreiber/in, Inhaber/in | 6b–6c | nur Handy | DE · hell | A-GATEWAY, A-TREFF | «Im Bereich-Wählen ragen die Pfeile rechts über die Karten hinaus.» | 2 |

### Schrauber (60)

| # | Name | Alter | Beruf / Population | Niveau | Gerät | Sprache · Modus | Themen | Kernaussage | Note |
|---|---|---|---|---|---|---|---|---|---|
| 31 | Dominik | 65 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 6b–6c | iPhone 15 Pro | DE · hell | S-KI, S-FOTO | «Gut, dass da steht: ohne Personen fotografieren.» | 3 |
| 32 | Jana | 28 | Schrauber/in, Teilzeit neben Studium | 7c+ | iPad + Handy | DE · dunkel | S-CHIPS, S-BEGRIFF | «Die Sektor-Chips sind kleiner als ein Daumen, mit Handschuhen geht's schlecht.» | 2 |
| 33 | Ivan | 52 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 6b–6c | iPhone 15 Pro | DE · hell | S-BEGRIFF, S-FOTO | ««Batch-Schraubermodus» – sagt keiner im Team. Einfach «Routen erfassen».» | 3 |
| 34 | Corinne | 48 | Chefschrauber/in, Vollzeit | 7c+ | Samsung Galaxy S | DE · hell | S-STATS, S-UMBAU | «Sterne für meine Routen – schön, solange der Chef das nicht als Leistungsnachweis nimmt.» | 4 |
| 35 | Grace | 42 | Schrauber/in, Hauptjob Zimmermann/Zimmerin | 7a–7b | iPhone SE | DE · dunkel | S-SPEICHERN, S-BEGRIFF | «Auf meinem iPhone SE ist der Speichern-Knopf unten rechts halb weg. Ich hab erst gedacht, es gibt keinen.» | 1 |
| 36 | Andrin | 31 | Schrauber/in, gelernte/r Polymechaniker/in | 7c+ | iPhone SE | DE · dunkel | S-SPEICHERN, S-UMBAU | «Auf meinem iPhone SE ist der Speichern-Knopf unten rechts halb weg. Ich hab erst gedacht, es gibt keinen.» | 3 |
| 37 | Alina | 54 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 7a–7b | Samsung Galaxy S | DE · dunkel | S-KI, S-STATS | «KI aus dem Sektorfoto? Spart Zeit, aber ich prüf jeden Grad nach.» | 3 |
| 38 | Samuel | 34 | Schrauber/in, Ex-Wettkampfkletterer/in | 6b–6c | Android robust (Outdoor) | DE · auto | S-CHIPS, S-BEGRIFF | «Die Sektor-Chips sind kleiner als ein Daumen, mit Handschuhen geht's schlecht.» | 2 |
| 39 | Lina | 35 | Schrauber/in und Trainer/in Jugendkader | 6a–6a+ | Samsung Galaxy S | DE · auto | S-FOTO, S-KI | «Pins setzen auf dem Foto klappt, Zoom könnte größer sein.» | 3 |
| 40 | Werner | 55 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 7c+ | iPhone SE | DE · dunkel | S-SPEICHERN, S-STATS | «Die Leiste unten mit neu/geändert/archiviert schiebt Speichern aus dem Bild. Auf dem kleinen Handy ein Problem.» | 2 |
| 41 | Samuel | 43 | Schrauber/in und Trainer/in Jugendkader | 7a–7b | iPhone SE | DE · hell | S-SPEICHERN, S-CHIPS | «Auf meinem iPhone SE ist der Speichern-Knopf unten rechts halb weg. Ich hab erst gedacht, es gibt keinen.» | 1 |
| 42 | Luca | 44 | Schrauber/in und Trainer/in Jugendkader | 7a–7b | Android robust (Outdoor) | DE · hell | S-STATS, S-CHIPS | «Sterne für meine Routen – schön, solange der Chef das nicht als Leistungsnachweis nimmt.» | 4 |
| 43 | Ana | 28 | Freelance-Schrauber/in (reist, Englisch) | 6b–6c | Samsung Galaxy S | EN · auto | S-EN, S-CHIPS | «'Umbau ankündigen' – I had to ask. An English studio would help freelancers.» | 2 |
| 44 | Jasmin | 21 | Schrauber-Lernende/r (neu im Team) | 6b–6c | iPad + Handy | DE · dunkel | S-STATS, S-CHIPS | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 4 |
| 45 | Ayla | 40 | Schrauber/in und Trainer/in Jugendkader | 6a–6a+ | iPhone 15 Pro | EN · auto | S-EN, S-BEGRIFF | «The studio is German only. I set in four gyms, I can guess, but colleagues can't.» | 2 |
| 46 | Brigitte | 49 | Schrauber/in, Hauptjob Zimmermann/Zimmerin | 6b–6c | iPad + Handy | DE · auto | S-STATS, S-UMBAU | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 4 |
| 47 | Marco | 35 | Schrauber/in, Ex-Wettkampfkletterer/in | 6a–6a+ | iPad + Handy | EN · dunkel | S-CHIPS, S-STATS | ««Wand» oben rechts und das Bereichs-Symbol sind zu klein für die Leiter.» | 3 |
| 48 | Leonie | 36 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 6b–6c | Samsung Galaxy S | DE · hell | S-CHIPS, S-BEGRIFF | «Die Sektor-Chips sind kleiner als ein Daumen, mit Handschuhen geht's schlecht.» | 2 |
| 49 | Andrin | 35 | Freelance-Schrauber/in (reist, Englisch) | 6a–6a+ | Samsung Galaxy S | EN · auto | S-EN, S-STATS | «The studio is German only. I set in four gyms, I can guess, but colleagues can't.» | 3 |
| 50 | Anna | 42 | Schrauber/in und Trainer/in Jugendkader | 6b–6c | iPhone 15 Pro | DE · hell | S-BEGRIFF, S-STATS | ««Batch-Schraubermodus» – sagt keiner im Team. Einfach «Routen erfassen».» | 4 |
| 51 | Tomás | 21 | Schrauber-Lernende/r (neu im Team) | 7a–7b | Samsung Galaxy S | EN · dunkel | S-EN, S-KI | «'Umbau ankündigen' – I had to ask. An English studio would help freelancers.» | 3 |
| 52 | Zoe | 42 | Freelance-Schrauber/in (reist, Englisch) | 7a–7b | iPhone 15 Pro | EN · auto | S-EN, S-CHIPS | «The studio is German only. I set in four gyms, I can guess, but colleagues can't.» | 2 |
| 53 | Hansjörg | 47 | Schrauber/in, Hauptjob Zimmermann/Zimmerin | 7a–7b | iPhone SE | DE · auto | S-SPEICHERN, S-FOTO | «Die Leiste unten mit neu/geändert/archiviert schiebt Speichern aus dem Bild. Auf dem kleinen Handy ein Problem.» | 2 |
| 54 | Lea | 30 | Schrauber/in, Hauptjob Zimmermann/Zimmerin | 7a–7b | Android robust (Outdoor) | DE · dunkel | S-CHIPS, S-UMBAU | ««Wand» oben rechts und das Bereichs-Symbol sind zu klein für die Leiter.» | 3 |
| 55 | Jana | 22 | Schrauber/in, gelernte/r Polymechaniker/in | 7c+ | iPhone SE | DE · dunkel | S-SPEICHERN, S-FOTO | «Auf meinem iPhone SE ist der Speichern-Knopf unten rechts halb weg. Ich hab erst gedacht, es gibt keinen.» | 2 |
| 56 | Julia | 62 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 7a–7b | Samsung Galaxy S | DE · auto | S-CHIPS, S-BEGRIFF | ««Wand» oben rechts und das Bereichs-Symbol sind zu klein für die Leiter.» | 3 |
| 57 | Hansjörg | 26 | Schrauber/in, Ex-Wettkampfkletterer/in | 6b–6c | Samsung Galaxy S | DE · hell | S-STATS, S-CHIPS | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 3 |
| 58 | Robin | 30 | Schrauber/in und Trainer/in Jugendkader | 6b–6c | iPhone SE | DE · auto | S-SPEICHERN, S-BEGRIFF | «Die Leiste unten mit neu/geändert/archiviert schiebt Speichern aus dem Bild. Auf dem kleinen Handy ein Problem.» | 2 |
| 59 | Daniel | 32 | Schrauber/in, Ex-Wettkampfkletterer/in | 6b–6c | iPhone 15 Pro | DE · dunkel | S-STATS, S-BEGRIFF | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 4 |
| 60 | Sandra | 28 | Schrauber/in und Trainer/in Jugendkader | 7a–7b | Samsung Galaxy S | DE · dunkel | S-STATS, S-KI | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 4 |
| 61 | Sven | 38 | Freelance-Schrauber/in (reist, Englisch) | 6b–6c | Samsung Galaxy S | EN · hell | S-EN, S-KI | «'Umbau ankündigen' – I had to ask. An English studio would help freelancers.» | 2 |
| 62 | Elif | 29 | Schrauber/in, gelernte/r Polymechaniker/in | 7c+ | Android robust (Outdoor) | EN · hell | S-EN, S-BEGRIFF | «The studio is German only. I set in four gyms, I can guess, but colleagues can't.» | 2 |
| 63 | Reto | 19 | Schrauber-Lernende/r (neu im Team) | 6b–6c | iPhone 15 Pro | DE · dunkel | S-KI, S-CHIPS | «Gut, dass da steht: ohne Personen fotografieren.» | 3 |
| 64 | Leonie | 21 | Schrauber-Lernende/r (neu im Team) | 6b–6c | Samsung Galaxy S | DE · hell | S-FOTO, S-KI | «Pins setzen auf dem Foto klappt, Zoom könnte größer sein.» | 3 |
| 65 | Jovan | 25 | Schrauber/in und Trainer/in Jugendkader | 6b–6c | iPad + Handy | DE · hell | S-STATS, S-CHIPS | «Sterne für meine Routen – schön, solange der Chef das nicht als Leistungsnachweis nimmt.» | 3 |
| 66 | Anna | 21 | Schrauber/in, Teilzeit neben Studium | 6a–6a+ | iPhone 15 Pro | DE · auto | S-CHIPS, S-BEGRIFF | «Die Sektor-Chips sind kleiner als ein Daumen, mit Handschuhen geht's schlecht.» | 2 |
| 67 | Fabio | 28 | Schrauber/in, Teilzeit neben Studium | 7a–7b | Android robust (Outdoor) | DE · hell | S-STATS, S-KI | «Sterne für meine Routen – schön, solange der Chef das nicht als Leistungsnachweis nimmt.» | 4 |
| 68 | Leon | 25 | Schrauber/in, Teilzeit neben Studium | 7c+ | Android robust (Outdoor) | DE · auto | S-UMBAU, S-BEGRIFF | «Umbau ankündigen: die Kletterer wissen endlich, wann die Wand neu ist.» | 4 |
| 69 | Charlotte | 19 | Schrauber-Lernende/r (neu im Team) | 6b–6c | iPad + Handy | DE · hell | S-FOTO, S-KI | «Foto aufnehmen in der Halle ist ok, aber unter den Strahlern ist's oft überbelichtet.» | 3 |
| 70 | Ruedi | 41 | Freelance-Schrauber/in (reist, Englisch) | 7c+ | iPhone 15 Pro | EN · dunkel | S-EN, S-CHIPS | «'Umbau ankündigen' – I had to ask. An English studio would help freelancers.» | 2 |
| 71 | Luca | 37 | Schrauber/in, Ex-Wettkampfkletterer/in | 6b–6c | Android robust (Outdoor) | DE · dunkel | S-BEGRIFF, S-FOTO | «Wand auswählen & Boulder erfassen ist klar, die Überschrift drüber braucht's nicht.» | 3 |
| 72 | Urs | 23 | Schrauber/in, Teilzeit neben Studium | 7a–7b | iPhone 15 Pro | DE · dunkel | S-UMBAU, S-KI | «Umbau ankündigen: die Kletterer wissen endlich, wann die Wand neu ist.» | 4 |
| 73 | Valentina | 32 | Freelance-Schrauber/in (reist, Englisch) | 6a–6a+ | iPhone SE | EN · hell | S-EN, S-BEGRIFF | «'Umbau ankündigen' – I had to ask. An English studio would help freelancers.» | 2 |
| 74 | Silvan | 44 | Chefschrauber/in, Vollzeit | 7c+ | Samsung Galaxy S | DE · dunkel | S-STATS, S-FOTO | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 4 |
| 75 | Ivan | 33 | Schrauber/in, gelernte/r Polymechaniker/in | 7a–7b | iPhone 15 Pro | DE · dunkel | S-STATS, S-BEGRIFF | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 4 |
| 76 | Laura | 43 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 7a–7b | iPhone 15 Pro | DE · auto | S-STATS, S-KI | «Sterne für meine Routen – schön, solange der Chef das nicht als Leistungsnachweis nimmt.» | 3 |
| 77 | Pascal | 41 | Freelance-Schrauber/in (reist, Englisch) | 7c+ | Android robust (Outdoor) | EN · dunkel | S-FOTO, S-UMBAU | «Foto aufnehmen in der Halle ist ok, aber unter den Strahlern ist's oft überbelichtet.» | 4 |
| 78 | Sandra | 44 | Chefschrauber/in, Vollzeit | 7c+ | iPhone SE | DE · auto | S-SPEICHERN, S-UMBAU | «Die Leiste unten mit neu/geändert/archiviert schiebt Speichern aus dem Bild. Auf dem kleinen Handy ein Problem.» | 2 |
| 79 | Michelle | 26 | Schrauber/in, Hauptjob Zimmermann/Zimmerin | 6b–6c | iPad + Handy | DE · dunkel | S-STATS, S-UMBAU | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 4 |
| 80 | Pascal | 36 | Schrauber/in, Ex-Wettkampfkletterer/in | 6b–6c | iPhone SE | DE · hell | S-SPEICHERN, S-UMBAU | «Auf meinem iPhone SE ist der Speichern-Knopf unten rechts halb weg. Ich hab erst gedacht, es gibt keinen.» | 2 |
| 81 | Jonas | 59 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 6a–6a+ | Android robust (Outdoor) | DE · hell | S-BEGRIFF, S-KI | ««Batch-Schraubermodus» – sagt keiner im Team. Einfach «Routen erfassen».» | 3 |
| 82 | Matteo | 20 | Schrauber-Lernende/r (neu im Team) | 7c+ | iPhone SE | DE · dunkel | S-SPEICHERN, S-STATS | «Auf meinem iPhone SE ist der Speichern-Knopf unten rechts halb weg. Ich hab erst gedacht, es gibt keinen.» | 2 |
| 83 | Luis | 22 | Schrauber/in, Teilzeit neben Studium | 7a–7b | iPhone SE | DE · auto | S-SPEICHERN, S-BEGRIFF | «Die Leiste unten mit neu/geändert/archiviert schiebt Speichern aus dem Bild. Auf dem kleinen Handy ein Problem.» | 2 |
| 84 | Monika | 21 | Schrauber/in, Teilzeit neben Studium | 6a–6a+ | Samsung Galaxy S | DE · auto | S-BEGRIFF, S-FOTO | «Wand auswählen & Boulder erfassen ist klar, die Überschrift drüber braucht's nicht.» | 3 |
| 85 | Petra | 48 | Hobby-Schrauber/in im Verein (SAC-Sektion) | 7a–7b | Samsung Galaxy S | DE · hell | S-STATS, S-KI | «Sterne für meine Routen – schön, solange der Chef das nicht als Leistungsnachweis nimmt.» | 4 |
| 86 | Kenji | 26 | Schrauber/in und Trainer/in Jugendkader | 6a–6a+ | iPad + Handy | DE · dunkel | S-STATS, S-KI | ««Meine Routen» zeigt mir, welche gut ankommen. Motiviert.» | 3 |
| 87 | Nina | 51 | Schrauber/in, Hauptjob Zimmermann/Zimmerin | 6b–6c | Android robust (Outdoor) | DE · auto | S-FOTO, S-KI | «Pins setzen auf dem Foto klappt, Zoom könnte größer sein.» | 3 |
| 88 | Jonas | 36 | Freelance-Schrauber/in (reist, Englisch) | 6b–6c | iPhone 15 Pro | EN · hell | S-EN, S-UMBAU | «The studio is German only. I set in four gyms, I can guess, but colleagues can't.» | 3 |
| 89 | Ruedi | 53 | Schrauber/in, Hauptjob Zimmermann/Zimmerin | 7a–7b | iPhone 15 Pro | EN · hell | S-EN, S-CHIPS | «The studio is German only. I set in four gyms, I can guess, but colleagues can't.» | 2 |
| 90 | Sara | 47 | Chefschrauber/in, Vollzeit | 6a–6a+ | Samsung Galaxy S | DE · hell | S-CHIPS, S-BEGRIFF | «Die Sektor-Chips sind kleiner als ein Daumen, mit Handschuhen geht's schlecht.» | 2 |

### Kletterer (120)

| # | Name | Alter | Beruf / Population | Niveau | Gerät | Sprache · Modus | Themen | Kernaussage | Note |
|---|---|---|---|---|---|---|---|---|---|
| 91 | Sara | 34 | KV / Büro | 7a–7b | iPad | DE · hell | K-CHALL, K-SICHT | «Challenge ist nett, aber ich will nicht jeden Tag einen Streifen an der Wand.» | 4 |
| 92 | Ömer | 44 | Software-Entwicklung | 7c+ | iPhone 15 | DE · hell | K-LOG, K-TREFF | «Top loggen geht schneller als Schuhe ausziehen. Das bleibt.» | 5 |
| 93 | Mira | 35 | Musiker/in | 7c+ | Fairphone | DE · hell | K-ICH, K-GAST | «Ich hätte gern einen Verlauf über Wochen, nicht nur Gesamtzahlen.» | 4 |
| 94 | Tomás | 27 | Logistik/Lager | 7a–7b | älteres Android | DE · hell | K-CHALL, K-TREFF | «Challenge ist nett, aber ich will nicht jeden Tag einen Streifen an der Wand.» | 4 |
| 95 | Vreni | 45 | Polizist/in | 6b–6c | iPhone SE | DE · auto | K-KLEIN, K-GRUPPE | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 2 |
| 96 | Kenji | 50 | Juristin/Jurist | 7a–7b | iPhone 15 | DE · hell | K-KLEIN, K-EN | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 2 |
| 97 | Ursula | 43 | Pflegefachperson, Schichtdienst | 6a–6a+ | Fairphone | EN · hell | K-EN, K-ICH | «Tab says 'Meet', settings below say 'Treff ausblenden'. Feels half done.» | 2 |
| 98 | Kofi | 60 | Lehrperson Primarschule | 7c+ | Pixel 7 | DE · dunkel | K-GRUPPE, K-ERKLAER | «Gruppe erstellen für die Kletter-AG: genau das hat gefehlt.» | 4 |
| 99 | Brigitte | 34 | Kita-Betreuung | Anfänger (4–5a) | Samsung A-Serie | DE · hell | K-DUNKEL, K-KLEIN | «Dunkelmodus schaltet von allein um, sieht ruhig aus.» | 4 |
| 100 | Elena | 40 | Elektroinstallateur/in | 6a–6a+ | iPhone SE | DE · dunkel | K-KLEIN, K-MELDEN | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 101 | Oliver | 26 | Elektroinstallateur/in | Anfänger (4–5a) | Xiaomi | EN · dunkel | K-EN, K-TREFF | «I picked the gym on a German map sheet. Fine, but 'In meiner Nähe' I had to guess.» | 2 |
| 102 | Kerem | 43 | Tourist/in (Englisch) | 7c+ | iPhone 15 | EN · hell | K-EN, K-KLEIN | «I picked the gym on a German map sheet. Fine, but 'In meiner Nähe' I had to guess.» | 2 |
| 103 | Yuki | 64 | Rentner/in | 5b–5c | iPhone 13 mini | DE · dunkel | K-KLEIN, K-GRUPPE | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 2 |
| 104 | Ingrid | 30 | Software-Entwicklung | 7c+ | iPhone 15 | DE · hell | K-SICHT, K-GAST | «Pin-Nummern auf dem Foto sind für meine Augen grenzwertig klein.» | 3 |
| 105 | Mei | 37 | Expat (Englisch), Pharma Basel/Zürich | 7a–7b | Pixel 7 | EN · dunkel | K-EN, K-GAST | «The wall is in English, but 'Halle wählen' and 'Zur Wand' are not. That's the first screen a tourist sees.» | 3 |
| 106 | Nadine | 51 | Sozialarbeit | 5b–5c | iPhone 15 | DE · hell | K-NAME, K-ERKLAER | «Mein langer Spitzname wird oben abgeschnitten.» | 3 |
| 107 | Anna | 60 | Juristin/Jurist | 5b–5c | älteres Android | DE · auto | K-GAST, K-DUNKEL | «Ohne Konto die Wand anschauen ist super, so probier ich's erst mal.» | 4 |
| 108 | Tim | 42 | Tourist/in (Englisch) | 6b–6c | iPhone SE | EN · dunkel | K-KLEIN, K-NOCHNICHT | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 109 | Gian | 39 | Expat (Englisch), Pharma Basel/Zürich | 7c+ | Pixel 7 | EN · dunkel | K-EN, K-LOG | «I picked the gym on a German map sheet. Fine, but 'In meiner Nähe' I had to guess.» | 3 |
| 110 | Jonas | 66 | Rentner/in | 5b–5c | Pixel 7 | DE · dunkel | K-SICHT, K-ICH | «Im Dunkelmodus kann ich besser lesen, das Licht in der Halle blendet weniger.» | 3 |
| 111 | Sofia | 35 | Grafik/Design | 7a–7b | iPhone SE | DE · auto | K-KLEIN, K-GRUPPE | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 112 | Robin | 36 | Elektroinstallateur/in | 6a–6a+ | Xiaomi | DE · dunkel | K-LOG, K-NAME | «Top loggen geht schneller als Schuhe ausziehen. Das bleibt.» | 4 |
| 113 | Andrin | 59 | Juristin/Jurist | 5b–5c | iPhone SE | DE · dunkel | K-KLEIN, K-ICH | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 114 | Elena | 51 | Landwirt/in | 7a–7b | iPhone 15 | DE · dunkel | K-GAST, K-EN | «Bis ich als Gast an der Wand war: Hallen ansehen, Karte, Zur Wand. Ein Schritt zu viel, aber okay.» | 3 |
| 115 | Levin | 31 | Software-Entwicklung | 7a–7b | Xiaomi | DE · auto | K-NAME, K-LOG | «Der Hallenname ist so lang, dass er oben nur halb passt.» | 4 |
| 116 | Urs | 55 | Pflegefachperson, Schichtdienst | Anfänger (4–5a) | Fairphone | DE · hell | K-TREFF, K-NAME | «Treff ist gut, wenn man neu in der Stadt ist.» | 3 |
| 117 | Selin | 54 | Sozialarbeit | 6b–6c | iPhone 13 mini | DE · dunkel | K-KLEIN, K-CHALL | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 118 | Florian | 42 | Polizist/in | 6a–6a+ | Xiaomi | DE · hell | K-TREFF, K-MELDEN | «Treff ist gut, wenn man neu in der Stadt ist.» | 3 |
| 119 | Liam | 26 | Logistik/Lager | 6a–6a+ | iPhone 13 mini | DE · hell | K-KLEIN, K-NAME | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 120 | Werner | 38 | Gastronomie/Barista | 7c+ | Xiaomi | DE · dunkel | K-GAST, K-MELDEN | «Ohne Konto die Wand anschauen ist super, so probier ich's erst mal.» | 4 |
| 121 | Stefan | 57 | KV / Büro | 7a–7b | Pixel 7 | DE · auto | K-NAME, K-NOCHNICHT | «Mein langer Spitzname wird oben abgeschnitten.» | 3 |
| 122 | Priya | 43 | Sozialarbeit | 6b–6c | iPhone 15 | DE · hell | K-GAST, K-TREFF | «Ohne Konto die Wand anschauen ist super, so probier ich's erst mal.» | 4 |
| 123 | Blerina | 65 | Rentner/in | 6a–6a+ | iPhone SE | DE · hell | K-KLEIN, K-DUNKEL | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 124 | Mei | 35 | KV / Büro | 5b–5c | Xiaomi | DE · dunkel | K-GAST, K-SICHT | «Ohne Konto die Wand anschauen ist super, so probier ich's erst mal.» | 3 |
| 125 | Ivan | 24 | Gastronomie/Barista | 5b–5c | iPhone 13 mini | DE · dunkel | K-KLEIN, K-DUNKEL | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 126 | Kenji | 41 | Grafik/Design | 7c+ | älteres Android | DE · dunkel | K-GAST, K-CHALL | «Bis ich als Gast an der Wand war: Hallen ansehen, Karte, Zur Wand. Ein Schritt zu viel, aber okay.» | 4 |
| 127 | Patrick | 29 | Physiotherapie | 7a–7b | iPhone 15 | DE · dunkel | K-KLEIN, K-SICHT | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 2 |
| 128 | Pascal | 47 | Sozialarbeit | 5b–5c | Pixel 7 | DE · hell | K-CHALL, K-MELDEN | «Die Challenge heute hat mich an eine 6a+ gebracht, die ich nie probiert hätte.» | 4 |
| 129 | Brigitte | 40 | Landwirt/in | 7a–7b | Samsung A-Serie | DE · auto | K-NAME, K-CHALL | «Mein langer Spitzname wird oben abgeschnitten.» | 4 |
| 130 | Ethan | 33 | Tourist/in (Englisch) | Anfänger (4–5a) | Xiaomi | EN · auto | K-CHALL, K-ERKLAER | «Die Challenge heute hat mich an eine 6a+ gebracht, die ich nie probiert hätte.» | 4 |
| 131 | Nico | 56 | Bauingenieur/in | 6b–6c | Xiaomi | DE · auto | K-LOG, K-NAME | «Zwei Taps und weg, genau so. Mit Kreide an den Fingern zählt jeder Tap.» | 4 |
| 132 | Yuki | 32 | Elektroinstallateur/in | 6a–6a+ | iPhone SE | DE · auto | K-KLEIN, K-ICH | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 2 |
| 133 | Sofia | 38 | Expat (Englisch), Pharma Basel/Zürich | Anfänger (4–5a) | Samsung A-Serie | EN · dunkel | K-ERKLAER, K-ICH | «Die Erklärkarte beim ersten Loggen ist okay, aber sie schiebt die Knöpfe nach unten. Beim zweiten Mal will ich sie nicht mehr sehen.» | 3 |
| 134 | Patrick | 33 | Sozialarbeit | 5b–5c | älteres Android | DE · hell | K-GRUPPE, K-TREFF | «Gruppe erstellen für die Kletter-AG: genau das hat gefehlt.» | 4 |
| 135 | Nathalie | 44 | Polizist/in | 6b–6c | älteres Android | DE · hell | K-ICH, K-NAME | «Ich hätte gern einen Verlauf über Wochen, nicht nur Gesamtzahlen.» | 4 |
| 136 | Kenji | 29 | Software-Entwicklung | Anfänger (4–5a) | Fairphone | EN · dunkel | K-EN, K-NAME | «The wall is in English, but 'Halle wählen' and 'Zur Wand' are not. That's the first screen a tourist sees.» | 2 |
| 137 | Emma | 27 | Gastronomie/Barista | 7c+ | iPhone 15 | DE · hell | K-MELDEN, K-KLEIN | «Dass man jemanden melden und ausblenden kann, beruhigt mich.» | 3 |
| 138 | Ethan | 47 | Elektroinstallateur/in | 5b–5c | Samsung A-Serie | DE · auto | K-CHALL, K-MELDEN | «Challenge ist nett, aber ich will nicht jeden Tag einen Streifen an der Wand.» | 4 |
| 139 | Lara | 44 | Sozialarbeit | Anfänger (4–5a) | iPad | DE · hell | K-GAST, K-ICH | «Bis ich als Gast an der Wand war: Hallen ansehen, Karte, Zur Wand. Ein Schritt zu viel, aber okay.» | 4 |
| 140 | Pascal | 32 | Kita-Betreuung | 6a–6a+ | iPhone 13 mini | DE · hell | K-KLEIN, K-MELDEN | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 2 |
| 141 | Arben | 33 | Mutter/Vater mit Kindern | Anfänger (4–5a) | Pixel 7 | EN · dunkel | K-EN, K-LOG | «The wall is in English, but 'Halle wählen' and 'Zur Wand' are not. That's the first screen a tourist sees.» | 3 |
| 142 | Chiara | 49 | Elektroinstallateur/in | 6a–6a+ | iPhone SE | DE · dunkel | K-KLEIN, K-SICHT | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 2 |
| 143 | Yannick | 24 | Kita-Betreuung | 5b–5c | iPad | DE · hell | K-SICHT, K-MELDEN | «Der weiße Farbpunkt verschwindet im hellen Modus fast.» | 3 |
| 144 | Tamara | 33 | Musiker/in | Anfänger (4–5a) | iPhone 13 mini | DE · auto | K-KLEIN, K-ERKLAER | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 145 | Ruth | 37 | Gastronomie/Barista | Anfänger (4–5a) | Xiaomi | DE · hell | K-ICH, K-DUNKEL | «Ich hätte gern einen Verlauf über Wochen, nicht nur Gesamtzahlen.» | 4 |
| 146 | Julia | 45 | Sozialarbeit | 7a–7b | iPhone 13 mini | DE · auto | K-KLEIN, K-GAST | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 147 | Margrit | 35 | Physiotherapie | Anfänger (4–5a) | iPhone 15 | DE · hell | K-ICH, K-GAST | «Tops, Flash-Quote, bester Grad – drei Zahlen, mehr brauche ich nicht.» | 4 |
| 148 | Jana | 49 | Landwirt/in | 6b–6c | iPhone 13 mini | DE · auto | K-KLEIN, K-LOG | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 149 | Yuki | 18 | Lernende/r (Lehre) | 7c+ | Fairphone | DE · dunkel | K-KLEIN, K-DUNKEL | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 150 | Hiroshi | 42 | Physiotherapie | 5b–5c | iPhone 15 | DE · dunkel | K-ICH, K-CHALL | «Tops, Flash-Quote, bester Grad – drei Zahlen, mehr brauche ich nicht.» | 4 |
| 151 | Kenji | 50 | Juristin/Jurist | 6b–6c | iPad | DE · dunkel | K-LOG, K-CHALL | «Rückgängig im Toast hat mich gerettet, ich hatte Flash statt Top erwischt.» | 4 |
| 152 | Mia | 52 | Schreiner/in | 7a–7b | Xiaomi | DE · dunkel | K-ICH, K-LOG | «Ich hätte gern einen Verlauf über Wochen, nicht nur Gesamtzahlen.» | 4 |
| 153 | Pascal | 36 | Landwirt/in | 7c+ | iPad | EN · dunkel | K-ERKLAER, K-NAME | «Die Erklärkarte beim ersten Loggen ist okay, aber sie schiebt die Knöpfe nach unten. Beim zweiten Mal will ich sie nicht mehr sehen.» | 3 |
| 154 | Kenji | 32 | Logistik/Lager | Anfänger (4–5a) | Fairphone | DE · auto | K-SICHT, K-ICH | «Pin-Nummern auf dem Foto sind für meine Augen grenzwertig klein.» | 3 |
| 155 | Kerem | 45 | Schreiner/in | 6a–6a+ | Samsung A-Serie | DE · dunkel | K-NOCHNICHT, K-GRUPPE | «Halle empfehlen mit 30 % Dankeschön? Klingt nach Werbung, ich würd's trotzdem weitersagen.» | 4 |
| 156 | Sandra | 48 | Polizist/in | 5b–5c | iPhone 15 | DE · hell | K-NAME, K-GAST | «Der Hallenname ist so lang, dass er oben nur halb passt.» | 3 |
| 157 | Robin | 19 | Lernende/r (Lehre) | 7c+ | Fairphone | DE · hell | K-GRUPPE, K-ICH | «Gruppe erstellen für die Kletter-AG: genau das hat gefehlt.» | 4 |
| 158 | Ivan | 40 | Mutter/Vater mit Kindern | 6b–6c | iPad | DE · auto | K-NAME, K-GAST | «Mein langer Spitzname wird oben abgeschnitten.» | 3 |
| 159 | Priya | 23 | Musiker/in | 6a–6a+ | Samsung A-Serie | DE · auto | K-SICHT, K-ERKLAER | «Der weiße Farbpunkt verschwindet im hellen Modus fast.» | 3 |
| 160 | David | 29 | Lehrperson Primarschule | 5b–5c | iPad | DE · auto | K-TREFF, K-SICHT | «Treff ist gut, wenn man neu in der Stadt ist.» | 3 |
| 161 | Jan | 53 | Juristin/Jurist | 7c+ | Pixel 7 | DE · dunkel | K-CHALL, K-ERKLAER | «Woher weiß die App, dass mir Technik nicht liegt? Das Fragezeichen hat's erklärt, gut.» | 4 |
| 162 | Aleksandra | 43 | Software-Entwicklung | 7c+ | iPad | DE · auto | K-NAME, K-MELDEN | «Der Hallenname ist so lang, dass er oben nur halb passt.» | 3 |
| 163 | Ingrid | 26 | Tourist/in (Englisch) | Anfänger (4–5a) | Fairphone | EN · dunkel | K-EN, K-GAST | «The wall is in English, but 'Halle wählen' and 'Zur Wand' are not. That's the first screen a tourist sees.» | 3 |
| 164 | Alina | 66 | Rentner/in | 5b–5c | älteres Android | DE · dunkel | K-GRUPPE, K-CHALL | «Gruppe erstellen für die Kletter-AG: genau das hat gefehlt.» | 4 |
| 165 | Pascal | 50 | Juristin/Jurist | 5b–5c | älteres Android | EN · dunkel | K-EN, K-ICH | «Tab says 'Meet', settings below say 'Treff ausblenden'. Feels half done.» | 3 |
| 166 | Arben | 28 | Gastronomie/Barista | Anfänger (4–5a) | Fairphone | DE · auto | K-SICHT, K-NOCHNICHT | «Pin-Nummern auf dem Foto sind für meine Augen grenzwertig klein.» | 3 |
| 167 | Thomas | 27 | Landwirt/in | 5b–5c | iPhone 13 mini | EN · hell | K-EN, K-TREFF | «Tab says 'Meet', settings below say 'Treff ausblenden'. Feels half done.» | 2 |
| 168 | Nina | 25 | Software-Entwicklung | 5b–5c | iPhone SE | DE · auto | K-KLEIN, K-ERKLAER | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 169 | Zoe | 48 | KV / Büro | 6a–6a+ | Xiaomi | DE · hell | K-CHALL, K-GAST | «Challenge ist nett, aber ich will nicht jeden Tag einen Streifen an der Wand.» | 4 |
| 170 | Sven | 23 | Studentin/Student ETH oder ZHAW | Anfänger (4–5a) | Xiaomi | DE · auto | K-GAST, K-TREFF | «Ohne Konto die Wand anschauen ist super, so probier ich's erst mal.» | 3 |
| 171 | Lucía | 31 | Sozialarbeit | 6a–6a+ | Samsung A-Serie | DE · hell | K-CHALL, K-SICHT | «Woher weiß die App, dass mir Technik nicht liegt? Das Fragezeichen hat's erklärt, gut.» | 4 |
| 172 | Julia | 19 | Studentin/Student ETH oder ZHAW | 5b–5c | Samsung A-Serie | DE · auto | K-MELDEN, K-TREFF | ««Fair bleiben» als Regel ist kurz und klar.» | 4 |
| 173 | Ayla | 30 | Gastronomie/Barista | Anfänger (4–5a) | iPhone SE | DE · dunkel | K-KLEIN, K-ICH | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 2 |
| 174 | Elena | 40 | Pflegefachperson, Schichtdienst | 7c+ | iPad | DE · hell | K-DUNKEL, K-ERKLAER | «Dunkelmodus schaltet von allein um, sieht ruhig aus.» | 4 |
| 175 | Beat | 50 | Schreiner/in | 7a–7b | iPhone 15 | DE · hell | K-CHALL, K-LOG | «Woher weiß die App, dass mir Technik nicht liegt? Das Fragezeichen hat's erklärt, gut.» | 4 |
| 176 | Luca | 22 | Gastronomie/Barista | 7a–7b | iPhone 15 | DE · auto | K-KLEIN, K-GRUPPE | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 177 | Samuel | 28 | Elektroinstallateur/in | 7c+ | Xiaomi | DE · dunkel | K-SICHT, K-DUNKEL | «Im Dunkelmodus kann ich besser lesen, das Licht in der Halle blendet weniger.» | 4 |
| 178 | Sven | 38 | Gastronomie/Barista | 5b–5c | iPhone 13 mini | DE · dunkel | K-KLEIN, K-CHALL | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 179 | Corinne | 35 | Grafik/Design | 6b–6c | älteres Android | DE · hell | K-DUNKEL, K-ERKLAER | «Dunkelmodus schaltet von allein um, sieht ruhig aus.» | 4 |
| 180 | Mei | 45 | Musiker/in | Anfänger (4–5a) | Xiaomi | DE · hell | K-MELDEN, K-GRUPPE | ««Fair bleiben» als Regel ist kurz und klar.» | 4 |
| 181 | Leon | 38 | Software-Entwicklung | 5b–5c | iPhone 13 mini | DE · dunkel | K-KLEIN, K-SICHT | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 2 |
| 182 | Leonie | 37 | Sozialarbeit | 6b–6c | Pixel 7 | DE · hell | K-CHALL, K-NAME | «Challenge ist nett, aber ich will nicht jeden Tag einen Streifen an der Wand.» | 4 |
| 183 | Tamara | 49 | Schreiner/in | 6b–6c | Pixel 7 | DE · auto | K-GRUPPE, K-GAST | «Dass die Trainerin meine Tops sieht, steht beim Beitreten. Fair.» | 4 |
| 184 | Elif | 20 | Medizinstudent/in | Anfänger (4–5a) | iPhone 15 | DE · auto | K-KLEIN, K-ERKLAER | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 2 |
| 185 | Sara | 55 | Bauingenieur/in | Anfänger (4–5a) | iPhone SE | DE · dunkel | K-KLEIN, K-LOG | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 186 | Kevin | 28 | Gastronomie/Barista | 7a–7b | älteres Android | DE · hell | K-MELDEN, K-GRUPPE | «Dass man jemanden melden und ausblenden kann, beruhigt mich.» | 4 |
| 187 | Ömer | 27 | Studentin/Student ETH oder ZHAW | 6b–6c | älteres Android | DE · hell | K-LOG, K-CHALL | «Top loggen geht schneller als Schuhe ausziehen. Das bleibt.» | 4 |
| 188 | Samuel | 36 | Lehrperson Primarschule | 7c+ | Xiaomi | DE · auto | K-GRUPPE, K-CHALL | «Gruppe erstellen für die Kletter-AG: genau das hat gefehlt.» | 4 |
| 189 | Jan | 33 | Sozialarbeit | Anfänger (4–5a) | Samsung A-Serie | DE · auto | K-KLEIN, K-ICH | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 190 | Chiara | 27 | Landwirt/in | 6a–6a+ | Samsung A-Serie | DE · hell | K-NOCHNICHT, K-DUNKEL | «Halle empfehlen mit 30 % Dankeschön? Klingt nach Werbung, ich würd's trotzdem weitersagen.» | 4 |
| 191 | Marco | 70 | Rentner/in | 5b–5c | Samsung A-Serie | DE · hell | K-DUNKEL, K-GRUPPE | «Hell und dunkel sehen beide aufgeräumt aus, nur Hallenfarben sind bunt. Schön.» | 4 |
| 192 | Aleksandra | 28 | Pflegefachperson, Schichtdienst | 6b–6c | Xiaomi | DE · auto | K-NOCHNICHT, K-LOG | «Halle empfehlen mit 30 % Dankeschön? Klingt nach Werbung, ich würd's trotzdem weitersagen.» | 4 |
| 193 | Fabio | 37 | Elektroinstallateur/in | Anfänger (4–5a) | iPhone 15 | DE · auto | K-NAME, K-KLEIN | «Der Hallenname ist so lang, dass er oben nur halb passt.» | 3 |
| 194 | Robin | 47 | KV / Büro | 7a–7b | iPhone SE | DE · dunkel | K-KLEIN, K-NOCHNICHT | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 195 | Beat | 27 | Sozialarbeit | 6b–6c | Fairphone | DE · auto | K-MELDEN, K-ERKLAER | «Dass man jemanden melden und ausblenden kann, beruhigt mich.» | 3 |
| 196 | Ethan | 63 | Rentner/in | 6a–6a+ | älteres Android | DE · hell | K-ERKLAER, K-DUNKEL | ««Flash, Top, Projekt» erklärt – gut für Anfänger, ich hab's sofort verstanden.» | 3 |
| 197 | Mia | 70 | Rentner/in | 6a–6a+ | Samsung A-Serie | DE · auto | K-ICH, K-LOG | ««Pro Halle» ist praktisch, ich klettere in Winterthur und Zürich.» | 4 |
| 198 | Adrian | 53 | Bauingenieur/in | 5b–5c | iPhone SE | DE · hell | K-KLEIN, K-NAME | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 2 |
| 199 | Corinne | 39 | Sozialarbeit | 5b–5c | iPhone 13 mini | DE · dunkel | K-KLEIN, K-MELDEN | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 200 | Lara | 40 | Lehrperson Primarschule | Anfänger (4–5a) | Pixel 7 | DE · auto | K-KLEIN, K-NOCHNICHT | «Auf dem kleinen iPhone sind die Knöpfe über dem Wandfoto Fummelarbeit.» | 3 |
| 201 | Yannick | 51 | Schreiner/in | 6b–6c | iPhone 15 | DE · auto | K-LOG, K-DUNKEL | «Rückgängig im Toast hat mich gerettet, ich hatte Flash statt Top erwischt.» | 5 |
| 202 | Sabrina | 36 | Gastronomie/Barista | 6b–6c | Fairphone | DE · hell | K-TREFF, K-DUNKEL | «Ich will nicht, dass Fremde sehen, wann ich in der Halle bin. Gut, dass man's ausblenden kann.» | 4 |
| 203 | Fabio | 45 | Bauingenieur/in | 7a–7b | iPhone 13 mini | DE · auto | K-KLEIN, K-NAME | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 2 |
| 204 | Werner | 20 | Studentin/Student ETH oder ZHAW | 6b–6c | iPhone SE | DE · hell | K-KLEIN, K-ICH | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 205 | Monika | 37 | Kita-Betreuung | 5b–5c | Pixel 7 | EN · dunkel | K-MELDEN, K-NOCHNICHT | «Dass man jemanden melden und ausblenden kann, beruhigt mich.» | 4 |
| 206 | Florian | 26 | Studentin/Student ETH oder ZHAW | 7c+ | Fairphone | EN · auto | K-CHALL, K-ICH | «Challenge ist nett, aber ich will nicht jeden Tag einen Streifen an der Wand.» | 4 |
| 207 | Aleksandra | 60 | KV / Büro | 5b–5c | Pixel 7 | DE · dunkel | K-CHALL, K-ICH | «Die Challenge heute hat mich an eine 6a+ gebracht, die ich nie probiert hätte.» | 4 |
| 208 | Dominik | 42 | Musiker/in | 5b–5c | iPhone 13 mini | EN · dunkel | K-KLEIN, K-LOG | «Die Lupe und das Vollbild oben im Foto sind winzig, mit Kreide treff ich die nicht.» | 3 |
| 209 | Ivan | 34 | Sozialarbeit | 5b–5c | älteres Android | DE · dunkel | K-SICHT, K-DUNKEL | «Im Dunkelmodus kann ich besser lesen, das Licht in der Halle blendet weniger.» | 4 |
| 210 | Thomas | 20 | Tourist/in (Englisch) | 7c+ | Samsung A-Serie | EN · dunkel | K-EN, K-ICH | «The wall is in English, but 'Halle wählen' and 'Zur Wand' are not. That's the first screen a tourist sees.» | 3 |

## Gespräche

Die Runde war zu groß für einen Tisch. Deshalb gab es vier Gespräche: Admins, Schrauber, Kletterer (zwei Tische à 60) und zum Schluss ein Plenum mit Vertretungen aus allen Gruppen. Die Nummer in Klammern verweist auf die Tabelle oben. Alle Aussagen beziehen sich auf Bildschirme, die im Testlauf tatsächlich so zu sehen waren (Stand 62839c5).

### Gespräch 1: Admins (30)

**Petra (8, Inhaberin, 65):** Ich fang an. Bereich wählen, Hallen-Administration, dann Sektoren, Farben, Team, Halle, Zahlen. Fünf Reiter, die Namen stimmen. Am Laptop finde ich alles.

**Corinne (7, Hallenleitung):** Am Laptop ja. Ich hab's auf dem Handy gemacht, im Gang zwischen zwei Kursen. Beim «Arbeitsbereich wählen» liegt unten links dieser Knopf «Ansehen als …» genau auf der Karte «Hallen-Administration». Ich hab zweimal auf «Ansehen als» getippt statt auf Admin.

**Laura (21, Inhaberin, nur Handy):** Bei mir genau gleich. Und die kleinen Pfeile rechts stehen über den Kartenrand hinaus. Sieht kaputt aus, auch wenn's funktioniert.

**Ethan (29, Hallenleitung):** «Ansehen als» sehen ja nur Plattform-Admins, oder? Dann trifft's euch Inhaber, die das haben, nicht die normale Thekenkraft.

**Ruth (22, Administration):** Ich hab's trotzdem gesehen. Für mich war nicht klar, wofür das Auge ist.

**Mei (9, Buchhaltung):** Zu «Zahlen»: 15 Boulder, 7 Begehungen, 0 Kletterer in 30 Tagen. Wie geht das zusammen? Ich würde das so in den Monatsbericht schreiben und mich blamieren.

**Pascal (20, Administration):** Die Begehungen zählen wohl alles, die Kletterer nur die letzten 30 Tage. Steht aber nirgends. Jede Kachel braucht ihren Zeitraum.

**Leon (3, Social Media):** Mir gefällt «Zahlen» trotzdem. «Rot: 6 Boulder, 5,0 Sterne, meist Fair» ist Material für Instagram.

**Fabio (26, Hallenleitung):** Und «Noch zu wenige Bewertungen (ab 3 pro Boulder)» ist ehrlich. Lieber das als ausgedachte Durchschnitte.

**Sofia (2, Vorstand Verein):** Schrauber-Auswertung. Ich sag's offen: Das ist Personalbewertung. Bei uns im Verein schrauben Freiwillige. Wenn da eine Rangliste steht, schraubt nächstes Jahr keiner mehr.

**Amara (6, Hallenleitung):** Es ist keine Rangliste, es sind Zahlen pro Person. Für die Planung brauch ich das: Wer schraubt nur Gelb, wo fehlt Blau?

**Fabio (11, Vorstand):** Dann bitte so, dass man es im Gespräch zeigt und nicht an die Wand hängt. Und die Schrauber sollten ihre eigenen Zahlen zuerst sehen.

**Simon (18, Theke, 22):** Die sehen sie doch in «Meine Routen». Hab ich bei meinem Kollegen gesehen.

**Grace (5, Hallenleitung):** Treff pro Halle an- und abschalten, gut. Auslastung melden, «Ruhig, Normal, Viel los», gilt 90 Minuten. Das macht die Theke in zwei Sekunden.

**Ayla (25, Schichtleitung):** Machen wir, wenn's an der Theke einen festen Ort dafür gibt. Am PC bin ich nicht im Admin-Bereich eingeloggt, sondern in der Kasse.

**Amara (6):** QR-Aufkleber pro Sektor: das ist der Knopf, den ich als Erstes benutze.

**Grace (16, Vorstand):** Ja. Ausdrucken, aufkleben, fertig. Kein Erklärzettel nötig.

**Fabio (4, Schichtleitung):** KI aus dem Sektorfoto. Der Text sagt ehrlich: Google Gemini im Pilot, nicht fürs Training, ohne Personen fotografieren. Das kann ich so dem Datenschutz zeigen.

**Anna (15, Inhaberin):** Ich schalte es erst ein, wenn meine Schrauber es zwei Wochen getestet haben. Bei uns ist es aus, und das ist richtig so.

**Stefan (17, Administration):** Und wer zahlt die KI? Steht nirgends.

**Arben (10, Buchhaltung):** Farben-Reiter: «Blau · Gemütlich, Grün · Flott, Weiss · Böse». Unsere Gäste lachen darüber. Bleibt.

**Kenji (23, Vorstand):** Empfehlung mit 30 % Dankeschön. Wer bekommt das, wer zahlt das? Ich will das vor dem Start schriftlich.

**Laura (21):** Und die Wunschliste «Noch nicht dabei» ist gratis Marktforschung für uns. Ich will sehen, wie viele Leute meine Halle wünschen, bevor ich unterschreibe.

**Ömer (24, Vorstand, 61):** Meldungen prüfen und Personen sperren: Muss sein, sonst kommen wir in Teufels Küche. Ich will aber eine Mail, wenn etwas gemeldet wird.

**Fatima (1, Kinderklettern):** Bei mir geht's um Kinder. Treff erst ab 16, gut. Gruppen für Kurse, gut. Mehr brauch ich nicht.

**Yuki (14, Vorstand, Englisch):** For me the admin area is German, which is fine for staff. But our guests are half international, and the gym chooser on the first screen is German too.

**Sofia (19, Social Media, Englisch):** Same. The climbers' part is English, the map sheet isn't. That's the first thing a tourist touches.

**Dragan (12, Technik):** Ich bin Haustechnik. Für mich wichtig: «Standort auf der Karte» mit Pin verschieben. Ging. Mehr will ich nicht anfassen.

**Elena (13, Theke, 25):** Die Plus/Minus-Knöpfe auf der Karte sind winzig, aber wer zoomt schon am Tresen.

**Dragan (30, Inhaber, nur Handy):** Ich mache alles am Handy. Admin auf dem Handy geht, bis auf das «Ansehen als» über der Karte. Das muss weg oder nach oben.

**Vanessa (27, Social Media):** Und die Hallennamen sind lang. «6a plus Kletter- & Boulderhalle Winterthur» passt nirgends ganz. Ein Kurzname pro Halle wäre gut.

### Gespräch 2: Schrauber (60)

**Corinne (34, Chefschrauberin):** Studio öffnen, Halle wählen, Wand antippen, Boulder erfassen. Der Ablauf ist schnell. Unten zählt die Leiste «neu, geändert, archiviert» mit. Das mag ich.

**Andrin (36, Polymechaniker, iPhone SE):** Auf meinem SE ist rechts neben «archiviert» ein grauer Knopf halb abgeschnitten. Das ist Speichern. Ich hab zuerst gedacht, es gibt keinen.

**Grace (35, Zimmerin, iPhone SE):** Genau. Ich hab gesucht, nach links gewischt, nichts. Erst im Querformat hab ich ihn gesehen.

**Werner (40, Verein, 55):** Ich auch. Wenn Speichern nicht sichtbar ist, verliere ich nach einer Stunde Arbeit alles. Das ist für mich das Wichtigste aus dem ganzen Test.

**Sandra (78, Chefschrauberin, iPhone SE):** Ich hab ein kleines Handy, weil es in die Hosentasche an der Leiter passt. Das sollte die App aushalten.

**Silvan (74, Chefschrauber):** Auf meinem Samsung ist er auch halb weg. «Speicher…» und «Veröffentl…» stehen am Rand. Ich finde ihn nur, weil ich weiß, dass er da ist.

**Samuel (38, Ex-Wettkampf):** Die Sektor-Chips sind rund 30 Pixel hoch. Mit Handschuhen auf der Leiter treffe ich «Ecke Mitte» statt «Ecke Vorne».

**Lea (54, Zimmerin):** Und oben rechts der «Wand»-Zurück-Knopf und das Ebenen-Symbol sind kleiner als mein Daumennagel.

**Jana (32, Studentin):** «Batch-Schraubermodus» steht als Überschrift. Sagt bei uns keiner. «Routen erfassen» reicht.

**Ivan (33, Verein):** Wand auswählen & Boulder erfassen ist eh schon die Überschrift. Das Wort drüber ist doppelt.

**Daniel (59, Ex-Wettkampf):** Mir egal, wie es heißt. Ich will, dass es schnell ist. Ist es.

**Michelle (79, Zimmerin):** Umbau ankündigen. Endlich wissen die Kletterer, wann die Wand neu ist, und fragen nicht mich an der Leiter.

**Pascal (80, Ex-Wettkampf):** «Wand neu schrauben» archiviert alles Alte auf einmal. Spart mir die halbe Stunde, in der ich früher jeden Boulder einzeln weggeklickt habe.

**Brigitte (46, Zimmerin):** «Meine Routen» zeigt, welche Routen gut ankommen. Ich hab mich über 4,5 Sterne gefreut wie ein Kind.

**Laura (76, Verein):** Und wenn's 2 Sterne sind? Dann will ich wissen, warum. Ein Satz von Kletterern wäre gut, nicht nur Sterne.

**Sandra (60, Trainerin):** Solange der Chef das nicht als Leistungsnachweis nimmt.

**Corinne (34):** Als Chefin sag ich: Ich nehm's als Gesprächsanlass. Aber ich versteh die Angst.

**Dominik (31, Verein, 65):** KI aus dem Sektorfoto. Ich bin skeptisch. Ein Grad aus einer Griff-Farbe, das kann auch schief gehen.

**Alina (37, Verein):** Darum steht ja «Prüfen» davor. Ich will's im Pilot probieren, bei uns ist's noch aus.

**Reto (63, Lernender, 19):** Ich fänd's super. Ich bin neu und brauch für jede Route ewig.

**Lina (39, Trainerin):** Fotos unter den Strahlern sind oft überbelichtet. Wenn die KI daraus Farben liest, wird Gelb zu Weiß.

**Leonie (64, Lernende):** Pins setzen auf dem Foto klappt. Zoom könnte größer, ich treff die kleinen Griffe nicht.

**Ana (43, Freelance, Englisch):** The studio is only German. I set in four gyms in three countries. I can guess most of it, my colleagues from Spain can't.

**Andrin (49, Freelance, Englisch):** 'Umbau ankündigen' I had to ask. Everything else I figured out from the icons.

**Elif (62, Polymechanikerin, Englisch):** I don't need full English. Just the five main buttons.

**Ruedi (89, Zimmermann, Englisch):** Honestly, the climbers need English more than we do.

**Sara (90, Chefschrauberin):** Da stimme ich zu. Erst Kletterer fertig übersetzen, dann Studio.

**Jasmin (44, Lernende, 21):** Mir hat geholfen, dass Kletterer-App, Studio und Admin klar getrennt sind. Ich bin nicht aus Versehen in der Hallenverwaltung gelandet.

**Matteo (82, Lernender, iPhone SE):** Außer dass ich Speichern nicht gefunden habe. Siehe oben.

**Luis (83, Student, iPhone SE):** Ich hab's gefunden, weil ich gezoomt habe. Das macht kein Mensch an der Leiter.

**Jonas (81, Verein, 59):** Ich brauch das Studio auch am iPad, und da ist alles gut. Aber an der Wand hab ich das Handy.

**Nina (87, Zimmerin):** Mir fehlt eine Rückmeldung nach dem Speichern, die man auch im Lärm sieht. Ein grüner Haken reicht.

### Gespräch 3: Kletterer, Tisch A (60)

**Yannick (201, Schreiner):** Ich bin direkt los: Hans-Testkonto, Wand, Route antippen, Top. Zwei Taps. So muss das.

**Aleksandra (192, Pflege, Schichtdienst):** Und Rückgängig im Toast. Ich hatte Flash statt Top. Ein Tap, korrigiert.

**Tamara (144, Musikerin, iPhone 13 mini):** Beim ersten Loggen kommt die Erklärkarte «Flash, Top, Projekt» mit «Verstanden». Gut, aber sie schiebt die drei Knöpfe ganz nach unten. Auf meinem kleinen Handy musste ich scrollen.

**Nina (168, Software, iPhone SE):** Bei mir auch. Einmal ist okay. Beim zweiten Mal kam sie zum Glück nicht mehr.

**Beat (195, Sozialarbeit):** Als Anfänger fand ich sie super. Ich wusste nicht, was Flash heißt.

**Werner (204, Student, iPhone SE):** Die Knöpfe oben im Wandfoto, Lupe plus, Lupe minus, Vollbild, sind 28 Pixel. Mit Kreide treffe ich die nicht.

**Adrian (198, Bauingenieur, iPhone SE):** Und das Logo oben links ist nur 28 breit. Ich wollte zur Startseite und hab den Hallen-Pfeil erwischt.

**Blerina (123, Rentnerin, 65, iPhone SE):** Ich sehe nicht mehr so gut. Die Pin-Nummern auf dem Foto sind grenzwertig. Im Dunkelmodus geht's besser.

**Priya (159, Musikerin):** Weiß als Hallenfarbe ist im hellen Modus kaum zu sehen, der Rand ist sehr blass.

**Samuel (177, Elektriker):** Dunkelmodus schaltet von allein, sieht ruhig aus. Ich klettere abends, das passt.

**Jan (189, Sozialarbeit):** «Ich» zeigt drei Zahlen: Tops, Flash-Quote, bester Grad. Mehr will ich nicht wissen.

**Hiroshi (150, Physiotherapie):** Ich schon. Ich will sehen, ob ich in drei Monaten besser geworden bin. Ein Verlauf fehlt mir.

**Margrit (147, Physiotherapie):** «Pro Halle» ist gut. Ich klettere in Winterthur und in Zürich.

**Lucía (171, Sozialarbeit):** Die Challenge heute hat mich an eine 6a+ gebracht, die ich nie probiert hätte. Begründung: «Liegt dir: Dynamik».

**Ethan (138, Elektriker):** Ich will aber nicht jeden Tag einen Streifen an der Wand. Gut, dass man ihn in den Einstellungen abschalten kann.

**Aleksandra (207, KV, 60):** Das Fragezeichen neben der Challenge hat mir erklärt, wie sie gewählt wird. Sonst hätte ich gedacht, die App will mich verkaufen.

**Kenji (126, Grafik):** Ich bin als Gast rein: «Hallen ansehen», Karte, Halle antippen, «Zur Wand». Das war ein Schritt zu viel, aber ohne Konto die Wand sehen ist stark.

**Werner (120, Barista):** Mich hat beim Gast-Modus beeindruckt, dass erst beim Loggen nach Anmeldung gefragt wird.

**Sandra (156, Polizistin):** Mein Spitzname ist lang, oben wird er abgeschnitten. Der Hallenname auch. «6a plus Kletter- & B…» Man weiß, was gemeint ist.

**Nathalie (135, Polizistin):** Ich finde das nicht schlimm. Lieber abgeschnitten als zwei Zeilen.

**Brigitte (129, Landwirtin):** Ich hab die Challenge erst nach fünf Tops bekommen. Vorher stand da nichts. Ein Satz «ab 5 Tops» wäre nett.

**Mira (93, Musikerin):** Mir gefällt, dass die Hallenfarben das einzig Bunte sind. Der Rest ist ruhig.

**Tamara (183, Schreinerin):** Gruppen. Ich trainiere die Jugend am Mittwoch. «Gruppe erstellen», Code teilen, fertig. Und beim Beitreten steht, dass ich ihre Tops sehe. Fair.

**Kevin (186, Barista):** Melden und Ausblenden in den Einstellungen unter «Sicherheit». Ich musste es nicht nutzen, aber ich weiß, wo es ist.

**Mei (180, Musikerin):** «Fair bleiben» als Regel, ein Satz, ein Link. Mehr braucht's nicht.

**Selin (117, Sozialarbeit, iPhone 13 mini):** Kleine Knöpfe sind mein Thema. Sonst ist es die aufgeräumteste Kletter-App, die ich kenne.

### Gespräch 4: Kletterer, Tisch B (60), mit allen Englischsprachigen

**Kerem (102, Tourist):** I switched my phone to English. The wall, the sheet, "Me", the settings: all English. Good.

**Mei (105, Expat, Pharma):** But the very first sheet, "Halle wählen", "Halle oder Ort", "In meiner Nähe", "Zur Wand", is German. That's where I decide whether I keep the app.

**Thomas (210, Tourist, 20):** And the tab says "Meet", but inside the settings it says "Treff ausblenden", "Niveau zeigen", "Meine Einträge löschen". Feels half done.

**Arben (141, Vater, Englisch):** Logging was perfect though. "Flash – done on the first try" is the clearest explanation I've seen.

**Pascal (165, Jurist, Englisch):** I'm a lawyer, so: "By saving you agree to the rules: Play fair". Short, fine. The rules page itself should be in English too.

**Tim (108, Tourist, iPhone SE):** My phone is small. The zoom buttons on the photo are tiny. Otherwise fast.

**Elena (114, Landwirtin):** Ich als Deutschsprachige: Mich stört das Englische nicht, aber die Mischung auf einem Bildschirm sieht unfertig aus.

**Kenji (96, Jurist):** Für Touristen ist die Hallenwahl der erste Eindruck. Das würde ich zuerst übersetzen.

**Brigitte (99, Kita):** Ich will vor allem, dass meine Kinder (12, 14) Treff nicht sehen. Ab 16 steht da. Kann ich das für ihr Konto sperren?

**Sofia (111, Grafik, iPhone SE):** Für Kurse brauche ich Gruppen. Hat geklappt. Aber auf dem SE ist die Erklärkarte beim ersten Loggen sehr lang.

**Aleksandra (162, Software):** Mir fällt auf: Auf dem Desktop ist oben «Feedback» ein schwarzer, sehr dominanter Knopf. Das ist das Auffälligste auf der ganzen Seite.

**Pascal (153, Landwirt, iPad, Englisch):** On the iPad it looks a bit stretched, but works.

**Lucía (171):** «Noch nicht dabei»: Meine Halle in Basel fehlt. Wünschen, ein Tap. Und die Halle empfehlen mit Dankeschön, ich würd's weitersagen, wenn es nicht nach Werbung riecht.

**Aleksandra (192):** 30 % klingt nach Provision. Sagt lieber, was genau passiert.

### Gespräch 5: Plenum (Vertretungen aller Gruppen)

**Werner (40, Schrauber):** Das Wichtigste aus unserer Runde: Auf kleinen iPhones ist Speichern im Studio halb abgeschnitten. Das kostet Arbeit.

**Corinne (7, Admin):** Und bei uns: «Ansehen als …» liegt auf der Admin-Karte oder auf «Abbrechen & Zurück», je nach Handy.

**Kenji (96, Kletterer):** Gemeinsamer Nenner: kleine Handys werden nicht ernst genug genommen. Lupe und Vollbild im Wandfoto, Sektor-Chips, die Admin-Karte, Speichern.

**Mei (105, Expat):** Second: the first screen for guests should be English when the phone is English.

**Sofia (2, Verein):** Drittens: Zahlen müssen ihren Zeitraum nennen, sonst glaubt keiner der Statistik.

**Sandra (60, Schrauber):** Und die Schrauber-Auswertung bitte so, dass sie Gespräch ist und nicht Rangliste.

**Yannick (201, Kletterer):** Und nichts an den zwei Taps zum Loggen ändern. Das ist der Grund, warum ich die App nutze.

**Kenji (23, Admin):** Und das Empfehlungs-Dankeschön erst starten, wenn klar ist, wer zahlt.

**Blerina (123, Kletterer, 65):** Und Weiß braucht einen kräftigeren Rand.
