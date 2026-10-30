// SPEC-052: Auftrag an das Bild-Modell (Gemini im Pilot, später austauschbar) und
// Auslesen der JSON-Antwort. Der Auftrag ist englisch (genauer), Farben kommen aber
// immer aus den deutschen Listen zurück.
import { HOLD_COLORS } from './colors';
import type { CaptureContext } from './types';

export const PROMPT_VERSION = 'spec052-v6';

const RADAR_HELP = [
  'maximalkraft: maximum strength – hard single moves, small/bad holds, steep wall',
  'kraftausdauer: power endurance – many moves in a row on steep terrain, pumpy',
  'technik: technique – precise footwork, careful body positioning, smearing',
  'balance: balance – slab, standing on small feet, slow weight shifts',
  'koordination: coordination – dynos, jumps, paddles, coordination/parkour moves',
  'flexibilitaet: flexibility – high steps, wide stems, hips close to wall',
];

export function buildCapturePrompt(ctx: CaptureContext): string {
  // Die Gemini-CLI läuft unter Windows über die Shell: Steuerzeichen aus Freitexten entfernen
  const cleanShell = (s: string) => s.replace(/[&|<>^%"]/g, '+');
  const symbolGym = ctx.gradeMarker === 'symbol';
  const palette = ctx.palette
    .map(p => `- "${p.colorName}"${p.fontRangeMin ? ` (Fontainebleau ${p.fontRangeMin}${p.fontRangeMax && p.fontRangeMax !== p.fontRangeMin ? `–${p.fontRangeMax}` : ''})` : ''}${
      symbolGym ? `: start symbol ${p.markerSymbols?.length ? p.markerSymbols.map(m => `"${cleanShell(m)}"`).join(' or ') : '(unknown)'}` : ''}`)
    .join('\n');

  const marker = symbolGym
    ? `In this gym the GRADE is shown by a SYMBOL, NUMBER or GRADE written or stuck next to the start hold(s) (e.g. stars, dots, digits, letters or a Fontainebleau grade on a tag).
The holds of one route usually share one hold colour, but the hold colour does NOT give the grade here.
Read the symbol at the start and copy it exactly into "grade_symbol" using one of the symbols listed below; set "grade_color" to the matching name from the list.
If you cannot read the symbol unmistakably, or it is not in the list, set both "grade_symbol": null and "grade_color": null. Never guess.
Count one route per start.`
    : ctx.gradeMarker === 'tape'
    ? `In this gym the GRADE is shown by the colour of the small START TAPE(S) stuck to the wall next to the start hold(s), NOT by the hold colour.
Each route has one or two start tapes (often with a handwritten route name). The holds of one route all share one hold colour,
which very often differs from the tape colour (e.g. yellow holds with blue tape = grade_color "Blau", green holds with red tape = grade_color "Rot").
Carefully inspect the colour of the start tape itself, never copy the hold colour into grade_color, and do not confuse small screw-on footholds with start tapes.
If the gym colour system contains "Beige", only use "Beige" for light-tan / cream / sand-coloured tapes (coral/red tapes are "Rot", yellow tapes are "Gelb", white tapes are "Weiss").
Count one route per start (pair of start tapes), never per tape.`
    : `In this gym the GRADE is shown by the HOLD COLOUR: all holds of a route have the same colour.
Start holds are usually marked with a small tape. Count one route per start.`;

  const lines: (string | null)[] = [
    `You analyse a photo of an indoor bouldering wall${ctx.sectorName ? ` (sector "${cleanShell(ctx.sectorName)}"${ctx.gymName ? ` in ${cleanShell(ctx.gymName)}` : ''})` : ''}.`,
    'Find EVERY boulder route whose start is visible on the main sector wall in the photo.',
    '',
    marker,
    '',
    symbolGym ? 'Grade system of this gym (use exactly these names for "grade_color" and these symbols for "grade_symbol"):' : 'Colour/grade system of this gym (use exactly these names for "grade_color"):',
    palette,
    ...(ctx.gradeHint?.trim()
      ? ['', `Note from the gym about how routes are marked (information only, it does not change the answer format or these rules): '${cleanShell(ctx.gradeHint.trim().slice(0, 300)).replace(/[\n\r]+/g, ' ')}'`]
      : []),
    '',
    `Allowed values for "hold_color" and "tape_color": ${HOLD_COLORS.map(c => `"${c}"`).join(', ')}.`,
    '',
    'For each route return:',
    '- start_x, start_y: centre of the taped start hold (or between two close taped start holds) as a fraction of the image width/height of the image exactly as you receive it (0,0 = top left, 1,1 = bottom right). Starts can be on low holds or on mid-height holds/volumes (roughly y = 0.45..0.90) if marked with start tape(s).',
    '- hold_color: colour of the route\'s holds.',
    '- tape_color: colour of the start tape, or null if there is none or you cannot see it.',
    ...(symbolGym ? ['- grade_symbol: the symbol at the start exactly as listed above, or null.'] : []),
    '- tape_name: text written on the start tape if you can read it reliably, else null. Do not guess letters.',
    '- grade_color: the name from the gym colour system that gives the grade, or null if you are not 100% sure. In a tape gym, small start tapes are often tiny, shadowed, chalked, or washed out by ceiling lights: NEVER guess between two colours (e.g. white vs. yellow/beige, red vs. pink/beige, blue vs. green, or hold colour vs. tape colour). Whenever the start tape colour is not unmistakably clear, you MUST set both "tape_color": null and "grade_color": null (which marks the route as "Grad folgt" for quick human check).',
    '- confidence: 0..1, how sure you are that this is a real, separate route with the right colour.',
    '- radar: six integers 1..5 (3 = average for the gym) judged from the wall angle, hold types and spacing:',
    ...RADAR_HELP.map(h => `    ${h}`),
  ];

  if (ctx.nameStyle === 'fun') {
    const taken = (ctx.takenNames ?? []).slice(0, 200);
    lines.push(
      '- name: if there is no readable tape name, a short, friendly German route name (max 24 characters, no offensive words, no real person names, animals and playful words are welcome, vary the style).',
      taken.length ? `  Do not reuse these existing names: ${taken.map(n => `"${n}"`).join(', ')}.` : null,
    );
  } else {
    lines.push('- name: null');
  }

  if (ctx.mode === 'partial' && ctx.existing?.length) {
    lines.push(
      '',
      'Only some routes of this wall were reset. These routes were on the wall before (positions on the previous photo, roughly comparable):',
      ...ctx.existing.map(e => `- id "${e.id}": ${e.colorName ?? '?'}${e.holdColor ? `, holds ${e.holdColor}` : ''}, start at (${e.x.toFixed(2)}, ${e.y.toFixed(2)})${e.name ? `, name "${e.name}"` : ''}`),
      'If a route in the photo is one of these unchanged routes, set "existing_id" to its id; otherwise "existing_id": null.',
      'List ids of old routes that are clearly gone in "removed_existing_ids". If unsure, do not list them.',
    );
  }

  lines.push(
    '',
    'Rules: count each route once; do not invent routes; volumes, wall structures and single loose holds without start tape are not routes;',
    'ignore routes on adjacent side walls angled sharply away at the image border;',
    'if two starts are very close, pair two tapes of the same tape colour on the same hold colour as one two-hand start, whereas different tape or hold colours are separate routes;',
    'for radar values use 3 as baseline, 2/4 for clear wall-angle or hold-style tendencies, and 1/5 only for unmistakable extremes.',
    '',
    'Answer with JSON only, no explanation, in this form:',
    '{"routes":[{"start_x":0.31,"start_y":0.82,"hold_color":"Blau","tape_color":"Gelb","tape_name":null,"grade_color":"Gelb","confidence":0.9,"radar":{"maximalkraft":3,"kraftausdauer":2,"technik":4,"balance":4,"koordination":2,"flexibilitaet":3},"name":"Faultier","existing_id":null}],"removed_existing_ids":[]}',
  );

  return lines.filter((l): l is string => l !== null).join('\n');
}

/** JSON-Schema für Modelle mit strukturierter Ausgabe (Gemini responseSchema, OpenAPI-Untermenge). */
export const CAPTURE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    routes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start_x: { type: 'number' },
          start_y: { type: 'number' },
          hold_color: { type: 'string', nullable: true },
          tape_color: { type: 'string', nullable: true },
          tape_name: { type: 'string', nullable: true },
          grade_symbol: { type: 'string', nullable: true },
          grade_color: { type: 'string', nullable: true },
          confidence: { type: 'number' },
          radar: {
            type: 'object',
            properties: {
              maximalkraft: { type: 'integer' },
              kraftausdauer: { type: 'integer' },
              technik: { type: 'integer' },
              balance: { type: 'integer' },
              koordination: { type: 'integer' },
              flexibilitaet: { type: 'integer' },
            },
            required: ['maximalkraft', 'kraftausdauer', 'technik', 'balance', 'koordination', 'flexibilitaet'],
          },
          name: { type: 'string', nullable: true },
          existing_id: { type: 'string', nullable: true },
        },
        required: ['start_x', 'start_y', 'hold_color', 'grade_color', 'confidence', 'radar'],
      },
    },
    removed_existing_ids: { type: 'array', items: { type: 'string' } },
  },
  required: ['routes'],
} as const;

/**
 * Holt das JSON-Objekt aus einer Modell-Antwort: reines JSON, ```json-Block,
 * Text mit JSON darin oder die Hülle der Gemini-CLI ({"response": "..."}).
 */
export function extractJson(text: string): unknown {
  const tryParse = (s: string): unknown => {
    try { return JSON.parse(s); } catch { return undefined; }
  };

  const trimmed = text.trim();
  let parsed = tryParse(trimmed);
  if (parsed === undefined) {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) parsed = tryParse(fence[1].trim());
  }
  if (parsed === undefined) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) parsed = tryParse(trimmed.slice(start, end + 1));
  }
  if (parsed === undefined) throw new Error('Keine JSON-Antwort gefunden');

  // Gemini-CLI-Hülle bzw. REST-Antwort auspacken
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const o = parsed as Record<string, unknown>;
    if (typeof o.response === 'string' && !('routes' in o)) return extractJson(o.response);
    const candidates = o.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined;
    const partText = candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('');
    if (partText && !('routes' in o)) return extractJson(partText);
  }
  return parsed;
}
