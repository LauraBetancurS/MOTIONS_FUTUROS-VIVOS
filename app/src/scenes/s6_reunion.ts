// ESCENA 6 — Llamada a la acción (fondo blanco)
// "Lleva dos preguntas a tu próxima reunión: ¿cada cuánto revisamos nuestros modelos? ¿Y podríamos
// explicar una decisión si nos la piden?"
// A whiteboard with a blue frame, seen head on. Two yellow sticky notes stick on (−3° and 2°, soft
// Gris 2 shadow). A flat hand draws a blue circle around the second one.
import type { Frame, PostOverrides } from '../engine/scene';
import { C, Plate, at, decor, glow, burst, hexA, SKIN, circlePts, clamp, ease, inn, lerp, polyAt, rrect, strokeTrim, text, wrap , doodle, measureText, pt } from './_icesi';

const NOTES = [
  { cx: 590, cy: 600, r: -3, s: '¿Cada cuánto revisamos nuestros modelos?' },
  { cx: 1310, cy: 600, r: 2, s: '¿Y podríamos explicar una decisión si nos la piden?' },
];
const RING = circlePts(1310, 600, 420, 300, -0.9, 1.06);

export default class S6 extends Plate {
  tHead = 0; tN: number[] = []; tRing = 0;

  override setup() {
    const S = this.S;
    this.prevBg = C.azul;
    this.tHead = S.word('Lleva dos preguntas', 'Lleva').start;
    this.tN = [S.line('cada cuánto revisamos').start, S.line('podríamos explicar').start];
    this.tRing = S.word('podríamos explicar', 'decisión').start;
  }

  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    const t0 = this.ctx.start;
    decor(c, t, false, 6);
    // the whiteboard
    const bi = inn(t, t0 + 0.02, 0.5);
    at(c, 960, 540, { s: lerp(0.94, 1, bi), a: bi }, () => {
      c.save(); c.shadowColor = hexA(C.azul, 0.25); c.shadowBlur = 50; c.shadowOffsetY = 18;
      rrect(c, -790, -440, 1580, 880, 26); c.fillStyle = C.blanco; c.fill(); c.restore();
      c.strokeStyle = C.azul; c.lineWidth = 18; c.stroke();
      c.fillStyle = C.azul; rrect(c, -300, 440, 600, 22, 11); c.fill();
    });
    const hk = inn(t, this.tHead, 0.4);
    text(c, 'Lleva dos preguntas a tu próxima reunión:', 270 + (1 - hk) * -20, 230, { w: 600, size: 46, col: C.azul, alpha: hk });
    { const hw = measureText(c, 'Lleva dos preguntas a tu próxima reunión:', 600, 46); c.save(); c.strokeStyle = C.amarillo; c.lineWidth = 10; strokeTrim(c, [pt(266, 248), pt(270 + hw, 244)], ease.inOutCubic(clamp((t - this.tHead - 0.3) / 0.5))); c.restore();
      doodle(c, 'star', 300 + hw + 40, 210, 26, C.amarillo, ease.inOutCubic(clamp((t - this.tHead - 0.7) / 0.4))); doodle(c, 'spark', 300 + hw + 100, 240, 18, C.azul, ease.inOutCubic(clamp((t - this.tHead - 0.8) / 0.3))); }

    // sticky notes
    NOTES.forEach((n, i) => {
      const k = clamp((t - this.tN[i]!) / 0.35);
      if (k <= 0) return;
      const e = ease.outBack(k, 1.6);
      const sway = Math.sin(t * 1.3 + i * 2) * 0.4;
      at(c, n.cx, n.cy - (1 - e) * 60, { r: ((n.r + sway * clamp(k)) * Math.PI) / 180, s: lerp(1.12, 1, e), a: clamp(k * 2.5) }, () => {
        c.shadowColor = 'rgba(206,207,212,0.9)'; c.shadowBlur = 22; c.shadowOffsetY = 10 * e;
        c.fillStyle = C.amarillo; c.fillRect(-280, -190, 560, 380);
        c.shadowColor = 'transparent';
        c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(-280, -190, 560, 34);
        // the tape
        c.fillStyle = hexA(C.blanco, 0.7); c.save(); c.rotate(-0.05); c.fillRect(-70, -210, 140, 40); c.restore();
        const fs = n.s.length > 44 ? 42 : 48;
        const ls = wrap(c, n.s, 700, fs, 480);
        ls.forEach((l, j) => text(c, l, -240, 14 + (j - (ls.length - 1) / 2) * fs * 1.28, { w: 700, size: fs, col: C.negro }));
      });
    });

    NOTES.forEach((n, i) => burst(c, n.cx, n.cy, t, this.tN[i]! + 0.25, C.amarillo, 330, 14, 0.2));
    // the hand draws a circle around note 2
    const rk = ease.inOutCubic(clamp((t - this.tRing) / 0.85));
    if (rk > 0) {
      c.strokeStyle = C.azul; c.lineWidth = 12; c.lineCap = 'round';
      glow(c, hexA(C.azul, 0.5), 18, () => strokeTrim(c, RING, rk));
      const away = ease.inCubic(clamp((t - this.tRing - 0.95) / 0.4));
      const p = polyAt(RING, rk);
      const hin = ease.outCubic(clamp((t - this.tRing + 0.3) / 0.3));
      at(c, p.x + away * 260, p.y + away * 340 + (1 - hin) * 300, { a: hin * (1 - away) }, () => {
        // marker
        c.save(); c.rotate(-0.6);
        rrect(c, -10, 0, 20, 120, 8); c.fillStyle = C.azul; c.fill();
        c.fillStyle = C.azul; c.beginPath(); c.moveTo(-7, 0); c.lineTo(0, -16); c.lineTo(7, 0); c.fill();
        c.restore();
        // hand (flat) with a purple sleeve
        c.fillStyle = SKIN;
        c.beginPath(); c.ellipse(40, 70, 44, 34, -0.6, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(16, 40, 14, 26, -0.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = C.morado; rrect(c, 50, 88, 78, 150, 30); c.fill();
        c.fillStyle = C.blanco; rrect(c, 50, 88, 78, 18, 9); c.fill();
      });
    }
    return {};
  }
}
