# SPEC-042: Trainer-Gruppe – Jugendliche teilen ihre Tops mit Zustimmung

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-004 («Ich»), SPEC-033 (Sichtbarkeit), SPEC-037 (Verlauf)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **T** (Stefan, Jugendtrainer). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Grill-me: Fragen und Entscheidungen

**F1 – Wie entsteht eine Gruppe?**
✔ *Entschieden (Empfehlung):* In Ich → Einstellungen → **«Gruppen»** → «Gruppe gründen»: Name (≤ 40 Zeichen). Die App erzeugt einen **6-stelligen Code** (ohne verwechselbare Zeichen wie 0/O, 1/I). Wer gründet, ist Trainer der Gruppe.

**F2 – Wie tritt man bei?**
✔ *Entschieden (Empfehlung):* «Gruppe beitreten» → Code eingeben → Satz zur Zustimmung: «**[Trainer] sieht deine Tops, Flashes und Projekte der letzten 8 Wochen.** Du kannst jederzeit austreten.» → «Beitreten». Austreten jederzeit in derselben Liste.

**F3 – Was sieht der Trainer?**
✔ *Entschieden (Empfehlung):* In «Gruppen» → Gruppe: eine Zeile pro Mitglied: Name, Tops letzte 4 Wochen, bester Grad, letzter Besuch («vor 3 Tagen»). Tippen zeigt die Grad-Pyramide und den Verlauf 8 Wochen des Mitglieds (wie SPEC-037), **keine** Versuche, keine Bewertungen. Mitglieder sehen nur die Mitgliederliste ohne Zahlen.
*Warum:* Stefan will Training steuern; Versuche bleiben privat (SPEC-035 F4).

**F4 – Altersgrenze?**
✔ *Entschieden (Empfehlung):* Keine eigene Grenze in der App; Jugendliche unter 16 brauchen laut Datenschutzerklärung die Zustimmung der Eltern. Das steht im Beitritts-Satz: «Unter 16? Frag zuerst deine Eltern.»

**F5 – Grenzen?**
✔ *Entschieden (Empfehlung):* Höchstens 3 eigene Gruppen pro Trainer, 40 Mitglieder pro Gruppe. Trainer kann Mitglieder entfernen und die Gruppe auflösen.

## 2. Datenmodell (Migration spielt Hans ein)

`supabase/migrations/20261009_spec042_gruppen.sql`: `training_groups` (id, name, code UNIQUE, owner_id, created_at), `training_group_members` (group_id, user_id, nickname, joined_at). Lesen: Gruppe nur für Besitzer und Mitglieder; Mitgliederliste ebenso. Beitreten über Funktion `join_training_group(code)` (SECURITY DEFINER), damit Codes nicht durchsucht werden können. Austreten: eigene Zeile löschen; Besitzer darf alle Zeilen seiner Gruppe löschen. Ohne Supabase lokal (`boulderapp_groups_v1`).

## 3. Akzeptanzkriterien

- **AC-1** Gründen erzeugt einen 6-stelligen Code ohne 0, O, 1, I.
- **AC-2** Beitreten nur mit gültigem Code und nach Zustimmungs-Satz; doppelter Beitritt ändert nichts.
- **AC-3** Trainer sieht pro Mitglied Tops 4 Wochen, besten Grad, letzten Besuch; Detail mit Pyramide und Verlauf.
- **AC-4** Mitglieder sehen keine Zahlen anderer.
- **AC-5** Austreten/Entfernen wirkt sofort; Grenzen 3 Gruppen / 40 Mitglieder.

## 4. Tests

- Unit: `tests/spec042Gruppen.test.tsx`.
- Playwright: `tests/e2e/gruppen.spec.ts` (gründen, beitreten mit Code, Trainer sieht Mitglied mit Top).

## Umsetzung (2026-10-09)
- Umgesetzt. Migration `supabase/migrations/20261009_spec042_gruppen.sql`. Zusätzlich RPC `preview_training_group`, damit man vor dem Beitritt Name und Trainer sieht.
- Testdateien: tests/spec042Gruppen.test.tsx; tests/e2e/spec038-042-challenge-gruppen.spec.ts; RLS in tests/db/weitere_rls.sql
