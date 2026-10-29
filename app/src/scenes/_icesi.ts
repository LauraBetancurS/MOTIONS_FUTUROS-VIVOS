// Shared toolkit for "El mapa del pasado" (Icesi identity): palette, Plus Jakarta Sans, word lookup
// by content, entrance/exit timing, flat line icons and the base plate (Canvas2D, flat post).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D } from '../engine/gl';
import type { Line, Lyrics, Word } from '../engine/lyrics';
import { clamp, ease, lerp } from '../engine/util';

export { clamp, ease, lerp };

// ------------------------------------------------------------------ palette (manual Icesi)
export const C = {
  azul: '#5454E9',
  blanco: '#FFFFFF',
  verde: '#4CB979',
  naranja: '#E9683B',
  amarillo: '#E4EB60',
  morado: '#865CF0',
  gris2: '#CECFD4',
  gris1: '#88898C',
  negro: '#000000',
} as const;

export function hexA(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export function mixHex(a: string, b: string, k: number, alpha = 1) {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((p >> s) & 255, (q >> s) & 255, clamp(k)));
  return `rgba(${ch(16)},${ch(8)},${ch(0)},${alpha})`;
}

// ------------------------------------------------------------------ footer (on every plate)
/** Identification footer. Change the trend / insight numbers here. */
export const FOOTER = ['Foresight', 'ACH Q2 2026', 'Tendencia X', 'Insight X'];

// ------------------------------------------------------------------ type: Plus Jakarta Sans
let fontsReady: Promise<void> | null = null;
export function loadJakarta() {
  if (!fontsReady) {
    fontsReady = (async () => {
      const faces = [
        new FontFace('Jakarta', 'url(fonts/PlusJakartaSans.ttf)', { weight: '200 800', style: 'normal' }),
        new FontFace('Jakarta', 'url(fonts/PlusJakartaSans-Italic.ttf)', { weight: '200 800', style: 'italic' }),
      ];
      for (const f of faces) { await f.load(); document.fonts.add(f); }
      await document.fonts.ready;
    })();
  }
  return fontsReady;
}

/** Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold. */
export const jfont = (weight: number, size: number, italic = false) => `${italic ? 'italic ' : ''}${weight} ${size}px Jakarta`;

export interface TextOpts { w?: number; size?: number; col?: string; align?: CanvasTextAlign; alpha?: number; italic?: boolean; base?: CanvasTextBaseline; ls?: number }
export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpts = {}) {
  c.save();
  c.font = jfont(o.w ?? 600, o.size ?? 40, o.italic);
  c.fillStyle = o.col ?? C.negro;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = o.base ?? 'alphabetic';
  c.globalAlpha *= o.alpha ?? 1;
  if (o.ls) c.letterSpacing = `${o.ls}px`;
  c.fillText(s, x, y);
  c.restore();
}
export function measureText(c: CanvasRenderingContext2D, s: string, w: number, size: number, italic = false) {
  c.save(); c.font = jfont(w, size, italic); const m = c.measureText(s).width; c.restore(); return m;
}
/** Largest size <= max at which s fits in width. */
export function fit(c: CanvasRenderingContext2D, s: string, w: number, width: number, max: number) {
  return Math.min(max, (max * width) / Math.max(1, measureText(c, s, w, max)));
}
/** Greedy word wrap. */
export function wrap(c: CanvasRenderingContext2D, s: string, w: number, size: number, width: number): string[] {
  const out: string[] = []; let cur = '';
  for (const word of s.split(' ')) {
    const tryS = cur ? `${cur} ${word}` : word;
    if (cur && measureText(c, tryS, w, size) > width) { out.push(cur); cur = word; } else cur = tryS;
  }
  if (cur) out.push(cur);
  return out;
}

// ------------------------------------------------------------------ the script (words by content)
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ]/g, '');
const foldLine = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export class Script {
  constructor(private ly: Lyrics) {}
  line(q: string, nth = 0): Line {
    const k = foldLine(q);
    const l = this.ly.lines.filter((x) => foldLine(x.text).includes(k))[nth];
    if (!l) throw new Error(`línea no encontrada: "${q}"`);
    return l;
  }
  /** Word `q` (nth occurrence) inside the line containing `lineQ`. */
  word(lineQ: string, q: string, nth = 0): Word {
    const l = this.line(lineQ);
    const k = fold(q);
    const w = l.words.filter((x) => fold(x.w) === k)[nth];
    if (!w) throw new Error(`palabra no encontrada: "${q}" en "${l.text}"`);
    return w;
  }
}

// ------------------------------------------------------------------ timing
/** Entrance 0..1: ease out over d (0.3–0.5 s per the guide). */
export const inn = (t: number, t0: number, d = 0.4, fn = ease.outCubic) => fn(clamp((t - t0) / d));
/** Exit 1..0 over 0.25 s. */
export const outk = (t: number, t1: number, d = 0.25) => 1 - ease.inCubic(clamp((t - t1) / d));
/** Visible in [t0, t1) with an entrance and an exit. */
export const vis = (t: number, t0: number, t1 = Infinity, d = 0.4) => inn(t, t0, d) * (t1 === Infinity ? 1 : outk(t, t1));
/** Pop from 0 to 100% scale with a small overshoot. */
export const pop = (t: number, t0: number, d = 0.45) => (t <= t0 ? 0 : t >= t0 + d ? 1 : ease.outBack(clamp((t - t0) / d), 2.2));

// ------------------------------------------------------------------ geometry
export type P = { x: number; y: number };
export const pt = (x: number, y: number): P => ({ x, y });
export function polyLen(ps: P[]) { let s = 0; for (let i = 1; i < ps.length; i++) s += Math.hypot(ps[i]!.x - ps[i - 1]!.x, ps[i]!.y - ps[i - 1]!.y); return s; }
/** Point at fraction k of a polyline's length, with its heading. */
export function polyAt(ps: P[], k: number): { x: number; y: number; a: number } {
  const L = polyLen(ps) * clamp(k);
  let s = 0;
  for (let i = 1; i < ps.length; i++) {
    const a = ps[i - 1]!, b = ps[i]!, d = Math.hypot(b.x - a.x, b.y - a.y);
    if (s + d >= L || i === ps.length - 1) { const u = d > 0 ? clamp((L - s) / d) : 0; return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), a: Math.atan2(b.y - a.y, b.x - a.x) }; }
    s += d;
  }
  return { x: ps[0]!.x, y: ps[0]!.y, a: 0 };
}
/** Stroke the first fraction k of a polyline (trim path). */
export function strokeTrim(c: CanvasRenderingContext2D, ps: P[], k: number, from = 0) {
  if (k <= from) return;
  const L = polyLen(ps), a = L * clamp(from), b = L * clamp(k);
  c.beginPath();
  let s = 0, started = false;
  for (let i = 1; i < ps.length; i++) {
    const p = ps[i - 1]!, q = ps[i]!, d = Math.hypot(q.x - p.x, q.y - p.y);
    const s0 = s, s1 = s + d; s = s1;
    if (s1 < a || s0 > b || d === 0) continue;
    const u0 = clamp((a - s0) / d), u1 = clamp((b - s0) / d);
    if (!started) { c.moveTo(lerp(p.x, q.x, u0), lerp(p.y, q.y, u0)); started = true; }
    c.lineTo(lerp(p.x, q.x, u1), lerp(p.y, q.y, u1));
  }
  c.stroke();
}
export function quadPts(p0: P, p1: P, p2: P, n = 40): P[] {
  const o: P[] = [];
  for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push(pt(v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x, v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y)); }
  return o;
}
export function circlePts(cx: number, cy: number, rx: number, ry: number, a0 = -Math.PI / 2, turns = 1.08, n = 90): P[] {
  const o: P[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * turns * Math.PI * 2; o.push(pt(cx + Math.cos(a) * rx * (1 + 0.03 * Math.sin(a * 3)), cy + Math.sin(a) * ry)); }
  return o;
}

// ------------------------------------------------------------------ shapes
export function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}
export function pill(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill?: string, stroke?: string, lw = 3) {
  rrect(c, x, y, w, h, h / 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
/** Pill sized to its label; returns its width. (x, y) = centre. */
export function labelPill(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: { fill: string; col: string; size?: number; w?: number; stroke?: string; padX?: number; h?: number; alpha?: number }) {
  const size = o.size ?? 30, w = measureText(c, s, o.w ?? 600, size) + (o.padX ?? 34) * 2, h = o.h ?? size * 1.9;
  c.save(); c.globalAlpha *= o.alpha ?? 1;
  pill(c, x - w / 2, y - h / 2, w, h, o.fill, o.stroke);
  text(c, s, x, y + size * 0.35, { w: o.w ?? 600, size, col: o.col, align: 'center' });
  c.restore();
  return w;
}
/** Apply a centred scale/rotation/alpha around (x, y) for the duration of fn. */
export function at(c: CanvasRenderingContext2D, x: number, y: number, o: { s?: number; r?: number; a?: number; dx?: number; dy?: number }, fn: () => void) {
  if ((o.a ?? 1) <= 0.001 || (o.s ?? 1) <= 0.001) return;
  c.save();
  c.translate(x + (o.dx ?? 0), y + (o.dy ?? 0));
  if (o.r) c.rotate(o.r);
  if (o.s !== undefined) c.scale(o.s, o.s);
  c.globalAlpha *= o.a ?? 1;
  fn();
  c.restore();
}

// ------------------------------------------------------------------ flat line icons (drawn at the origin, size ~ s)
function lineStyle(c: CanvasRenderingContext2D, col: string, lw: number) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; }

export const icon = {
  check(c: CanvasRenderingContext2D, r: number, fill: string, stroke: string = C.blanco) {
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
    lineStyle(c, stroke, r * 0.22);
    c.beginPath(); c.moveTo(-r * 0.42, 0); c.lineTo(-r * 0.1, r * 0.32); c.lineTo(r * 0.45, -r * 0.3); c.stroke();
  },
  person(c: CanvasRenderingContext2D, s: number, col: string) {
    c.fillStyle = col;
    c.beginPath(); c.arc(0, -s * 0.28, s * 0.22, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(0, s * 0.32, s * 0.38, s * 0.3, 0, Math.PI, 0); c.closePath(); c.fill();
  },
  car(c: CanvasRenderingContext2D, s: number, col: string) {
    // top view: rounded body, windshield
    rrect(c, -s * 0.6, -s * 0.34, s * 1.2, s * 0.68, s * 0.22); c.fillStyle = col; c.fill();
    c.fillStyle = C.blanco;
    rrect(c, s * 0.12, -s * 0.24, s * 0.22, s * 0.48, s * 0.08); c.fill();
    rrect(c, -s * 0.44, -s * 0.22, s * 0.14, s * 0.44, s * 0.06); c.fill();
  },
  roadClosed(c: CanvasRenderingContext2D, s: number) {
    c.beginPath(); c.arc(0, 0, s * 0.5, 0, Math.PI * 2); c.fillStyle = C.naranja; c.fill();
    c.fillStyle = C.blanco; rrect(c, -s * 0.32, -s * 0.09, s * 0.64, s * 0.18, s * 0.04); c.fill();
  },
  bill(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.07);
    rrect(c, -s * 0.5, -s * 0.3, s, s * 0.6, s * 0.08); c.stroke();
    c.beginPath(); c.arc(0, 0, s * 0.14, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.36, -s * 0.16); c.lineTo(-s * 0.36, -s * 0.16); c.moveTo(s * 0.36, s * 0.16); c.lineTo(s * 0.36, s * 0.16); c.stroke();
  },
  wallet(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.07);
    rrect(c, -s * 0.5, -s * 0.32, s, s * 0.64, s * 0.1); c.stroke();
    rrect(c, s * 0.12, -s * 0.12, s * 0.38, s * 0.24, s * 0.08); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.4, -s * 0.32); c.lineTo(s * 0.25, -s * 0.48); c.lineTo(s * 0.32, -s * 0.32); c.stroke();
  },
  scale(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.07);
    c.beginPath(); c.moveTo(0, -s * 0.45); c.lineTo(0, s * 0.42); c.moveTo(-s * 0.26, s * 0.42); c.lineTo(s * 0.26, s * 0.42);
    c.moveTo(-s * 0.46, -s * 0.3); c.lineTo(s * 0.46, -s * 0.3); c.stroke();
    for (const sx of [-1, 1]) {
      c.beginPath(); c.moveTo(sx * s * 0.46, -s * 0.3); c.lineTo(sx * s * 0.62, s * 0.06); c.lineTo(sx * s * 0.3, s * 0.06); c.closePath(); c.stroke();
    }
  },
  brokenLock(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.07);
    rrect(c, -s * 0.38, -s * 0.06, s * 0.76, s * 0.56, s * 0.08); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.22, -s * 0.06); c.lineTo(-s * 0.22, -s * 0.28); c.arc(0, -s * 0.28, s * 0.22, Math.PI, Math.PI * 1.7); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.06, s * 0.08); c.lineTo(s * 0.06, s * 0.2); c.lineTo(-s * 0.04, s * 0.32); c.stroke();
  },
  phone(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.07);
    rrect(c, -s * 0.28, -s * 0.5, s * 0.56, s, s * 0.1); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.06, s * 0.36); c.lineTo(s * 0.06, s * 0.36); c.stroke();
  },
  pin(c: CanvasRenderingContext2D, s: number, col: string, fill = false) {
    lineStyle(c, col, s * 0.08);
    c.beginPath();
    c.moveTo(0, s * 0.5);
    c.bezierCurveTo(-s * 0.1, s * 0.3, -s * 0.38, s * 0.05, -s * 0.38, -s * 0.12);
    c.arc(0, -s * 0.12, s * 0.38, Math.PI, 0);
    c.bezierCurveTo(s * 0.38, s * 0.05, s * 0.1, s * 0.3, 0, s * 0.5);
    if (fill) { c.fillStyle = col; c.fill(); c.fillStyle = C.blanco; c.beginPath(); c.arc(0, -s * 0.12, s * 0.14, 0, Math.PI * 2); c.fill(); }
    else { c.stroke(); c.beginPath(); c.arc(0, -s * 0.12, s * 0.13, 0, Math.PI * 2); c.stroke(); }
  },
  group(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.07);
    for (const [x, sc] of [[-s * 0.28, 0.75], [s * 0.28, 0.75], [0, 1]] as const) {
      c.beginPath(); c.arc(x, -s * 0.18 * sc, s * 0.14 * sc, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(x, s * 0.36, s * 0.26 * sc, Math.PI, 0); c.stroke();
    }
  },
  clock(c: CanvasRenderingContext2D, s: number, col: string, lwk = 0.08) {
    lineStyle(c, col, s * lwk);
    c.beginPath(); c.arc(0, 0, s * 0.45, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(0, -s * 0.25); c.lineTo(0, 0); c.lineTo(s * 0.18, s * 0.12); c.stroke();
  },
  bubble(c: CanvasRenderingContext2D, s: number, col: string, fill?: string, lines?: string) {
    lineStyle(c, col, s * 0.07);
    c.beginPath();
    c.roundRect(-s * 0.5, -s * 0.38, s, s * 0.6, s * 0.14);
    c.moveTo(-s * 0.2, s * 0.22); c.lineTo(-s * 0.3, s * 0.44); c.lineTo(s * 0.02, s * 0.22);
    if (fill) { c.fillStyle = fill; c.fill(); } else c.stroke();
    if (lines) {
      lineStyle(c, lines, s * 0.06);
      c.beginPath(); c.moveTo(-s * 0.32, -s * 0.18); c.lineTo(s * 0.3, -s * 0.18); c.moveTo(-s * 0.32, 0); c.lineTo(s * 0.12, 0); c.stroke();
    }
  },
  magnifier(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.09);
    c.beginPath(); c.arc(-s * 0.1, -s * 0.1, s * 0.32, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(s * 0.13, s * 0.13); c.lineTo(s * 0.45, s * 0.45); c.stroke();
  },
  refresh(c: CanvasRenderingContext2D, s: number, col: string) {
    lineStyle(c, col, s * 0.1);
    c.beginPath(); c.arc(0, 0, s * 0.34, -Math.PI * 0.2, Math.PI * 1.4); c.stroke();
    c.beginPath(); c.moveTo(s * 0.34, -s * 0.36); c.lineTo(s * 0.3, -s * 0.06); c.lineTo(s * 0.02, -s * 0.14); c.stroke();
  },
};

/** Flat avatar (no gendered features): head + rounded torso. facing -1/1 flips a little nose-less profile tilt. */
export function avatar(c: CanvasRenderingContext2D, x: number, feetY: number, s: number, body: string, head = body, facing = 1) {
  c.save(); c.translate(x, feetY); c.scale(facing, 1);
  c.fillStyle = body;
  rrect(c, -s * 0.36, -s * 1.08, s * 0.72, s * 1.08, [s * 0.34, s * 0.34, s * 0.06, s * 0.06]); c.fill();
  c.fillStyle = head;
  c.beginPath(); c.arc(s * 0.04, -s * 1.38, s * 0.24, 0, Math.PI * 2); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the city map (scenes 1 and 7)
export const MAP = {
  streetsH: [330, 560, 790, 1000],
  streetsV: [180, 560, 940, 1320, 1700],
  /** the planned route: start → … → destination */
  route: [pt(180, 1000), pt(180, 790), pt(940, 790), pt(940, 560), pt(1700, 560), pt(1700, 330)],
  /** the street that no longer exists: y = 560, x 940 → 1700 */
  gone: { x0: 940, x1: 1700, y: 560 },
  /** how far along the route the car gets before the vanished street */
  stopK: 0.0,
  /** the new streets of the updated map (scene 7) and the corrected route */
  fresh: [[pt(1320, 440), pt(1700, 440)]],
  route2: [pt(180, 1000), pt(180, 790), pt(1320, 790), pt(1320, 440), pt(1700, 440), pt(1700, 330)],
};
{
  const r = MAP.route; const L = polyLen(r);
  MAP.stopK = (polyLen(r.slice(0, 4)) - 46) / L; // just before the turn onto the vanished street
}

/** Streets in Gris 2 (the vanished one fades with `gone` 0..1). */
export function drawStreets(c: CanvasRenderingContext2D, gone = 0, alpha = 1, skipGone = true) {
  c.save(); c.globalAlpha *= alpha;
  // city blocks: buildings, and two parks with trees
  const xs = [60, ...MAP.streetsV, 1860], ys = [250, ...MAP.streetsH, 1080];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x0 = xs[i]! + 34, x1 = xs[i + 1]! - 34, y0 = ys[j]! + 34, y1 = ys[j + 1]! - 34;
    if (x1 - x0 < 40 || y1 - y0 < 40) continue;
    const park = (i * 7 + j * 3) % 9 === 4;
    if (park) {
      c.fillStyle = hexA(C.verde, 0.16); rrect(c, x0, y0, x1 - x0, y1 - y0, 18); c.fill();
      for (let k = 0; k < 6; k++) {
        const tx = x0 + 30 + ((k * 97 + i * 31) % Math.max(1, x1 - x0 - 60)), ty = y0 + 30 + ((k * 61 + j * 17) % Math.max(1, y1 - y0 - 60));
        c.fillStyle = hexA(C.verde, 0.42); c.beginPath(); c.arc(tx, ty, 16 + (k % 3) * 5, 0, Math.PI * 2); c.fill();
      }
    } else {
      // two or three buildings per block
      const n = 2 + ((i + j) % 2), gap = 14, bw = (x1 - x0 - gap * (n - 1)) / n;
      for (let k = 0; k < n; k++) {
        const h = (y1 - y0) * (0.55 + 0.45 * (((i * 5 + j * 3 + k * 7) % 5) / 4));
        c.fillStyle = hexA(C.gris2, 0.32); rrect(c, x0 + k * (bw + gap), y1 - h, bw, h, 10); c.fill();
        c.fillStyle = hexA(C.gris2, 0.5); rrect(c, x0 + k * (bw + gap) + 10, y1 - h + 10, bw - 20, 10, 5); c.fill();
      }
    }
  }
  c.strokeStyle = C.gris2; c.lineWidth = 46; c.lineCap = 'round';
  const g = MAP.gone;
  for (const y of MAP.streetsH) {
    c.beginPath();
    if (y === g.y && skipGone) { c.moveTo(60, y); c.lineTo(g.x0, y); c.moveTo(g.x1, y); c.lineTo(1860, y); }
    else { c.moveTo(60, y); c.lineTo(1860, y); }
    c.stroke();
  }
  for (const x of MAP.streetsV) { c.beginPath(); c.moveTo(x, 250); c.lineTo(x, 1080); c.stroke(); }
  if (skipGone && gone < 1) {
    c.globalAlpha *= 1 - gone;
    c.beginPath(); c.moveTo(g.x0, g.y); c.lineTo(g.x1, g.y); c.stroke();
  }
  // blocks get a few thin lane marks for texture
  c.globalAlpha = alpha * 0.9;
  c.strokeStyle = C.blanco; c.lineWidth = 4; c.setLineDash([18, 22]);
  for (const y of MAP.streetsH) { c.beginPath(); c.moveTo(60, y); c.lineTo(1860, y); c.stroke(); }
  c.setLineDash([]);
  c.restore();
}

// ------------------------------------------------------------------ base plate
/** A plate drawn with Canvas2D on a 1920x1080 layer; post-processing kept flat so brand colours stay exact. */
export abstract class Plate extends Scene {
  L = new Layer2D();
  S!: Script;
  /** Background of the previous plate: when set, this plate opens with a circle reveal over it. */
  prevBg?: string;
  revealFrom: P = pt(960, 540);
  revealDur = 0.55;
  override async init() {
    await loadJakarta();
    this.S = new Script(this.ctx.lyrics);
    await this.load();
    this.setup();
  }
  /** Async assets (images). */
  async load(): Promise<void> {}
  /** Resolve word times here (throws loudly if the script changed). */
  setup(): void {}
  abstract draw(c: CanvasRenderingContext2D, t: number, f: Frame): PostOverrides | void;
  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const c = this.L.ctx;
    const r = this.prevBg ? ease.inOutCubic(clamp((f.t - this.ctx.start) / this.revealDur)) : 1;
    this.L.clear(r < 1 ? this.prevBg : C.blanco);
    c.lineCap = 'round'; c.lineJoin = 'round';
    let ov: PostOverrides | void;
    if (r < 1) {
      c.save();
      c.beginPath(); c.arc(this.revealFrom.x, this.revealFrom.y, 2300 * r, 0, Math.PI * 2); c.clip();
      c.fillStyle = C.blanco; c.fillRect(0, 0, 1920, 1080);
      ov = this.draw(c, f.t, f);
      c.restore();
    } else ov = this.draw(c, f.t, f);
    drawFooter(c, f.t);
    this.ctx.comp.draw(this.ctx.renderer, this.L.upload(), out, { mode: 'replace' });
    return { bloom: 0, halation: 0, ca: 0, grain: 0, vignette: 0, hud: 0, flat: 1, ...(ov ?? {}) };
  }
}

/** Small pill bottom-left: Foresight · ACH Q2 2026 · Tendencia X · Insight X. Readable on blue and on white. */
export function drawFooter(c: CanvasRenderingContext2D, t: number) {
  const k = clamp((t - 0.4) / 0.5);
  if (k <= 0) return;
  const size = 22, padX = 22, h = 44, x = 40, y = 1080 - 40 - h;
  c.save(); c.globalAlpha = ease.outCubic(k);
  const parts = FOOTER;
  const sep = '   ·   ';
  const wText = parts.reduce((a, s2, i) => a + measureText(c, s2, i === 0 ? 700 : 500, size) + (i ? measureText(c, sep, 500, size) : 0), 0);
  rrect(c, x, y, wText + padX * 2, h, h / 2);
  c.fillStyle = hexA(C.azul, 0.92); c.fill();
  c.strokeStyle = hexA(C.blanco, 0.35); c.lineWidth = 2; c.stroke();
  let tx = x + padX;
  parts.forEach((s2, i) => {
    if (i) { text(c, sep, tx, y + h / 2 + size * 0.36, { w: 500, size, col: hexA(C.blanco, 0.6) }); tx += measureText(c, sep, 500, size); }
    text(c, s2, tx, y + h / 2 + size * 0.36, { w: i === 0 ? 700 : 500, size, col: C.blanco });
    tx += measureText(c, s2, i === 0 ? 700 : 500, size);
  });
  c.restore();
}

// ------------------------------------------------------------------ effects
/** Soft coloured glow around whatever fn draws. */
export function glow(c: CanvasRenderingContext2D, col: string, blur: number, fn: () => void) {
  c.save(); c.shadowColor = col; c.shadowBlur = blur; fn(); c.restore();
}
/** Sparkle burst: short rays flying out from (x, y) after t0. */
export function burst(c: CanvasRenderingContext2D, x: number, y: number, t: number, t0: number, col: string = C.amarillo, r = 70, n = 8, rot = 0) {
  const k = (t - t0) / 0.55;
  if (k <= 0 || k >= 1) return;
  const e = ease.outCubic(k);
  c.save(); c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 7 * (1 - k) + 1; c.globalAlpha *= 1 - ease.inQuad(k);
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2, r0 = r * (0.55 + 0.6 * e), r1 = r * (0.75 + 0.85 * e);
    c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke();
  }
  c.restore();
}
/** Expanding ring pulse. */
export function ripple(c: CanvasRenderingContext2D, x: number, y: number, t: number, t0: number, col: string, r0 = 30, r1 = 120, d = 0.9) {
  const k = (t - t0) / d;
  if (k <= 0 || k >= 1) return;
  c.save(); c.strokeStyle = col; c.globalAlpha *= 1 - k; c.lineWidth = 8 * (1 - k) + 2;
  c.beginPath(); c.arc(x, y, lerp(r0, r1, ease.outCubic(k)), 0, Math.PI * 2); c.stroke(); c.restore();
}
/** Gentle idle float. */
export const float = (t: number, i = 0, amp = 6, sp = 1.3) => amp * Math.sin(t * sp + i * 1.7);

/** Slowly drifting geometric shapes behind a plate (rings, dots, rounded squares, crosses). */
export function decor(c: CanvasRenderingContext2D, t: number, onBlue: boolean, seed = 1, alpha = 1) {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  c.save();
  const col = onBlue ? C.blanco : C.azul;
  for (let i = 0; i < 14; i++) {
    const x0 = rnd() * 1920, y0 = rnd() * 1080, sz = 14 + rnd() * 46, kind = Math.floor(rnd() * 4), sp = 0.15 + rnd() * 0.3, ph = rnd() * 6;
    const x = x0 + Math.sin(t * sp + ph) * 26, y = y0 + Math.cos(t * sp * 0.8 + ph) * 20, rot = t * sp * 0.6 + ph;
    c.globalAlpha = alpha * (onBlue ? 0.09 : 0.06) * (0.6 + 0.4 * Math.sin(t * 0.7 + ph));
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 5;
    c.save(); c.translate(x, y); c.rotate(rot);
    if (kind === 0) { c.beginPath(); c.arc(0, 0, sz, 0, Math.PI * 2); c.stroke(); }
    else if (kind === 1) { c.beginPath(); c.arc(0, 0, sz * 0.35, 0, Math.PI * 2); c.fill(); }
    else if (kind === 2) { rrect(c, -sz * 0.6, -sz * 0.6, sz * 1.2, sz * 1.2, sz * 0.25); c.stroke(); }
    else { c.beginPath(); c.moveTo(-sz * 0.5, 0); c.lineTo(sz * 0.5, 0); c.moveTo(0, -sz * 0.5); c.lineTo(0, sz * 0.5); c.stroke(); }
    c.restore();
  }
  c.restore();
}

// ------------------------------------------------------------------ people
export type Mood = 'neutral' | 'smile' | 'happy' | 'worry' | 'surprised' | 'talk' | 'think';
export interface PersonOpts {
  shirt?: string; pants?: string; skin?: string; hair?: string; collar?: string;
  /** arm angles (rad) from hanging straight down; positive swings outwards. Omit for an idle swing. */
  armL?: number; armR?: number;
  /** forearm bend (rad) */
  elbowL?: number; elbowR?: number;
  mood?: Mood;
  /** eye direction -1..1 */
  look?: number;
  /** horizontal squash for turning (1 = front) */
  turn?: number;
  seed?: number;
  /** 'short' (neutral) or 'long' (a woman's long hair, lashes, earrings) */
  style?: 'short' | 'long';
  /** extra head tilt (rad) and vertical hop (px) driven by the scene */
  tilt?: number; hop?: number;
  /** nodding 0..1 */
  nod?: number;
}
export const SKIN = '#F1C7A6';
export const SKIN2 = '#C98E6B';
export const HAIR = '#2D2453';
const INK = '#1E1B3A';

/** A flat character standing at (x, feetY), `h` px tall. It is never still: it breathes, sways, blinks and looks around. */
export function person(c: CanvasRenderingContext2D, x: number, feetY: number, h: number, t: number, o: PersonOpts = {}) {
  const shirt = o.shirt ?? C.morado, pants = o.pants ?? '#3F3A8C', skin = o.skin ?? SKIN, hair = o.hair ?? HAIR;
  const seed = o.seed ?? 1, u = h, long = o.style === 'long';
  const mood = o.mood ?? 'neutral';
  const br = Math.sin(t * 2.1 + seed) * 0.008;                      // breathing
  const sway = Math.sin(t * 0.9 + seed * 2) * 0.012;                 // weight shift
  const hop = o.hop ?? 0;
  c.save(); c.translate(x, feetY - hop); c.scale(o.turn ?? 1, 1);
  // shadow
  c.fillStyle = 'rgba(0,0,0,0.10)'; c.beginPath(); c.ellipse(0, 4 + hop, u * 0.2 * (1 - hop / 400), u * 0.025, 0, 0, Math.PI * 2); c.fill();
  // legs + shoes
  c.fillStyle = pants;
  const lw = long ? 0.085 : 0.095;
  rrect(c, -u * (0.01 + lw), -u * 0.47, u * lw, u * 0.46, u * 0.03); c.fill();
  rrect(c, u * 0.01, -u * 0.47, u * lw, u * 0.46, u * 0.03); c.fill();
  c.fillStyle = INK;
  c.beginPath(); c.ellipse(-u * 0.062, -u * 0.012, u * 0.068, u * 0.026, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(u * 0.062, -u * 0.012, u * 0.068, u * 0.026, 0, 0, Math.PI * 2); c.fill();
  // upper body sways around the hips
  c.save(); c.translate(0, -u * 0.46); c.rotate(sway); c.scale(1, 1 + br); c.translate(0, u * 0.46);
  const sh = long ? 0.13 : 0.15; // shoulder half-width
  const hy = -u * 0.925;
  // long hair falls behind the shoulders
  if (long) {
    c.fillStyle = hair;
    c.beginPath();
    c.moveTo(-u * 0.115, hy - u * 0.02);
    c.quadraticCurveTo(-u * 0.13, hy + u * 0.2, -u * 0.1 + Math.sin(t * 1.7 + seed) * u * 0.006, hy + u * 0.25);
    c.lineTo(u * 0.1 + Math.sin(t * 1.7 + seed + 1) * u * 0.006, hy + u * 0.25);
    c.quadraticCurveTo(u * 0.13, hy + u * 0.2, u * 0.115, hy - u * 0.02);
    c.closePath(); c.fill();
  }
  // arms: upper arm (sleeve) + forearm (skin) with an elbow bend
  const arm = (side: number, ang: number, elbow: number) => {
    c.save(); c.translate(side * u * (sh - 0.01), -u * 0.765); c.rotate(-side * ang);
    c.fillStyle = shirt; rrect(c, -u * 0.04, -u * 0.015, u * 0.08, u * 0.17, u * 0.04); c.fill();
    c.translate(0, u * 0.15); c.rotate(-side * elbow);
    c.fillStyle = long ? shirt : skin; rrect(c, -u * 0.033, -u * 0.01, u * 0.066, u * (long ? 0.08 : 0.15), u * 0.033); c.fill();
    if (long) { c.fillStyle = skin; rrect(c, -u * 0.03, u * 0.06, u * 0.06, u * 0.09, u * 0.03); c.fill(); }
    c.fillStyle = skin; c.beginPath(); c.arc(0, u * 0.155, u * 0.037, 0, Math.PI * 2); c.fill();
    c.restore();
  };
  const idleL = 0.1 + Math.sin(t * 1.6 + seed) * 0.05, idleR = 0.1 + Math.sin(t * 1.6 + seed + 1.3) * 0.05;
  arm(-1, o.armL ?? idleL, o.elbowL ?? 0.1 + Math.sin(t * 1.3 + seed) * 0.06);
  arm(1, o.armR ?? idleR, o.elbowR ?? 0.1 + Math.sin(t * 1.3 + seed + 2) * 0.06);
  // torso
  c.fillStyle = shirt;
  c.beginPath();
  c.moveTo(-u * sh, -u * 0.74); c.quadraticCurveTo(-u * (sh + 0.01), -u * 0.8, -u * 0.09, -u * 0.8);
  c.lineTo(u * 0.09, -u * 0.8); c.quadraticCurveTo(u * (sh + 0.01), -u * 0.8, u * sh, -u * 0.74);
  if (long) { c.lineTo(u * 0.1, -u * 0.6); c.lineTo(u * 0.135, -u * 0.44); c.lineTo(-u * 0.135, -u * 0.44); c.lineTo(-u * 0.1, -u * 0.6); }
  else { c.lineTo(u * 0.125, -u * 0.44); c.lineTo(-u * 0.125, -u * 0.44); }
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.10)'; c.fillRect(-u * 0.125, -u * 0.465, u * 0.25, u * 0.025);
  // neck + collar
  c.fillStyle = skin; rrect(c, -u * 0.03, -u * 0.84, u * 0.06, u * 0.06, u * 0.02); c.fill();
  c.fillStyle = o.collar ?? C.blanco;
  if (long) { c.beginPath(); c.arc(0, -u * 0.8, u * 0.05, 0, Math.PI); c.fill(); c.fillStyle = skin; c.beginPath(); c.arc(0, -u * 0.8, u * 0.034, 0, Math.PI); c.fill(); }
  else { c.beginPath(); c.moveTo(-u * 0.06, -u * 0.8); c.lineTo(0, -u * 0.74); c.lineTo(u * 0.06, -u * 0.8); c.lineTo(u * 0.035, -u * 0.8); c.lineTo(0, -u * 0.765); c.lineTo(-u * 0.035, -u * 0.8); c.closePath(); c.fill(); }

  // head: tilts, nods and glances around on its own
  const tilt = (o.tilt ?? 0) + Math.sin(t * 0.7 + seed * 3) * 0.05 + (mood === 'think' ? 0.12 : 0);
  const nod = (o.nod ?? 0) * Math.max(0, Math.sin(t * 7)) * u * 0.012;
  c.save(); c.translate(0, -u * 0.84); c.rotate(tilt); c.translate(0, u * 0.84 + nod);
  c.fillStyle = skin; c.beginPath(); c.ellipse(0, hy, u * 0.095, u * 0.105, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(-u * 0.094, hy + u * 0.01, u * 0.02, 0, Math.PI * 2); c.arc(u * 0.094, hy + u * 0.01, u * 0.02, 0, Math.PI * 2); c.fill();
  if (long) { c.fillStyle = C.amarillo; c.beginPath(); c.arc(-u * 0.096, hy + u * 0.04, u * 0.011, 0, Math.PI * 2); c.arc(u * 0.096, hy + u * 0.04, u * 0.011, 0, Math.PI * 2); c.fill(); }
  // hair
  c.fillStyle = hair;
  c.beginPath();
  if (long) {
    // fringe swept to one side
    c.moveTo(-u * 0.105, hy + u * 0.03);
    c.bezierCurveTo(-u * 0.13, hy - u * 0.15, u * 0.11, hy - u * 0.17, u * 0.108, hy + u * 0.03);
    c.quadraticCurveTo(u * 0.08, hy - u * 0.07, -u * 0.02, hy - u * 0.06);
    c.quadraticCurveTo(-u * 0.07, hy - u * 0.02, -u * 0.105, hy + u * 0.03);
  } else {
    c.moveTo(-u * 0.1, hy + u * 0.01);
    c.bezierCurveTo(-u * 0.115, hy - u * 0.12, u * 0.06, hy - u * 0.16, u * 0.1, hy - u * 0.04);
    c.quadraticCurveTo(u * 0.105, hy + u * 0.0, u * 0.095, hy + u * 0.02);
    c.quadraticCurveTo(u * 0.06, hy - u * 0.06, -u * 0.03, hy - u * 0.055);
    c.quadraticCurveTo(-u * 0.075, hy - u * 0.04, -u * 0.1, hy + u * 0.01);
  }
  c.fill();
  // eyes: glance around now and then, blink every few seconds
  const glance = Math.sin(t * 0.55 + seed) > 0.75 ? Math.sign(Math.sin(t * 0.3 + seed)) * 0.6 : 0;
  const lk = ((o.look ?? 0) + glance * 0.5) * u * 0.016;
  const bp = (t * 0.31 + seed * 0.17) % 1;
  const blink = bp < 0.03 ? 0.12 : 1;
  const big = mood === 'surprised' ? 1.35 : mood === 'happy' ? 0.9 : 1;
  for (const ex of [-1, 1]) {
    const exx = ex * u * 0.036 + lk, ey = hy + u * 0.005;
    if (mood === 'happy' && blink > 0.5) {
      // smiling eyes ^ ^
      c.strokeStyle = INK; c.lineWidth = Math.max(2, u * 0.009); c.lineCap = 'round';
      c.beginPath(); c.arc(exx, ey + u * 0.006, u * 0.014, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      continue;
    }
    c.fillStyle = INK; c.beginPath(); c.ellipse(exx, ey, u * 0.012 * big, u * 0.016 * blink * big, 0, 0, Math.PI * 2); c.fill();
    if (blink > 0.5) { c.fillStyle = C.blanco; c.beginPath(); c.arc(exx + u * 0.004, ey - u * 0.006, u * 0.0045 * big, 0, Math.PI * 2); c.fill(); }
    if (long && blink > 0.5) { c.strokeStyle = INK; c.lineWidth = Math.max(1.5, u * 0.005); c.beginPath(); c.moveTo(exx + ex * u * 0.01, ey - u * 0.012); c.lineTo(exx + ex * u * 0.02, ey - u * 0.02); c.stroke(); }
  }
  // brows
  c.strokeStyle = INK; c.lineWidth = Math.max(2, u * 0.008); c.lineCap = 'round';
  const browY = hy - u * 0.032 - (mood === 'surprised' ? u * 0.014 : 0) - (mood === 'talk' ? Math.max(0, Math.sin(t * 5)) * u * 0.006 : 0);
  for (const ex of [-1, 1]) {
    const inner = mood === 'worry' ? -u * 0.012 : mood === 'think' && ex > 0 ? -u * 0.01 : 0;
    c.beginPath(); c.moveTo(ex * u * 0.054 + lk, browY); c.lineTo(ex * u * 0.02 + lk, browY + inner); c.stroke();
  }
  // mouth
  const my = hy + u * 0.055;
  c.beginPath();
  if (mood === 'worry') { c.arc(lk, my + u * 0.016, u * 0.022, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  else if (mood === 'smile') { c.arc(lk, my - u * 0.02, u * 0.03, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); }
  else if (mood === 'happy') {
    c.moveTo(lk - u * 0.03, my - u * 0.006); c.quadraticCurveTo(lk, my + u * 0.04, lk + u * 0.03, my - u * 0.006); c.closePath();
    c.fillStyle = INK; c.fill();
    c.fillStyle = '#E86D6D'; c.beginPath(); c.ellipse(lk, my + u * 0.012, u * 0.013, u * 0.007, 0, 0, Math.PI * 2); c.fill();
  }
  else if (mood === 'surprised') { c.fillStyle = INK; c.ellipse(lk, my + u * 0.004, u * 0.011, u * 0.016, 0, 0, Math.PI * 2); c.fill(); }
  else if (mood === 'talk') {
    const open = Math.abs(Math.sin(t * 9)) * 0.7 + Math.abs(Math.sin(t * 5.3)) * 0.3;
    c.fillStyle = INK; c.ellipse(lk, my, u * 0.02, u * (0.004 + 0.014 * open), 0, 0, Math.PI * 2); c.fill();
  }
  else if (mood === 'think') { c.moveTo(lk - u * 0.012, my + u * 0.002); c.quadraticCurveTo(lk + u * 0.004, my - u * 0.006, lk + u * 0.02, my - u * 0.002); c.stroke(); }
  else { c.arc(lk, my - u * 0.012, u * 0.02, Math.PI * 0.3, Math.PI * 0.7); c.stroke(); }
  // cheeks
  c.fillStyle = hexA(C.naranja, mood === 'happy' || mood === 'smile' ? 0.32 : 0.2);
  for (const ex of [-1, 1]) { c.beginPath(); c.ellipse(ex * u * 0.06, hy + u * 0.038, u * 0.018, u * 0.012, 0, 0, Math.PI * 2); c.fill(); }
  // a sweat drop when worried
  if (mood === 'worry') {
    const d = (t * 0.8) % 1;
    c.fillStyle = hexA('#7FB8F0', 1 - d); c.beginPath();
    const sx = u * 0.1, sy = hy - u * 0.03 + d * u * 0.05;
    c.moveTo(sx, sy - u * 0.02); c.quadraticCurveTo(sx + u * 0.014, sy, sx, sy + u * 0.008); c.quadraticCurveTo(sx - u * 0.014, sy, sx, sy - u * 0.02); c.fill();
  }
  c.restore(); // head
  c.restore(); // upper body
  c.restore();
}

// ------------------------------------------------------------------ illustrated character (cut-out kit)
/** One key of a character's timeline: from time `at` it holds `pose` with `head`. */
export interface CutKey { at: number; pose: string; head: string; flip?: boolean }
interface CutManifest { scale: number; poses: Record<string, { file: string; w: number; h: number; head: [number, number] }>; heads: Record<string, { file: string; w: number; h: number }> }

/**
 * An illustrated character from a cut-out kit (app/public/personaje/): full-body poses plus swappable
 * heads (expressions). It is never still: it breathes, sways from the feet, bounces into each new pose
 * and its expression changes on the keys the scene gives it (with quick "talk" flicks in between).
 */
export class Cutout {
  m!: CutManifest;
  img = new Map<string, HTMLImageElement>();
  constructor(public dir = 'personaje') {}
  async load() {
    this.m = await (await fetch(`${this.dir}/personaje.json`)).json();
    const files = [...Object.values(this.m.poses), ...Object.values(this.m.heads)].map((x) => x.file);
    await Promise.all(files.map(async (f) => { const im = await loadImage(`${this.dir}/${f}`); if (im) this.img.set(f, im); }));
  }
  /** Draw at (x, feetY), `h` px tall, following `keys` (sorted by time). `talk`: alternate the head with `talkHead` while speaking. */
  draw(c: CanvasRenderingContext2D, x: number, feetY: number, h: number, t: number, keys: CutKey[], o: { hop?: number; seed?: number; talk?: [number, number][]; talkHead?: string } = {}) {
    if (!this.m) return;
    let i = 0;
    for (let k = 0; k < keys.length; k++) if (t >= keys[k]!.at) i = k;
    const key = keys[i]!, prev = keys[i - 1];
    const P = this.m.poses[key.pose]!, sc = h / P.h, seed = o.seed ?? 1;
    // bounce into a new pose (squash and stretch) when the pose itself changes
    const poseChanged = prev && prev.pose !== key.pose;
    const dt = t - key.at;
    const bounce = poseChanged && dt < 0.35 ? Math.sin(clamp(dt / 0.35) * Math.PI) * (1 - dt / 0.35) : 0;
    const breath = Math.sin(t * 2.2 + seed) * 0.008;
    const sway = Math.sin(t * 0.9 + seed * 2) * 0.012;
    c.save();
    c.translate(x, feetY - (o.hop ?? 0));
    // soft floor shadow
    c.fillStyle = 'rgba(0,0,0,0.10)'; c.beginPath(); c.ellipse(0, 4 + (o.hop ?? 0), P.w * sc * 0.42, h * 0.022, 0, 0, Math.PI * 2); c.fill();
    c.rotate(sway);
    c.scale((key.flip ? -1 : 1) * (1 + bounce * 0.05), 1 + breath - bounce * 0.05);
    // a short crossfade from the previous pose hides the swap
    const fade = poseChanged ? clamp(dt / 0.1) : 1;
    const drawPose = (k: CutKey, a: number) => {
      const pp = this.m.poses[k.pose]!, s2 = h / pp.h;
      const im = this.img.get(pp.file);
      if (!im || a <= 0) return;
      c.save(); c.globalAlpha *= a;
      c.translate(-pp.w * s2 / 2, -h);
      c.drawImage(im, 0, 0, pp.w * s2, pp.h * s2);
      // expression: the head is swapped on top (same size and place in every pose)
      let head = k.head;
      if (o.talk && o.talkHead) for (const [a0, a1] of o.talk) if (t >= a0 && t < a1 && Math.floor((t - a0) * 7) % 2 === 1) head = o.talkHead;
      const hd = this.m.heads[head], him = hd && this.img.get(hd.file);
      if (hd && him) {
        // the head nods a little on its own
        const nod = Math.sin(t * 1.7 + seed) * 0.02;
        c.translate(pp.head[0] * s2 + hd.w * s2 / 2, pp.head[1] * s2 + hd.h * s2);
        c.rotate(nod);
        c.drawImage(him, -hd.w * s2 / 2, -hd.h * s2, hd.w * s2, hd.h * s2);
      }
      c.restore();
    };
    if (prev && fade < 1) drawPose(prev, 1 - fade);
    drawPose(key, fade);
    c.restore();
  }
}

// ------------------------------------------------------------------ images (logos)
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
}
/** The image recoloured to one flat colour (keeps its alpha). */
export function tinted(im: HTMLImageElement, col: string): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d')!; x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/** Small camera shake (2–3 frames) after t0. */
export function stampShake(t: number, t0: number, amp = 10): [number, number] {
  const d = t - t0;
  if (d < 0 || d > 0.1) return [0, 0];
  const k = 1 - d / 0.1;
  return [amp * k * Math.sin(d * 190), amp * k * Math.cos(d * 230)];
}
