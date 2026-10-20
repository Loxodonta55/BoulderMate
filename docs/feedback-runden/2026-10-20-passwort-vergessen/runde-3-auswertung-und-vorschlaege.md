# Runde 3 – Auswertung und Vorschläge (SPEC-049 v3 → v4)

> Simuliert. Grundlage: [runde-3-unterhaltung.md](runde-3-unterhaltung.md).

## Themen

| # | Thema | Nennungen | Populationen | Schweregrad |
|---|-------|-----------|--------------|-------------|
| T1 | Gesperrter Knopf mit Zähler grau auf grau schwer lesbar | 2 (Werner, Lukas) | Ältere, Einschränkungen | mittel |
| T2 | Fokus nach Wechsel der Ansicht (Screenreader) | 1 (Jule) | Einschränkungen | mittel |
| T3 | Rückfall ohne umgestellte Mail-Vorlage: nur im selben Browser | 1 (Tim) | MINT | niedrig (in v3 abgedeckt; Dashboard-Aufgabe) |
| T4 | Tippfehler in Mail-Domains («gmial») | 3 (Tanja, Jakob, Oliver) | Eltern, MINT, Kaufleute | niedrig |
| T5 | Mindestlänge erst nach Speichern gemeldet | 2 (Sabine, Kerstin) | Pflege, Kaufleute | niedrig |
| T6 | Absendername «BoulderMate» | 1 (Monika) | Ältere | niedrig (Dashboard) |

Keine Kritik mit Schweregrad **hoch**. Die Spec ändert sich nur im Feinschliff.

**Zitate**
- T1: «Grau auf Grau sehe ich schlecht.» (Werner)
- T2: «Bitte nach dem Wechsel den Fokus ins E-Mail-Feld setzen, sonst weiß ich nicht, wo ich bin.» (Jule)
- Gesamt: «Zwei Minuten bis wieder drin, ohne Theke, ohne Anruf.» (Oliver)

## Vorschläge

| # | Vorschlag | Nutzen | Aufwand | Priorität | Hauptzweck / Überladung |
|---|-----------|--------|---------|-----------|------------------------|
| V1 | Gesperrter Knopf: Text in voller Textfarbe, nur Rand/Fläche zurückgenommen (keine `opacity` auf den Text) | mittel | klein | 2 | stärkt |
| V2 | Beim Wechsel auf «Passwort vergessen» und «Neues Passwort» springt der Fokus ins erste Feld | mittel | klein | 2 | stärkt |
| V3 | Mindestlänge als Hilfezeile unter dem Feld (nicht nur in der Beschriftung) | niedrig | klein | 3 | neutral |

## Entscheidung (eingearbeitet in v4)

- **Übernommen:** V1–V3.
- **Verworfen:** Tippfehler-Erkennung für Mail-Domains (Tanja): eigenes Thema mit Fehlalarmen (Jakob); «Fast geschafft» zeigt die Adresse groß, «Adresse falsch? Zurück» deckt den Fall ab. Ins Ideenspeicher-Kandidat.
- **Dashboard (Hans):** Mail-Vorlagen und Absender (T3, T6) stehen in der Spec, Abschnitt «Was Hans im Supabase-Dashboard einstellt».

## Abbruchregel

Loop 3 erreicht, keine Kritik «hoch», Spec nur im Feinschliff geändert → **Abschluss, Status READY (v4)**.

## Nicht umsetzen

- Keine Passwort-Stärke-Anzeige, keine Regeln über «mindestens 6 Zeichen» hinaus (Runde 1).
- Keine Hilfe-Funktion für Hallenpersonal.
