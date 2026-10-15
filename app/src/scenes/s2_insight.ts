// ESCENA 2 — El insight (fondo azul Icesi)
// "Lo mismo le puede pasar a un modelo de crédito. Y la consecuencia es clara: si no se reentrena y no
// se puede explicar, deja de ser inclusivo."
// The GPS screen becomes a credit-score board: white client cards (purple person) and a green gauge.
// On "deja de ser inclusivo" some cards switch off one by one (0.15 s cascade). The headline comes in
// word by word from below with a slight blur, each word on the spoken word it stands for; "degrada"
// gets a thick orange underline drawn left to right.
import type { Frame, PostOverrides } from '../engine/scene';
import type { Word } from '../engine/lyrics';
import { C, Plate, at, decor, float, glow, hexA, clamp, ease, fit, icon, inn, labelPill, lerp, measureText, mixHex, pop, rrect, text } from './_icesi';

const CW = 330, CH = 150, GAP = 28, X0 = 257, Y0 = 250;
const OFF = [4, 1, 5, 2]; // cards that switch off, in order

export default class S2 extends Plate {
  tLabel = 0; tDim = 0;
  head: { s: string; at: number; line: number }[] = [];
  tUnder = 0;

  override setup() {
    const S = this.S, L2 = 'consecuencia es clara';
    const w = (q: string, n = 0) => S.word(L2, q, n).start;
    this.tLabel = S.word('Lo mismo le puede', 'modelo').start;
    this.tDim = w('deja');
    const inc = S.word(L2, 'inclusivo.') as Word;
    // the headline is the spoken sentence itself, each word on its spoken word
    const L = S.line(L2);
    const i0 = L.words.findIndex((x) => x.w.toLowerCase() === 'si'), iD = L.words.findIndex((x) => x.w.toLowerCase() === 'deja');
    this.head = L.words.slice(i0).map((x, k) => ({ s: k === 0 ? 'Si' : x.w, at: x.start, line: i0 + k < iD ? 0 : 1 }));
    this.tUnder = inc.end - 0.1;
  }

  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    c.fillStyle = C.azul; c.fillRect(0, 0, 1920, 1080);
    const t0 = this.ctx.start;
    decor(c, t, true, 2);

    // board label
    const li = inn(t, this.tLabel, 0.4);
    at(c, X0 + (3 * CW + 2 * GAP) / 2, Y0 - 66, { a: li, dy: (1 - li) * 16 }, () =>
      labelPill(c, 'Modelo de crédito', 0, 0, { fill: 'rgba(255,255,255,0.16)', col: C.blanco, size: 32, w: 600 }));

    // client cards
    for (let i = 0; i < 6; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const x = X0 + col * (CW + GAP), y = Y0 + row * (CH + GAP);
      const s = pop(t, t0 + 0.12 + i * 0.07, 0.45);
      const oi = OFF.indexOf(i);
      const off = oi < 0 ? 0 : ease.outCubic(clamp((t - this.tDim - oi * 0.15) / 0.3));
      at(c, x + CW / 2, y + CH / 2 + float(t, i, 4, 1.4) + off * 6, { s }, () => {
        c.save(); c.shadowColor = 'rgba(20,20,90,0.28)'; c.shadowBlur = 26; c.shadowOffsetY = 12 * (1 - off);
        rrect(c, -CW / 2, -CH / 2, CW, CH, 22);
        c.fillStyle = mixHex(C.blanco, C.gris2, off); c.fill();
        c.restore();
        at(c, -CW / 2 + 62, 0, {}, () => icon.person(c, 70, mixHex(C.morado, '#A9AAB0', off)));
        c.fillStyle = mixHex(C.gris2, '#B9BAC0', off);
        rrect(c, -CW / 2 + 118, -34, 150, 14, 7); c.fill();
        rrect(c, -CW / 2 + 118, -6, 104, 14, 7); c.fill();
        // tiny score meter
        rrect(c, -CW / 2 + 118, 28, 170, 16, 8); c.fillStyle = mixHex('#EEF0F3', '#C3C4CA', off); c.fill();
        rrect(c, -CW / 2 + 118, 28, 170 * lerp(0.82, 0.0, off) + 0.01, 16, 8); c.fillStyle = C.verde; c.fill();
      });
    }

    // the gauge
    const gx = X0 + 3 * CW + 2 * GAP + 60 + 150, gy = Y0 + CH + GAP / 2 + 70, R = 140;
    const gs = pop(t, t0 + 0.55, 0.5);
    const lvl = lerp(0.82, 0.38, ease.inOutCubic(clamp((t - this.tDim - 0.2) / 1.0)));
    at(c, gx, gy, { s: gs }, () => {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 30;
      c.beginPath(); c.arc(0, 0, R, Math.PI, 0); c.stroke();
      c.strokeStyle = C.verde;
      glow(c, hexA(C.verde, 0.8), 26, () => { c.beginPath(); c.arc(0, 0, R, Math.PI, Math.PI + Math.PI * lvl * inn(t, t0 + 0.7, 0.6)); c.stroke(); });
      const a = Math.PI + Math.PI * lvl + Math.sin(t * 9) * 0.015;
      c.strokeStyle = C.blanco; c.lineWidth = 10;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * (R - 40), Math.sin(a) * (R - 40)); c.stroke();
      c.fillStyle = C.blanco; c.beginPath(); c.arc(0, 0, 16, 0, Math.PI * 2); c.fill();
    });

    // headline, word by word from below with a slight blur
    const lines = [this.head.filter((h) => h.line === 0), this.head.filter((h) => h.line === 1)];
    const W8 = 800;
    const size = Math.min(fit(c, lines[0]!.map((h) => h.s).join(' '), W8, 1700, 80), 80);
    const sp = measureText(c, ' ', W8, size);
    lines.forEach((ws, li2) => {
      const total = ws.reduce((a, h) => a + measureText(c, h.s, W8, size), 0) + sp * (ws.length - 1);
      let x = 960 - total / 2;
      const y = 770 + li2 * (size * 1.22);
      for (const h of ws) {
        const k = inn(t, h.at - 0.05, 0.42);
        const ww = measureText(c, h.s, W8, size);
        if (k > 0) {
          c.save();
          c.filter = k < 1 ? `blur(${((1 - k) * 8).toFixed(2)}px)` : 'none';
          text(c, h.s, x, y + (1 - k) * 46, { w: W8, size, col: C.blanco, alpha: k });
          c.restore();
        }
        if (h.s.startsWith('inclusivo')) {
          const u = ease.inOutCubic(clamp((t - this.tUnder) / 0.5));
          if (u > 0) {
            c.fillStyle = C.naranja;
            const uw = measureText(c, 'inclusivo', W8, size);
            glow(c, hexA(C.naranja, 0.9), 20, () => { rrect(c, x, y + 16, uw * u, 14, 7); c.fill(); });
          }
        }
        x += ww + sp;
      }
    });
    return {};
  }
}
