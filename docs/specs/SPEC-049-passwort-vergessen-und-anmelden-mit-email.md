# SPEC-049: Passwort vergessen und Anmelden mit E-Mail

## Status: DONE (v4 READY 2026-10-20, Code 2026-10-20, Supabase-Dashboard & SMTP 2026-10-22 live)

> **Owner:** Hans · **Created:** 2026-10-20 · **Baut auf:** SPEC-000, SPEC-014 (echte Anmeldung), SPEC-024 (Google), SPEC-027 (keine Test-Logins live), SPEC-039 (Englisch)
>
> **Anlass:** Hans will echte Nutzer anmelden lassen und fragte, ob Anmelden ohne Google einwandfrei funktioniert. Prüfung des Codes (Stand 31bdee0) ergab: Es gibt kein echtes «Passwort vergessen», und das Registrieren mit Bestätigungsmail täuscht eine Anmeldung vor. Hans: «Das muss in die Specs und danach mit allen Grill-me-Empfehlungen gepflegt und implementiert werden.»
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans). Drei simulierte Runden mit je 30 Personen, siehe Abschnitt 13.

---

## 1. Ziel

Wer sein Passwort oder seine Anmelde-Adresse vergessen hat, ist **in etwa zwei Minuten allein wieder drin**, auf jedem Gerät, ohne Theke und ohne dass die App verrät, wer ein Konto hat. Registrieren mit E-Mail zeigt ehrlich, wenn noch eine Bestätigung fehlt.

## 2. Ausgangslage (Code-Stand 31bdee0, 2026-10-20)

| Befund | Folge für echte Nutzer |
|---|---|
| Im Login-Fenster nur kleiner Text «Passwort vergessen? / Magic Link» (10 px). Er schickt einen **Magic Link** (`signInWithOtp`), kein Zurücksetzen. | Passwort bleibt vergessen; «Magic Link» versteht niemand; bei unbekannter Adresse legt Supabase sogar ein neues Konto an. |
| `signUpWithEmail`: Ist in Supabase «Confirm email» an, kommt keine Session. Der Code versucht ein Anmelden (scheitert) und setzt den Nutzer **trotzdem lokal als angemeldet**. | Die App sieht angemeldet aus, Speichern scheitert an der Datenbank, nach Neuladen ist man raus. |
| Registrieren mit schon vorhandener Adresse liefert bei eingeschalteter Bestätigung keinen Fehler (Supabase verschleiert) → ebenfalls Schein-Anmeldung. | Person wartet auf eine Mail, die nie kommt. |
| `signInWithPassword` macht aus «Email not confirmed» die Meldung «Ungültige Anmeldedaten». | Person mit richtigem Passwort hält ihr Passwort für falsch. |
| Abgelaufene Links (`error=access_denied&error_code=otp_expired`) werden als **«Google-Anmeldung abgebrochen»** gemeldet. | Verwirrend, kein Weg zu einem neuen Link. |
| PKCE (`flowType: 'pkce'`): Der Standard-Link in Supabase-Mails funktioniert **nur im selben Browser**, in dem er angefordert wurde. | Am PC angefordert, am Handy geöffnet → scheitert. |
| Supabase ohne eigenen SMTP-Versand verschickt nur sehr wenige Mails pro Stunde. | Bei echten Nutzern kommen Bestätigungs- und Passwort-Mails nicht an. |

## 3. Abgrenzung

- Kein Nachschlagen der Adresse per Spitzname, keine Sicherheitsfragen, keine SMS.
- Kein Zurücksetzen durch Hallenpersonal oder Hallen-Admins.
- Kein «Passwort ändern» in den Einstellungen (wer es ändern will, nutzt «Passwort vergessen?»).
- Google- und Apple-Anmeldung bleiben unverändert (SPEC-024, SPEC-040).
- Nichts im Schrauber-Studio oder in der Admin-Konsole.

## 4. Grill-me: Fragen und Entscheidungen (alle nach Empfehlung)

**F1 – Was passiert bei «Passwort vergessen?»**
✔ Echter Ablauf über Supabase: `resetPasswordForEmail` → Mail mit Link → Ansicht «Neues Passwort festlegen» (`updateUser({ password })`).

**F2 – Magic Link behalten?**
✔ Nein. Der Knopf verschwindet aus dem Login-Fenster. Ein Weg statt zwei; der Passwort-Link meldet ohnehin an. (`signInWithOtp` bleibt im Code für Tests und spätere Nutzung.)

**F3 – «Benutzer / E-Mail vergessen»?**
✔ Kein Nachschlagen (würde fremde Adressen verraten). Stattdessen zugeklappte Hilfe «E-Mail-Adresse vergessen?» (Abschnitt 6.3).

**F4 – Verrät «Passwort vergessen», ob es ein Konto gibt?**
✔ Nie. Die Antwort ist immer gleich: «Wenn es ein Konto mit dieser Adresse gibt, kommt gleich eine Mail.»

**F5 – Auf welchem Gerät funktioniert der Link?**
✔ Auf jedem. Mail-Vorlagen mit `token_hash`; die App löst ihn mit `verifyOtp` ein (Abschnitt 7). Gültig 1 Stunde (Supabase-Voreinstellung). Rückfall ohne geänderte Vorlage: `?code=` im selben Browser.

**F6 – Was passiert nach dem neuen Passwort?**
✔ Man ist angemeldet, landet auf der Wand, Hinweis «Passwort geändert.». Alle **anderen** Geräte werden abgemeldet (Satz steht vor dem Speichern).

**F7 – Registrieren mit Bestätigungsmail?**
✔ Keine Schein-Anmeldung mehr. Ansicht «Fast geschafft» (Abschnitt 6.4); der Bestätigungslink meldet direkt an.

**F8 – Registrieren mit schon vorhandener Adresse?** *(Grundsatzfrage Datenschutz aus Runde 2)*
✔ Empfehlung übernommen: **beim Registrieren klar sagen** «Mit dieser Adresse gibt es schon ein Konto.» + «Anmelden» / «Passwort vergessen?». Bei «Passwort vergessen» nie. Begründung: Supabase sagt es bei ausgeschalteter Bestätigung ohnehin («User already registered»), und ohne Hinweis wartet die Person ewig.

**F9 – Passwortregeln?**
✔ Mindestens 6 Zeichen wie beim Registrieren und wie in Supabase eingestellt. Kein zweites Feld; Auge zum Anzeigen.

**F10 – Lesbarkeit und Sprache?**
✔ Wie SPEC-032: mindestens 16 px, Tippflächen ≥ 48 px, volle Breite, alles untereinander, Fehler mit Symbol. Alle Texte über `t()` mit Englisch.

## 5. Ablauf

```
Login-Fenster ─ «Passwort vergessen?» ─► Passwort vergessen (E-Mail, übernommen)
                                            │ Link senden
                                            ▼
                                   «Schau in dein Postfach» (Adresse groß, Spam, Google, Nochmal senden 60 s)
                                            │ Mail → Link (token_hash, jedes Gerät, 1 h)
                                            ▼
                     App: «Link wird geprüft …» → angemeldet → «Neues Passwort festlegen» (Für: name@…)
                                            │ Speichern
                                            ▼
                         Andere Geräte abgemeldet → Wand + «Passwort geändert.»

Link abgelaufen / benutzt ─► Login-Fenster öffnet «Passwort vergessen» mit Meldung
```

## 6. Oberfläche

### 6.1 Login-Fenster, Tab «Anmelden»
- Unter dem Passwortfeld volle Breite, ≥ 48 px: **«Passwort vergessen?»** (`btn-forgot-password`). Der alte Text «Passwort vergessen? / Magic Link» und der Magic-Link-Kasten entfallen.
- Felder: E-Mail `autocomplete="email"`, Passwort `autocomplete="current-password"` mit Auge.
- Fehler «E-Mail oder Passwort stimmt nicht.» enthält den Knopf **«Passwort vergessen?»** (`error-forgot-password`). Die Meldung sagt nie, welches von beiden falsch ist.
- Unbestätigte Adresse: «Bitte bestätige zuerst deine E-Mail-Adresse. Wir haben dir einen Link geschickt.» + **«Bestätigungsmail nochmal senden»** (`btn-resend-confirmation`, 60-s-Sperre).

### 6.2 Ansicht «Passwort vergessen» (`forgot-password-view`)
- Überschrift «Passwort vergessen?», Satz «Wir schicken dir einen Link. Damit legst du ein neues Passwort fest.»
- E-Mail-Feld (`input-forgot-email`), übernommen aus dem Anmeldefeld, Fokus beim Öffnen.
- **«Link senden»** (`btn-forgot-submit`), Enter sendet.
- «Zurück zum Anmelden» (`btn-forgot-back`); Android-Zurück führt ebenfalls zum Anmelden.
- Zugeklappt: **«E-Mail-Adresse vergessen?»** (Abschnitt 6.3).

### 6.3 Hilfe «E-Mail-Adresse vergessen?» (`forgot-email-help`)
1. Du meldest dich mit deiner E-Mail-Adresse an, nicht mit deinem Spitznamen.
2. Such in deinen Postfächern nach einer Mail von BoulderMate.
3. Mit Google oder Apple angemeldet? Dann tippe oben auf diesen Knopf. Ein Passwort brauchst du nicht.
4. Das Hallenpersonal kann dein Passwort nicht sehen oder ändern. Kommst du nicht weiter, schreib uns (Kontakt in der Datenschutzerklärung, Link `/datenschutz.html`).

### 6.4 Bestätigungen (`check-email-view`)
- **Nach «Link senden»:** «Schau in dein Postfach.» Adresse groß. «Wenn es ein Konto mit dieser Adresse gibt, kommt gleich eine Mail von BoulderMate.» «Nichts angekommen? Schau im Spam-Ordner oder prüfe die Adresse.» «Mit Google oder Apple angemeldet? Dann nimm den Knopf oben.» Knopf **«Nochmal senden»** (60-s-Sperre, Zähler «Nochmal senden in 42 s»).
- **Nach Registrieren ohne Session («Fast geschafft»):** Adresse groß. «Öffne die Mail von BoulderMate und tippe auf ‹E-Mail bestätigen›. Danach bist du angemeldet.» Knöpfe «Nochmal senden» und **«Adresse falsch? Zurück»** (`btn-check-email-back`).
- Gesperrter Knopf: Text bleibt in voller Textfarbe, nur Fläche/Rand zurückgenommen.
- Meldungen `role="status"` (Erfolg) bzw. `role="alert"` (Fehler), werden vorgelesen.

### 6.5 Ansicht «Neues Passwort festlegen» (`new-password-sheet`)
- Überschrift, Zeile **«Für: name@…»**.
- Feld `input-new-password`, `autocomplete="new-password"`, Auge, Hilfezeile «Mindestens 6 Zeichen.», Fokus beim Öffnen.
- Satz «Danach wirst du auf deinen anderen Geräten abgemeldet.»
- **«Passwort speichern»** (`btn-new-password-save`), Enter speichert. «Später» schließt (man bleibt angemeldet).
- Fehler: zu kurz; gleiches Passwort wie bisher («Das ist dein bisheriges Passwort. Bitte nimm ein anderes.»); Netzwerk.
- Erfolg: Ansicht schließt, Hinweis «Passwort geändert.».

### 6.6 Auge (`PasswordField`)
`aria-label` «Passwort anzeigen» / «Passwort verbergen», `aria-pressed`, Symbol wechselt (Auge / Auge durchgestrichen), Tippfläche ≥ 48 px.

### 6.7 Texte für Fehler
| Fall | Text |
|---|---|
| Supabase-Sperre (429 / «rate limit») | Zu viele Versuche. Bitte warte ein paar Minuten. |
| Netzwerk | Keine Verbindung. Bitte nochmal versuchen. |
| Link abgelaufen / benutzt | Der Link ist abgelaufen oder wurde schon benutzt. Fordere einen neuen an. |
| Falsche Daten | E-Mail oder Passwort stimmt nicht. |
| Vorhandene Adresse beim Registrieren | Mit dieser Adresse gibt es schon ein Konto. Melde dich an oder nutze «Passwort vergessen?». |

## 7. Technik

- `authService.ts`
  - `requestPasswordReset(email)` → `resetPasswordForEmail(email, { redirectTo: <origin>/?auth=recovery })`. Fehler nur bei Sperre / Netzwerk, sonst immer Erfolg.
  - `readEmailLinkFromUrl(href)` → `{ kind: 'none' | 'verify' | 'recovery-code' | 'expired' }`. Entfernt `token_hash`, `type`, `auth` und Fehlerparameter aus der Adresse; `?code=` bleibt für den Supabase-Client.
  - `verifyEmailLink(tokenHash, type)` → `verifyOtp({ token_hash, type })`, setzt den Nutzer.
  - `updatePassword(password)` → `updateUser({ password })`, danach `signOut({ scope: 'others' })` (Fehler dort ignoriert).
  - `resendConfirmation(email)` → `resend({ type: 'signup', email })`.
  - `signUpWithEmail`: Ohne Session → `EmailConfirmationRequiredError` (kein lokaler Nutzer). `identities: []` oder «already registered» → Fehler «schon ein Konto» (`code: 'account_exists'`). `emailRedirectTo: <origin>`.
  - `signInWithPassword`: «Email not confirmed» → `EmailNotConfirmedError`; sonst «E-Mail oder Passwort stimmt nicht.» (`code: 'invalid_credentials'`).
  - Supabase-Zugriff über `liveAuthClient()`; Unit-Tests setzen mit `setAuthClientForTests()` einen Ersatz.
- `App.tsx`: liest den Mail-Link beim Start **vor** der OAuth-Auswertung; «Link wird geprüft …»; öffnet «Neues Passwort» nach `type=recovery` oder `?auth=recovery&code=`; abgelaufener Link → Login-Fenster in «Passwort vergessen» mit Meldung.
- Neue Komponenten unter `src/components/auth/`: `PasswordField.tsx`, `ForgotPasswordPanel.tsx`, `CheckEmailPanel.tsx`, `NewPasswordSheet.tsx`, `useCooldown.ts`.
- Englisch: `src/lib/i18n/en-auth.ts`.

## 8. Datenschutz und Sicherheit

- «Passwort vergessen» verrät nie, ob ein Konto existiert (F4). Registrieren sagt es (F8, bewusst).
- Kein Nachschlagen per Spitzname; Spitznamen führen nie zu Adressen.
- Nach neuem Passwort werden alle anderen Sitzungen beendet.
- Links laufen nach 1 Stunde ab und gelten nur einmal (Supabase).

## 9. Was Hans im Supabase-Dashboard einstellt (einmalig, vor echten Nutzern)

1. **Eigener Mail-Versand (SMTP)**: Authentication → Emails → SMTP Settings. Ohne eigenen SMTP verschickt Supabase nur sehr wenige Mails pro Stunde. Anbieter z. B. Brevo, Resend oder das Postfach der Domain. Absendername **BoulderMate**, Absender z. B. `noreply@bouldermate.ch`.
2. **URL Configuration**: Site URL `https://bouldermate.ch`; Redirect URLs zusätzlich `https://bouldermate.ch/**` und `http://localhost:5173/**`.
3. **Confirm email**: an lassen (Empfehlung).
4. **Mail-Vorlage «Reset Password»** (Betreff «BoulderMate: Neues Passwort festlegen / Set a new password»):
   ```html
   <h2>Neues Passwort festlegen</h2>
   <p>Tippe auf den Knopf, um ein neues Passwort für BoulderMate festzulegen. Der Link gilt eine Stunde.</p>
   <p><a href="{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=recovery">Neues Passwort festlegen</a></p>
   <p>Du hast das nicht angefordert? Dann ignoriere diese Mail.</p>
   <hr>
   <p>Tap the button to set a new BoulderMate password. The link is valid for one hour.</p>
   <p><a href="{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=recovery">Set a new password</a></p>
   <p>Didn't ask for this? Just ignore this email.</p>
   ```
5. **Mail-Vorlage «Confirm signup»** (Betreff «BoulderMate: E-Mail bestätigen / Confirm your email»):
   ```html
   <h2>Fast geschafft</h2>
   <p>Tippe auf den Knopf, um deine E-Mail-Adresse zu bestätigen. Danach bist du bei BoulderMate angemeldet.</p>
   <p><a href="{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=email">E-Mail bestätigen</a></p>
   <hr>
   <p>Tap the button to confirm your email address. You'll be signed in to BoulderMate right away.</p>
   <p><a href="{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=email">Confirm email</a></p>
   ```
6. **Passwortlänge**: Authentication → Providers → Email → Minimum password length **6** (muss zur App passen).

Ohne Schritt 4/5 funktionieren die Links nur im selben Browser, in dem sie angefordert wurden; die App fängt das ab (Meldung «abgelaufen» + neuer Link).

## 10. Akzeptanzkriterien

- **AC-1** Im Tab «Anmelden» gibt es «Passwort vergessen?» als Tippfläche ≥ 48 px; «Magic Link» kommt im Login-Fenster nicht mehr vor.
- **AC-2** «Passwort vergessen?» öffnet die Ansicht mit der Adresse aus dem Anmeldefeld; «Zurück zum Anmelden» und Android-Zurück führen zurück.
- **AC-3** «Link senden» ruft `resetPasswordForEmail` mit `redirectTo` `<origin>/?auth=recovery` auf und zeigt danach immer dieselbe Bestätigung, egal ob es das Konto gibt.
- **AC-4** «Nochmal senden» ist 60 s gesperrt und zeigt die verbleibenden Sekunden; eine Supabase-Sperre ergibt «Zu viele Versuche …».
- **AC-5** Die Hilfe «E-Mail-Adresse vergessen?» ist zugeklappt und enthält die vier Punkte aus 6.3.
- **AC-6** `/?token_hash=…&type=recovery` meldet über `verifyOtp` an und öffnet «Neues Passwort festlegen» mit «Für: name@…»; die Adresse enthält danach kein `token_hash` mehr.
- **AC-7** `/?auth=recovery&code=…` (Rückfall) öffnet nach dem Einlösen ebenfalls «Neues Passwort festlegen».
- **AC-8** Speichern ruft `updateUser({ password })` und danach `signOut({ scope: 'others' })`, schließt die Ansicht und zeigt «Passwort geändert.»; < 6 Zeichen und gleiches Passwort ergeben verständliche Meldungen.
- **AC-9** Ein abgelaufener oder benutzter Link (`error_code=otp_expired`, im Hash oder in der Query) öffnet das Login-Fenster bei «Passwort vergessen» mit der Meldung aus 6.7; es erscheint keine Google-Meldung.
- **AC-10** Registrieren ohne Session setzt **keinen** Nutzer, zeigt «Fast geschafft» mit Adresse, «Nochmal senden» (`resend`) und «Adresse falsch? Zurück».
- **AC-11** Registrieren mit vorhandener Adresse (`identities: []` oder «already registered») zeigt «Mit dieser Adresse gibt es schon ein Konto …».
- **AC-12** `/?token_hash=…&type=email` meldet an und zeigt die Wand.
- **AC-13** Anmelden mit unbestätigter Adresse zeigt die Meldung aus 6.1 und «Bestätigungsmail nochmal senden».
- **AC-14** Falsches Passwort zeigt «E-Mail oder Passwort stimmt nicht.» mit Knopf «Passwort vergessen?».
- **AC-15** Das Auge schaltet zwischen Anzeigen und Verbergen, mit `aria-label` und `aria-pressed`.
- **AC-16** Alle neuen Texte haben einen englischen Eintrag.

## 11. Nicht Teil dieser Spec

- Passwort ändern in den Einstellungen, Konto löschen (SPEC-033), Tippfehler-Erkennung für Mail-Domains (Ideenspeicher).

## 12. Tests (CONSTITUTION §13)

- Unit: `tests/spec049PasswortVergessen.test.tsx` (authService mit Ersatz-Client: Reset, Link lesen, verifyOtp, updatePassword + andere abmelden, Registrieren ohne Session / vorhandene Adresse, unbestätigt, falsches Passwort, Sperre; Login-Fenster: Ansichten, Übernahme der Adresse, Zähler, Hilfe, Auge; Englisch).
- Playwright: `tests/e2e/passwort-vergessen.spec.ts` (Supabase-Auth-Endpunkte per `route` beantwortet: Link anfordern, Link öffnen + neues Passwort, abgelaufener Link, Registrieren mit Bestätigung, Bestätigungslink, unbestätigt anmelden, falsches Passwort, Anmelden und Abmelden).

## 13. FeatureDefinition-Verlauf

| Loop | Datum | Top-Kritik | Änderungen (→ Version) | Verworfen (Grund) |
|------|-------|------------|------------------------|-------------------|
| 1 | 2026-10-20 | Link nur im selben Browser; abgelaufener Link meldet «Google abgebrochen»; welche Adresse / mit Google angemeldet? | `token_hash`-Vorlagen, eigene Abgelaufen-Meldung mit direktem Weg, Bestätigungsansicht mit Spam/Google-Hinweis, Hilfe «E-Mail-Adresse vergessen?», andere Geräte abmelden, «Fast geschafft» mit direktem Anmelden, große Tippflächen, Passwort-Manager-Attribute (→ v2) | zweites Passwortfeld (Aufwand für motorisch Eingeschränkte), 8 Zeichen (Supabase-Einstellung, Einfachheit), Nachschlagen per Spitzname (Datenschutz), Sicherheitsfragen |
| 2 | 2026-10-20 | Vorhandene Adresse beim Registrieren: keine Mail; unbestätigt anmelden heißt «Ungültige Anmeldedaten» | «Schon ein Konto» nur beim Registrieren (Grundsatzfrage → Empfehlung), «Bestätigungsmail nochmal senden», 60-s-Sperre mit Zähler, «Passwort vergessen?» in der Fehlermeldung, Adresse übernehmen, Enter, Zurück, vorgelesene Meldungen, beschriftetes Auge, «Für: name@…», «Passwort geändert.», Netzwerktext, Hilfe zugeklappt (→ v3) | Warnung für geteilte Geräte (selten; «Für:»-Zeile reicht) |
| 3 | 2026-10-20 | keine «hoch»; gesperrter Knopf schwer lesbar, Fokus für Screenreader | Text des gesperrten Knopfs voll lesbar, Fokus ins erste Feld, Hilfezeile «Mindestens 6 Zeichen.» (→ v4, READY) | Tippfehler-Erkennung für Mail-Domains (Fehlalarme; «Adresse falsch? Zurück» reicht) |

Runden: `docs/feedback-runden/2026-10-20-passwort-vergessen/` (auch unter `/mnt/project-files/feedback-runden/2026-10-20-passwort-vergessen/`).
