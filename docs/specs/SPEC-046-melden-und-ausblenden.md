# SPEC-046: Person melden und ausblenden

## Status: IMPLEMENTED

> **Owner:** Hans · **Created:** 2026-10-20 · **Version:** v4 (nach 3 Loops «FeatureDefinition») · **Umgesetzt:** 2026-10-22
> **Baut auf:** SPEC-028/036 (Treff mit Melden und Ausblenden), SPEC-015/022 («Wer war schon oben»), SPEC-038 (Hallen-Challenge), SPEC-042 (Trainer-Gruppe), SPEC-033 (Sichtbarkeit), SPEC-045 (App)
> **Ist Voraussetzung für:** Einreichen der App (SPEC-045 §6), später SPEC-048 (Hallen-Rangliste)
> **Prozess:** [Loop «FeatureDefinition»](../prozesse/feature-definition.md). Grill-me am 2026-10-20, Hans: «geh immer mit der Empfehlung». Feedback-Runden: [`docs/feedback-runden/2026-10-20-melden/`](../feedback-runden/2026-10-20-melden/) (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

Wer in BoulderMate eine andere Person sieht (Spitzname, Profilbild), kann sie **melden** und **ausblenden**. Der Plattform-Admin bekommt die Meldung und kann den Namen oder das Bild zurücksetzen oder die Person sperren. Spitznamen mit groben Wörtern werden schon beim Speichern abgelehnt.

Damit erfüllt BoulderMate die Store-Regeln für Nutzerinhalte (Apple App Review 1.2, Google Play «User Generated Content»): **Filter, Melden, Blockieren, Kontakt**.

## 2. Ausgangslage (Stand 2026-10-20, im Code geprüft)

| # | Befund | Wo |
|---|---|---|
| B1 | Andere Personen erscheinen mit **Spitzname und Profilbild** in «Wer war schon oben» (öffnet das Profilfenster), in der Challenge-Rangliste, in der Trainer-Gruppe und im Treff. | `BoulderSheet.tsx`, `PublicProfileModal.tsx`, `ChallengeCard.tsx`, `GroupsSettings.tsx`, `TreffView.tsx` |
| B2 | Profilbilder lädt jede Person selbst hoch (verkleinert auf 400 px). Niemand prüft sie. | `ProfileSettingsModal.tsx` |
| B3 | Der **Treff** hat Melden und Ausblenden schon: Tabellen `treff_blocks`, `treff_reports`, Admin-Liste «Meldungen prüfen», Sperre `treff_set_banned()`. Das gilt nur im Treff. | SPEC-028, `treffService.ts` |
| B4 | **Beta-Kommentare** werden nur auf dem eigenen Gerät gespeichert (`boulderapp_comments_v3`) und nie an andere geschickt. Sie sind heute kein Inhalt, den andere sehen. | `ratingAndAscentService.ts` |
| B5 | Für Spitznamen gibt es keine Wortprüfung. | `ProfileSettingsModal.tsx`, `handle_new_user()` |
| B6 | Kein privater Chat, keine öffentlichen Texte außer Treff-Satz (120 Zeichen, hat Melden). | – |

## 3. Grill-me: Fragen und Entscheidungen (alle nach Empfehlung)

| # | Frage | Optionen | Entscheidung |
|---|---|---|---|
| G1 | Zweck? | Store-Pflicht · Schutz der Leute · beides | **beides** (Store-Pflicht ist der Anlass, Schutz der Grund) |
| G2 | Was kann man melden? | nur Treff · **Person (Name + Bild) überall** · jeden Eintrag einzeln | **Person**: Name und Bild sind das, was andere sehen |
| G3 | Wo ist der Knopf? | **im Profilfenster** · an jeder Zeile · Menü «…» | **im Profilfenster**; Ranglisten- und Gruppenzeilen öffnen das Profilfenster |
| G4 | Eine Ausblenden-Liste für Treff und Rest? | getrennt · **gemeinsam** | **gemeinsam** (`treff_blocks` wird die App-weite Liste) |
| G5 | Wer bearbeitet Meldungen? | **Plattform-Admin** · Hallen-Admin · beide | **Plattform-Admin** (Hans); Hallen-Admins sehen keine Meldungen (Datenschutz) |
| G6 | Was kann der Admin tun? | Name zurücksetzen · Bild entfernen · sperren · erledigt | **alle vier** |
| G7 | Filter für Spitznamen? | keiner · **Wortliste DE/EN** · KI-Prüfung | **Wortliste** in App und Datenbank |
| G8 | Was ist es nicht? | – | kein Chat, keine Kommentare, keine Bewertung von Personen, keine öffentliche Liste gesperrter Personen |
| G9 | Hauptzweck bleibt vorn? | – | Zwei kleine Knöpfe im Profilfenster, ein Eintrag in den Einstellungen. Wand, Loggen, Bewerten bleiben unverändert. |

## 4. Verhalten

### 4.1 Wo die Knöpfe sind
- **Profilfenster** einer anderen Person: **oben, als ruhige Zeile direkt unter dem Namen** (grau umrandet, kein Rot, Trefferfläche 48 px, v4), zwei Knöpfe mit Symbol und Wort: **«Ausblenden»** (`profile-block`) und **«Melden»** (`profile-report`), EN **«Block»** / **«Report»**. Zugängliche Namen «{Name} ausblenden» / «{Name} melden». Im eigenen Profil nicht. (v2, v3)
- Zeilen in Challenge-Rangliste öffnen das Profilfenster (wie «Wer war schon oben»).
- **Trainer-Gruppe:** kein Ausblenden (man verlässt die Gruppe), aber «Melden» an jeder Person, auch am Trainer. (v2)
- **Treff:** bleibt wie in SPEC-028, nutzt dieselbe Liste und dasselbe Melde-Sheet.
- Gäste (nicht angemeldet) sehen statt der Knöpfe die Kontakt-E-Mail.

### 4.2 Melden
- Sheet «Melden» mit Grund, ein Tipp genügt; jeder Grund ist eine **große Zeile** zum Antippen (v4):
  **Name ist beleidigend · Bild ist anstößig · Belästigt mich · Etwas anderes** (EN: *Offensive name · Inappropriate picture · Harassing me · Something else*). (v2)
- Optional ein Satz (≤ 200 Zeichen).
- Bei «Belästigt mich» ist **«Person auch ausblenden»** vorausgewählt. (v2)
- Fester Satz im Sheet: **«Deine Meldung sieht nur das BoulderMate-Team. Nicht die Halle, nicht der Trainer, nicht die gemeldete Person.»** (v2)
- Fußzeile: «Bei Gefahr: 112 · Polizei 110 (DE) / 117 (CH). Du kannst dich auch an deine Halle wenden.» (v3)
- «Abbrechen» ist gleich groß wie «Meldung senden»; Satz «Erst mit ‹Meldung senden› wird etwas verschickt.» Beim Öffnen liegt der Fokus auf der Überschrift. (v3)
- «Meldung senden» und «Abbrechen» stehen **fest unten** und bleiben auch mit offener Tastatur sichtbar (iPhone SE). (v4)
- Ohne Netz geht die Meldung in die **Sende-Warteschlange** (SPEC-032). (v4)
- Gespeichert wird eine **Kopie** von Name und Bild-Adresse zum Zeitpunkt der Meldung.
- Danach: «Danke. Wir schauen uns das an.»
- Grenze: **5 Meldungen pro Person und Tag**; danach «Du hast heute schon viel gemeldet. Schreib uns bei Bedarf: …». (v2)

### 4.3 Ausblenden
- Einmal nachfragen, **ehrlich**: «Du siehst ihren Namen nicht mehr, sie deinen und deine Treff-Einträge auch nicht. In Ranglisten steht an deiner Stelle ‹Jemand›; wer genau hinschaut, kann das merken.» (v3)
- Wirkung **in beide Richtungen** in «Wer war schon oben», Challenge-Rangliste, Treff und Profilfenster.
- Ausgeblendete erscheinen **genau wie anonyme Personen** (SPEC-033): «Jemand», Platzhalter-Bild, nicht antippbar. **Kein eigenes Wort «Ausgeblendet»**. Der Platz in Ranglisten bleibt (Zeile entfernen würde genauso auffallen). (v2, v3)
- Ausblenden wirkt sofort lokal und wird nachgesendet, auch offline. (v4)
- Rückgängig: Einstellungen → **«Ausgeblendete Personen»** → «Wieder anzeigen». Oben in der Liste der Satz «Gilt in der ganzen App: Treff, Ranglisten, ‹Wer war schon oben›.» (bestehende Treff-Ausblendungen gelten ab dem Update überall; kein Pop-up, v4)

### 4.4 Vorläufig verstecken (v2)
- Melden **3 verschiedene Konten** (jeweils **älter als 7 Tage** und mit **mindestens einem geloggten Boulder**, v3) innerhalb von 14 Tagen das Bild (bzw. den Namen) derselben Person, wird es **sofort** durch den Platzhalter (bzw. «Jemand») ersetzt, bis der Admin entscheidet.
- Die betroffene Person sieht in «Ich» einen Hinweis: «Dein Profilbild ist vorläufig versteckt, weil es gemeldet wurde. Wir prüfen das.» und den Knopf **«Das ist ein Fehler»** (schreibt eine Notiz an die Meldung).
- Nach der Entscheidung bekommt die Person **einmal eine Rückmeldung** in «Ich»: «Wir haben dein Bild geprüft und wieder freigegeben.» bzw. «… entfernt, weil {Nacktheit / Gewalt / Hass / Werbung} nicht erlaubt ist.» (v3, v4)

### 4.5 Admin (Plattform-Admin)
- «Meldungen prüfen» zeigt Treff- und Profil-Meldungen in einer Liste. Reihenfolge: vorläufig versteckte und Widersprüche, dann Meldungen gegen Personen mit Trainer-Rolle (SPEC-042), dann neueste. (v3)
- Gemeldete Bilder sind **verschwommen**, bis man «Anzeigen» tippt. Knöpfe 48 px, Text 17 px; «Sperren» steht abgesetzt und fragt nach. (v3)
- **Vertretung:** Hans kann einer zweiten vertrauten Person das Plattform-Admin-Häkchen geben (gibt es schon, `is_platform_admin`). (v3)
- Pro Meldung: Kopie, Grund, Satz, Notiz der betroffenen Person, **wie oft die Person schon gemeldet wurde** und **wie oft die meldende Person schon gemeldet hat**. Die meldende Person wird nicht namentlich angezeigt, nur gezählt.
- Aktionen: **Name zurücksetzen** (auf «Kletterer» + 4 Ziffern), **Bild entfernen**, **Person sperren**, **Wiederherstellen** (hebt vorläufiges Verstecken auf), **Erledigt**.
- Punkt mit Zahl am Zahnrad, solange Meldungen offen sind.
- **Sperre:** Person erscheint öffentlich nur noch als «Jemand», kann Name und Bild nicht ändern und sich nicht im Treff eintragen. Ihre Tops zählen für sie weiter. Sie sieht in «Ich»: «Dein Profil ist nicht öffentlich sichtbar. Wenn du denkst, das ist ein Fehler, schreib uns: [Kontakt-E-Mail]». (v2, v4)

### 4.6 Filter für Spitznamen
- Prüfung beim Speichern, in der App **und** in der Datenbank (Trigger auf `user_profiles`).
- Die Liste ist eine **Tabelle `blocked_words`** in Supabase (nur Plattform-Admin schreibt), damit neue Wörter ohne neue App-Version wirken; die App hat eine mitgelieferte Kopie für die schnelle Antwort. (v3)
- **Ganze Wörter**, Ziffern-Tricks normalisiert (4→a, 3→e, 0→o, 1→i, 5→s); kurze Liste DE/EN mit groben Schimpfwörtern und strafbaren Codes; Codes wie «88» nur als **eigenständiges Wort**. (v2)
- Muss durchgehen: «Hakan», «Dick», «Dickfinger», «Klettermax1988». (v2)
- Ablehnung: «Bitte wähle einen anderen Namen. Ist das dein echter Name? Schreib uns: [Kontakt-E-Mail].»

### 4.7 Regeln (v3)
- Seite **«Fair bleiben»** (EN «Play fair», `public/regeln.html`), vier Sätze: keine Nacktheit, keine Gewalt, kein Hass, keine Werbung. Sportfotos (z. B. Oberkörper am Fels) sind in Ordnung. Wer dagegen verstößt, kann gesperrt werden. Dazu: «Eltern und Trainer: Bei ernsten Vorfällen schreibt uns direkt: [Kontakt-E-Mail].» (v4)
- Beim Speichern von Name/Bild und beim ersten Treff-Eintrag: «Mit dem Speichern stimmst du den Regeln zu.» (Link). Store-Pflicht (Apple 1.2).

### 4.8 Kontakt-Adresse (v4, Grundsatzfrage an Hans)
- Die Adresse steht in der App an **einer** Stelle (Konstante `CONTACT_EMAIL`) und wird überall eingesetzt, wo «[Kontakt-E-Mail]» steht.
- **Empfehlung:** bis es ein Postfach auf bouldermate.ch gibt, die Adresse der Datenschutzseite. Wechsel später ist ein Handgriff.

### 4.9 Prüfer (v4)
- `docs/app/store-eintrag.md` → Hinweise für die Prüfer: «Wand → Boulder → Wer war schon oben → Person → Melden / Ausblenden».
- In der Demo-Halle sieht `test-kletterer` mindestens eine andere Person in «Wer war schon oben» (`test-schrauber` mit Begehung), damit Prüfer etwas melden können.

### 4.10 Hilfe (v2, v3)
- Eintrag «Jemand stört dich?»: «Öffne das Profil, tippe ‹Ausblenden› oder ‹Melden›. Die Person erfährt nicht, wer gemeldet hat. Bei ernsten Sachen wende dich auch an deine Halle oder deinen Verein. Bei Gefahr: 112.»

## 5. Datenschutz (v2)

- Meldungen mit Kopie werden **6 Monate nach Erledigung gelöscht** (Aufräum-Funktion wie `treff_cleanup()`).
- Löscht die meldende Person ihr Konto, bleibt die Meldung, `reporter_id` wird leer.
- Abschnitt in der Datenschutzseite: was gespeichert wird, wer es sieht, wie lange.

## 6. Technik

- `treff_reports` bekommt `context` (`treff` | `profil`), `target` (`name` | `bild` | `person`), `note_from_reported`; `reason` um `name`, `bild` erweitert; `reporter_id` darf leer werden (`ON DELETE SET NULL`).
- `treff_blocks` bleibt die Tabelle für die ganze App.
- Neue Spalten in `user_profiles`: `banned`, `name_hidden`, `avatar_hidden` (nur über Funktionen änderbar); öffentliche Abfragen geben bei Sperre oder Verstecken «Jemand» bzw. kein Bild zurück.
- Neue Tabelle `blocked_words(word TEXT PRIMARY KEY)`; Trigger `nickname_allowed()` prüft dagegen. (v3)
- Funktionen: `report_profile()` (zählt nur Konten > 7 Tage mit ≥ 1 Begehung) (Grenze 5/Tag, Zählen, vorläufig verstecken), `moderate_profile()` (nur Plattform-Admin), `nickname_allowed()` (Trigger).
- Neue Dateien: `src/lib/moderationService.ts`, `src/lib/nicknameFilter.ts`, `src/components/moderation/ReportSheet.tsx`, `src/components/moderation/ProfileSafetyButtons.tsx`, `public/regeln.html`, Migration `20261020_spec046_melden.sql`.

## 7. Akzeptanzkriterien

- **AC-1** Im Profilfenster einer anderen Person stehen oben «Ausblenden» und «Melden»; im eigenen nicht; für Gäste die Kontakt-E-Mail.
- **AC-2** Melden speichert Grund, Satz und Kopie; das Sheet sagt, wer die Meldung sieht; danach Dank.
- **AC-3** «Belästigt mich» blendet die Person zusätzlich aus, wenn das Häkchen bleibt.
- **AC-4** Ausgeblendete erscheinen in beide Richtungen wie anonyme Personen; kein Text «Ausgeblendet» irgendwo sichtbar.
- **AC-5** Einstellungen → «Ausgeblendete Personen» listet sie; «Wieder anzeigen» hebt es auf.
- **AC-6** Drei Meldungen verschiedener Konten verstecken das Bild sofort; die Person sieht den Hinweis und kann «Das ist ein Fehler» schicken.
- **AC-7** Nur der Plattform-Admin sieht Meldungen und kann zurücksetzen, entfernen, sperren, wiederherstellen, erledigen.
- **AC-8** Die sechste Meldung am Tag wird abgelehnt.
- **AC-9** Wortliste lehnt grobe Namen in App und Datenbank ab; Hakan, Dick, Dickfinger, Klettermax1988 gehen durch.
- **AC-10** In der Trainer-Gruppe gibt es «Melden», aber kein «Ausblenden».
- **AC-11** Meldungen frischer Konten (< 7 Tage oder ohne Begehung) verstecken nichts vorläufig. (v3)
- **AC-12** Nach der Admin-Entscheidung sieht die betroffene Person einmal die Rückmeldung. (v3)
- **AC-13** Die Seite «Fair bleiben» ist erreichbar; beim Speichern von Name/Bild steht der Zustimmungssatz mit Link. (v3)
- **AC-14** Im Admin sind gemeldete Bilder verschwommen bis «Anzeigen»; «Sperren» fragt nach. (v3)
- **AC-15** Melde- und Ausblenden-Knöpfe sind grau umrandet (kein Rot), mindestens 48 px; im Melde-Sheet bleiben «Meldung senden» und «Abbrechen» bei 320 × 568 px und offener Tastatur sichtbar. (v4)
- **AC-16** Ohne Netz wird eine Meldung in die Warteschlange gelegt und später gesendet; Ausblenden wirkt sofort. (v4)

## 8. Tests (CONSTITUTION §13)

- `tests/spec046Moderation.test.tsx` (Unit): Wortliste mit Positiv- und Negativfällen, Ausblenden in beide Richtungen, Anonym-Darstellung, Meldung mit Kopie, Grenze, vorläufig verstecken, Admin-Aktionen, Profilfenster-Knöpfe, Gruppe.
- `tests/e2e/spec046-melden.spec.ts` (Playwright): melden mit Ausblenden, wieder anzeigen, Admin bearbeitet, Gast sieht E-Mail.

## 8a. Offen und nicht Teil dieser Spec

- Beta-Kommentare für alle sichtbar machen (B4): eigene Spec, dann mit Melden.
- Schraubernamen vergibt die Halle; Beschwerden dazu an die Halle.
- Hallen-Admins erfahren nichts über Meldungen und Sperren (G5; eine App-Sperre ist kein Hausverbot).
- Profilbilder nur für Angemeldete: Idee für SPEC-033.
- KI-Bildprüfung: erst wenn die Meldungen es zeigen.

## 9. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-20 | – | Grill-me G1–G9, alles nach Empfehlung (→ v1) | – |
| 1 | 2026-10-20 | **hoch:** «Ausgeblendet» verrät das Ausblenden; **hoch:** ein Admin schafft keine 24 Stunden; **hoch:** Jugendliche wissen nicht, wer die Meldung sieht; mittel: Melden als Waffe, Wortliste blockt echte Namen, Löschfrist, Knöpfe zu weit unten, Gruppe | wie «Jemand» darstellen; vorläufig verstecken ab 3 Meldungen + «Das ist ein Fehler»; fester Satz «nur das BoulderMate-Team»; Grenze 5/Tag + Zähler; ganze Wörter + Testnamen; 6 Monate Löschfrist; Knöpfe oben; Gruppe nur Melden; einfache Gründe; Belästigung → ausblenden; Notruf-Satz; Sperre-Hinweis; Hilfe-Eintrag (→ v2) | Hallen-Admin informieren (kein Hausverbot); Bilder nur für Angemeldete (SPEC-033); Kinderfoto-Hinweis; zweiter Bestätigungsschritt; KI-Bildprüfung |
| 2 | 2026-10-20 | **hoch:** «Jemand» fällt in kleinen Hallen auf, Versprechen «erfährt nichts» falsch; **hoch:** vorläufig verstecken mit Wegwerf-Konten missbrauchbar; **hoch:** keine Regeln (Apple); mittel: Rückmeldung, Vertretung, Admin-Ansicht, Wortliste im Code, VoiceOver, Notruf 112, Trainer-Meldungen | ehrlicher Ausblenden-Text; nur Konten > 7 Tage mit Begehung zählen; Rückmeldung nach Entscheidung; Seite «Fair bleiben» + Zustimmungssatz; Vertretung über bestehendes Häkchen; Bilder verschwommen, Sperren mit Nachfrage; Tabelle `blocked_words`; zugängliche Namen; 112 + Halle; Trainer-Meldungen oben; EN «Block» (→ v3) | Zeile in Ranglisten entfernen (fällt genauso auf); Halle per App informieren; weitere Sprachen jetzt; Melden zurücknehmen |
| 3 | 2026-10-20 | keine «hoch»; mittel: Knöpfe wirken nach Ärger, Prüfer finden Melden nicht, Kontakt-Adresse privat, kleines Display; sonst niedrig | ruhige Knöpfe; Prüfer-Hinweis + meldbare Test-Person; `CONTACT_EMAIL` an einer Stelle (Grundsatzfrage an Hans); Satz «gilt in der ganzen App»; Regel in der Rückmeldung; «Wenn du denkst, das ist ein Fehler»; Melden offline; Sheet-Knöpfe fest unten; Satz für Eltern; «Play fair» (→ v4, READY) | «Es gelten unsere Regeln» (rechtlich unklarer); neutraler Sheet-Titel; Hallen über Sperren informieren (G5); weitere Notrufnummern (112 reicht) |

## 10. Umsetzung (2026-10-22)

**Migration** `supabase/migrations/20261022_spec046_melden.sql` (wiederholbar). Reihenfolge im SQL-Editor: zuerst `20261020_spec045_konto_loeschen.sql`, dann diese. Geprüft gegen ein lokales Postgres mit `scripts/test-db-spec046.sh` (Prüfungen in `tests/db/spec046_melden.sql`).
- `user_profiles`: `banned`, `name_hidden`, `avatar_hidden` (für alle lesbar), `moderation_notice`. Ändern nur über Funktionen; ein Trigger `user_profiles_guard` lässt gesperrte Personen Name und Bild nicht ändern und lehnt Namen aus der Wortliste ab (beim Anlegen wird ein solcher Name zu «Kletterer»).
- `treff_reports`: `context` (`treff` | `profil`), `note`, `reported_note`, `reporter_eligible`, `decision`; Gründe `name`, `bild` dazu; `reporter_id` wird beim Konto-Löschen leer.
- `blocked_words` mit `nickname_allowed()`; dieselbe Liste steht in `src/lib/moderation/nicknameFilter.ts` (ein Unit-Test prüft, dass beide gleich sind).
- Funktionen: `report_profile`, `my_hidden_user_ids`, `my_moderation_status`, `ack_moderation_notice`, `object_moderation`, `admin_profile_reports` (räumt erledigte Meldungen nach 6 Monaten weg), `moderate_profile`.

**Code**
- `src/lib/moderation/moderationService.ts` (Ausblenden, Melden, Warteschlange ohne Netz, Admin, Hinweise), `nicknameFilter.ts`, `src/lib/contact.ts` (Kontakt-Adresse an einer Stelle).
- `src/components/moderation/`: `ReportSheet`, `ProfileSafetyButtons` (+ `ReportPersonButton` für Gruppen), `SafetySettingsGroup` (Einstellungen «Sicherheit»: Ausgeblendete Personen, Regeln, Admin-Meldungen), `ModerationNotice`, `SafetyHelpSheet`.
- Angebunden: `PublicProfileModal`, `BoulderSheet` («Wer war schon oben», Beta-Kommentare), `ChallengeCard` (Rangliste), `GroupsSettings`, `MeView` (Name, Hinweis, Zahl am Zahnrad), `TreffView` (Regeln-Satz), `App.tsx` (Abgleich beim Start und wenn wieder Netz da ist).
- `public/regeln.html` «Fair bleiben» (deutsch und englisch), Datenschutzseite Abschnitte 4 und 5, englische Texte `src/lib/i18n/en-moderation.ts`.

**Abweichungen (begründet)**
- Die Treff-Meldung behält ihr eigenes Fenster und ihre Gründe aus SPEC-028; beide Meldungsarten stehen aber in derselben Admin-Liste.
- Die Warteschlange ohne Netz ist ein eigener kleiner Speicher, nicht die Warteschlange aus SPEC-032 (die ist nur für Begehungen gebaut).
- Vertretung für den Plattform-Admin: der bestehende Schalter `is_platform_admin` in `user_profiles` reicht; kein eigenes Feld.
- Das Danke-Fenster bleibt nach «Belästigt mich» stehen; das Profil schließt sich erst danach.

**Tests**
- Unit: `tests/spec046Moderation.test.tsx` (21 Tests)
- Playwright: `tests/e2e/spec046-melden.spec.ts` (melden mit Ausblenden, wieder anzeigen, Boris erledigt die Meldung, falscher Name, Regeln-Seite). Gäste mit Kontakt-Adresse sind im Unit-Test abgedeckt.
- Datenbank: `scripts/test-db-spec046.sh`
