import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Mail, QrCode, Share2, X } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import {
  DirectoryEntry,
  TEILNAHME_URL,
  buildHallenLink,
  buildMailto,
  buildShareText,
  createMyCode,
  dankeschoenText,
  formatCodeForReading,
  loadMyCode,
} from '../../lib/hallenVerzeichnis';
import { buildQrSvgData } from '../../lib/qrSvg';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';

interface HalleRedenSheetProps {
  open: boolean;
  onClose: () => void;
  entry: DirectoryEntry;
  userId: string | null;
  onRequestLogin?: () => void;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Großer QR-Code für die Theke (Runde 2, V9): weißer Grund, Ruhezone 4 Module, ≥ 260 px */
export const QrFullscreen: React.FC<{ link: string; onClose: () => void }> = ({ link, onClose }) => {
  const qr = useMemo(() => buildQrSvgData(link), [link]);
  return (
    <div
      className="fixed inset-0 z-[3000] bg-white text-[#1A1918] flex flex-col items-center justify-center gap-5 p-6"
      role="dialog"
      aria-label={t('QR-Code für die Hallenleitung')}
      data-testid="halle-qr-fullscreen"
    >
      <p className="text-[22px] font-bold text-center">{t('Scannen für die Hallenleitung')}</p>
      <svg
        viewBox={`0 0 ${qr.size} ${qr.size}`}
        className="w-[min(80vw,420px)] min-w-[260px] h-auto"
        shapeRendering="crispEdges"
        role="img"
        aria-label={link}
        data-testid="halle-qr-svg"
      >
        <rect width={qr.size} height={qr.size} fill="#FFFFFF" />
        <path d={qr.path} fill="#000000" />
      </svg>
      <button
        type="button"
        onClick={onClose}
        className="min-h-[52px] px-6 rounded-xl bg-[#1A1918] text-white text-[17px] font-semibold flex items-center gap-2"
        data-testid="halle-qr-close"
      >
        <X className="w-5 h-5" aria-hidden />
        {t('Schließen')}
      </button>
    </div>
  );
};

/**
 * SPEC-053 F3: «Mit der Halle reden» – Dankeschön, Tipps, fertiger Text, Teilen, QR, Empfehlungscode.
 * BoulderMate schreibt die Halle nie selbst an; die Person sendet.
 */
export const HalleRedenSheet: React.FC<HalleRedenSheetProps> = ({ open, onClose, entry, userId, onRequestLogin }) => {
  const [code, setCode] = useState<string | null>(null);
  const [adult, setAdult] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setQrOpen(false);
      setAdult(false);
      return;
    }
    let cancelled = false;
    loadMyCode(userId).then(c => {
      if (!cancelled) setCode(c);
    });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const link = buildHallenLink(entry.id, code);
  const text = buildShareText({ wishCount: entry.wishCount, link });

  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ text });
        return;
      } catch {
        // abgebrochen → nichts tun
        return;
      }
    }
    if (await copyText(text)) showToast({ message: t('Text kopiert') });
  };

  const copy = async () => {
    showToast({ message: (await copyText(text)) ? t('Text kopiert') : t('Kopieren nicht möglich') });
  };

  const makeCode = async () => {
    if (!userId || !adult) return;
    setCreating(true);
    const c = await createMyCode(userId, true);
    setCreating(false);
    if (c) setCode(c);
    else showToast({ message: t('Hat nicht geklappt. Bitte später nochmal.') });
  };

  return (
    <Sheet open={open} onClose={onClose} detent="full" testId="halle-reden-sheet" ariaLabel={t('Mit der Halle reden')}>
      <div className="px-4 pb-8 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[22px] font-bold">{t('Mit der Halle reden')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center"
            aria-label={t('Schließen')}
            data-testid="halle-reden-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <section className="rounded-2xl border-2 border-[var(--bm-text)] p-4 space-y-2" data-testid="halle-reden-dankeschoen">
          <h3 className="text-[19px] font-bold">{t('Dankeschön')}</h3>
          <p className="text-[16px]">
            {t('Eine Stufe, kein Schneeballsystem: Du bekommst nur etwas für die Halle, die du selbst vermittelst.')}
          </p>
          <p className="text-[17px] font-bold" data-testid="halle-reden-betrag">{dankeschoenText()}</p>
          <a href={TEILNAHME_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-[16px] underline font-semibold">
            {t('Teilnahmebedingungen')}
          </a>
        </section>

        <ul className="space-y-1.5 text-[16px] list-disc pl-5" data-testid="halle-reden-tipps">
          <li>{t('Einmal freundlich fragen reicht.')}</li>
          <li>{t('Am besten an die Hallenleitung, nicht ans Thekenteam.')}</li>
          <li>{t('Je mehr Wünsche, desto stärker das Argument.')}</li>
        </ul>

        <section className="space-y-2">
          <h3 className="text-[17px] font-bold">{t('Fertiger Text')}</h3>
          <p className="rounded-xl bg-[var(--bm-elevated)] p-3 text-[16px] break-words" data-testid="halle-reden-text">
            {text}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={share}
              className="min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold flex items-center justify-center gap-2"
              data-testid="halle-reden-share"
            >
              <Share2 className="w-5 h-5" aria-hidden />
              {t('Text teilen')}
            </button>
            <button
              type="button"
              onClick={copy}
              className="min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold flex items-center justify-center gap-2"
              data-testid="halle-reden-copy"
            >
              <Copy className="w-5 h-5" aria-hidden />
              {t('Kopieren')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold flex items-center justify-center gap-2"
            data-testid="halle-reden-qr"
          >
            <QrCode className="w-5 h-5" aria-hidden />
            {t('QR an der Theke zeigen')}
          </button>
          {entry.email && (
            <a
              href={buildMailto(entry.email, t('BoulderMate für {name}', { name: entry.name }), text)}
              className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold flex items-center justify-center gap-2"
              data-testid="halle-reden-mail"
            >
              <Mail className="w-5 h-5" aria-hidden />
              {t('E-Mail an die Halle')}
            </a>
          )}
        </section>

        <section className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-3" data-testid="halle-reden-code">
          {code ? (
            <>
              <p className="text-[16px]">{t('Dein Empfehlungscode steckt im Link:')}</p>
              <p className="text-[26px] font-bold tracking-[0.12em] tabular-nums" data-testid="halle-reden-code-value">
                {formatCodeForReading(code)}
              </p>
            </>
          ) : !userId ? (
            <>
              <p className="text-[16px]">{t('Teilen geht auch ohne Code, nur ohne Dankeschön.')}</p>
              <button
                type="button"
                onClick={onRequestLogin}
                className="min-h-[48px] px-4 rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[16px] font-semibold"
                data-testid="halle-reden-login"
              >
                {t('Anmelden, um ein Dankeschön zu bekommen')}
              </button>
            </>
          ) : (
            <>
              <h3 className="text-[17px] font-bold">{t('Dankeschön sichern')}</h3>
              <p className="text-[16px]">{t('Teilen geht auch ohne Code, nur ohne Dankeschön.')}</p>
              <label className="flex items-start gap-3 min-h-[44px] text-[16px]">
                <input
                  type="checkbox"
                  checked={adult}
                  onChange={e => setAdult(e.target.checked)}
                  className="mt-1 w-6 h-6 shrink-0 accent-[var(--bm-accent)]"
                  data-testid="halle-reden-adult"
                />
                <span>{t('Ich bin mindestens 18 Jahre alt und akzeptiere die Teilnahmebedingungen.')}</span>
              </label>
              <button
                type="button"
                disabled={!adult || creating}
                onClick={makeCode}
                className="min-h-[52px] w-full rounded-xl bg-[var(--bm-text)] text-[var(--bm-bg)] text-[17px] font-semibold disabled:opacity-40"
                data-testid="halle-reden-create-code"
              >
                {t('Code erstellen')}
              </button>
            </>
          )}
        </section>
      </div>
      {qrOpen && <QrFullscreen link={link} onClose={() => setQrOpen(false)} />}
    </Sheet>
  );
};
