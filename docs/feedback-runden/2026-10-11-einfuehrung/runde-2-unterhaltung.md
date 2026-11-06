# Runde 2 – Unterhaltung: SPEC-047 «Einführung beim ersten Mal» (Stand v2)

> **Simuliert**, kein echtes Nutzerfeedback. Gleiche 30 Personen wie in [Runde 1](runde-1-unterhaltung.md).
> **Gegenstand:** SPEC-047 v2: wie v1, dazu große Knöpfe Zurück/Weiter/Überspringen und «1 von 3» als Text, Knopfleiste bleibt bei 200 % sichtbar; «gesehen» lokal und am Konto (`user_metadata`), Altnutzer gelten als gesehen; Karte «Deine Daten» ehrlich (ohne Konto nur auf diesem Handy, Spitzname sichtbar und abschaltbar); QR-Zeile erst unter dem Boulder, einmal schließen = weg; einfache Sprache; Bildausschnitt mit Farbnamen und echter Farbskala der Halle; Start erst in der App, nie über der Landing-Page; Meldung nach «Überspringen»; Schrauber-Karte nennt Rechte; Admin-Karte 2 mit den vier Schritten Sektoren · Farben · Team · QR-Codes als Haken; alles auch Englisch.
> **Leitfrage:** Passt die Einführung für Menschen mit mehreren Rollen, in verschiedenen Hallen und mit Hilfsmitteln, ohne zu viel zu werden?

## Gespräch

**Ralf (17):** Die Lösung mit den Altnutzern gefällt mir. Aber jetzt ein anderer Fall: Ich bin Chefschrauber **und** Admin **und** klettere. Bekomme ich als neuer Nutzer drei Einführungen hintereinander?

**Gisela (18):** Bei mir genauso. Ich lege die Halle an, dann kommt Kletterer-Einführung, dann Admin. Das ist zu viel auf einmal.

**Tim (27):** Regel: Rollen-Karten kommen nur, wenn man den Bereich zum ersten Mal **öffnet**, nicht beim Login. Und nie zwei Einführungen in derselben Sitzung. Wer als Admin startet, sieht die Admin-Karten; die Kletterer-Karten kommen beim nächsten Mal, wenn man an eine Wand geht.

**Oliver (28):** Oder gar nicht, wenn man sie nicht braucht. Gisela klettert ja nicht mehr.

**Gisela (18):** Richtig. Wenn ich nie eine Wand als Kletterin öffne, will ich die Karten auch nicht.

**Karl (2):** Ich nutze VoiceOver manchmal, wenn die Augen müde sind. Ist das ein richtiger Dialog? Springt der Fokus auf die Überschrift? Und kann ich mit «Zurück» der Geste raus?

**Clara (25):** Und mit der Tastatur, Esc. Ich nutze am Tablet oft eine Tastatur.

**Tim (27):** Das sollte stehen: `role="dialog"`, `aria-modal`, Fokus auf die Überschrift, Esc und Zurück-Geste wirken wie «Überspringen».

**Hannelore (30):** Und dunkel? Mein Handy ist abends dunkel. Die Bilder darin dürfen nicht grell weiß sein.

**Marie (13):** Dann zwei Fassungen der Ausschnitte, hell und dunkel, oder als gezeichnete Grafik, die die Theme-Farben nimmt. Gezeichnet ist auch schärfer bei 200 %.

**Sven (19):** Was ich vermisse: Jede Halle ist anders. Bei uns wird jeden Montag umgeschraubt und die Farben sind keine Grade, sondern Bereiche. Ich hätte gern **einen Satz von der Halle** in der Einführung. «Bei uns: Farben zeigen den Bereich. Neue Boulder jeden Montag.»

**Thomas (20):** Ein Satz, ja. Kein Roman. Sonst schreiben Betreiber da die Hausordnung rein.

**Gisela (18):** Höchstens 140 Zeichen, im Admin-Tab Halle eintragbar. Wenn leer, entfällt die Zeile.

**Pedro (9):** And in English? If the gym writes German only, I don't understand the sentence.

**Chloe (8):** Then show the German sentence with a small «(German)» label? Better than nothing. Or a second field for English.

**Tim (27):** Ein zweites optionales Feld «auf Englisch». Wenn leer, zeigt die englische Einführung den deutschen Satz nicht – lieber nichts als eine Sprache, die man nicht versteht.

**Ahmed (10):** Das finde ich auch. Halb Deutsch, halb Englisch verwirrt.

**Lena (22):** Ich klettere in zwei Hallen. Sehe ich die Einführung in der zweiten Halle wieder?

**Tim (27):** Die allgemeinen Karten nicht. Aber der Hallen-Satz wäre neu. Den könnte man beim ersten Besuch einer neuen Halle als die QR-Zeile zeigen: «Neu in dieser Halle: Farben zeigen den Bereich.»

**Lena (22):** Das ist gut, wenn es nur eine Zeile ist.

**Nina (21):** Was mir fehlt: Treff, Projekte, Statistik. Die kennt keiner. Kommt das in die Karten?

**Felix (12):** Bloß nicht. Drei Karten. Sonst sind es acht.

**Petra (3):** Dann lieber wie beim Boulder-Sheet: ein einzelner Satz, wenn man das zum ersten Mal öffnet. Das stört nicht.

**Mehmet (23):** Aber nicht überall. Sonst poppt bei jedem Knopf was auf.

**Oliver (28):** Feste Liste. Höchstens drei, vier Stellen: erster Boulder-Sheet, erstes Loggen, erstes Öffnen vom Treff. Mehr nicht.

**Yuki (29):** Und alle Hinweise am Ort sollen sich gegenseitig ausschließen. Nie zwei auf einmal.

**Sophie (11):** Was passiert eigentlich, wenn ich ohne Konto starte und mich später anmelde? Sehe ich dann alles nochmal?

**Tim (27):** Beim Anmelden wird der lokale Stand ins Konto übernommen, nicht umgekehrt. Wer lokal gesehen hat, hat am Konto gesehen.

**Ines (6):** Und wenn ich mich auf dem Handy meines Mannes anmelde, dann ist das Konto schon «gesehen», das Handy aber neu. Dann sieht er nichts, wenn er sich abmeldet und selbst loslegt. Ist halt so. Er findet es ja in den Einstellungen.

**Markus (7):** Die neuen Texte sind besser. «Geschafft» statt «Top» auf dem großen Knopf? Nein, das steht im Sheet ja als Top. Hauptsache, die Karte erklärt es mit denselben Wörtern.

**Ulrike (26):** Die Daten-Karte gefällt mir jetzt. Bitte noch ein Link «Mehr zum Datenschutz», klein, aber da.

**Bernd (4):** Mir ist nur wichtig: Wenn ich einmal durch bin, kommt nichts mehr. Das ist jetzt so. Gut.

**Aylin (16):** Die Schrauber-Karte mit den Rechten ist gut. «Die Hallenleitung sieht, wer was gesetzt hat» – das ist ehrlich.

**Mara (15):** Kann man die Schrauber-Karten auch über «Einführung ansehen» wieder holen? Für neue Kollegen, wenn ich es ihnen zeigen will.

**Ralf (17):** Am besten unter Einstellungen eine Auswahl: «Kletterer · Schrauber · Admin», je nach dem, was man darf.

**Hakan (5):** Die QR-Zeile unten unter dem Boulder ist jetzt richtig. Passt.

**Jonas (14):** Für mich passt v2. Nur: Überspringen-Knopf bitte nicht grau und klein. Gleichwertig neben Weiter.

**Karl (2):** Gleichwertig, aber unterscheidbar. Weiter gefüllt, Überspringen umrandet. Beide ≥ 48 px hoch.
