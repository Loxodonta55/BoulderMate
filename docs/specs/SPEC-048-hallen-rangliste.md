# SPEC-048: Hallen-Rangliste – wer war diesen Monat der Beste?

## Status: READY (v4, 2026-10-16)

> **Owner:** Hans · **Created:** 2026-10-16 · **Version:** v4 (nach 3 Loops «FeatureDefinition»)
> **Baut auf:** SPEC-004 («Ich»), SPEC-023 (Farbskala der Halle), SPEC-030 («Geschraubt von»), SPEC-032 (Lesbarkeit), SPEC-033 (Sichtbarkeit, Spitzname), SPEC-035 (Versuche privat), SPEC-037 (Verlauf), SPEC-038 (Hallen-Challenge), SPEC-039 (Englisch via t()), SPEC-043 (Import)
> **Anlass:** Hans, 2026-10-16: «Statistiken der Kletterer pro Halle … vergleichen, wer in der Woche / Monat (du entscheidest) der beste Kletterer war.»
> **Prozess:** Loop «FeatureDefinition». Grill-me am 2026-10-16, alle Fragen nach Empfehlung (Hans: «geh immer mit der Empfehlung»). Feedback-Runden: `feedback-runden/2026-10-16-kletterer-rangliste/` (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

Kletterer einer Halle sehen jeden **Kalendermonat**, wer am meisten und am schwersten Neues geklettert hat, und zwar **unter Leuten auf ihrem Niveau** (Ligen). Die Rangliste soll Lust aufs Klettern machen. Niemand muss mitmachen, niemand wird bloßgestellt, und auch wer Gelb klettert, kann Erste werden.

## 2. Ausgangslage (Code-Stand 11841f2, 2026-10-16)

| # | Befund | Wo |
|---|---|---|
| A1 | Begehungen aller Kletterer (`ascents`: `userId`, `userNickname`, `boulderId`, `type` flash/top/project, `createdAt`) liegen nach dem Abgleich im lokalen Speicher. Eine Rangliste braucht keine neue Abfrage der Begehungen. | `src/types/boulder.ts`, `syncService` |
| A2 | Jede Halle hat eine geordnete Farbskala mit Font-Bereich je Farbe (`fontRangeMin/Max`). | `GradeScaleConfig`, SPEC-023 |
| A3 | SPEC-038 «Hallen-Challenge»: zeitlich begrenzte Aktion der Halle mit freiwilliger Rangliste («Mitmachen · dein Name erscheint»), Karte in «Ich». Zählt Tops an Bouldern einer Regel. | `challengeService.ts`, `challenge/ChallengeCard.tsx` |
| A4 | SPEC-030 «Zahlen» (Admin) zeigt nur Summen ohne Kletterer-Namen; die Schrauber-Rangliste bleibt dort. | `gymInsights.ts` |
| A5 | SPEC-033: Schalter «Mit Namen in ‹Wer war schon oben›» (Standard an). SPEC-035 F4: Versuche sind privat. | `user_profiles.show_in_lists` |
| A6 | SPEC-043: Ticks können aus anderen Apps importiert werden. | `importService.ts` |
| A7 | Kletterer-Navigation: Wand · Ich · Treff. «Ich» hat bereits Challenge-Karte, Meine Projekte, Für dich, Verlauf. | `MobileBottomNav.tsx`, `MeView.tsx` |

## 3. Abgrenzung

| | SPEC-038 Challenge | SPEC-048 Rangliste | SPEC-030 «Zahlen» |
|---|---|---|---|
| Wer startet | Hallen-Admin, mit Regel und Zeitraum | läuft immer, jeden Monat | – |
| Wer erscheint | Teilnehmende der Challenge | Teilnehmende der Halle (einmal «Mitmachen») | niemand namentlich |
| Wertung | Anzahl Tops an Bouldern der Regel | Punkte nach Farbstufe, Flash-Bonus, in Ligen | Summen |
| Wo | «Ich», Block «Wettbewerb» | «Ich», Block «Wettbewerb» | Admin |

Beide Ranglisten teilen sich den Block «Wettbewerb» in «Ich» (v3) und das Mitmachen-Muster.

## 4. Grill-me: Fragen und Entscheidungen (alle nach Empfehlung)

**F1 – Woche oder Monat?** ✔ **Kalendermonat.** Viele kommen ein- bis zweimal pro Woche oder in Schichten; eine Wochenliste wäre jede zweite Woche leer. Als kurzer Ansporn zeigt die eigene Zeile «Diese Woche: +n Punkte» (v2).
**F2 – Was heißt «der Beste»?** ✔ **Punkte nach Farbstufe:** leichteste Farbe der Halle = 10, jede Stufe höher +10; **Flash +20 %**. Jeder Boulder zählt **einmal pro Person**, im Monat seines ersten Tops. Projekte zählen nicht.
**F3 – Teilnahme?** ✔ **Freiwillig (Opt-in) pro Halle**: «Mitmachen · dein Spitzname erscheint in der Rangliste dieser Halle». Aussteigen jederzeit. Unabhängig vom Schalter aus SPEC-033, weil Mitmachen eine ausdrückliche Zustimmung ist.
**F4 – Wer sieht die Liste?** ✔ Alle angemeldeten Kletterer, die die Halle gewählt haben. Drin stehen nur Teilnehmende. Gäste ohne Konto sehen nichts.
**F5 – Wo?** ✔ In «Ich», Block «Wettbewerb» (v3), eine Zeile; Tippen öffnet das Sheet. Kein neuer Tab, nichts auf der Wand.
**F6 – Was steht in der Liste?** ✔ Platz, Spitzname, Punkte, neue Boulder (davon Flash). Gleichstand: wer die Punktzahl früher erreicht hat.
**F7 – Belohnung, Push?** ✔ Keine Abzeichen, kein Konfetti, keine Benachrichtigung.
**F8 – Schummeln?** ✔ Nur Begehungen an Bouldern dieser Halle, die beim Loggen an der Wand hingen; importierte Ticks (SPEC-043) zählen nicht; Tagesgrenze und Herausnehmen durch die Hallenleitung (v2).
**F9 – Versuche?** ✔ Zählen nicht und erscheinen nicht (SPEC-035 F4).
**F10 – Datenhaltung?** ✔ Neue Tabelle für Teilnahme und Herausnahmen; Punkte rechnet die App lokal aus den Begehungen.

## 5. Wertung

### 5.1 Punkte
- **Stufe** eines Boulders = Position seiner Farbe in der Farbskala der Halle (1 = leichteste). Boulder ohne Hallenfarbe bekommen die Stufe der Farbe, deren Font-Bereich ihren Grad enthält; passt keine, zählt der Boulder nicht.
- **Top** = 10 × Stufe Punkte. **Flash** = 12 × Stufe Punkte (Flash = die erste Begehung dieser Person an diesem Boulder ist vom Typ `flash`).
- Ein Boulder zählt **einmal pro Person**, und zwar im Monat, in dem die Person ihn **zum ersten Mal** getoppt oder geflasht hat. Wiederholungen zählen nicht.
- **Zählt nicht:** Projekte; importierte Ticks (SPEC-043); Boulder, die beim Loggen nicht aktiv an der Wand hingen; **Boulder mit `setterId` = eigene Person** (v2).
- **Tagesgrenze** (v2): pro Person und Tag zählen höchstens **25** Boulder, und zwar die mit den meisten Punkten.
- **Monat** (v3) nach Ortszeit der Halle (`Europe/Berlin`; gilt für DE und CH). Maßgeblich ist `createdAt` der Begehung (Zeitpunkt des Loggens).

### 5.2 Ligen (v2, Regeln v3)
- Die Farbstufen der Halle werden der Reihe nach in gleich große Gruppen geteilt: **unter 4 Stufen eine Liste ohne Ligen**, **4–5 Stufen zwei Ligen**, **ab 6 Stufen drei Ligen** (Rest geht an die oberste Liga).
- **Name** aus den Farben (v3): «Liga Gelb–Grün», «Liga Blau–Rot», «Liga Schwarz–Weiß»; Farbnamen ausgeschrieben, auf Englisch «League Yellow–Green».
- **Einteilung am Monatsanfang** (v3): die höchste Liga, in deren Farben die Person in den **8 Wochen vor Monatsbeginn mindestens 3 Tops/Flashes** in dieser Halle hat. Neue ohne Verlauf starten in der untersten Liga.
- **Aufstieg im Monat** (v3): Wer im laufenden Monat den 3. Top in den Farben einer höheren Liga schafft, klettert **ab dem nächsten Tag** dort; die Punkte des Monats gehen mit. Beim nächsten Öffnen einmalig: «Glückwunsch, du kletterst jetzt in Liga Grün–Blau. Deine Punkte hast du mitgenommen.» (v4)
- **Freiwillig höher** (v2): Im Sheet «In höherer Liga mitklettern» (gilt für den Monat). Tiefer geht nie.
- **Abstieg** nur zum Monatswechsel nach der Einteilungsregel.
- **Kleine Ligen** (v3): Hat eine Liga weniger als **3** Teilnehmende, wird sie mit der nächstniedrigeren zusammengelegt (die unterste mit der nächsthöheren); Name dann z. B. «Liga Gelb–Blau».

## 6. Oberfläche

### 6.1 «Ich», Block «Wettbewerb» (v3)
`me-competition` mit je einer großen Zeile (≥ 48 px), Challenge (SPEC-038) und Rangliste untereinander:
- Teilnehmend: `ranking-row` «**Rangliste Oktober** · Platz 4 in Liga Grün–Blau · 160 Punkte».
- In den Tagen 1–7 eines Monats (v4): «**Oktober vorbei** · Platz 4 in Liga Grün–Blau».
- Nicht teilnehmend (v2): eine Zeile «Rangliste dieser Halle ansehen» mit Knopf «Nicht mehr zeigen» `ranking-hide` (lokal pro Halle; zurück über Ich → Einstellungen → «Rangliste zeigen»).
- Läuft keine Challenge, besteht der Block nur aus der Ranglisten-Zeile.

### 6.2 Sheet «Rangliste» `ranking-sheet`
Von oben nach unten (Handy zuerst, eine Spalte):
1. Kopf: «Rangliste» + Hallenname; Umschalter `ranking-month-current` / `ranking-month-previous` («November · Oktober»), nur aktueller und letzter Monat (v4).
2. Liga-Reiter `ranking-league-<n>` mit Liga-Namen (eigene Liga vorausgewählt). Ohne Ligen entfällt die Zeile.
3. **Eigene Karte** `ranking-me` (nur Teilnehmende): Platz als Zahl, Punkte, «Diese Woche: +40 Punkte» (v2), «6 neue Boulder diesen Monat, davon 2 Flash» (v2), «Noch 20 Punkte bis Platz 3» (v3); auf Platz 1: «Du führst in deiner Liga.» (v4).
4. **Liste** `ranking-list` (v3): Plätze 1–10, dann «…», dann Platz davor, «Du», Platz danach. Zeile `ranking-entry`: Platz «1.» als Text (keine Krone allein, v4), Spitzname, Punkte, «8 neu · 3 Flash». **Keine Uhrzeiten, kein Profilbild, kein Profil-Link; Zeilen öffnen nichts** (v2, v3). Die eigene Zeile trägt das Wort «Du» und einen kräftigen Rand (nicht nur Farbe).
5. **«So zählt's»** `ranking-rules` (aufklappbar, v2): Tabelle Farbe (Farbpunkt + Farbname) → Punkte Top / Flash; Satz: «Jeder Boulder zählt einmal, im Monat deines ersten Tops. Schwerere Farben geben mehr, Flash 20 % mehr. Projekte und deine eigenen Routen zählen nicht. Höchstens 25 Boulder pro Tag.» (v3)
6. Knopf `ranking-join` «Mitmachen» bzw. `ranking-leave` «Aussteigen»; `ranking-league-up` «In höherer Liga mitklettern».
7. Nur Hallen-Admin/Plattform-Admin: Abschnitt **«Herausgenommen»** `ranking-excluded` (v4) mit Spitzname, Monat, von wem, Knopf «Wieder aufnehmen»; an jeder Zeile ein Menü «Für diesen Monat herausnehmen» `ranking-exclude`.

### 6.3 Mitmachen-Dialog `ranking-join-dialog`
- Satz: «Mitmachen · dein Spitzname erscheint in der Rangliste dieser Halle. Du kannst jederzeit aussteigen.»
- **Vorschau-Zeile** (v4), genau wie andere einen sehen, plus Link «Spitzname ändern» (öffnet Einstellungen).
- «Unter 16? Frag zuerst deine Eltern.» (v2, wie SPEC-042)
- Knöpfe «Mitmachen» / «Abbrechen».

### 6.4 Zustände
- **Leer** (v4): «Noch niemand dabei. Mach als Erste oder Erster mit.»
- **Herausgenommen** (v3): Die betroffene Person sieht oben im Sheet: «Die Hallenleitung hat dich für Oktober aus der Rangliste genommen. Fragen? Sprich das Hallenteam an.» Kein Begründungsfeld.
- **Ausgestiegen** (v4): Die Liste wird immer aus den **aktuellen** Teilnehmenden gerechnet; wer aussteigt, verschwindet auch aus dem Vormonat. Wer wieder einsteigt, erscheint mit allen Punkten, die sich aus seinen Tops ohnehin ergeben.

## 7. Datenschutz und Fairness

- Teilnahme nur mit ausdrücklicher Zustimmung, pro Halle; nur Spitzname.
- Keine Uhrzeiten, keine Tage, keine Versuche, keine Profil-Links in der Rangliste; die Rangliste verrät nicht, wann jemand in der Halle war.
- Die Datenbank-ID in `ascents.user_id` bleibt technisch lesbar (wie SPEC-033 F4); die App verspricht nur «andere sehen dich nur, wenn du mitmachst».
- Folgeänderung bei der Umsetzung: ein Absatz in `public/datenschutz.html` («Hallen-Rangliste: freiwillig, Spitzname, Aussteigen jederzeit, Herausnahme durch die Hallenleitung»).

## 8. Lesbarkeit (Hans, SPEC-032)

- Fließtext ≥ 16 px, Platz und Punkte der eigenen Karte ≥ 32 px, Tap-Flächen ≥ 48 px.
- Kontrast ≥ 4,5 : 1 in hell und dunkel.
- **Farbe nie allein:** jeder Farbpunkt mit Farbname; eigene Zeile mit dem Wort «Du»; Platz 1 als «1.».
- Kein Konfetti, keine Animation über 200 ms, keine Töne, keine Vibration (v4).
- Alle Texte über `t()`, Deutsch und Englisch (SPEC-039), Farbnamen eingeschlossen.

## 9. Datenmodell (Migration spielt Hans im SQL-Editor ein)

`supabase/migrations/20261016_spec048_rangliste.sql`:
- `ranking_participants` (`gym_id TEXT`, `user_id UUID`, `nickname TEXT`, `joined_at TIMESTAMPTZ`, `league_up_month TEXT NULL` – Format `JJJJ-MM`, PK `gym_id, user_id`). Lesen: angemeldete. Anlegen/Ändern/Löschen: nur eigene Zeile.
- `ranking_exclusions` (`gym_id TEXT`, `user_id UUID`, `month TEXT`, `created_by UUID`, `created_at`, PK `gym_id, user_id, month`). Lesen: angemeldete (die betroffene Person muss es sehen). Anlegen/Löschen: Hallen-Admin der Halle oder Plattform-Admin.
- Ohne Supabase (Tests, «Ansehen als …») lokal unter `boulderapp_ranking_v1`.
- **Reihenfolge:** Code ausliefern, dann Migration; fehlt die Tabelle, zeigt die App die Zeile «Rangliste bald verfügbar» statt eines Fehlers.

## 10. Umsetzung (Plan)

- `src/lib/rankingService.ts` – reine Funktionen:
  - `boulderLevel(boulder, gymScale)` → Stufe oder `null`.
  - `computeMonthlyPoints(ascents, boulders, gym, month, tz)` → pro Person Punkte, neue Boulder, Flashes, Zeitpunkt des Erreichens; mit Erst-Top-Regel, Tagesgrenze 25, Ausschlüssen (Import, eigene Routen, nicht aktiv).
  - `leaguesForScale(scale)`, `assignLeague(userId, month, …)` (8-Wochen-Regel, Aufstieg, freiwillig höher), `mergeSmallLeagues(…)`.
  - `buildRanking(gymId, month, participants, exclusions, me)` → Ligen, Plätze, eigene Karte, «Noch n Punkte bis Platz m», Wochenpunkte.
- `src/components/ranking/RankingRow.tsx`, `RankingSheet.tsx`, `RankingJoinDialog.tsx`.
- `src/components/MeView.tsx`: Block «Wettbewerb» fasst `ChallengeCard` und `RankingRow` zusammen.
- Texte in `src/lib/i18n/en-me.ts` (bzw. eigenes `en-ranking.ts`).
- Lokaler Speicher: `bm_ranking_hidden_<gymId>`, `bm_ranking_promo_seen_<gymId>_<JJJJ-MM>`.

## 11. Akzeptanzkriterien

- **AC-1** «Ich» zeigt `me-competition` mit `ranking-row`; ohne Teilnahme eine Zeile mit `ranking-hide`; Gäste ohne Konto sehen nichts.
- **AC-2** Punkte: Top 10 × Stufe, Flash 12 × Stufe; jeder Boulder einmal pro Person im Monat des ersten Tops; Projekte, Importe, nicht aktive Boulder und eigene Routen zählen nicht; höchstens 25 pro Tag (die punktstärksten).
- **AC-3** Monat nach `Europe/Berlin`; eine Begehung am 31.10. um 23:30 Ortszeit zählt für Oktober.
- **AC-4** Ligen: 1/2/3 nach Anzahl Farbstufen; Einteilung aus 8 Wochen (≥ 3 Tops); Aufstieg ab dem Tag nach dem 3. Top höher, Punkte bleiben; freiwillig höher, nie tiefer; Ligen unter 3 Personen werden zusammengelegt; Namen aus Farbnamen.
- **AC-5** `ranking-list` zeigt Plätze 1–10, «…» und die eigene Umgebung; Gleichstand nach früherem Erreichen; keine Uhrzeiten, keine Profilbilder, keine Links.
- **AC-6** `ranking-me` zeigt Platz, Punkte, Wochenpunkte, neue Boulder/Flash und «Noch n Punkte bis Platz m»; auf Platz 1 «Du führst in deiner Liga.».
- **AC-7** `ranking-join-dialog` zeigt Vorschau-Zeile, Eltern-Satz; nach «Mitmachen» erscheint man in der Liste; `ranking-leave` entfernt aus aktuellem und letztem Monat.
- **AC-8** Admin: `ranking-exclude` nimmt eine Person für den Monat heraus; sie sieht den festen Satz; `ranking-excluded` listet und «Wieder aufnehmen» macht es rückgängig. Nicht-Admins sehen beides nicht.
- **AC-9** Monatsumschalter nur aktueller und letzter Monat; Tage 1–7 zeigen in «Ich» den Vormonat.
- **AC-10** Aufstiegs-Satz erscheint genau einmal pro Aufstieg.
- **AC-11** Leerer Zustand mit Satz aus §6.4; fehlende Tabelle führt nicht zu einem Fehler.
- **AC-12** Lesbarkeit nach §8; alle Texte auf Englisch vorhanden.

## 12. Nicht Teil dieser Spec

- Wochen-Rangliste (F1), hallenübergreifende Rangliste (Hallen schrauben unterschiedlich, SPEC-037 F5).
- Frauen-/Männer-Wertung (keine Geschlechtsabfrage).
- Abzeichen, Konfetti, Gutscheine, Push «Du wurdest überholt».
- Glückwunsch-Knopf / Interaktion zwischen Personen (braucht SPEC-046 Melden/Blockieren).
- Beamer-Ansicht für die Halle (später, mit eigener Zustimmung; Nähe zu SPEC-012).
- Archiv älterer Monate (eigener Verlauf steht in SPEC-037).
- Rückdatiertes Nachtragen.

## 13. Tests (CONSTITUTION §13, bei Umsetzung)

**Unit (Vitest)**
- `tests/spec048Ranking.test.ts`: Stufe aus Farbe und Font-Grad; Punkte Top/Flash; Erst-Top-Regel über Monatsgrenzen; Ausschluss Projekt/Import/nicht aktiv/eigene Route; Tagesgrenze 25 (punktstärkste); Monatsgrenze in `Europe/Berlin`; Ligen-Teilung 3/4/6 Stufen; 8-Wochen-Einteilung; Aufstieg mit Punkten; freiwillig höher; Zusammenlegen < 3; Gleichstand; «Noch n Punkte bis Platz m»; Aussteigen entfernt aus beiden Monaten; Herausnahme.
- `tests/spec048RankingView.test.tsx`: Block «Wettbewerb», Zeile ohne/mit Teilnahme, «Nicht mehr zeigen», Sheet mit Ligen-Reitern, kompakte Liste, «Du», keine Links/Uhrzeiten, «So zählt's», Mitmachen-Dialog mit Vorschau und Eltern-Satz, Admin-Abschnitt, leerer Zustand, englische Texte.

**Playwright (`tests/e2e/ranking.spec.ts`, Desktop und Mobile Chrome)**
- Kletterer: «Ich» → Rangliste ansehen → Mitmachen (Vorschau prüfen) → Boulder an der Wand flashen → Punkte und Platz erscheinen → Aussteigen → nicht mehr in der Liste.
- Admin (über «Ansehen als …»): Person herausnehmen → als diese Person den Satz sehen → wieder aufnehmen.
- Schrauber: eigene Route toppen → keine Punkte.

## 14. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-16 | – | Grill-me F1–F10, alles nach Empfehlung: Monat, Punkte nach Farbstufe + Flash 20 %, Opt-in pro Halle, Karte in «Ich» (→ v1) | – |
| 1 | 2026-10-16 | **hoch:** Anfänger und Ältere chancenlos; **hoch:** Schummeln; **hoch:** Kinder, Profil-Link, Uhrzeiten; mittel: Punkte unklar, Schrauber kennen eigene Routen, Monat lang, Druck auf Nicht-Teilnehmer | Ligen nach Niveau; Tagesgrenze 25 + Herausnehmen durch Admin; nur Spitzname ohne Link/Uhrzeit, Eltern-Satz; «So zählt's»; eigene Routen zählen nicht; «Diese Woche: +n»; Zeile für Nicht-Teilnehmer ausblendbar; Farbnamen (→ v2) | Frauen-Liste (Geschlechtsabfrage); Gutschein (Theke); hallenübergreifend (Hallen schrauben anders); Push «überholt» (Druck) |
| 2 | 2026-10-16 | **hoch:** Liga-Einteilung anfällig (Glückstreffer, Wechsel, Neue); mittel: Liga-Namen abwertend, kleine Ligen, Ziel statt Urteil, Herausnahme ohne Satz, «Ich» wird voll | Liga-Regel «≥ 3 Tops in 8 Wochen», Aufstieg mit Punkten, Abstieg nur Monatswechsel; Namen aus Farben; Zusammenlegen < 3; «Noch n Punkte bis Platz m», kompakte Liste; fester Satz bei Herausnahme; Block «Wettbewerb»; Ortszeit der Halle (→ v3) | Glückwunsch-Knopf (braucht SPEC-046); Beamer-Ansicht (später, SPEC-012); rückdatiertes Nachtragen (Randfall) |
| 3 | 2026-10-16 | mittel: Vorschau vor Mitmachen, Aussteigen auch aus Vormonat, Aufstieg erklären, Admin rückgängig; sonst niedrig | Vorschau-Zeile; Liste aus aktuellen Teilnehmenden; Aufstiegs-Satz; Admin-Abschnitt «Herausgenommen»; Vormonat in Tagen 1–7; «1.» statt Krone, kein Konfetti/Ton; leerer Zustand (→ v4) | Archiv aller Monate (Verlauf SPEC-037 reicht) |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen in Loop 3 nur Feinschliff → Status **READY**.
