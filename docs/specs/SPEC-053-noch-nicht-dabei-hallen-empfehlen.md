# SPEC-053 · «Noch nicht dabei» – alle Hallen zeigen und Hallen empfehlen

| | |
|---|---|
| Status | **IMPLEMENTED** (Migration offen, Betrag der Einführungsgebühr offen, Rechtstexte vor Start prüfen lassen) |
| Version | v4 (nach 3 FeatureDefinition-Loops) |
| Auftraggeber | Hans |
| Datum | 2026-10-29 |
| Hängt ab von | SPEC-025 (Halle suchen), Verzeichnis-Daten aus Thread «Kletterhallen Deutschschweiz erfassen» |
| Feedback-Runden | `docs/feedback-runden/2026-10-29-nicht-registrierte-hallen/` |

## 1. Ziel

Mehr Nutzer und mehr Hallen. Kletterer finden in «Halle wählen» **alle Hallen der Deutschschweiz**, auch die, die noch nicht bei BoulderMate mitmachen (heute ist nur 6a plus aktiv). Nicht aktive Hallen sind klar als **«Noch nicht dabei»** erkennbar. Kletterer können sich BoulderMate in ihrer Halle **wünschen** und **mit ihrer Halle reden**. Wer eine Halle vermittelt, bekommt als **Dankeschön 30 % der einmaligen Einführungsgebühr**, die die Halle für die Registrierung zahlt.

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| Aktive Halle | Eintrag in `gyms` (mit Wand und Routen). |
| Verzeichnis-Halle | Eintrag in `hallen_verzeichnis` ohne `gym_id` («Noch nicht dabei»). |
| Wunsch | Ein angemeldetes Konto tippt «Ich will BoulderMate hier». |
| Empfehlungscode | Persönlicher Code `BM-XXXXXX`, nur ab 18 und nach Zustimmung zu den Teilnahmebedingungen. |
| Dankeschön | 30 % der einmaligen Einführungsgebühr (netto ohne MwSt.) für die Person, deren Code die Halle bei der Registrierung nennt. |

## 3. Funktionen

### F1 · Karte und Liste «Halle wählen»
- Verzeichnis-Hallen erscheinen auf derselben Karte und in derselben Liste wie aktive Hallen.
- Angezeigt werden nur Einträge mit Koordinaten, `ausgeblendet = false`, `pruef_status <> 'unsicher'` und ohne `gym_id`. Ein Verzeichnis-Eintrag, dessen Name+Ort einer aktiven Halle entspricht, wird nicht doppelt gezeigt.
- **Pin:** aktive Halle = voller schwarzer Kreis (wie SPEC-025), liegt immer obenauf. Verzeichnis-Halle = **weiß gefüllt, dicker gestrichelter dunkelgrauer Rand** (#4A4744), etwas kleiner, Tippfläche ≥ 44 px. Unterschied nicht nur über Farbe, auch über Form.
- **Liste:** ohne Standort zwei Abschnitte: aktive Hallen, dann Überschrift «Noch nicht bei BoulderMate» (alphabetisch). Mit Standort («In meiner Nähe») **eine** Liste nach Entfernung, gemischt; jede Verzeichnis-Halle trägt das Schild **«Noch nicht dabei»** (dunkler Text, heller Grund, Rahmen, ≥ 14 px fett).
- **Schalter «Nur aktive Hallen»** über der Liste, Stellung wird pro Gerät gemerkt (localStorage).
- Ist der Schalter an und es gibt Suchtreffer unter den Verzeichnis-Hallen: Hinweiszeile **«+ n Hallen noch nicht dabei – zeigen»** (schaltet den Filter aus).
- Fußzeile der Liste: «Bisher Deutschschweiz. Halle fehlt? Melden» (mailto an `CONTACT_EMAIL`).

### F2 · Hallen-Blatt einer Verzeichnis-Halle
- Kopf: Name, Ort, Entfernung, Schild «Noch nicht dabei».
- Kasten (≥ 17 px): **«Noch keine Routen in BoulderMate.»** und «Diese Halle ist noch nicht bei BoulderMate registriert.»
- Wunsch-Zeile: ab 3 Wünschen «**n Kletterer wünschen sich BoulderMate hier**», darunter 3 «Sei unter den Ersten».
- **Hauptknopf** (groß, Akzentfarbe): «Ich will BoulderMate hier». Nach dem Tippen: «✓ Gewünscht» (Wort + Haken) mit Textlink «zurücknehmen», Toast «Danke! Du bist Nummer n.». Gäste: «Anmelden und wünschen» (öffnet Login).
- **Zweitknopf**: «Mit der Halle reden» (öffnet F3).
- Textlinks in einer Zeile: «Website» (falls vorhanden) · «Navigation».
- Kleine Zeile: «Angaben ohne Gewähr · Fehler melden» (mailto mit Hallenname).
- Kein «Zur Wand», keine Routen, kein Treff.

### F3 · «Mit der Halle reden»
- Überschrift «Mit der Halle reden», direkt darunter der Kasten **«Dankeschön»**: «Eine Stufe, kein Schneeballsystem: Du bekommst nur etwas für die Halle, die du selbst vermittelst.» Betrag: ist `EINFUEHRUNGSGEBUEHR_CHF` gesetzt, «Dein Dankeschön: CHF X (30 %)», sonst «30 % der Einführungsgebühr (Betrag folgt)». Link «Teilnahmebedingungen» (`/empfehlungsprogramm.html`).
- 3 Tipps: «Einmal freundlich fragen reicht.» · «Am besten an die Hallenleitung, nicht ans Thekenteam.» · «Je mehr Wünsche, desto stärker das Argument.»
- **Fertiger Text** (per Du, 3 Sätze + Link), z. B.: «Hallo zusammen! Ich klettere gern bei euch und würde mich freuen, wenn ihr eure Routen in BoulderMate zeigt. 12 Kletterer wünschen sich das schon. Infos für euch: https://bouldermate.ch/?halle=…&ref=BM-…». Die Wunsch-Zahl erscheint erst ab 3.
- Knöpfe: **«Text teilen»** (Teilen-Menü des Geräts, sonst kopieren), **«Kopieren»**, **«QR an der Theke zeigen»** (Vollbild, weißer Grund, Ruhezone 4 Module, ≥ 260 px, Text «Scannen für die Hallenleitung»), «E-Mail an die Halle» wenn das Verzeichnis eine allgemeine Hallen-Adresse hat.
- **Code:** Ohne Code funktioniert alles, nur ohne Dankeschön. Kasten «Dankeschön sichern»: Haken «Ich bin mindestens 18 Jahre alt und akzeptiere die Teilnahmebedingungen» → «Code erstellen». Danach steht der Code groß und gesperrt im Blatt und im Link. Gäste: «Anmelden, um ein Dankeschön zu bekommen».
- BoulderMate schreibt die Halle nie selbst an; der Nutzer sendet.

### F4 · Seite «Für Hallen» (Link `?halle=<id>&ref=<code>`)
- Öffnet ohne Login eine Seite über der App: Hallenname, Wunsch-Zahl (ab 3), 3 Punkte, was BoulderMate kann (Routen mit Foto an der Wand · Kletterer loggen und bewerten · Schrauber sehen, wie Routen ankommen).
- Offener Satz: «Diese Empfehlung kommt von einem eurer Kletterer. Er oder sie bekommt von BoulderMate ein Dankeschön; euch kostet das nichts extra.» (nur wenn `ref` gesetzt ist)
- Kontakt: Adresse groß mit **Kopieren**, Empfehlungscode groß mit **Kopieren**, Knopf «E-Mail schreiben» (mailto mit Hallenname und Code vorausgefüllt).
- Knopf **«Demo: 6a plus Zürich»** (schließt die Seite und wählt 6a plus: angemeldet direkt die Wand, als Gast die Hallen-Karte mit 6a plus).
- Kleine Zeile: «Ihr wollt hier nicht erscheinen? Kurze Mail genügt.»
- Der Code wird 30 Tage im Gerät gemerkt (für den Fall, dass die Hallenleitung später schreibt).

### F5 · «Ich» → «Halle empfehlen»
- Abschnitt mit eigenem Code (oder Knopf «Halle auf der Karte suchen»), Liste «Gewünscht» (Hallen mit eigenem Wunsch) und «Deine Empfehlungen» mit Status *Im Gespräch → Registriert → Bezahlt → Ausgezahlt*. Status setzt nur der Plattform-Admin.
- Code löschen («Code löschen» → Rückfrage). Laufende Empfehlungen bleiben.
- Leerer Zustand: «Deine Halle ist noch nicht dabei? Wünsch sie dir auf der Karte.» + Knopf.

### F6 · Halle wird aktiv
- Hans legt die Halle in `gyms` an und setzt im Verzeichnis `gym_id`. Der graue Eintrag verschwindet, die Halle erscheint normal.
- Wer sie gewünscht hatte, sieht beim nächsten Öffnen von «Ich» einmal: «Deine Halle ist jetzt dabei: <Name>».

### F7 · Plattform-Admin
- RPC `hallen_wunsch_rangliste()` (nur Plattform-Admin): Halle, Ort, Kanton, Wünsche, E-Mail, Website – Liste für Hans' Akquise. Eigene Admin-Ansicht folgt später.
- Empfehlungen pflegt Hans in v1 im Supabase-Dashboard (Tabelle `hallen_empfehlungen`).

### F8 · Teilnahmebedingungen (`public/empfehlungsprogramm.html`)
Eigene Seite DE/EN: ab 18; ausgeschlossen sind Personen, die selbst über den Vertrag der Halle entscheiden (Inhaber, Geschäftsführung, Vorstand, zuständige Gemeinde); zählt nur der Code, den die Halle bei der Registrierung nennt (bei mehreren: der zuerst genannte, sonst entscheidet BoulderMate); 30 % der einmaligen Einführungsgebühr netto ohne MwSt., keine laufende Provision, eine Stufe; Auszahlung erst nach Zahlungseingang + 30 Tagen, per Überweisung, Gutschrift mit Name/Adresse (per E-Mail abgefragt, keine Bankdaten in der App), danach bleibt es auch bei späterer Kündigung; wahlweise als Rabatt an die Halle verschenken; Nutzer versteuert selbst (CH: Einkommen; kleine Nebeneinkünfte bis CHF 2'300/Jahr i. d. R. ohne AHV-Beiträge · DE: sonstige Einkünfte, Freigrenze 256 €/Jahr), **keine Steuerberatung**; Änderungen mit 30 Tagen Vorlauf, laufende Vermittlungen bleiben; kein Spam, keine Massenmails.

## 4. Daten (Migration `supabase/migrations/20261029_spec053_hallen_verzeichnis.sql`)

- `hallen_verzeichnis`: id, name, adresse, plz, ort, kanton, land, lat, lng, website, telefon, email, art, betreiber_typ, oeffnungszeiten, preise, quelle_urls[], pruef_status, geprueft_am, notiz, gym_id, ausgeblendet, created_at. Unique `(lower(name), plz)`. Lesen: alle, wenn nicht ausgeblendet. Schreiben: Plattform-Admin. Gefüllt vom Thread «Kletterhallen Deutschschweiz erfassen» (`supabase/seed/20261029_hallen_verzeichnis_deutschschweiz.sql`).
- `hallen_wuensche` (verzeichnis_id, user_id, created_at; PK beide; `on delete cascade` an Konto und Halle). Einfügen/Löschen nur eigene, nur bei sichtbarer Halle. Lesen nur eigene.
- `hallen_wunsch_anzahl()` (security definer, anon): Anzahl je Verzeichnis-Halle.
- `empfehlungscodes` (user_id PK, code unique, akzeptiert_am). Nur eigene lesen/anlegen/löschen. Code-Prüfung per Check `^BM-[ACDEFGHJKLMNPQRTUVWXY3479]{6}$`.
- `hallen_empfehlungen` (id, verzeichnis_id, user_id, code, status in `im_gespraech|registriert|bezahlt|ausgezahlt`, betrag_chf, notiz, created_at, updated_at). Nutzer liest eigene; schreiben nur Plattform-Admin.
- Ohne Supabase (Tests, Test-Personen, Entwicklung): lokale Beispiel-Hallen und localStorage.

### F9 · Einstieg
Über den bestehenden Knopf «Hallen ansehen» auf der Startseite und den Hallennamen im Kopf. Keine neue Kachel, kein Banner (Startseite bleibt ein Screen, SPEC-020 AC-9.1; Hans: nie nerven).

## 5. Nicht in diesem Feature (verworfen oder später)
Instagram-Bild; Italienisch/Französisch; Romandie/Tessin-Daten; Barrierefreiheit der Hallen; Klick-Zähler für geteilte Links (Datenschutz); Status «Halle hat abgelehnt»; laufende Provision; Mehrstufen-Empfehlungen; A6-PDF; Push oder Banner auf der Wand; eigene Admin-Ansicht für Empfehlungen.

## 6. Akzeptanzkriterien
- AC-1: Ohne Standort zeigt die Liste zuerst aktive Hallen, dann den Abschnitt «Noch nicht bei BoulderMate»; jede Verzeichnis-Halle hat das Schild «Noch nicht dabei».
- AC-2: Mit Standort ist die Liste eine gemeinsame Liste nach Entfernung.
- AC-3: Verzeichnis-Pins sind gestrichelt/weiß, aktive Pins voll und obenauf.
- AC-4: «Nur aktive Hallen» blendet Verzeichnis-Hallen aus, bleibt nach Neuladen erhalten, und bei Suche erscheint «+ n Hallen noch nicht dabei – zeigen».
- AC-5: Hallen-Blatt einer Verzeichnis-Halle hat keinen Knopf «Zur Wand», aber «Ich will BoulderMate hier» und «Mit der Halle reden».
- AC-6: Wunsch setzen/zurücknehmen funktioniert; Zahl erst ab 3.
- AC-7: Code erst nach Haken «mindestens 18»; Format `BM-` + 6 Zeichen ohne 0/O/1/I/B/8/S/5/2/Z; Link enthält `?halle=` und `ref=`.
- AC-8: Link `?halle=<id>&ref=<code>` öffnet ohne Login die Seite «Für Hallen» mit Hallenname, Code und Dankeschön-Satz.
- AC-9: «Ich» zeigt «Halle empfehlen» mit Code bzw. leerem Zustand und Liste «Gewünscht».
- AC-10: Ausgeblendete, unsichere, koordinatenlose und bereits aktive Verzeichnis-Einträge erscheinen nicht.
- AC-11: Alle Texte über `t()`, Englisch vorhanden.

## 7. Tests
- Unit: `tests/spec053HallenVerzeichnis.test.ts` (Filter, Dubletten, Sortierung, Code, Text, Link, Wünsche, Schalter), `tests/spec053NochNichtDabei.test.tsx` (Sheet, Blatt, Reden, Für-Hallen-Seite, Ich-Abschnitt).
- E2E: `tests/e2e/spec053-noch-nicht-dabei.spec.ts`; `tests/e2e/gym-finder.spec.ts` zählt nur noch aktive Pins.
- Stand 2026-10-29: 30 Unit-Tests und 20 E2E-Läufe (Desktop + Mobile Chrome) grün; Gesamtlauf Vitest 918/920 (die 2 roten SPEC-045-Tests prüfen android/ios-Dateien, die im Test-Container fehlten).
- Ohne Supabase (Tests, `npm run dev`) zeigt die App Beispiel-Hallen mit «(Beispiel)» im Namen; im Live-Build nur die Tabelle.

## 8. Aufgaben für Hans
1. Migration `20261029_spec053_hallen_verzeichnis.sql` im Supabase-SQL-Editor ausführen, danach die Seed-Datei aus dem Verzeichnis-Thread.
2. **Betrag der Einführungsgebühr festlegen** → `EINFUEHRUNGSGEBUEHR_CHF` in `src/lib/hallenVerzeichnis.ts`.
3. Teilnahmebedingungen vor dem Start rechtlich prüfen lassen; Anbieter-Angaben (Name/Adresse) ergänzen.
4. Optional: Postfach `hallen@bouldermate.ch` einrichten und `HALLEN_CONTACT_EMAIL` umstellen (bis dahin `CONTACT_EMAIL`).

## 9. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-29 | – | Grill-me G1–G15, alles nach Empfehlung (→ v1) | – |
| 1 | 2026-10-29 | **hoch:** Kunden bearbeiten Thekenpersonal für Geld; **hoch:** wirkt wie Schneeballsystem, Halle muss es wissen; mittel: graue Pins verdecken aktive, Hellgrau unlesbar, Nähe-Sortierung, Betrag fehlt, Link braucht Hallen-Seite, nach Wunsch passiert nichts | Tipps «einmal, an die Leitung»; «Dankeschön» statt Provision, «eine Stufe»; offener Satz auf der Hallen-Seite; Schalter «Nur aktive», aktive Pins obenauf; weiß-gestrichelte Pins; gemischte Liste mit Standort; Betrag konfigurierbar; Seite «Für Hallen»; «Du bist Nummer n»; Code zufällig/vorlesbar; Code erst ab 18; QR statt A6-PDF; Teilnahmebedingungen (→ v2) | Italienisch/Französisch, Barrierefreiheit, Instagram-Bild |
| 2 | 2026-10-29 | **hoch:** Halle darf nie als «abgelehnt» erscheinen; mittel: 4 gleich große Knöpfe, Zahl 1–2 traurig, mailto am Hallen-PC, Schalter merken | kein Status «abgelehnt», ausgeblendet = keine Wünsche; Haupt-/Zweitknopf + Textlinks; Zahl ab 3; Kopier-Knöpfe; Schalter in localStorage; «Betrag folgt»; Satz oben; QR weiß mit Rand; Du-Text; leerer Zustand; Admin-Rangliste (→ v3) | Klick-Zähler (Tracking) |
| 3 | 2026-10-29 | mittel: Suche trotz Schalter; sonst niedrig | Hinweis «+ n Hallen noch nicht dabei – zeigen»; «✓ Gewünscht»; «Demo: 6a plus Zürich»; Code löschen; eigene Bedingungen-Seite, «keine Steuerberatung» fett; Gast «Anmelden und wünschen» (→ v4) | – |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen in Loop 3 nur Feinschliff → Status **READY**, danach umgesetzt.
