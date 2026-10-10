import React from 'react';
import { Check, Languages } from 'lucide-react';
import { ListGroup, ListRow } from '../ui/primitives';
import { LANG_OPTIONS, setLang, useLang } from '../../lib/i18n';

/** SPEC-039 F3: Ich → Einstellungen → «Sprache / Language». */
export const LanguageGroup: React.FC = () => {
  const lang = useLang();
  return (
    <ListGroup title="Sprache / Language">
      {LANG_OPTIONS.map(o => (
        <ListRow
          key={o.value}
          testId={`settings-lang-${o.value}`}
          icon={<Languages className="w-5 h-5 text-[var(--bm-text-2)]" />}
          title={o.label}
          value={lang === o.value ? <Check className="w-5 h-5 text-[var(--bm-accent)]" aria-label="gewählt" /> : undefined}
          onClick={() => setLang(o.value)}
        />
      ))}
    </ListGroup>
  );
};
