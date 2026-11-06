# Runde 3 – Unterhaltung (SPEC-025 / SPEC-053: Hallen-Karte für eingeloggte Nutzer, Stand v3)

> **Datum:** 2026-10-30 · **Gegenstand:** Spec v3 (nach Einarbeitung von Runde 2: Modus-Erhalt beim Schließen, kompakte Header-Anordnung auf 360–375 px, vollständige `t()`-Abdeckung inkl. Zeilen-Details).
> **Leitfrage:** *Gibt es noch irgendeine Stelle oder Rolle, bei der man als eingeloggter Nutzer die Hallen-Karte übersieht oder hängen bleibt?*

## Teilnehmende (30 Personen, 18–70 Jahre, 9 Populationen – dritte Mischung)

| # | Name | Alter | Beruf / Population | Niveau | Gerät | Erwartung an die App |
|---|---|---|---|---|---|---|
| 1 | Werner | 69 | Pensionierter Feinmechaniker, Gleitsichtbrille (55+) | 5b | iPhone 13 | Sofort sehen, wo die Karte ist |
| 2 | Jasmin | 24 | Fachfrau Gesundheit EFZ (Pflege / Schichtdienst) | 6a | Samsung A52 | Schneller Wechsel zwischen Hallen |
| 3 | Matteo | 19 | Maurer-Lehrling (Azubi / Handwerk) | 6c | Xiaomi Redmi Note | Große Tippflächen mit Kreide an den Händen |
| 4 | Sibylle | 43 | Primarlehrerin, Mutter von Zwillingen (Eltern / Lehrkräfte) | 5a | iPhone 14 | Sucht Hallen für Familienausflüge |
| 5 | Grace | 32 | Ärztin aus Dublin, arbeitet am USZ (Englischsprachig / Gesundheit) | 6b+ | iPhone 15 (EN) | Nutzt die App auf Englisch |
| 6 | Christoph | 57 | Hallenbetreiber & Routenbau-Koordinator (Hallenpersonal / Admin) | 6b | iPad + iPhone 14 | Prüft aus dem Admin-Bereich die Karte und Nachbarhallen |
| 7 | Kim | 27 | Vollzeit-Schrauberin (Hallenpersonal / Schrauber) | 7c | Pixel 8 | Nutzt die Karte direkt aus dem Schrauber-Studio |
| 8 | Hannes | 62 | Pensionierter Briefträger, Farbenblindheit Deuteranopie (55+ / Einschränkung) | 5c | Samsung S21 | Form + Text statt nur Farbe |
| 9 | Livia | 21 | Musikstudentin (Studierende / Kreative) | 6a | iPhone 12 mini | Prüft das Aussehen auf dem kleinen Bildschirm |
| 10 | René | 66 | Pensionierter Polizist (55+) | 5a | Samsung A34 | Sucht Funktionen in «Einstellungen» und «Ich» |
| 11 | Soraya | 30 | Grafikerin (Kreative) | 6c | iPhone 15 Pro | Ruhiges Design nach «Chalk» |
| 12 | Morris | 36 | Spengler (Handwerk) | 6b | Motorola G84 | Einfache, direkte Wege |
| 13 | Anja | 46 | Buchhalterin im Sportverein (Kaufleute) | 5b | iPhone 13 | Will unter «Ich» alle Hallen auf der Karte sehen |
| 14 | David | 28 | Jugendtrainer & Vertriebspartner (Trainer / Partner) | 7b | iPhone 14 Pro | Öffnet die Karte aus «Ich», aus dem Header und über Links |
| 15 | Elif | 22 | Coiffeuse EFZ (Handwerk) | 5c | iPhone 11 | Klettert mit Freundinnen in wechselnden Hallen |
| 16 | Thomas | 53 | Landwirt (Natur / Handwerk) | 5b | Nokia G60 | Klare deutsche Begriffe |
| 17 | Ben | 18 | Gymnasiast, klettert seit 2 Wochen (Anfänger) | 4a | iPhone SE | Will alle Hallen in der Umgebung entdecken |
| 18 | Franziska | 61 | Pensionierte Bibliothekarin (55+) | 4c | iPhone 12 | Liest Beschriftungen genau |
| 19 | Sören | 34 | Physiotherapeut, Daumenbandage rechts (Motorisch / Gesundheit) | 6b | Samsung S23 | Einhand-Bedienung |
| 20 | Megan | 25 | Doktorandin ETH aus den USA (Englischsprachig / MINT) | 7a | iPhone 14 (EN) | Prüft englische Texte im Header und Sheet |
| 21 | Patrick | 49 | Busfahrer im Schichtdienst (Verkehr / Schichtarbeit) | 6a | Samsung A54 | Geht zu Randzeiten klettern |
| 22 | Nadja | 38 | Kindergärtnerin (Eltern / Lehrkräfte) | 5b | iPhone 13 | Übersichtliche Darstellung |
| 23 | Gianluca | 29 | Koch (Gastronomie) | 6c+ | Pixel 7 | Schneller Hallenwechsel |
| 24 | Ursula | 70 | Rentnerin (55+ / Seniorin) | 4b | iPad | Große, eindeutige Knöpfe |
| 25 | Severin | 31 | Schreiner & Teilzeit-Schrauber (Handwerk / Schrauber) | 7a | iPhone 12 | Wechselt zwischen Studio und Kletterer-App |
| 26 | Rahel | 26 | Juristin (Kaufleute / Recht) | 6a | iPhone 15 | Klare Struktur |
| 27 | Tobias | 44 | Verkaufsleiter (Kaufleute) | 6a+ | Samsung S22 | Nutzt «Halle empfehlen» und die Karte |
| 28 | Chiara | 20 | Pflege-Praktikantin (Pflege / Azubi) | 5b | iPhone SE | Testet kleine Bildschirme |
| 29 | Beatrix | 59 | Schneiderin (Handwerk / 55+) | 5a | iPhone 11 | Findet «Karte» sofort über das Wort |
| 30 | Janik | 23 | Sportstudent (Studierende / Sport) | 7b | iPhone 14 | Testet den gesamten Fluss |

---

## Gruppengespräch

**Werner (69) & Ursula (70):** «Jetzt ist es ein Unterschied wie Tag und Nacht: Sobald ich eingeloggt bin, sehe ich oben im Header das Stecknadel-Symbol beim Hallennamen UND den Knopf **‚Karte'** (`header-map-btn`). Und wenn ich auf **‚Ich'** gehe, steht direkt unter *‚Diese Halle / Alle Hallen'* der Knopf **‚Hallen-Karte'** (`me-open-gym-map`). Man kann die Karte gar nicht mehr verfehlen.»

**Christoph (57, Hallenbetreiber / Admin) & Kim (27, Schrauberin):** «Im Admin-Bereich und im Schrauber-Studio funktioniert jetzt beides: Entweder ich tippe direkt oben im Header auf **‚Karte'** (`admin-map-btn` bzw. `studio-map-btn`), oder ich tippe im Admin auf den Hallennamen und dort auf **‚Alle Hallen auf der Karte'** (`admin-open-gym-map`). Wenn ich die Karte mit `X` schließe, bleibe ich in meinem Arbeitsbereich; wenn ich bei einer Halle auf *‚Zur Wand'* tippe, bringt er mich direkt an die Wand.»

**René (66):** «Und falls ich in *‚Ich → Einstellungen'* bin und dort auf **‚Hallen-Karte'** (`settings-open-gym-map`) tippe, schließt sich die Einstellungs-Unterseite sauber und das Karten-Sheet geht auf. Sehr aufgeräumt!»

**Grace (32, EN) & Megan (25, EN):** «In English, the header button says *‚Map'*, the button in *‚Me'* says *‚Gym map'*, and inside the sheet everything from *‚Choose gym'* and *‚Near me'* to *‚To the wall'* and *‚Start navigation'* is in English. Nothing left to complain about!»

**Livia (21, iPhone 12 mini) & Chiara (20, iPhone SE):** «Auf 360 und 375 px Breite passt die Kopfzeile sauber, nichts ragt über den Rand und die Mindesthöhe ist eingehalten.»
