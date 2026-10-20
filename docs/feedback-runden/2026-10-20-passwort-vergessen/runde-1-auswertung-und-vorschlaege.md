# Runde 1 – Auswertung und Vorschläge (SPEC-049 v1 → v2)

> Simuliert. Grundlage: [runde-1-unterhaltung.md](runde-1-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Link am anderen Gerät oder im Mail-App-Browser öffnen (heutiger PKCE-Link geht nur im selben Browser) | 3 (Jonas, Paula, Tim) | Studierende, MINT | **hoch** |
| T2 | Abgelaufener Link zeigt «Google-Anmeldung abgebrochen» | 2 (Werner, Tim) | Ältere, MINT | **hoch** |
| T3 | Welche Adresse? Mehrere Adressen, Konto vom Enkel oder mit Mamas Adresse, mit Google angemeldet | 5 (Leon, Renate, Nina, Aylin, Markus) | Azubis, Ältere, Trainer, Personal, Eltern | **hoch** |
| T4 | Nach Zurücksetzen bleiben andere Geräte angemeldet (verlorenes Handy) | 3 (Ulrike, Klaus, Tim) | Ärzte, Ältere, MINT | mittel (Sicherheit) |
| T5 | Mail sieht nach Betrug aus: englischer Betreff, Absender «Supabase Auth», landet im Spam | 4 (Gerda, Ahmed, Emily, Paula) | Ältere, Zweitsprache, Englisch, Studierende | mittel |
| T6 | Registrieren: Schein-Anmeldung, unklare Anweisung, Tippfehler in der Adresse, nach dem Bestätigen nicht direkt drin | 4 (Mia, Tim, Markus, Fatma) | Anfänger, MINT, Eltern, Handwerk | mittel |
| T7 | Link zu klein, «Magic Link» unverständlich, Fehler nur in Rot | 5 (Hannelore, Mehmet, Werner, Bernd, Lukas) | Ältere, Handwerk, Einschränkungen | mittel |
| T8 | Passwort-Eingabe: Auge vs. zweites Feld, Passwort-Manager, Länge | 5 (Sabine, Klaus, Clara, Tim, Hannelore) | Schicht, Ältere, Einschränkungen, MINT | niedrig |
| T9 | Wer hilft, wenn nichts klappt? Nicht die Theke | 3 (Thomas, Gisela, Renate) | Hallenpersonal, Ältere | niedrig |

**Zitate**
- T1: «Ich fordere am PC an, öffne die Mail aber am Handy. Geht das?» (Jonas)
- T2: «Dann: ‹Der Link ist abgelaufen. Hier neuen anfordern.› Mit Knopf.» (Werner)
- T3: «Mit Google angemeldet? Dann einfach oben ‹Mit Google fortfahren› tippen. Das hätte mir zehn Minuten gespart.» (Aylin)
- T5: «Wenn da auf Englisch ‹Reset your password› steht, lösche ich sie, das sieht aus wie Betrug.» (Gerda)
- T6: «Sag mir genau, was ich tun muss. Nicht ‹Bestätige deine E-Mail›, sondern ‹Öffne die Mail von BoulderMate und tippe auf den Knopf›.» (Mia)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Mail-Vorlagen «Reset Password» und «Confirm signup» auf **`token_hash`** umstellen; App löst den Link mit `verifyOtp` ein. Der alte `?code=`-Link bleibt als Rückfall (gleicher Browser) | hoch | klein (App) + Dashboard (Hans) | **1** | stärkt (Zugang) |
| V2 | **Abgelaufener / benutzter Link**: eigene Meldung «Der Link ist abgelaufen oder wurde schon benutzt.» und das Login-Fenster öffnet sich direkt bei «Passwort vergessen» | hoch | klein | **1** | stärkt |
| V3 | Bestätigungsansicht nach «Link senden»: Adresse groß, «Schau auch im Spam-Ordner», «Nichts angekommen? Prüfe die Adresse oder probier eine andere», «Mit Google/Apple angemeldet? Dann nimm den Knopf oben» | hoch | klein | **1** | stärkt |
| V4 | Hilfetext **«E-Mail-Adresse vergessen?»** in der Ansicht: Anmeldung läuft über die E-Mail, nicht den Spitznamen; Postfächer nach «BoulderMate» durchsuchen; Google/Apple-Hinweis; Kontakt über die Datenschutzerklärung; Hallenpersonal kann nicht helfen | hoch | klein | **1** | stärkt |
| V5 | Nach neuem Passwort **alle anderen Geräte abmelden**; Satz dazu steht vor dem Speichern | mittel | klein | 2 | stärkt (Sicherheit) |
| V6 | Mail-Vorlagen **zweisprachig** (Deutsch, darunter Englisch), Absendername «BoulderMate», eigener SMTP-Versand (Dashboard, Hans) | mittel | Dashboard | 2 | stärkt |
| V7 | Registrieren: «Fast geschafft»-Ansicht mit Adresse groß, Satz «Öffne die Mail von BoulderMate und tippe auf ‹E-Mail bestätigen›», «Adresse falsch? Zurück», «Nochmal senden»; Bestätigungslink meldet **direkt an** | mittel | klein | 2 | stärkt |
| V8 | «Passwort vergessen?» als **Tippfläche ≥ 48 px**, 16 px Schrift; Wort «Magic Link» verschwindet; Fehler mit Symbol, nicht nur Farbe | mittel | klein | 2 | stärkt |
| V9 | Neues-Passwort-Feld mit Auge und `autocomplete="new-password"`, Anmeldefeld `current-password`, E-Mail-Felder `email` | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v2)

- **Übernommen:** V1–V5, V7–V9.
- **Angepasst:** V6 – Zweisprachige Vorlagen und eigener SMTP-Versand sind Dashboard-Arbeit für Hans; die Spec liefert den fertigen Vorlagentext. Ohne eigenen SMTP verschickt Supabase nur sehr wenige Mails pro Stunde, das steht in der Spec als Voraussetzung für echte Nutzer.
- **Verworfen:**
  - **Zweites Passwortfeld** (Klaus): doppelte Arbeit für motorisch Eingeschränkte (Clara); das Auge zeigt das Getippte.
  - **Mindestens 8 Zeichen** (Tim): muss mit der Supabase-Einstellung übereinstimmen und widerspricht Hannelores «nicht noch komplizierter»; bleibt 6 wie beim Registrieren.
  - **Ohne E-Mail-Bestätigung registrieren** (Mia): ist eine Supabase-Einstellung; die App muss beide Fälle können. Empfehlung an Hans bleibt «Bestätigung an».
  - **Adresse per Spitzname nachschlagen** (Leon, Renate): würde fremde Adressen verraten (Yuki).
  - **Sicherheitsfragen** (Oliver lehnt selbst ab).

## Nicht umsetzen

- Keine Hilfe-Funktion für das Hallenpersonal (Gisela, Thomas): Konten bleiben Sache der Person.
- Nichts im Schrauber-Studio (Ralf).
