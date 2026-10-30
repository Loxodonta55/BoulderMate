# Runde 2 – Auswertung und Vorschläge (SPEC-046 v2 → v3)

> Simuliert. Grundlage: [runde-2-unterhaltung.md](runde-2-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | «Jemand» verbirgt das Ausblenden in kleinen Hallen nicht; das Versprechen «sie erfährt nichts» ist falsch | 5 (Corinna, Kerstin, Jasmin, Felix, Patrick) | Hallenbetrieb, Polizei, Gastro, IT, Wettkampf | **hoch** (falsches Sicherheitsgefühl) |
| T2 | Vorläufig verstecken ist mit Wegwerf-Konten oder Cliquen missbrauchbar | 4 (Theresa, Malte, Selin, Benedikt) | Jugendarbeit, IT-Sicherheit, Influencer, Kirche | **hoch** (Mobbing-Werkzeug) |
| T3 | Nach «Das ist ein Fehler» fehlt die Rückmeldung an die Betroffene | 3 (Ines, Günther, Benedikt) | Personal, Recht, Kirche | mittel |
| T4 | Keine veröffentlichten Regeln: was ist «anstößig»? Apple verlangt Zustimmung zu Regeln | 4 (Emre, Klaus, Holger, Vanessa) | Sport, Schule, Versicherung, Recht | **hoch** (Store-Pflicht) |
| T5 | Hans allein; Vertretung nötig | 2 (Corinna, Felix) | Hallenbetrieb, IT | mittel |
| T6 | Admin-Ansicht: groß, Sperren mit Nachfrage, Bilder verschwommen bis Tipp | 4 (Werner, Ralf, Aylin, Lena) | Ältere, Einschränkung, Pflege, Design | mittel |
| T7 | Wortliste im Code hinkt im Store hinterher → Tabelle in der Datenbank | 3 (Felix, Malte, Diego) | IT, Touristen | mittel |
| T8 | VoiceOver: Knöpfe mit Namen, Fokus ins Sheet | 1 (Natascha) | Blinde | mittel (Barriere) |
| T9 | Angst vor versehentlichem Melden; «Abbrechen» groß | 2 (Brigitte, Lena) | Ältere, Design | niedrig |
| T10 | EN: «Block» statt «Hide» | 2 (Rebecca, Lena) | Englisch, Design | niedrig |
| T11 | Notruf 112 für Touristen; Hinweis «auch an die Halle wenden» | 3 (Tim, Kerstin, Moritz) | Rettungsdienst, Polizei, Hallenpersonal | mittel |
| T12 | Meldungen über Trainer zuerst bearbeiten; Satz für Eltern | 3 (Paula, Klaus, Anton) | Eltern, Schule, Jugend | mittel |

**Zitate**
- T1: «Gestern stand da ‹Corinna, Platz 3›, heute ‹Jemand, Platz 3›. Wer schaut, weiß es.» (Corinna) – «Das Schlimmste ist, wenn das Opfer glaubt, es sei unsichtbar, und es ist es nicht.» (Kerstin)
- T2: «Drei Konten mit drei Wegwerf-Adressen … kostet mich fünf Minuten.» (Malte)
- T4: «Was ist ‹anstößig›? Ich hab ein Foto mit nacktem Oberkörper am Fels.» (Emre)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | **Ehrlicher Text** beim Ausblenden: «Sie sieht deinen Namen und deine Treff-Einträge nicht mehr. In Ranglisten steht an deiner Stelle ‹Jemand›; wer genau hinschaut, kann das merken.» Darstellung «Jemand» bleibt (beste verfügbare). | hoch | klein | **1** | Schutz |
| V2 | Vorläufig verstecken zählt nur Meldungen von Konten, die **älter als 7 Tage** sind und **mindestens einen Boulder geloggt** haben; Schwelle bleibt 3 verschiedene Konten. | hoch | klein | **1** | neutral |
| V3 | **Rückmeldung** an die Betroffene nach Entscheidung: «Wir haben dein Bild geprüft und wieder freigegeben.» bzw. «… entfernt, weil es gegen die Regeln verstößt.» (Hinweis in «Ich», einmal). Widersprüche stehen in der Admin-Liste oben. | mittel | klein | 2 | neutral |
| V4 | **Regeln** («Fair bleiben», 4 Sätze: keine Nacktheit, keine Gewalt, kein Hass, keine Werbung; Sportfotos sind in Ordnung) als Seite `regeln.html` und im Profil-Speichern-Dialog: «Mit dem Speichern stimmst du den Regeln zu.» Gilt auch beim ersten Treff-Eintrag. | hoch | klein | **1** | Pflicht |
| V5 | **Vertretung**: Hans kann einer zweiten Person das Plattform-Admin-Häkchen geben (gibt es schon, nur dokumentieren). | mittel | – | 2 | neutral |
| V6 | Admin-Ansicht: Bilder **verschwommen** bis «Anzeigen»; Knöpfe 48 px, Text 17 px; «Sperren» abgesetzt und **mit Nachfrage**. | mittel | klein | 2 | neutral |
| V7 | **Wortliste als Tabelle** `blocked_words` in Supabase (nur Plattform-Admin schreibt); Trigger prüft dagegen; App hat eine mitgelieferte Kopie für die schnelle Antwort und fragt sonst die Datenbank. | mittel | klein | 2 | neutral |
| V8 | Zugängliche Namen: «{Name} ausblenden», «{Name} melden»; Fokus beim Öffnen auf die Überschrift des Sheets. | mittel | klein | 2 | Barriere |
| V9 | Melde-Sheet: «Abbrechen» gleich groß wie «Meldung senden»; Satz «Erst mit ‹Meldung senden› wird etwas verschickt.» | niedrig | klein | 3 | neutral |
| V10 | EN: «Block» / «Report»; DE bleibt «Ausblenden» / «Melden». | niedrig | klein | 3 | neutral |
| V11 | Fußzeile: «Bei Gefahr: 112 · Polizei 110 (DE) / 117 (CH). Du kannst dich auch an deine Halle wenden.» | mittel | klein | 2 | Schutz |
| V12 | Meldungen gegen Personen mit **Trainer-Rolle** stehen in der Admin-Liste ganz oben (nach vorläufig versteckten); Hilfe-Satz: «Bei ernsten Sachen wende dich auch an deine Halle oder deinen Verein.» | mittel | klein | 2 | Schutz |

## Was nicht umgesetzt werden sollte

- **Zeile in Ranglisten ganz entfernen** (Alternative zu T1): Plätze verschieben sich, fällt genauso auf und verfälscht die Rangliste.
- **Hallen-Personal in der App informieren** (Moritz): bleibt persönlich in der Halle; nur der Hinweis-Satz.
- **Weitere Sprachen in der Wortliste jetzt** (Diego): mit der Tabelle später nachlegbar, kein Bau nötig.
- **Melden zurücknehmen** (Brigitte): Wer abbricht, hat nichts gemeldet; eine gesendete Meldung schadet niemandem, weil erst der Admin entscheidet.
