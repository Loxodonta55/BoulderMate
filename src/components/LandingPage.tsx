import React, { useState } from 'react';
import {
  Mountain,
  Wrench,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Shield,
  Star,
  Eye,
  LogIn,
  User,
  SlidersHorizontal,
  Flame,
  MessageSquare,
  TrendingUp,
  Scale
} from 'lucide-react';
import { AuthUser, DEMO_USERS } from '../lib/authService';

interface LandingPageProps {
  onOpenLogin: () => void;
  onExploreAsGuest: () => void;
  onQuickLogin?: (user: AuthUser) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onExploreAsGuest,
  onQuickLogin
}) => {
  // Role switcher state with primary focus on climber
  const [selectedRole, setSelectedRole] = useState<'climber' | 'setter'>('climber');
  const [activeClimberFeature, setActiveClimberFeature] = useState<number>(0);
  const [activeSetterFeature, setActiveSetterFeature] = useState<number>(0);

  const climberFeatures = [
    {
      id: 'community-ratings',
      title: 'Faire Grade & Beliebte Boulder',
      badge: 'Community-Power',
      tagline: 'Schluss mit unfairen Sandbags & grauer Theorie',
      description: 'Wie schwer ist die Route wirklich? Sieh sofort, welche Boulder in deiner Halle am beliebtesten sind und wie die Community den Grad einschätzt. Stimme mit Soft / Fair / Stiff ab und finde auf Anhieb die besten Linien der Halle.',
      bullets: [
        'Beliebte Boulder & Perlen der Halle auf einen Klick finden',
        'Faire Schwierigkeit: Transparenter Konsens (Soft, Fair, Stiff)',
        'Qualitäts-Ranking mit 5-Sterne-Bewertungen der Community'
      ],
      mockupImage: '/images/walls/roof.jpg',
      previewType: 'community' as const
    },
    {
      id: 'route-discussion',
      title: 'Routen-Diskussion & Beta-Tipps',
      badge: 'Austausch',
      tagline: 'Die Hallen-Diskussion direkt an der Route',
      description: 'Crux nicht verstanden oder genialen Hook entdeckt? Starte die Diskussion direkt am Boulder! Tausche Beta, Tritt-Empfehlungen und Lösungen mit deiner Hallen-Community aus.',
      bullets: [
        'Beta-Tipps & Crux-Lösungen direkt am Boulder austauschen',
        'Community-Diskussion über Routenführung & Griffe',
        'Kein langes Suchen: Diskussion ist direkt mit dem Pin verknüpft'
      ],
      mockupImage: '/images/walls/six-a-comp.jpg',
      previewType: 'discussion' as const
    },
    {
      id: 'performance-profile',
      title: 'Erfolge tracken & Selbsteinschätzung',
      badge: 'Progression',
      tagline: 'Stärken & Schwächen im Vergleich zur Community',
      description: 'Lerne deine Fähigkeiten objektiv einzuschätzen. Vergleiche deinen Kletterstil (Leisten, Sloper, Dynos, Beweglichkeit) mit dem Hallenschnitt. Erkenne sofort deine Stärken und gezielte Baustellen für das nächste Training.',
      bullets: [
        'Erfolge & persönliche Boulderpyramide verlässlich loggen',
        'Stärken- & Schwächen-Analyse mit 5-Achsen-Leistungsradar',
        'Objektiver Vergleich: Dein Kletterprofil vs. Hallenschnitt'
      ],
      mockupImage: '/images/walls/six-a-slab.jpg',
      previewType: 'profile' as const
    },
    {
      id: 'interactive-wall',
      title: 'Interaktive Wand & 2-Tap Logging',
      badge: 'Visual Topo',
      tagline: 'Reale Hallenfotos – für Chalk-Hände optimiert',
      description: 'Finde jeden Boulder direkt auf hochauflösenden Fotos deiner Wand. Mit eingekreideten Händen reicht ein zweiter Tap auf Flash ⚡, Top ✅ oder Projekt 🎯 – so bleibt der Kopf frei fürs Bouldern.',
      bullets: [
        'Echte Wandfotos mit farbcodierten Pins auf den Startgriffen',
        '2-Tap Chalk-Proof Logging in unter zwei Sekunden',
        'Sektoren-Filter: Überhang, Dach, Platte oder Wettkampfwand'
      ],
      mockupImage: '/images/walls/overhang.jpg',
      previewType: 'wall' as const
    }
  ];

  const setterFeatures = [
    {
      id: 'batch-workflow',
      title: 'Batch-Umschrauben in Rekordzeit',
      badge: 'Schrauber-Studio',
      tagline: 'Vom Akkuschrauber direkt ins digitale Topo',
      description: 'Vergiss handschriftliche Kladde-Listen oder Whiteboards. Foto des frischen Sektors aufnehmen, Pins per Drag & Drop auf die Start- und Zielgriffe setzen, Farben wählen – in unter 5 Minuten ist der Sektor online.',
      bullets: [
        'Schnell-Erfassung mehrerer Routen in einem Zug (Batch-Workflow)',
        'Drag-and-Drop Pin-Platzierung direkt auf dem Wandfoto',
        'Hallen-Farbsysteme & Zirkel flexibel zuweisbar'
      ],
      mockupImage: '/images/walls/six-a-roof.jpg',
      previewType: 'setter_studio' as const
    },
    {
      id: 'setter-feedback',
      title: 'Echtzeit-Feedback & Hallen-Monitoring',
      badge: 'Qualitätskontrolle',
      tagline: 'Wisse genau, wie deine Routen geklettert werden',
      description: 'Erhalte transparente Einblicke: Welche Boulder werden am meisten versucht? Wo weicht die Community-Meinung vom vorgeschlagenen Grad ab? Wie oft wird ein Sektor wiederholt?',
      bullets: [
        'Live-Statistiken über Begehungen & Flashes',
        'Barometer-Abweichungen zur schnellen Nachgradierung',
        'Archivierung alter Linien auf Knopfdruck bei Neuschrauben'
      ],
      mockupImage: '/images/walls/six-a-comp.jpg',
      previewType: 'setter_feedback' as const
    }
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-[#E8E0D4] font-sans selection:bg-[#C9A96E] selection:text-[#121212] flex flex-col">
      {/* 1. Standalone Minimalist Landing Header */}
      <header className="border-b border-[#333333] bg-[#1A1A1A]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E] shadow-sm">
              <Mountain className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                  BoulderMate
                </span>
                <span className="px-2 py-0.5 rounded-none text-[9px] font-mono font-semibold bg-[#2A2A2A] text-[#C9A96E] border border-[#C9A96E]/30 uppercase tracking-widest hidden sm:inline">
                  Digitales Wand-Topo
                </span>
              </div>
            </div>
          </div>

          {/* Quick Nav & Guest indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gast Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#121212] border border-[#333333] text-xs text-[#A89F91] font-mono">
              <User className="w-3.5 h-3.5 text-[#6B6358]" />
              <span>Gast</span>
            </div>

            {/* Explore as Guest */}
            <button
              type="button"
              onClick={onExploreAsGuest}
              className="px-3 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] border border-transparent hover:border-[#333333] transition hidden md:flex items-center gap-1.5"
              data-testid="explore-guest-btn"
            >
              <Eye className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>Gast-Modus</span>
            </button>

            {/* Login Trigger */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F5F0E8] text-[#E8E0D4] text-xs font-headline uppercase tracking-wider font-semibold flex items-center gap-1.5 transition shadow-sm"
              data-testid="login-modal-btn"
            >
              <LogIn className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>Anmelden</span>
            </button>

            {/* Primary Get Started CTA */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] text-xs font-headline uppercase font-bold tracking-wider transition hidden sm:inline-flex"
              data-testid="landing-primary-start-btn"
            >
              Starten
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative border-b border-[#333333] bg-[#161616] overflow-hidden py-14 sm:py-20 px-4">
        {/* Subtle Granite Texture Accent */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#C9A96E_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-[#1E1E1E] border border-[#333333] text-xs font-mono text-[#C9A96E] uppercase tracking-widest shadow-sm">
            <Flame className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>Community-Plattform für Hallenboulderer</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-headline font-bold uppercase tracking-tight text-[#E8E0D4] leading-[1.1]">
            Faire Grade. Beliebte Boulder. <br />
            <span className="text-[#C9A96E] underline decoration-[#C9A96E]/40 underline-offset-8">
              Erfolge & Community
            </span>{' '}
            an der Wand.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#A89F91] max-w-2xl mx-auto leading-relaxed font-sans">
            Schluss mit unklaren Graden und Rätselraten vor der Wand. BoulderMate gibt der Kletter-Community eine gemeinsame Stimme:
            Bewerte Routen fair, finde die beliebtesten Boulder deiner Halle, erkenne deine Stärken und Schwächen im Vergleich zu anderen und diskutiere Crux-Tipps & Beta direkt am Boulder.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
              data-testid="hero-login-btn"
            >
              <span>Jetzt anmelden & Rolle wählen</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onExploreAsGuest}
              className="w-full sm:w-auto px-5 py-3 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#E8E0D4] border border-[#333333] hover:border-[#8B8680] font-headline uppercase font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition"
              data-testid="hero-explore-guest-btn"
            >
              <Eye className="w-4 h-4 text-[#C9A96E]" />
              <span>Halle als Gast ansehen</span>
            </button>
          </div>

          {/* Fast Demo Accounts Bar (1-Click Test Drive) */}
          {onQuickLogin && (
            <div className="pt-6 border-t border-[#2A2A2A] max-w-xl mx-auto">
              <p className="text-[11px] font-mono text-[#6B6358] uppercase tracking-wider mb-2.5">
                Direkt-Login zum schnellen Ausprobieren:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onQuickLogin(DEMO_USERS['hans-kletterer'])}
                  className="px-2.5 py-1 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F5F0E8] text-xs font-mono text-[#E8E0D4] flex items-center gap-1.5 transition"
                  title="Als Hans (Kletterer) anmelden"
                  data-testid="quick-login-hans"
                >
                  <Mountain className="w-3.5 h-3.5 text-[#86efac]" />
                  <span>Hans (Kletterer)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onQuickLogin(DEMO_USERS['schrauber-6aplus'])}
                  className="px-2.5 py-1 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F5F0E8] text-xs font-mono text-[#E8E0D4] flex items-center gap-1.5 transition"
                  title="Als Schrauber anmelden"
                  data-testid="quick-login-schrauber"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>Schrauber 6aPlus</span>
                </button>

                <button
                  type="button"
                  onClick={() => onQuickLogin(DEMO_USERS['user-boris'])}
                  className="px-2.5 py-1 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F5F0E8] text-xs font-mono text-[#E8E0D4] flex items-center gap-1.5 transition"
                  title="Als Boris (OverAdmin) anmelden"
                  data-testid="quick-login-boris"
                >
                  <Shield className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>Boris (OverAdmin)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Role Splitter & Interactive Explanations (Kletterer-Fokus) */}
      <section className="max-w-6xl w-full mx-auto px-4 py-12 sm:py-16 space-y-10">
        {/* Role Selection Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#333333] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#C9A96E] uppercase tracking-wider mb-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Zielgruppen-Fokus</span>
            </div>
            <h2 className="text-2xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
              Erfahre, was BoulderMate für dich kann
            </h2>
          </div>

          {/* Segmented Role Control */}
          <div className="flex items-center p-1 rounded-none bg-[#1A1A1A] border border-[#333333]">
            <button
              type="button"
              onClick={() => setSelectedRole('climber')}
              className={`px-4 py-2 rounded-[2px] text-xs font-headline uppercase tracking-wider font-bold flex items-center gap-2 transition ${
                selectedRole === 'climber'
                  ? 'bg-[#2A2A2A] text-[#F5F0E8] border border-[#F5F0E8]/40 shadow-sm'
                  : 'text-[#A89F91] hover:text-[#E8E0D4]'
              }`}
              data-testid="role-tab-climber"
            >
              <Mountain className="w-4 h-4 text-[#C9A96E]" />
              <span>Für Kletterer</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#4A5D3A] text-[#86efac] border border-[#86efac]/30 uppercase ml-1">
                Fokus
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('setter')}
              className={`px-4 py-2 rounded-[2px] text-xs font-headline uppercase tracking-wider font-bold flex items-center gap-2 transition ${
                selectedRole === 'setter'
                  ? 'bg-[#2A2A2A] text-[#F5F0E8] border border-[#F5F0E8]/40 shadow-sm'
                  : 'text-[#A89F91] hover:text-[#E8E0D4]'
              }`}
              data-testid="role-tab-setter"
            >
              <Wrench className="w-4 h-4 text-[#C9A96E]" />
              <span>Für Schrauber & Routenbau</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content based on selected role */}
        {selectedRole === 'climber' ? (
          /* CLIMBER ROLE SHOWCASE (PRIMARY FOCUS) */
          <div className="space-y-8">
            <div className="bg-[#1E1E1E] border border-[#333333] p-4 sm:p-6 rounded-none flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#86efac] uppercase tracking-widest">
                  Haupt-Fokus Klettersport
                </span>
                <h3 className="text-xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                  Maximale Orientierung vor der Wand, null Frust mit Chalk-Fingern
                </h3>
                <p className="text-xs sm:text-sm text-[#A89F91] max-w-2xl">
                  Boulderer wollen klettern, nicht tippen. BoulderMate reduziert alles auf visuelle Klarheit an der Wand und das schnellste 2-Tap-Logging.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#C9A96E] bg-[#121212] px-3 py-2 border border-[#333333]">
                <Sparkles className="w-4 h-4" />
                <span>95% Community-Nutzung</span>
              </div>
            </div>

            {/* Climber Feature Cards & Visual Screenshot Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Feature Selection Pills */}
              <div className="lg:col-span-5 space-y-3">
                {climberFeatures.map((feat, idx) => {
                  const isActive = activeClimberFeature === idx;
                  return (
                    <div
                      key={feat.id}
                      onClick={() => setActiveClimberFeature(idx)}
                      className={`p-4 rounded-none border text-left cursor-pointer transition ${
                        isActive
                          ? 'bg-[#1E1E1E] border-[#F5F0E8] shadow-md ring-1 ring-[#F5F0E8]/20'
                          : 'bg-[#161616] border-[#333333] hover:border-[#6B6358] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                          {feat.title}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#333333] uppercase">
                          {feat.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#A89F91] leading-relaxed">
                        {feat.tagline}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: High-Fidelity Screenshot / Interactive Mockup */}
              <div className="lg:col-span-7 bg-[#1A1A1A] border border-[#333333] p-5 rounded-none flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#A0522D]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4A5D3A]" />
                      <span className="text-[11px] font-mono text-[#A89F91] ml-2">
                        Vorschau: {climberFeatures[activeClimberFeature].title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#6B6358]">
                      Echtzeit-Ansicht
                    </span>
                  </div>

                  {/* Screenshot Visual Frame */}
                  <div className="relative rounded-none overflow-hidden border border-[#333333] bg-[#121212] aspect-[16/10] flex items-center justify-center">
                    <img
                      src={climberFeatures[activeClimberFeature].mockupImage}
                      alt={climberFeatures[activeClimberFeature].title}
                      className="w-full h-full object-cover object-center filter brightness-90"
                    />

                    {/* Dynamic Simulated Overlays based on active feature */}
                    {climberFeatures[activeClimberFeature].previewType === 'wall' && (
                      <>
                        {/* Sektor Pill on Wall */}
                        <div className="absolute top-3 left-3 bg-[#1E1E1E]/90 backdrop-blur-sm border border-[#333333] px-3 py-1 text-xs font-mono text-[#E8E0D4] flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#C9A96E]" />
                          <span>Sektor: Wettkampfwand (Comp Wall)</span>
                        </div>

                        {/* Interactive Pins on Wall */}
                        <div className="absolute top-[35%] left-[28%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer animate-pulse">
                          <div className="w-7 h-7 rounded-full bg-[#eab308] border-2 border-[#121212] flex items-center justify-center text-[10px] font-mono font-bold text-[#121212] shadow-lg">
                            4+
                          </div>
                          <span className="mt-1 px-1.5 py-0.5 bg-[#121212]/90 border border-[#333333] text-[9px] font-mono text-[#E8E0D4] rounded-none">
                            Gelbe Linie
                          </span>
                        </div>

                        <div className="absolute top-[55%] left-[52%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-[#3b82f6] border-2 border-[#121212] ring-2 ring-[#F5F0E8] flex items-center justify-center text-[11px] font-mono font-bold text-white shadow-xl">
                            6A+
                          </div>
                          <span className="mt-1 px-1.5 py-0.5 bg-[#1E1E1E] border border-[#C9A96E] text-[9px] font-mono text-[#C9A96E] font-bold rounded-none">
                            Blaues Volumen
                          </span>
                        </div>

                        <div className="absolute top-[40%] left-[78%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                          <div className="w-7 h-7 rounded-full bg-[#ef4444] border-2 border-[#121212] flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-lg">
                            7A
                          </div>
                          <span className="mt-1 px-1.5 py-0.5 bg-[#121212]/90 border border-[#333333] text-[9px] font-mono text-[#E8E0D4] rounded-none">
                            Rote Leiste
                          </span>
                        </div>

                        {/* 2-Tap Logging Bottom Drawer on Wall */}
                        <div className="absolute inset-x-3 bottom-3 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#F5F0E8]/40 p-3 rounded-none shadow-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#C9A96E] uppercase font-bold">2-Tap Schnelleintrag</span>
                            <span className="text-[10px] font-mono text-[#A89F91]">Chalk-Proof</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button type="button" className="p-1.5 bg-[#2A2A2A] text-center rounded-[2px]">
                              <span className="text-xs font-mono font-bold text-[#facc15] block">FLASH ⚡</span>
                            </button>
                            <button type="button" className="p-1.5 bg-[#F5F0E8] text-[#121212] text-center rounded-[2px] font-bold shadow-md">
                              <span className="text-xs font-mono block">TOP ✅</span>
                            </button>
                            <button type="button" className="p-1.5 bg-[#2A2A2A] text-center rounded-[2px]">
                              <span className="text-xs font-mono font-bold text-[#f97316] block">PROJEKT 🎯</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {climberFeatures[activeClimberFeature].previewType === 'profile' && (
                      <div className="absolute inset-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#E8E0D4] font-bold text-xs">
                              H
                            </div>
                            <div>
                              <div className="text-xs font-headline font-bold text-[#E8E0D4]">HansDereinfacheKletterer</div>
                              <div className="text-[10px] font-mono text-[#A89F91]">6a plus Winterthur</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#4A5D3A] text-[#86efac]">U4 (6C–7A+)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 text-center">
                          <div className="p-2 bg-[#121212] border border-[#333333]">
                            <div className="text-xs font-mono font-bold text-[#C9A96E]">7A</div>
                            <div className="text-[9px] text-[#6B6358] uppercase">Bester Top</div>
                          </div>
                          <div className="p-2 bg-[#121212] border border-[#333333]">
                            <div className="text-xs font-mono font-bold text-[#facc15]">6B+</div>
                            <div className="text-[9px] text-[#6B6358] uppercase">Bester Flash</div>
                          </div>
                          <div className="p-2 bg-[#121212] border border-[#333333]">
                            <div className="text-xs font-mono font-bold text-[#86efac]">48</div>
                            <div className="text-[9px] text-[#6B6358] uppercase">Geloggte Tops</div>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-[#A89F91] flex items-center justify-between">
                          <span>Universelle Fontainebleau-Bänder</span>
                          <span className="text-[#C9A96E]">Hallenübergreifend aktiv</span>
                        </div>
                      </div>
                    )}

                    {climberFeatures[activeClimberFeature].previewType === 'discussion' && (
                      <div className="absolute inset-x-4 bottom-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl space-y-2.5">
                        <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-[#C9A96E]" />
                            <span className="text-xs font-headline font-bold text-[#E8E0D4]">Routen-Diskussion & Beta (6A+ Blau)</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#86efac]">Live Community Feed</span>
                        </div>
                        <div className="space-y-1.5 text-xs font-sans">
                          <div className="p-2 bg-[#121212] border border-[#333333]">
                            <span className="font-mono font-bold text-[#C9A96E] text-[11px]">Hans: </span>
                            <span className="text-[#E8E0D4] text-[11px]">Rechten Fuß hoch auf die Kante, dann ist der Dyno ein Kinderspiel! 🧗‍♂️</span>
                          </div>
                          <div className="p-2 bg-[#121212] border border-[#333333]">
                            <span className="font-mono font-bold text-[#A89F91] text-[11px]">Sara: </span>
                            <span className="text-[#E8E0D4] text-[11px]">Danke für den Tipp, hat sofort im 2. Versuch geklappt! ⭐</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {climberFeatures[activeClimberFeature].previewType === 'community' && (
                      <div className="absolute inset-x-4 bottom-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-headline font-bold text-[#E8E0D4]">Community Schwierigkeits-Konsens & Beliebtheit</div>
                          <div className="flex items-center gap-1 text-[#facc15] text-xs font-bold font-mono">
                            <Star className="w-3.5 h-3.5 fill-[#facc15]" />
                            <span>4.9 (28 Bewertungen)</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#A89F91]">
                            <span>Grad-Empfinden Barometer:</span>
                            <span className="text-[#86efac] font-bold">Eher Fair (68%) • Beliebter Boulder #1</span>
                          </div>
                          <div className="w-full h-2 bg-[#121212] rounded-none flex overflow-hidden border border-[#333333]">
                            <div style={{ width: '15%' }} className="bg-[#3b82f6]" title="Soft (15%)" />
                            <div style={{ width: '68%' }} className="bg-[#86efac]" title="Fair (68%)" />
                            <div style={{ width: '17%' }} className="bg-[#ef4444]" title="Hard (17%)" />
                          </div>
                          <div className="flex justify-between text-[9px] font-mono text-[#6B6358]">
                            <span>Soft (15%)</span>
                            <span>Fair (68%)</span>
                            <span>Hard (17%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanatory Description & Bullets */}
                <div className="mt-4 pt-4 border-t border-[#333333] space-y-3">
                  <p className="text-xs sm:text-sm text-[#E8E0D4] leading-relaxed">
                    {climberFeatures[activeClimberFeature].description}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#A89F91] font-mono">
                    {climberFeatures[activeClimberFeature].bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SETTER ROLE SHOWCASE (SECONDARY FOCUS) */
          <div className="space-y-8">
            <div className="bg-[#1E1E1E] border border-[#333333] p-4 sm:p-6 rounded-none flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                  Routenbau & Hallen-Betrieb
                </span>
                <h3 className="text-xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                  Vom Schrauberschlüssel direkt in die Community
                </h3>
                <p className="text-xs sm:text-sm text-[#A89F91] max-w-2xl">
                  Digitalisiere neu geschraubte Sektoren in Rekordzeit. Pins per Fingertipp platzieren, alte Boulder archivieren und direktes Feedback der Kletterer sehen.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#A89F91] bg-[#121212] px-3 py-2 border border-[#333333]">
                <Wrench className="w-4 h-4 text-[#C9A96E]" />
                <span>Schrauber-Studio</span>
              </div>
            </div>

            {/* Setter Feature Cards & Visual Screenshot Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Feature Selection */}
              <div className="lg:col-span-5 space-y-3">
                {setterFeatures.map((feat, idx) => {
                  const isActive = activeSetterFeature === idx;
                  return (
                    <div
                      key={feat.id}
                      onClick={() => setActiveSetterFeature(idx)}
                      className={`p-4 rounded-none border text-left cursor-pointer transition ${
                        isActive
                          ? 'bg-[#1E1E1E] border-[#F5F0E8] shadow-md ring-1 ring-[#F5F0E8]/20'
                          : 'bg-[#161616] border-[#333333] hover:border-[#6B6358] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                          {feat.title}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#333333] uppercase">
                          {feat.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#A89F91] leading-relaxed">
                        {feat.tagline}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Screenshot / Interactive Mockup */}
              <div className="lg:col-span-7 bg-[#1A1A1A] border border-[#333333] p-5 rounded-none flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#A0522D]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4A5D3A]" />
                      <span className="text-[11px] font-mono text-[#A89F91] ml-2">
                        Vorschau: {setterFeatures[activeSetterFeature].title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#6B6358]">
                      Schrauber-Modus
                    </span>
                  </div>

                  {/* Screenshot Visual Frame */}
                  <div className="relative rounded-none overflow-hidden border border-[#333333] bg-[#121212] aspect-[16/10] flex items-center justify-center">
                    <img
                      src={setterFeatures[activeSetterFeature].mockupImage}
                      alt={setterFeatures[activeSetterFeature].title}
                      className="w-full h-full object-cover object-center filter brightness-85"
                    />

                    {setterFeatures[activeSetterFeature].previewType === 'setter_studio' && (
                      <>
                        {/* Crosshair Tooltip */}
                        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full border border-dashed border-[#F5F0E8] flex items-center justify-center animate-spin">
                            <div className="w-2 h-2 rounded-full bg-[#C9A96E]" />
                          </div>
                          <span className="mt-1 px-2 py-0.5 bg-[#1E1E1E] border border-[#333333] text-[9px] font-mono text-[#E8E0D4]">
                            Pin auf Griff setzen
                          </span>
                        </div>

                        {/* Batch Drawer Mockup at bottom */}
                        <div className="absolute inset-x-4 bottom-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-3 rounded-none shadow-2xl flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-mono text-[#C9A96E] uppercase font-bold">Entwurf aktiv</span>
                            <div className="text-xs font-headline font-bold text-[#E8E0D4]">Dachgrotte (5 Routen im Batch)</div>
                          </div>
                          <button type="button" className="px-3 py-1.5 bg-[#F5F0E8] text-[#121212] text-xs font-headline font-bold uppercase rounded-[2px]">
                            Alle freigeben
                          </button>
                        </div>
                      </>
                    )}

                    {setterFeatures[activeSetterFeature].previewType === 'setter_feedback' && (
                      <div className="absolute inset-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                          <div>
                            <div className="text-xs font-headline font-bold text-[#E8E0D4]">Live-Feedback der Kletterer</div>
                            <div className="text-[10px] font-mono text-[#A89F91]">Überhang 45° • 6a plus Winterthur</div>
                          </div>
                          <span className="px-2 py-0.5 bg-[#2A2A2A] text-[#C9A96E] text-[10px] font-mono border border-[#333333]">
                            73 Begehungen
                          </span>
                        </div>
                        <div className="space-y-2 py-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#E8E0D4]">Vorgeschlagen: 7A</span>
                            <span className="text-[#86efac]">Konsens: 7A (Fair)</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#E8E0D4]">Flash-Quote: 24%</span>
                            <span className="text-[#facc15]">Beliebtheit: ★ 4.9</span>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-[#6B6358] border-t border-[#333333] pt-2">
                          Routenbauer-ID: schrauber-6aplus • Zuletzt geprüft vor 2 Std.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanatory Description & Bullets */}
                <div className="mt-4 pt-4 border-t border-[#333333] space-y-3">
                  <p className="text-xs sm:text-sm text-[#E8E0D4] leading-relaxed">
                    {setterFeatures[activeSetterFeature].description}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#A89F91] font-mono">
                    {setterFeatures[activeSetterFeature].bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Why BoulderMate: Minimalist 3-Pillar Grid */}
      <section className="border-t border-b border-[#333333] bg-[#161616] py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-mono text-[#C9A96E] uppercase tracking-widest">
              Schlank • Standalone • Aufgeräumt
            </span>
            <h3 className="text-2xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
              Drei Prinzipien für dein Klettererlebnis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="p-5 bg-[#1E1E1E] border border-[#333333] rounded-none space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
                <Scale className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                1. Faire Einstufung
              </h4>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                Kein Frust mehr über subjektive Grade: Das Community-Barometer (Soft/Fair/Stiff) und Sterne-Ratings sorgen für maximale Transparenz an jeder Route.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 bg-[#1E1E1E] border border-[#333333] rounded-none space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#F5F0E8]">
                <MessageSquare className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                2. Community & Beta-Talk
              </h4>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                Finde auf Knopfdruck die beliebtesten Routen der Halle. Starte die Diskussion über Kniffe, Crux-Züge und Beta direkt am Pin des Boulders.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 bg-[#1E1E1E] border border-[#333333] rounded-none space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#86efac]">
                <TrendingUp className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                3. Selbsteinschätzung & Fortschritt
              </h4>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                Erfolge mit 2-Tap-Logging festhalten. Vergleiche deinen Kletterstil objektiv mit anderen Nutzern und erkenne deine Stärken und Trainingspotenziale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Direct Conversion & Role Selection CTA */}
      <section className="py-14 sm:py-20 px-4 bg-[#121212]">
        <div className="max-w-3xl mx-auto text-center space-y-6 bg-[#1A1A1A] border border-[#333333] p-8 sm:p-12 rounded-none shadow-2xl relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2A2A2A] border border-[#333333] text-xs font-mono text-[#C9A96E] uppercase">
            <LogIn className="w-3.5 h-3.5" />
            <span>Bereit für den nächsten Boulder?</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
            Melde dich an & wähle deinen Arbeitsbereich
          </h3>

          <p className="text-xs sm:text-sm text-[#A89F91] max-w-xl mx-auto leading-relaxed">
            Als Kletterer landest du direkt in der Hallen-Wandansicht deines Homegyms. Als Schrauber oder Hallen-Admin öffnet sich die direkte Bereichswahl (Role Gateway).
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition"
              data-testid="footer-login-btn"
            >
              <span>Anmelden / Account wählen</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onExploreAsGuest}
              className="w-full sm:w-auto px-5 py-3 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] font-headline uppercase font-semibold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition"
              data-testid="footer-explore-guest-btn"
            >
              <Eye className="w-4 h-4 text-[#C9A96E]" />
              <span>Zuerst als Gast ansehen</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Clean, Minimalist Footer */}
      <footer className="border-t border-[#333333] bg-[#101010] py-6 px-4 text-center text-xs text-[#6B6358] font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-[#C9A96E]" />
            <span className="text-[#A89F91] font-bold">BOULDERMATE</span>
            <span>// DIGITALES WAND-TOPO & ROUTENBAU</span>
          </div>
          <div>
            <span>SPEC-005 DESIGN SYSTEM • APPALACHIAN / SWISS ALPS GRANIT</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
