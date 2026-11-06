# SPEC-025: Halle suchen – Karte aller teilnehmenden Hallen

## Status: IMPLEMENTED (v4 nach 3 FeatureDefinition-Loops am 2026-10-30: Karte auch eingeloggt überall sichtbar & erreichbar)

> **Owner:** Hans · **Created:** 2026-10-08 · **Updated:** 2026-10-30 · **Baut auf:** SPEC-001 (Hallen-Verwaltung), SPEC-020 (Design System «Kreide»), SPEC-022 (Kletterer-UX), SPEC-053 («Noch nicht dabei»)
> **Feedback-Runden (Update 2026-10-30):** `docs/feedback-runden/2026-10-30-karte-eingeloggt/` (Grill-me + 3 Runden à 30 Personen)
>
> Geplant nach der Grill-me-Methode. Hans hat F1–F8 am 2026-10-08 beantwortet. Am 2026-10-30 erweitert (F4 / AC-11 bis AC-14): Die Hallen-Karte ist auch im **eingeloggten Zustand** jederzeit klar als «Karte» erkennbar und aus jedem Bereich (Kletterer-Header, «Ich», «Einstellungen», Admin-Konsole und Schrauber-Studio) direkt erreichbar.

---

## 1. Ausgangslage (Code-Stand 2026-10-08 & 2026-10-30)

| # | Befund | Wo |
|---|---|---|
| A1 | Die Halle wird nur über ein Dropdown mit Namen gewählt. Wer die App neu hat, sieht nicht, welche Hallen es gibt und wo sie liegen. | `AppHeader` (`header-gym-select`) |
| A2 | Die Tabelle `gyms` hat `name`, `address`, `city`, `website`, `logo_url`, aber **keine Koordinaten** (kein `lat`/`lng`). | `supabase/schema.sql` §3 |
| A3 | `gyms` ist öffentlich lesbar (`Public read gyms`). Eine Karte braucht also keine neue Leserechte-Regel. | `supabase/schema.sql` |
| A4 | Es gibt **keine Kartenbibliothek** im Projekt (nur React, Supabase, lucide-react). | `package.json` |
| A5 | Es gibt kein Merkmal «macht mit». Jede Zeile in `gyms` erscheint heute im Dropdown, auch Testhallen. | `gyms` |
| A6 | **Nach Login (2026-10-30):** Eingeloggte Nutzer erkennen den Hallennamen im Header (`6a plus … ▾`) nicht als Karte; im Admin- und Schrauber-Modus war `GymFinderSheet` durch `appMode === 'climber'` komplett blockiert; unter «Ich» und «Einstellungen» fehlte oben ein direkter Karten-Einstieg. | `AppHeader`, `App.tsx`, `AdminGymSheet`, `MeView` |

---

## 2. Grill-me: Fragen und Empfehlungen

**F1 – Was heißt «Halle macht in der App mit»?**
✔ *Entschieden (Hans, 2026-10-08):* Jede eingetragene Halle erscheint auf der Karte. Es gibt **keinen** Schalter «Auf der Karte zeigen». Voraussetzung ist nur, dass Koordinaten gesetzt sind (siehe F2); ohne Koordinaten steht die Halle nur in der Liste.
*Folge:* Testhallen in Prod müssen gelöscht werden oder dürfen keine Koordinaten haben.

**F2 – Woher kommen die Koordinaten?**
✔ *Entschieden (Hans, 2026-10-08), wie empfohlen:* Im Admin-Bereich (Hallen-Stammdaten) gibt der Admin die Adresse ein. Beim Speichern sucht die App die Koordinaten einmal über den freien OpenStreetMap-Dienst (Nominatim) und zeigt eine kleine Karte mit Pin. Der Admin kann den Pin verschieben, falls er nicht genau sitzt. Gespeichert werden `gyms.lat` und `gyms.lng`.
*Warum:* Kein Admin kennt seine Koordinaten auswendig; Adressen kennt jeder. Das Verschieben fängt Fehler der Adresssuche ab.

**F3 – Welcher Kartendienst?**
✔ *Entschieden (Hans, 2026-10-08):* **Leaflet mit OpenStreetMap-Kacheln.** Kostenlos, kein API-Schlüssel, kleines Paket (~40 kB). Quellenangabe «© OpenStreetMap» unten rechts (Pflicht).
*Alternativen:* Google Maps (bekannte Optik, aber Schlüssel, Abrechnungskonto und Cookie-Hinweis nötig); MapLibre mit Vektorkacheln (schöner, aber größer und braucht einen Kachel-Anbieter).
*Hinweis Datenschutz:* Beim Laden der Kacheln sieht der Kachel-Server die IP-Adresse. Das gehört in die Datenschutzerklärung.

**F4 – Wo findet der Kletterer die Karte (insbesondere wenn bereits eingeloggt)?**
✔ *Entschieden (Hans, 2026-10-08 & Update 2026-10-30 nach 3 FeatureDefinition-Loops):*
1. **Kletterer-Header (`AppHeader`):**
   - Tippen auf den Hallennamen im Header (`header-gym-select`, mit vorangestelltem `MapPin`-Symbol, immer sichtbar auch wenn `gyms` leer ist) öffnet das Sheet **«Halle wählen»** (Karte oben + Liste unten).
   - Zusätzlich steht im Kletterer-Header ein klar erkennbarer, kompakter Knopf **«Karte»** (`header-map-btn`, `MapPin`-Icon + Text «Karte» / «Map»), der ebenfalls das Sheet «Halle wählen» öffnet.
2. **Bereich «Ich» & «Einstellungen» (`MeView`):**
   - Oben in «Ich» direkt unter dem Umschalter «Diese Halle / Alle Hallen» (`me-scope`) steht der Knopf **«Hallen-Karte»** (`me-open-gym-map`), der sofort die Hallen-Karte öffnet.
   - In «Ich → Einstellungen» (`settings-view`) gibt es eine eigene Zeile **«Hallen-Karte»** (`settings-open-gym-map`), die die Einstellungs-Unterseite schließt und die Karte öffnet.
3. **Admin-Konsole & Schrauber-Studio (`AppHeader`, `AdminGymSheet`, `App.tsx`):**
   - `GymFinderSheet` ist in **allen** App-Modi (`climber`, `admin`, `setter`) öffenbar (keine Sperre `appMode === 'climber'` mehr).
   - Im Admin-Header (`admin-map-btn`), im Admin-Hallen-Sheet (`admin-open-gym-map`: «Alle Hallen auf der Karte») und im Schrauber-Studio-Header (`studio-map-btn`) gibt es je einen direkten Knopf zur Hallen-Karte.
   - Schließt man die Karte mit `X`, bleibt man im aktuellen Modus (Admin/Studio/Ich); tippt man bei einer Halle auf **«Zur Wand»**, wechselt die App direkt in den Kletterer-Modus auf den Tab «Wand» der gewählten Halle.
4. Es kommt **kein** vierter Tab in die untere Navigationsleiste (`MobileBottomNav`).

**F5 – Dürfen Gäste (nicht angemeldet) die Karte sehen?**
✔ *Entschieden (Hans, 2026-10-08):* Ja. Zusätzlich bekommt die Landing Page einen Knopf **«Hallen ansehen»**, der dasselbe Sheet öffnet.
*Warum:* «Gibt es meine Halle schon?» ist die erste Frage eines Neulings. Die Antwort vor der Registrierung senkt die Hürde.

**F6 – Was passiert beim Tippen auf einen Pin?**
✔ *Entschieden (Hans, 2026-10-08):* Eine Karte unten zeigt: Logo, Name, Ort, Anzahl aktiver Boulder, «n neu» (letzte 7 Tage, wie SPEC-021). Zwei große Knöpfe: **«Zur Wand»** (wählt die Halle und schließt das Sheet) und **«Navigation starten»** (startet die Navigation in der Karten-App des Handys zur Halle: Google-Maps-Link `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`, auf iPhone/iPad/Mac Apple Karten `https://maps.apple.com/?daddr=<lat>,<lng>&dirflg=d`).
*Warum:* Pin → Wand in zwei Taps.

**F7 – Braucht es «In meiner Nähe»?**
✔ *Entschieden (Hans, 2026-10-08):* Ja, als Knopf mit Standort-Symbol. Erst beim Tippen fragt der Browser nach dem Standort. Danach zentriert die Karte auf den Nutzer und die Liste sortiert nach Entfernung («3,2 km»). Der Standort wird **nicht** gespeichert und nicht an Supabase gesendet. Ohne Erlaubnis bleibt alles wie vorher, mit kurzem Hinweis.
*Warum:* Nützlich auf Reisen; Standortabfrage ungefragt beim Öffnen wirkt aufdringlich.

**F8 – Braucht es eine Textsuche?**
✔ *Entschieden (Hans, 2026-10-08):* Ein Suchfeld «Halle oder Ort» über der Liste. Es filtert Liste und Pins gleichzeitig.
*Warum:* Bei wenigen Hallen genügt die Karte, aber die Suche kostet wenig und wird mit jeder neuen Halle wichtiger.

**F9 – Was zeigt die Karte beim Öffnen?**
→ *Empfehlung:* Ausschnitt so, dass alle gelisteten Hallen sichtbar sind. Die aktuell gewählte Halle hat einen hervorgehobenen Pin. Bei nur einer Halle: Zoom auf Stadt-Ebene.

**F10 – Wie groß und deutlich müssen Pins und Texte sein?**
→ *Empfehlung:* Pins mind. 44 × 44 px Tippfläche, Kreide-Akzentfarbe mit dunklem Rand, gewählte Halle größer. Hallen-Namen in der Liste mind. 17 px, Entfernung 15 px, Kontrast nach WCAG AA. Liegen Pins übereinander, fasst die Karte sie zu einem Kreis mit Zahl zusammen (erst ab ca. 20 Hallen nötig).
*Warum:* Gut lesbar auch für Menschen mit schlechteren Augen.

**F11 – Was passiert ohne Internet oder wenn die Kacheln nicht laden?**
→ *Empfehlung:* Die Liste funktioniert immer (Daten kommen aus Supabase bzw. Cache). Die Karte zeigt dann eine graue Fläche mit «Karte nicht verfügbar». Kein Fehler-Dialog.

**F12 – Wer darf Koordinaten setzen und ändern?**
→ *Empfehlung (gilt):* Hallen-Admin der eigenen Halle und Plattform-Admin (`is_platform_admin`). Kletterer und Schrauber nicht.
*Warum:* CONSTITUTION §3.3: Hallen-Stammdaten gehören in die Admin-Konsole (Feature-Isolation).

---

## 3. Datenmodell (Migration, spielt Hans im SQL-Editor ein)

```sql
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180);
```

Datei: `supabase/migrations/20261008_spec025_halle_suchen.sql` (Hans spielt sie im SQL-Editor ein; bis dahin schlägt nur das Speichern des Standorts nach Supabase still fehl, die App läuft weiter). Der Typ `Gym` (`src/types/boulder.ts`, `src/types/gym.ts`) hat `lat?` und `lng?`; `schema.sql` ist nachgezogen.

**Umsetzung (2026-10-08 & 2026-10-30):**
- `src/lib/gymFinder.ts`: Entfernung (Haversine), «3,2 km», Suche ohne Akzente, Sortierung, Navigations-Link (Apple Karten `https://maps.apple.com/?daddr=…` auf iPhone/iPad/Mac, sonst Google Maps `https://www.google.com/maps/dir/?api=1&destination=…`; ohne Koordinaten die Adresse), Adresssuche über Nominatim, Hallen-Einträge mit Boulder-Zahlen («neu» = `publishedAt` jünger als 7 Tage wie SPEC-021).
- `src/components/GymMap.tsx`: Leaflet 1.9 mit OSM-Kacheln, große Pins (44/52 px), Fallback «Karte nicht verfügbar», Admin-Modus mit verschiebbarem Pin.
- `src/components/GymFinderSheet.tsx`: Sheet «Halle wählen». «In meiner Nähe» liegt als Knopf oben rechts auf der Karte (neben dem Suchfeld war auf dem Handy zu wenig Platz). Alle Texte laufen über `t()`.
- `src/components/GymLocationEditor.tsx`: Standort-Editor für SPEC-023.
- `src/lib/gymStorage.ts`: `updateGymLocation()` (nur Hallen-Admin/Plattform-Admin) und ungefähre Startkoordinaten für die Seed-Hallen 6a plus und Minimum (`SEED_GYM_LOCATIONS`), die ein Admin per «Adresse suchen» korrigiert.
- `src/lib/syncService.ts`: liest `lat`/`lng` aus Supabase und schreibt sie beim Speichern zurück (`syncGymLocationToSupabase`).
- `AppHeader` & `AdminGymSheet` & `MeView` & `App.tsx`:
  - Kletterer-Header hat `header-gym-select` (mit `MapPin`) und `header-map-btn` («Karte»).
  - Admin-Header hat `admin-map-btn` und in `AdminGymSheet` den Knopf `admin-open-gym-map` («Alle Hallen auf der Karte»).
  - Studio-Header hat `studio-map-btn`.
  - «Ich» hat oben unter dem Hallen-Umschalter `me-open-gym-map` («Hallen-Karte») und unter «Einstellungen» die Zeile `settings-open-gym-map`.
  - Die Landing Page hat «Hallen ansehen»; Gäste landen nach «Zur Wand» in der Anmeldung, angemeldete Nutzer direkt an der Wand.
- Neue Abhängigkeiten: `leaflet`, `@types/leaflet` (nach dem Holen einmal `npm install`).

## 4. Akzeptanzkriterien

- **AC-1** Tippen auf den Hallennamen im Kletterer-Header öffnet das Sheet `gym-finder-sheet` mit Karte (`gym-finder-map`) und Liste (`gym-finder-list`).
- **AC-2** Die Liste zeigt alle eingetragenen Hallen (`gym-row-<id>`). Jede Halle mit Koordinaten hat einen Pin `gym-pin-<id>`; Hallen ohne Koordinaten stehen nur in der Liste.
- **AC-3** Die gewählte Halle ist in Pin und Zeile hervorgehoben.
- **AC-4** Tippen auf Pin oder Zeile zeigt die Hallen-Karte `gym-card-<id>` mit Name, Ort, Anzahl aktiver Boulder und «n neu»; «Zur Wand» (`gym-card-select`) setzt die aktive Halle und schließt das Sheet; «Navigation starten» (`gym-card-navigate`) öffnet den Navigations-Link zur Halle in einem neuen Tab bzw. der Karten-App.
- **AC-5** «In meiner Nähe» (`gym-finder-locate`) fragt erst beim Tippen nach dem Standort; danach ist die Liste nach Entfernung sortiert und zeigt «x,x km». Ohne Erlaubnis erscheint ein Hinweis, die Liste bleibt nach Namen sortiert.
- **AC-6** Das Suchfeld (`gym-finder-search`) filtert Liste und Pins nach Name und Ort (ohne Groß/Klein, ohne Akzente).
- **AC-7** Gäste können das Sheet öffnen; die Landing Page hat den Knopf `landing-show-gyms`.
- **AC-8** Admin-Konsole, Hallen-Stammdaten: Adresse suchen (`gym-geocode-btn`), Pin auf einer kleinen Karte verschieben (`gym-location-map`), Koordinaten speichern (`gym-location-save`). Nur Hallen-Admin und Plattform-Admin dürfen speichern. Komponente: `GymLocationEditor` (`gym-location-editor`), eingehängt im Admin-Tab «Halle» (`admin-tab-gym`, SPEC-023).
- **AC-9** Laden die Kacheln nicht, zeigt die Karte «Karte nicht verfügbar»; die Liste funktioniert weiter.
- **AC-10** Quellenangabe «© OpenStreetMap» ist sichtbar.
- **AC-11 (Eingeloggt – Header):** Im Kletterer-Header trägt `header-gym-select` ein `MapPin`-Symbol (auch sichtbar, wenn `gyms` leer ist), und zusätzlich öffnet der Knopf `header-map-btn` («Karte» / «Map») das Sheet `gym-finder-sheet`.
- **AC-12 (Eingeloggt – «Ich» & «Einstellungen»):** Oben in «Ich» unter dem Hallen-Umschalter öffnet `me-open-gym-map` («Hallen-Karte») das Sheet `gym-finder-sheet`; in «Ich → Einstellungen» öffnet `settings-open-gym-map` («Hallen-Karte») ebenfalls das Sheet.
- **AC-13 (Eingeloggt – Admin & Schrauber-Studio):** `GymFinderSheet` lässt sich auch im Admin- und Schrauber-Modus über `admin-map-btn`, `admin-open-gym-map` (im `AdminGymSheet`) und `studio-map-btn` öffnen. Schließen (`X`) behält den aktuellen Arbeitsbereich bei; «Zur Wand» (`gym-card-select`) wechselt zur gewählten Halle in die Kletterer-Wand (`appMode = 'climber'`, `activeTab = 'wall'`).
- **AC-14 (Zweisprachigkeit DE/EN):** Alle Texte in `GymFinderSheet`, `GymMap` und den neuen Karten-Einstiegen laufen über `t()` und sind auf Englisch übersetzt.

## 5. Tests (CONSTITUTION §13)

**Unit (Vitest)**
- `tests/spec025GymFinder.utils.test.ts`: Entfernung Winterthur–Zürich, Formatierung («850 m», «3,2 km», «24 km»), Suche ohne Akzente, Sortierung nach Name/Entfernung, Koordinaten-Prüfung, Navigations-Links (Google/Apple, mit/ohne Koordinaten), Nominatim (Treffer, kein Treffer, HTTP-Fehler), Seed-Koordinaten, `updateGymLocation` nur für Admins, jede Halle steht in der Liste (F1).
- `tests/spec025GymFinderSheet.test.tsx`: Sheet mit Liste und (gemockter) Karte, Pins nur mit Koordinaten, Hervorhebung, Pin → Hallen-Karte → «Zur Wand», «n neu», «In meiner Nähe» mit und ohne Erlaubnis, Suche, Landing-Knopf, `GymLocationEditor` (suchen → speichern, nicht gefunden, Kletterer dürfen nicht speichern), Ortsangabe ohne Doppelung, sowie die Einstiege für eingeloggte Nutzer (`header-map-btn`, `admin-map-btn`, `admin-open-gym-map`, `studio-map-btn`, `me-open-gym-map`, `settings-open-gym-map`) und EN-Übersetzung.

**Playwright (`tests/e2e/gym-finder.spec.ts`, Desktop und Mobile Chrome)**
- Kacheln und Nominatim werden per `route` lokal beantwortet, Supabase ist blockiert.
- Hallenname & Header-Kartenknopf (`header-map-btn`) → Sheet → 2 Pins → Pin → Hallen-Karte mit Navigations-Link → «Zur Wand» → Header zeigt Minimum.
- Eingeloggt über «Ich» (`me-open-gym-map`), «Einstellungen» (`settings-open-gym-map`), Admin (`admin-open-gym-map` / `admin-map-btn`) und Schrauber-Studio (`studio-map-btn`) Karte öffnen.
- «In meiner Nähe» mit `setGeolocation` (Winterthur) → 6a plus zuerst, km-Angabe, eigener Standort auf der Karte.
- Suche «zür» → nur Minimum, 1 Pin.
- Kacheln schlagen fehl → «Karte nicht verfügbar», Liste funktioniert.
- Gast: Landing «Hallen ansehen» → Karte → «Zur Wand» → Anmeldung.
- Admin: Adresse suchen → speichern → Navigations-Link mit neuen Koordinaten. Aktiv seit SPEC-023 (Weg: Bereich «Hallen-Administration» → Hallenname ▾ → 6a plus → Tab «Halle»).

## 6. Nicht Teil dieser Spec
- Öffnungszeiten, Eintrittspreise, Auslastung der Halle.
- Hallen selbst eintragen lassen (Registrierung neuer Hallen durch Fremde).
- Offline-Karten.

## 7. FeatureDefinition-Verlauf (Update 2026-10-30: Karte im eingeloggten Zustand)

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|---|---|---|---|---|
| 0 | 2026-10-30 | – | Grill-me G1–G7, Empfehlungen übernommen (→ v1) | – |
| 1 | 2026-10-30 | **hoch:** Hallenname im Header wird nicht als Karte erkannt; **hoch:** Karte im Admin-/Studio-Modus blockiert (`appMode === 'climber'`); mittel: unter «Ich»/«Einstellungen» versteckt, EN-Übersetzung im Karten-Sheet unvollständig | `MapPin` in `header-gym-select` + expliziter Knopf `header-map-btn` («Karte»); Sperre in `App.tsx` entfernt; `admin-open-gym-map`, `admin-map-btn`, `studio-map-btn`; `me-open-gym-map` oben in «Ich» und `settings-open-gym-map` in «Einstellungen»; `t()` für alle Texte in `GymFinderSheet`/`GymMap` (→ v2) | 4. Tab in `MobileBottomNav` (überlädt); schwebendes Banner über Wandfoto |
| 2 | 2026-10-30 | mittel: Schließen (`X`) der Karte in Admin/Studio darf Arbeitsbereich nicht verlassen; mittel: Platz auf 360–375 px im Header; niedrig: Zeilen-Details auf Englisch | Nur «Zur Wand» wechselt auf `climber`/`wall`, `X` behält Modus; kompakte Header-Abstimmung; ` · gewählt`, `Ort fehlt`, `{n} neu` auf Englisch (→ v3) | Automatisches Verlassen des Admin-Modus schon beim Öffnen der Karte |
| 3 | 2026-10-30 | niedrig: `settings-open-gym-map` soll Einstellungs-Unterseite direkt schließen | `setIsSettingsOpen(false)` beim Öffnen der Karte aus Einstellungen (→ v4 READY) | – |

**Abbruch nach Loop 3:** keine Kritik «hoch» oder «mittel» mehr → Status **READY** / **IMPLEMENTED**.
