import { useEffect, useState } from 'react';
import { EN_BASE } from './i18n/en-base';
import { EN_WALL } from './i18n/en-wall';
import { EN_SHEET } from './i18n/en-sheet';
import { EN_ME } from './i18n/en-me';

/**
 * SPEC-039 · Englisch (Runde 1: was Kletterer sehen).
 * Deutsch ist die Quelle und zugleich der Schlüssel: `t('Alle Hallen')`.
 * Fehlt ein englischer Text, erscheint der deutsche (AC-4).
 * Platzhalter: `t('{n} von {m}', { n: 3, m: 12 })`.
 * Später: `fr` ist nur ein weiteres Wörterbuch.
 */
export type Lang = 'de' | 'en';
export const LANG_KEY = 'boulderapp_lang_v1';
export const LANG_EVENT = 'bouldermate:lang_changed';
export const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

export const EN: Record<string, string> = { ...EN_BASE, ...EN_WALL, ...EN_SHEET, ...EN_ME };

const isTest = typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'test';

/** AC-2: ohne Einstellung folgt die Sprache dem Gerät (de… → Deutsch, sonst Englisch). Tests laufen auf Deutsch (AC-5). */
export function deviceLang(language: string | undefined = typeof navigator !== 'undefined' ? navigator.language : undefined): Lang {
  if (!language) return 'de';
  return language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

let current: Lang | null = null;

export function getLang(): Lang {
  if (current) return current;
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'de' || stored === 'en') {
      current = stored;
      if (typeof document !== 'undefined') document.documentElement.lang = current;
      return current;
    }
  } catch {
    // Speicher gesperrt
  }
  current = isTest ? 'de' : deviceLang();
  if (typeof document !== 'undefined') document.documentElement.lang = current;
  return current;
}

/** AC-3: wirkt sofort und bleibt nach dem Neuladen. */
export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Speicher gesperrt: gilt bis zum Neuladen
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LANG_EVENT));
}

/** Nur für Tests: gemerkte Sprache vergessen. */
export function resetLang(): void {
  current = null;
}

export function t(de: string, vars?: Record<string, string | number>): string {
  const text = getLang() === 'en' ? EN[de] ?? de : de;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Komponenten, die `t()` nutzen, zeichnen sich beim Umschalten neu. */
export function useLang(): Lang {
  const [lang, setState] = useState<Lang>(getLang());
  useEffect(() => {
    const on = () => setState(getLang());
    window.addEventListener(LANG_EVENT, on);
    return () => window.removeEventListener(LANG_EVENT, on);
  }, []);
  return lang;
}
