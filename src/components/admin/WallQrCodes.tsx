import React, { useMemo, useState } from 'react';
import { Printer, QrCode, X } from 'lucide-react';
import { getGyms, getSectors } from '../../lib/batchBoulderService';
import { buildWallLink, displayWallLink } from '../../lib/wallLink';
import { buildQrSvgData } from '../../lib/qrSvg';
import { useBackHandler } from '../../hooks/useBackHandler';

/**
 * SPEC-029 F6/F7 · Admin-Tab «Halle»: QR-Codes für die Wände drucken.
 * Ein Aufkleber pro Sektor, schwarz auf weiß, sehr großer Text.
 */

interface WallQrCodesProps {
  gymId: string;
}

export const WallQrCode: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const data = useMemo(() => buildQrSvgData(text), [text]);
  return (
    <svg
      viewBox={`0 0 ${data.size} ${data.size}`}
      className={className}
      role="img"
      aria-label={`QR-Code: ${text}`}
      data-testid="wall-qr-code"
      data-qr-text={text}
      shapeRendering="crispEdges"
    >
      <rect width={data.size} height={data.size} fill="#ffffff" />
      <path d={data.path} fill="#000000" />
    </svg>
  );
};

const PRINT_CSS = `
@media print {
  @page { size: A5 portrait; margin: 10mm; }
  body * { visibility: hidden !important; }
  [data-wall-qr-print], [data-wall-qr-print] * { visibility: visible !important; }
  [data-wall-qr-print] { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; overflow: visible !important; background: #fff !important; }
  [data-wall-qr-print] .wall-qr-no-print { display: none !important; }
  [data-wall-qr-print] .wall-qr-card { break-after: page; page-break-after: always; box-shadow: none !important; border: none !important; }
}
`;

export const WallQrCodes: React.FC<WallQrCodesProps> = ({ gymId }) => {
  const [isOpen, setIsOpen] = useState(false);

  useBackHandler({
    id: 'admin-wall-qr-sheet',
    isOpen,
    onBack: () => setIsOpen(false),
  });

  const gymName = useMemo(() => getGyms().find(g => g.id === gymId)?.name || '', [gymId, isOpen]);
  const sectors = useMemo(() => getSectors(gymId), [gymId, isOpen]);

  return (
    <section className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-3" data-testid="wall-qr-section">
      <div className="flex items-center gap-3">
        <QrCode className="w-6 h-6 text-[var(--bm-text)] shrink-0" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold text-[var(--bm-text)]">QR-Codes für die Wände</h3>
          <p className="text-[15px] text-[var(--bm-text-2)]">Ein Aufkleber pro Sektor. Scannen öffnet die Wand.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={sectors.length === 0}
        className="w-full min-h-[48px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        data-testid="wall-qr-print-btn"
      >
        <Printer className="w-5 h-5" aria-hidden />
        QR-Codes drucken
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--bm-bg)]"
          data-testid="wall-qr-sheet"
          data-wall-qr-print=""
          role="dialog"
          aria-modal="true"
          aria-label="QR-Codes drucken"
        >
          <style>{PRINT_CSS}</style>
          <div className="wall-qr-no-print sticky top-0 z-10 bg-[var(--bm-bg)] border-b border-[var(--bm-line)]">
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] px-3 rounded-xl text-[16px] font-semibold text-[var(--bm-text)] flex items-center gap-1.5 active:bg-[var(--bm-elevated)]"
                data-testid="wall-qr-close"
              >
                <X className="w-5 h-5" aria-hidden />
                Schließen
              </button>
              <span className="flex-1 text-center text-[16px] text-[var(--bm-text-2)] tabular-nums">
                {sectors.length} Aufkleber
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] px-4 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold flex items-center gap-2"
                data-testid="wall-qr-print-now"
              >
                <Printer className="w-5 h-5" aria-hidden />
                Drucken
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-4 grid gap-4 sm:grid-cols-2">
            {sectors.map(sector => (
              <article
                key={sector.id}
                className="wall-qr-card rounded-2xl bg-white text-black border border-black/15 px-5 py-6 flex flex-col items-center text-center gap-3"
                data-testid={`wall-qr-card-${sector.id}`}
              >
                <h4 className="text-[30px] leading-tight font-bold break-words w-full">{sector.name}</h4>
                {gymName && <p className="text-[18px] font-medium">{gymName}</p>}
                <WallQrCode text={buildWallLink(sector.id)} className="w-full max-w-[300px] aspect-square" />
                <p className="text-[22px] font-bold">Scannen und Boulder loggen</p>
                <p className="text-[13px] break-all" data-testid="wall-qr-link-text">{displayWallLink(sector.id)}</p>
                <p className="text-[15px] font-semibold">BoulderMate</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
