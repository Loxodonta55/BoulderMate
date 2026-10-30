# Vertriebsstrategie «Partner gewinnen Hallen» (zu SPEC-054)

> Stand 2026-10-30 · Entwurf von Claude für Hans · **Es wurde nichts versendet.** Jede Nachricht nach aussen geht erst nach Hans' Freigabe raus, und zwar von Hans persönlich (nicht automatisch).

## 1. Idee in drei Sätzen

Hans muss Hallen nicht mehr selbst einzeln überzeugen. Er gewinnt **Menschen, die Hallenleitungen persönlich kennen** (Trainer, Stammgäste, Hallenteams, Influencer), und gibt ihnen mit der App alles in die Hand: Demo, fertige Texte, Antworten auf Einwände, persönlichen Link. Sie bekommen **30 % von dem, was die Halle im ersten Jahr an BoulderMate zahlt, ab der 3. Halle 40 %**.

## 2. Was vor dem Start fehlt (Reihenfolge)

1. **Preis für Hallen festlegen** (Einführungsgebühr + Jahresgebühr). Ohne Preis ist «30 %» für Partner nicht greifbar; die App zeigt bis dahin ein klar beschriftetes Rechenbeispiel (CHF 1’000 → CHF 300).
2. **Partnerbedingungen rechtlich prüfen lassen** (Tippgeber statt Handelsvertreter, Scheinselbständigkeit CH/DE, Gutschriften, Datenschutzerklärung). Entwurf: `public/empfehlungsprogramm.html`, Datenschutz-Absatz in SPEC-054 §9.
3. **Migrationen einspielen** (SPEC-053, dann SPEC-054).
4. **2–3 Testhallen persönlich gewinnen** (wie im Marketing-Thread empfohlen, Liste `marketing/hallen-akquise-muenchen-frauenfeld.xlsx`). Jede aktive Halle ist das stärkste Argument für Partner («Demo: 6a plus Zürich» plus eine zweite Halle).

Erst danach Partner aktiv ansprechen. Vorher reicht der Link `bouldermate.ch/?partner` für Leute, die von selbst fragen.

## 3. Wen wir als Partner suchen

| Segment | Warum sie Hallen öffnen können | Wo man sie findet | Botschaft |
|---|---|---|---|
| **Trainer/innen, Kursleitende** | Arbeiten in 2–6 Hallen, kennen die Leitung, werden ernst genommen | Kursangebote auf Hallen-Websites, SAC-Tourenleitende, Kletterschulen | «Du kennst die Leitung schon. Ein Gespräch, fertiger Text, 30 % vom ersten Jahr.» |
| **Hallenteam** (Schrauber, Theke) | Sitzen direkt an der Quelle; Schrauber profitieren selbst (Rückmeldung zu Routen) | Über Hans' bestehende Kontakte (6a plus), Schrauber-Netzwerke | «Zeig deiner Chefin, was deine Routen bekommen. Offen, mit Provision.» |
| **Stammgäste, Vereinsvorstände, Rentner** | Vertrauen der Leitung, Zeit, oft im Verein | Wunsch-Rangliste in der App (`hallen_wunsch_rangliste()`): wer sich BoulderMate wünscht, ist der natürliche Kandidat | «Du willst BoulderMate in deiner Halle? Wir helfen dir mit Text und Demo, und es lohnt sich.» |
| **Influencer/innen, YouTuber** | Reichweite in die ganze Schweiz; allgemeiner Link `?ref=` | Schweizer Boulder-Accounts (Instagram, YouTube), Wettkampfszene | «Ein Link für deine Beschreibung. Als Werbung gekennzeichnet. Halle wählt, du bekommst die Provision.» |
| **Studierende** (Sport, BWL, Kommunikation) | Zeit, Lust auf Nebenverdienst, Uni-Kletterclubs | ASVZ/Hochschulsport, Uni-Kletterclubs | «Nebenverdienst ohne Pflichten. Eine Stufe, keine Ziele.» |

## 4. Ablauf (Funnel)

```
Hans' Nachricht (persönlich, 1:1)  →  bouldermate.ch/?partner  →  «Partner werden» in der App
      →  Halle auf der Karte betreuen  →  Texte an die Hallenleitung  →  Halle meldet sich (Code)
      →  Hans: Offerte, Vertrag  →  Halle zahlt  →  Hans trägt Umsatz ein  →  Provision quartalsweise
```

## 5. Was Claude (KI) übernimmt und was Hans tut

| Aufgabe | Claude | Hans |
|---|---|---|
| Partner-Kandidaten finden (öffentliche Quellen: Kursseiten, Vereine, Accounts) | Liste mit Name/Rolle/Quelle/Halle, nur geschäftliche Kontakte | prüft, streicht |
| Persönliche Erstnachricht je Kandidat | Entwurf nach Vorlage (§6), individuell | **gibt frei und sendet selbst** |
| Wunsch-Rangliste auswerten (Hallen mit vielen Wünschen) | wöchentlich: Top-Hallen + passende Partner aus den Wünschenden | entscheidet, wen er anschreibt |
| Partner-Kit (Texte, Einwände) aktuell halten | Vorschläge für Textänderungen in der App | genehmigt |
| Pipeline-Bericht (Status, offene Provision) | wöchentlich aus «Vertrieb» | trägt Umsätze ein, zahlt aus |
| Rechtliches, Preise, Verträge | – | **nur Hans** (mit Fachleuten) |

Wöchentlicher Rhythmus (Vorschlag): Montag Claude-Bericht + 5 Entwürfe → Hans gibt frei und sendet bis Mittwoch → Freitag Nachfassen nur bei Antworten (kein zweites Anschreiben ohne Reaktion).

## 6. Vorlagen für die Ansprache von Partnern (Entwürfe, nicht versendet)

**Trainer/in (E-Mail, per Du in der Kletterszene üblich):**
> Hoi <Name>, ich bin Hans von BoulderMate (Routen mit Foto an der Wand, Kletterer loggen und bewerten, Schrauber bekommen Rückmeldung). Du gibst Kurse in <Halle>, deshalb frage ich dich direkt: Hättest du Lust, BoulderMate deiner Hallenleitung zu zeigen? Du bekommst 30 % von dem, was die Halle im ersten Jahr an uns zahlt, ab der dritten Halle 40 %. Keine Ziele, keine Pflichten, Texte und Demo sind in der App fertig: bouldermate.ch/?partner. Liebe Grüsse, Hans

**Influencer/in (DM):**
> Hoi <Name>! Ich baue BoulderMate, eine Schweizer Boulder-App mit Routen auf dem Wandfoto. Wir haben ein Partnerprogramm mit einem Link für deine Beschreibung: Wenn eine Halle darüber kommt, bekommst du 30 % vom ersten Jahr. Als Werbung gekennzeichnet, ohne Pflichten. Infos: bouldermate.ch/?partner. Hans

**Stammgast mit Wunsch (nur, wenn die Person in der App eingewilligt hat, kontaktiert zu werden – sonst nicht anschreiben):**
> Danke, dass du dir BoulderMate in <Halle> wünschst! Wenn du die Leitung kennst: In der App unter «Ich → Partner» findest du einen fertigen Text und bekommst eine Provision, falls die Halle mitmacht.

Hinweis: Wünschende Kletterer werden **nicht** per E-Mail angeschrieben, solange es dafür keine Einwilligung gibt. Der Weg zu ihnen ist der Abschnitt «Partner» in der App.

## 7. Spielregeln (Recht und Ruf)

- Nur **1:1-Nachrichten** an öffentlich geschäftlich angegebene Kontakte; keine Massenmails, keine gekauften Listen (UWG Art. 3 lit. o CH, § 7 UWG DE).
- Partner legen die Provision **immer offen** (fest in jedem Text); Influencer kennzeichnen Werbung.
- Keine Ziele, Ranglisten oder Weisungen an Partner (Scheinselbständigkeit).
- Halle sagt Nein → nicht nachhaken; Halle will nicht erscheinen → ausblenden (SPEC-053).

## 8. Kennzahlen

| Kennzahl | Ziel erste 3 Monate nach Start (Vorschlag) |
|---|---|
| angeschriebene Partner-Kandidaten | 40 (≈ 5 pro Woche) |
| aktive Partner (mind. 1 betreute Halle) | 10 |
| betreute Hallen | 20 |
| Hallen «Im Gespräch» | 8 |
| registrierte Hallen über Partner | 3 |

## 9. Erste vier Wochen nach Freigabe

1. Woche 1: Preis steht, Bedingungen geprüft, Migrationen drin. Claude erstellt Kandidatenliste Zürich/Winterthur (Trainer, Hallenteams) mit 15 Namen.
2. Woche 2: Hans schreibt 5 Kandidaten persönlich an (Entwürfe von Claude). Eigene Kontakte aus 6a plus zuerst.
3. Woche 3: 5 weitere Kandidaten, plus 2 Influencer. Erste Partner betreuen Hallen; Claude prüft im Bericht, ob die Texte ankommen.
4. Woche 4: Rückblick mit Hans: Was sagen Hallen? Einwände-Liste in der App nachschärfen (FeatureDefinition-Mini-Loop, falls nötig).
