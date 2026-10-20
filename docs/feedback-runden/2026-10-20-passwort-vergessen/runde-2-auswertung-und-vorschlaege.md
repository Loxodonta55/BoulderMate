# Runde 2 – Auswertung und Vorschläge (SPEC-049 v2 → v3)

> Simuliert. Grundlage: [runde-2-unterhaltung.md](runde-2-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Registrieren mit schon vorhandener Adresse: keine Mail, Person wartet ewig; Zielkonflikt mit «Konto nicht verraten» | 4 (Yuki, Moritz, Bettina, Selin) | MINT, Kaufleute, Studierende | **hoch** (Grundsatz Datenschutz) |
| T2 | Anmelden ohne bestätigte E-Mail meldet «Ungültige Anmeldedaten» | 2 (Irmgard, Moritz) | Ältere, IT | **hoch** (Person kommt nicht weiter) |
| T3 | Mehrfach tippen → Supabase-Sperre mit Fachbegriff «rate limit»; keine Wartezeit sichtbar | 3 (Finn, Greta, Irmgard) | Schüler, Ältere | mittel |
| T4 | Nach falschem Passwort ist «Passwort vergessen?» nicht im Blick | 2 (Selin, Bettina) | Studierende, Kaufleute | mittel |
| T5 | Bedienung: Adresse übernehmen, Enter sendet, Zurück-Knopf führt zum Anmelden, volle Breite, untereinander | 6 (Hakan, Max, Kemal, Dieter, Karl, Brigitte) | Schicht, Azubis, Eltern, Handwerk, Ältere | mittel |
| T6 | Barrierefreiheit: Meldungen werden nicht vorgelesen, Auge ohne Beschriftung und ohne sichtbaren Zustand | 2 (Jule, Lukas) | Einschränkungen | mittel |
| T7 | Rückmeldung: «Passwort geändert», altes Passwort abgelehnt, «Für: name@…» auf der Neues-Passwort-Seite | 3 (Anja, Lena, Mara) | Pflege, Personal | niedrig |
| T8 | Netzwerkfehler in der Halle | 1 (Hannes) | Landwirtschaft | niedrig |
| T9 | Zu viel Text: Hilfe zuklappen; Englisch «Almost there» | 3 (Rafael, Liam, Sofía) | Kreative, Englisch | niedrig |

**Zitate**
- T1: «Ich würde es klar sagen, aber nur beim Registrieren, nie bei ‹Passwort vergessen›.» (Moritz)
- T2: «Dann: ‹Bitte bestätige zuerst deine E-Mail› und daneben ‹Mail nochmal senden›.» (Irmgard)
- T3: «Schreib nicht ‹rate limit›. Schreib ‹Bitte warte ein paar Minuten›.» (Irmgard)
- T4: «Dann gehört der Link direkt in die Fehlermeldung.» (Bettina)
- T6: «Wenn ‹Link gesendet› nur grün aufploppt, höre ich nichts.» (Jule)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Registrieren mit vorhandener Adresse: **klar sagen** «Mit dieser Adresse gibt es schon ein Konto» + Knöpfe «Anmelden» und «Passwort vergessen?». Bei «Passwort vergessen» weiterhin **nie** verraten | hoch | klein | **1** | stärkt (Grundsatzfrage → Hans, Empfehlung ja) |
| V2 | Anmelden unbestätigt: «Bitte bestätige zuerst deine E-Mail-Adresse» + Knopf **«Bestätigungsmail nochmal senden»** | hoch | klein | **1** | stärkt |
| V3 | Sperre: «Link senden» und «Nochmal senden» danach **60 s gesperrt** mit Zähler; Supabase-Sperre als «Zu viele Versuche. Bitte warte ein paar Minuten.» | mittel | klein | 2 | stärkt |
| V4 | Fehlermeldung «E-Mail oder Passwort stimmt nicht.» mit **Knopf «Passwort vergessen?» in der Meldung**; sagt nie, welches von beiden falsch ist | mittel | klein | 2 | stärkt |
| V5 | Adresse aus dem Anmeldefeld übernehmen; Formulare senden mit Enter; Zurück (Knopf und Android-Zurück) führt von «Passwort vergessen» zum Anmelden; alle Knöpfe volle Breite, alles untereinander | mittel | klein | 2 | stärkt |
| V6 | Meldungen mit `role="status"` / `role="alert"`; Auge mit `aria-label` «Passwort anzeigen» / «Passwort verbergen» und `aria-pressed`, Symbol wechselt (Auge / Auge durchgestrichen) | mittel | klein | 2 | stärkt |
| V7 | «Neues Passwort»: Zeile «Für: name@…», Fehler bei gleichem Passwort auf Deutsch, danach Hinweis **«Passwort geändert.»** | niedrig | klein | 3 | neutral |
| V8 | Netzwerkfehler: «Keine Verbindung. Bitte nochmal versuchen.» | niedrig | klein | 3 | neutral |
| V9 | Hilfe «E-Mail-Adresse vergessen?» **zugeklappt**; Englisch «Almost there», «Forgot password?», «Set a new password» | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v3)

- **Übernommen:** V2–V9.
- **V1 (Grundsatzfrage Datenschutz):** an Hans mit Empfehlung **«klar sagen, nur beim Registrieren»**. Begründung: Supabase verrät es bei ausgeschalteter Bestätigung ohnehin («User already registered»), und ohne Hinweis wartet die Person auf eine Mail, die nie kommt. Nach Hans' Vorgabe «immer mit der Empfehlung» übernommen; Hans kann widersprechen.
- **Angepasst:** V3 – 60 s ist die Supabase-Voreinstellung für denselben Empfänger; die App sperrt den Knopf genauso lange.
- **Verworfen:**
  - **Warnung für geteilte Geräte / Hallen-Tablet** (Thomas): selten (Sven); die Zeile «Für: name@…» (V7) und das Abmelden-Menü reichen.

## Nicht umsetzen

- Keine zweite Bestätigungsstufe (z. B. Code per SMS): BoulderMate hat keine Telefonnummern und will keine.
