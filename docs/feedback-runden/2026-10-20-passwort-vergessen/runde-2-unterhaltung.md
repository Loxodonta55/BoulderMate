# Runde 2 – Unterhaltung: SPEC-049 (Stand v2)

> **Simuliert**, kein echtes Nutzerfeedback. Ablauf nach [feedback-einholen.md](../../prozesse/feedback-einholen.md).
> **Gegenstand:** SPEC-049 v2. Neu gegenüber v1: Link funktioniert auf jedem Gerät (`token_hash`), abgelaufener Link öffnet direkt «Passwort vergessen» mit klarer Meldung, Bestätigungsansicht mit Spam-, Adress- und Google-Hinweis, Hilfetext «E-Mail-Adresse vergessen?», nach neuem Passwort werden andere Geräte abgemeldet, «Fast geschafft» beim Registrieren mit «Adresse falsch? Zurück» und «Nochmal senden», Bestätigungslink meldet direkt an, große Tippflächen, Auge und Passwort-Manager-Attribute.
> **Leitfrage:** Wo bleibt jemand trotzdem hängen, und was nervt beim zweiten und dritten Mal?

## Teilnehmende (neue Mischung)

| # | Name | Alter | Beruf / Population | Klettern | Gerät | Erwartung |
|---|------|-------|--------------------|----------|-------|-----------|
| 1 | Irmgard | 69 | Rentnerin, früher Sekretärin | 4 | Android, Schrift groß | Schritt für Schritt |
| 2 | Horst | 62 | Busfahrer kurz vor Rente | 5a | Android | keine Hektik |
| 3 | Brigitte | 57 | Arzthelferin, Gleitsicht | 5b | iPhone | gut lesbar |
| 4 | Dieter | 55 | Maurer | 5c | Android, Displaysprung | wenig tippen |
| 5 | Sarah | 35 | Mutter, Elternzeit | 5b | iPhone | wird ständig unterbrochen |
| 6 | Kemal | 42 | Vater, Taxifahrer | 6a | Android | schnell zwischendurch |
| 7 | Liam | 27 | Ire, Softwaretester in München | 6c | iPhone | Englisch |
| 8 | Sofía | 22 | Erasmus aus Argentinien | 5c | Android | Spanisch, Englisch ok |
| 9 | Olena | 34 | Ukrainerin, Deutschkurs B1 | 5a | Android | einfache Sätze |
| 10 | Finn | 18 | Schüler, Anfänger | 4 | iPhone | ungeduldig |
| 11 | Selin | 20 | Studentin Lehramt | 5c | iPhone | Schul-Mail und Privat-Mail |
| 12 | Max | 24 | Azubi Zimmerer | 6b | Android | tippt mit dicken Fingern |
| 13 | Mara | 34 | Schrauberin Frauenfeld | 7a | Android | Kunden fragen |
| 14 | Thomas | 45 | Theke | 5c | Tablet an der Theke | Gäste nutzen das Hallen-Tablet |
| 15 | Sven | 47 | Hallenbetreiber München | 6a | Android | Ärger vermeiden |
| 16 | Pedro | 38 | Gast-Schrauber | 7c | iPhone | viele Hallen |
| 17 | Karl | 67 | Ingenieur, Sehschwäche | 5b | iPad, Bildschirmlupe | Kontrast |
| 18 | Jule | 29 | Grafikerin, Screenreader-Nutzerin wegen Augenkrankheit | 5a | iPhone VoiceOver | Ansagen |
| 19 | Lukas | 40 | Lehrer, rot-grün-schwach | 6a | Android | Farben |
| 20 | Anja | 38 | Krankenschwester, Nachtdienst | 6a | Android | müde |
| 21 | Hakan | 55 | Busfahrer, Schicht | 5b | Android | kurze Wege |
| 22 | Moritz | 33 | IT-Sicherheit | 7a | Pixel | Kontoverrat |
| 23 | Yuki | 28 | Doktorandin | 6c | Android | Datenschutz |
| 24 | Petra | 63 | pensionierte Lehrerin | 5a | Android | freundlicher Ton |
| 25 | Nina | 30 | Jugendtrainerin | 7a | iPhone | Kids |
| 26 | Bettina | 46 | Steuerberaterin | 5c | iPhone | klare Abläufe |
| 27 | Rafael | 31 | Fotograf | 6b | iPhone | wenig Text |
| 28 | Lena | 29 | Pflegekraft | 6c | iPhone | Passwort-Manager |
| 29 | Hannes | 52 | Landwirt | 5a | altes Android | schlechter Empfang in der Halle |
| 30 | Greta | 70 | Rentnerin, klettert seit 2 Jahren | 3+ | Tablet | hat Angst, etwas kaputt zu machen |

Populationen: Ältere 55+ (1, 2, 3, 4, 17, 21, 24, 30), Eltern (5, 6), Englischsprachige / Zweitsprache (7, 8, 9), Studierende / Azubis / Schüler (10, 11, 12), Hallenpersonal (13, 14, 15, 16), Einschränkungen (17, 18, 19), Handwerk / Pflege / Schicht / Landwirtschaft (4, 12, 20, 21, 28, 29), MINT / IT (7, 22, 23), Lehrkräfte / Trainer (11, 24, 25), Kaufleute / Kreative (26, 27).

## Gespräch

**Moderation:** Gleiche Lage: Passwort weg. Diesmal ist der Ablauf v2. Wo hakt es?

**Finn (10):** Ich tippe «Link senden», nichts kommt sofort, also tippe ich nochmal und nochmal. Was passiert dann?

**Moritz (22):** Supabase blockt nach ein paar Anfragen. Dann kommt ein Fehler «rate limit exceeded». Den darf die App nicht so zeigen.

**Finn (10):** Dann sag mir einfach, ich soll warten. Am besten mit Sekunden: «Nochmal senden in 60 s».

**Greta (30):** Das beruhigt mich auch. Dann weiß ich, ich habe nichts kaputt gemacht.

**Irmgard (1):** Und schreib nicht «rate limit». Schreib «Bitte warte ein paar Minuten».

**Sarah (5):** Ich werde dauernd unterbrochen. Ich tippe «Link senden», das Kind schreit, ich komme nach zehn Minuten zurück, die App ist zu. Wenn ich dann die Mail öffne, geht es noch?

**Moderation:** Eine Stunde lang, auf jedem Gerät.

**Sarah (5):** Gut. Und wenn ich in der Zeit zweimal angefordert habe, welcher Link gilt?

**Moritz (22):** Bei Supabase gilt der neueste. Der ältere zeigt dann «abgelaufen oder schon benutzt». Das ist mit der Meldung aus v2 abgedeckt.

**Selin (11):** Ich habe beim Anmelden «E-Mail oder Passwort stimmt nicht» bekommen. Ich wusste nicht, ob die Adresse falsch ist oder das Passwort. Der «Passwort vergessen?»-Link war dann ganz oben am Feld, ich hab ihn nicht gesehen, weil ich unten auf die Fehlermeldung geschaut habe.

**Bettina (26):** Dann gehört der Link direkt in die Fehlermeldung. «Stimmt nicht. Passwort vergessen?» als Knopf in der Meldung.

**Moritz (22):** Die Meldung darf aber nicht sagen, welches von beiden falsch ist. Sonst verrät sie, dass die Adresse ein Konto hat.

**Yuki (23):** Apropos verraten: In v2 steht beim Registrieren nichts dazu, was passiert, wenn die Adresse schon ein Konto hat. Supabase schickt dann bei eingeschalteter Bestätigung gar keine Mail. Die Person wartet ewig.

**Moritz (22):** Die App kann das erkennen: Supabase gibt einen Nutzer ohne «identities» zurück. Wenn die App dann «Diese Adresse hat schon ein Konto» sagt, verrät sie es. Das ist der klassische Zielkonflikt.

**Bettina (26):** Ich finde, beim Registrieren ist das in Ordnung. Jede zweite Seite macht das. Und sonst wartet Selin ewig auf eine Mail.

**Yuki (23):** Mir wäre es lieber, die App sagt «Falls du schon ein Konto hast, melde dich an oder nutze ‹Passwort vergessen?›» und lässt offen, ob es eins gibt.

**Moritz (22):** Dann wartet die Person trotzdem. Ehrlich gesagt: Supabase selbst sagt bei ausgeschalteter Bestätigung «User already registered». Der Verrat ist im System schon drin. Ich würde es klar sagen, aber nur beim Registrieren, nie bei «Passwort vergessen».

**Moderation:** Das ist eine Grundsatzfrage zum Datenschutz. Die geht mit Empfehlung an Hans.

**Olena (9):** «Fast geschafft» verstehe ich. «Bestätige» ist ein schweres Wort. Schreibt «Öffne die Mail und tippe auf den Knopf». Das steht schon da, gut.

**Liam (7):** On the English side: "Forgot password?" and "Set a new password" are what I expect. Don't translate "Fast geschafft" literally as "Almost managed". Use "Almost there".

**Sofía (8):** Und die Mail auf Englisch unter dem Deutsch, das hilft mir.

**Thomas (14):** An der Theke liegt ein Tablet für Gäste. Wenn jemand dort seinen Link öffnet, ist er auf dem Hallen-Tablet angemeldet.

**Sven (15):** Das passiert nicht. Den Link bekommt man ins eigene Postfach, und das öffnet keiner auf dem Hallen-Tablet.

**Thomas (14):** Doch, wenn das eigene Handy leer ist. Aber gut, selten.

**Mara (13):** Dann reicht es, wenn auf der Seite «Neues Passwort» oben steht, für welches Konto. «Für: name@…». Dann merkt man auch, wenn es das falsche Konto ist.

**Karl (17):** Auf der Neues-Passwort-Seite will ich das Feld groß und den Knopf groß. Und Kontrast. Mit der Lupe sehe ich sonst nur einen Ausschnitt; dann sollte alles untereinander stehen, nicht nebeneinander.

**Jule (18):** Mit VoiceOver: Die Meldungen müssen vorgelesen werden, wenn sie erscheinen. Wenn «Link gesendet» nur grün aufploppt, höre ich nichts. Und das Auge braucht eine Beschriftung: «Passwort anzeigen».

**Lukas (19):** Das Auge muss auch zeigen, ob es an oder aus ist. Nicht nur durch Farbe.

**Dieter (4):** Mein Display hat einen Sprung unten rechts. Wenn der Knopf da sitzt, treffe ich ihn nicht. Volle Breite, bitte.

**Max (12):** Und die Enter-Taste auf der Tastatur soll gleich senden. Ich will nicht den Knopf suchen.

**Hakan (21):** Wenn ich im Login «Passwort vergessen?» tippe, steht die Adresse, die ich gerade eingegeben habe, hoffentlich schon drin?

**Moderation:** In v2 nicht festgelegt.

**Hakan (21):** Dann bitte übernehmen. Zweimal tippen in der Halle mit Kreide nervt.

**Kemal (6):** Und der Zurück-Knopf am Handy: Wenn ich bei «Passwort vergessen» bin und zurück drücke, will ich zum Anmelden, nicht raus aus allem.

**Anja (20):** Nach dem Nachtdienst: Ich setze ein neues Passwort, dann bin ich auf der Wand. Steht da irgendwo, dass es geklappt hat?

**Moderation:** v2 sagt «angemeldet und auf der Wand».

**Anja (20):** Ein kurzer Satz «Passwort geändert» wäre gut. Sonst frage ich mich, ob es gespeichert ist.

**Lena (28):** Und bitte das alte Passwort ablehnen. Mein Passwort-Manager schlägt manchmal das alte vor. Wenn Supabase sagt «same password», muss die App auf Deutsch sagen, dass ich ein anderes nehmen soll.

**Petra (24):** Der Ton ist mir wichtig. Nicht «Ungültige Anmeldedaten». Das klingt nach Behörde. «E-Mail oder Passwort stimmt nicht» ist freundlicher.

**Irmgard (1):** Und was ist mit Leuten, die sich angemeldet haben, die Bestätigung aber nie gemacht haben? Die tippen später ihr Passwort ein, und dann?

**Moritz (22):** Supabase sagt «Email not confirmed». Heute macht die App daraus «Ungültige Anmeldedaten». Falsch, weil das Passwort ja stimmt.

**Irmgard (1):** Dann: «Bitte bestätige zuerst deine E-Mail» und daneben «Mail nochmal senden».

**Hannes (29):** In der Halle habe ich kaum Empfang. Wenn «Link senden» hängt, will ich nicht ewig den Kreisel sehen. Lieber «Keine Verbindung, nochmal versuchen».

**Rafael (27):** Insgesamt: Es wird viel Text. Die Hilfe «E-Mail-Adresse vergessen?» bitte zugeklappt, nur wer sie braucht, klappt sie auf.

**Nina (25):** Und für die Jugendlichen: Wenn Mamas Adresse drinsteckt, bekommt Mama die Mail. Ist okay, das ist sogar gut.

**Pedro (16):** Für mich als Gast-Schrauber: Ich melde mich mit Google an, überall. Mich betrifft nur, dass der Google-Hinweis dasteht. Passt.

**Brigitte (3):** Zum Schluss: Wenn ich auf «Passwort vergessen?» tippe und es mir dann doch einfällt, will ich zurück zum Anmelden, ohne alles zu verlieren.
