# App einrichten – was Hans tun muss (SPEC-045 §9)

> Der Code für die App ist fertig (Ordner `android/`, `ios/`, `codemagic.yaml`). Diese Schritte gehen nur mit **deinen** Konten.
> Reihenfolge einhalten. Wo «→ Claude» steht: den Wert in den Thread schreiben, Claude trägt ihn ein.
> Entschieden am 2026-10-20: **Konten als Person**, **kein Händler** (EU), solange die App kostenlos ist.

## A. Sofort (ohne Store-Konten)

1. **`npm install`** in Antigravity (neue Pakete: Capacitor, Schrift Inter). Danach `npm run test:all`.
2. **Migrationen einspielen**: Supabase-Dashboard → SQL Editor, nacheinander:
   - `supabase/migrations/20261020_spec045_konto_loeschen.sql`. Prüfen: Mit einem Test-Konto in «Ich → Einstellungen → Konto löschen» löschen; danach steht es in Supabase → Authentication → Users nicht mehr.
   - `supabase/migrations/20261022_spec046_melden.sql` (Melden und Ausblenden). Prüfen: `select nickname_allowed('Hakan'), nickname_allowed('4rschl0ch');` ergibt `true, false`.
3. **Supabase → Authentication → URL Configuration → Redirect URLs**: `https://bouldermate.ch/` muss drinstehen (ist vermutlich schon da). Mehr braucht die App nicht, sie kommt über dieselbe Adresse zurück.
4. **Pushen** (Branch `feat/ux-overhaul-v2` bzw. `main`), damit Vercel die neuen Dateien `/.well-known/…` und `/app-version.json` ausliefert.

## B. Google Play (Android zuerst)

5. **Play Console** anlegen: <https://play.google.com/console> → Konto **Privatperson** → 25 USD → Ausweis prüfen lassen (einige Tage).
6. **App anlegen**: Name «BoulderMate», Sprache Deutsch, App, kostenlos. Paketname kommt mit dem ersten Upload: `ch.bouldermate.app`.
7. **Signierschlüssel für den Upload** erstellen (einmal, gut aufheben!):
   In Codemagic → Teams → Code signing identities → Android keystores → **Generate keystore**, Name `bouldermate_upload`. Die Datei und das Passwort zusätzlich in deinem Passwort-Manager sichern.
8. **Play App Signing**: Play Console → App → Testen und veröffentlichen → App-Integrität → **SHA-256 des App-Signaturschlüssels** kopieren → **Claude** (kommt in `public/.well-known/assetlinks.json`, damit QR-Codes die App öffnen).
9. Später (optional): Dienstkonto für automatisches Hochladen. Bis dahin die `.aab`-Datei aus Codemagic herunterladen und in der Play Console hochladen.

## C. Apple (iPhone)

10. **Apple Developer Program**: <https://developer.apple.com/programs/enroll/> → als **Einzelperson** → 99 USD/Jahr (Apple-ID mit Zwei-Faktor; Prüfung 1 Tag bis 2 Wochen).
11. **Team-ID** (Membership details, 10 Zeichen) → **Claude** (kommt in `public/.well-known/apple-app-site-association` statt `TEAMID`).
12. **App Store Connect** → Meine Apps → **+** → Neue App: Plattform iOS, Name «BoulderMate» (falls belegt: «BoulderMate – Boulder-Tagebuch»), Sprache Deutsch, Bundle-ID `ch.bouldermate.app` (Bundle-ID vorher unter Certificates, IDs & Profiles anlegen, Häkchen bei **Associated Domains**).
13. **App-Store-Connect-API-Schlüssel**: Benutzer und Zugriff → Integrationen → Schlüssel → Rolle «App Manager» → .p8-Datei herunterladen, Issuer-ID und Key-ID notieren.
14. **EU-Händlerstatus**: App Store Connect fragt danach → «kein Händler» (bitte selbst prüfen).

## D. Codemagic (baut beide Apps ohne Mac)

15. <https://codemagic.io> → mit GitHub anmelden → Repo `BoulderMate` hinzufügen.
16. Teams → Integrations → **App Store Connect** → API-Schlüssel aus Schritt 13, Name **`bouldermate_asc`**.
17. Build starten: Workflow **«Android → Google Play»** und **«iPhone → TestFlight»**. Die Versionsnummer kommt aus `package.json` (`1.0.0`), die Build-Nummer zählt Codemagic hoch.

## E. Testphase (Pflicht bei Google für neue Privat-Konten)

18. Play Console → Testen → **Geschlossener Test** → Tester-Liste mit **mindestens 12 E-Mail-Adressen** (Partnerhallen Frauenfeld, München). Mindestens **14 Tage** testen lassen, dann «Produktionszugriff beantragen».
19. Parallel **TestFlight** → Externe Tester → dieselben Leute (iPhone).
20. Jede Testversion mit der [Geräte-Checkliste](geraete-checkliste.md) prüfen.

## F. Veröffentlichen

21. Store-Texte, Datenschutz-Angaben und Prüfer-Hinweise aus [store-eintrag.md](store-eintrag.md) eintragen.
22. Voraussetzungen erfüllt? **SPEC-046 «Person melden und ausblenden»** umgesetzt (2026-10-22, Migration aus Schritt 2 eingespielt), **Datenschutzseite fertig** (keine «Entwurf»-Hinweise mehr).
23. **Einreichen**. Nach Freigabe die Store-Adressen → **Claude** (kommen in `public/app-version.json` → `stores`; dann erscheinen die Store-Knöpfe auf der Startseite und der Hinweis «Auch als App»).

## Laufender Betrieb

- **Neue App-Version**: `version` in `package.json` hochzählen → Codemagic-Builds starten → in den Stores freigeben → `latestVersion` in `public/app-version.json` setzen (Nutzer sehen einen Punkt am Zahnrad).
- **`minVersion`** nur erhöhen, wenn alte Apps wirklich kaputtgehen (z. B. nach einer Datenbank-Änderung). Dann sehen sie «Bitte aktualisieren».
- Apple-Mitgliedschaft jährlich verlängern, sonst verschwindet die App aus dem App Store (die Webseite bleibt).
