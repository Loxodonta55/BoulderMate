import { isNativeApp } from './platform';

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * SPEC-045 §4.5: Teilen über das System-Teilen-Menü (App), im Browser über navigator.share,
 * sonst Link in die Zwischenablage.
 */
export async function shareLink(opts: { title: string; text: string; url: string }): Promise<ShareResult> {
  try {
    if (isNativeApp()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: opts.title, text: opts.text, url: opts.url, dialogTitle: opts.title });
      return 'shared';
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share(opts);
      return 'shared';
    }
    await navigator.clipboard.writeText(`${opts.text} ${opts.url}`);
    return 'copied';
  } catch (err) {
    const name = (err as any)?.name;
    const msg = String((err as any)?.message ?? err);
    if (name === 'AbortError' || /cancel/i.test(msg)) return 'cancelled';
    return 'failed';
  }
}
