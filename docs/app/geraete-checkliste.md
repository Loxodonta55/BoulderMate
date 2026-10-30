# Geräte-Checkliste App (SPEC-045)

> Vor **jedem** Einreichen in den Store, je auf **einem iPhone und einem Android-Handy**.
> Was Playwright nicht kann (echte Kamera, App-Links, Systemschrift, Zurück-Taste), steht hier.
> Abhaken, Datum und Gerät eintragen, bei Fehlern Foto machen und über «Feedback geben» melden.

| # | Prüfung | Erwartung | iPhone | Android |
|---|---|---|---|---|
| 1 | App zum ersten Mal öffnen | Startbild nur mit Logo, dann Startseite; Satz «Schon ein Konto auf bouldermate.ch? Es gilt auch hier.» | | |
| 2 | Flugmodus an, App das erste Mal öffnen (frisch installiert) | «Noch keine Daten. Verbinde dich einmal mit dem Netz …» | | |
| 3 | Anmelden mit Google | Sicheres Anmeldefenster öffnet sich, danach zurück in der App, angemeldet | | |
| 4 | Anmelden mit Apple | wie 3 | | |
| 5 | Anmelden mit E-Mail-Link (Link auf demselben Handy öffnen) | Link öffnet die App, angemeldet | | |
| 6 | App ganz schließen und neu öffnen | weiter angemeldet | | |
| 7 | QR-Code an der Wand mit der **normalen Kamera-App** scannen | App öffnet sich an dieser Wand (nicht der Browser) | | |
| 8 | QR-Code mit dem Scanner-Knopf oben scannen | löst ohne Tippen aus, Wand öffnet sich | | |
| 9 | QR-Code einer **anderen Halle** scannen | App wechselt die Halle | | |
| 10 | Kamera-Erlaubnis | wird erst beim Tippen auf Scanner oder Foto gefragt, Text verständlich | | |
| 11 | Halle öffnen, dann Flugmodus, App neu öffnen | Wand **mit Foto** sichtbar | | |
| 12 | Boulder loggen im Flugmodus, dann Netz an | Eintrag wird nachgesendet (Chip «Offline» verschwindet) | | |
| 13 | Schrauber: Wandfoto mit «Kamera öffnen», **quer** fotografiert | Foto bleibt quer, scharf, lange Seite höchstens 2400 px | | |
| 14 | Android: während der Kamera andere große App öffnen, zurück | Foto ist noch da | – | |
| 15 | Boulder teilen | System-Teilen-Menü mit Link `bouldermate.ch/?wand=…` | | |
| 16 | Android-Zurück: Boulder-Sheet offen → Zurück | Sheet zu, App bleibt | – | |
| 17 | Android-Zurück auf der Wand | «Nochmal drücken zum Beenden», zweites Drücken beendet | – | |
| 18 | Systemschrift auf größte Stufe | Texte größer, nichts abgeschnitten, kein Querscrollen | | |
| 19 | Zwei Finger auf der Wand | Zoomen geht | | |
| 20 | Dunkelmodus des Handys | Startbild dunkel, Uhr oben lesbar | | |
| 21 | Kamera-Insel / Home-Balken | keine Knöpfe darunter | | |
| 22 | VoiceOver / TalkBack an: Scanner-Knopf, Zahnrad, Löschen | jeder Knopf wird mit Namen vorgelesen | | |
| 23 | Einstellungen → App | Version stimmt, «Wandfotos offline: … MB · Löschen» geht | | |
| 24 | Einstellungen → Konto löschen (Test-Konto!) | erst nach «LÖSCHEN», danach abgemeldet, Anmelden mit dem Konto geht nicht mehr | | |
| 25 | `app-version.json`: `latestVersion` höher setzen | Punkt am Zahnrad, Zeile «Neue Version im Store», kein Fenster | | |
| 26 | `minVersion` höher setzen | Vollbild «Bitte aktualisieren» | | |

Geprüft am: ………… · iPhone: ………… (iOS …) · Android: ………… (Android …) · von: …………
