# SPEC-037: Statistik genauer – Verlauf, Flash-Quote pro Grad, «Für dich», Hallen getrennt

## Status: IMPLEMENTED (2026-10-09)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-004 (Ich, Deep Dive v2), SPEC-008 (Stärken/Schwächen), IDEA-002 (Skalen-Mapping), IDEA-004 (Boulder-Fit)
>
> **Anlass:** Simulierte Nutzer-Runde, Vorschläge **L**, **M** und **P** (Jonas, Aylin, Stefan, Claudia, Tobias, Lena, Christina, Dennis, Sophie). Simuliert, kein echtes Nutzerfeedback.
> Grill-me, alle Fragen **nach der Empfehlung** (Vorgabe Hans). Leitlinie: «Ich» bleibt **eine** Seite ohne Unter-Tabs (SPEC-022 F10).

---

## 1. Ausgangslage

| # | Befund | Wo |
|---|---|---|
| A1 | Flash-Quote ist eine Zahl über alles; bei leichten Graden sagt sie wenig (Aylin). | `MeView.tsx` |
| A2 | Kein Verlauf über Wochen; man sieht nicht, ob man besser wird (Julia, Dennis, Stefan). | `MeView.tsx` |
| A3 | Ein Trainings-Vorschlag existiert schon (`weakness.recommendedBoulder`), steht aber versteckt unter «Mehr zum Stil» und ist nur **ein** Boulder, auch wenn er schon getoppt ist. | `performanceService.ts` |
| A4 | «Alle Hallen» addiert Grade verschiedener Hallen in einer Pyramide; Hallen schrauben unterschiedlich (Christina). | `profileService.ts` |

---

## 2. Grill-me: Fragen und Entscheidungen

**F1 – Flash-Quote pro Grad?**
✔ *Entschieden (Empfehlung):* In der Grad-Pyramide steht rechts neben jeder Zeile statt nur der Zahl: «**7** · 43 % ⚡» (Anzahl Tops, Flash-Anteil in diesem Grad). Die große Flash-Quote oben bleibt.
*Warum:* Aylin; kein neues Bedienelement.

**F2 – Welcher Verlauf?**
✔ *Entschieden (Empfehlung):* Neuer Abschnitt **«Verlauf 8 Wochen»** unter der Pyramide: ein Balken pro Woche (Tops + Flashes), darunter ein Satz: «Diesen Monat 12 Tops, letzten Monat 9.» Bei «Alle Hallen» über alle Hallen.
*Warum:* Dennis will einen Satz, Sophie Zahlen; der Satz enthält Zahlen.

**F3 – Verlauf nach Stil (Stefan)?**
✔ *Entschieden (Empfehlung):* Im Deep Dive (nicht auf «Ich») eine Zeile pro Merkmal: «letzte 4 Wochen» vs. «davor», als Zahl mit Pfeil (↑ ↓ =). Grundlage sind die Merkmale der getoppten Boulder (wie Top 5).
*Warum:* Für Trainer und Rückkehrer wertvoll, für alle anderen zu viel → Deep Dive.

**F4 – «Für dich»: wie viele Vorschläge und welche?**
✔ *Entschieden (Empfehlung):* Abschnitt **«Für dich»** auf «Ich», direkt unter «Meine Projekte»: bis zu **3 offene** Boulder (nicht getoppt/geflasht) der **aktuell gewählten Halle**, deren Grad im Bereich «bester Grad −1 bis bester Grad +1» liegt und die im Merkmal der Baustelle hoch sind (≥ 4). Überschrift: «Für dich · Baustelle Sloper». Tippen öffnet das Sheet. Ohne freigeschaltetes Stil-Profil (zu wenige Tops) entfällt der Abschnitt.
*Warum:* Tobias: «der Grund, die App zu behalten». Nur aktuelle Halle, weil man dort steht.

**F5 – Hallen getrennt bei «Alle Hallen»?**
✔ *Entschieden (Empfehlung):* Bei «Alle Hallen» erscheint unter den drei Zahlen eine kleine Tabelle **«Pro Halle»**: Halle · Tops · bester Grad. Die Pyramide bleibt nach Font-Grad (Font ist hallenübergreifend die gemeinsame Sprache). Eine echte Umrechnung zwischen Hallen (IDEA-002) bleibt offen, bis genug Soft/Fair/Stiff-Daten pro Halle vorliegen.
*Warum:* Christina sieht, wo ihr bester Grad herkommt; ehrlicher als eine erfundene Umrechnung.

**F6 – Gesundheits-Hinweise (Claudia)?**
✔ *Entschieden (Empfehlung):* Nein. Der Stil-Verlauf im Deep Dive (F3) zeigt «Leisten ↑», das reicht. Keine Warnungen («Die App ist kein Arzt», Stefan).

---

## 3. Akzeptanzkriterien

- **AC-1** Jede Pyramiden-Zeile zeigt Anzahl und Flash-Anteil in Prozent.
- **AC-2** «Verlauf 8 Wochen» zeigt 8 Balken (älteste links) und den Monatssatz mit beiden Zahlen.
- **AC-3** Deep Dive zeigt pro Merkmal «letzte 4 Wochen» vs. «davor» mit ↑/↓/=.
- **AC-4** «Für dich» zeigt höchstens 3 offene Boulder der aktuellen Halle im Grad-Fenster mit hohem Baustellen-Merkmal; keine getoppten.
- **AC-5** «Pro Halle» erscheint nur bei «Alle Hallen» und nur, wenn in mehr als einer Halle geloggt wurde.
- **AC-6** Alle neuen Texte ≥ 14 px (SPEC-032 F5).

## 4. Tests

- Unit: `tests/spec037Statistik.test.tsx` (Wochen-Balken, Monatssatz, Flash-Anteil pro Grad, Empfehlungs-Auswahl, Pro-Halle-Tabelle, Stil-Trend).
- Playwright: `tests/e2e/statistik-verlauf.spec.ts` (Abschnitte sichtbar, Tippen auf Vorschlag öffnet Sheet).

## 5. Nicht Teil dieser Spec

- Echte Grad-Umrechnung zwischen Hallen (IDEA-002).
- Trainer-Ansicht (SPEC-042).

## Umsetzung (2026-10-09)
- Umgesetzt, dazu im Deep Dive der Abschnitt «Dein Stil im Verlauf» (vorher → zuletzt).
- Testdateien: tests/spec037Statistik.test.tsx; tests/e2e/spec033-035-037-ich.spec.ts
