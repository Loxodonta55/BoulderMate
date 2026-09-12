# SPEC-014: Echte Benutzer-Authentifizierung, Identität & Systemische Ökosystem-Integration

## Status: APPROVED (Konzipiert via Grill-Me Methodik)

## Summary
Dieses Dokument spezifiziert die vollständige, produktionsreife Einführung von **echten Benutzerkonten** (Supabase Auth / GoTrue) in das BoulderMate-Ökosystem. Es löst die bisherige Beschränkung auf rein statische Test-Personas ab und integriert echte Identitäten nahtlos in alle bestehenden Komponenten der Applikation („Die bestehende Welt“):
- Dynamischer Kletterer- und Authentifizierungs-Header (`App.tsx`)
- Bidirektionale Profil-Synchronisation (`profileService.ts`, `user_profiles`)
- Bewahrung nativer UUIDs bei Begehungen, Bewertungen und Routenbau (`syncService.ts`)
- Dynamische Team- und Schrauber-Zuweisung via echte registrierte Profile (`GymManagement.tsx`, `gym_members`)
- Koexistenz von Entwicklungs-Personas und echten Kletterern für automatisierte Tests und QA

---

## 1. Grill-Me Kernanalyse: Systemische Fragen & Architekturentscheidungen

### Q1: Wie koexistieren echte Supabase-Benutzer mit den bestehenden Test-Personas (Boris, Hans, 6aPlus, Minimum), ohne dass Tests brechen oder Verwirrung entsteht?
- **Hintergrund**: Über 220 automatisierte Tests in Vitest sowie QA-Szenarien stützen sich auf deterministische Test-Personas (`user-boris`, `hans-kletterer`, `admin-6aplus`, etc.).
- **Lösung**: 
  1. Das kanonische Identitätsmodell `AuthUser` vereint beide Welten: Es besitzt immer `id`, `email`, `nickname`, `avatarUrl` und `isPlatformAdmin`.
  2. Die 6 Seed-Personas existieren sowohl als lokale Schnellwahl-Personas als auch als voll registrierte Accounts in Supabase `auth.users` und `public.user_profiles` (mit kanonischen UUIDs gemappt über `SUPABASE_UUID_TO_DEMO_KEY`).
  3. Im Test-Modus (`isTestEnv`) operiert das System autonom und deterministisch offline via Memory/LocalStorage, während im Produktions-Browser der echte Supabase GoTrue Auth Client aktiviert ist.

### Q2: Der UUID-Mapping-Fehler in `syncService.ts`: Warum wurden echte Nutzer bisher zu Boris gemappt und wie wird dies behoben?
- **Hintergrund**: In `syncService.ts` prüfte die Hilfsfunktion `toKnownAuthUserUuid(userId)` lediglich ein hartcodiertes Set von 6 Demo-UUIDs (`KNOWN_AUTH_USER_UUIDS`). War ein Nutzer neu registriert, stimmte seine UUID nicht mit diesen 6 überein und die Funktion fiel auf Boris' UUID zurück (`00000000-1d0e-4000-8000-e92d69136f33`).
- **Folge**: Begehungen und Bewertungen von neuen echten Nutzern wurden in Supabase fälschlicherweise Boris zugerechnet!
- **Lösung**: `toKnownAuthUserUuid` prüft nun primär, ob der übergebene Wert bereits eine standardkonforme UUID (Regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) ist. Ist dies der Fall, bleibt die echte UUID unverändert erhalten. Nur Legacy-Präfixe (`hans-kletterer`) werden gemappt.

### Q3: Bidirektionale Profil-Synchronisation: Wie fließen Nickname- und Avatar-Updates zwischen Client, LocalStorage und Supabase, ohne Race Conditions?
- **Hintergrund**: Wenn ein Nutzer seinen Kletter-Namen oder sein Avatar-Bild in `ProfileSettingsModal` ändert, muss diese Änderung sofort offline sichtbar sein und zugleich in `public.user_profiles` in Supabase persistiert werden.
- **Lösung**:
  1. **Optimistic Local Update**: Sofortige Speicherung in `STORAGE_KEY_PROFILES` (`localStorage`) und State-Aktualisierung in React.
  2. **Asynchroner Remote-Push**: Falls online und Supabase konfiguriert ist, wird `supabase.from('user_profiles').update({ nickname, avatar_url, updated_at })` asynchron ausgeführt.
  3. **Downward-Sync beim App-Start**: `syncFromSupabase()` lädt `user_profiles` herunter und führt ein intelligentes Merge mit lokalen Caches durch.

### Q4: Team- und Schrauber-Ernennung in `GymManagement.tsx`: Wie finden Hallen-Admins echte Kletterer, ohne deren E-Mail-Privatsphäre zu verletzen?
- **Hintergrund**: Bisher mussten IDs manuell eingetippt oder aus 6 Buttons gewählt werden. Ein Hallen-Admin muss echte registrierte Kletterer als Schrauber ernennen können.
- **Lösung**:
  1. In `GymManagement.tsx` wird ein Autocomplete- bzw. Suchfeld über die synchronisierten `user_profiles` bereitgestellt.
  2. Gefiltert wird nach Nickname. Die vollständige private E-Mail-Adresse wird maskiert (`l***@boulder.ch`) oder nur der Nickname angezeigt, um Datenschutz (DSGVO / revDSG) zu wahren.
  3. Die Zuweisung synchronisiert direkt in `public.gym_members` (`gym_id`, `user_id`, `role`, `appointed_by`).

### Q5: Offline-Resilienz: Was passiert, wenn ein angemeldeter Kletterer in einem Bunker oder einer Kletterhalle ohne Empfang bouldert?
- **Lösung**:
  1. Die Auth-Session wird verschlüsselt bzw. token-basiert im `localStorage` unter `bouldermate_auth_user_v1` gecacht.
  2. Beim Öffnen der App lädt `initAuthSession()` synchron den lokalen Zustand. Die App ist in unter 50ms vollständig interaktiv.
  3. Sämtliche Begehungen, Flash-Logs und Bewertungen werden lokal im Cache abgelegt und über den bewährten Queue-Mechanismus (`queueLocalAscent`, etc.) hochgeladen, sobald wieder eine Internetverbindung besteht.

### Q6: Header UX & Kletterer-Dropdown: Wie vermeidet man tote `<select>`-Zustände bei echten UUIDs?
- **Hintergrund**: Der bisherige `<select>`-Header iterierte starr über `AVAILABLE_CLIMBERS`. Wenn eine echte UUID aktiv war, fand der Browser keine `<option>` mit diesem Wert.
- **Lösung**:
  1. Der Header generiert dynamisch `selectableClimbers`: Ist eine echte Session aktiv, wird der angemeldete Nutzer prominent als erste Option mit Badge `(Du)` eingefügt.
  2. Der Login-Button zeigt für angemeldete Nutzer den echten Nickname und ein Profil-Icon an.
  3. Ein Klick darauf öffnet die Konto- und Profil-Übersicht mit Abmelde- und Verwaltungsoptionen.

---

## 2. Datenfluss- und System-Architektur

```
                    ┌─────────────────────────────────────────┐
                    │            SUPABASE AUTH                │
                    │        auth.users / GoTrue API          │
                    └────────────────────┬────────────────────┘
                                         │ Trigger: on_auth_user_created
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │          public.user_profiles           │
                    │   id (UUID) • email • nickname • avatar │
                    └────────────────────┬────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
      DOWNWARD SYNC (syncService)                 REALTIME / DIRECT MUTATION
   • Lädt user_profiles in Cache               • ProfileSettings: UPDATE user_profiles
   • Merged mit lokalen Profilen               • GymManagement: INSERT gym_members
   • Löst Nicknames für Ascents/Ratings auf    • Ascents/Ratings: Native UUIDs
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │           BOULDERMATE CLIENT            │
                    │  App.tsx • Header • ClimberSectorView   │
                    │  UserProfileView • GymManagement        │
                    └─────────────────────────────────────────┘
```

---

## 3. Akzeptanzkriterien (Acceptance Criteria)

- **AC-1 (Echte Registrierung)**: Ein Nutzer kann sich mit E-Mail, Passwort und Nickname registrieren. Ein Datensatz in `auth.users` und `public.user_profiles` wird angelegt.
- **AC-2 (Echter Login)**: Ein registrierter Nutzer kann sich mit seinen Anmeldedaten einloggen und bleibt über Seiten-Reloads hinweg angemeldet.
- **AC-3 (Header & Kletterer-Auswahl)**: Der Header zeigt den echten Nicknamen an. Das Kletterer-Dropdown enthält die aktive Benutzeridentität mit `(Du)` und gerät nicht in einen leeren/ungültigen Zustand.
- **AC-4 (UUID-Integrität)**: Begehungen und Bewertungen von echten Nutzern speichern die echte Supabase-UUID in `public.ascents` und `public.ratings` und werden niemals auf eine Demo-UUID überschrieben.
- **AC-5 (Profil-Aktualisierung)**: Ändert ein Nutzer seinen Nicknamen oder Avatar im Einstellungsdialog, wird die Änderung lokal und in `public.user_profiles` gespeichert.
- **AC-6 (Hallen-Zuweisung)**: Ein Hallen-Admin kann echte Nutzer anhand ihres Nicknamens auswählen und als Schrauber oder Hallen-Admin für die jeweilige Halle ernennen.
- **AC-7 (Offline-Fähigkeit)**: Die App startet auch ohne Netzwerk sofort mit der zuletzt aktiven Session.
- **AC-8 (Zero Regression)**: Alle bestehenden 29 Testsuiten und 228+ Tests in Vitest laufen weiterhin fehlerfrei durch.
