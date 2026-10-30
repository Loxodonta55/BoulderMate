import { isNativeApp } from './platform';

/** Store-Seite oder fremde Adresse öffnen: in der App über das System, im Web in neuem Tab. */
export async function openExternal(url: string): Promise<void> {
  if (isNativeApp()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      // Eigene Seiten (z. B. /regeln.html) gibt es in der App nur unter bouldermate.ch
      await Browser.open({ url: url.startsWith('/') ? `https://bouldermate.ch${url}` : url });
      return;
    } catch {
      // weiter unten
    }
  }
  window.open(url, '_blank', 'noopener');
}
