# Runde 3 – Unterhaltung: SPEC-046 «Person melden und ausblenden» (Stand v3)

> **Simuliert**, kein echtes Nutzerfeedback. Ablauf nach [feedback-einholen.md](../../prozesse/feedback-einholen.md).
> **Gegenstand:** SPEC-046 v3: ehrlicher Ausblenden-Text, vorläufig verstecken nur durch eingesessene Konten, Rückmeldung an Betroffene, Seite «Fair bleiben», Admin-Ansicht mit verschwommenen Bildern, Wortliste als Tabelle, Vertretung.
> **Leitfrage:** Ist das jetzt verständlich und fertig zum Bauen? Was stört im normalen Klettern, wenn man nie etwas melden will?

## Teilnehmende

| # | Name | Alter | Beruf / Population | Klettern | Gerät | Erwartung |
|---|------|-------|--------------------|----------|-------|-----------|
| 1 | Sabrina | 35 | Hallenleiterin Kletterzentrum München | 6a | iPhone | wenig Arbeit für die Theke |
| 2 | Jörg | 59 | Kfz-Meister | 5b | Android | soll nicht stören |
| 3 | Annika | 23 | Studentin Informatik, App-Review-Erfahrung (Praktikum) | 6b | iPhone | Apple-Prüfung |
| 4 | Edith | 70 | Rentnerin, ehemals Hauswirtschafterin | 4 | Android, Schrift groß | versteht sie es? |
| 5 | Kemal | 40 | Imbissbesitzer | 6a | Android | einfache Wörter |
| 6 | Lisa | 30 | Logopädin | 5c | iPhone | klare Sprache |
| 7 | Philipp | 43 | Rechtsanwalt IT-Recht | 6a | iPhone | Impressum, Kontakt |
| 8 | Greta | 20 | Azubi Zahnmedizinische Fachangestellte | 5a | Android | Profil soll schön bleiben |
| 9 | Matteo | 29 | Italiener, Koch, Englisch | 6b | Android | englische Texte |
| 10 | Ursula | 55 | Ergotherapeutin | 5a | iPad | motorisch eingeschränkte Gäste |
| 11 | Niklas | 27 | Routensetzer | 7a | Android | merkt er was davon? |
| 12 | Heike | 48 | Elternbeirat, Mutter zweier Kinder in der Jugendgruppe | 5b | iPhone | Kinder geschützt |
| 13 | Sven | 37 | Feuerwehrmann | 6c | Android | Notruf richtig |
| 14 | Laura | 26 | Social-Media-Managerin | 6a | iPhone | Profil = Visitenkarte |
| 15 | Bernd | 66 | pensionierter Postbote, rot-grün-schwach | 4+ | Android | Farben |
| 16 | Zeynep | 31 | Ärztin | 6a | iPhone | wenig Zeit |
| 17 | Raphael | 24 | Masterstudent Soziologie | 6b | Android | Machtfragen |
| 18 | Doris | 63 | Sekretärin, Teilzeit | 4 | iPhone SE | kleines Display |
| 19 | Jan | 34 | Product Owner | 6c | Pixel | Umfang, Reihenfolge |
| 20 | Miriam | 41 | Psychotherapeutin | 5c | iPhone | Betroffene nicht überfordern |
| 21 | Oskar | 19 | Abiturient, Trainer-Gruppe | 6c | Android | Gruppe |
| 22 | Ingrid | 68 | Rentnerin, schwerhörig | 4 | Android | nur Text, kein Ton |
| 23 | Daniel | 36 | Sozialpädagoge, Inklusion | 5a | Android | einfache Sprache |
| 24 | Petra | 50 | Schulsekretärin | 5a | iPhone | Eltern fragen sie |
| 25 | Hamid | 28 | Pfleger, Deutsch als Zweitsprache | 6a | Android | versteht «Regeln» |
| 26 | Clara | 33 | Datenbank-Admin | 6b | Linux + iPhone | Umstellung der alten Daten |
| 27 | Robert | 61 | Unternehmer, Hallen-Investor | 5a | iPhone | Ruf der Halle |
| 28 | Svenja | 22 | Studentin, Anfängerin | 4 | Android | Mut |
| 29 | Max | 45 | Bergführer | 7a | iPhone | draußen, kein Netz |
| 30 | Elke | 57 | Gleichstellungsbeauftragte | 5b | Android | Schutz von Frauen |

## Gespräch

**Moderation:** Dritter Stand. Was stört euch, wenn ihr nie etwas melden wollt?

**Jörg:** Die zwei Knöpfe oben im Profil. Ich schau mir jemanden an, weil der einen schweren Boulder geschafft hat, und das Erste, was ich sehe, ist «Melden». Wirkt, als ob hier dauernd gemeldet wird.

**Laura:** Genau. Wenn ich ein Profil öffne, will ich die Person sehen, nicht Knöpfe, die nach Ärger aussehen. Bitte ruhig gestalten: grau, umrandet, klein im Ton, aber groß genug zum Treffen.

**Elke:** Aber nicht verstecken. In Runde 1 hieß es, unten werden sie übersehen.

**Lisa:** Kompromiss: oben, aber rechts neben dem Namen als ruhige Zeile mit Symbol und Wort, nicht als zwei dicke Knöpfe. Gleiche Größe zum Tippen, aber grau.

**Bernd:** Hauptsache nicht nur rot. Grau mit Wort ist gut.

**Moderation:** Zur Kontakt-E-Mail.

**Philipp:** In der Spec steht «[Kontakt-E-Mail]». Welche? Auf der Datenschutzseite steht eine private web.de-Adresse. Apple verlangt veröffentlichte Kontaktdaten, das geht damit, aber auf Dauer wäre eine Adresse auf bouldermate.ch besser. Das muss Hans entscheiden.

**Robert:** Für den Ruf der Halle auch. Eine Hallenleitung schreibt lieber an «kontakt@bouldermate.ch» als an eine private Adresse.

**Annika:** Für die Prüfung reicht jede funktionierende Adresse. Wichtiger: Der Prüfer muss Melden und Ausblenden finden. Schreibt in die Hinweise für die Prüfer, wo es ist: «Wand → Boulder → Wer war schon oben → Person → Melden». Und am besten gibt es im Test-Konto eine zweite Person, die man melden kann.

**Jan:** Das ist ein guter Punkt: Test-Konten aus SPEC-027 haben sicher Begehungen, damit «Wer war schon oben» etwas zeigt?

**Annika:** Muss man sicherstellen. Sonst klickt der Prüfer ins Leere und lehnt ab.

**Moderation:** Zu den alten Daten.

**Clara:** Ihr nehmt die Treff-Ausblenden-Liste für die ganze App. Wer im Treff vor drei Wochen jemanden ausgeblendet hat, ist ab dem Update auch in Ranglisten «Jemand». Das ist eigentlich gewollt, aber man sollte es sagen. Ein Satz in der Liste: «Gilt jetzt in der ganzen App.»

**Miriam:** Und kein großes Pop-up dafür. Wer jemanden ausgeblendet hat, will nicht unvermittelt daran erinnert werden.

**Clara:** Einverstanden, nur in der Liste.

**Moderation:** Zu den Texten.

**Kemal:** «Fair bleiben» verstehe ich. Vier Sätze, gut.

**Hamid:** «Regeln» ist auch klar. Aber «Mit dem Speichern stimmst du den Regeln zu» ist ein langer Satz für einen kleinen Knopf. Geht «Es gelten unsere Regeln» mit Link?

**Philipp:** Rechtlich ist «stimmst zu» klarer. Lasst es, es ist ein Satz.

**Daniel:** Für einfache Sprache: Die Rückmeldung «… entfernt, weil es gegen die Regeln verstößt» sagt nicht, gegen welche. Nennt die Regel: «… weil Nacktheit nicht erlaubt ist.»

**Miriam:** Das hilft auch emotional. Eine konkrete Begründung ist leichter zu nehmen als ein Pauschalurteil.

**Matteo:** In English «Play fair» for the page name. Short.

**Moderation:** Zum Notruf.

**Sven:** 112 steht drin. Gut. Mehr braucht es nicht, keine Nummer extra pro Land außer DE und CH, ihr seid in München und Frauenfeld.

**Max:** Draußen am Fels ohne Netz: kann ich melden? Wahrscheinlich landet es in der Warteschlange?

**Clara:** Melden sollte wie Loggen in die Sende-Warteschlange gehen. Ausblenden sofort lokal, dann senden.

**Moderation:** Gruppe und Jugend.

**Oskar:** In der Gruppe ist «Melden» an jeder Person. Wenn ich auf den Trainer tippe, steht da «Melden». Das sieht der Trainer nicht, oder? Weil, wenn er neben mir steht und auf mein Handy schaut …

**Heike:** Das kann man nicht verhindern. Aber das Sheet kann einen neutralen Titel haben, «Melden» oben ist eh schon klein.

**Miriam:** Ich würde es dabei lassen. Ein Jugendlicher, der meldet, tut das nicht neben dem Trainer.

**Heike:** Für Eltern wünsche ich mir einen Satz auf der Seite «Fair bleiben»: «Eltern: Bei ernsten Vorfällen schreibt uns direkt.» Mit Adresse.

**Petra:** Den würde ich auch Eltern weitergeben.

**Moderation:** Zum Hallen-Alltag.

**Sabrina:** Für mich ist das jetzt ruhig. Ich muss nichts tun. Der Hilfe-Satz «Jemand stört dich?» ist das, was ich an der Theke brauche.

**Niklas:** Als Schrauber merke ich nichts davon. Passt.

**Robert:** Und wenn Hans einen Gast sperrt, der bei uns Stammgast ist, erfahren wir es nicht. Das war schon so entschieden, ich verstehe die Gründe. Ich hätte es gern anders, aber ok.

**Raphael:** Was ich gut finde: Die Macht liegt bei Hans und einer Vertretung, nicht bei den Hallen. Was ich nicht so gut finde: Es gibt keinen Weg gegen eine Sperre. Ein Satz «Wenn du denkst, das ist ein Fehler, schreib uns» reicht mir.

**Zeynep:** Steht schon drin, «Fragen: Kontakt-E-Mail».

**Raphael:** Dann soll es «Wenn du denkst, das ist ein Fehler» heißen, nicht «Fragen». Das ist ein Unterschied.

**Moderation:** Kleines Display und große Schrift.

**Doris:** iPhone SE: Das Melde-Sheet mit vier Gründen, Textfeld, Häkchen, Satz, Fußzeile, zwei Knöpfen. Passt das auf den Bildschirm? Die Knöpfe sollten immer sichtbar sein, nicht unter dem Textfeld verschwinden, wenn die Tastatur aufgeht.

**Ursula:** Und die Gründe als große Zeilen zum Antippen, nicht als kleine Kreise.

**Edith:** Ich hab's verstanden. Jemand ärgert mich, ich tippe «Ausblenden». Fertig.

**Ingrid:** Alles Text, kein Ton. Gut für mich.

**Svenja:** Mir gibt der Satz «nur das BoulderMate-Team sieht es» Mut. Bleibt so.

**Moderation:** Letzte Runde: Was fehlt noch?

**Annika:** Prüfer-Hinweis und eine meldbare Person im Test-Konto.

**Philipp:** Echte Kontakt-Adresse, Entscheidung bei Hans.

**Laura:** Knöpfe ruhig gestalten.

**Daniel:** Regel in der Rückmeldung nennen.

**Clara:** Satz «gilt jetzt in der ganzen App»; Melden offline in die Warteschlange.

**Doris:** Knöpfe im Sheet immer sichtbar.

**Raphael:** «Wenn du denkst, das ist ein Fehler» bei der Sperre.

**Jan:** Insgesamt: bauen.
