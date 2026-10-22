# SPEC-045: BoulderMate als App (iPhone und Android)

## Status: READY (v4, 2026-10-10)

> **Owner:** Hans · **Created:** 2026-10-10 · **Version:** v4 (nach 3 Loops «FeatureDefinition»)
> **Baut auf:** SPEC-024 (Google-Login), SPEC-026 (Feedback), SPEC-027 (Test-Konten), SPEC-028 (Treff), SPEC-029 (QR-Codes), SPEC-032 (Manifest, Offline-Warteschlange, Lesbarkeit), SPEC-033 (Sichtbarkeit, Meine Daten), SPEC-039 (Englisch), SPEC-040 (Login mit Apple)
> **Voraussetzung vor dem Einreichen:** SPEC-046 «Melden und Blockieren» (neu, eigener Loop), Datenschutzseite fertig (offen aus SPEC-024)
> **Prozess:** [Loop «FeatureDefinition»](../prozesse/feature-definition.md). Grill-me am 2026-10-10, Hans: «geh immer mit der Empfehlung». Feedback-Runden: [`docs/feedback-runden/2026-10-10-app/`](../feedback-runden/2026-10-10-app/) (simuliert, kein echtes Nutzerfeedback).

---

## 1. Ziel

BoulderMate gibt es zusätzlich zur Webseite als **App im App Store (iPhone) und im Google Play Store (Android)**. Gäste finden die App dort, wo sie Apps suchen («Such BoulderMate im Store»), starten sie mit einem Tipp, und sie funktioniert auch im Keller ohne Netz. QR-Codes an der Wand öffnen direkt die App.

Die Webseite bouldermate.ch bleibt. **App und Webseite sind derselbe Code** (Vite/React), die App ist eine dünne Hülle (Capacitor) mit wenigen Handy-Funktionen.

## 2. Ausgangslage (Stand 2026-10-10)

| # | Befund | Wo |
|---|---|---|
| A1 | Web-Manifest, App-Symbole und `apple-touch-icon` gibt es (SPEC-032). Installieren geht nur über das Browser-Menü, das kaum jemand kennt. | `public/manifest.webmanifest`, `index.html` |
| A2 | Kein Service Worker (SPEC-032 F2). Daten liegen lokal, eine Sende-Warteschlange gibt es (`boulderapp_pending_sync_v1`). Die App-Dateien selbst kommen immer aus dem Netz. | `syncService`, SPEC-032 |
| A3 | Google- und Apple-Login laufen über Supabase OAuth mit Weiterleitung im Browser. In einer eingebetteten Web-Ansicht blockiert Google diese Anmeldung. | SPEC-024, SPEC-040 |
| A4 | QR-Codes an der Wand zeigen auf `https://bouldermate.ch/…` (SPEC-029). | SPEC-029 |
| A5 | Nutzerinhalte: Beta-Kommentare, Treff-Einträge, Anzeigenamen. Melden/Blockieren ist bei der Umsetzung zu prüfen; nach heutigem Wissen fehlt es. | SPEC-003, SPEC-028 |
| A6 | Datenschutzseite steht noch als «Entwurf» (Anschrift, Auftragsverarbeiter). | `public/datenschutz.html`, SPEC-024 |
| A7 | Hans arbeitet auf einem Windows-PC, hat keinen Mac. | – |

## 3. Grill-me: Fragen und Entscheidungen (alle nach Empfehlung)

**F1 – Store-App oder ausgebaute Web-App?** ✔ **Store-App mit Capacitor-Hülle**, Webseite bleibt, derselbe Code. Kein React Native, kein Flutter.
**F2 – Plattformen?** ✔ **iPhone und Android.** Android zuerst, iPhone direkt danach.
**F3 – Inhalt gebündelt oder live von bouldermate.ch?** ✔ **Gebündelt** (`dist/` in der App). Startet ohne Netz; Apple lehnt reine «Webseite in Hülle» eher ab. Keine Live-Updates am Store vorbei.
**F4 – Handy-Funktionen in v1?** ✔ QR-Scanner, Kamera fürs Wandfoto, Teilen, Startbild, App-Symbol, Rücksprung über App-Links. **Kein Push** (später, eigene Spec, nur freiwillig).
**F5 – Login?** ✔ E-Mail wie bisher. **Apple auf dem iPhone und Google auf Android im Systemfenster** (Face ID bzw. Konto-Auswahl). Apple auf Android und Google auf dem iPhone über den System-Browser mit Rücksprung in die App (v2).
**F6 – Welche Bereiche?** ✔ **Alles** wie im Web (Kletterer, Studio, Admin). Optimiert für Kletterer am Handy.
**F7 – Store-Konten als Person oder Firma?** ✔ **Person** (Hans, 2026-10-20: «go ahead» auf die Empfehlung). Folge: bei Google Pflicht-Testphase (§10), Hans' Name als Anbieter sichtbar.
**F8 – Name und Kennung?** ✔ «BoulderMate», Kennung `ch.bouldermate.app`. Name vor dem Anlegen im Store prüfen; Ersatz «BoulderMate – Boulder-Tagebuch» (v4).
**F9 – iPhone-App ohne Mac bauen?** ✔ **Codemagic** (Cloud-Mac, Gratis-Kontingent) baut iOS und Android aus dem GitHub-Repo.
**F10 – Preis?** ✔ Kostenlos, keine Werbung, keine In-App-Käufe, kein Tracking (v3).
**F11 – Alte App-Versionen?** ✔ Mindestversion beim Start; nur dann Sperre. Sonst ruhiger Punkt am Zahnrad (v2).
**F12 – Was es nicht sein soll?** ✔ Kein zweiter Code, keine Push-Flut, kein «Bewerte uns», keine Bezahlfunktionen, keine neuen Datenarten.

## 4. Verhalten der App

### 4.1 Start und Offline
- **Startbild**: nur Logo auf der Hintergrundfarbe, hell oder dunkel nach System; verschwindet, sobald die Wand bereit ist (v4). Ziel: **Wand sichtbar in < 2 s** auf einem Mittelklasse-Handy (v3).
- **Statusleiste** hell/dunkel nach Design, Uhr immer lesbar (v3).
- Ohne Netz zeigt die App die zuletzt geladenen Daten. **Erster Start ohne Netz** ohne Daten: «Noch keine Daten. Verbinde dich einmal mit dem Netz, danach geht es auch offline.» `app-offline-empty` (v2).
- **Wandfotos der zuletzt geöffneten Halle** bleiben auf dem Gerät (nur eine Halle, wird beim Hallenwechsel ersetzt). Einstellungen zeigen «Wandfotos offline: 38 MB · Löschen» `app-photo-cache` (v3).
- Nichts läuft im Hintergrund; die Warteschlange (SPEC-032) sendet beim nächsten Öffnen (v3).

### 4.2 Links und QR-Codes (v2)
- **Universal Links (iPhone) und App Links (Android)** für `bouldermate.ch`: QR-Codes (SPEC-029), geteilte Boulder-Links und der Login-Rücksprung öffnen die **App**, wenn sie installiert ist, sonst die Webseite. Die QR-Codes in den Hallen bleiben unverändert.
- QR-Code einer **anderen Halle** wechselt in der App zu dieser Halle (v3).
- **QR-Scanner in der App** `app-scan`: Knopf ≥ 48 px in der Kopfzeile der Kletterer-Ansicht; löst automatisch aus, sobald ein Code erkannt ist; Vorlese-Text «Kamera auf den QR-Code an der Wand richten»; Ausweg **«Code eintippen»** (Kurzcode der Wand) (v3).

### 4.3 Login
- Konto von bouldermate.ch gilt in der App. Beim ersten Start einmal der Satz «Dein Konto von bouldermate.ch gilt auch hier.» (v3)
- Anmeldung bleibt erhalten (Sitzung im App-Speicher, nicht im Browser-Speicher, den Dritte löschen können) (v2).
- Anschauen ohne Konto bleibt möglich.

### 4.4 Bedienung
- **Android-Zurück** schließt zuerst Sheet oder Dialog, dann die vorherige Ansicht; auf der Startansicht «Nochmal drücken zum Beenden» (v2).
- **Sichere Ränder**: Kopf- und Tab-Leiste nie unter Kamera-Insel oder Home-Balken (v2).
- **Schriftgröße des Systems** wird übernommen (Android-Schriftgröße, iPhone-Textgröße), Zoom mit zwei Fingern erlaubt; Layout bis **200 %** ohne abgeschnittene Texte (v2/v3).
- Jeder Knopf hat einen sichtbaren oder vorlesbaren Namen (VoiceOver, TalkBack, Sprachsteuerung «Tippe Top») (v4).
- Hochformat fest. Keine Töne, keine Vibration.

### 4.5 Kamera und Teilen
- Wandfoto im Studio mit der **nativen Kamera** oder aus der Galerie; lange Seite **2400 px**, JPEG-Qualität **0,85**; ohne Netz in die Warteschlange (v2). Querformat-Fotos bleiben quer (v4).
- Beendet Android die App während der Kamera, wird das Foto beim Zurückkehren übernommen (v3).
- **Teilen** eines Boulders über das System-Teilen-Menü mit Link `bouldermate.ch/…`.
- Berechtigungen (Kamera, Fotos) werden **erst beim Tippen** abgefragt, Texte einfach: DE «Für Fotos von der Wand und zum Scannen der QR-Codes.», EN «To take photos of the wall and scan QR codes.» (v2)

### 4.6 Versionen und Updates
- `public/app-version.json` auf Vercel: `{ "minVersion": "1.0.0", "latestVersion": "1.0.0" }`.
- App-Version < `minVersion`: Vollbild «Bitte aktualisieren» mit Knopf zum Store `app-update-required` (nur wenn alte Apps sonst kaputtgehen).
- App-Version < `latestVersion`: **Punkt am Zahnrad** und Zeile in den Einstellungen «Neue Version im Store» `app-update-available`, kein Fenster (v2).
- Einstellungen zeigen «App-Version 1.0.0 (Build 12)» (v3).
- **Release-Regel**: App-Version entsteht aus demselben Commit wie die Webseite; jede App-Version hat Pin-Nummern, Farbnamen usw. wie das Web zum selben Stand (v3).

### 4.7 Einstellungen in der App (neu, nur in der App sichtbar)
Version · «Neue Version im Store» (falls vorhanden) · Wandfotos offline · **Konto löschen** (§6) · Links zu Datenschutz und Feedback (SPEC-026).

## 5. Änderungen an der Webseite
- **Store-Knöpfe** (App Store, Google Play) auf der Startseite (SPEC-011), sobald die Apps live sind.
- Schließbare Zeile im Kletterer-Bereich, nur auf Handys, nur im Browser: «BoulderMate gibt's auch als App. Hast du sie schon? Deine Daten sind dieselben.» `web-app-hint`; nach Schließen nie wieder (lokal gemerkt). **Kein Pop-up** (SPEC-032 F1).
- `public/.well-known/apple-app-site-association` und `public/.well-known/assetlinks.json`, mit passendem Content-Type in `vercel.json`.
- Flyer «QR-Codes an der Wand» neu mit beiden Store-Knöpfen; Bild «BoulderMate laden» für Hallen (v4).

## 6. Store-Pflichten, Datenschutz, Sicherheit (v2–v4)
- **Konto löschen in der App** (Apple-Pflicht): Einstellungen → «Konto löschen» → Erklärung «App löschen: nur die Daten auf diesem Handy sind weg. Konto löschen: alles weg, auch auf dem Server.» → Bestätigung durch Eintippen von **LÖSCHEN** `app-delete-account`. Technisch: Datenbank-Funktion `delete_my_account()` (security definer, löscht nur `auth.uid()` samt Begehungen, Bewertungen, Beta, Treff, Profil); Migration spielt Hans ein. Hat SPEC-033 schon eine Löschung, wird diese genutzt.
- **Datenschutzseite fertig** (Anschrift, Auftragsverarbeiter Supabase und Vercel, Abschnitt App: Kamera, Speicher, keine Weitergabe).
- **Datenschutz-Angaben** im App Store und **Datensicherheit** bei Google: E-Mail, Name, Begehungen/Bewertungen, Fotos (nur Schrauber) – an das Konto gebunden, **kein Tracking**. Claude entwirft die Antworten, Hans trägt sie ein.
- **Kein Tracking**: keine Analyse- oder Absturzdienste Dritter, keine Werbe-ID, daher kein «Erlauben, dass die App dich verfolgt?» (v3).
- **Melden und Blockieren** (SPEC-046) muss live sein, bevor eingereicht wird (Beta, Treff, Anzeigenamen) (v3).
- **Altersfreigabe**: Fragebogen ehrlich ausfüllen (Nutzerinhalte ja, Chat nein). Sichtbarkeit von Kindern regelt SPEC-033, kein zusätzlicher Dialog (v4).
- **Prüfer-Zugang**: `test-kletterer@bouldermate.ch` (SPEC-027) in einer Demo-Halle mit echten Wandfotos und ≥ 20 Bouldern (v3).

## 7. Lesbarkeit (Hans, SPEC-032)
Wie Web: Fließtext ≥ 16 px, Tap-Flächen ≥ 48 px, Kontrast ≥ 4,5 : 1, Farbe nie allein. Zusätzlich Systemschrift bis 200 % (§4.4). Store-Screenshots in großer Schrift mit Pin-Nummern und Farbnamen (v4).

## 8. Technik
- **Capacitor** (aktuelle stabile Version) im bestehenden Repo: `capacitor.config.ts`, Ordner `android/` und `ios/`. Build: `npm run build && npx cap sync`.
- Erweiterungen: `@capacitor/app` (Zurück, Links, Version, Foto-Wiederherstellung), `@capacitor/camera`, `@capacitor/share`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/preferences` (Sitzung), `@capacitor/browser` (Login-Rücksprung), `@capacitor/filesystem` (Wandfoto-Cache), `@capacitor/text-zoom` (Android-Schriftgröße), `@capacitor-mlkit/barcode-scanning` (QR), ein Social-Login-Plugin für Apple/Google im Systemfenster mit `supabase.auth.signInWithIdToken` (Auswahl bei Umsetzung prüfen).
- Eine Stelle `src/lib/platform.ts` (`isNativeApp()`, `platform()`); alle App-Sonderwege dahinter. **Web-Verhalten bleibt unverändert**, wenn `isNativeApp()` false ist.
- Mindestversionen: voraussichtlich **iOS 15+, Android 7+** (folgt aus der Capacitor-Version, bei Umsetzung festlegen). App-Größe **< 30 MB**.
- iPhone-App läuft auf iPads im iPhone-Format; Store-Text empfiehlt dort die Webseite (v4). Android-Tablets erlaubt.
- `codemagic.yaml` im Repo baut Android (AAB) und iOS (IPA → TestFlight). Signier-Schlüssel nur in Codemagic und als Sicherung bei Hans, nie im Repo.
- Store-Eintrag **Deutsch und Englisch**; App-Sprache folgt dem Handy (SPEC-039). Untertitel DE «Boulder finden, loggen, bewerten», EN «Bouldering log for your gym» (v4).

## 9. Wer macht was

### Hans (in dieser Reihenfolge)
| # | Schritt | Wartezeit |
|---|---|---|
| 1 | ✔ Grundsatzfragen beantwortet (2026-10-20): Person, kein Händler | – |
| 2 | **Google Play Console** anlegen (25 USD, Ausweis-Prüfung) | einige Tage |
| 3 | **Apple Developer Program** beitreten (99 USD/Jahr, Apple-ID mit Zwei-Faktor) | 1 Tag bis 2 Wochen |
| 4 | Datenschutzseite fertig machen (Anschrift etc.) | – |
| 5 | Migrationen einspielen: `delete_my_account`, SPEC-046 | – |
| 6 | Supabase: Rücksprung-Adressen eintragen; Google Cloud: OAuth-Clients für Android und iOS; Apple-Provider: App-Kennung ergänzen (Claude liefert die genauen Werte) | – |
| 7 | **Codemagic** mit GitHub verbinden; App-Store-Connect-Schlüssel anlegen und eintragen | – |
| 8 | `npm install` für die neuen Pakete in Antigravity (Geräte-Shell hat kein Internet) | – |
| 9 | **12 Tester** aus den Partnerhallen einladen (Liste/Google-Gruppe) | 14 Tage Test |
| 10 | Store-Texte, Screenshots, Datenschutz-Angaben prüfen und eintragen; **Einreichen** | Prüfung 1–3 Tage |

### Claude
Capacitor einrichten, Code für §4–5, Erweiterungen, `.well-known`-Dateien, Symbole und Startbilder, `codemagic.yaml`, Store-Texte DE/EN, Screenshots, Entwurf Datenschutz-Angaben, Tester-Zettel mit QR-Code, Flyer-Update, Unit- und Playwright-Tests, Geräte-Checkliste.

## 10. Fahrplan
1. **Vorarbeit:** SPEC-046 (eigener Loop), Konto löschen, Datenschutzseite.
2. **Android intern:** Grundgerüst, Hans testet auf dem eigenen Handy.
3. **iPhone:** Codemagic → TestFlight.
4. **Testphase** (v3): Android geschlossener Test mit **≥ 12 Testern über ≥ 14 Tage** (Pflicht für neue Privat-Konten), gleichzeitig TestFlight; Tester aus den Partnerhallen (Frauenfeld, München), Anleitungszettel an der Theke.
5. **Veröffentlichen:** beide Stores; danach Store-Knöpfe auf der Webseite, Flyer.

## 11. Kosten
| Posten | Kosten |
|---|---|
| Apple Developer Program | 99 USD pro Jahr (läuft es aus, verschwindet die App aus dem Store; die Webseite bleibt) |
| Google Play Console | 25 USD einmalig |
| Codemagic | Gratis-Kontingent reicht für einige Versionen pro Monat |
| Für Hallen und Gäste | **kostenlos** (steht oben im Store-Text) |

## 12. Akzeptanzkriterien
- **AC-1** `npm run build && npx cap sync` erzeugt Android- und iOS-Projekt; Web-Build und Web-Verhalten unverändert.
- **AC-2** App startet ohne Netz mit den zuletzt geladenen Daten **und Wandfotos** der letzten Halle; ohne je geladene Daten erscheint `app-offline-empty`.
- **AC-3** Ein Link `https://bouldermate.ch/…` aus QR-Code oder Teilen öffnet die App an der richtigen Wand bzw. am richtigen Boulder; Code einer anderen Halle wechselt die Halle.
- **AC-4** Der Scanner `app-scan` erkennt den Code ohne weiteres Tippen; «Code eintippen» führt zum selben Ziel.
- **AC-5** Login mit E-Mail, Google und Apple landet in der App; nach Neustart ist man weiter angemeldet.
- **AC-6** Android-Zurück schließt erst Sheet/Dialog, dann Ansicht; auf der Startansicht erst beim zweiten Druck Ende.
- **AC-7** Bei 200 % Systemschrift sind Wand, Boulder-Details, Einstellungen und Login ohne abgeschnittene Texte und ohne horizontales Scrollen bedienbar.
- **AC-8** Jeder Knopf hat einen zugänglichen Namen (automatischer Test).
- **AC-9** Wandfoto: lange Seite ≤ 2400 px; ohne Netz in der Warteschlange; nach Android-Neustart übernommen.
- **AC-10** Berechtigung Kamera wird erst beim Tippen auf Scanner/Foto abgefragt.
- **AC-11** `minVersion` größer als App-Version → `app-update-required`; nur `latestVersion` größer → Punkt am Zahnrad und `app-update-available`, kein Fenster.
- **AC-12** «Konto löschen» erst nach Eintippen von LÖSCHEN; danach ist man abgemeldet und das Konto samt Daten auf dem Server gelöscht.
- **AC-13** Keine Anfragen an Dritt-Dienste außer Supabase, Vercel und den Kartenkacheln (Netzwerk-Test).
- **AC-14** Webseite: `web-app-hint` nur auf Handys im Browser, schließbar, bleibt geschlossen; `.well-known`-Dateien liefern gültiges JSON.

## 13. Tests (CONSTITUTION §13)
- **Unit:** `tests/spec045App.test.tsx` – `platform.ts`, Link-Auswertung (`parseAppLink`), Zurück-Stapel, Versionsvergleich, Foto-Größe, Wandfoto-Cache (eine Halle), Konto-löschen-Dialog, `web-app-hint`, zugängliche Namen.
- **Playwright:** `tests/e2e/spec045-app.spec.ts` – Web unverändert, `web-app-hint`, `.well-known`-Dateien, simulierte App-Umgebung (Capacitor-Attrappe): Update-Punkt/Sperre, Einstellungen, Konto löschen, Layout bei 200 % Schrift, Offline-Leerzustand.
- **Geräte-Checkliste** `docs/app/geraete-checkliste.md` (manuell, je ein iPhone und Android vor jedem Einreichen): QR mit Kamera-App, Scanner, Login Google/Apple, Zurück, sichere Ränder, Querformat-Foto, Foto nach Neustart, Offline im Flugmodus, VoiceOver/TalkBack.

## 14. Offen und nicht Teil dieser Spec
- ✔ **F7** Person (2026-10-20).
- ✔ **EU-Händlerstatus** bei Apple: «kein Händler», solange kostenlos und ohne Einnahmen (2026-10-20, Empfehlung angenommen; Hans prüft rechtlich selbst; bei Einnahmen neu entscheiden).
- **SPEC-046 Melden und Blockieren**: eigener FeatureDefinition-Loop, Voraussetzung.
- Nicht in v1: Push, Widgets, Apple Watch, iPad-Layout, Live-Updates, Bewertungs-Aufforderung, zwei Hallen offline, Studio auf Englisch (SPEC-044 §11).

## 15. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 0 | 2026-10-10 | – | Grill-me F1–F12, alles nach Empfehlung, F7 als Grundsatzfrage an Hans (→ v1) | – |
| 1 | 2026-10-10 | **hoch:** Store-Pflichten fehlen (Konto löschen, Datenschutz); **hoch:** QR mit Kamera öffnet Webseite statt App; **hoch:** Systemschrift ignoriert; mittel: Login-Rücksprung, Android-Zurück, sichere Ränder, leerer Offline-Start, Updates | Store-Pflichten; Universal/App Links; Systemschrift + Zoom; Apple/Google im Systemfenster, Sitzung im App-Speicher; Zurück-Logik; sichere Ränder; Offline-Leerzustand; ruhiger Update-Punkt; Foto 2400 px; Store-Knöpfe und «Auch als App»; Berechtigungen beim Tippen; DE/EN; Mindestversionen (→ v2) | Push in v1 (ruhig, später freiwillig); iPad-Layout (Web reicht); Anmeldung erzwingen; «Bewerte uns»; Live-Updates (Prüfrisiko) |
| 2 | 2026-10-10 | **hoch:** Melden/Blockieren fehlt (Zulassung, Kinder); **hoch:** Google-Pflichttest 12 Tester / 14 Tage; mittel: Wandfotos offline, Checkliste Hans, Prüfer-Konto, 200 %, Tracking, hell/dunkel, zwei Symbole, Foto bei Android-Neustart | SPEC-046 als Voraussetzung; Testphase mit Partnerhallen; Wandfoto-Cache einer Halle; Checkliste mit Wartezeiten; Demo-Halle für Prüfer; 200 % + «Code eintippen»; kein Tracking; Startbild/Statusleiste nach System; «Konto gilt auch hier»; Foto-Wiederherstellung; Store-Text, Startzeit, Release-Regel (→ v3) | Installierte App erkennen und umleiten (unzuverlässig); Ein-Tipp-Loggen (anderes Feature); Widgets/Watch; Hintergrund-Abgleich (Akku) |
| 3 | 2026-10-10 | mittel: Konto löschen technisch unklar; Tests für 200 % und Sprachsteuerung benennen; Name im Store evtl. belegt; sonst niedrig | `delete_my_account()` + LÖSCHEN-Bestätigung + Erklärtext; benannte Ansichten und zugängliche Namen; Ersatzname und Untertitel; iPad-Hinweis im Store; Flyer/Schild; Screenshots; Scanner/Querformat-Tests; Startbild nur Logo (→ v4) | Zwei Hallen offline (Speicher); Studio auf Englisch (kein App-Thema); Sichtbarkeit erneut abfragen (SPEC-033 regelt) |

**Abbruch nach Loop 3:** keine Kritik «hoch» mehr, Änderungen in Loop 3 nur Präzisierung und Feinschliff → Status **READY**. Grundsatzfragen am 2026-10-20 nach Empfehlung entschieden.
