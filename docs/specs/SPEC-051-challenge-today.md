# SPEC-051: «Challenge Today» – deine persönliche Challenge

## Status: IMPLEMENTED (v4, READY 2026-10-20)

> **Owner:** Hans · **Created:** 2026-10-20 · **Version:** v4 (nach 3 Loops «FeatureDefinition»)
> **Baut auf:** SPEC-003 (Bewertungen, Grad-Gefühl, Radar-Aggregation), SPEC-004 Deep Dive v2 (Merkmal-Zahlen), SPEC-008 (Stil-Profil, ab 5 Tops), SPEC-022 F24 (Grad? Soft/Fair/Stiff nach dem Top), SPEC-031 (Hinweis-Streifen «Neu an der Wand»), SPEC-032 (Lesbarkeit, InfoTip), SPEC-037 F4 («Für dich»), SPEC-039 (Englisch via `t()`)
> **Prozess:** [Loop «FeatureDefinition»](../prozesse/feature-definition.md). Grill-me am 2026-10-20, Hans: «geh immer mit der Empfehlung». Feedback-Runden: [`docs/feedback-runden/2026-10-20-challenge-today/`](../feedback-runden/2026-10-20-challenge-today/) (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

Ein kleines Gimmick, das **auf keinen Fall nervt**, aber Spaß macht: BoulderMate schlägt einer Kletterin oder einem Kletterer **eine Route vor, die eigentlich über dem eigenen Grad liegt, aber machbar ist, weil sie genau zum eigenen Profil passt**.

Beispiel (Hans): Eine stiffe weiße 6A+ ist mir zu schwer, *es sei denn*, sie verlangt vor allem Dynamik und Maximalkraft und kaum Technik oder Beweglichkeit.

Die Challenge ist **nicht wichtig**, sie steht nie im Vordergrund. Hauptzweck der App (Boulder finden, bewerten, Erfolge tracken) bleibt unberührt.

## 2. Abgrenzung

| | SPEC-051 «Deine Challenge heute» | SPEC-038 «Hallen-Challenge» | SPEC-048 Rangliste «Wettbewerb» | SPEC-037 «Für dich» |
|---|---|---|---|---|
| Wer legt fest | die App, nur für dich | Halle (Admin) | – | die App |
| Idee | über deinem Grad, passt zu deinen **Stärken** | Aktion mit Zeitraum, Mitmachen | Monatsliga | trainiert deine **Baustelle** |
| Andere sehen es | nein, nur auf deinem Gerät | Teilnehmende | Opt-in | nein |
| Punkte / Rang | **keine** | Rangliste unter Teilnehmern | ja | keine |
| Symbol | Flamme | Pokal | – | Funkeln |

Texte im UI: **«Deine Challenge heute»** (EN «Your challenge today»). «Challenge Today» ist nur der interne Name. Das Wort «Limit» erscheint nicht im UI.

## 3. Grill-me (Schritt 0, alles nach Empfehlung)

| # | Frage | Entscheidung |
|---|---|---|
| G1 | Zweck | Motivation: eine Route über dem eigenen Grad, die zum Profil passt |
| G2 | Zielgruppe | angemeldete Kletterer mit Stil-Profil (ab 5 Tops, SPEC-008); keine Gäste |
| G3 | Ort, zufällig | kleiner Streifen an der Wand unter der Sektor-Pille, wie SPEC-031 |
| G4 | Ort, gezielt | eine eingeklappte Zeile in «Ich» unter «Für dich»; kein Tab, kein Navigationsknopf |
| G5 | Häufigkeit | höchstens 1× am Tag, selten (Details F5) |
| G6 | Was es nicht ist | keine Punkte, keine Abzeichen, keine Rangliste, kein Push, kein Ton, kein Countdown |
| G7 | Speicherung | nur lokal (`localStorage`), keine Datenbank, **keine Migration** |
| G8 | Geschafft | kurzer Glückwunsch im ohnehin erscheinenden Log-Hinweis |

## 4. Funktionen

### F1 Auswahl der Route (`src/lib/challengeToday.ts`, reine Funktion `pickChallengeCandidates`)

Eingaben: Stil-Profil `userRadar` aus `getAthletePerformanceReport(userId, 'all')`, Logbuch aller Hallen, aktive Boulder der aktuellen Halle, Bewertungen.

1. **Gesperrt**, solange das Stil-Profil gesperrt ist (`isUnlocked = false`, unter 5 Begehungen).
2. **Stärken**: Merkmale mit Profilwert ≥ 3,5 (stärkste zuerst). Gibt es keine, das stärkste Merkmal, sofern ≥ 3,2. Sonst keine Challenge.
3. **Schwächen**: Merkmale mit Profilwert ≤ 2,5, dazu immer das schwächste Merkmal, wenn es unter 3 liegt.
4. **Sicherer Grad**: schwerster Fb-Grad mit mindestens 2 Tops/Flashes in den letzten 90 Tagen; fehlt das, mit mindestens 2 Tops überhaupt; sonst der schwerste Top.
5. **Effektiver Grad der Route**: `resolveBoulderFontGrade(Farbe, Mehrheits-Grad-Gefühl, fontGrade)` – Stiff zählt eine Stufe härter, Soft eine leichter.
6. **Kandidatin**, wenn alle Bedingungen gelten:
   - Boulder aktiv, Sektor nicht im Umbau, von dir noch nicht getoppt/geflasht (Projekte mit Versuchen bleiben erlaubt);
   - effektiver Grad **1 oder 2 Stufen** über dem sicheren Grad (Fb-Leiter);
   - Anforderungsprofil (Schrauber-Radar mit Community-Einschätzungen, `computeAggregatedRadar`): **mindestens eine Stärke ≥ 4**;
   - **jede Schwäche ≤ 3** («kaum nötig»);
   - Passung `Σ (Anforderung − 3) · (Profil − 3) > 0`;
   - Ø Sterne ≥ 3, oder noch keine Sterne (zählt wie 3).
7. **Rangfolge**: Passung + (Ø Sterne − 3) + 0,5 bei genau 1 Stufe über dem sicheren Grad.

### F2 Eine Challenge pro Tag (`getChallengeToday`)

- Pro Person, Halle und Kalendertag eine feste Challenge. Gewählt wird zufällig, aber **reproduzierbar** (Startwert aus Person + Halle + Datum) unter den besten 3 Kandidatinnen.
- **«Andere zeigen»**: nächste Kandidatin nach Rangfolge, höchstens **2-mal** am Tag; der Knopf erscheint nur, wenn es eine weitere Kandidatin gibt und noch nicht 2× getauscht wurde.
- Am nächsten Tag wird neu gewählt; die gestrige darf wiederkommen, wird aber nicht bevorzugt. Keine Liste vergangener Challenges.

### F3 Zeile in «Ich» (`ChallengeTodayRow`)

- Unter «Für dich», nur wenn das Stil-Profil frei ist. Unter 5 Tops: nichts (kein Zähler).
- **Eingeklappt** (Standard): Flammen-Symbol, Titel «Deine Challenge heute», Untertitel «{Farbe als Wort} Nr. {n} · {Grad} · {Sektor}», Mindesthöhe 56 px.
- **Aufgeklappt**:
  - Begründung «Liegt dir: Maximalkraft 5 · Koordination 4» (höchstens 2 Stärken, Werte wie im Deep Dive), «Kaum Technik nötig» (höchstens 1), «1 Stufe über deinem sicheren Grad 6A», bei Mehrheit «stiff»/«soft» der Zusatz «(stiff)».
  - Sterne, falls vorhanden: «★ 4,3».
  - Knöpfe **«Route öffnen»** (öffnet das BoulderSheet) und ggf. **«Andere zeigen»**.
  - InfoTip «?»: «Deine Stärken kommen aus deinem Stil. Die Route liegt 1–2 Stufen über deinem sicheren Grad (mind. 2 Tops). Wird nur auf deinem Gerät berechnet.»
- Keine passende Route: «Heute keine passende Route in {Halle}. Schau morgen wieder.»

### F4 Streifen an der Wand (`ChallengeTodayBanner`)

- Eine Zeile wie SPEC-031: Flammen-Symbol, «Deine Challenge heute: {Farbe} Nr. {n} · {Sektor}», Knopf **«Zeigen»**, Knopf **X** (44 px).
- «Zeigen» wechselt zum Sektor der Route und öffnet ihr BoulderSheet.
- Schrift ≥ 16 px, Farbe als Wort, nur Design-Tokens (hell/dunkel).

### F5 Wann der Streifen erscheint (`decideBannerToday`)

- Nur angemeldet, Stil-Profil frei, Schalter an, eine Kandidatin vorhanden.
- **Einmal pro Besuchstag** (Tag, an dem die Wand geöffnet wird) wird gewürfelt: **40 %** Chance. Nach **3 Besuchstagen ohne Streifen** erscheint er sicher.
- Höchstens **1× pro Tag**: nach «Zeigen» oder «X» kommt er an diesem Tag nicht wieder.
- **Ein Hinweis pro Besuch**: Ist beim Öffnen der Wand «Neu an der Wand» (SPEC-031) zu sehen, erscheint die Challenge bei diesem Besuch nicht, auch nicht nach dem Wegklicken.
- **2× hintereinander «X»** ohne «Zeigen» → **14 Tage Pause** für den Streifen. «Zeigen» setzt den Zähler zurück.
- Schalter in Einstellungen «Challenge-Hinweis an der Wand» (Standard an). Die Zeile in «Ich» bleibt immer.

### F6 Im BoulderSheet und beim Top

- Ist der Boulder deine heutige Challenge, steht oben im Sheet eine Zeile mit Flammen-Symbol «Deine Challenge heute».
- Loggst du Top oder Flash auf deiner heutigen Challenge, beginnt der normale Log-Hinweis mit **«Challenge geschafft!»**. Kein zweiter Hinweis, kein Ton.

## 5. Speicherung

`localStorage['boulderapp_challenge_today_v1']`, pro Nutzer: `{ day, gymId, boulderId, swaps, shownIds, banner: { decidedDay, show, closedDay, dismissStreak, pausedUntil, visitsWithout } }`; Schalter `boulderapp_challenge_banner_v1` (`'off'` = aus). Keine Daten verlassen das Gerät.

## 6. Akzeptanzkriterien

| AC | Kriterium | Test |
|---|---|---|
| AC-1 | Route wird nur gewählt, wenn effektiver Grad 1–2 Stufen über dem sicheren Grad liegt | Unit |
| AC-2 | Route braucht mind. eine Stärke ≥ 4 und jede Schwäche ≤ 3 | Unit (Hans' Beispiel: stiffe weiße 6A+ mit Dynamik/Maximalkraft ja, mit Technik nein) |
| AC-3 | Stiff zählt eine Stufe härter (Route kann dadurch hinein- oder herausfallen) | Unit |
| AC-4 | Getoppte, inaktive, Umbau-Routen und Ø < 3 Sterne sind ausgeschlossen; unbewertete erlaubt | Unit |
| AC-5 | Sicherer Grad: ≥ 2 Tops in 90 Tagen, sonst ≥ 2 Tops, sonst bester Top | Unit |
| AC-6 | Gleiche Challenge den ganzen Tag; «Andere zeigen» höchstens 2× | Unit + E2E |
| AC-7 | Streifen: 40 %-Würfel pro Besuchstag, Garantie nach 3 Tagen, max. 1× pro Tag, 14 Tage Pause nach 2× X, Schalter aus = nie | Unit |
| AC-8 | Kein Streifen, wenn bei diesem Besuch «Neu an der Wand» zu sehen war | Unit (Komponente) |
| AC-9 | «Zeigen» öffnet das Sheet der Route | E2E |
| AC-10 | Zeile in «Ich» nur ab freiem Stil-Profil, eingeklappt, aufklappbar mit Begründung | Unit + E2E |
| AC-11 | Sheet zeigt «Deine Challenge heute»; Top darauf → «Challenge geschafft!» im Log-Hinweis | Unit + E2E |
| AC-12 | Alle Texte über `t()` mit englischem Eintrag | Unit |

## 7. Dateien

- `src/lib/challengeToday.ts` – Auswahl, Tageszustand, Streifen-Regeln
- `src/lib/i18n/en-challenge-today.ts` – englische Texte
- `src/components/challenge/ChallengeToday.tsx` – `ChallengeTodayRow`, `ChallengeTodayBanner`, `ChallengeTodaySheetLine`, `ChallengeBannerSetting`
- Einbau: `MeView.tsx` (Zeile, Schalter), `ClimberSectorView.tsx` (Streifen), `BoulderSheet.tsx` (Zeile, «Challenge geschafft!»), `i18n.ts`
- Tests: `tests/spec051ChallengeToday.test.tsx`, `tests/e2e/spec051-challenge-today.spec.ts`

## 8. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-20 | – | Grill-me G1–G8, alles nach Empfehlung (→ v1) | – |
| 1 | 2026-10-20 | **hoch:** bester Grad als Limit ist ein Ausreißer; **hoch:** Verwechslung mit Hallen-Challenge; mittel: englischer Name, fehlende Begründung, Farbpunkt allein, unbewertete Routen fallen raus, «jeder 3. Tag» passt nicht für Seltene | «sicherer Grad» (≥ 2 Tops/90 Tage); Text «Deine Challenge heute» mit Flamme; Begründung mit Merkmal-Zahlen, kein Wort «Limit»; Farbe als Wort; unbewertet = 3 Sterne, < 3 Sterne raus, Umbau raus; Zufall pro Besuchstag; «Andere» max. 2×; Datenschutz-Satz (→ v2) | Punkte/Abzeichen (nervt, Verletzungs-Wettrennen); Push |
| 2 | 2026-10-20 | **hoch:** reiner Zufall lässt Hinweis verschwinden; **hoch:** zwei Hinweise pro Besuch; mittel: Ruhe ohne Einstellungen, direkt zur Route, Zeile eingeklappt, Leertext, nichts unter 5 Tops | 40 % + Garantie nach 3 Besuchstagen; «Neu an der Wand» hat Vorrang, ein Hinweis pro Besuch; 2× X → 14 Tage Pause; «Zeigen» öffnet Sheet; Zeile 56 px eingeklappt; «Heute keine passende Route»; InfoTip; Stiff/Soft in Begründung; Schalter (→ v3) | Zähler «noch n Tops» (Druck); Zählen für Rangliste SPEC-048 |
| 3 | 2026-10-20 | mittel: kein zweiter Hinweis nach dem Top; sonst niedrig | «Challenge geschafft!» im Log-Hinweis; Zeile im Sheet; max. 2 Stärken + 1 «Kaum … nötig»; «Andere» nur wenn sinnvoll; nur Tokens (→ v4) | gestrige Challenge nachträglich zeigen (Hausaufgaben-Gefühl) |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen in Loop 3 nur Feinschliff → Status **READY**.
