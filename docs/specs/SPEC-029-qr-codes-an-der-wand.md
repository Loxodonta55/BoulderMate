# SPEC-029: QR-Codes an der Wand

## Status: IMPLEMENTED (2026-10-09, uncommitted)

> **Owner:** Hans · **Created:** 2026-10-09 · **Baut auf:** SPEC-001 (Hallen & Sektoren), SPEC-011 (Landing Page), SPEC-022 (Kletterer-UX), SPEC-023 (Admin-UX, Tab «Halle»), SPEC-024 (Google-Login)
>
> Geplant nach der Grill-me-Methode. Hans hat am 2026-10-09 gesagt: «Gehe immer mit der Empfehlung und setze dann um.» Alle Fragen F1–F9 sind deshalb wie empfohlen entschieden.

---

## 1. Ziel

Kletterer stehen vor der Wand und wollen sofort loggen. Heute müssen sie die App öffnen, die Halle wählen und zum richtigen Sektor wischen. Ein QR-Code an der Wand bringt sie mit einem Scan direkt dorthin.

Für Hallenbetreiber ist das ein sichtbares Zeichen in der Halle («Diese Halle ist auf BoulderMate») und bei einer Vorführung sofort verständlich.

## 2. Ausgangslage (Code-Stand 2026-10-09)

| # | Befund | Wo |
|---|---|---|
| A1 | Die App liest beim Start keine Adress-Parameter für Halle oder Sektor. Nur die Google-Rückkehr (`?code=`) wird ausgewertet. | `App.tsx`, `authService.readOAuthReturnFromUrl` |
| A2 | Nicht angemeldete Besucher sehen die Landing Page, nicht die Wand. | `App.tsx` |
| A3 | Sektor-IDs sind lokal teils Kurz-IDs (z. B. `sector-…`), in Supabase immer UUIDs (`stringToUuid`). | `storageUtils.stringToUuid`, `syncService` |
| A4 | Es gibt keine QR-Bibliothek im Projekt. | `package.json` |

## 3. Grill-me: Fragen und Entscheidungen

**F1 – Ein QR-Code pro Sektor oder pro Boulder?**
✔ *Entschieden (Empfehlung):* **Pro Sektor.** Ein Aufkleber pro Wand reicht und bleibt beim Umschrauben gültig. Pro Boulder müsste nach jedem Umbau neu gedruckt und geklebt werden.
*Folge:* Der Scan öffnet die Wand des Sektors. Von dort ist der Boulder ein Tipp entfernt, das Loggen ein zweiter (SPEC-022).

**F2 – Wie sieht der Link aus?**
✔ *Entschieden (Empfehlung):* `https://bouldermate.ch/?wand=<Sektor-UUID>`. Die Halle ergibt sich aus dem Sektor. Die UUID ist dieselbe wie in Supabase, damit der Link auf jedem Gerät funktioniert. Beim Öffnen sucht die App den Sektor über die ID **oder** über `stringToUuid(id)` (A3).
*Warum:* Kurz, stabil, ohne Hallen-Namen, die sich ändern können.

**F3 – Was passiert nach dem Scan, wenn man angemeldet ist?**
✔ *Entschieden (Empfehlung):* Die App wechselt in die Halle des Sektors, zeigt den Tab «Wand» mit diesem Sektor und entfernt `?wand=` aus der Adresszeile (damit ein Neuladen nicht wieder springt). Arbeitet man gerade im Schrauber- oder Admin-Bereich, wechselt die App in den Kletterer-Bereich.

**F4 – Und als Gast (nicht angemeldet)?**
✔ *Entschieden (Empfehlung):* Die Landing Page erscheint wie immer, mit einem Hinweis oben: **«Melde dich an, dann geht es direkt zur Wand ‹Sektorname›.»** Das Ziel wird gemerkt (`localStorage`, übersteht auch den Umweg über Google) und nach der Anmeldung angewendet. Das Ziel verfällt nach 30 Minuten.
*Warum:* Es gibt heute keinen echten Gast-Modus an der Wand (A2). Den nur für QR einzuführen, wäre eine eigene Spec.

**F5 – Was, wenn der Sektor nicht (mehr) existiert?**
✔ *Entschieden (Empfehlung):* Die App startet normal an der Wand und zeigt einen kurzen Hinweis «Diese Wand gibt es nicht mehr.» (Toast). Kein Fehler-Dialog.
*Hinweis:* Nach dem ersten Start sind die Sektoren eventuell noch nicht aus Supabase geladen. Die App wartet deshalb auf den ersten Abgleich, höchstens 5 Sekunden (schlechtes Netz in der Halle), bevor sie «gibt es nicht mehr» meldet.

**F6 – Wo erzeugt man die Codes?**
✔ *Entschieden (Empfehlung):* Admin-Konsole → Tab **«Halle»** → Abschnitt **«QR-Codes für die Wände»** mit dem Knopf **«QR-Codes drucken»**. Er öffnet eine Druckansicht mit einem Aufkleber pro Sektor. Nur Hallen-Admin und Plattform-Admin.
*Warum:* Feature-Isolation (CONSTITUTION §3): Aushänge in der Halle sind Sache des Hallen-Admins. Kein neuer Tab.

**F7 – Was steht auf dem Aufkleber?**
✔ *Entschieden (Empfehlung):* Ein Aufkleber pro Seite (A5 hoch, druckt auch auf A4). Oben groß der **Sektorname**, darunter der Hallenname, in der Mitte der **QR-Code (mind. 9 cm)**, darunter **«Scannen und Boulder loggen»** und klein der Link als Text (`bouldermate.ch/?wand=…`, für Handys ohne Kamera-Scan). Schwarz auf Weiß, sehr großer Text, kein Farbdruck nötig.
*Warum:* Gut lesbar aus 2–3 m Entfernung, auch für Menschen mit schlechteren Augen.

**F8 – QR-Bibliothek?**
✔ *Entschieden (Empfehlung):* `qrcode-generator` (MIT, ohne weitere Abhängigkeiten, ca. 20 kB). Der Code wird als SVG erzeugt, damit er beim Druck scharf bleibt. Fehlerkorrektur **M** (verträgt Kratzer und Kreide).
*Folge:* Nach dem Holen einmal `npm install`.

**F9 – Werden Scans gezählt?**
✔ *Entschieden (Empfehlung):* **Nein**, nicht in dieser Spec. Kein Tracking, keine neue Tabelle. Später denkbar als Zahl in der Hallen-Auswertung (SPEC-030).

## 4. Umsetzung

- `src/lib/wallLink.ts`: Link bauen (`buildWallLink`), `?wand=` lesen (`readWallLinkFromUrl`), aus der Adresszeile entfernen, Ziel merken/holen/löschen (30 Minuten), Sektor auflösen (`resolveWallLinkSector`: ID oder `stringToUuid`).
- `src/lib/qrSvg.ts`: QR-Code als SVG-Pfad (`qrcode-generator`, Fehlerkorrektur M).
- `src/components/admin/WallQrCodes.tsx`: Abschnitt im Tab «Halle» und Druckansicht (Vollbild-Ebene, `window.print()`, Druck-CSS blendet die App aus).
- `src/components/GymManagement.tsx`: hängt `WallQrCodes` im Tab «Halle» unter dem Standort-Editor ein.
- `src/App.tsx`: liest den Link beim Start, merkt ihn für Gäste, wendet ihn nach Anmeldung und nach dem ersten Supabase-Abgleich an (Halle wählen, Tab «Wand», Kletterer-Bereich).
- `src/components/ClimberSectorView.tsx`: neue Prop `focusSectorId`, wählt den Sektor.
- `src/components/LandingPage.tsx`: optionaler Hinweis `wallLinkNotice`.
- Neue Abhängigkeit: `qrcode-generator@2.0.4`.

## 5. Akzeptanzkriterien

- **AC-1** `https://bouldermate.ch/?wand=<id>` öffnet angemeldet die Wand des Sektors (Halle gewechselt, Tab «Wand», Sektor-Pill zeigt den Sektor). Danach steht `?wand=` nicht mehr in der Adresszeile.
- **AC-2** Der Link funktioniert mit der lokalen ID und mit der Supabase-UUID desselben Sektors.
- **AC-3** Ist man im Schrauber- oder Admin-Bereich, führt der Link in den Kletterer-Bereich.
- **AC-4** Als Gast zeigt die Landing Page den Hinweis `wall-link-notice` mit dem Sektornamen. Nach der Anmeldung öffnet die App die Wand dieses Sektors. Ein gemerktes Ziel älter als 30 Minuten wird ignoriert.
- **AC-5** Unbekannter Sektor: Die App startet normal, Toast «Diese Wand gibt es nicht mehr.».
- **AC-6** Admin-Konsole, Tab «Halle»: Abschnitt `wall-qr-section` mit Knopf `wall-qr-print-btn`. Die Druckansicht `wall-qr-sheet` zeigt pro Sektor einen Aufkleber `wall-qr-card-<sectorId>` mit Sektorname, Hallenname, QR-Code (SVG `wall-qr-code`), «Scannen und Boulder loggen» und dem Link als Text. «Drucken» (`wall-qr-print-now`) ruft den Druckdialog auf, «Schließen» (`wall-qr-close`) schließt.
- **AC-7** Der QR-Code enthält genau den Link aus AC-1 mit der Supabase-UUID.
- **AC-8** Kletterer und Schrauber sehen den Abschnitt nicht (Feature-Isolation; die Admin-Konsole ist nur für Admins erreichbar).

## 6. Tests (CONSTITUTION §13)

**Unit (Vitest)**
- `tests/spec029WallLink.test.ts`: Link bauen (UUID), Lesen aus `?wand=`, Entfernen aus der Adresse, Merken mit Ablauf nach 30 Minuten, Auflösen über ID und UUID, unbekannter Sektor, QR-SVG (Pfad vorhanden, quadratisch, gleicher Inhalt → gleiches Bild).
- `tests/spec029WallQrCodes.test.tsx`: Abschnitt und Druckansicht mit einem Aufkleber pro Sektor, Texte, Link als Text, Drucken ruft `window.print`, Landing-Hinweis für Gäste.

**Playwright (`tests/e2e/wall-qr.spec.ts`, Desktop und Mobile Chrome)**
- Angemeldet: `/?wand=<UUID>` → Wand des Sektors, Adresse ohne `?wand=`.
- Gast: `/?wand=<UUID>` → Landing mit Hinweis → Schnell-Login → Wand des Sektors.
- Unbekannte Wand → Toast.
- Admin: Tab «Halle» → «QR-Codes drucken» → Aufkleber pro Sektor mit QR-Code.

## 7. Nicht Teil dieser Spec
- QR-Codes pro Boulder.
- Scan-Zählung.
- Echter Gast-Modus an der Wand ohne Anmeldung.
