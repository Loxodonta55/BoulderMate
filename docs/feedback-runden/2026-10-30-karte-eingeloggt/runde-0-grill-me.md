# Runde 0 – Grill-me (SPEC-025 / SPEC-053: Hallen-Karte auch eingeloggt sofort sichtbar & erreichbar)

> 2026-10-30 · Fragen mit klarer Empfehlung nach [docs/prozesse/feature-definition.md](../../prozesse/feature-definition.md); Empfehlungen direkt übernommen.

## Ausgangslage

Nicht eingeloggte Besucher sehen auf der Startseite sofort den prominenten Knopf **«Hallen ansehen»** mit Karten-Pin-Symbol (`MapPin`). Sobald man jedoch **eingeloggt** ist, verschwindet die Startseite:
1. Im **Kletterer-Header** steht nur der abgeschnittene Hallenname (`6a plus Kletter- & Bould… ▾`) ohne Karten-Symbol und ohne das Wort «Karte». Viele Nutzer (und Hans selbst beim Testen) erkennen nicht, dass sich dahinter die Schweiz-weite Hallen-Karte mit allen 75+ Hallen verbirgt.
2. Im **Admin-Modus** (`Hallen-Administration`) und **Schrauber-Studio** ist `GymFinderSheet` in `App.tsx` durch `open={isGymFinderOpen && appMode === 'climber'}` komplett gesperrt; das Admin-Hallen-Sheet (`AdminGymSheet`) zeigt nur die eigene verwaltete Halle ohne Zugang zur Karte.
3. Unter **«Ich»** und in den **«Einstellungen»** fehlt oben bzw. im Menü ein direkter Einstieg zur Hallen-Karte (er sitzt nur ganz unten im Abschnitt «Halle empfehlen»).

## Grill-me-Fragen & Empfehlungen

| # | Frage | Empfehlung (= Entscheidung) | Warum |
|---|---|---|---|
| G1 | **Zweck:** Welches Problem lösen wir für wen? | Eingeloggte Nutzer (Kletterer, Schrauber, Hallen-Admins, Plattform-Admins) müssen die **Hallen-Karte** jederzeit sofort als «Karte» erkennen und aus jedem Bereich öffnen können. | Wer eingeloggt ist, sucht nach «Karte» oder einem Pin-Symbol – nicht nach einem versteckten Klick auf den eigenen Hallennamen. |
| G2 | **Zielgruppe:** Wer braucht den Kartenzugang eingeloggt? | Alle eingeloggten Rollen: **Kletterer** (Halle wechseln, andere Hallen suchen/wünschen), **Schrauber** und **Admins** (Hallenverzeichnis prüfen, Nachbarhallen sehen). | Gerade Admins/Tester (wie Hans/Boris) wechseln oft zwischen Admin, Studio und Kletterer-Ansicht. |
| G3 | **Ort 1 – Kletterer-Header:** Wie wird die Karte dort unübersehbar? | 1. Der Hallen-Wähler (`header-gym-select`) bekommt vor dem Namen ein klares **`MapPin`-Symbol** und eine dezente Kapsel-Optik. 2. Zusätzlich gibt es im Header einen eigenen kompakten Knopf **«Karte»** (`header-map-btn`, Pin-Symbol + Label «Karte» ab `sm`, ≥ 44 px Tippfläche), der ebenfalls `GymFinderSheet` öffnet. Und falls `gyms` noch leer ist, bleibt der Karten-Knopf trotzdem sichtbar. | Doppelte Auffindbarkeit ohne Header-Überladung: Wer auf den Hallennamen tippt ODER nach «Karte» sucht, landet sofort auf der Karte. |
| G4 | **Ort 2 – «Ich» & «Einstellungen»:** Wo sucht man die Karte im Profil? | Oben in **«Ich»** direkt beim Umschalter «Diese Halle / Alle Hallen» ein kompakter Knopf **«Hallen-Karte»** (`me-open-gym-map`) sowie in **«Ich → Einstellungen»** eine eigene Zeile **«Hallen-Karte»** (`settings-open-gym-map`). | Wer unter «Ich» auf «Alle Hallen» schaltet oder in die Einstellungen geht, findet die Karte sofort ohne 5 Bildschirme nach unten zu scrollen. |
| G5 | **Ort 3 – Admin & Schrauber-Studio:** Wie kommt man dort zur Karte? | Sperre `appMode === 'climber'` am `GymFinderSheet` in `App.tsx` aufheben. Im **Admin-Hallen-Sheet** (`AdminGymSheet`) unten den Knopf **«Alle Hallen auf der Karte»** (`admin-open-gym-map`) ergänzen, plus kompakten Karten-Knopf im Admin- und Studio-Header (`admin-map-btn`, `studio-map-btn`). | Kein Sackgassen-Effekt mehr, wenn man als Admin oder Schrauber eingeloggt ist. |
| G6 | **Was es NICHT sein soll (Abgrenzung):** | Kein vierter Tab in der unteren Leiste (`MobileBottomNav` bleibt bei Wand / Ich / Treff), kein schwebendes Banner über dem Wandfoto, keine automatische Standortabfrage. | Hauptzweck (Boulder an der Wand finden und in 2 Taps loggen) bleibt völlig ungestört. |
| G7 | **Sprache (DE/EN):** | Alle Texte im `GymFinderSheet`, `GymMap` und an den neuen Karten-Einstiegen über `t()` zweisprachig (DE/EN, behebt zugleich Befund M2 aus dem Gesamttest). | Konsistente Zweisprachigkeit im gesamten Kletterer-Bereich (SPEC-039). |
