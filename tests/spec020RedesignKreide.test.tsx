import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { LandingPage } from '../src/components/LandingPage';
import { LoginModal } from '../src/components/LoginModal';
import { MobileBottomNav } from '../src/components/MobileBottomNav';
import { ProfileKPIsBar } from '../src/components/ProfileKPIsBar';
import { GradeDistributionChart } from '../src/components/GradeDistributionChart';
import { BoulderDetailModal } from '../src/components/BoulderDetailModal';
import { RadarChart } from '../src/components/RadarChart';
import { RatingModal } from '../src/components/RatingModal';
import { App } from '../src/App';
import { signOut } from '../src/lib/authService';
import { resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
import { GymGradeScale, WallBoulder, Sector, CurrentUser, GradeDistributionItem } from '../src/types/boulder';

/**
 * SPEC-020 §2.3 Palette «Kreide» + Text-Diät (06.10.2026)
 */

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf-8');

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--bm-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}
const darkStart = css.indexOf('@media (prefers-color-scheme: dark)');
const LIGHT = tokens(css.slice(0, darkStart));
const DARK = tokens(css.slice(darkStart));

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const scale = (over: Partial<GymGradeScale> = {}): GymGradeScale => ({
  id: 'scale-yellow', gymId: 'gym-test', colorName: 'Gelb', colorHex: '#FACC15',
  difficultyLabel: 'Leicht', fontRangeMin: '5a', fontRangeMax: '5c', sortOrder: 1, ...over,
});

describe('SPEC-020 Redesign «Kreide» & Text-Diät', () => {
  beforeEach(() => {
    localStorage.clear();
    signOut();
    resetAscentAndRatingStorage();
  });

  describe('Palette «Kreide» (index.css)', () => {
    it('definiert die Kreide-Tokens für hell und dunkel', () => {
      expect(LIGHT.bg).toBe('#F4F2EE');
      expect(LIGHT.accent).toBe('#1A1918');
      expect(LIGHT.star).toBe('#8C6A2A');
      expect(DARK.bg).toBe('#121110');
      expect(DARK.accent).toBe('#F4F2EE');
      expect(DARK.star).toBe('#D4B06A');
    });

    it('verwendet kein iOS-Systemblau mehr als UI-Akzent', () => {
      expect(css).not.toMatch(/#007AFF|#0A84FF/i);
    });

    it.each([
      ['hell', LIGHT],
      ['dunkel', DARK],
    ])('erreicht WCAG AA (4.5:1) für alle Text-Paare im %s-Modus', (_name, t) => {
      expect(contrast(t.text, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.text, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['text-2'], t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['text-2'], t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['on-accent'], t.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['on-accent'], t.success)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['on-accent'], t.danger)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.star, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.danger, t.surface)).toBeGreaterThanOrEqual(4.5);
    });

    it('enthält in Komponenten keine hart codierten Tailwind-Rot/Grün-Töne mehr', () => {
      const dir = path.join(root, 'src/components');
      const offenders = fs.readdirSync(dir)
        .filter(f => f.endsWith('.tsx'))
        .filter(f => /\b(?:text|bg|border)-(?:red|rose|emerald)-\d{2,3}\b/.test(fs.readFileSync(path.join(dir, f), 'utf-8')));
      expect(offenders).toEqual([]);
    });

    it('zeichnet das Radar mit Theme-Tokens statt fester Farben', () => {
      const { container } = render(<RadarChart data={{ technik: 3, balance: 3, koordination: 3, flexibilitaet: 3, maximalkraft: 3, kraftausdauer: 3 }} />);
      const html = container.innerHTML;
      expect(html).toContain('var(--bm-star)');
      expect(html).toContain('var(--bm-line)');
      expect(html).not.toMatch(/#C9A96E|#333333|#121212/i);
    });
  });

  describe('Landing (AC-9.1, AC-9.4)', () => {
    it('passt auf einen Screen: Claim, 3 Punkte, höchstens 40 Wörter', () => {
      const { container } = render(<LandingPage onOpenLogin={vi.fn()} />);
      const words = (container.textContent || '').trim().split(/\s+/).filter(Boolean);
      expect(words.length).toBeLessThanOrEqual(40);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.queryByText(/SWISS ALPS/i)).not.toBeInTheDocument();
    });

    it('zeigt Test-Profile nur im Dev-Build und nur mit onQuickLogin', () => {
      const { rerender } = render(<LandingPage onOpenLogin={vi.fn()} />);
      expect(screen.queryByTestId('quick-login-hans')).not.toBeInTheDocument();

      rerender(<LandingPage onOpenLogin={vi.fn()} onQuickLogin={vi.fn()} />);
      // Vitest läuft im Dev-Modus (import.meta.env.DEV === true)
      expect(import.meta.env.DEV).toBe(true);
      expect(screen.getByTestId('quick-login-hans')).toBeInTheDocument();
    });
  });

  describe('Login & Registrierung', () => {
    it('verlangt ein Passwort mit mindestens 6 Zeichen statt eines Standardpassworts', () => {
      render(<LoginModal isOpen onClose={vi.fn()} />);
      fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'neu@klettern.ch' } });
      fireEvent.click(screen.getByTestId('btn-register-submit'));
      expect(screen.getByText('Passwort braucht mindestens 6 Zeichen.')).toBeInTheDocument();
    });

    it('zeigt kein Test-Passwort und keine technischen Footer-Texte', () => {
      render(<LoginModal isOpen onClose={vi.fn()} />);
      expect(screen.queryByText(/Passwort: bouldermate2026/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Supabase Authentication/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Aktuell nicht angemeldet/i)).not.toBeInTheDocument();
    });
  });

  describe('App-Rahmen', () => {
    it('zeigt keinen Spec-/Entwickler-Footer', () => {
      render(<App />);
      expect(screen.queryByText(/SPEC-005 DESIGN SYSTEM/i)).not.toBeInTheDocument();
    });

    it('benennt den zweiten Tab «Ich»', () => {
      render(
        <MobileBottomNav
          activeTab="wall"
          onSelectTab={vi.fn()}
          canAccessPrivilegedWorkspace={false}
          onOpenRoleGateway={vi.fn()}
          onOpenLoginModal={vi.fn()}
          isLoggedIn
          nickname="Hans"
        />
      );
      expect(screen.getByText('Ich')).toBeInTheDocument();
      expect(screen.queryByText('Statistiken')).not.toBeInTheDocument();
    });
  });

  describe('Statistik', () => {
    it('zeigt Kennzahlen ohne Erklär-Untertitel', () => {
      render(<ProfileKPIsBar kpis={{ totalTops: 6, totalFlashes: 3, bestTop: scale(), bestFlash: scale() }} />);
      expect(screen.getByTestId('kpi-total-tops')).toHaveTextContent('6');
      for (const t of ['inkl. aller Flashes', 'im 1. Versuch', 'Fontainebleau-Maximum', 'Geflashtes Fb-Maximum']) {
        expect(screen.queryByText(t)).not.toBeInTheDocument();
      }
    });

    it('blendet nicht gekletterte Grade in der Gradverteilung aus', () => {
      const dist: GradeDistributionItem[] = [
        { fontGrade: '5a', displayGrade: 'Fb 5a', gradeScale: scale(), flashCount: 1, topCount: 1, totalCount: 2 },
        { fontGrade: '6a', displayGrade: 'Fb 6a', gradeScale: scale({ id: 'scale-blue', colorName: 'Blau' }), flashCount: 0, topCount: 0, totalCount: 0 },
      ];
      render(<GradeDistributionChart distribution={dist} />);
      expect(screen.getByText('Fb 5a')).toBeInTheDocument();
      expect(screen.queryByText('Fb 6a')).not.toBeInTheDocument();
    });
  });

  describe('Boulder-Detail', () => {
    const boulder: WallBoulder = {
      id: 'b-kreide-1', sectorId: 'sec-kreide', gradeScaleId: 'scale-yellow', positionX: 0.5, positionY: 0.5,
      name: 'Gelber Dynamo', setterId: '00000000-08ca-4000-8000-6e6f5bce818f', status: 'active',
      radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3, maximalkraft: 3, kraftausdauer: 3 },
      createdAt: '2026-10-01T10:00:00Z',
    };
    const sector: Sector = { id: 'sec-kreide', gymId: 'gym-test', name: 'Ecke Mitte', wallPhotoUrl: '/x.jpg', sortOrder: 1, createdAt: '2026-10-01T10:00:00Z' };
    const user: CurrentUser = { id: 'user-hans', nickname: 'Hans', role: 'member' };

    it('zeigt nie eine UUID, sondern den Schrauber-Namen oder «Hallenteam» (AC-6.2)', () => {
      render(<BoulderDetailModal boulder={boulder} sector={sector} gradeScale={scale()} currentUser={user} isOpen onClose={vi.fn()} />);
      expect(screen.getByText('Hallenteam')).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
    });

    it('verzichtet auf Emoji-Legenden und Erklär-Untertitel', () => {
      render(<BoulderDetailModal boulder={boulder} sector={sector} gradeScale={scale()} currentUser={user} isOpen onClose={vi.fn()} />);
      expect(document.body.textContent).not.toMatch(/🟢|🟡|🔴/);
      expect(screen.queryByText(/Klettercharakter \(5-Achsen Radar\)/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Aggregiert aus/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Deine Begehung \(Hans\)/)).not.toBeInTheDocument();
    });

    it('nutzt im Bewertungsdialog keine Farbkreise, die mit Grifffarben verwechselt werden', () => {
      render(<RatingModal boulder={boulder} gradeScale={scale()} currentUser={user} existingRating={null} isOpen onClose={vi.fn()} onSave={vi.fn()} />);
      expect(screen.getByText('Soft')).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/🟢|🟡|🔴/);
    });
  });
});
