// SPEC-052: KI-Routenerfassung – reine Logik (App, Worker, Eval-Skript, später Edge Function).
export * from './colors';
export * from './types';
export * from './schema';
export * from './names';
export * from './plan';
export * from './prompt';
export * from './evaluate';
export * from './exif';
export * from './colorCheck';

import { extractJson } from './prompt';
import { validateCaptureResult } from './schema';
import { assignRouteNames } from './names';
import { buildCapturePlan } from './plan';
import type { AiPublishMode, CaptureContext } from './types';

/** Modell-Antwort (Text oder Objekt) → geprüftes Ergebnis, Namen und Plan in einem Schritt. */
export function processCaptureResponse(
  response: string | unknown,
  ctx: CaptureContext,
  publishMode: AiPublishMode = 'direct',
) {
  const raw = typeof response === 'string' ? extractJson(response) : response;
  const result = validateCaptureResult(raw, ctx);
  const labelOf = (id: string | null) =>
    ctx.palette.find(p => p.id === id)?.colorName.split(/[\s/(]/)[0] || 'Route';
  const names = assignRouteNames(result.routes, ctx.nameStyle, ctx.takenNames ?? [], labelOf);
  const plan = buildCapturePlan({ result, names, mode: ctx.mode, existing: ctx.existing ?? [], publishMode });
  return { result, names, plan };
}
