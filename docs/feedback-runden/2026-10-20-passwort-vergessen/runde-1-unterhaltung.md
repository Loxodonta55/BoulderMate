# Runde 1 – Unterhaltung: SPEC-049 «Passwort vergessen und Anmelden mit E-Mail» (Stand v1)

> **Simuliert**, kein echtes Nutzerfeedback. Ablauf nach [feedback-einholen.md](../../prozesse/feedback-einholen.md).
> **Gegenstand:** SPEC-049 v1 (Grill-me-Ergebnis): Im Login-Fenster ersetzt ein großer Link **«Passwort vergessen?»** den bisherigen kleinen Knopf «Passwort vergessen? / Magic Link». Er öffnet eine Ansicht mit einem E-Mail-Feld und «Link senden». Die Antwort ist immer gleich («Wenn es ein Konto gibt, kommt gleich eine Mail»). Der Link in der Mail führt zur Ansicht **«Neues Passwort festlegen»** (ein Feld, mind. 6 Zeichen, Auge zum Anzeigen) und funktioniert auf jedem Gerät, 1 Stunde lang. Danach ist man angemeldet und auf der Wand. Registrieren mit Bestätigungsmail zeigt **«Fast geschafft – bestätige deine E-Mail»** statt einer Schein-Anmeldung; «Bestätigungsmail nochmal senden». «E-Mail vergessen»: kein Nachschlagen per Spitzname (Datenschutz), nur ein Hilfetext. Englisch über t().
> **Leitfrage:** Kommt jemand, der sein Passwort oder seine Anmelde-Adresse vergessen hat, allein und schnell wieder rein, ohne dass die App Konten verrät?

## Teilnehmende

| # | Name | Alter | Beruf / Population | Klettern | Gerät | Erwartung |
|---|------|-------|--------------------|----------|-------|-----------|
| 1 | Hannelore | 71 | Rentnerin, Seniorenkurs | 3+ | altes Android, Schrift 150 % | «Ich vergesse Passwörter ständig» |
| 2 | Werner | 64 | Elektromeister im Ruhestand, Lesebrille | 5a | Android | große Knöpfe |
| 3 | Gerda | 58 | Kassiererin | 4 | Android | einfache Wörter |
| 4 | Klaus | 66 | pensionierter Bankkaufmann | 5b | iPad | Sicherheit |
| 5 | Jana | 33 | Mutter von Zwillingen, Teilzeit Büro | 5c | iPhone | eine Hand frei |
| 6 | Tobias | 39 | Vater, Lagerist | 5b | Android | schnell |
| 7 | Emily | 24 | Austauschstudentin aus Kanada | 6a | iPhone | Englisch |
| 8 | Raúl | 31 | Tourist aus Madrid | 6b | Android | Englisch, Gast |
| 9 | Ahmed | 36 | Pfleger, Deutsch als Zweitsprache | 6b | Android | einfache Sprache |
| 10 | Mia | 19 | Abiturientin, Anfängerin | 4 | iPhone | Mails liest sie kaum |
| 11 | Leon | 21 | Azubi Kfz-Mechatroniker | 6c | Android | hat drei Mail-Adressen |
| 12 | Paula | 23 | Studentin Soziale Arbeit | 5c | iPhone, Uni-Mail | Spam-Ordner |
| 13 | Ralf | 52 | Chefschrauber | 6c | Android, große Schrift | Kunden fragen ihn |
| 14 | Thomas | 45 | Theke und Schichtleitung | 5c | Tablet an der Theke | Gäste ohne Zugang |
| 15 | Gisela | 61 | Hallenbetreiberin | – | Tablet | kein Aufwand fürs Personal |
| 16 | Aylin | 23 | Schrauberin | 6b | Android | Google-Konto |
| 17 | Lukas | 40 | Lehrer, rot-grün-schwach | 6a | Android | Farben |
| 18 | Clara | 42 | Grafikerin, eingeschränkte Handfunktion | 5c | iPhone | große Felder, Passwort-Manager |
| 19 | Bernd | 59 | Schreiner, Lesebrille | 5c | Android | ohne Brille in der Halle |
| 20 | Sabine | 47 | Pflegedienstleitung, Schicht | 6a | Android | nachts nach der Schicht |
| 21 | Mehmet | 41 | Elektriker | 6a | Android | versteht «Magic Link» nicht |
| 22 | Tim | 31 | Softwareentwickler | 7a | Pixel | Sicherheit, Passwort-Manager |
| 23 | Yuki | 28 | Doktorandin Biologie | 6c | Android | Datenschutz |
| 24 | Ulrike | 49 | Ärztin | 5a | iPhone | geteilte Geräte |
| 25 | Nina | 30 | Jugendtrainerin | 7a | iPhone | Kids mit Eltern-Mail |
| 26 | Markus | 44 | Dachdecker, Sohn 12 | 5a | iPhone | Sohn nutzt Papas Mail |
| 27 | Oliver | 44 | Kaufmann im Vertrieb | 5c | iPhone | Nutzen in einem Satz |
| 28 | Fatma | 37 | Friseurin | 5a | Android | Kreide an den Händen |
| 29 | Jonas | 27 | Sportstudent | 7b | iPhone, PC zu Hause | Link am anderen Gerät |
| 30 | Renate | 68 | Rentnerin, Kletterkurs mit Enkel | 4 | Tablet | Enkel hat das Konto angelegt |

Populationen: Ältere 55+ (1, 2, 3, 4, 15, 19, 30), Eltern (5, 6, 26), Englischsprachige / Zweitsprache (7, 8, 9), Studierende / Azubis (10, 11, 12, 29), Hallenpersonal (13, 14, 15, 16), Einschränkungen (2, 17, 18, 19), Handwerk / Pflege / Schicht (9, 19, 20, 21, 28), MINT (22, 23), Ärzte / Lehrkräfte / Trainer (17, 24, 25), Kaufleute / Kreative (18, 27).

## Gespräch

**Moderation:** Ihr steht in der Halle, wollt einen Top eintragen, und die App will euer Passwort. Ihr wisst es nicht mehr. Was passiert?

**Hannelore (1):** Bei mir passiert das jede Woche bei irgendeiner App. Wenn da groß «Passwort vergessen?» steht, tippe ich drauf. Heute steht da klein «Passwort vergessen? / Magic Link». Was ist ein Magic Link? Klingt nach Zauberei, da tippe ich nicht drauf.

**Mehmet (21):** Genau. «Magic Link» sagt mir nichts. Gut, dass das wegkommt.

**Werner (64):** Ich hab den kleinen Text gar nicht gesehen. Der ist winzig und hellblau. In der neuen Version: Wie groß ist der Link?

**Moderation:** Gleich groß wie der übrige Text, mindestens 16 Punkt.

**Bernd (19):** Ohne Brille in der Halle sehe ich 16 gerade so. Mach es einen richtigen Knopf, nicht nur blauen Text.

**Tim (22):** Ein Textlink unter dem Passwortfeld ist der Standard, den kennt jeder. Ein zweiter großer Knopf neben «Anmelden» lenkt ab.

**Clara (18):** Dann aber ein großer Tippbereich, mindestens so hoch wie ein Knopf. Ich treffe kleine Links mit meiner Hand nicht.

**Leon (11):** Mein Problem ist eher: Ich hab drei Mail-Adressen. Welche hab ich bei BoulderMate genommen? «Passwort vergessen» hilft mir nicht, wenn ich die falsche Adresse eintippe und dann «Wenn es ein Konto gibt, kommt eine Mail» lese. Ich warte und warte.

**Yuki (23):** Aber die App darf nicht sagen «Diese Adresse kennen wir nicht». Sonst kann jeder ausprobieren, ob seine Ex BoulderMate nutzt.

**Leon (11):** Dann soll da wenigstens stehen: «Nichts angekommen? Probier deine andere Adresse.»

**Paula (12):** Und «Schau im Spam-Ordner». Meine Uni-Mail schiebt alles von unbekannten Absendern in den Spam.

**Aylin (16):** Ich hab mich mit Google angemeldet. Wenn ich jetzt auf «Passwort vergessen» gehe, weil ich vergessen hab, wie ich mich angemeldet habe, was passiert dann?

**Tim (22):** Bei Supabase bekommt auch ein Google-Konto eine Mail, und danach hat es zusätzlich ein Passwort. Funktioniert, ist aber ein Umweg.

**Aylin (16):** Dann soll da stehen: «Mit Google angemeldet? Dann einfach oben ‹Mit Google fortfahren› tippen.» Das hätte mir zehn Minuten gespart.

**Renate (30):** Mein Enkel hat mein Konto angelegt. Ich weiß nicht mal, welche Adresse er genommen hat. Vielleicht seine?

**Nina (25):** Das ist bei den Jugendlichen ähnlich: Konto mit Mamas Adresse. Dann kommt die Mail bei Mama an.

**Thomas (14):** Und dann stehen sie bei mir an der Theke: «Können Sie mein Passwort zurücksetzen?» Kann ich das?

**Moderation:** Nein. Das Hallenpersonal sieht weder Passwort noch Adresse.

**Gisela (15):** Gut so. Ich will nicht, dass meine Leute an Konten rumfummeln. Aber dann muss die App den Leuten sagen, an wen sie sich wenden, nicht an die Theke.

**Ulrike (24):** Und wenn jemand fremdes mein Passwort zurücksetzt? Dafür braucht er doch meinen Posteingang. Dann ist es sicher. Aber was ist mit dem Handy, das ich mal verloren habe? Bin ich da noch angemeldet, wenn ich das Passwort ändere?

**Tim (22):** Das ist ein guter Punkt. Nach einem Zurücksetzen sollten alle anderen Geräte abgemeldet werden. Supabase kann das (`signOut` mit `scope: others`).

**Jonas (29):** Dann fliege ich auf dem Handy raus, wenn ich am PC das Passwort zurücksetze. Ist okay, wenn es vorher dasteht.

**Klaus (4):** Ich will das sogar. Wer sein Passwort ändert, will meistens, dass alle anderen draußen sind.

**Jonas (29):** Anderes Problem: Ich fordere am PC an, öffne die Mail aber am Handy. Geht das?

**Moderation:** Laut v1 ja, der Link funktioniert auf jedem Gerät.

**Tim (22):** Das muss man technisch sicherstellen. Mit dem heutigen PKCE-Ablauf klappt der Standard-Link nur im selben Browser. Mit `token_hash` in der Mail-Vorlage geht es überall. Das muss Hans im Supabase-Dashboard einstellen.

**Paula (12):** Und im Gmail-Browser innerhalb der App? Da landen bei mir alle Links.

**Tim (22):** Auch dort, wenn es `token_hash` ist.

**Sabine (20):** Ich mache so etwas nachts nach der Schicht, halb im Schlaf. Ein Passwortfeld, bei dem ich nicht sehe, was ich tippe, und dann komme ich nicht rein, weil ich mich vertippt habe. Das Auge zum Anzeigen ist gut.

**Klaus (4):** Ich bin gewohnt, das Passwort zweimal einzugeben. Sonst habe ich Angst, mich vertippt zu haben.

**Clara (18):** Zweimal tippen ist für mich doppelte Arbeit. Das Auge ist besser.

**Tim (22):** Und das Feld braucht `autocomplete="new-password"`, damit der Passwort-Manager ein neues vorschlägt und speichert. Sonst bleibt das alte gespeichert, und ich komme nächste Woche wieder nicht rein.

**Tim (22):** Mindestens 6 Zeichen ist übrigens schwach. Acht wäre heute normal.

**Hannelore (1):** Bitte nicht noch Sonderzeichen und Großbuchstaben. Dann schreibe ich es auf einen Zettel, das ist auch nicht sicherer.

**Yuki (23):** Sechs ist die Supabase-Einstellung. Wenn die App acht verlangt und Supabase sechs, ist es wenigstens nicht widersprüchlich. Ich würde es nicht verschärfen, die App speichert keine Gesundheitsdaten.

**Gerda (3):** Was steht in der Mail? Wenn da auf Englisch «Reset your password» steht, lösche ich sie, das sieht aus wie Betrug.

**Ahmed (9):** Ja. Und die Mail muss von «BoulderMate» kommen, nicht von «Supabase Auth».

**Emily (7):** Für mich bitte auf Englisch. Wenn die App auf Englisch ist, aber die Mail auf Deutsch kommt, verstehe ich nur «Passwort».

**Moderation:** Die Mail-Vorlage ist eine für alle. Sie kann zweisprachig sein.

**Raúl (8):** Zweisprachig ist okay. Deutsch oben, Englisch darunter.

**Mia (10):** Ich lese Mails eigentlich nie. Wenn ich mich registriere und dann steht da «Bestätige deine E-Mail», mache ich die App zu. Kann man nicht einfach drin sein?

**Tim (22):** Ohne Bestätigung kann sich jeder mit fremder Adresse registrieren. Ist eine Einstellung bei Supabase. Wichtiger ist: Heute tut die App so, als wäre man angemeldet, obwohl Supabase noch auf die Bestätigung wartet. Dann geht Speichern schief. Gut, dass v1 das ehrlich anzeigt.

**Mia (10):** Okay, aber dann sag mir genau, was ich tun muss. Nicht «Bestätige deine E-Mail», sondern «Öffne die Mail von BoulderMate und tippe auf den Knopf».

**Markus (26):** Und zeig die Adresse groß an. Mein Sohn tippt sich ständig bei der Adresse vertan. Dann wartet er auf eine Mail, die nie kommt.

**Fatma (28):** Mit Kreide an den Fingern tippe ich nicht gern. Wenn ich nach dem Link wieder ins Login-Fenster muss und alles neu eingeben, nervt das. Bin ich nach dem Bestätigen direkt drin?

**Moderation:** In v1 ist man nach dem neuen Passwort direkt angemeldet. Nach dem Bestätigungslink bisher nicht festgelegt.

**Fatma (28):** Dann bitte auch da direkt rein.

**Oliver (27):** Der Nutzen in einem Satz: Wer sein Passwort vergisst, ist in zwei Minuten wieder drin. Das reicht. Bitte keine Sicherheitsfragen wie «Name des ersten Haustiers».

**Lukas (17):** Fehlermeldungen bitte nicht nur rot. Ich sehe Rot schlecht. Ein Symbol davor.

**Werner (64):** Und was passiert, wenn ich den Link erst am nächsten Tag öffne?

**Moderation:** Nach einer Stunde ist er abgelaufen.

**Werner (64):** Und was sehe ich dann? Heute steht da vermutlich irgendwas Technisches.

**Tim (22):** Heute steht da «Google-Anmeldung abgebrochen». Das liegt daran, dass Supabase `error=access_denied` zurückgibt und die App das für Google hält. Das muss weg.

**Werner (64):** Dann: «Der Link ist abgelaufen. Hier neuen anfordern.» Mit Knopf.

**Jana (5):** Kurz: großer Link, klare Sätze, Spam-Hinweis, Google-Hinweis. Mehr brauche ich nicht. Ich habe ein Kind auf dem Arm.

**Ralf (13):** Für uns Schrauber wichtig: Bitte nicht im Schrauber-Studio irgendwas dazu. Das ist reine Anmeldesache.

**Renate (30):** Und wenn ich es gar nicht schaffe? Wen frage ich?

**Gisela (15):** Eine Kontaktadresse von BoulderMate, nicht die Halle.

**Yuki (23):** Steht in der Datenschutzerklärung ohnehin. Ein Link dahin reicht.
