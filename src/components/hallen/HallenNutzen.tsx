import React from 'react';
import { Camera, CheckCircle2, MapPin, MessageSquareHeart, Repeat, ScanSearch, Sparkles } from 'lucide-react';
import { t } from '../../lib/i18n';
import { routenFotoSatz } from '../../lib/hallenVerzeichnis';

/**
 * SPEC-053 F10: «Warum BoulderMate für eure Halle» – Nutzen + «So einfach erfasst ihr Routen».
 * Wiederverwendbar: Seite «Für Hallen» (SPEC-053 F4), «Mit der Halle reden» (F3), Partner-Seite und Partner-Kit (SPEC-054).
 * Inhalte nur hier pflegen; Aussagen zur KI-Erfassung entsprechen SPEC-052 (Schrauber prüft immer, hat das letzte Wort).
 */

export interface NutzenPunkt {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  text: string;
}

/** Warum es sich für die Halle lohnt (Texte deutsch = Schlüssel für t()) */
export const HALLEN_NUTZEN = (): NutzenPunkt[] => [
  {
    icon: Repeat,
    title: t('Kletterer kommen öfter wieder'),
    text: t('Sie sehen sofort, was neu an der Wand ist, haben Projekte und kleine Challenges.'),
  },
  {
    icon: MessageSquareHeart,
    title: t('Ihr wisst, wie eure Routen ankommen'),
    text: t('Sterne, «zu leicht / passt / zu hart» und Tops pro Route – für Schrauber und Hallenleitung.'),
  },
  {
    icon: MapPin,
    title: t('Eure Halle wird gefunden'),
    text: t('Auf der BoulderMate-Karte mit allen aktuellen Routen. Für Kletterer kostenlos.'),
  },
];

/** So einfach werden Routen erfasst (SPEC-052) */
export const ROUTEN_ERFASSEN_SCHRITTE = (): NutzenPunkt[] => [
  {
    icon: Camera,
    title: t('Foto von der Wand'),
    text: t('Mit dem Handy, ein Foto pro Sektor. Beim Umschrauben einfach ein neues.'),
  },
  {
    icon: ScanSearch,
    title: t('BoulderMate erkennt die Routen'),
    text: t('Farbe oder Tape, Grad und Lage auf dem Foto – kein Abtippen Route für Route.'),
  },
  {
    icon: CheckCircle2,
    title: t('Kurz prüfen, veröffentlichen'),
    text: t('Eure Schrauber haben das letzte Wort und korrigieren, wo nötig.'),
  },
];

/** Ein Satz für Teilen-Texte (SPEC-053 F3, SPEC-054 F4) */
export const ROUTEN_FOTO_SATZ = routenFotoSatz;

interface HallenNutzenProps {
  /** «voll» = Überschriften + Erklärsätze (Seite «Für Hallen», Partner-Seite); «kurz» = nur Titel (Blätter) */
  variant?: 'voll' | 'kurz';
  testId?: string;
}

const Liste: React.FC<{ punkte: NutzenPunkt[]; kurz: boolean; nummeriert?: boolean; testId: string }> = ({ punkte, kurz, nummeriert, testId }) => (
  <ol className="space-y-3" data-testid={testId}>
    {punkte.map((p, i) => {
      const Icon = p.icon;
      return (
        <li key={p.title} className="flex items-start gap-3">
          <span
            className="w-11 h-11 shrink-0 rounded-xl bg-[var(--bm-text)] text-[var(--bm-bg)] flex items-center justify-center"
            aria-hidden
          >
            {nummeriert ? <span className="text-[19px] font-bold">{i + 1}</span> : <Icon className="w-6 h-6" aria-hidden />}
          </span>
          <span className="min-w-0">
            <span className="block text-[18px] font-bold leading-snug">{p.title}</span>
            {!kurz && <span className="block text-[16px] text-[var(--bm-text-2)] leading-snug mt-0.5">{p.text}</span>}
          </span>
        </li>
      );
    })}
  </ol>
);

export const HallenNutzen: React.FC<HallenNutzenProps> = ({ variant = 'voll', testId = 'hallen-nutzen' }) => {
  const kurz = variant === 'kurz';
  return (
    <div className="space-y-6" data-testid={testId}>
      <section className="space-y-3">
        <h2 className={`${kurz ? 'text-[18px]' : 'text-[21px]'} font-bold`}>{t('Warum BoulderMate für eure Halle?')}</h2>
        <Liste punkte={HALLEN_NUTZEN()} kurz={kurz} testId={`${testId}-gruende`} />
      </section>
      <section className="space-y-3 rounded-2xl border-2 border-[var(--bm-text)] p-4">
        <h2 className={`${kurz ? 'text-[18px]' : 'text-[21px]'} font-bold flex items-center gap-2`}>
          <Sparkles className="w-5 h-5" aria-hidden />
          {t('So einfach: Foto von der Wand')}
        </h2>
        <Liste punkte={ROUTEN_ERFASSEN_SCHRITTE()} kurz={kurz} nummeriert testId={`${testId}-schritte`} />
      </section>
    </div>
  );
};
