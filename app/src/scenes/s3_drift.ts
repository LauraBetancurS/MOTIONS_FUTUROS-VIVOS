// ESCENA 3 — Qué es el model drift (fondo blanco)
// "Un modelo puede ser muy preciso el día que se lanza. Pero el mundo cambia: los precios, los ingresos,
// las normas, los fraudes y la forma en que la gente paga. Si el modelo no se actualiza, sigue decidiendo
// con datos de un mundo que ya no existe. A eso se le llama model drift."
// A "model accuracy" line chart (no numbers, Gris 1 axes) starts high and green. Each factor the voice
// names pops in as a purple line icon (and is typed under the chart), pushing the line down; it turns from
// green to orange. On "model drift" a dashed blue "reality" line separates from it and the gap between
// them fills with Amarillo Icesi at 40%: that gap is the drift.
import type { Frame, PostOverrides } from '../engine/scene';
import { C, Plate, at, outk, decor, float, glow, burst, ripple, clamp, ease, hexA, icon, inn, lerp, measureText, mixHex, pop, rrect, text, wrap , tornPaper, tape, clip, scribbleCircle, doodleArrow, pt } from './_icesi';

const X0 = 200, X1 = 1340, YB = 800, YT = 250;
const V0 = 0.86, DROPS = [0.08, 0.07, 0.08, 0.09, 0.09];
const FACT = [
  { q: 'precios,', s: 'Precios', ic: icon.bill },
  { q: 'ingresos,', s: 'Ingresos', ic: icon.wallet },
  { q: 'normas,', s: 'Normas', ic: icon.scale },
  { q: 'fraudes', s: 'Fraudes', ic: icon.brokenLock },
  { q: 'forma', s: 'La forma en que la gente paga', ic: icon.phone },
];

export default class S3 extends Plate {
  tA = 0; tB = 0; tCambia = 0; tPrec = 0; tDrift = 0; tf: number[] = [];

  override setup() {
    const S = this.S;
    this.prevBg = C.azul;
    this.tA = this.ctx.start + 0.5;
    this.tB = S.word('ya no existe.', 'existe.').end;
    this.tPrec = S.word('muy preciso', 'preciso').start;
    this.tf = FACT.map((f) => S.word('el mundo cambia', f.q).start);
    this.tDrift = S.word('model drift', 'model').start;
    this.tCambia = S.word('el mundo cambia', 'mundo').start;
  }

  v(tau: number) {
    let v = V0 + 0.012 * Math.sin(tau * 2.3) + 0.008 * Math.sin(tau * 5.1);
    this.tf.forEach((tf, i) => { v -= DROPS[i]! * ease.inOutCubic(clamp((tau - tf - 0.1) / 0.6)); });
    return v;
  }
  xOf(tau: number) { return lerp(X0 + 20, X1, clamp((tau - this.tA) / (this.tB - this.tA))); }
  tauOf(x: number) { return this.tA + ((x - X0 - 20) / (X1 - X0 - 20)) * (this.tB - this.tA); }
  y(v: number) { return YB - ((v - 0.22) / 0.72) * (YB - YT); }
  reality(x: number) { return V0 + 0.012 * Math.sin(this.tauOf(x) * 2.3) - 0.02 * clamp((x - X0) / (X1 - X0)); }

  /** "El mundo cambia: precios · ingresos · …" typed under the chart, each factor as the voice names it. */
  typed(c: CanvasRenderingContext2D, t: number) {
    const SZ = 34, Y = 935, X = X0;
    const segs: { s: string; at: number; key: boolean }[] = [{ s: 'El mundo cambia:', at: this.tCambia, key: false }];
    FACT.forEach((f, i) => segs.push({ s: (i ? '· ' : ' ') + f.s, at: this.tf[i]!, key: true }));
    const CPS = 34; // characters per second
    let x = X, cursor: { x: number; on: boolean } | null = null;
    for (const [i, g] of segs.entries()) {
      const lead = i > 1 ? ' ' : i === 1 ? '' : '';
      const full = lead + g.s;
      const n = Math.floor(clamp((t - g.at + 0.05) * CPS, 0, full.length));
      if (n <= 0) break;
      const shown = full.slice(0, n);
      const w8 = i === 0 ? 500 : 700;
      // the factor being typed gets a yellow marker behind it, which fades once the next one starts
      if (g.key) {
        const word = full.replace(/^[ ·]+/, ''), pre = full.length - word.length;
        const wx = x + measureText(c, full.slice(0, pre), w8, SZ);
        const ww = measureText(c, word.slice(0, Math.max(0, n - pre)), w8, SZ);
        const next = segs[i + 1]?.at ?? Infinity;
        const fade = 1 - 0.65 * clamp((t - next) / 0.4);
        c.fillStyle = hexA(C.amarillo, 0.85 * fade);
        rrect(c, wx - 8, Y - SZ * 0.82, ww + 16, SZ * 1.12, 8); c.fill();
      }
      for (let k = 0; k < shown.length; k++) {
        const ch = shown[k]!;
        const age = t - (g.at - 0.05 + (k + 1) / CPS);
        const dy = (1 - ease.outCubic(clamp(age / 0.18))) * 10;
        text(c, ch, x + measureText(c, full.slice(0, k), w8, SZ), Y + dy, { w: w8, size: SZ, col: ch === '·' ? C.gris1 : i === 0 ? C.negro : C.azul, alpha: clamp(age / 0.08 + 0.3) });
      }
      const wFull = measureText(c, shown, w8, SZ);
      cursor = { x: x + wFull + 4, on: n < full.length || Math.floor(t * 2.4) % 2 === 0 };
      x += measureText(c, full, w8, SZ);
    }
    if (cursor && cursor.on && t < this.tDrift + 1.2) { c.fillStyle = C.azul; c.fillRect(cursor.x, Y - SZ * 0.78, 4, SZ * 0.98); }
  }

  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    const t0 = this.ctx.start;
    decor(c, t, false, 3);
    // axes (no numbers)
    const ax = inn(t, t0 + 0.05, 0.5);
    c.strokeStyle = C.gris1; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(X0, YB - (YB - YT + 30) * ax); c.lineTo(X0, YB); c.lineTo(X0 + (X1 - X0 + 30) * ax, YB); c.stroke();
    at(c, X0 - 34, (YT + YB) / 2, { r: -Math.PI / 2 }, () => text(c, 'Precisión del modelo', 0, 0, { w: 600, size: 30, col: C.gris1, align: 'center', alpha: ax }));
    text(c, 'Tiempo', X1 + 30, YB + 46, { w: 600, size: 28, col: C.gris1, align: 'right', alpha: ax });

    const headX = this.xOf(t);
    const xs: number[] = [];
    for (let x = X0 + 20; x <= headX; x += 5) xs.push(x);
    xs.push(headX);

    // reality + the drift gap
    const dr = ease.inOutCubic(clamp((t - this.tDrift) / 0.8));
    if (dr > 0 && xs.length > 1) {
      const xr = lerp(X0 + 20, headX, dr);
      c.save();
      c.beginPath();
      xs.filter((x) => x <= xr).forEach((x, i) => (i ? c.lineTo(x, this.y(this.reality(x))) : c.moveTo(x, this.y(this.reality(x)))));
      for (let i = xs.length - 1; i >= 0; i--) { const x = xs[i]!; if (x <= xr) c.lineTo(x, this.y(this.v(this.tauOf(x)))); }
      c.closePath(); c.fillStyle = hexA(C.amarillo, 0.4 * dr); c.fill();
      c.strokeStyle = C.azul; c.lineWidth = 6; c.setLineDash([16, 14]);
      c.beginPath();
      xs.filter((x) => x <= xr).forEach((x, i) => (i ? c.lineTo(x, this.y(this.reality(x))) : c.moveTo(x, this.y(this.reality(x)))));
      c.stroke(); c.setLineDash([]);
      c.restore();
      text(c, 'La realidad', X1 - 10, this.y(this.reality(X1)) - 26, { w: 600, size: 28, col: C.azul, align: 'right', alpha: inn(t, this.tDrift + 0.5) });
    }

    // the model line, green → orange as it drops
    if (t >= this.tA) {
      c.lineWidth = 10; c.lineCap = 'round';
      c.save(); c.shadowBlur = 18; c.shadowColor = mixHex(C.verde, C.naranja, clamp((V0 - this.v(this.tauOf(headX))) / 0.34), 0.55);
      for (let i = 1; i < xs.length; i++) {
        const a = xs[i - 1]!, b = xs[i]!;
        const va = this.v(this.tauOf(a)), vb = this.v(this.tauOf(b));
        c.strokeStyle = mixHex(C.verde, C.naranja, clamp((V0 - vb) / 0.34));
        c.beginPath(); c.moveTo(a, this.y(va)); c.lineTo(b, this.y(vb)); c.stroke();
      }
      c.restore();
      const hv = this.v(this.tauOf(headX));
      const hc = mixHex(C.verde, C.naranja, clamp((V0 - hv) / 0.34));
      c.fillStyle = hc;
      c.save(); c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6); c.beginPath(); c.arc(headX, this.y(hv), 26, 0, Math.PI * 2); c.fill(); c.restore();
      c.beginPath(); c.arc(headX, this.y(hv), 13, 0, Math.PI * 2); c.fill();
    }

    // launch label
    const lp = inn(t, this.tPrec - 0.1, 0.4) * outk(t, this.tf[0]! - 0.3);
    at(c, X0 + 40, this.y(V0) - 60, { a: lp, dy: (1 - lp) * 20 }, () => {
      text(c, 'Muy preciso el día que se lanza', 0, 0, { w: 500, size: 36, col: C.negro });
      const w = measureText(c, 'Muy preciso el día que se lanza', 500, 36);
      burst(c, w + 36, -12, t, this.tPrec + 0.2, C.verde, 44, 8);
      at(c, w + 36, -12, { s: pop(t, this.tPrec + 0.15) }, () => glow(c, hexA(C.verde, 0.7), 16, () => icon.check(c, 22, C.verde)));
    });

    // factors: icons around the line + pills underneath
    FACT.forEach((f, i) => {
      const tf = this.tf[i]!;
      const hx = this.xOf(tf), hy = this.y(this.v(tf));
      const s = pop(t, tf, 0.45);
      const ix = hx + 10, iy = hy - 120 + (i % 2) * -40 + (s >= 1 ? float(t, i, 5, 1.8) : 0);
      burst(c, ix, iy, t, tf + 0.08, C.amarillo, 70, 8, i * 0.4);
      at(c, ix, iy, { s }, () => {
        c.save(); c.shadowColor = hexA(C.morado, 0.35); c.shadowBlur = 24; c.shadowOffsetY = 6;
        c.fillStyle = C.blanco; c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill(); c.restore();
        c.strokeStyle = hexA(C.morado, 0.25); c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.stroke();
        f.ic(c, 72, C.morado);
      });
      ripple(c, hx, hy, t, tf + 0.2, C.naranja, 10, 60, 0.6);
    });
    this.typed(c, t);
    // marker loop around the drift gap
    scribbleCircle(c, 1060, 470, 280, 150, ease.inOutCubic(clamp((t - this.tDrift - 0.7) / 0.6)), C.azul, 6, 4);
    doodleArrow(c, pt(1340, 470), pt(1380, 420), pt(1410, 470), ease.inOutCubic(clamp((t - this.tDrift - 1.2) / 0.3)), C.azul, 6);

    // the definition box
    const bk = inn(t, this.tDrift - 0.1, 0.45);
    if (bk > 0) {
      const bx = 1420, by = 340, bw = 430, bh = 330;
      at(c, bx + bw / 2, by + bh / 2 + float(t, 2, 4, 1.2), { a: bk, s: lerp(0.92, 1, bk) }, () => {
        c.rotate(0.02); tornPaper(c, bw, bh, C.azul, 11, { tear: 9 });
        text(c, 'Model drift', -bw / 2 + 40, -bh / 2 + 92, { w: 700, size: 58, col: C.blanco, italic: true });
        c.fillStyle = C.amarillo; rrect(c, -bw / 2 + 40, -bh / 2 + 116, 90, 10, 5); c.fill();
        wrap(c, 'Decide con datos de un mundo que ya no existe.', 400, 36, bw - 80).forEach((l, i) =>
          text(c, l, -bw / 2 + 40, -bh / 2 + 186 + i * 48, { w: 400, size: 36, col: C.blanco }));
        tape(c, -bw / 2 + 30, -bh / 2 + 6, 120, -0.6, undefined, 3); tape(c, bw / 2 - 30, bh / 2 - 6, 120, -0.6, undefined, 8);
      });
      clip(c, bx + bw - 70, by - 18 + float(t, 2, 4, 1.2), 0.2, 1.2);
    }
    return {};
  }
}
