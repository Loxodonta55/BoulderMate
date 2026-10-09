import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquareText } from 'lucide-react';
import { FeedbackSheet } from './FeedbackSheet';
import { getCurrentAuthUser } from '../lib/authService';
import { useBackHandler } from '../hooks/useBackHandler';

/**
 * SPEC-026 F16 · Gut sichtbarer Feedback-Knopf im Kletterer-Header (Wand und «Ich»).
 * Bringt sein eigenes Sheet mit, damit App.tsx und der Header nur den Knopf einhängen.
 * Das Sheet wird per Portal in <body> gerendert: Der Header hat backdrop-blur + overflow-hidden
 * und würde ein darin liegendes «fixed»-Sheet sonst auf die Header-Höhe abschneiden.
 */
export interface HeaderFeedbackButtonProps {
  userId: string;
  nickname: string;
  gymId?: string;
  gymName?: string;
}

export const HeaderFeedbackButton: React.FC<HeaderFeedbackButtonProps> = ({ userId, nickname, gymId, gymName }) => {
  const [open, setOpen] = useState(false);
  useBackHandler({ id: 'header-feedback', isOpen: open, onBack: () => setOpen(false) });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] px-3.5 rounded-full bg-[var(--bm-accent)] text-[var(--bm-on-accent)] flex items-center gap-1.5 text-[16px] font-semibold shrink-0"
        aria-label="Feedback geben"
        title="Feedback geben: Fehler, Ideen, Lob"
        aria-haspopup="dialog"
        data-testid="header-feedback-btn"
      >
        <MessageSquareText className="w-5 h-5" aria-hidden />
        <span>Feedback</span>
      </button>
      {open &&
        createPortal(
          <FeedbackSheet
            open
            onClose={() => setOpen(false)}
            userId={userId}
            nickname={nickname}
            email={getCurrentAuthUser()?.email}
            gymId={gymId}
            gymName={gymName}
            appView="header"
          />,
          document.body
        )}
    </>
  );
};
