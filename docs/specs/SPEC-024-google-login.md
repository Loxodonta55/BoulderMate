# SPEC-024: Login mit Google-Konto

## Status: IN PROGRESS (Code umgesetzt 2026-10-08, uncommitted; offen: Einrichtung durch Hans §4 und Abnahmetest §6.3)

> **Owner:** Hans · **Created:** 2026-10-08 · **Baut auf:** SPEC-000 (Auth & Rollen), SPEC-014 (echte Nutzer-Auth), SPEC-020 AC-9 (Landing & Gast-Zugang), SPEC-022 (Kletterer-UX)
>
> Ziel: Ein Kletterer tippt auf **«Mit Google fortfahren»**, bestätigt bei Google und ist danach mit einem echten Supabase-Konto in BoulderMate angemeldet, auf bouldermate.ch und lokal (`localhost:5173`).

---

## 1. Ausgangslage (Code-Stand 2026-10-08)

Es gibt bereits einen Google-Knopf, aber er funktioniert nicht als echter Login.

| # | Befund | Wo |
|---|---|---|
| G1 | Der Knopf «Mit Google» existiert zweimal im Login-Modal (Anmelden und Registrieren, beide `data-testid="btn-google-login"`). Auf der Landing-Page gibt es keinen Google-Knopf. | `src/components/LoginModal.tsx:413`, `:531`, `LandingPage.tsx` |
| G2 | `signInWithGoogle()` ruft zwar `supabase.auth.signInWithOAuth({ provider: 'google' })` auf, **legt danach aber sofort einen erfundenen Nutzer an** (`google_xxxx`, `kletterer.google@gmail.com`, Unsplash-Foto) und speichert ihn als Session. Das Modal meldet «Google-Login erfolgreich», bevor Google überhaupt gefragt wurde. | `src/lib/authService.ts:470–499`, `LoginModal.tsx:176–195` |
| G3 | Ob der Google-Provider in Supabase aktiv ist, ist unbekannt (nur Anon-Key, keine CLI). Ist er aus, landet der Nutzer nach dem Klick auf einer rohen JSON-Fehlerseite von Supabase. | Supabase-Dashboard |
| G4 | Rückkehr von Google: Der Supabase-Client nutzt den Standard-Flow `implicit` (Token im URL-Hash). `initAuthSession()` hört auf `SIGNED_IN` und baut daraus den `AuthUser`. Das Grundgerüst passt, der Hash bleibt aber sichtbar und es gibt keinen Lade- oder Fehlerzustand. | `src/lib/supabase.ts`, `authService.ts:215` |
| G5 | **Kein Profil-Datensatz für neue echte Nutzer.** Weder Trigger noch App legen eine Zeile in `user_profiles` an. Laut `schema.sql` gibt es auf `user_profiles` nur eine Lese-Policy, Updates aus `profileService` laufen also ins Leere. Das betrifft heute schon E-Mail-Registrierungen. | `supabase/schema.sql:9`, `:166`, `profileService.ts:108` |
| G6 | `mapSupabaseUserToAuthUser()` erkennt `provider: 'google'` und übernimmt `full_name`/`name` und `avatar_url` aus Google. Das kann bleiben. | `authService.ts:194` |
| G7 | Die bestehenden Unit-Tests (`spec000AuthAndPermissions`, `spec009UserFlows`) testen nur den erfundenen Mock-Nutzer aus G2, nicht den echten Ablauf. | `tests/` |
| G8 | Gast-Modus «Ohne Konto umsehen» und das Rollen-Gateway nach Login sind laut SPEC-020/022 noch offen. Google-Login ändert daran nichts, nach dem Login gilt dieselbe Logik wie bei E-Mail. | `App.tsx:115–160` |

---

## 2. User Stories

- **US-1**: Als Kletterer will ich mich mit einem Tipp über mein Google-Konto anmelden, ohne Passwort und ohne Bestätigungs-Mail.
- **US-2**: Als neuer Kletterer will ich nach dem ersten Google-Login sofort meinen Namen und mein Bild sehen und loslegen können.
- **US-3**: Als Kletterer, der sich früher mit E-Mail und Passwort registriert hat, will ich mit Google im **selben Konto** landen, wenn es dieselbe E-Mail-Adresse ist.
- **US-4**: Als Kletterer will ich eine verständliche Meldung, wenn der Google-Login abgebrochen wird oder fehlschlägt, und wieder auf der Startseite landen.
- **US-5**: Als Entwickler will ich Google-Login lokal testen können, und die Tests laufen ohne echtes Google-Konto.

---

## 3. Akzeptanzkriterien

### AC-1: Einstieg
- **AC-1.1**: Die Landing-Page zeigt **«Mit Google fortfahren»** als Hauptknopf (groß, kontrastreich, Google-«G»-Logo, mindestens 48 px hoch, gut lesbar auch für schlechtere Augen). Darunter folgt «Mit E-Mail fortfahren» (öffnet das Login-Fenster). Ist Google nicht aktiv, bleibt «Konto erstellen» der Hauptknopf.
- **AC-1.2**: Im Login-Modal gibt es den Google-Knopf **einmal** ganz oben, für Anmelden und Registrieren gemeinsam (Google unterscheidet das nicht).
- **AC-1.3**: Text des Knopfs: «Mit Google fortfahren» (Google-Branding-Richtlinie). `data-testid="btn-google-login"` bleibt.

### AC-2: Echter OAuth-Ablauf
- **AC-2.1**: Ein Tipp ruft `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` auf und leitet zu Google weiter. **Es wird vorher kein Nutzer lokal angelegt** und keine Erfolgsmeldung gezeigt (behebt G2).
- **AC-2.2**: `redirectTo` ist die aktuelle Origin (`window.location.origin`), damit Produktion und localhost jeweils zu sich selbst zurückkehren.
- **AC-2.3**: Der Supabase-Client nutzt `flowType: 'pkce'` und `detectSessionInUrl: true`. Nach der Rückkehr wird der `?code=` aus der Adresszeile entfernt (`history.replaceState`; erledigt der Supabase-Client, `finishOAuthRedirect` räumt einen liegengebliebenen Code auf), damit Neuladen oder Teilen der URL nichts kaputt macht. Folge von PKCE: Magic-Links und Bestätigungs-Mails müssen im selben Browser geöffnet werden, in dem sie angefordert wurden.
- **AC-2.4**: Während die Rückkehr verarbeitet wird, zeigt die App einen ruhigen Ladezustand («Anmeldung läuft …») statt kurz die Landing-Page.
- **AC-2.5**: Nach erfolgreichem Login gilt derselbe Ablauf wie bei E-Mail-Login (Rollenerkennung, ggf. Gateway, sonst Kletterer-Wand). Der zuletzt geöffnete Bereich wird respektiert.

### AC-3: Profil beim Erst-Login
- **AC-3.1**: Beim ersten Login wird automatisch eine Zeile in `user_profiles` angelegt: `id`, `email`, `nickname` (Google-Vorname, sonst Teil vor dem @), `avatar_url` (Google-Bild). Umsetzung per **Datenbank-Trigger** auf `auth.users` (gilt dann auch für E-Mail-Registrierungen, behebt G5).
- **AC-3.2**: RLS: Jeder Nutzer darf **seine eigene** Profilzeile ändern (`auth.uid() = id`), aber nicht `is_platform_admin`.
- **AC-3.3**: Name und Bild sind danach in den Profileinstellungen änderbar. Ein später geänderter Name wird beim nächsten Google-Login **nicht** überschrieben.
- **AC-3.4**: Ein neuer Google-Nutzer ist normaler Kletterer, ohne Admin- oder Schrauber-Rechte. Rollen vergibt weiterhin der Hallen-Admin (`gym_members`).

### AC-4: Gleiche E-Mail, ein Konto
- **AC-4.1**: Gibt es schon ein bestätigtes E-Mail-Konto mit derselben Adresse, landet der Google-Login in **diesem** Konto (Supabase verknüpft Identitäten mit bestätigter, gleicher E-Mail automatisch). Logbuch, Bewertungen und Rollen bleiben erhalten.
- **AC-4.2**: Die Demo-/Seed-Konten (`@bouldermate.ch`, `@6aplus.ch`, `@minimum.ch`) sind davon nicht betroffen.

### AC-5: Fehler und Abbruch
- **AC-5.1**: Bricht der Nutzer bei Google ab oder liefert Supabase einen Fehler (`?error=…&error_description=…`), zeigt die Landing-Page eine kurze Meldung («Google-Anmeldung abgebrochen. Bitte nochmal versuchen.») und entfernt die Fehlerparameter aus der URL.
- **AC-5.2**: Ist der Provider in Supabase nicht aktiv oder Supabase nicht erreichbar, erscheint eine verständliche Meldung statt einer JSON-Seite. Vorher wird per `GET /auth/v1/settings` (`external.google`) geprüft, ob Google aktiv ist. Der Knopf erscheint erst, wenn das bestätigt ist; ohne Antwort bleibt er ausgeblendet.
- **AC-5.3**: Abmelden beendet die Supabase-Session und die lokale Session (bestehendes `signOut()`), ohne das Google-Konto selbst abzumelden.

### AC-6: Test- und Dev-Modus
- **AC-6.1**: In Tests (`isTestEnv`) und ohne Supabase-Konfiguration bleibt ein **Mock-Login** möglich, aber getrennt vom echten Pfad (eigene Funktion, z. B. `mockGoogleSignIn()`), damit der echte Pfad nie einen erfundenen Nutzer erzeugt.
- **AC-6.2**: Die Dev-Personas auf der Landing bleiben hinter `import.meta.env.DEV` (SPEC-020 AC-9.4).

---

## 4. Was Hans selbst einrichten muss

Diese Schritte gehen nur mit Hans' Zugängen (Google-Konto, Supabase-Dashboard). Ohne sie funktioniert der echte Login nicht, die Tests laufen trotzdem.

### 4.1 Google Cloud Console (OAuth-Client)
1. Projekt anlegen oder wählen, z. B. «BoulderMate».
2. **APIs & Dienste → OAuth-Zustimmungsbildschirm** (heute «Google Auth Platform → Branding/Zielgruppe»):
   - Nutzertyp **Extern**.
   - App-Name «BoulderMate», Support-E-Mail, Startseite `https://bouldermate.ch`.
   - **Datenschutzerklärung-URL**: Die App hat heute keine Datenschutzseite. Für die Freigabe und für DSGVO/DSG wird eine gebraucht (F6: Entwurf `/datenschutz` von Claude, Text prüft Hans).
   - Autorisierte Domains: `bouldermate.ch` und `vuladpswvflfwwgdjejr.supabase.co` (nicht `supabase.co`: Google lehnt sie als öffentliche Domain ab).
   - Bereiche (Scopes): nur `openid`, `email`, `profile` (keine sensiblen Bereiche, daher keine aufwendige Prüfung).
   - Status von «Testen» auf **«In Produktion»** stellen, sonst können sich nur eingetragene Testnutzer (max. 100) anmelden.
3. **Anmeldedaten → OAuth-Client-ID erstellen**, Typ **Webanwendung**:
   - Autorisierte JavaScript-Quellen: `https://bouldermate.ch`, `http://localhost:5173`
   - Autorisierte Weiterleitungs-URI (nur diese eine): `https://vuladpswvflfwwgdjejr.supabase.co/auth/v1/callback`
4. **Client-ID und Client-Secret** kopieren. Das Secret gehört **nur** ins Supabase-Dashboard, nicht ins Repo, nicht in `.env`, nicht in Vercel.

### 4.2 Supabase-Dashboard
1. **Authentication → Sign In / Providers → Google**: aktivieren, Client-ID und Client-Secret eintragen, speichern.
2. **Authentication → URL Configuration**:
   - Site URL: `https://bouldermate.ch`
   - Redirect URLs (Allow list):
     - `https://bouldermate.ch/**`
     - `http://localhost:5173/**`
     - Vercel-Vorschauen: vorerst **nicht** eingetragen (F5). Später bei Bedarf `https://*-<vercel-team>.vercel.app/**` ergänzen.
3. **SQL-Editor**: Migration `supabase/migrations/20261008_spec024_google_login.sql` einspielen (Trigger + RLS, siehe §5.3). Wie bei SPEC-021 macht Hans das selbst.
4. Prüfen: In **Authentication → Users** erscheint nach dem ersten Test-Login ein Nutzer mit Provider «google», und in `user_profiles` die passende Zeile.

### 4.3 Vercel
- Keine neuen Umgebungsvariablen nötig: `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` reichen. Das Google-Secret gehört **nicht** nach Vercel.

### 4.4 Hinweis zur Anzeige bei Google
Google zeigt beim Login «weiter zu vuladpswvflfwwgdjejr.supabase.co». Das ist normal. Eine eigene Domain dafür (z. B. `auth.bouldermate.ch`) ist ein kostenpflichtiges Supabase-Add-on und für den Start nicht nötig.

---

## 5. Technische Umsetzung (Plan)

### 5.1 `src/lib/supabase.ts`
- `createClient(…, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } })`.

### 5.2 `src/lib/authService.ts`
- `signInWithGoogle()`: nur noch Weiterleitung starten (`signInWithOAuth`), gibt `Promise<void>` zurück. Kein lokaler Nutzer, kein Rückgabewert.
- Neue Funktion `mockGoogleSignIn(options)` für Tests/Offline (der heutige Mock-Teil).
- Neue Funktion `isGoogleLoginAvailable()`: liest `GET {SUPABASE_URL}/auth/v1/settings` (mit Anon-Key) und gibt `external.google` zurück; Ergebnis wird für die Sitzung zwischengespeichert.
- Neue Funktion `readOAuthReturnFromUrl(url)`: erkennt `?code=`, `?error=`/`error_description` und gibt `{ status: 'pending' | 'error' | 'none', message? }` zurück; entfernt die Parameter danach per `history.replaceState`. Reine Funktion, gut unit-testbar.
- `mapSupabaseUserToAuthUser()`: zusätzlich `user_metadata.picture` als Bild-Fallback; Name aus Profilzeile hat Vorrang vor Google-Name (AC-3.3).

### 5.3 Migration `supabase/migrations/20261008_spec024_google_login.sql`
- Funktion `public.handle_new_user()` (`SECURITY DEFINER`) + Trigger `on_auth_user_created AFTER INSERT ON auth.users`: legt `user_profiles` an mit `nickname = coalesce(raw_user_meta_data->>'nickname', split_part(raw_user_meta_data->>'full_name',' ',1), split_part(email,'@',1))`, `avatar_url = coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture')`; `ON CONFLICT (id) DO NOTHING`.
- Nachträglich fehlende Profile für bestehende `auth.users` anlegen (einmaliges `INSERT … SELECT … ON CONFLICT DO NOTHING`).
- Policy «Own profile update»: `FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`; `is_platform_admin` per Spalten-Rechten oder Trigger gegen Selbständerung schützen.
- `supabase/schema.sql` entsprechend nachziehen.

### 5.4 UI
- `LandingPage.tsx`: Hauptknopf «Mit Google fortfahren» (AC-1.1), Fehlermeldung aus `readOAuthReturnFromUrl` (AC-5.1).
- `LoginModal.tsx`: ein Google-Knopf oben (AC-1.2); `handleGoogleAuth` zeigt nur «Weiterleitung zu Google …», keine Erfolgsmeldung.
- `App.tsx`: Ladezustand «Anmeldung läuft …», solange ein `?code=` verarbeitet wird (AC-2.4).

---

## 6. Tests (CONSTITUTION §13: Unit **und** Playwright)

Echtes Google wird in keinem Test angesprochen. Supabase wird in Unit-Tests gemockt und in Playwright per `page.route` abgefangen.

### 6.1 Unit-Tests: `tests/spec024GoogleLogin.test.tsx` (neu)
| Test | Prüft |
|---|---|
| `signInWithGoogle` ruft `signInWithOAuth` mit `provider: 'google'` und `redirectTo = window.location.origin` auf | AC-2.1, AC-2.2 |
| `signInWithGoogle` legt **keinen** lokalen Nutzer an und schreibt nichts in `boulder_auth_session_v1` | AC-2.1 (G2) |
| Fehler von `signInWithOAuth` wird als deutsche Meldung weitergegeben | AC-5.2 |
| `isGoogleLoginAvailable` liefert `true`/`false` je nach `external.google`, `false` bei Netzwerkfehler | AC-5.2 |
| `readOAuthReturnFromUrl`: `?code=…` → `pending`; `?error=access_denied` → `error` mit Text; ohne Parameter → `none`; Parameter werden aus der URL entfernt | AC-2.3, AC-5.1 |
| `mapSupabaseUserToAuthUser` mit Google-Metadaten: `provider: 'google'`, Name aus `full_name`, Bild aus `avatar_url` bzw. `picture`; Profil-Name hat Vorrang | AC-3.1, AC-3.3 |
| Neuer Google-Nutzer ist kein Platform-Admin und hat keine Hallen-Rolle | AC-3.4 |
| `LoginModal` zeigt genau **einen** Knopf `btn-google-login`, Klick ruft `signInWithGoogle` auf und zeigt «Weiterleitung zu Google», keine Erfolgsmeldung | AC-1.2, AC-2.1 |
| `LandingPage` zeigt «Mit Google fortfahren»; ist Google nicht verfügbar, fehlt der Knopf | AC-1.1, AC-5.2 |
| `mockGoogleSignIn` erzeugt im Testmodus einen Nutzer mit `provider: 'google'` | AC-6.1 |

Bestehende Tests anpassen: `tests/spec000AuthAndPermissions.test.ts` (AC-2) und `tests/spec009UserFlows.test.ts` nutzen künftig `mockGoogleSignIn` statt `signInWithGoogle`.

### 6.2 Playwright: `tests/e2e/google-login.spec.ts` (neu)
| Test | Ablauf |
|---|---|
| Weiterleitung startet richtig | Landing öffnen → «Mit Google fortfahren» → Request auf `**/auth/v1/authorize**` abfangen; prüfen: `provider=google`, `redirect_to` = Test-Origin, `code_challenge` vorhanden (PKCE). Kein Nutzer im localStorage. |
| Rückkehr mit Erfolg | `**/auth/v1/token?grant_type=pkce` und `**/auth/v1/user` mit einem Fake-Google-Nutzer beantworten, `**/rest/v1/user_profiles*` mit Profilzeile; Seite mit `?code=test` öffnen → Ladezustand → Kletterer-Wand mit Google-Namen; `code` ist aus der URL verschwunden. |
| Abbruch bei Google | Seite mit `?error=access_denied&error_description=…` öffnen → Landing mit Meldung «abgebrochen», URL ohne Fehlerparameter. |
| Provider aus | `**/auth/v1/settings` mit `external.google: false` beantworten → kein Google-Knopf, E-Mail-Login weiter da. |
| Abmelden | Nach Erfolgs-Szenario abmelden → Landing, `**/auth/v1/logout` wurde aufgerufen. |
| Große Schrift / Mobile | Projekt «Mobile Chrome»: Knopf ≥ 48 px hoch, ohne Scrollen sichtbar. |

Alle Szenarien laufen in «Desktop Chrome» und «Mobile Chrome»; «Mobile Safari» wenn auf Hans' PC verfügbar.

### 6.3 Manueller Abnahmetest (Hans, nach Einrichtung §4)
1. localhost: Login mit eigenem Google-Konto → Wand, Name und Bild stimmen.
2. Supabase: Nutzer mit Provider google und Zeile in `user_profiles` vorhanden.
3. Name in Profileinstellungen ändern, abmelden, wieder mit Google anmelden → geänderter Name bleibt.
4. bouldermate.ch: dasselbe auf dem Handy.

---

## 7. Entscheidungen (Hans, 2026-10-08: «Alles wie empfohlen»)

| # | Frage | Entscheidung |
|---|---|---|
| F1 | Soll «Mit Google fortfahren» der **Hauptknopf** auf der Landing-Page werden? | **Ja.** Am Handy in der Halle ist das der schnellste Weg. |
| F2 | E-Mail + Passwort **behalten**? | **Ja**, als zweiter Weg für Leute ohne Google-Konto. |
| F3 | Beim Erst-Login den Google-Vornamen als Kletter-Namen **direkt übernehmen** oder erst nachfragen? | **Direkt übernehmen**, später in den Einstellungen änderbar. Kein Extra-Schritt. |
| F4 | Google-Profilbild als Avatar übernehmen? | **Ja**, mit Initialen als Ersatz, falls keins da ist. |
| F5 | Sollen **Vercel-Vorschauen** Google-Login können? | **Vorerst nein.** Login läuft auf bouldermate.ch und localhost; Vorschauen später bei Bedarf per Wildcard-Redirect. |
| F6 | Wer schreibt die **Datenschutzerklärung** (Pflicht für Google-Freigabe und DSGVO/DSG)? | Ich lege eine einfache Seite `/datenschutz` als Entwurf an, Hans prüft den Text. |
| F7 | **Apple-Login** gleich mit einplanen? | **Nein, später.** Kostet 99 USD/Jahr Apple-Developer-Konto; erst Google stabil machen. |
| F8 | Profil per **Datenbank-Trigger** anlegen (Hans spielt einmal SQL ein) oder nur aus der App? | **Trigger.** Funktioniert auch für E-Mail-Registrierungen und kann nicht vergessen werden. |

---

## 8. Umsetzung (2026-10-08)

| Teil | Dateien |
|---|---|
| Supabase-Client PKCE | `src/lib/supabase.ts` |
| Auth: `signInWithGoogle` (nur Weiterleitung), `mockGoogleSignIn`, `isGoogleLoginAvailable`, `readOAuthReturnFromUrl`, `finishOAuthRedirect`, Vorname/Bild aus Google, alte Mock-Sessions (`google_…`) werden verworfen | `src/lib/authService.ts` |
| Google-Knopf + Hooks `useGoogleLoginAvailable`, `useGoogleSignIn` | `src/components/GoogleSignInButton.tsx` (neu) |
| Landing: Google-Hauptknopf, «Mit E-Mail fortfahren», Fehlermeldung, Link «Datenschutz» | `src/components/LandingPage.tsx` |
| Login-Fenster: ein Google-Knopf oben, «oder mit E-Mail» | `src/components/LoginModal.tsx` |
| Ladezustand «Anmeldung läuft …», Meldung nach Abbruch | `src/App.tsx` |
| Trigger `handle_new_user`, Nachtrag fehlender Profile, Policy «Own profile update», Spaltenrechte | `supabase/migrations/20261008_spec024_google_login.sql`, `supabase/schema.sql` |
| Datenschutz-Entwurf (F6), Platzhalter in [eckigen Klammern] füllt Hans | `public/datenschutz.html` (erreichbar unter `/datenschutz.html`) |
| Tests | `tests/spec024GoogleLogin.test.tsx` (24), `tests/e2e/google-login.spec.ts` (7 × Desktop/Mobile Chrome); angepasst: `tests/spec000AuthAndPermissions.test.ts`, `tests/spec009UserFlows.test.ts` |

Geprüft: Unit 395/395 grün; Playwright `google-login` 14/14 sowie logo-landing, redesign-kreide, climber-ux, ascents-logging, ratings-sync, sectors-routes-authoring, spec021-umschrauben, cross-device-offline-sync grün (Desktop + Mobile Chrome; Mobile Safari im Container nicht verfügbar). Die Migration lief zweimal fehlerfrei gegen ein lokales Postgres 16 mit nachgebautem `auth`-Schema: Profil für Google- und Alt-Nutzer angelegt, eigenes Profil änderbar, fremdes nicht, `is_platform_admin` und direktes Einfügen verweigert.

## 9. Definition of Done
- Alle AC erfüllt, `npm run test:all` grün (Unit + Playwright inkl. `google-login.spec.ts`).
- Migration eingespielt (Hans), Google-Provider aktiv, Redirect-URLs gesetzt.
- Manueller Abnahmetest §6.3 auf localhost und bouldermate.ch bestanden.
- SPEC-000 AC-2 verweist auf diese Spec; INDEX-Status aktualisiert.
