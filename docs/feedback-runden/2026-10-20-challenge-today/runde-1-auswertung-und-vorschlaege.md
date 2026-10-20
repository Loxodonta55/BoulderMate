# Runde 1 – Auswertung und Vorschläge (Spec v1 → v2)

> SPEC-051 «Challenge Today» · 2026-10-20 · simuliert

## Kritikpunkte

| # | Kritik | Wer | Schwere |
|---|---|---|---|
| K1 | «Limit» = bester Grad ist ein Ausreißer (falsch eingestufte Route, alte Bestleistung vor Verletzung) | Marco, David, Sophie | **hoch** |
| K2 | Verwechslung mit SPEC-038 «Hallen-Challenge» (Theke, Marketing, Preise) | Ilse, Katrin, Andreas | **hoch** |
| K3 | Englischer Name unverständlich für Ältere; Englisch-Nutzer brauchen Übersetzung | Ilse, Priya | mittel |
| K4 | Ohne Begründung wirkt die Wahl zufällig, man glaubt ihr nicht | Jürgen, Hanna, Sara | mittel |
| K5 | Farbpunkt allein reicht nicht (Sehschwäche, Farbschwäche) | Rolf, Leonie | mittel |
| K6 | Neue, unbewertete Routen fallen durch «gut bewertet» raus | Jonas, Lukas | mittel |
| K7 | «Jeder dritte Tag» passt nicht zu Leuten, die selten in die Halle gehen | Aylin | mittel |
| K8 | «Andere zeigen» darf nicht endlos sein | Ben | niedrig |
| K9 | Gleiche offene Challenge am nächsten Tag fühlt sich an wie Hausaufgabe | Kemal | niedrig |
| K10 | Freiwilliger Ton, kein «Limit», kein Countdown | Fatima, Greta | niedrig |
| K11 | Kurzer Datenschutz-Satz «bleibt auf deinem Gerät» | Julia | niedrig |

## Vorschläge und Entscheidung

| # | Vorschlag | Entscheidung |
|---|---|---|
| V1 (K1) | Statt bestem Grad einen **«sicheren Grad»**: schwerster Fb-Grad mit mindestens 2 Tops in den letzten 90 Tagen; fehlt das, mit mindestens 2 Tops überhaupt; sonst bester Top. Challenge = 1–2 Stufen darüber. | **übernehmen** |
| V2 (K2, K3) | Text im UI **«Deine Challenge heute»** / EN «Your challenge today»; eigenes Symbol (Flamme), nie im selben Block wie die Hallen-Challenge (Pokal). Interner Name bleibt «Challenge Today». | **übernehmen** |
| V3 (K4) | Ein Begründungssatz mit Zahlen: «Liegt dir: Maximalkraft 5 · Koordination 4» und «Wenig Technik». Dazu «1 Stufe über deinem sicheren Grad (6A)». | **übernehmen**, Wort «Limit» nicht im UI (K10) |
| V4 (K5) | Farbname als Wort, Nummer groß, Sektor ausgeschrieben, Mindestschrift 16 px. | **übernehmen** |
| V5 (K6) | Unbewertete Routen erlaubt (zählen wie 3 Sterne), Routen mit Ø unter 3 Sternen ausgeschlossen. Sektoren im Umbau ausgeschlossen. | **übernehmen** |
| V6 (K7) | Zufall pro **Besuchstag** (Tag, an dem man die Wand öffnet) statt pro Kalendertag. | **übernehmen**, Feinheiten in Runde 2 |
| V7 (K8) | «Andere zeigen» höchstens 2-mal am Tag. | **übernehmen** |
| V8 (K9) | Jeden Tag neu auswählen; die gestrige darf wiederkommen, aber nicht bevorzugt. | **übernehmen** (Zufall mit Tages-Startwert) |
| V9 (K11) | Kurzer Satz im Infofeld: «Wird nur auf deinem Gerät berechnet.» | **übernehmen** |
| V10 | Punkte, Abzeichen, Rangliste für geschaffte Challenges (Mia) | **verworfen**: Hans will nichts, was nervt; Chris: Verletzungs-Wettrennen; Abgrenzung zu SPEC-048 |
| V11 | Push-Benachrichtigung (James dagegen) | **verworfen** |
| V12 | Merkmale mit Zahlen wie im Deep Dive (Sara) | **übernehmen** in V3 |
