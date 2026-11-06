# Runde 2 – Unterhaltung (SPEC-025 / SPEC-053: Hallen-Karte für eingeloggte Nutzer, Stand v2)

> **Datum:** 2026-10-30 · **Gegenstand:** Spec v2 (nach Einarbeitung von Runde 1: `MapPin` am Hallen-Wähler + kompakter Karten-Knopf `header-map-btn`, Freigabe von `GymFinderSheet` in Admin & Studio, `admin-open-gym-map` im `AdminGymSheet`, `me-open-gym-map` in «Ich» und `settings-open-gym-map` in «Einstellungen», vollständiges `t()` in `GymFinderSheet`).
> **Leitfrage:** *Wie wirkt die neue Karten-Erreichbarkeit im Alltag auf kleinen Bildschirmen, beim Wechsel aus den Einstellungen und für Menschen mit Sehschwäche?*

## Teilnehmende (30 neue Personen, 18–70 Jahre, 9 Populationen – andere Mischung als Runde 1)

| # | Name | Alter | Beruf / Population | Niveau | Gerät | Erwartung an die App |
|---|---|---|---|---|---|---|
| 1 |Ruth | 68 | Pensionierte Apothekerin, Makuladegeneration (55+ / Sehschwäche) | 4c | iPhone 14 Plus (135 % Text) | Hoher Kontrast, keine doppelt beschrifteten Mini-Knöpfe |
| 2 | Dario | 22 | Sanitärinstallateur EFZ (Handwerk) | 6b | Samsung A53 | Schneller Hallenwechsel am Feierabend |
| 3 | Mirjam | 36 | Hebamme im Dreischichtbetrieb (Pflege) | 5c | iPhone 13 | Klare Orientierung nach langen Schichten |
| 4 | Lukas | 18 | KV-Lernender 2. Lehrjahr (Azubi / Kaufleute) | 6c+ | iPhone SE (375 px) | Prüft, ob im Header auf 375 px nichts gequetscht wird |
| 5 | Nadine | 42 | Alleinerziehende Mutter, Teilzeit im Detailhandel (Eltern / Verkauf) | 5a | Xiaomi Note 11 | Plant Ausflüge mit den Kindern in andere Hallen |
| 6 | Connor | 31 | Braumeister aus Schottland, lebt in Basel (Englischsprachig) | 6b | Pixel 7a (EN) | Nutzt die Karte auf Englisch, um Hallen in der Nordwestschweiz zu wünschen |
| 7 | Stefan | 54 | Vereinspräsident einer kleinen Kletterhalle (Hallenpersonal / Admin) | 6a | iPad + Samsung S21 | Verwaltet seine Halle und schaut, welche Nachbarhallen schon dabei sind |
| 8 | Jorin | 25 | Gastschrauber in 4 Schweizer Hallen (Hallenpersonal / Schrauber) | 7c | iPhone 15 | Wechselt ständig zwischen Schrauber-Studio, Karte und Wand |
| 9 | Verena | 63 | Pensionierte Turnlehrerin (55+ / Sport) | 5b | iPhone 12 | Will ohne Brille sehen, wo die Karte aufgeht |
| 10 | Alina | 27 | Hörgeräteakustikerin (Gesundheit / Handwerk) | 6a+ | iPhone 13 mini (360 px) | Kleinstes iPhone – prüft jede Zeile auf Überlauf |
| 11 | Bruno | 66 | Ehemaliger SBB-Rangierarbeiter (55+ / Handwerk) | 5a | Motorola Edge | Mag einfache, ehrliche Beschriftungen |
| 12 | Fatma | 29 | Sozialarbeiterin, leitet Jugend-Klettertreff (Soziales / Trainer) | 6a | Samsung S23 | Sucht Hallen für Gruppenausflüge |
| 13 | Cedric | 20 | Forstwart-Lehrling (Azubi / Natur) | 6b | Nokia XR20 | Robuste Bedienung mit rauen Fingern |
| 14 | Elena | 33 | Köchin (Gastronomie / Schichtarbeit) | 5c | iPhone 11 | Geht nachmittags bouldern, schaut auf Auslastung + Karte |
| 15 | Philipp | 47 | Steuerberater (Kaufleute) | 6a+ | iPhone 15 Pro | Nutzt auch das Vertriebspartner-Feature (SPEC-054) |
| 16 | Mia | 19 | Gymnasiastin, klettert seit 1 Monat (Anfängerin) | 4b | iPhone 12 | Will wissen, welche Hallen es rund um Zürich gibt |
| 17 | Kurt | 70 | Pensionierter Landwirt (55+ / Senior) | 4c | Samsung Tab | Klettert mit seinem Sohn, braucht eindeutige Knöpfe |
| 18 | Hannah | 28 | Gebärdensprachdolmetscherin (Sprache / Soziales) | 6b | iPhone 14 | Achtet auf visuelle Klarheit |
| 19 | Yannis | 35 | Selbständiger Bodenleger (Handwerk) | 6c | Poco F4 | Will im Studio und an der Wand denselben schnellen Zugriff |
| 20 | Chloe | 24 | Austauschstudentin aus Australien (Studierende / Touristin EN) | 6a | iPhone 13 (EN) | Testet englische Begriffe auf Natürlichkeit |
| 21 | Andi | 49 | Berufsfeuerwehrmann (Schichtdienst) | 6b+ | Garmin / Samsung S22 | Keine versteckten Gesten, alles auf einen Tipp |
| 22 | Simone | 59 | Floristin (Handwerk / Kreative / 55+) | 5a | iPhone SE | Achtet darauf, dass der Header ruhig bleibt |
| 23 | Tarek | 26 | Maschinenbaustudent mit Tremor in der rechten Hand (Motorisch / MINT) | 6a | Pixel 6 | Große Tippflächen ohne versehentliches Danebentippen |
| 24 | Sandra | 40 | Sekundarlehrerin Geografie (Lehrkräfte) | 5c | iPhone 14 | Liebt gute Karten, prüft den Rückweg aus der Karte |
| 25 | Roman | 32 | Betreiber eines Klettershops & Vertriebspartner (Kaufleute / Partner) | 7a | iPhone 15 | Nutzt die Karte täglich, um Verzeichnis-Hallen zu betreuen |
| 26 | Doris | 65 | Pensionierte Dentalassistentin (55+) | 4b | iPhone 11 | Sucht Funktionen oft über «Einstellungen» |
| 27 | Nico | 21 | Fahrradmechaniker (Handwerk) | 7a | Sony Xperia | Schmales 21:9-Display |
| 28 | Maja | 37 | Illustratorin (Kreative) | 6a+ | iPhone 13 Pro | Prüft das Zusammenspiel mit Design System v2 («Chalk») |
| 29 | Samuel | 51 | Pfarrer, klettert mit Konfirmanden (Soziales / Eltern) | 5b | Samsung A33 | Braucht schnelle Übersicht über Hallen in der Umgebung |
| 30 | Zora | 23 | Umweltingenieur-Studentin (Studierende) | 6c | Fairphone 4 | Prüft Verhalten ohne Standortfreigabe |

---

## Gruppengespräch

**Lukas (18, iPhone SE) & Alina (27, iPhone 13 mini):** «Wir haben uns den Kletterer-Header in v2 genau auf 360 und 375 px Breite angeschaut: Wenn links das Berg-Logo ist, daneben `header-gym-select` mit `MapPin` und Hallenname UND rechts noch ein separater Knopf `header-map-btn` UND `Feedback` UND für Schrauber der `Wrench`-Knopf, dann sind das 5 Elemente in einer einzigen 48-px-Zeile! Warum nicht eleganter: `header-gym-select` hat links das `MapPin`-Symbol + den Hallennamen + `▾`, und rechts daneben steht `header-map-btn` als kompakter Karten-Knopf (`MapPin` + `Karte`), ABER so gestaltet, dass `header-gym-select` sauber `flex-1 min-w-0` nutzt und `header-map-btn` kompakt (`px-2.5 min-h-[40px]`) bleibt?»

**Ruth (68, Makuladegeneration):** «Mir hilft der Knopf `Karte` (`header-map-btn`) enorm! Beim Hallennamen `6a plus Kletter- & Bould…` lese ich nur den Namen der Halle. Wenn aber direkt daneben (oder als klarer Knopf) ein kleines Schild mit Karten-Pin und dem Wort **‚Karte'** steht, sehe ich auch mit meinen schlechten Augen sofort: Ah, da geht die Landkarte auf!»

**Doris (65, sucht über Einstellungen):** «Ich bin in *‚Ich → Einstellungen'* gegangen und hab auf die neue Zeile *‚Hallen-Karte'* (`settings-open-gym-map`) getippt. Was passiert, wenn ich dort draufdrücke, während ich noch im Einstellungs-Bildschirm bin? Das Karten-Sheet geht zwar auf, aber wenn ich es wieder schließe oder eine Halle wähle, sollte *‚Einstellungen'* sauber geschlossen werden, falls ich auf *‚Zur Wand'* tippe!»

**Jorin (25, Gastschrauber):** «Guter Punkt von Doris! Wenn ich in *‚Ich → Einstellungen'* bin und auf *‚Hallen-Karte'* tippe, sollte sich das Karten-Sheet sofort öffnen. Und wenn ich im Karten-Sheet bei einer Halle auf *‚Zur Wand'* tippe, schließt sich auch die Einstellungs-Unterseite (`isSettingsOpen = false`), weil `activeTab` auf `'wall'` wechselt. Was aber, wenn ich schon auf dem Tab `'stats'` bin, die Karte öffne und nur schließe? Dann bleibe ich genau dort, wo ich war. Das ist super natürlich.»

**Stefan (54, Hallen-Admin) & Roman (32, Vertriebspartner):** «Im Admin-Modus ist das jetzt richtig gut: Ich tippe oben auf den Hallennamen (`admin-gym-button`), sehe meine Halle und darunter den Knopf *‚Alle Hallen auf der Karte'* (`admin-open-gym-map`). Und zusätzlich habe ich oben im Admin-Header den direkten Karten-Knopf (`admin-map-btn`). Eine Kleinigkeit: Wenn ich als Admin auf der Karte nur mal schnell nachschauen will, welche Hallen in meiner Nachbarschaft *‚Noch nicht dabei'* sind, und das Karten-Sheet dann mit `X` wieder schließe, will ich **im Admin-Modus bleiben**! Nur wenn ich aktiv bei einer Halle auf *‚Zur Wand'* tippe, soll er mich an die Kletterwand (`climber` / `wall`) bringen.»

**Jorin (25, Schrauber) stimmt begeistert zu:** «Genau so! Wenn ich im Schrauber-Studio auf `studio-map-btn` tippe, die Karte anschaue und wieder mit `X` zumache, bleibe ich im Studio an meiner Wand. Wenn ich aber auf der Karte bei einer Halle *‚Zur Wand'* drücke, wechselt er zur Kletterer-Wand dieser Halle. Das ist 100 % logisch.»

**Connor (31, EN) & Chloe (24, EN):** «We checked the English translations in v2:
- `Hallen-Karte` → `Gym map`
- `Karte` → `Map`
- `Alle Hallen auf der Karte` → `All gyms on the map`
- `Zur Wand` → `To the wall`
- `Navigation starten` → `Start navigation`
- `In meiner Nähe` → `Near me`
- `Suche …` → `Locating …`
- `Halle oder Ort` → `Gym or city`
- `Standort nicht freigegeben. Die Liste ist nach Namen sortiert.` → `Location not shared. The list is sorted by name.`
- `Keine Halle gefunden` → `No gym found`
- `Karte nicht verfügbar` → `Map unavailable`
- `{n} neu` → `{n} new`
- `gewählt` → `selected`
- `Ort fehlt` → `City missing`
Everything reads super natural in English now!»

**Valentina (31) & Philipp (47, Vertriebspartner):** «Noch ein Detail in *‚Ich'*: Oben steht ja der Umschalter *‚Diese Halle | Alle Hallen'* (`me-scope`). Wenn direkt darunter (oder daneben) der Knopf `me-open-gym-map` steht (*‚Hallen-Karte öffnen'* mit `MapPin`-Symbol und Untertitel *‚Alle Hallen & Noch nicht dabei'*), findet ihn jeder in einer Sekunde – egal ob man gerade Statistik schaut, eine Halle wünschen will oder als Partner arbeitet.»
