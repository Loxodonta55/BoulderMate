# SPEC-003: Boulder-Detailansicht, Bewertungen & Logging

## Status: DONE

## Summary
Ermöglicht Kletterern das Betrachten aller Details eines Boulders (Farbe, Schwierigkeitsband, Community-Qualität, Grade-Feeling und Radar-Chart zu Klettereigenschaften), das Loggen eigener Begehungen (Flash, Top, Projekt) sowie die direkte Bewertung nach dem Durchstieg. Das Bewertungssystem umfasst ein 3-stufiges Grad-Empfinden (Soft / Fair / Stiff), eine 5-Sterne Qualitäts-/Spaßwertung sowie eine 5-Achsen-Charakterisierung (Kraft, Technik, Balance, Koordination, Flexibilität), deren Durchschnitt gemeinsam mit der initialen Schrauber-Einschätzung aggregiert wird.

## User Stories
- **US-1**: Als Kletterer möchte ich auf einen Boulder-Pin im Wandfoto tippen, um eine Vollbild-Detailansicht mit allen Kriterien und Bewertungen zu öffnen.
- **US-2**: Als Kletterer möchte ich auf einen Blick sehen, ob der Boulder eher kraftig, technisch, koordinativ oder balance-lastig ist (5-Achsen Radar-Chart).
- **US-3**: Als Kletterer möchte ich den Boulder als `Flash`, `Top` oder `Projekt` in mein persönliches Logbuch eintragen können.
- **US-4**: Als Kletterer möchte ich direkt nach dem Loggen eines Tops/Flashs ein kompaktes Bewertungs-Sheet erhalten, um ohne Reibung mein Feedback abzugeben (oder zu überspringen).
- **US-5**: Als Kletterer möchte ich bewerten können, ob der Boulder für seinen Grad `Soft`, `Fair` oder `Stiff` ist, sowie 1–5 Sterne für die Routenqualität vergeben.
- **US-6**: Als Kletterer möchte ich optional meine eigene Einschätzung im Radar-Chart anpassen können.
- **US-7**: Als Kletterer möchte ich sehen, welche anderen Nutzer den Boulder bereits getoppt oder geflasht haben.

## Acceptance Criteria
- [x] **AC-1: Navigation & Detailansicht**: Antippen eines aktiven Boulder-Pins navigiert zur vollständigen Detailseite mit Header (Farb-Badge, Schwierigkeitsband, Sternedurchschnitt, Soft/Fair/Stiff-Barometer), Radar-Chart und Aktionen.
- [x] **AC-2: Radar-Chart Aggregation**: Das Radar-Chart zeigt den gewichteten Mittelwert aus Schrauber-Initialbewertung und Community-Ratings (Schrauber-Gewichtung anfangs dominant, Community-Einfluss steigt mit Bewertungsanzahl).
- [x] **AC-3: Begehungs-Logging (Ascents)**: Nutzer können pro Boulder den Status `flash`, `top` oder `project` setzen. Ein neuer Top/Flash überschreibt vorherigen Projekt-Status.
- [x] **AC-4: Automatischer Bewertungs-Trigger**: Direkt nach erfolgreichem Speichern eines `top` oder `flash` Logs öffnet sich ein Bewertungs-Sheet (mit "Überspringen"-Button).
- [x] **AC-5: Manuelle Bewertung**: Auf der Detailseite existiert ein separater "Bewerten"-Button, um auch unabhängig vom Logzeitpunkt Feedback abzugeben oder anzupassen.
- [x] **AC-6: Kompaktes Bewertungs-Formular**:
  - 3 prominente Buttons für Grad-Empfinden: `Soft` (🟢), `Fair` (🟡), `Stiff` (🔴).
  - 1–5 Sterne-Rating für Qualität/Spaß.
  - Einklappbarer Bereich für 5 Slider des Radar-Charts (Kraft, Technik, Balance, Koordination, Flexibilität von 1 bis 5).
  - Speichern mit maximal 2–3 Taps möglich.
- [x] **AC-7: Einmalige Wertung pro Nutzer**: Ein Nutzer kann pro Boulder genau eine Bewertung abgeben; spätere Aufrufe aktualisieren seine bestehende Bewertung.
- [x] **AC-8: Community-Aggregat-Anzeige**:
  - Soft/Fair/Stiff wird als prozentualer Balken oder dominanter Trend (z.B. "Eher Soft (62%)") visualisiert.
  - Sterne werden als dezimaler Durchschnitt (z.B. "4.6 ★ (18)") gerendert.
- [x] **AC-9: Ascent-Feed / Begehungsliste**: Die Detailseite listet Kletterer auf, die den Boulder getoppt oder geflasht haben (Avatar, Nickname, Datum).

## Technical Design

### Data Model

```sql
CREATE TYPE ascent_type AS ENUM ('flash', 'top', 'project');
CREATE TYPE grade_feel AS ENUM ('soft', 'fair', 'stiff');

-- Begehungen / Logbuch
CREATE TABLE ascents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  boulder_id UUID REFERENCES boulders(id) ON DELETE CASCADE NOT NULL,
  type ascent_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, boulder_id)
);

-- Bewertungen
CREATE TABLE boulder_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boulder_id UUID REFERENCES boulders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  grade_feel grade_feel,
  quality_stars SMALLINT CHECK (quality_stars BETWEEN 1 AND 5),
  radar_kraft SMALLINT CHECK (radar_kraft BETWEEN 1 AND 5),
  radar_technik SMALLINT CHECK (radar_technik BETWEEN 1 AND 5),
  radar_balance SMALLINT CHECK (radar_balance BETWEEN 1 AND 5),
  radar_koordination SMALLINT CHECK (radar_koordination BETWEEN 1 AND 5),
  radar_flexibilitaet SMALLINT CHECK (radar_flexibilitaet BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, boulder_id)
);

-- Aggregierte View / Trigger-Cache für High Performance
CREATE VIEW boulder_stats_view AS
SELECT 
  b.id AS boulder_id,
  COUNT(DISTINCT r.id) AS total_ratings,
  ROUND(AVG(r.quality_stars), 1) AS avg_stars,
  COUNT(DISTINCT CASE WHEN r.grade_feel = 'soft' THEN r.id END) AS count_soft,
  COUNT(DISTINCT CASE WHEN r.grade_feel = 'fair' THEN r.id END) AS count_fair,
  COUNT(DISTINCT CASE WHEN r.grade_feel = 'stiff' THEN r.id END) AS count_stiff,
  COUNT(DISTINCT CASE WHEN a.type IN ('flash', 'top') THEN a.id END) AS total_tops,
  COUNT(DISTINCT CASE WHEN a.type = 'flash' THEN a.id END) AS total_flashes
FROM boulders b
LEFT JOIN boulder_ratings r ON r.boulder_id = b.id
LEFT JOIN ascents a ON a.boulder_id = b.id
GROUP BY b.id;
```

### Radar-Chart Aggregationsformel
Für jede Achse $A \in \{\text{Kraft}, \text{Technik}, \text{Balance}, \text{Koordination}, \text{Flexibilität}\}$:
$$\text{Wert}_A = \frac{W_{\text{setter}} \cdot \text{Initial}_A + \sum_{i=1}^N \text{User}_{i, A}}{W_{\text{setter}} + N}$$
wobei $W_{\text{setter}} = 5$ als Basisgewicht der Schrauber-Wertung dient und $N$ die Anzahl der Community-Ratings ist.

### UI / UX (Design System SPEC-005 Konform)
- **Detail-Modal / View**:
  - Solider Felsblock-Charakter (`0px` Radius, 1px Border `#333333`, Hintergrund `#1E1E1E`).
  - Großzügiger Schwarzraum, keine überladenen Schachtelungen.
- **Header**:
  - Farb-Badge des Boulders als Quadrat (`0px` Radius) mit Space Mono Grade-Label.
  - Name in Space Grotesk Bold Uppercase.
  - Sterne in Sandstein-Gold (`#C9A96E`).
  - Soft / Fair / Stiff Barometer in den erdigen SPEC-005 Tönen:
    - Soft: Moos-Grün (`#4A5D3A`)
    - Fair: Sandstein-Gold (`#C9A96E`)
    - Stiff: Lehm-Rot (`#A0522D`)
- **Radar-Chart**:
  - Pentagon-Netz mit 1px Granit-Linien (`#333333`), Fläche in semitransparentem Kreide-Sandstein.
  - Achsenbeschriftung in Space Mono.
- **Action Bar**:
  - Kantige Buttons (2px Radius), kein Farbverlauf.
  - Primärbutton "Loggen" in Kreide-Weiß (`#F5F0E8`) mit schwarzer Schrift.
  - Sekundärbutton "Bewerten" mit 1px Granit-Border (`#8B8680`).
- **Ascent-Feed**:
  - Quadratische Avatare (`0px` Radius, bewusst gegen den Kreis-Standard).
  - Listeneinträge mit 1px subtiler Trennlinie `#333333`.

## Dependencies
- Depends on: SPEC-001 (Gym & Sector), SPEC-002 (Boulders)
- Blocks: Feature #4 (Persönliche Statistiken & Grad-Verteilung)

## Out of Scope
- Freitext-Kommentarspalte oder Diskussionsforen (Post-MVP).
- Hochladen von Beta-Videos (Post-MVP).
- Community-Meldung von "abgeschraubt" (nur Setter/Admin in MVP).

## Open Questions
- Keine (im Grill-Me Interview geklärt).
