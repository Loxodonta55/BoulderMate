# SPEC-026: Nutzer-Feedback – Fehler, Ideen und Lob direkt aus der App

## Status: IN PROGRESS (Basis auf main 2026-10-08, Migration eingespielt; F16 «Feedback im Header» umgesetzt 2026-10-09, uncommitted)

> **Owner:** Hans · **Created:** 2026-10-08 · **Baut auf:** SPEC-020 (Design System «Kreide», Einstellungen im iOS-Stil), SPEC-022 (Kletterer-UX, ein Ort pro Funktion), SPEC-024 (Datenschutzerklärung)
>
> Geplant nach der Grill-me-Methode. Hans hat vorgegeben, dass jede Frage **nach der Empfehlung** entschieden wird. Fragen, Empfehlung und Begründung stehen deshalb unten vollständig; jede Entscheidung kann Hans später ändern.

> **Zusammenhang mit SPEC-023 (Admin-UX):** Die Admin-Konsole wird parallel umgebaut. Diese Spec ändert `GymManagement.tsx`, `SectorManager.tsx`, `GradeScaleConfig.tsx` und den Admin-Zweig im `AppHeader` **nicht**. Feedback lesen geschieht in Version 1 im Supabase-Dashboard (F9).

---

## 1. Ausgangslage (Code-Stand 2026-10-08)

| # | Befund | Wo |
|---|---|---|
| A1 | Es gibt keinen Weg, dem App-Team etwas mitzuteilen. Rückmeldungen kommen heute nur mündlich oder per Messenger an. | – |
| A2 | Bewertungen (Sterne, Soft/Fair/Stiff, Radar) sind Feedback **zu einem Boulder** für Schrauber und Kletterer. Sie sind kein Kanal für Rückmeldungen **zur App**. | SPEC-003 |
| A3 | Die Einstellungen («Ich» → Zahnrad) sind eine Liste im iOS-Stil mit den Gruppen Profil, Arbeitsbereich, Daten und Abmelden. | `MeView.tsx` |
| A4 | Supabase läuft nur mit dem Anon-Key. Andere Tabellen erlauben dem Anon-Key bereits Schreiben (`Allow insert …`). | `supabase/schema.sql` |

---

## 2. Grill-me: Fragen, Empfehlung und Entscheidung

**F1 – An wen geht das Feedback?**
✔ *Entschieden (Empfehlung):* An das **App-Team** (Hans/Betreiber), nicht an die Halle. Die aktuelle Halle wird nur als Zusatzinfo mitgeschickt.
*Warum:* Feedback zu Bouldern hat mit den Bewertungen schon einen Kanal (A2). Was fehlt, ist der Weg für Fehler und Wünsche an der App selbst. Zwei Empfänger in einem Formular verwirren.

**F2 – Wo findet der Nutzer «Feedback geben»?**
✔ *Entschieden (Empfehlung):* «Ich» → Einstellungen → neue Gruppe **«Hilfe»** mit der Zeile **«Feedback geben»** (Untertitel «Fehler, Ideen, Lob»). Kein schwebender Knopf, kein neuer Tab.
*Warum:* Dort suchen Nutzer nach Hilfe und Kontakt (Muster aus iOS/Android). SPEC-022 verlangt einen Ort pro Funktion; ein schwebender Knopf würde Wandfoto und Pins verdecken.
*Geändert am 2026-10-09 durch F16:* Die Zeile in den Einstellungen bleibt, der Haupteinstieg ist jetzt der Knopf im Header.

**F3 – Wer darf Feedback geben?**
✔ *Entschieden (Empfehlung):* Nur **angemeldete Nutzer** (alle Rollen; Schrauber und Admins wechseln mit «Fertig» in die Kletterer-App). Gäste nicht.
*Warum:* Die Tabelle ist mit dem Anon-Key beschreibbar. Die Anmeldung als Hürde hält Spam fern, und Hans weiß, von wem eine Meldung stammt.

**F4 – Welche Arten von Feedback?**
✔ *Entschieden (Empfehlung):* Drei große Kacheln: **«Fehler»** (Käfer), **«Idee»** (Glühbirne), **«Lob»** (Herz). Eine ist Pflicht; vorausgewählt ist keine.
*Warum:* Drei Arten genügen, um im Dashboard schnell zu sortieren. Mehr Kategorien (z. B. «Frage», «Sonstiges») machen die Wahl schwerer und landen am Ende doch alle in «Sonstiges».

**F5 – Was muss der Nutzer ausfüllen?**
✔ *Entschieden (Empfehlung):* Art + Freitext. Text **mindestens 5, höchstens 2000 Zeichen** (ohne Leerzeichen am Rand). Ein Zähler zeigt «n / 2000». Der Platzhalter passt zur Art:
- Fehler: «Was ist passiert? Was hast du davor gemacht?»
- Idee: «Was wünschst du dir?»
- Lob: «Was gefällt dir?»
*Warum:* Kein Betreff, keine Sterne, keine Pflicht-E-Mail: Jedes Feld mehr senkt die Zahl der Rückmeldungen.

**F6 – Kann man ein Bildschirmfoto anhängen?**
✔ *Entschieden (Empfehlung):* **Nein**, nicht in Version 1.
*Warum:* Braucht einen neuen Storage-Bucket mit eigenen Regeln, und auf Fotos sind schnell Namen anderer Kletterer zu sehen (Datenschutz). Der Gerätekontext (F7) beantwortet die meisten Rückfragen.

**F7 – Was wird automatisch mitgeschickt?**
✔ *Entschieden (Empfehlung):* Halle (ID und Name), Ansicht (`settings` = aus den Einstellungen), Browser/Gerät (User-Agent, auf 300 Zeichen gekürzt), Bildschirmgröße («390×844»), Zeitpunkt, Nutzer-ID und Kletter-Name. **Kein Standort, keine Logbuch-Daten.** Unter dem Textfeld steht sichtbar: «Mitgeschickt werden: Halle, Gerät und dein Kletter-Name.»
*Warum:* Ohne Gerät und Halle sind Fehler kaum nachzustellen. Der offene Hinweis vermeidet Überraschungen.

**F8 – Kann man eine Antwort bekommen?**
✔ *Entschieden (Empfehlung):* Ein großes Häkchen **«Ihr dürft mich dazu per E-Mail kontaktieren»**, standardmäßig **aus**. Nur wenn es an ist, wird die E-Mail-Adresse des Kontos mitgeschickt. Eine Antwort in der App gibt es nicht.
*Warum:* Datensparsam (DSGVO Art. 5), und Hans kann trotzdem nachfragen, wenn ein Fehler unklar ist. Ein Postfach in der App wäre ein eigenes Feature.

**F9 – Wo liest Hans das Feedback?**
✔ *Entschieden (Empfehlung):* In Version 1 im **Supabase-Dashboard** (Table Editor, Tabelle `app_feedback`, neueste zuerst). Eine Spalte `status` («neu», «gelesen», «erledigt») setzt Hans dort von Hand. **Keine** Ansicht in der App.
*Warum:* Leser ist nur das App-Team, und das hat Dashboard-Zugang. Eine Inbox in der App gehörte in die Admin-Konsole, die gerade mit SPEC-023 umgebaut wird. Eine eigene Inbox lohnt erst, wenn regelmäßig Feedback eingeht.

**F10 – Wer darf Feedback in der Datenbank lesen?**
✔ *Entschieden (Empfehlung):* **Niemand über die App.** Row Level Security erlaubt nur `INSERT` (anon und authenticated). Es gibt keine `SELECT`-, `UPDATE`- oder `DELETE`-Regel. Das Dashboard umgeht RLS und sieht alles.
*Warum:* Feedback kann persönliche Inhalte und E-Mail-Adressen enthalten. Andere Nutzer dürfen es nie lesen können.

**F11 – Was passiert ohne Netz?**
✔ *Entschieden (Empfehlung):* Das Feedback wird lokal in eine Warteschlange gelegt (`localStorage`, Schlüssel `boulderapp_feedback_queue_v1`) und beim nächsten App-Start bzw. sobald das Gerät wieder online ist nachgesendet. Jede Meldung hat eine feste ID; das Nachsenden ist dadurch **duplikatfrei** (`ON CONFLICT DO NOTHING`). Der Nutzer sieht: «Danke! Wir senden es, sobald du wieder Netz hast.»
*Warum:* Kletterhallen haben oft schlechten Empfang (CONSTITUTION §13.1 Säule 2). Ein Fehler-Dialog würde die Meldung verlieren.

**F12 – Schutz gegen Überflutung?**
✔ *Entschieden (Empfehlung):* Höchstens **5 Meldungen pro Stunde und Gerät**. Danach ist «Absenden» gesperrt mit dem Hinweis «Du hast gerade viel Feedback geschickt. Bitte versuch es später noch einmal.» Zusätzlich prüft die Datenbank Art und Textlänge.
*Warum:* Mit Anon-Key ohne Server-Code ist das die einfachste Bremse. Für ehrliche Nutzer ist die Grenze unsichtbar.

**F13 – Was sieht der Nutzer nach dem Absenden?**
✔ *Entschieden (Empfehlung):* Im selben Fenster ein großes Häkchen und «Danke! Dein Feedback ist angekommen.» mit dem Knopf «Fertig». Das Formular ist danach leer.
*Warum:* Klare Rückmeldung, dass nichts verloren ging; ein Toast allein wäre zu schnell weg.

**F14 – Wie groß und deutlich ist das Formular?**
✔ *Entschieden (Empfehlung):* Kacheln mind. 76 px hoch mit 28-px-Symbol und 17-px-Text; Textfeld mit 17-px-Schrift, mind. 140 px hoch; Häkchen 28 × 28 px; «Absenden» volle Breite, 56 px hoch, 18 px fett. Die gewählte Kachel hat einen 2-px-Akzentrand **und** ein Häkchen-Symbol (nicht nur Farbe). Kontraste nach WCAG AA.
*Warum:* Gut bedienbar mit Kreide an den Fingern und für Menschen mit schlechteren Augen.

**F15 – Muss die Datenschutzerklärung ergänzt werden?**
✔ *Entschieden (Empfehlung):* Ja. Unter «Welche Daten wir verarbeiten» kommt der Punkt **Feedback** dazu (Text, Art, Halle, Gerät, Kletter-Name, E-Mail nur bei Häkchen); unter «Wie lange»: Feedback wird nach Erledigung, spätestens nach 2 Jahren gelöscht.

**F16 – Wie wird «Feedback geben» prominenter? (Hans, 2026-10-09)**
Hans: «Am Anfang ist Feedback eines der wichtigsten Dinge, die ich für die Weiterentwicklung bekommen kann.»
✔ *Entschieden (Empfehlung):* Ein dauerhaft sichtbarer Knopf **«Feedback»** (Sprechblase + Wort) rechts im **Kletterer-Header**, auf der Wand und auf «Ich», auf Handy und Desktop. Kontrastreich gefüllt (Akzentfarbe, wie «Absenden»), 44 px hoch, 16 px fett. Nur für angemeldete Nutzer (F3). Er öffnet dasselbe Sheet; die Meldung trägt `app_view = 'header'`, so sieht Hans, welcher Einstieg genutzt wird. Die Zeile in den Einstellungen bleibt als zweiter Weg.
*Warum:* Der Header ist auf jeder Kletterer-Seite sichtbar, ohne Wandfoto oder Pins zu verdecken. Mit Wort statt nur Symbol ist er auch für Menschen mit schlechteren Augen eindeutig. Der Hallenname wird dafür auf kleinen Handys früher gekürzt («6a plus Kl…»), bleibt aber antippbar.
*Verworfen:* Schwebender Knopf über dem Wandfoto (verdeckt Pins), Hinweis im Toast nach dem Loggen (der Toast trägt «Rückgängig»), Karte oben auf «Ich» (nur auf einer Seite sichtbar).
*Später:* Wenn genug Feedback kommt, kann der Knopf wieder kleiner werden (nur Symbol) oder ganz in die Einstellungen zurück.

---

## 3. Datenmodell (Migration, spielt Hans im SQL-Editor ein)

Datei: `supabase/migrations/20261008_spec026_feedback.sql`, Tabelle in `supabase/schema.sql` nachgezogen.

```sql
CREATE TABLE IF NOT EXISTS public.app_feedback (
  id          UUID PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     UUID,
  nickname    TEXT,
  email       TEXT,                    -- nur wenn contact_ok
  contact_ok  BOOLEAN NOT NULL DEFAULT false,
  category    TEXT NOT NULL CHECK (category IN ('bug','idea','praise')),
  message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
  gym_id      TEXT,
  gym_name    TEXT,
  app_view    TEXT,
  user_agent  TEXT,
  screen      TEXT,
  status      TEXT NOT NULL DEFAULT 'neu' CHECK (status IN ('neu','gelesen','erledigt')),
  CHECK (contact_ok OR email IS NULL)
);
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert app_feedback" ON public.app_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'neu');
-- bewusst KEINE Select-/Update-/Delete-Regel (F10)
```

`user_id` hat keinen Fremdschlüssel, weil auch Demo- und Testkonten Feedback schicken können. `gym_id` ist Text, weil lokale Hallen-IDs (z. B. `gym-6a-plus`) keine UUIDs sind.

## 4. Akzeptanzkriterien

- **AC-1** In «Ich» → Einstellungen gibt es die Gruppe «Hilfe» mit der Zeile `settings-feedback` («Feedback geben»). Sie öffnet das Sheet `feedback-sheet`.
- **AC-2** Das Sheet zeigt drei Kacheln `feedback-category-bug`, `feedback-category-idea`, `feedback-category-praise` (Rolle `radio`, `aria-checked`). Keine ist vorausgewählt.
- **AC-3** Das Textfeld `feedback-message` zeigt einen zur Art passenden Platzhalter und den Zähler `feedback-counter` («n / 2000»); mehr als 2000 Zeichen lassen sich nicht eingeben.
- **AC-4** `feedback-submit` ist gesperrt, solange keine Art gewählt ist oder der Text kürzer als 5 Zeichen ist.
- **AC-5** Das Häkchen `feedback-contact` ist standardmäßig aus. Nur wenn es an ist, enthält die Meldung die E-Mail des Kontos.
- **AC-6** Unter dem Textfeld steht `feedback-context-note`: «Mitgeschickt werden: Halle, Gerät und dein Kletter-Name.»
- **AC-7** Absenden schreibt **eine** Zeile nach `app_feedback` (POST `/rest/v1/app_feedback`) mit UUID `id`, ISO-Zeitstempel, `category`, `message` (getrimmt), `gym_id`, `gym_name`, `app_view = 'settings'`, `user_agent`, `screen`, `status = 'neu'`.
- **AC-8** Nach Erfolg zeigt das Sheet `feedback-thanks` mit «Danke! Dein Feedback ist angekommen.» und `feedback-done`.
- **AC-9** Ohne Netz oder bei Serverfehler landet die Meldung in `boulderapp_feedback_queue_v1`; das Sheet zeigt «Danke! Wir senden es, sobald du wieder Netz hast.» Beim App-Start und beim Ereignis `online` wird die Warteschlange gesendet und danach geleert; mehrfaches Senden erzeugt keine Duplikate.
- **AC-10** Nach 5 Meldungen innerhalb einer Stunde ist `feedback-submit` gesperrt und `feedback-rate-limit` erklärt warum.
- **AC-11** Gäste sehen keinen Feedback-Einstieg (sie haben kein «Ich»).
- **AC-12** Die Datenschutzerklärung (`public/datenschutz.html`) nennt Feedback (F15).
- **AC-13** Angemeldet zeigt der Kletterer-Header auf Wand und «Ich» den Knopf `header-feedback-btn` («Feedback», mind. 44 px hoch). Er öffnet `feedback-sheet` über dem ganzen Bildschirm; die Meldung hat `app_view = 'header'`. Gäste sehen den Knopf nicht.

## 5. Umsetzung

- `src/lib/feedbackService.ts`: Prüfung (`validateFeedbackMessage`), Aufbau der Zeile (`buildFeedbackRow`), Senden mit Warteschlange (`submitFeedback`, `flushFeedbackQueue`, `startFeedbackQueueSync`), Ratenbremse (`isFeedbackRateLimited`).
- `src/components/FeedbackSheet.tsx`: Formular und Danke-Ansicht im `Sheet` (SPEC-020).
- `src/components/MeView.tsx`: Gruppe «Hilfe» in den Einstellungen.
- `src/components/HeaderFeedbackButton.tsx` (F16): Knopf mit eigenem Sheet, per Portal in `<body>` gerendert (der Header hat `backdrop-blur` und `overflow-hidden` und würde ein `fixed`-Sheet sonst abschneiden). Eingehängt im Kletterer-Zweig von `AppHeader.tsx`; `FeedbackSheet` hat dafür die Prop `appView`.
- `src/App.tsx`: startet beim Laden `startFeedbackQueueSync()`.
- `supabase/migrations/20261008_spec026_feedback.sql`, `supabase/schema.sql`, `public/datenschutz.html`.

## 6. Tests (CONSTITUTION §13)

**Unit (Vitest)** – `tests/spec026Feedback.test.tsx`
- Textprüfung (zu kurz, Leerzeichen, zu lang), Zeile mit Kontext und E-Mail nur bei Häkchen, Senden erfolgreich, Senden schlägt fehl → Warteschlange, Nachsenden leert die Warteschlange und nutzt `ignoreDuplicates`, Ratenbremse.
- Sheet: keine Art vorausgewählt, Knopf gesperrt bis gültig, Platzhalter je Art, Zähler, Häkchen standardmäßig aus, Danke-Ansicht (gesendet / in Warteschlange), Hinweis bei Ratenbremse.
- MeView: Einstellungen → «Feedback geben» öffnet das Sheet.
- AppHeader (F16): Knopf «Feedback» nur angemeldet, öffnet das Sheet, Meldung mit `app_view = 'header'`.

**Playwright** – `tests/e2e/feedback.spec.ts` (Desktop und Mobile Chrome)
- Einstellungen → Feedback → «Idee» + Text → Absenden; der abgefangene POST an `/rest/v1/app_feedback` enthält UUID, ISO-Zeit, Art, Text, Halle und kein `email`; Danke-Ansicht.
- Mit Häkchen enthält der POST die E-Mail des Kontos.
- Supabase nicht erreichbar → Danke-Ansicht «sobald du wieder Netz hast», Eintrag in der Warteschlange; nach Neuladen mit erreichbarem Supabase wird genau eine Meldung mit derselben ID gesendet und die Warteschlange ist leer.
- Knopf bleibt gesperrt bei zu kurzem Text; Kacheln und Knopf sind mindestens 56 px hoch.
- F16: Header-Knopf auf Wand und «Ich» sichtbar (≥ 44 px), Hallenname bleibt sichtbar, Senden mit `app_view = 'header'`; Gäste sehen keinen Knopf.

Stand 2026-10-08: `npm test` 433 grün (davon 13 neu), Playwright (Desktop + Mobile Chrome) 91 grün, 3 übersprungen (davon 8 neu). Typprüfung grün. Mobile Safari wurde nicht getestet.

## 7. Nicht Teil dieser Spec
- Bildschirmfotos anhängen.
- Antworten in der App, Feedback-Inbox in der App (ggf. später in der Admin-Konsole nach SPEC-023).
- Feedback an die Halle oder an Schrauber (dafür gibt es Bewertungen, SPEC-003).
- Automatische Weiterleitung per E-Mail oder Messenger.
