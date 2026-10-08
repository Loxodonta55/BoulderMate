import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { navigationHistory } from '../src/lib/navigationHistory';

/**
 * Bugfix (SPEC-015/SPEC-022): Studio → «Kletterer-App» in einem frischen Tab führte zu einer leeren Seite.
 * Ursache: Gateway schliessen (history.back, asynchron) und Studio öffnen (pushState) im selben Tick;
 * das spätere Zurück ging über den ersten App-Eintrag hinaus. Getestet wird der Browser-Pfad (nicht NODE_ENV=test).
 */
describe('NavigationHistory: kein Zurück über die App hinaus', () => {
  const env = process.env.NODE_ENV;
  let goSpy: ReturnType<typeof vi.spyOn>;
  let pushSpy: ReturnType<typeof vi.spyOn>;
  let replaceSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    navigationHistory.reset();
    goSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    pushSpy = vi.spyOn(window.history, 'pushState');
    replaceSpy = vi.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    process.env.NODE_ENV = env;
    vi.restoreAllMocks();
    navigationHistory.reset();
  });

  const flush = () => Promise.resolve();

  it('verwendet den Eintrag wieder, wenn im selben Tick geschlossen und geöffnet wird', async () => {
    navigationHistory.push('modal-role-gateway', () => {});
    expect(pushSpy).toHaveBeenCalledTimes(1);

    // Gateway zu, Studio auf (gleicher Render-Durchlauf)
    navigationHistory.pop('modal-role-gateway');
    navigationHistory.push('mode-privileged', () => {});
    await flush();

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(goSpy).not.toHaveBeenCalled();

    // Studio verlassen: genau ein Schritt zurück
    navigationHistory.pop('mode-privileged');
    await flush();
    expect(goSpy).toHaveBeenCalledTimes(1);
    expect(goSpy).toHaveBeenCalledWith(-1);

  });

  it('geht nie weiter zurück als eigene Einträge existieren', async () => {
    navigationHistory.push('a', () => {});
    navigationHistory.push('b', () => {});
    // Nutzer drückt einmal echtes Zurück → b geschlossen, ein eigener Eintrag verbraucht
    window.dispatchEvent(new PopStateEvent('popstate'));
    navigationHistory.pop('a');
    await flush();
    expect(goSpy).toHaveBeenCalledWith(-1);
    expect(goSpy).toHaveBeenCalledTimes(1);
  });
});
