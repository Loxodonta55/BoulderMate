# Runde 3 – Unterhaltung: SPEC-045 «BoulderMate als App» (Stand v3)

> **Simuliert**, kein echtes Nutzerfeedback. Ablauf nach [feedback-einholen.md](../../prozesse/feedback-einholen.md).
> **Gegenstand:** SPEC-045 v3: wie v2, dazu Testphase (Android 12 Tester / 14 Tage, TestFlight) mit Partnerhallen, Melden und Blockieren als Voraussetzung (SPEC-046), Wandfotos der letzten Halle offline, Checkliste für Hans, Prüfer-Zugang mit Demo-Halle, Schrift bis 200 %, kein Tracking, Startbild hell/dunkel, «Dein Konto gilt auch hier», Kamera-Wiederherstellung, Store-Text kurz in DE/EN, Startzeit < 2 s, Release aus demselben Commit.
> **Leitfrage:** Würdet ihr die App so am ersten Tag installieren und weiterempfehlen? Was stört noch, was ist zu viel?

## Teilnehmende

| # | Name | Alter | Beruf / Population | Klettern | Gerät | Erwartung |
|---|------|-------|--------------------|----------|-------|-----------|
| 1 | Franziska | 42 | Geschäftsführerin Kletterhalle Frauenfeld | 6a | iPhone | einfach für Gäste und Personal |
| 2 | Malte | 29 | Schrauber, gelernter Schlosser | 7a | Android | Fotos ohne Ärger |
| 3 | Gerda | 68 | Rentnerin, Hörgerät, Lesebrille | 4 | Android, Schrift 180 % | lesen können |
| 4 | Jonas | 24 | Student Wirtschaftsinformatik | 6c | iPhone | schnelle App |
| 5 | Ayşe | 37 | Kita-Erzieherin, zwei Kinder | 5a | Android | Kinder sicher |
| 6 | Bruno | 55 | Lkw-Fahrer | 5c | Android (alt, Android 10) | läuft auf altem Handy |
| 7 | Nora | 31 | UX-Designerin | 6b | iPhone 16 Pro | stimmiges Erlebnis |
| 8 | Heinz | 70 | pensionierter Lehrer | 4+ | iPad | große Schrift auf dem iPad |
| 9 | Lukas | 20 | Azubi Kfz-Mechatroniker | 6b | Android | keine Werbung |
| 10 | Emma | 28 | Engländerin, Doktorandin in Konstanz | 6c | iPhone, Englisch | English store page |
| 11 | Ralf | 46 | Datenschutz-Auditor | 5c | Android | was passiert beim Löschen |
| 12 | Sophie | 23 | Tanzpädagogin | 5c | iPhone | schön, ruhig |
| 13 | Murat | 40 | Kioskbesitzer | 5a | Android | schnell erklärt |
| 14 | Ida | 19 | Abiturientin, Anfängerin | 3 | iPhone SE | kein Druck |
| 15 | Christoph | 50 | Chefschrauber München | 6c | iPhone + Android-Tablet | Studio |
| 16 | Hanna | 34 | Hebamme, Nachtdienst | 6a | iPhone | wenig Akku |
| 17 | Pavel | 36 | Tscheche, Softwaretester | 7a | Android | testen helfen |
| 18 | Doris | 59 | Thekenkraft | 5a | Android | Gästen helfen |
| 19 | Tim | 27 | Bergführer-Anwärter, reist | 7b | iPhone | viele Hallen |
| 20 | Martina | 45 | Rollstuhlnutzerin, sitzt an der Wand als Sicherung/Coach | – | iPhone, Sprachsteuerung | bedienbar ohne Feinmotorik |
| 21 | Oskar | 33 | Elektroingenieur | 6b | Pixel | Technik sauber |
| 22 | Selma | 26 | Pflegefachfrau | 5c | Android | einfach |
| 23 | Arne | 61 | Hobby-Fotograf, Grünschwäche | 5b | Android | Farben mit Wort |
| 24 | Leila | 30 | Marketing in einer Outdoor-Marke | 6a | iPhone | Store-Auftritt |
| 25 | Valentin | 18 | Schüler, Jugendkader | 7a | Android | schnell loggen |
| 26 | Barbara | 52 | Steuerfachangestellte | 4+ | iPhone | Kosten |
| 27 | Jorge | 44 | Spanischer Gast-Schrauber | 7b | Android, Englisch | Studio auf Englisch |
| 28 | Clemens | 39 | Notfallsanitäter | 6b | iPhone | Handschuhe, Kreide |
| 29 | Wiebke | 48 | Schulleiterin, plant Kletter-AG | 4 | iPad | Gruppe von Kindern |
| 30 | Kenji | 35 | Japanischer Ingenieur in München | 6c | iPhone, Englisch | klare Struktur |

Populationen: Hallenpersonal (1, 2, 15, 18, 27), Handwerk/Pflege/Schicht (2, 6, 9, 16, 22, 28), Studierende/Schüler (4, 14, 25), Eltern/Pädagogik (5, 12, 29), Ältere 55+ (3, 6, 8, 18, 23), Einschränkungen (3, 20, 23), Englischsprachige (10, 27, 30), Kreative/Kaufleute (7, 12, 13, 24, 26), MINT (17, 21, 30), Profis (19, 25).
Geräte: 15 iPhone/iPad, 15 Android. Wieder neue Personen, Schwerpunkt erster Tag und Weiterempfehlen.

## Gespräch

**Franziska (1):** Ich hab die v3 gelesen. Ehrlich: Das ist rund. Für mich als Halle ändert sich nichts, die QR-Codes bleiben, und ich kann den Gästen sagen «App laden, gleiches Konto». Mehr brauche ich nicht.

**Doris (18):** Den Tester-Zettel finde ich gut. Ich würde nur gern wissen, was ich sage, wenn einer fragt «Was passiert mit meinen Daten, wenn ich die App lösche?»

**Ralf (11):** Darauf wollte ich auch hinaus. Zwei Dinge: **App löschen** und **Konto löschen**. App löschen: die Daten auf dem Handy sind weg, dein Konto bleibt. Konto löschen: alles weg, auch auf dem Server. In der Spec steht «Konto löschen in der App», aber nicht, wie das technisch geht. Ein Konto auf dem Server löschen kann man mit dem öffentlichen Schlüssel nicht einfach so.

**Oskar (21):** Stimmt, dafür braucht es eine Datenbank-Funktion, die nur das eigene Konto löschen darf. Die muss eingespielt werden.

**Ralf (11):** Und eine Bestätigung, bitte mit Eintippen oder zweitem Knopf, nicht ein Tipp und weg.

**Gerda (3):** Bei 180 % Schrift: Sind die Knöpfe dann noch nebeneinander? Bei meiner Bank-App rutscht «Abbrechen» aus dem Bild.

**Nora (7):** Die Spec sagt «bis 200 % ohne abgeschnittene Texte». Das reicht mir, wenn es wirklich getestet wird. Dann sollte im Test stehen, welche Ansichten geprüft werden: Wand, Boulder-Details, Einstellungen, Login.

**Martina (20):** Ich bediene das iPhone mit Sprachsteuerung. Dafür muss jeder Knopf einen Namen haben, den man sagen kann. «Tippe Top» muss gehen. Bei vielen Apps heißen Knöpfe «Knopf 3».

**Nora (7):** Dieselbe Regel wie für VoiceOver. Kann man in den Test aufnehmen: Jeder Knopf hat einen sichtbaren oder vorlesbaren Namen.

**Heinz (70):** Auf dem iPad ist die iPhone-App klein. Ich nehme dann die Webseite, das ist in Ordnung. Aber sagt es mir im Store, sonst denke ich, die App ist kaputt.

**Wiebke (29):** Für die Schule genauso. Unsere Kinder haben iPads der Schule. Webseite geht da sowieso.

**Ayşe (5):** Dass Melden und Blockieren vor dem Start kommt, beruhigt mich. Ich will nur, dass die Kinder nicht im Treff auftauchen, wenn sie nicht wollen.

**Christoph (15):** Das regelt doch schon «Sichtbarkeit» aus SPEC-033, oder? Wer nicht sichtbar sein will, ist es nicht.

**Ayşe (5):** Dann ist das gut. Vielleicht beim ersten Start in der App nicht noch extra fragen. Einmal reicht.

**Bruno (6):** Android 10 – läuft es?

**Oskar (21):** Die Spec sagt Android 7 und neuer. Also ja.

**Bruno (6):** Gut. Mehr wollte ich nicht wissen.

**Jonas (4):** Kleiner Punkt: Gibt es den Namen «BoulderMate» im Store schon? Ich hab mal sowas Ähnliches gesehen. Wenn der Name belegt ist, kann man nicht einreichen.

**Leila (24):** Dann vorher prüfen und einen Ersatz bereithalten, zum Beispiel «BoulderMate – Boulder-Tagebuch». Der Untertitel hilft sowieso bei der Suche: Leute suchen «Boulder», «Kletterhalle», «Tick-Liste».

**Emma (10):** And for English: «bouldering», «climbing gym», «logbook».

**Jorge (27):** Das Studio ist noch nicht auf Englisch, steht in SPEC-044. Für mich als Gast-Schrauber ist das ein Problem, aber nicht eines der App. Kommt das mit der App?

**Christoph (15):** Das gehört nicht hier rein. Die App zeigt, was die Webseite kann.

**Jorge (27):** Okay, dann bitte irgendwo festhalten, dass es fehlt.

**Malte (2):** Als Schrauber: Die Foto-Wiederherstellung steht drin, sehr gut. Was ich noch nicht weiß: Ich mache das Foto mit dem Handy im Querformat. Bleibt das quer?

**Oskar (21):** Die App ist im Hochformat festgelegt. Fotos werden aber mit ihrer eigenen Ausrichtung gespeichert, das ist unabhängig. Kann man im Test prüfen.

**Malte (2):** Dann reicht mir das.

**Hanna (16):** Ich arbeite nachts und hab das Handy auf «Nicht stören». Mich freut, dass es keinen Push gibt. Bitte auch später nicht ohne Frage.

**Tim (19):** Ich reise. Wandfotos nur von einer Halle offline ist knapp. Zwei wären schöner.

**Pavel (17):** Dann sind es 100 MB. Ich würde bei einer bleiben. Die letzte Halle ist die, in der du gerade bist.

**Tim (19):** Fair.

**Murat (13):** Für meinen Kiosk neben der Halle: Ich hab ein Schild «BoulderMate laden». Gibt es dafür ein fertiges Bild mit den Store-Knöpfen? Die Hallen bekommen ja einen neuen Flyer.

**Franziska (1):** Den neuen Flyer will ich auch. Mit den zwei Store-Knöpfen und dem QR-Code.

**Barbara (26):** Kosten: 99 Dollar im Jahr, 25 Dollar einmal, Codemagic gratis. Gibt es irgendwas, das später kostet? Zum Beispiel, wenn viele Leute die App laden?

**Oskar (21):** Die Stores nehmen bei kostenlosen Apps nichts. Codemagic kostet nur, wenn man das Gratis-Kontingent an Bauzeit überschreitet, bei ein paar Versionen im Monat nicht.

**Clemens (28):** Mit Handschuhen: Der Scanner-Knopf muss groß sein. Steht 48 Pixel drin, gut. Und der Scanner soll ohne extra Tippen auslösen, sobald er den Code sieht.

**Kenji (30):** That is the normal behaviour of the native scanner. Fine.

**Valentin (25):** Mir ist das alles zu lang zum Lesen, aber das, was ich brauche, ist drin: schnell, kein Werbe-Mist, offline.

**Ida (14):** Ich finde den Satz beim ersten Start gut, dass mein Konto gilt. Sonst hätte ich mich nochmal registriert.

**Sophie (12):** Ein letzter Geschmackspunkt: Das Startbild bitte nur das Logo, keine Sprüche.

**Selma (22):** Ja. Und schnell weg.

**Arne (23):** Für mich mit Grünschwäche: Die Store-Screenshots zeigen hoffentlich die Pin-Nummern und Farbnamen. Dann sehe ich gleich, dass die App das kann.

**Leila (24):** Gute Idee für die Screenshots: Nummern im Pin, Farbname, große Schrift. Das ist ein Verkaufsargument.

**Franziska (1):** Für mich ist das fertig. Ich würde es installieren und meinen Gästen empfehlen.
