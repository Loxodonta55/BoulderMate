# SPEC-054 · Vertriebspartner – Hallen gewinnen über Partner mit Provision

| | |
|---|---|
| Status | **READY** → Umsetzung (Migration offen, Hallen-Preis offen, Rechtstexte vor Start prüfen lassen) |
| Version | v4 (nach 3 FeatureDefinition-Loops) |
| Auftraggeber | Hans |
| Datum | 2026-10-30 |
| Hängt ab von | SPEC-053 (Hallen-Verzeichnis, Empfehlungscode, Seite «Für Hallen») |
| Feedback-Runden | `docs/feedback-runden/2026-10-30-vertriebspartner/` |
| Strategie (KI-Teil) | `docs/vertrieb/vertriebsstrategie.md` |

## 1. Ziel

Hans findet zu wenig Hallen. Künftig gewinnen **Vertriebspartner** (Trainer, Stammgäste, Influencer, Hallenteams, Studierende, Rentner …) Hallen für BoulderMate. Partner melden sich **selbst in der App** an, bekommen ein **Partner-Kit** (was die App kann, Demo, fertige Texte pro Halle, Einwände mit Antworten) und eine **Provision von 30 %, ab der 3. Halle 40 %**. Die Strategie, Partner zu finden und anzusprechen, entwirft Claude (KI) ausserhalb der App; **versendet wird nur durch Hans oder nach seiner Freigabe**.

### 1.1 Was «30–40 % vom Jahresumsatz» bedeutet (verbindlich)

> **Provision = 30 % (ab der 3. Halle 40 %) des Netto-Umsatzes, den BoulderMate im ersten Vertragsjahr mit dieser Halle macht** (Einführungsgebühr + Gebühren der ersten 12 Monate ab Vertragsbeginn, ohne MwSt., nur tatsächlich bezahlte und nicht zurückerstattete Beträge).
> **Nicht** gemeint ist der Umsatz der Halle selbst (Eintritte, Abos, Kurse).

Staffel: Die 1. und 2. registrierte Halle eines Partners: 30 %. Die 3. und jede weitere: 40 %. Nicht rückwirkend.

### 1.2 Ein Programm, ein Code

Der Empfehlungscode aus SPEC-053 (`BM-XXXXXX`) ist zugleich der Partner-Code. Das SPEC-053-«Dankeschön» folgt derselben Regel wie 1.1 (statt nur 30 % der Einführungsgebühr). Partner ist, wer zusätzlich ein Partner-Profil anlegt; ohne Profil kann man weiter wünschen und mit der Halle reden (SPEC-053).

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| Partner | Konto ab 18 mit Partner-Profil (`vertriebspartner`) und Code (`empfehlungscodes`). |
| Betreuung | Ein Partner kümmert sich um eine Verzeichnis-Halle. 60 Tage, einmal um 60 Tage verlängerbar (bei «Im Gespräch»). Max. 5 gleichzeitig. Andere sehen nur «Ein BoulderMate-Partner ist mit dieser Halle schon im Gespräch». |
| Status | *Von dir betreut → Im Gespräch → Registriert → Bezahlt → Ausgezahlt* (Schritt 1–5). Partner setzt Schritt 1–2 und kann freigeben; Schritt 3–5 setzt der Plattform-Admin. |
| Satz | 30 % oder 40 % (Staffel), festgehalten, sobald die Halle registriert ist. |
| Offen | Halle hat bezahlt, Provision noch nicht ausgezahlt. |

## 3. Funktionen

### F1 · Seite «Partner werden» (`bouldermate.ch/?partner`)
- Öffnet ohne Login eine Seite über der App (wie «Für Hallen»).
- Kopf «Hallen gewinnen, mitverdienen». Darunter Kasten **«Eine Stufe, kein Schneeballsystem: Provision gibt es nur für Hallen, nie für das Werben anderer Partner.»**
- «Was BoulderMate kann» (3 Punkte wie SPEC-053 F4) + Knopf **«Demo: 6a plus Zürich»**.
- «So geht's» in 3 Schritten: Halle auf der Karte übernehmen · fertigen Text an die Hallenleitung schicken · BoulderMate macht Angebot und Vertrag.
- **Provisionskasten**: «30 % von dem, was die Halle im ersten Jahr an BoulderMate zahlt. Ab deiner 3. Halle 40 %, auch für jede weitere; die ersten beiden bleiben bei 30 %.» **Rechenbeispiel** (klar beschriftet): «Zahlt eine Halle im ersten Jahr CHF 1’000, bekommst du CHF 300 (ab der 3. Halle CHF 400).» Ist `HALLEN_JAHRESPREIS_CHF` gesetzt, rechnet das Beispiel mit diesem Preis. Satz: «Den Preis nennt BoulderMate der Halle direkt.»
- Kasten **«Selbständig, ohne Pflichten»**: keine Ziele, keine Mindestzahlen, kein Gebiet, du verhandelst keine Preise und schliesst keine Verträge ab, du versteuerst selbst. **«Keine Rechts- oder Steuerberatung.»** fett.
- Hauptknopf: angemeldet «Partner werden» (schliesst die Seite, öffnet «Ich» beim Partner-Bereich), Gast «Anmelden und Partner werden».
- Textlinks: «Link kopieren» (kopiert `https://bouldermate.ch/?partner`, ohne Code), «Partnerbedingungen».

### F2 · «Ich» → Abschnitt «Partner» (unter «Halle empfehlen»)
**Noch kein Partner:** Karte mit einem Satz «Hallen gewinnen und 30–40 % Provision bekommen.» und Knopf «Mehr erfahren» (öffnet F1). Formular erst nach «Partner werden»:
- Rolle (Chips): Trainer/in · Stammgast · Influencer/in · Hallenteam · Student/in · Andere.
- Region (Text, z. B. «Zürich»), optional Anzeigename.
- Satz: «Sieht nur das BoulderMate-Team. Zweck: Provision abrechnen. Keine Bankdaten in der App.»
- Haken «Ich bin mindestens 18 Jahre alt und akzeptiere die Partnerbedingungen» → «Partner werden». Legt Profil an und, falls nötig, den Code.

**Partner:**
- Code gross (wie SPEC-053) + «Link kopieren» (allgemeiner Link `?ref=<code>`).
- **Zahlenleiste**: «Dein Satz 30 %» (bzw. 40 %) · «Offen CHF …» · «Ausgezahlt CHF …»; darunter «Offen = Halle hat bezahlt, Auszahlung folgt.» und «Du kannst deine Provision auch der Halle als Rabatt schenken.»
- **Meine Hallen**: je Halle Name, Status als Wort + «Schritt n von 5», bei Betreuung «bis TT.MM.JJJJ». Aktionen: «Texte» (F4), «Im Gespräch» (nur bei Schritt 1; verlängert einmal um 60 Tage), «Freigeben» (Schritt 1–2, mit Rückfrage).
- Leerer Zustand: «Schritt 1: Halle auf der Karte suchen und übernehmen.» + Knopf «Halle auf der Karte suchen».
- **Einwände** (7, aufklappbar, ganze Zeile ≥ 48 px): «Wir haben schon eine andere App» · «Was kostet das?» · «Unsere Schrauber haben keine Zeit» · «Was passiert mit unseren Daten?» · «Unsere Kletterer brauchen das nicht» · «Wir sind ein Verein / eine Gemeinde» · «Wir haben gerade keine Zeit». Antworten je ≤ 2 Sätze.
- Textlinks: «Partnerbedingungen» · «Partner beenden» (Rückfrage; löscht Profil und Code, laufende Hallen bleiben für die Abrechnung).

### F3 · Hallen-Blatt einer Verzeichnis-Halle (Ergänzung zu SPEC-053 F2)
- Unter «Ich will BoulderMate hier» und «Mit der Halle reden» **nur für Partner** eine Zeile:
  - frei: Knopf (Zeile) **«Als Partner betreuen»** → Toast «Du betreust jetzt <Name> bis <Datum>.»
  - von mir betreut: «✓ Von dir betreut bis <Datum>» + Textlink «Texte».
  - von anderem Partner betreut: Hinweis «Ein BoulderMate-Partner ist mit dieser Halle schon im Gespräch.» (für alle angemeldeten sichtbar, ohne Namen).
  - 5 Betreuungen erreicht: Hinweis «Du betreust schon 5 Hallen. Gib eine frei, um eine neue zu übernehmen.»
- Nicht-Partner sehen ausser dem «schon im Gespräch»-Hinweis nichts Neues.

### F4 · Partner-Kit «Texte für <Halle>»
- Blatt mit drei Texten in der App-Sprache, jeweils «Kopieren» und (wo möglich) «Teilen»:
  1. **E-Mail** (Betreff + Text, «Liebe Hallenleitung …»), Knopf «E-Mail öffnen», wenn das Verzeichnis eine Hallen-Adresse hat.
  2. **Kurze Nachricht** (locker, «Hoi zusammen …», für WhatsApp/DM).
  3. **Gesprächsleitfaden** (5 Punkte: nach der Hallenleitung fragen · offen sagen, dass du Partner bist · Demo zeigen · Wunsch-Zahl nennen · Kontakt übergeben, nicht verhandeln).
- **Jeder Text enthält fest den Offenlegungs-Satz:** «Offen gesagt: Ich bin BoulderMate-Partner und bekomme eine Provision, wenn ihr mitmacht. Euch kostet das nichts extra.»
- Link im Text: `?halle=<id>&ref=<code>` (SPEC-053 F4). Wunsch-Zahl erst ab 3.
- Hinweis für Influencer: «Auf Social Media als Werbung kennzeichnen.»
- Knopf «QR an der Theke zeigen» (wie SPEC-053).

### F5 · Seite «Für Hallen» (Ergänzung zu SPEC-053 F4)
- Link nur mit Code `?ref=<code>` (ohne `halle`) öffnet die Seite ohne Hallennamen («BoulderMate für eure Halle»).
- Satz bei `ref`: «Diese Empfehlung kommt von einem BoulderMate-Partner. Er oder sie bekommt von BoulderMate eine Provision; euch kostet das nichts extra.»
- Satz «Ihr braucht eine Offerte (Gemeinde, Verein)? Schreibt uns.»
- Zweitknopf **«Ich klettere – Halle suchen»** (schliesst die Seite, öffnet «Halle wählen»).

### F6 · Plattform-Admin «Vertrieb» (Ich → Einstellungen, nur Plattform-Admin)
- Zeile «Vertrieb» mit Anzahl offener Einträge → Blatt mit allen Einträgen aus `hallen_empfehlungen` (inkl. abgelaufener Betreuungen, markiert «abgelaufen»), Partner-Rolle/Region/Anzeigename, Code.
- Je Eintrag: Status wählen, **Umsatz erstes Jahr (CHF)** eintragen, **Satz** (Vorschlag aus der Staffel: 30/40 %), → **Provision** wird angezeigt und als `betrag_chf` gespeichert. «Betreuung beenden» (löscht Eintrag in Schritt 1–2).
- Kopfzeile: «Offen zur Auszahlung: CHF …» (Summe aus Status «Bezahlt»).
- Echte Auszahlung, Gutschrift und Kommunikation macht Hans ausserhalb der App.

### F7 · Partnerbedingungen (`public/empfehlungsprogramm.html`, DE/EN)
Ersetzt die SPEC-053-Bedingungen (ein Programm). Inhalt: ab 18; Ausschluss Entscheider der Halle und BoulderMate-Mitarbeitende; eine Stufe; Provision nach 1.1 inkl. Staffel und Beispiel; Zuordnung (1. Code bei Registrierung, 2. aktive Betreuung, 3. BoulderMate entscheidet); Betreuung 60 + 60 Tage, max. 5, Missbrauch → Ausschluss/Beenden; Offenlegung Pflicht; keine Preise/Verträge durch Partner; keine Weisungen, Ziele, Gebiete; Auszahlung je Zahlung frühestens 30 Tage nach Eingang, gesammelt pro Quartal, Gutschrift, Bankdaten per E-Mail, keine Provision auf Rückerstattungen; Schenken an die Halle; Steuern CH/DE inkl. Hinweis Gewerbeanmeldung DE bei Regelmässigkeit, **keine Steuerberatung**; Änderungen mit 30 Tagen Vorlauf, laufende Betreuungen bleiben; Datenschutz-Satz. **Entwurf – vor Start rechtlich prüfen lassen.**

### F8 · Einstieg
Kein Banner, kein Push, keine neue Kachel. Einstiege: Link `?partner` (von Hans/Partnern verschickt), Abschnitt «Partner» unten in «Ich», Zeile im Hallen-Blatt (nur Partner).

## 4. Daten (Migration `supabase/migrations/20261030_spec054_vertriebspartner.sql`)

- `vertriebspartner` (user_id PK → auth.users on delete cascade, anzeigename, rolle ∈ `trainer|stammgast|influencer|hallenteam|studierend|andere`, region, akzeptiert_am, created_at). RLS: eigene lesen/anlegen/ändern/löschen; Plattform-Admin liest alle.
- `hallen_empfehlungen` erweitert: Status zusätzlich `betreut`; Spalten `betreut_bis timestamptz`, `verlaengert boolean`, `umsatz_erstes_jahr_chf numeric(10,2)`, `provision_satz numeric(4,3)`. `betrag_chf` = Provision.
- RPCs (security definer): `partner_halle_betreuen(verzeichnis_id)` (prüft Partner+Code, Halle sichtbar und nicht aktiv, keine fremde aktive Betreuung, < 5 eigene), `partner_im_gespraech(id)`, `partner_freigeben(id)`, `hallen_betreut()` (nur IDs, für anon/authenticated), `vertrieb_uebersicht()` (nur Plattform-Admin).
- «Aktiv betreut»: Status `betreut|im_gespraech` und `betreut_bis > now()`, oder Status ab `registriert`.
- Ohne Supabase (Tests, Test-Personen, Entwicklung): localStorage wie SPEC-053.

## 5. Nicht in diesem Feature
Mehrstufen-Provision, Provision nach Jahr 1, Rangliste/Ziele, Exklusivgebiete, Preisverhandlung durch Partner, Klick-Tracking, Kanal-Links/Follower-Zahlen, Zahlungen oder Bankdaten in der App, Push/Erinnerungs-Mails, Live-KI in der App, automatischer Versand von Nachrichten.

## 6. Akzeptanzkriterien
- AC-1: `?partner` öffnet ohne Login die Seite «Partner werden» mit Eine-Stufe-Kasten, Provisionskasten (30 %/40 %, Rechenbeispiel CHF 1’000 → CHF 300/400) und «Selbständig»-Kasten.
- AC-2: `provisionSatz(n)` = 0.3 für die 1. und 2. registrierte Halle, 0.4 ab der 3.; `berechneProvision(1000, 0.3)` = 300.
- AC-3: «Partner werden» geht erst nach Haken «mindestens 18»; danach hat das Konto Profil und Code; ohne Rolle oder Region bleibt der Knopf aus.
- AC-4: Partner können eine freie Verzeichnis-Halle betreuen (60 Tage), höchstens 5 gleichzeitig; eine fremd betreute Halle zeigt «Ein BoulderMate-Partner ist mit dieser Halle schon im Gespräch.» und keinen Betreuen-Knopf.
- AC-5: «Im Gespräch» verlängert die Betreuung einmal um 60 Tage; «Freigeben» macht die Halle wieder frei; abgelaufene Betreuungen zählen nicht.
- AC-6: Jeder Partner-Text (E-Mail, Nachricht, Leitfaden) enthält den Offenlegungs-Satz und den Link mit `halle=` und `ref=`.
- AC-7: Partner-Bereich zeigt Satz, Offen, Ausgezahlt, Liste «Meine Hallen» mit Wort + «Schritt n von 5» und 7 Einwände.
- AC-8: `?ref=<code>` ohne `halle` öffnet «Für Hallen» ohne Hallennamen mit Partner-Satz und Knopf «Ich klettere – Halle suchen».
- AC-9: Plattform-Admin sieht «Vertrieb», kann Status, Umsatz und Satz setzen; Provision wird berechnet; Nicht-Admins sehen die Zeile nicht.
- AC-10: «Partner beenden» löscht Profil und Code.
- AC-11: Das SPEC-053-Dankeschön nennt dieselbe Regel («30 % von dem, was die Halle im ersten Jahr an BoulderMate zahlt»).
- AC-12: Alle Texte über `t()`, Englisch vorhanden.

## 7. Tests
- Unit: `tests/spec054Vertriebspartner.test.ts` (Staffel, Provision, Betreuung, Ablauf, Verlängerung, Limit, Texte mit Offenlegung, Link, Summen, Partner anlegen/beenden), `tests/spec054PartnerUi.test.tsx` (Seite «Partner werden», Partner-Bereich, Hallen-Blatt-Zeile, Kit, Admin-Blatt).
- E2E: `tests/e2e/spec054-vertriebspartner.spec.ts` (Link `?partner`, Partner werden, Halle betreuen, Texte, `?ref=` ohne Halle).
- SPEC-053-Tests auf die neue Dankeschön-Regel angepasst.

## 8. Aufgaben für Hans (offen)
1. Migration `20261030_spec054_vertriebspartner.sql` einspielen (nach SPEC-053), z. B. über Antigravity/Gemini.
2. **Hallen-Preis festlegen** (Einführungsgebühr und Jahresgebühr) → `EINFUEHRUNGSGEBUEHR_CHF` / `HALLEN_JAHRESPREIS_CHF` in `src/lib/hallenVerzeichnis.ts` bzw. `src/lib/vertriebspartner.ts`.
3. **Rechtliches vor dem Start prüfen lassen:** Partnerbedingungen als Tippgeber-Vereinbarung (kein Handelsvertreter), Scheinselbständigkeit CH/DE, Steuern/AHV, Gutschrift-Angaben (DE ggf. Steuernummer), Anbieter-Angaben.
4. **Datenschutzerklärung** um das Partnerprogramm ergänzen (Entwurf §9).
5. Strategie `docs/vertrieb/vertriebsstrategie.md` freigeben; Claude versendet nichts ohne Freigabe.

## 9. Entwurf Datenschutzerklärung (Abschnitt Partnerprogramm)
«Wenn du Partner wirst, speichern wir Rolle, Region, optional einen Anzeigenamen, deinen Code, den Zeitpunkt deiner Zustimmung und die Hallen, die du betreust, mit Status und Provision. Zweck: Zuordnung und Abrechnung der Provision (Vertrag). Sichtbar nur für das BoulderMate-Team. Du kannst das Profil jederzeit unter «Ich» beenden; Angaben zu bereits abgerechneten Provisionen bewahren wir für die Buchhaltung 10 Jahre auf. Bankdaten fragen wir nur per E-Mail ab und speichern sie nicht in der App.»

## 10. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-30 | – | Grill-me G1–G16, alles nach Empfehlung (→ v1) | – |
| 1 | 2026-10-30 | **hoch:** Provision muss in jedem Text offen stehen; **hoch:** Steuern/Scheinselbständigkeit; mittel: «30 % von was?», 60 Tage zu kurz, allgemeiner Link, Einwände, «Reserviert» klingt nach Kauf | Offenlegungs-Satz fest; Kasten «Selbständig, ohne Pflichten»; Preis-Satz + Rechenbeispiel; Betreuung 60+60 Tage; `?ref=` ohne Halle; Einwände-Liste; «Von dir betreut», Schritt n von 5; Datenschutz-Satz; Leitfaden 5 Punkte; Staffel-Satz; Quartals-Auszahlung; Offerte-Satz (→ v2) | Rangliste (Druck, Weisungs-Anschein); Erinnerungs-Push (nervt); Bilder im Kit (Demo live besser) |
| 2 | 2026-10-30 | **hoch:** Datenschutz (Kanal-Link unnötig, Erklärung fehlt); **hoch:** Betreuung blockierbar; mittel: Einwände ergänzen, eigene Zahlen, Kletterer auf Hallen-Seite, erster Schritt | Kanal-Link gestrichen; Datenschutz-Entwurf §9 (Hans-Aufgabe); Admin kann Betreuung beenden; 7 Einwände; Zahlenleiste; «Ich klettere – Halle suchen»; Schritt-1-Zustand; Ton je Kanal; DE-Gewerbehinweis (→ v3) | Verlängern nur in den letzten 14 Tagen (nicht erklärbar) |
| 3 | 2026-10-30 | mittel: drei Knöpfe im Hallen-Blatt; «Dankeschön» vs. «Provision»; sonst niedrig | Partner-Zeile nur für Partner unter den Knöpfen; Dankeschön = gleiche Regel; «Offen» erklärt; Schenken-Satz; «Link kopieren» auf «Partner werden» (→ v4) | – |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen in Loop 3 nur Feinschliff → Status **READY**, danach umgesetzt.
