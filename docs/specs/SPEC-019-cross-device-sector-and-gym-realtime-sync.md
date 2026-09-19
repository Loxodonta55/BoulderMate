# SPEC-019: Geräteübergreifende Echtzeit-Synchronisation für Sektoren, Hallen & Routen (Mobile <-> Desktop)

## Status: DONE

## Summary
Stellt die lückenlose, bidirektionale Synchronisation von Sektoren, Wandfotos, Routen (Bouldern), Farbskalen und Hallen zwischen Mobilgeräten und Desktop-Browsern in Echtzeit sicher. Behebt das Problem, dass auf dem Smartphone angelegte Sektoren auf dem Desktop nicht erscheinen, durch Hinzufügen von `sectors`, `boulders`, `gyms` und `grade_scales` zur Supabase-Realtime-Publication, Implementierung reaktiver Realtime-Event-Handler im Client, nahtlose Event-gesteuerte UI-Aktualisierung in allen Hallen- und Schrauberansichten (`GymManagement`, `BatchBoulderWorkflow`, `ClimberSectorView`), Resilienz-Sync bei Tab-Fokus und Sichtbarkeitswechsel (`focus`/`visibilitychange`) sowie robuster ID-Normalisierung.

---

## Kontext & Problemstellung
Beim mobilen Schrauber-Einsatz in der Boulderhalle trat folgendes kritisches Verhalten auf:
1. **Fehlende Realtime-Abonnements für Sektoren**:
   In `syncService.ts` abonnierte `startRealtimeSync()` ausschließlich Postgres-Changes auf den Tabellen `ratings` und `ascents`. Änderungen an `sectors`, `boulders`, `gyms` und `grade_scales` wurden über die Realtime-WebSocket-Verbindung ignoriert.
2. **Fehlende Tabellen in `supabase_realtime` Publication**:
   Auf Supabase-Ebene waren die Tabellen `sectors`, `gyms` und `grade_scales` nicht in der Postgres-Publication `supabase_realtime` registriert. Realtime-Broadcasts wurden von der Datenbank daher gar nicht erst emittiert.
3. **Keine Synchronisation bei Fenster-Fokus / Tab-Wechsel**:
   Wechselt ein Nutzer vom Smartphone an den PC oder wechselt den Browser-Tab, löste der `focus`- bzw. `visibilitychange`-Listener ausschließlich `syncRatingsAndAscentsQuietly()` aus, jedoch keine Prüfung auf neue Sektoren oder Boulder.
4. **Fehlende Reaktivität in der Hallen-Administration (`GymManagement.tsx`)**:
   `GymManagement.tsx` lud Sektoren einmalig per `searchGymsWithSectors` beim Mounten, hörte jedoch nicht auf `bouldermate:sectors_updated`. Selbst wenn ein Hintergrund-Sync abgeschlossen wurde, aktualisierte sich die Admin-Ansicht nicht.
5. **Strikte ID-Prüfung in `searchGymsWithSectors`**:
   `searchGymsWithSectors` filterte mit `s.gym_id === gym.id`. Wenn Sektoren mit Supabase-UUIDs (`f2b11564-...`) gespeichert wurden, während die lokale Halle als Slug (`gym-6a-plus`) geführt wurde, wurden die Sektoren verworfen.
6. **Entkopplung der Speicher-Caches (V1 vs. V2)**:
   Beim lokalen Anlegen eines Sektors (`createSector` / `createSectorsBatch`) wurde nur der V1-Cache (`boulder_sectors_v1`) befüllt, nicht aber der V2-Cache (`boulderapp_sectors_v2`), und es wurde kein Update-Event gefeuert.

---

## User Stories
- **US-1 (Schrauber & Hallen-Admin - Sofortige Sichtbarkeit auf allen Geräten)**: Als Schrauber möchte ich auf dem Handy einen Sektor anlegen und ihn ohne manuellen Seiten-Reload sofort auf dem Laptop/Desktop in der Schrauber- und Hallenansicht sehen.
- **US-2 (Hallen-Admin - Live-Reaktivität bei Sektor-Änderungen)**: Als Admin möchte ich, dass sich die Sektorübersicht in der Hallen-Administration automatisch aktualisiert, wenn neue Sektoren angelegt, sortiert oder gelöscht werden.
- **US-3 (Nahtloser Tab-Wechsel & Resilienz)**: Als Nutzer möchte ich, dass beim Aktivieren des Desktop-Tabs (Fokus) eventuelle offline oder auf anderen Geräten vorgenommene Änderungen sofort unbemerkt im Hintergrund nachgeladen werden.
- **US-4 (Lösch-Konsistenz)**: Als Admin möchte ich, dass das Löschen eines Sektors auch in der Supabase-Cloud persistiert wird und der Sektor nicht bei der nächsten Synchronisation wieder auftaucht.

---

## Acceptance Criteria

- [x] **AC-1**: **Supabase Realtime Abonnements für Sektoren & Boulder**:
  - `startRealtimeSync()` abonniert `postgres_changes` für `sectors`, `boulders`, `gyms` und `grade_scales`.
  - `handleRealtimeSectorChange` verarbeitet INSERT, UPDATE und DELETE und aktualisiert sowohl V1- als auch V2-Cache.
  - `handleRealtimeBoulderChange` verarbeitet INSERT, UPDATE und DELETE und aktualisiert lokale Boulder.
- [x] **AC-2**: **Reaktive Event-Bindung in `GymManagement`**:
  - `GymManagement.tsx` registriert Listener auf `bouldermate:sectors_updated`, `bouldermate:gyms_updated` und `bouldermate:boulders_updated` und aktualisiert seine Daten unverzüglich.
  - Beim Mounten von `GymManagement` wird im Hintergrund ein `syncFromSupabase()` angestoßen.
- [x] **AC-3**: **Robuste ID-Normalisierung in `searchGymsWithSectors`**:
  - Sektoren werden mit `normalizeGymSectorGymId(s.gym_id) === normalizeGymSectorGymId(gym.id) || s.gym_id === gym.id` gefiltert, sodass UUID- und Slug-Repräsentationen nahtlos harmonieren.
- [x] **AC-4**: **Fokus- & Sichtbarkeits-Synchronisation**:
  - Beim Ereignis `focus` oder `visibilitychange` (`document.visibilityState === 'visible'`) wird neben Ratings auch `syncFromSupabase()` im Hintergrund ausgeführt.
  - Das periodische Intervall führt neben schnellen Rating-Checks in regelmäßigen Abständen einen leisen Gesamt-Sync durch.
- [x] **AC-5**: **Lockstep Dual-Store beim lokalen Sektor-Handling**:
  - `createSector`, `createSectorsBatch`, `updateSectorWallPhoto` und `deleteSector` schreiben konsistent in V1 (`boulder_sectors_v1`) und V2 (`boulderapp_sectors_v2`) und feuern `bouldermate:sectors_updated`.
- [x] **AC-6**: **Cloud-Löschung für Sektoren (`deleteSectorFromSupabase`)**:
  - `deleteSector` delegiert an `syncBridge.deleteSector(sector_id)`, wodurch der Sektor auch in Supabase gelöscht wird.

---

## Technical Design

```
[Mobile Schrauber-App]
        │
        ▼ (createSector / Batch)
[Supabase: sectors (INSERT)]
        │
        ▼ (Postgres Realtime: supabase_realtime)
[Desktop App: startRealtimeSync]
        │
        ▼ (handleRealtimeSectorChange)
[Update: boulder_sectors_v1 & boulderapp_sectors_v2]
        │
        ▼ (dispatchEvent 'bouldermate:sectors_updated')
┌───────┴────────────────────────┬────────────────────────┐
▼                                ▼                        ▼
[GymManagement: refreshData()]   [useGymSectorData: ...]   [ClimberSectorView]
```
