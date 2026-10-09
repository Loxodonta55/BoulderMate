import React, { useEffect, useState } from 'react';
import { Bug, Lightbulb, Heart, Check, CircleCheck } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import {
  FeedbackCategory,
  FeedbackResult,
  FEEDBACK_MAX_LENGTH,
  isFeedbackRateLimited,
  submitFeedback,
  validateFeedbackMessage,
} from '../lib/feedbackService';

/**
 * SPEC-026 · «Feedback geben»: Art wählen (Fehler / Idee / Lob), Text, optional Kontakt.
 * Große Bedienelemente (F14): Kacheln ≥ 76 px, Text 17 px, Absenden 56 px.
 */
export interface FeedbackSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  nickname: string;
  email?: string;
  gymId?: string;
  gymName?: string;
  /** Woher das Feedback kommt (F7): 'settings' oder 'header' */
  appView?: string;
}

const CATEGORIES: { id: FeedbackCategory; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: 'bug', label: 'Fehler', icon: <Bug className="w-7 h-7" />, placeholder: 'Was ist passiert? Was hast du davor gemacht?' },
  { id: 'idea', label: 'Idee', icon: <Lightbulb className="w-7 h-7" />, placeholder: 'Was wünschst du dir?' },
  { id: 'praise', label: 'Lob', icon: <Heart className="w-7 h-7" />, placeholder: 'Was gefällt dir?' },
];

export const FeedbackSheet: React.FC<FeedbackSheetProps> = ({ open, onClose, userId, nickname, email, gymId, gymName, appView = 'settings' }) => {
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [contactOk, setContactOk] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategory(null);
    setMessage('');
    setContactOk(false);
    setSending(false);
    setResult(null);
    setRateLimited(isFeedbackRateLimited());
  }, [open]);

  const valid = category !== null && validateFeedbackMessage(message) === 'ok';
  const canSubmit = valid && !sending && !rateLimited;
  const placeholder = CATEGORIES.find(c => c.id === category)?.placeholder ?? 'Wähle oben zuerst, worum es geht.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !category) return;
    setSending(true);
    const res = await submitFeedback({ category, message, contactOk, userId, nickname, email, gymId, gymName, appView });
    setSending(false);
    if (res === 'rate_limited') {
      setRateLimited(true);
      return;
    }
    if (res === 'sent' || res === 'queued') {
      setResult(res);
      setMessage('');
      setCategory(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} fitContent testId="feedback-sheet" ariaLabel="Feedback geben">
      {result ? (
        <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center gap-4" data-testid="feedback-thanks">
          <CircleCheck className="w-16 h-16 text-[var(--bm-success)]" aria-hidden="true" />
          <p className="text-[22px] font-bold">Danke!</p>
          <p className="text-[17px] text-[var(--bm-text)]" data-testid="feedback-thanks-text">
            {result === 'sent' ? 'Dein Feedback ist angekommen.' : 'Wir senden es, sobald du wieder Netz hast.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="feedback-done"
            className="w-full min-h-[56px] rounded-2xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[18px] font-bold"
          >
            Fertig
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-5 pt-2 pb-4 space-y-5" noValidate>
          <h2 className="text-[22px] font-bold">Feedback geben</h2>

          <div role="radiogroup" aria-label="Worum geht es?" className="grid grid-cols-3 gap-2.5">
            {CATEGORIES.map(c => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCategory(c.id)}
                  data-testid={`feedback-category-${c.id}`}
                  className={`relative min-h-[76px] rounded-2xl flex flex-col items-center justify-center gap-1.5 text-[17px] font-semibold transition ${
                    active
                      ? 'border-2 border-[var(--bm-accent)] bg-[var(--bm-elevated)] text-[var(--bm-text)]'
                      : 'border-2 border-[var(--bm-line)] bg-[var(--bm-bg)] text-[var(--bm-text)]'
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--bm-accent)] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[var(--bm-on-accent)] stroke-[3]" aria-hidden="true" />
                    </span>
                  )}
                  {c.icon}
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="feedback-message" className="block text-[15px] font-medium text-[var(--bm-text-2)]">
              Deine Nachricht
            </label>
            <textarea
              id="feedback-message"
              data-testid="feedback-message"
              value={message}
              maxLength={FEEDBACK_MAX_LENGTH}
              onChange={e => setMessage(e.target.value)}
              placeholder={placeholder}
              rows={5}
              className="w-full min-h-[140px] rounded-2xl bg-[var(--bm-bg)] border-2 border-[var(--bm-line)] focus:border-[var(--bm-accent)] outline-none p-3 text-[17px] leading-snug text-[var(--bm-text)] placeholder-[var(--bm-text-2)]"
            />
            <div className="flex justify-between gap-3 text-[14px] text-[var(--bm-text-2)]">
              <span data-testid="feedback-context-note">Mitgeschickt werden: Halle, Gerät und dein Kletter-Name.</span>
              <span data-testid="feedback-counter" className="shrink-0 tabular-nums">
                {message.length} / {FEEDBACK_MAX_LENGTH}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
            <input
              type="checkbox"
              checked={contactOk}
              onChange={e => setContactOk(e.target.checked)}
              data-testid="feedback-contact"
              className="w-7 h-7 shrink-0 accent-[var(--bm-accent)]"
            />
            <span className="text-[17px]">Ihr dürft mich dazu per E-Mail kontaktieren</span>
          </label>

          {rateLimited && (
            <p className="text-[15px] text-[var(--bm-danger)]" data-testid="feedback-rate-limit" role="alert">
              Du hast gerade viel Feedback geschickt. Bitte versuch es später noch einmal.
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            data-testid="feedback-submit"
            className="w-full min-h-[56px] rounded-2xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[18px] font-bold disabled:opacity-40"
          >
            {sending ? 'Wird gesendet …' : 'Absenden'}
          </button>
        </form>
      )}
    </Sheet>
  );
};
