# Runde 1 – Unterhaltung: SPEC-045 «BoulderMate als App» (Stand v1)

> **Simuliert**, kein echtes Nutzerfeedback. Ablauf nach [feedback-einholen.md](../../prozesse/feedback-einholen.md).
> **Gegenstand:** SPEC-045 v1 (Grill-me-Ergebnis): Capacitor-Hülle um die Web-App, iPhone und Android, Inhalt in der App gebündelt, QR-Scanner, Kamera, Teilen, Login über System-Browser mit Rücksprung, kein Push, Mindestversion beim Start, kostenlos.
> **Leitfrage:** Würdet ihr die App statt der Webseite nutzen, und was muss sie können, damit sie im Alltag (Halle, Keller, Kreide, Brille) besser ist als die Webseite?

## Teilnehmende

| # | Name | Alter | Beruf / Population | Klettern | Gerät | Erwartung |
|---|------|-------|--------------------|----------|-------|-----------|
| 1 | Bettina | 39 | Hallenbetreiberin München | 6a | iPhone 15 | Gäste sollen die App finden |
| 2 | Kevin | 24 | Schrauber, Sportstudent | 7b | Android (Samsung A54) | Wandfotos schnell machen |
| 3 | Rosemarie | 66 | Rentnerin, Grauer Star operiert | 4+ | iPhone SE, Schrift groß | nicht ständig neu anmelden |
| 4 | Dragan | 48 | Fliesenleger | 6a | Android (Xiaomi) | schnell, ohne Schnickschnack |
| 5 | Julia | 33 | Datenschutzbeauftragte einer Versicherung | 5c | iPhone 14 | keine versteckte Datensammelei |
| 6 | Noah | 18 | Schüler, Abitur | 6b | Android (alt, Android 9) | läuft auf meinem Handy? |
| 7 | Priya | 29 | Softwareentwicklerin, Mobile | 7a | Pixel 8 | saubere Technik |
| 8 | Werner | 58 | Hausmeister, Lesebrille | 5a | Android (Motorola) | große Knöpfe |
| 9 | Sarah | 35 | Mutter von drei Kindern, Teilzeit Apotheke | 5b | iPhone 12 | eine Hand frei, schnell loggen |
| 10 | Liam | 27 | Kanadier, Work & Travel | 6c | iPhone 13, Englisch | versteht wenig Deutsch |
| 11 | Monika | 52 | Thekenkraft in der Halle | 5a | Android | Gäste nicht erklären müssen |
| 12 | Fabio | 31 | Koch, Schichtdienst | 6b | Android (OnePlus) | klettert nachts, Halle fast leer |
| 13 | Elif | 22 | Pflege-Azubi | 5c | iPhone 11 | wenig Speicher frei |
| 14 | Georg | 70 | pensionierter Vermessungsingenieur | 4 | iPad + Android-Handy | Technik soll stimmen |
| 15 | Tamara | 26 | Grafikdesignerin | 6a | iPhone 15 Pro | schön und ruhig |
| 16 | Stefan | 44 | Chefschrauber Frauenfeld | 6c | Android-Tablet + iPhone | Studio auf dem Tablet |
| 17 | Mia | 19 | Studentin Soziale Arbeit, Anfängerin | 4 | Android | Mut, nicht überfordert |
| 18 | Jens | 41 | Polizist | 6b | iPhone | QR schnell scannen |
| 19 | Aisha | 36 | Lehrerin, rot-grün-schwach | 5c | Android | Farben unterscheiden |
| 20 | Peter | 63 | Steuerberater | 5a | iPhone 13 mini | wissen, was es kostet |
| 21 | Lina | 28 | Physiotherapeutin, Kletter-Trainerin | 7a | iPhone | Gruppe mit Kids |
| 22 | Ömer | 34 | Lagerist, Deutsch als Zweitsprache | 6a | Android | einfache Wörter |
| 23 | Carla | 46 | Architektin, Hallenplanung | 5c | iPhone | Halle sieht professionell aus |
| 24 | Ben | 21 | Azubi Fachinformatiker | 6c+ | Android | will mitbauen |
| 25 | Helga | 61 | Betreiberin einer kleinen Boulderhalle | klettert nicht | Android | wenig Aufwand für das Personal |
| 26 | Yannick | 30 | Wettkampfkletterer | 7c+ | iPhone | Profi-Daten, schnell |
| 27 | Sabine | 50 | Krankenschwester, Tremor in der Hand | 5a | Android | treffbare Knöpfe |
| 28 | Marco | 38 | Italienischer Tourist, Englisch | 6b | Android | App für eine Woche Urlaub |
| 29 | Jakob | 25 | Medizinstudent | 6c | iPhone | Offline im Kellerraum |
| 30 | Dana | 42 | Selbstständige Fotografin | 5c | iPhone | Wandfotos, die gut aussehen |

Populationen: Hallenpersonal (1, 2, 11, 16, 25), Handwerk/Pflege/Schicht (4, 8, 12, 13, 22, 27), Studierende/Azubis/Schüler (6, 13, 17, 24, 29), Eltern (9, 21), Ältere 55+ (3, 8, 14, 20, 25, 27), Einschränkungen (3, 19, 27), Englischsprachige/Touristen (10, 28), Kreative/Lehrkräfte/Kaufleute (15, 19, 20, 23, 30), MINT (7, 14, 24), Profis/Trainer (21, 26).
Geräte: 14 iPhone/iPad, 16 Android.

## Gespräch

**Bettina (1):** Ich sag's gleich: Gäste fragen mich an der Theke «Gibt's da eine App?». Wenn ich dann sage «Geh auf bouldermate.ch und tipp auf Teilen, Zum Home-Bildschirm», gucken die mich an wie ein Auto. Eine echte App im Store hilft mir mehr als alles andere.

**Monika (11):** Genau. Ich will nicht jedem erklären, wo das Teilen-Symbol ist. «Such BoulderMate im App Store», fertig.

**Priya (7):** Technisch finde ich Capacitor vernünftig. Kein zweiter Code, das ist für ein kleines Projekt das Einzige, was langfristig hält. Aber zwei Sachen fehlen in der Spec. Erstens: Apple verlangt, dass man sein Konto **in der App löschen** kann, wenn man eins anlegen kann. Steht nirgends drin.

**Julia (5):** Danke. Und zweitens wahrscheinlich die Datenschutzerklärung. Beide Stores wollen einen Link darauf und Apple will diese Datenschutz-Etiketten ausgefüllt haben, welche Daten gesammelt werden. Wenn eure Datenschutzseite noch «Entwurf» ist, kommt ihr da gar nicht durch.

**Peter (20):** Und wer füllt das aus? Das klingt nach Arbeit, die in der Spec nicht vorkommt.

**Priya (7):** Das gehört in eine Liste «Wer macht was». Manches kann nur der Kontoinhaber, also Hans.

**Rosemarie (66):** Mich interessiert was ganz anderes. Bei der Webseite muss ich mich dauernd neu anmelden, weil mein Enkel irgendwas im Safari löscht. Bleib ich in der App angemeldet?

**Jakob (29):** Das sollte die App eigentlich besser können als Safari. Aber die Spec sagt dazu nichts.

**Priya (7):** Wichtig ist auch der Rücksprung nach Google-Login. Wenn der App-Link nicht in Supabase eingetragen ist, landet man nach der Anmeldung auf der Webseite statt in der App. Das passiert bei solchen Projekten ständig.

**Yannick (26):** Auf dem iPhone will ich bei Apple-Login nicht in einen Browser geschickt werden. Da gibt's doch dieses Fenster mit Face ID. Zwei Sekunden, fertig.

**Tamara (15):** Ja, das System-Fenster für Apple ist viel schöner. Browser aufgehen, wieder zugehen, das wirkt bastelig.

**Werner (8):** Ich verstehe die Hälfte nicht. Ich will die App öffnen und meine Boulder sehen. Muss ich mich überhaupt anmelden?

**Mia (17):** Gute Frage. Ich hab mich am Anfang auf der Webseite gar nicht angemeldet und nur geschaut.

**Jens (18):** Zum QR-Code: Ich scanne Codes immer mit der normalen Kamera. Ich öffne doch nicht erst die App und such dann den Scanner. Wenn ich die App habe, soll der Code von der Wand **direkt in der App** aufgehen, nicht im Browser.

**Stefan (16):** Ganz wichtig für die Hallen. Unsere Codes zeigen auf bouldermate.ch. Wenn die mit App im Browser landen, hat der Gast zwei BoulderMates und weiß nicht, wo seine Tops sind.

**Ben (24):** Das nennt sich Universal Links bei Apple und App Links bei Android. Man legt zwei kleine Dateien auf die Webseite, dann öffnet das Handy die App. Kostet wenig.

**Bettina (1):** Und wer die App nicht hat? Dann soll die Webseite oben sagen «Gibt's auch als App». Aber bitte kein Pop-up, das den ganzen Bildschirm zumacht.

**Helga (25):** Auf unseren Flyer gehören dann die Store-Knöpfe. Den QR-Flyer haben wir ja schon.

**Sarah (9):** Ich hab immer ein Kind am Arm. Was ich auf der Webseite hasse: Ich drück auf Android «Zurück» und die ganze Seite ist weg. In der App muss «Zurück» erst das offene Fenster zumachen.

**Dragan (4):** Genau das. Zurück heißt zurück, nicht raus.

**Aisha (19):** Werden meine Einstellungen übernommen? Ich hab auf dem Handy die Schrift groß gestellt. Viele Apps ignorieren das einfach.

**Georg (14):** Auf dem iPad sowieso. Die Webseite wird im Safari größer, wenn ich zoome. Kann ich in der App zoomen? Ich vermute nein.

**Rosemarie (3):** Dann bleib ich bei der Webseite. Wenn die App kleiner schreibt als mein Handy eingestellt ist, ist sie für mich wertlos.

**Priya (7):** Das ist lösbar: Android-Schriftgröße an die Web-Ansicht durchreichen, auf iPhone die Systemschrift nutzen. Muss aber in die Spec, sonst vergisst man's.

**Sabine (27):** Und die Knöpfe ganz unten. Bei neueren iPhones liegt da dieser Balken. Wenn eure Tab-Leiste da drunter rutscht, treff ich mit meiner zittrigen Hand gar nichts.

**Tamara (15):** Oben genauso, die Kamera-Insel. Die Webseite im Safari hat den Rand automatisch, in so einer Hülle nicht.

**Kevin (2):** Ich als Schrauber: Kamera ist super, aber mein Handy macht Fotos mit 12 MB. Wird das verkleinert, bevor es hochgeht? Im Keller hab ich kein Netz, da will ich nicht warten.

**Dana (30):** Und bitte nicht so stark komprimieren, dass das Wandfoto matschig wird. Die Leute suchen die Griffe auf dem Foto.

**Stefan (16):** Mein eigentliches Studio-Gerät ist ein Android-Tablet. Und unsere Hallenleitung hat ein iPad. Die Spec sagt nichts zu Tablets.

**Georg (14):** Auf dem iPad laufen iPhone-Apps notfalls im kleinen Fenster. Hässlich, aber geht.

**Carla (23):** Für Schrauber auf dem iPad kann man auch die Webseite nehmen, die ist ja voll da.

**Noah (6):** Mein Handy hat Android 9. Läuft das überhaupt? Die Spec sagt nicht, ab welcher Version.

**Elif (13):** Und wie groß ist die App? Ich hab 400 MB frei, Fotos von der Ausbildung und so.

**Ben (24):** So eine Hülle ist klein, unter 30 MB. Kann man in die Spec schreiben, dann ist die Sorge weg.

**Fabio (12):** Ich klettere nachts, die Halle hat im Keller kein Netz. Wenn ich die App zum ersten Mal im Keller öffne, was sehe ich dann?

**Jakob (29):** Das ist der Knackpunkt bei «startet ohne Netz». Die App-Dateien sind drin, aber die Boulder der Halle nicht, wenn man sie nie geladen hat.

**Priya (7):** Dann braucht es einen ehrlichen Satz: «Noch keine Daten. Verbinde dich einmal mit dem Netz, danach geht es auch offline.»

**Lina (21):** Push wollte ich eigentlich sagen. «Neue Boulder an der Wand» wäre für meine Trainingsgruppe super.

**Tamara (15):** Bitte nicht. Jede App will mir was pushen. Das Ruhige an BoulderMate gefällt mir.

**Lina (21):** Dann wenigstens später und nur, wenn ich es selbst einschalte.

**Yannick (26):** Einverstanden: später, freiwillig, eigene Spec.

**Liam (10):** For me: is the app store page in English? I search «bouldering log» in the store, not German words.

**Marco (28):** Same. And the app should start in English when my phone is English. The website does, I think, since the English update.

**Ömer (22):** Und die Texte, wenn das Handy fragt «Darf BoulderMate die Kamera benutzen?». Da steht oft so ein Satz, den keiner versteht. Bitte einfach: «Für Fotos von der Wand».

**Julia (5):** Und erst fragen, wenn man auf den Knopf drückt. Nicht beim ersten Start alles auf einmal.

**Peter (20):** Kosten: 99 Dollar jedes Jahr für Apple. Das ist okay, aber wer zahlt das, wenn Hans mal keine Lust mehr hat? Dann verschwindet die App aus dem Store, oder?

**Priya (7):** Ja, ohne bezahltes Konto wird die App nach Ablauf nicht mehr angeboten. Die Webseite bleibt aber. Sollte man wissen.

**Werner (8):** Und wenn die Webseite was Neues hat, hat es die App dann auch?

**Ben (24):** Nicht automatisch, weil der Inhalt in die App gepackt ist. Man muss eine neue Version in den Store schicken. Apple prüft das jedes Mal.

**Kevin (2):** Also hat die App immer ein bisschen Rückstand zur Webseite?

**Priya (7):** Ja. Darum ist «Mindestversion» richtig, aber nur für den Fall, dass alte Apps kaputtgehen. Für normale Neuerungen reicht ein ruhiger Hinweis «Neue Version im Store».

**Monika (11):** Hauptsache, nicht jeden Tag ein Hinweis.

**Helga (25):** Und für mich als kleine Halle: Ich will nichts einrichten müssen. Ändert sich für uns was?

**Stefan (16):** Eigentlich nicht, die QR-Codes bleiben dieselben. Das ist ja der Clou mit den Links.

**Mia (17):** Letzte Frage: Kommt beim Start der App so ein «Bewerte uns mit 5 Sternen»-Fenster? Das nervt mich bei jeder App.

**Tamara (15):** Bitte nein.

**Dragan (4):** Wenn die App so schnell ist wie die Webseite und Zurück funktioniert, bin ich dabei. Mehr will ich nicht.
