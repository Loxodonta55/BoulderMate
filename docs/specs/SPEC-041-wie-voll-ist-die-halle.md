# SPEC-041: Wie voll ist die Halle? – «ruhig / normal / viel los»

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-025 (Halle suchen), SPEC-028/036 (Treff), SPEC-023 (Admin «Halle»)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschlag **S** (Anna, Christina; Thomas hat ein Drehkreuz; Georg und Ralf warnen vor kleinen Zahlen). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans).

---

## 1. Grill-me: Fragen und Entscheidungen

**F1 – Woher kommt die Information?**
✔ *Entschieden (Empfehlung):* Zwei Quellen, die stärkere gewinnt:
1. **Meldung der Halle**: Admins der Halle können im Admin-Tab «Halle» die aktuelle Auslastung mit einem Tipp setzen (Ruhig / Normal / Viel los). Gilt 90 Minuten, dann verfällt sie. Eine Schnittstelle zum Drehkreuz ist ein späterer Schritt.
2. **Aktivität in der App**: Anzahl **verschiedener** Kletterer, die in den letzten 60 Minuten in dieser Halle etwas geloggt haben, plus Treff «Jetzt da».
*Warum:* Drehkreuze haben je Halle andere Systeme; ein Tipp der Halle funktioniert sofort.

**F2 – Werden Zahlen gezeigt?**
✔ *Entschieden (Empfehlung):* **Nein, nie.** Nur drei Stufen: **Ruhig** (weniger als 5 aktive Kletterer), **Normal** (5–14), **Viel los** (15 und mehr). Unter 5 sagt «Ruhig» nichts über einzelne Personen.
*Warum:* Georg und Ralf: kleine Zahlen sind nicht anonym.

**F3 – Wo erscheint es?**
✔ *Entschieden (Empfehlung):* (a) Im Hallen-Sheet hinter dem Hallennamen (SPEC-025, Liste und Pin-Karte): «Gerade: Ruhig». (b) Oben in Treff. **Nicht** auf der Wand.
*Warum:* Anna entscheidet, **bevor** sie losfährt.

**F4 – Ehrlichkeit?**
✔ *Entschieden (Empfehlung):* Bei App-Aktivität steht klein «laut BoulderMate-Nutzern»; bei Meldung der Halle «laut Halle, vor 20 Min». Ohne Daten in den letzten 60 Minuten und ohne Meldung erscheint nichts.

## 2. Datenmodell

`supabase/migrations/20261009_spec041_auslastung.sql`: Spalten `gyms.crowd_level TEXT CHECK (crowd_level IN ('ruhig','normal','voll'))`, `gyms.crowd_updated_at TIMESTAMPTZ`. Schreiben über SPEC-034-Regeln (Admin der Halle). Lokal ohne Supabase im Gerät.

## 3. Akzeptanzkriterien

- **AC-1** Stufe aus App-Aktivität: verschiedene Personen mit Log in der Halle in den letzten 60 Min (+ Treff «Jetzt da»); <5 Ruhig, 5–14 Normal, ≥15 Viel los.
- **AC-2** Meldung der Halle hat Vorrang und verfällt nach 90 Min.
- **AC-3** Nie eine Zahl in der Oberfläche.
- **AC-4** Anzeige im Hallen-Sheet und oben in Treff, nicht auf der Wand.
- **AC-5** Ohne Daten keine Anzeige.

## 4. Tests

- Unit: `tests/spec041Auslastung.test.tsx`.
- Playwright: `tests/e2e/auslastung.spec.ts` (Admin setzt «Viel los» → Treff und Hallen-Sheet zeigen es).

## Umsetzung (2026-10-09)
- Umgesetzt. Migration `supabase/migrations/20261009_spec041_auslastung.sql`. Hallen-Meldung gilt 90 Min, sonst Schätzung aus Ticks/«Jetzt da» der letzten 60 Min (Grenzen 5 / 15).
- Testdateien: tests/spec041Auslastung.test.tsx; tests/e2e/spec036-041-treff-auslastung.spec.ts
