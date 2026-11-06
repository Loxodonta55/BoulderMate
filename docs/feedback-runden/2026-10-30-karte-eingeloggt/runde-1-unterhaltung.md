# Runde 1 – Unterhaltung (SPEC-025 / SPEC-053: Hallen-Karte für eingeloggte Nutzer)

> **Datum:** 2026-10-30 · **Gegenstand:** Erweiterung von SPEC-025 & SPEC-053 (Version v2-draft) – Sichtbarkeit und Erreichbarkeit der Hallen-Karte («Halle wählen») im eingeloggten Zustand über Kletterer-Header, «Ich», «Einstellungen», Admin-Konsole und Schrauber-Studio.
> **Leitfrage:** *Findet jede eingeloggte Person (Kletterer, Schrauber, Admin, Gast nach Login) die Hallen-Karte sofort und ohne Suchen, ohne dass die Wand-Ansicht überladen wird?*

## Teilnehmende (30 Personen, 18–70 Jahre, 8 Populationen)

| # | Name | Alter | Beruf / Population | Niveau | Gerät | Erwartung an die App |
|---|---|---|---|---|---|---|
| 1 | Margrit | 67 | Pensionierte Buchhalterin (55+ / schlechtere Augen) | 5a | iPhone SE (125 % Schrift) | Große, klipp und klare Knöpfe mit Wort statt Rätsel-Icons |
| 2 | Beat | 61 | Schreinermeister (Handwerk / 55+) | 5c | Samsung A54 | Will auf Montage abends schnell sehen, welche Halle im Nachbarort ist |
| 3 | Dragana | 38 | Intensivpflegerin im Schichtdienst (Pflege) | 6a | iPhone 13 | Nach Nachtdienst null Geduld für versteckte Menüs |
| 4 | Kaan | 19 | Polymechaniker-Lehrling (Azubi) | 7a | Pixel 7 | Wechselt mit Freunden zwischen Winterthur, Zürich und St. Gallen |
| 5 | Céline | 34 | Primarlehrerin, 2 Kinder (Eltern mit Kindern) | 5b | iPhone 14 | Sucht am Wochenende familienfreundliche Hallen in der Region |
| 6 | Liam | 29 | Expat aus Manchester, UX-Researcher (Englischsprachig / Tourist) | 6c | iPhone 15 Pro (EN) | Nutzt die App komplett auf Englisch, reist durch die Schweiz |
| 7 | Reto | 45 | Hallenleiter & Mitinhaber (Hallenpersonal / Admin) | 6b | iPad + iPhone 13 mini | Ist meist im Admin-Modus eingeloggt, will trotzdem das Verzeichnis sehen |
| 8 | Samira | 26 | Routenschrauberin in zwei Hallen (Hallenpersonal / Schrauber) | 7b+ | iPhone 12 | Arbeitet im Schrauber-Studio, will schnell zwischen Hallen wechseln |
| 9 | Urs | 58 | Lokführer, Rot-Grün-Sehschwäche (Einschränkung / 55+) | 6a+ | Samsung S22 | Klare Symbole und Kontraste, keine reinen Farbhinweise |
| 10 | Noemi | 22 | Grafikdesign-Studentin (Studierende / Kreative) | 6b | iPhone 13 | Ruhige Optik («Chalk»), kein vollgestopfter Header |
| 11 | Heinz | 70 | Pensionierter Postbeamter (55+ / Senior) | 4c | Android-Tablet | Geht mit Enkeln bouldern, sucht Karte dort, wo «Karte» draufsteht |
| 12 | Valentina | 31 | Physiotherapeutin (Gesundheit / Sport) | 6c+ | iPhone 14 | Will im Profil unter «Alle Hallen» direkt auf die Karte springen |
| 13 |Marco | 27 | Elektroinstallateur (Handwerk) | 6b | Xiaomi Redmi | Dicke Finger, Kreide am Display, braucht ≥ 44 px Trefferfläche |
| 14 | Yael | 41 | Jugendtrainerin SAC (Profis & Trainer) | 7c | iPhone 15 | Plant Auswärtstrainings mit der Jugendgruppe über die Karte |
| 15 |Tomáš | 35 | LKW-Mechaniker (Handwerk) | 6a | Motorola Moto G | Einfache Bedienung, Deutsch als Zweitsprache |
| 16 | Hanna | 24 | Erstsemester BWL, klettert seit 3 Wochen (Anfängerin) | 4b | iPhone 11 | Kennt die Hallennamen noch gar nicht, orientiert sich nur über die Karte |
| 17 | Gian | 52 | Kaufmännischer Leiter (Kaufleute) | 6a | iPhone 14 Plus | Prüft als Vereinsvorstand auch das Empfehlungsprogramm |
| 18 | Priya | 30 | Data-Warehouse-Spezialistin aus Indien (IT / Englisch) | 5c | Pixel 8 (EN) | Erwartet konsistente englische Übersetzung im Karten-Sheet |
| 19 | Silvan | 20 | Zimmermann-Lehrling (Azubi / Handwerk) | 6c | iPhone SE | Kleines Display (375 px), Header darf nicht überlaufen |
| 20 | Claudia | 48 | Buchhändlerin, Mutter einer 10-Jährigen (Eltern / Kaufleute) | 5a | Samsung A34 | Sucht Karte intuitiv oben oder im Profil |
| 21 | Fabian | 33 | Chefschrauber (Hallenpersonal) | 7b | iPhone 13 | Will aus dem Studio heraus mal kurz eine andere Halle anschauen |
| 22 | Esther | 64 | Pensionierte Kindergärtnerin (55+) | 5a | iPhone 12 (großer Text) | Tippt nie auf Überschriften, wenn sie nicht wie ein Knopf aussehen |
| 23 | Noah | 25 | Architekturstudent, Einhand-Bedienung wegen Handgelenkschiene (Motorisch) | 6a+ | iPhone 14 | Erreichbarkeit mit einer Hand, klare Rücksprünge |
| 24 | Karin | 44 | Bäckerin (Handwerk / Schichtarbeit) | 5b | Samsung S21 | Geht vormittags klettern, will Auslastung und Karte schnell sehen |
| 25 | Matteo | 28 | Fotograf & Videograf (Kreative) | 7a | iPhone 15 Pro | Achtet auf saubere Hierarchie zwischen Wandfoto und Navigation |
| 26 | Sonja | 56 | Gemeindeschreiberin (Verwaltung / 55+) | 5b | iPhone 13 | Sucht Funktionen systematisch in «Ich» oder «Einstellungen» |
| 27 | Kevin | 21 | Logistiker EFZ (Handwerk) | 6b+ | Poco X5 | Will beim Tippen auf «Zur Wand» sofort an der Wand landen |
| 28 | Rachel | 39 | Gastprofessorin aus Kanada (Touristin / Englisch) | 6a | iPhone 14 (EN) | Braucht Karte + Navigation direkt nach dem Login |
| 29 | Toni | 60 | Hauswart & Hallen-Helfer (Hallenpersonal / 55+) | 5c | Nokia Android | Versteht «Karte» sofort, «6a plus ▾» hielt er für ein Deko-Label |
| 30 | Lea | 23 | Pflegefachfrau HF in Ausbildung (Pflege / Azubi) | 5c | iPhone 12 mini | Sehr schmales Display, prüft Platz im Header |

---

## Gruppengespräch

**Hanna (24, Anfängerin):** «Ich sag euch ehrlich, was mir gestern passiert ist: Vor dem Anmelden war auf der Startseite dieser große Knopf *‚Hallen ansehen'* mit dem Stecknadel-Symbol. Da hab ich die Karte gesehen. Dann hab ich mich angemeldet – und weg war sie! Oben stand nur *‚6a plus Kletter- & Bould…'* mit einem winzigen Pfeilchen. Ich dachte, das ist einfach die Überschrift der Halle, in der ich gerade bin.»

**Toni (60, Hauswart):** «Genau das! Ich hab fünf Minuten gesucht, wo nach dem Login die Karte geblieben ist. Auf eine Überschrift tippe ich doch nicht, wenn da kein Karten-Zeichen dran ist. Wenn jetzt ein Stecknadel-Symbol vor dem Hallennamen steht und daneben oder darin klar *‚Karte'* erkennbar ist, kapiere ich das sofort.»

**Reto (45, Hallenleiter / Admin):** «Bei mir war es noch schlimmer: Wenn ich mich einlogge, gehe ich oft direkt in die *Hallen-Administration*. Dort tippe ich oben links auf *‚6a plus ▾'* – und es geht ein kleines Fensterchen auf, in dem nur meine eigene Halle steht. Keine Karte, kein Verzeichnis, nichts! Selbst wenn ich aus den Einstellungen heraus versucht habe, die Karte zu öffnen, ging sie im Admin-Modus schlicht nicht auf. Dass ihr im Admin-Sheet jetzt einen Knopf *‚Alle Hallen auf der Karte'* einbaut und die Sperre rausnehmt, löst mein Problem komplett.»

**Samira (26, Schrauberin):** «Im Schrauber-Studio genauso! Oben ist nur ein winziges Dropdown für aktive Hallen. Wenn ich im Studio-Header einen kleinen Karten-Knopf habe oder über die Karte direkt zur Wand einer Halle springen kann, muss ich nicht erst umständlich den Arbeitsbereich wechseln.»

**Silvan (20, Zimmermann, iPhone SE) & Lea (23, iPhone 12 mini):** «Moment – passt auf den Platz im Kletterer-Header auf! Auf meinem iPhone SE (375 px) sind oben schon das Berg-Logo, der Hallenname, der Feedback-Knopf und bei Schraubern der Schraubenschlüssel. Wenn ihr neben den Hallennamen noch einen breiten zweiten Knopf *‚Hallen-Karte'* quetscht, bleibt vom Hallennamen nur noch *‚6a…'* übrig!»

**Noemi (22, Grafikdesign):** «Da hat Silvan total recht. Zwei getrennte Knöpfe im Header für exakt dieselbe Aktion (*Hallenname ▾* UND daneben noch ein Knopf *Karte*, die beide genau dasselbe Sheet öffnen) wirken auf dem Handy doppelt gemoppelt und fressen Platz. Warum machen wir nicht den Hallen-Wähler selbst unmissverständlich als Karten-Knopf sichtbar – mit `MapPin`-Icon links, dem Hallennamen in der Mitte und einem kleinen `Karte`-Schildchen bzw. klarem Karten-Button, oder so, dass auf schmalen Handys ein kompaktes Karten-Icon integriert ist?»

**Margrit (67) widerspricht teilweise:** «Also nur ein stummes Stecknadel-Icon ohne das Wort *‚Karte'* reicht mir nicht! Ich will irgendwo das Wort *‚Karte'* lesen können, sonst suche ich wieder. Aber wenn im Header beim Hallennamen oder als kompakter Knopf *‚Karte'* steht UND unter *‚Ich'* auch noch *‚Hallen-Karte'* steht, dann finde ich es hundertprozentig.»

**Lea (23):** «Man kann es doch kombinieren: Im Header hat der Hallen-Knopf links das `MapPin`-Symbol, und rechts im selben Bereich (oder als klarer Pill-Knopf `header-map-btn`) steht kompakt *‚Karte'* – auf ganz schmalen Handys (< 360 px) zumindest das Pin-Symbol im Hallen-Knopf plus das Wort *‚Karte'*, damit nichts überläuft. Und die Mindesthöhe 44 px einhalten!»

**Valentina (31, Physio) & Sonja (56, Gemeindeschreiberin):** «Ich habe die Karte zuerst unter *‚Ich'* gesucht, weil dort ja der Umschalter *‚Diese Halle | Alle Hallen'* ist! Wenn ich auf *‚Alle Hallen'* tippe, denke ich: Wo sehe ich denn alle Hallen? Dass man dafür bisher an sämtlichen Statistiken, der Pyramide, dem Radar-Diagramm und Deep Dive vorbei ganz nach unten zu *‚Halle empfehlen'* scrollen musste, war total versteckt. Ein kompakter Knopf *‚Hallen-Karte'* direkt unter dem Umschalter *‚Diese Halle / Alle Hallen'* (oder oben in *‚Ich'*) und eine Zeile in den *‚Einstellungen'* sind Gold wert.»

**Liam (29, Expat, EN) & Priya (30, EN):** «One huge thing we noticed when opening the map with English enabled: the page title still says *‚Halle wählen'*, the search box says *‚Halle oder Ort'*, the GPS button says *‚In meiner Nähe'*, and the buttons on the gym card say *‚Zur Wand'* and *‚Navigation starten'*! The new SPEC-053 badges were translated, but the base map sheet from SPEC-025 was still hardcoded in German. Please wrap all of `GymFinderSheet` and `GymMap` in `t()`!»

**Urs (58, Lokführer):** «Und was passiert, wenn ich im Admin-Modus oder unter *‚Ich'* die Karte öffne, eine Halle auswähle und auf *‚Zur Wand'* tippe? Dann will ich auch wirklich an der Wand dieser Halle landen und nicht weiter in den Einstellungen oder im Admin-Menü hängen bleiben!»

**Kevin (21, Logistiker):** «Ja! *‚Zur Wand'* heißt *‚Zur Wand'* – egal ob ich die Karte aus *‚Ich'*, aus den *‚Einstellungen'*, aus dem *Admin* oder aus dem *Header* geöffnet habe: Es muss das Sheet schließen und direkt zum Tab *‚Wand'* im Kletterer-Modus wechseln.»
