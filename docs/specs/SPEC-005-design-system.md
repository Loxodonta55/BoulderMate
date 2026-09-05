# SPEC-005: Design System & UI-Richtlinien

## Status: APPROVED

## Summary
Definiert das visuelle Fundament der BoulderApp: Farbpalette, Typografie, Formensprache, Texturen, Spacing, Ikonografie, Animation und Navigation. Die Ästhetik ist **Dark-Mode First**, roh und ehrlich – inspiriert von Granit, Sandstein, Kreide und Messing. Modern in der Reduktion, Old School im Charakter. Kein generischer Tech-App-Look, keine Glassmorphismus-Bubbles. Kantig, aufgeräumt, haptisch.

**Zielgruppe**: 20–50 Jahre, tendenziell alternativ, naturverbunden, problemlösungsorientiert. Menschen, die Effizienz schätzen und visuellen Clutter verachten.

---

## 1. Design-Philosophie

| Prinzip | Bedeutung |
|---|---|
| **Schlank** | Wenige Elemente pro Screen. Jeder Pixel muss seinen Platz verdienen. |
| **Aufgeräumt** | Klare Hierarchien, keine visuellen Konflikte. Ruhe statt Reizüberflutung. |
| **Modern** | Aktuelle Patterns (Bottom-Sheets, Tab-Navigation), keine veralteten Paradigmen. |
| **Old School** | Haptische Materialität. Fels, Kreide, Messing. Nicht: Neon, Gradient, Glass. |

### Anti-Patterns (Was wir NICHT sind)

| ❌ Vermeiden | ✅ Stattdessen |
|---|---|
| Glassmorphismus / Frosted Glass | Solide Flächen mit feiner Textur |
| Neon-Akzentfarben | Warme Naturtöne (Sandstein, Kreide, Messing) |
| Übermässige Animationen / Konfetti | Funktionale Mikro-Transitions |
| Rounded Pill-Shapes überall | Kantige, geometrische Formen |
| Gradient-Buttons | Flache, texturierte Buttons |
| Tech-Startup-Ästhetik | Bergsteiger-Plakat der 70er/80er |
| Überladene Screens | Grosszügiger Schwarzraum |

---

## 2. Farbpalette

### 2.1 Dark-Mode First

Die App ist primär für Dark-Mode gestaltet. Der dunkle Hintergrund hebt die farbigen Boulder-Badges optimal hervor und fühlt sich in der Halle (gedämpftes Licht) natürlich an.

#### Basis-Farben (Hintergrund & Oberflächen)

| Token | Hex | Verwendung |
|---|---|---|
| `--bg-primary` | `#121212` | Haupthintergrund (tiefer Granit) |
| `--bg-surface` | `#1E1E1E` | Karten, Sheets, erhöhte Flächen |
| `--bg-surface-elevated` | `#2A2A2A` | Modals, Dropdowns, Top-Layer |
| `--bg-subtle` | `#333333` | Trennlinien, inaktive Flächen |

#### Textfarben

| Token | Hex | Verwendung |
|---|---|---|
| `--text-primary` | `#E8E0D4` | Primärtext (warmes Off-White, Sandstein) |
| `--text-secondary` | `#A89F91` | Sekundärtext, Labels, Timestamps |
| `--text-muted` | `#6B6358` | Platzhalter, deaktivierter Text |

#### Akzentfarben (Naturtöne)

| Token | Hex | Name | Verwendung |
|---|---|---|---|
| `--accent-chalk` | `#F5F0E8` | Kreide-Weiss | Primäre Aktionen, aktive Zustände |
| `--accent-sandstone` | `#C9A96E` | Sandstein-Gold | Hervorhebungen, Sterne, Badges |
| `--accent-brass` | `#B8860B` | Messing | Sekundäre Akzente, Icons |
| `--accent-granite` | `#8B8680` | Granit-Grau | Bordüren, subtile Akzente |
| `--accent-moss` | `#4A5D3A` | Moos-Grün | Erfolg, bestätigt, Flash |
| `--accent-clay` | `#A0522D` | Lehm-Rot | Fehler, Warnung, Stiff |

#### Semantische Farben

| Token | Hex | Verwendung |
|---|---|---|
| `--status-success` | `#4A5D3A` | Erfolg (Moos-Grün) |
| `--status-warning` | `#C9A96E` | Warnung (Sandstein) |
| `--status-error` | `#A0522D` | Fehler (Lehm-Rot) |
| `--status-info` | `#8B8680` | Information (Granit) |

#### Soft / Fair / Stiff Farben

| Wert | Farbe | Hex |
|---|---|---|
| Soft 🟢 | Moos-Grün | `#4A5D3A` |
| Fair 🟡 | Sandstein-Gold | `#C9A96E` |
| Stiff 🔴 | Lehm-Rot | `#A0522D` |

> **Wichtig**: Die Hallenfarben (Grün, Blau, Gelb, Rot, etc.) für die Boulder-Badges verwenden kräftigere, gesättigtere Töne, die sich bewusst vom gedämpften UI-Farbschema abheben. Sie sind die einzigen "lauten" Farben in der App.

---

## 3. Typografie

### Markant & kantig – Old School Charakter

| Verwendung | Schrift | Gewicht | Grösse | Stil |
|---|---|---|---|---|
| **Headlines / H1** | Space Grotesk (oder Barlow Condensed) | Bold (700) | 28–32px | Uppercase, Letter-Spacing +1px |
| **Subtitles / H2** | Space Grotesk | Semi-Bold (600) | 20–24px | Normal |
| **Body** | Inter | Regular (400) | 16px | Normal, Line-Height 1.5 |
| **Body Small** | Inter | Regular (400) | 14px | Normal |
| **Labels / Caps** | Inter | Medium (500) | 12px | Uppercase, Letter-Spacing +1.5px |
| **Zahlen / Grade** | Space Mono (Monospace) | Bold (700) | Variabel | Tabular-Nums für Alignment |

### Typografie-Regeln
- Headlines immer **Uppercase** – erinnert an Bergsteiger-Plakate und Hallen-Beschriftungen
- Zahlen (Grade, Statistiken) in **Monospace** für tabellarische Ausrichtung
- Kein kursiver Text in der UI – widerspricht der kantigen Ästhetik
- Maximale Zeilenlänge: 65 Zeichen (Lesbarkeit)

---

## 4. Formensprache

### Kantig & Geometrisch

| Element | Border-Radius | Begründung |
|---|---|---|
| Karten / Cards | `0px` | Geschliffene Felsblöcke |
| Buttons | `2px` | Minimal, fast scharfkantig |
| Input-Felder | `0px` | Konsequent kantig |
| Bottom-Sheets | `0px` oben | Kein weiches Hereinrutschen |
| Avatare | `0px` (quadratisch) | Bewusst gegen den Kreis-Standard |
| Boulder-Pins auf Wandfoto | `50%` (Kreis) | Einzige Ausnahme – funktional begründet (Markierung) |
| Modals | `0px` | Block-Charakter |

### Schatten & Tiefe
- **Keine Drop-Shadows** – stattdessen subtile 1px Border in `--bg-subtle`
- Tiefe wird durch **Farbabstufung** erzeugt (surface → surface-elevated)
- Wandfotos erhalten einen subtilen **Inner-Shadow** (Vignette) für Tiefe

---

## 5. Texturen & Oberflächen

### Subtile Haptik

- **Granit-Noise**: Feines, kaum sichtbares Rauschen (2–3% Opacity) auf `--bg-primary` und `--bg-surface`. Gibt der App eine haptische Materialität.
- **Kreide-Patina**: Aktive/ausgewählte Elemente erhalten einen subtilen Kreide-Effekt (leicht aufgehellter, unregelmässiger Rand).
- **Kein Skeuomorphismus**: Die Texturen sind Stimmungsgeber, keine Realismus-Simulation.

### Anwendung

| Element | Textur |
|---|---|
| App-Hintergrund | Feines Granit-Noise |
| Karten-Oberflächen | Glatt (kein Noise, Kontrast zum Hintergrund) |
| Aktive Tab-Markierung | Kreide-artige Unterstreichung |
| Boulder-Pin (selektiert) | Kreide-Ring um den Pin |
| Leerer Zustand (Empty State) | Illustration im Kreide-Skizzen-Stil |

---

## 6. Spacing & Layout

### Grosszügiger Schwarzraum

| Token | Wert | Verwendung |
|---|---|---|
| `--space-xs` | `4px` | Innerhalb kompakter Elemente |
| `--space-sm` | `8px` | Zwischen verwandten Elementen |
| `--space-md` | `16px` | Standard-Abstand |
| `--space-lg` | `24px` | Zwischen Sektionen |
| `--space-xl` | `32px` | Zwischen Major-Blöcken |
| `--space-2xl` | `48px` | Screen-Padding, grosse Trenner |

### Layout-Regeln
- **Screen-Padding**: `--space-lg` (24px) links/rechts
- **Karten-Padding**: `--space-md` (16px) innen
- **Zwischen Karten**: `--space-md` (16px)
- **Zwischen Sektionen**: `--space-xl` (32px) + optionaler Label
- Lieber **scrollen** als Inhalte zusammenquetschen
- Maximale Content-Breite: Kein horizontales Scrollen, alles single-column

---

## 7. Ikonografie

### Reduziert & Ikonisch

- **Basis-Set**: Lucide Icons (2px Stroke, konsistente Geometrie)
- **Custom-Icons** (nur wo Kletter-Spezifik nötig):
  - Chalk-Bag → Profil-Tab
  - Fels/Berg → Hallen-Tab
  - Schraubenschlüssel → Schrauber-Tab
  - Blitz (⚡) → Flash
  - Zielscheibe (🎯) → Projekt
- **Grössen**: 24px in Navigation, 20px in Listen, 16px inline
- **Farbe**: `--text-secondary` (default), `--accent-chalk` (aktiv)

---

## 8. Animationen & Transitions

### Nur funktional – keine Show

| Aktion | Animation | Dauer |
|---|---|---|
| Bottom-Sheet öffnen | Slide-up mit ease-out | 250ms |
| Bottom-Sheet schliessen | Slide-down mit ease-in | 200ms |
| Tab-Wechsel | Crossfade | 150ms |
| Pin erscheint | Scale 0 → 1 mit ease-out | 200ms |
| Karte laden | Fade-in | 150ms |
| Button-Press | Opacity 0.7 (kein Scale) | 100ms |
| Swipen / Drag | Physik-basiert (Spring) | Natürlich |

### Verboten
- Bounce-Effekte
- Confetti / Particles
- Parallax-Scrolling
- Lottie-Animationen
- Entrance-Animationen für Texte

---

## 9. Navigation

### 3-Tab Bottom-Navigation

```
┌──────────────────────────────────────┐
│                                      │
│         [ Screen-Inhalt ]            │
│                                      │
├──────────┬──────────┬────────────────┤
│   🪨     │    🔧    │    Chalk-Bag   │
│  HALLE   │ SCHRAUBEN│    PROFIL      │
│          │ (nur     │                │
│          │  Setter) │                │
└──────────┴──────────┴────────────────┘
```

- **Kletterer sehen 2 Tabs**: Halle + Profil
- **Setter/Admins sehen 3 Tabs**: Halle + Schrauben + Profil
- Aktiver Tab: `--accent-chalk` (Kreide-Weiss) + leichte Kreide-Unterstreichung
- Inaktive Tabs: `--text-muted`
- Labels: Uppercase, `--space-xs` unter Icon, 10px Schriftgrösse

---

## 10. Komponenten-Bibliothek (Kern)

### Buttons

| Variante | Stil |
|---|---|
| Primary | `--accent-chalk` Background, `--bg-primary` Text, 2px Radius |
| Secondary | Transparent, 1px `--accent-granite` Border, `--text-primary` Text |
| Destructive | `--accent-clay` Background, Kreide-Weiss Text |
| Ghost | Kein Background/Border, `--text-secondary` Text |

### Karten (Cards)

```
┌─────────────────────────────┐  ← 0px Radius
│                             │  ← 1px Border in --bg-subtle
│   Inhalt                    │  ← --bg-surface Background
│                             │  ← 16px Padding
└─────────────────────────────┘
```

### Input-Felder

```
┌─────────────────────────────┐  ← 0px Radius
│  Placeholder-Text           │  ← --bg-surface Background
└─────────────────────────────┘  ← 1px Border-Bottom in --accent-granite
                                    Focus: --accent-chalk Border
```

### Boulder-Pin

```
    ┌───┐
    │ ● │  ← Kreis in Hallenfarbe (einziges rundes Element)
    └─┬─┘
      │    ← Kein Pointer/Pfeil, nur der Kreis
```
- Neuer Pin: Volle Farbe + 2px weisser Rand + subtiler Schatten
- Bestehender Pin: 40% Opacity
- Archiviert: Durchgestrichen (diagonale Linie)
- Ausgewählt: Kreide-Ring (pulsiert nicht, statisch)

---

## 11. Stimmungsbilder / Moodboard-Referenzen

Die App soll sich anfühlen wie:
- **Patagonia-Katalog** trifft **Schweizer Bergführer-Handbuch**
- **Alte Kletterhallen-Preisliste an der Theke** (Kreide auf Schiefertafel)
- **Vintage Bergsteiger-Equipment** (Messing-Karabiner, Hanfseil, Leder)
- **NOT**: Instagram, Strava, Nike Run Club, jede beliebige Fintech-App

---

## Acceptance Criteria
- [ ] **AC-1**: Die App verwendet Dark-Mode als Standard mit der definierten Granit/Sandstein/Kreide-Farbpalette.
- [ ] **AC-2**: Headlines nutzen eine kantige/kondensierte Schrift (Space Grotesk oder Barlow Condensed), Body nutzt Inter.
- [ ] **AC-3**: Alle UI-Elemente (Karten, Buttons, Inputs, Modals) haben einen Border-Radius von 0–2px (Ausnahme: Boulder-Pins).
- [ ] **AC-4**: Subtiles Granit-Noise ist auf Hintergrundflächen sichtbar.
- [ ] **AC-5**: Animationen sind auf funktionale Mikro-Transitions begrenzt (keine Bounce/Confetti/Parallax).
- [ ] **AC-6**: Bottom-Navigation zeigt 2 Tabs (Halle, Profil) für Kletterer und 3 Tabs (+Schrauben) für Setter/Admins.
- [ ] **AC-7**: Grosszügiges Spacing wird durchgängig eingehalten (kein visueller Clutter).
- [ ] **AC-8**: Die Hallenfarben der Boulder-Badges sind die einzigen kräftig gesättigten Farben in der UI.

## Dependencies
- Depends on: Keine (Fundament für alle Specs)
- Blocks: Alle UI-Implementierungen

## Out of Scope
- Light-Mode Variante (Post-MVP)
- Theming / benutzerdefinierte Farbschemata
- Brand-Logo / App-Icon Design (separate Design-Session)

## Open Questions
- Keine (im Grill-Me Interview geklärt).
