import React, { useState } from 'react';
import {
  Mountain,
  Wrench,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  Shield,
  Star,
  LogIn,
  User,
  SlidersHorizontal,
  UserPlus,
  MessageSquare,
  Compass
} from 'lucide-react';
import { CLIMBER_FEATURES, SETTER_FEATURES } from '../data/landingContent';
import { AuthUser, DEMO_USERS } from '../lib/authService';

interface LandingPageProps {
  onOpenLogin: () => void;
  onQuickLogin?: (user: AuthUser) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onQuickLogin
}) => {
  // Role switcher state with primary focus on climber
  const [selectedRole, setSelectedRole] = useState<'climber' | 'setter'>('climber');
  const [activeClimberFeature, setActiveClimberFeature] = useState<number>(0);
  const [activeSetterFeature, setActiveSetterFeature] = useState<number>(0);

  const climberFeatures = CLIMBER_FEATURES;
  const setterFeatures = SETTER_FEATURES;

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
                  Wand-Topo & Community
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Strictly Landing / Login Only) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gast Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#121212] border border-[#333333] text-xs text-[#A89F91] font-mono">
              <User className="w-3.5 h-3.5 text-[#6B6358]" />
              <span>Gast</span>
            </div>

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
              className="px-3.5 py-1.5 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] text-xs font-headline uppercase font-bold tracking-wider transition hidden sm:inline-flex items-center gap-1.5"
              data-testid="landing-primary-start-btn"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Konto erstellen</span>
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
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>Der Begleiter für deine perfekte Boulder-Session</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-headline font-bold uppercase tracking-tight text-[#E8E0D4] leading-[1.1]">
            Erkennen, welche Boulder cool sind. <br />
            <span className="text-[#C9A96E] underline decoration-[#C9A96E]/40 underline-offset-8">
              Finden, was zu dir passt.
            </span>{' '}
            Tracken & gemeinsam knacken.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#A89F91] max-w-2xl mx-auto leading-relaxed font-sans">
            Deine Haut und Kraft sind zu kostbar für langweilige Züge: BoulderMate zeigt dir sofort die echten Highlights und Spaßgaranten deiner Halle, matcht Routen mit deinem persönlichen Style, loggt Tops mit kreidigen Fingern in zwei Taps und bringt den Beta-Talk direkt an den Boulder.
          </p>

          {/* Primary Action Buttons (Account Registration & Sign-in) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
              data-testid="hero-login-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>Kostenlos Konto erstellen</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {onQuickLogin && (
              <button
                type="button"
                onClick={() => onQuickLogin(DEMO_USERS['hans-kletterer'])}
                className="w-full sm:w-auto px-5 py-3 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#E8E0D4] border border-[#333333] hover:border-[#8B8680] font-headline uppercase font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition"
                data-testid="hero-quick-start-btn"
              >
                <Mountain className="w-4 h-4 text-[#86efac]" />
                <span>Direkt als Kletterer testen</span>
              </button>
            )}
          </div>

          {/* Fast Demo Accounts Bar (1-Click Test Drive) */}
          {onQuickLogin && (
            <div className="pt-6 border-t border-[#2A2A2A] max-w-xl mx-auto">
              <p className="text-[11px] font-mono text-[#6B6358] uppercase tracking-wider mb-2.5">
                Sofortiger Testzugang ohne Registrierung:
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
              <span>Community & Routenbau</span>
            </div>
            <h2 className="text-2xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
              Was BoulderMate für dich leistet
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
                  Das Herzstück von BoulderMate
                </span>
                <h3 className="text-xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                  Orientierung an der Wand, demokratische Grade & lückenloses Logging
                </h3>
                <p className="text-xs sm:text-sm text-[#A89F91] max-w-2xl">
                  Boulderer wollen klettern, Fortschritte feiern und sich austauschen. BoulderMate verbindet die reale Wand mit dem schnellsten 2-Tap-Logging und echter Community-Meinung.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#C9A96E] bg-[#121212] px-3 py-2 border border-[#333333]">
                <Sparkles className="w-4 h-4" />
                <span>5 Community-Säulen</span>
              </div>
            </div>

            {/* Climber Feature Cards & Visual Screenshot Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Feature Selection Pills */}
              <div className="lg:col-span-5 space-y-2.5">
                {climberFeatures.map((feat, idx) => {
                  const isActive = activeClimberFeature === idx;
                  return (
                    <div
                      key={feat.id}
                      onClick={() => setActiveClimberFeature(idx)}
                      className={`p-3.5 rounded-none border text-left cursor-pointer transition ${
                        isActive
                          ? 'bg-[#1E1E1E] border-[#F5F0E8] shadow-md ring-1 ring-[#F5F0E8]/20'
                          : 'bg-[#161616] border-[#333333] hover:border-[#6B6358] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                          {feat.title}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#333333] uppercase">
                          {feat.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#A89F91] leading-relaxed line-clamp-2">
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
                          <span>Wettkampfwand • Aktueller Schraubzyklus</span>
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
                          <div className="w-8 h-8 rounded-full bg-[#3b82f6] border-2 border-[#121212] ring-2 ring-[#C9A96E] flex items-center justify-center text-[11px] font-mono font-bold text-white shadow-xl">
                            6A+
                          </div>
                          <div className="mt-1 px-2 py-0.5 bg-[#1E1E1E] border border-[#C9A96E] text-[9px] font-mono text-[#C9A96E] font-bold rounded-none flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#C9A96E]" />
                            <span>Hallen-Highlight ★ 4.9</span>
                          </div>
                        </div>

                        <div className="absolute top-[40%] left-[78%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                          <div className="w-7 h-7 rounded-full bg-[#ef4444] border-2 border-[#121212] flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-lg">
                            7A
                          </div>
                          <span className="mt-1 px-1.5 py-0.5 bg-[#121212]/90 border border-[#333333] text-[9px] font-mono text-[#E8E0D4] rounded-none">
                            Rote Leiste
                          </span>
                        </div>
                      </>
                    )}

                    {climberFeatures[activeClimberFeature].previewType === 'logging' && (
                      <div className="absolute inset-x-4 bottom-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#F5F0E8]/40 p-4 rounded-none shadow-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-[#C9A96E] uppercase font-bold">2-Tap Chalk-Proof Logging</span>
                            <h4 className="text-sm font-headline font-bold text-[#E8E0D4]">Blaues Volumen-Problem (6A+)</h4>
                          </div>
                          <span className="px-2 py-0.5 bg-[#3b82f6] text-white text-[10px] font-mono font-bold">Überhang</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button type="button" className="p-2 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] text-center rounded-[2px] transition">
                            <span className="text-xs font-mono font-bold text-[#facc15] block">FLASH ⚡</span>
                            <span className="text-[9px] text-[#A89F91]">1. Versuch</span>
                          </button>
                          <button type="button" className="p-2 bg-[#F5F0E8] text-[#121212] border border-[#F5F0E8] text-center rounded-[2px] transition font-bold shadow-md">
                            <span className="text-xs font-mono block">TOP ✅</span>
                            <span className="text-[9px] text-[#121212]/80">Geschafft</span>
                          </button>
                          <button type="button" className="p-2 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] text-center rounded-[2px] transition">
                            <span className="text-xs font-mono font-bold text-[#f97316] block">PROJEKT 🎯</span>
                            <span className="text-[9px] text-[#A89F91]">In Arbeit</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {climberFeatures[activeClimberFeature].previewType === 'profile' && (
                      <div className="absolute inset-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#E8E0D4] font-bold text-xs">
                              H
                            </div>
                            <div>
                              <div className="text-xs font-headline font-bold text-[#E8E0D4]">Hans (Kletterer)</div>
                              <div className="text-[10px] font-mono text-[#A89F91]">6a plus Winterthur</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#4A5D3A] text-[#86efac]">Progression: U4 (6C–7A+)</span>
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
                        <div className="text-[10px] font-mono text-[#A89F91] flex items-center justify-between border-t border-[#333333] pt-2">
                          <span className="text-[#C9A96E]">5-Achsen: Maximalkraft & Balance</span>
                          <span className="text-[#86efac]">+12% über Hallenschnitt</span>
                        </div>
                      </div>
                    )}

                    {climberFeatures[activeClimberFeature].previewType === 'community' && (
                      <div className="absolute inset-x-4 bottom-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-headline font-bold text-[#E8E0D4]">Community Grade-Barometer</div>
                          <div className="flex items-center gap-1 text-[#facc15] text-xs font-bold font-mono">
                            <Star className="w-3.5 h-3.5 fill-[#facc15]" />
                            <span>4.8 (24 Kletterer)</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#A89F91]">
                            <span>Grad-Konsens der Community:</span>
                            <span className="text-[#86efac] font-bold">Fair bewertet (71%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#121212] rounded-none flex overflow-hidden border border-[#333333]">
                            <div style={{ width: '14%' }} className="bg-[#3b82f6]" title="Soft (14%)" />
                            <div style={{ width: '71%' }} className="bg-[#86efac]" title="Fair (71%)" />
                            <div style={{ width: '15%' }} className="bg-[#ef4444]" title="Stiff (15%)" />
                          </div>
                          <div className="flex justify-between text-[9px] font-mono text-[#6B6358]">
                            <span className="text-[#3b82f6]">Soft (14%)</span>
                            <span className="text-[#86efac]">Fair (71%)</span>
                            <span className="text-[#ef4444]">Stiff (15%)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {climberFeatures[activeClimberFeature].previewType === 'discussion' && (
                      <div className="absolute inset-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#C9A96E]" />
                            <span className="text-xs font-headline font-bold text-[#E8E0D4]">Beta-Talk am Boulder</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#86efac]">Gelbe Dachkante (6B+)</span>
                        </div>
                        <div className="space-y-2 py-2 text-xs font-sans">
                          <div className="bg-[#121212] p-2 border border-[#333333]">
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#A89F91] mb-0.5">
                              <span className="text-[#C9A96E] font-bold">Tim</span>
                              <span>vor 3 Std.</span>
                            </div>
                            <p className="text-[#E8E0D4] text-[11px]">
                              Rechts tief eindrehen und Heelhook an die Kante! Dann geht der Zug zum Top ganz dynamisch ohne Kraftaufwand.
                            </p>
                          </div>
                          <div className="bg-[#121212] p-2 border border-[#333333]">
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#A89F91] mb-0.5">
                              <span className="text-[#86efac] font-bold">Sarah</span>
                              <span>vor 1 Std.</span>
                            </div>
                            <p className="text-[#E8E0D4] text-[11px]">
                              Mega Beta, danke! Hat direkt im zweiten Versuch geklappt ⚡
                            </p>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-[#6B6358] border-t border-[#333333] pt-1">
                          Direkt an der Route geteilt • Keine externe Chat-App nötig
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
                  Routenbau & Schrauber-Studio
                </span>
                <h3 className="text-xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                  In unter 3 Minuten pro Wand von der Bohrmaschine ins digitale Topo
                </h3>
                <p className="text-xs sm:text-sm text-[#A89F91] max-w-2xl">
                  Digitalisiere neu geschraubte Sektoren in Rekordzeit. Pins per Fingertipp platzieren, alte Boulder archivieren und direktes Feedback der Kletterer von der Matte sehen.
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
                            <span className="text-[9px] font-mono text-[#C9A96E] uppercase font-bold">Batch-Erfassung</span>
                            <div className="text-xs font-headline font-bold text-[#E8E0D4]">Dachgrotte (8 Routen in 2:40 Min)</div>
                          </div>
                          <button type="button" className="px-3 py-1.5 bg-[#F5F0E8] text-[#121212] text-xs font-headline font-bold uppercase rounded-[2px]">
                            Alle freigeben ✓
                          </button>
                        </div>
                      </>
                    )}

                    {setterFeatures[activeSetterFeature].previewType === 'setter_feedback' && (
                      <div className="absolute inset-4 bg-[#1E1E1E]/95 backdrop-blur-md border border-[#333333] p-4 rounded-none shadow-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                          <div>
                            <div className="text-xs font-headline font-bold text-[#E8E0D4]">Resonanz der Kletterer</div>
                            <div className="text-[10px] font-mono text-[#A89F91]">Überhang 45° • 6a plus Winterthur</div>
                          </div>
                          <span className="px-2 py-0.5 bg-[#2A2A2A] text-[#C9A96E] text-[10px] font-mono border border-[#333333]">
                            73 Begehungen
                          </span>
                        </div>
                        <div className="space-y-2 py-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#E8E0D4]">Vorgeschlagen: 7A</span>
                            <span className="text-[#86efac]">Community: 7A (Fair)</span>
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

      {/* 4. Why BoulderMate: 3 Principles from the Constitution */}
      <section className="border-t border-b border-[#333333] bg-[#161616] py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-mono text-[#C9A96E] uppercase tracking-widest">
              Community • Schnelligkeit • Rollenklarheit
            </span>
            <h3 className="text-2xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
              Das sportliche & soziale Fundament für deine Halle
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="p-5 bg-[#1E1E1E] border border-[#333333] rounded-none space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
                <Compass className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                1. Coolness & Style-Match
              </h4>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                Nie wieder Energie an langweiligen Zügen verschwenden. Sieh sofort, welche Linien die echten Perlen deiner Halle sind und finde zielsicher Boulder, die zu deinem Kletterstil passen.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 bg-[#1E1E1E] border border-[#333333] rounded-none space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#F5F0E8]">
                <Zap className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                2. 2-Sekunden-Flow
              </h4>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                Gebaut für kreidige Finger direkt auf der Matte: Große Tasten, 2 Taps pro Begehung. Voller Fokus auf die Wand und deine nächste Session – null Display-Frust.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 bg-[#1E1E1E] border border-[#333333] rounded-none space-y-3">
              <div className="w-10 h-10 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#86efac]">
                <Shield className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                3. Matten-Community
              </h4>
              <p className="text-xs text-[#A89F91] leading-relaxed">
                Beta austauschen, Crux-Lösungen teilen und demokratische Grade im Barometer mitbestimmen. BoulderMate verbindet die Kletterer auf der Matte mit dem Routenbau an der Wand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Direct Conversion & Community Registration CTA */}
      <section className="py-14 sm:py-20 px-4 bg-[#121212]">
        <div className="max-w-3xl mx-auto text-center space-y-6 bg-[#1A1A1A] border border-[#333333] p-8 sm:p-12 rounded-none shadow-2xl relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2A2A2A] border border-[#333333] text-xs font-mono text-[#C9A96E] uppercase">
            <LogIn className="w-3.5 h-3.5" />
            <span>Werde Teil der BoulderMate Community</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
            Bereit, die besten Boulder deiner Halle zu entdecken?
          </h3>

          <p className="text-xs sm:text-sm text-[#A89F91] max-w-xl mx-auto leading-relaxed">
            Finde heraus, welche Routen der Community am meisten Spaß machen, matche deinen Style und tracke deine Tops in zwei Taps. Kostenlos registrieren oder direkt testen.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition"
              data-testid="footer-login-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>Jetzt kostenlos registrieren</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-5 py-3 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] font-headline uppercase font-semibold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-4 h-4 text-[#C9A96E]" />
              <span>Bereits registriert? Anmelden</span>
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
            <span>// DIE PLATTFORM FÜR INDOOR-BOULDERER & ROUTENBAU</span>
          </div>
          <div>
            <span>GEBAUT FÜR DIE MATTE • SWISS ALPS & APPALACHIAN GRANIT</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
