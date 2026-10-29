// ESCENA 4 — Ejemplo (fondo blanco con franja inferior azul)
// "Un ejemplo: un cliente se atrasa en un pago justo después de una subida fuerte de la inflación. El
// modelo lo marca como riesgoso, pero el problema fue el contexto, no la persona."
// A flat purple avatar in front of a blue line calendar; one day turns orange with a clock. The camera
// pulls out to reveal a thick blue inflation arrow rising behind the person like a wave. The RIESGOSO
// stamp drops on the client card (2–3 frames of shake). A green stroke underlines the inflation arrow,
// then strikes the stamp: the delay came from the context, not the person.
import type { Frame, PostOverrides } from '../engine/scene';
import { C, Plate, at, Cutout, type CutKey, decor, glow, burst, ripple, float, clamp, ease, icon, inn, labelPill, lerp, pop, pt, quadPts, rrect, stampShake, strokeTrim, text, polyAt, hexA } from './_icesi';

const CAL = { x: 1150, y: 220, w: 620, h: 470, cols: 7, rows: 4 };
const CARD = { x: 1060, y: 560, w: 380, h: 200 };
const ARROW = quadPts(pt(60, 900), pt(560, 860), pt(930, 250), 60);
const UNDER = quadPts(pt(120, 980), pt(640, 940), pt(1010, 330), 60);

export default class S4 extends Plate {
  tLate = 0; tPago = 0; tSube = 0; tInfl = 0; tStamp = 0; tCtx = 0; tPer = 0;

  char = new Cutout();
  keys: CutKey[] = [];
  override async load() { await this.char.load(); }

  override setup() {
    const S = this.S, L1 = 'se atrasa en un pago', L2 = 'lo marca como riesgoso';
    this.tLate = S.word(L1, 'atrasa').start;
    this.tPago = S.word(L1, 'pago').start;
    this.tSube = S.word(L1, 'subida').start;
    this.tInfl = S.word(L1, 'inflación.').start;
    this.tStamp = S.word(L2, 'riesgoso,').start;
    this.tCtx = S.word(L2, 'contexto,').start;
    this.tPer = S.word(L2, 'persona.').start;
    this.keys = [
      { at: -1, pose: 'neutral', head: 'sonrisa' },
      { at: this.tLate - 0.05, pose: 'neutral', head: 'sorpresa' },
      { at: this.tLate + 0.9, pose: 'idea', head: 'duda' },
      { at: this.tStamp + 0.15, pose: 'neutral', head: 'preocupada' },
      { at: this.tCtx + 0.2, pose: 'idea', head: 'habla' },
      { at: this.tPer + 0.15, pose: 'mano-pecho', head: 'feliz' },
    ];
  }

  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    const t0 = this.ctx.start;
    decor(c, t, false, 4);
    // bottom band (screen space)
    c.fillStyle = C.azul; c.fillRect(0, 900, 1920, 180);

    // camera: close on the person and the calendar, pulls out on "subida"
    const zo = ease.inOutCubic(clamp((t - this.tSube + 0.1) / 0.9));
    const z = lerp(1.32, 1, zo), cx = lerp(1060, 960, zo), cy = lerp(520, 540, zo);
    const [sx, sy] = stampShake(t, this.tStamp + 0.22, 12);
    c.save();
    c.beginPath(); c.rect(0, 0, 1920, 900); c.clip();
    c.translate(960 + sx, 540 + sy); c.scale(z, z); c.translate(-cx, -cy);

    // the inflation wave behind the person
    const ak = ease.inOutCubic(clamp((t - this.tSube) / 0.8));
    if (ak > 0) {
      c.strokeStyle = C.azul; c.lineWidth = 86; c.lineCap = 'butt';
      glow(c, hexA(C.azul, 0.45), 30, () => strokeTrim(c, ARROW, ak * 0.985));
      // prices riding up the wave
      for (let i = 0; i < 6; i++) {
        const u = ((t - this.tSube) * 0.28 + i / 6) % 1;
        if (u > ak * 0.95 || t < this.tSube + 0.3) continue;
        const p = polyAt(ARROW, u);
        const a = Math.sin(u * Math.PI);
        at(c, p.x, p.y, { s: 0.8 + 0.3 * a, a }, () => {
          c.fillStyle = C.amarillo; c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill();
          text(c, '$', 0, 10, { w: 800, size: 28, col: C.azul, align: 'center' });
        });
      }
      const h = polyAt(ARROW, ak);
      at(c, h.x, h.y, { r: h.a }, () => {
        c.fillStyle = C.azul; c.beginPath(); c.moveTo(80, 0); c.lineTo(-24, -86); c.lineTo(-24, 86); c.closePath(); c.fill();
      });
      c.lineCap = 'round';
    }
    // green underline of the arrow (the cause)
    const gk = ease.inOutCubic(clamp((t - this.tCtx) / 0.6));
    if (gk > 0) { c.strokeStyle = C.verde; c.lineWidth = 18; glow(c, hexA(C.verde, 0.8), 22, () => strokeTrim(c, UNDER, gk)); }

    // inflation cloud
    const ck = pop(t, this.tInfl, 0.5);
    at(c, 590, 240 + (ck >= 1 ? float(t, 0, 6, 1.5) : 0), { s: ck }, () => {
      c.beginPath();
      c.arc(-80, 10, 56, Math.PI * 0.5, Math.PI * 1.5);
      c.arc(-20, -40, 70, Math.PI, Math.PI * 1.85);
      c.arc(70, -14, 60, Math.PI * 1.3, Math.PI * 0.2);
      c.arc(80, 30, 36, Math.PI * 1.6, Math.PI * 0.5);
      c.closePath();
      c.fillStyle = C.blanco; c.fill();
      c.strokeStyle = C.azul; c.lineWidth = 6; c.stroke();
      text(c, 'Inflación ↑', 0, 30, { w: 600, size: 38, col: C.azul, align: 'center' });
    });

    // the person
    const ai = pop(t, t0 + 0.1, 0.5);
    // the person reacts: calm → surprised (late payment) → thinking → worried (stamp, with a flinch) → happy
    const flinch = t > this.tStamp + 0.2 ? 22 * Math.exp(-(t - this.tStamp - 0.2) * 9) * Math.abs(Math.sin((t - this.tStamp - 0.2) * 22)) : 0;
    // the illustrated client: calm → surprised (late payment) → doubtful, finger up → worried (stamp, flinch) → relieved and happy
    at(c, 560, 880, { s: ai }, () => this.char.draw(c, 0, 0, 470, t, this.keys, { hop: flinch, seed: 2 }));

    // calendar (blue lines)
    const ci = inn(t, t0 + 0.2, 0.5);
    c.save(); c.globalAlpha = ci;
    const cw = CAL.w / CAL.cols, ch = (CAL.h - 90) / CAL.rows;
    rrect(c, CAL.x, CAL.y, CAL.w, CAL.h, 24); c.fillStyle = C.blanco; c.fill();
    c.strokeStyle = C.azul; c.lineWidth = 6; c.stroke();
    c.fillStyle = C.azul; rrect(c, CAL.x, CAL.y, CAL.w, 90, [24, 24, 0, 0]); c.fill();
    for (const rx of [0.25, 0.75]) { rrect(c, CAL.x + CAL.w * rx - 8, CAL.y - 26, 16, 52, 8); c.fill(); }
    c.lineWidth = 3; c.strokeStyle = hexA(C.azul, 0.55);
    for (let i = 1; i < CAL.cols; i++) { c.beginPath(); c.moveTo(CAL.x + i * cw, CAL.y + 90); c.lineTo(CAL.x + i * cw, CAL.y + CAL.h); c.stroke(); }
    for (let j = 1; j < CAL.rows; j++) { c.beginPath(); c.moveTo(CAL.x, CAL.y + 90 + j * ch); c.lineTo(CAL.x + CAL.w, CAL.y + 90 + j * ch); c.stroke(); }
    c.restore();
    // the late day
    const lk = pop(t, this.tLate, 0.4);
    const dx = CAL.x + 4 * cw, dy = CAL.y + 90 + 1 * ch;
    ripple(c, dx + cw / 2, dy + ch / 2, t, this.tLate + 0.15, C.naranja, 30, 110, 0.8);
    at(c, dx + cw / 2, dy + ch / 2, { s: lk }, () => {
      rrect(c, -cw / 2 + 6, -ch / 2 + 6, cw - 12, ch - 12, 10); c.fillStyle = C.naranja; c.fill();
      icon.clock(c, 54, C.blanco, 0.11);
    });
    const pk = inn(t, this.tPago, 0.35);
    at(c, dx + cw / 2, dy - 30, { a: pk, dy: (1 - pk) * 18 }, () =>
      labelPill(c, 'Se atrasa en un pago', 0, -20, { fill: C.naranja, col: C.blanco, size: 30 }));

    // the client card
    const k = pop(t, t0 + 0.45, 0.45);
    at(c, CARD.x + CARD.w / 2, CARD.y + CARD.h / 2, { s: k }, () => {
      c.shadowColor = 'rgba(0,0,0,0.12)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
      rrect(c, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 22); c.fillStyle = C.blanco; c.fill();
      c.shadowColor = 'transparent';
      c.strokeStyle = C.gris2; c.lineWidth = 3; c.stroke();
      at(c, -CARD.w / 2 + 76, 0, {}, () => icon.person(c, 90, C.morado));
      c.fillStyle = C.gris2;
      rrect(c, -CARD.w / 2 + 150, -42, 180, 18, 9); c.fill();
      rrect(c, -CARD.w / 2 + 150, -6, 130, 18, 9); c.fill();
      rrect(c, -CARD.w / 2 + 150, 30, 160, 18, 9); c.fill();
    });

    // RIESGOSO stamp falls on the card
    const st = clamp((t - this.tStamp) / 0.22);
    if (st > 0) {
      const s = lerp(2.6, 1, ease.inQuad(st));
      at(c, CARD.x + CARD.w / 2, CARD.y + CARD.h / 2, { s, r: -0.14, a: clamp(st * 2) }, () => {
        c.strokeStyle = C.naranja; c.lineWidth = 9;
        rrect(c, -190, -50, 380, 100, 14); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.85)'; c.fill();
        text(c, 'RIESGOSO', 0, 24, { w: 800, size: 66, col: C.naranja, align: 'center', ls: 2 });
      });
    }
    burst(c, CARD.x + CARD.w / 2, CARD.y + CARD.h / 2, t, this.tStamp + 0.22, C.naranja, 210, 12);
    // and the green stroke strikes it
    const xk = ease.inOutCubic(clamp((t - this.tCtx - 0.65) / 0.4));
    if (xk > 0) {
      c.strokeStyle = C.verde; c.lineWidth = 16;
      const mx = CARD.x + CARD.w / 2, my = CARD.y + CARD.h / 2;
      glow(c, hexA(C.verde, 0.8), 20, () => strokeTrim(c, [pt(mx - 220, my + 46), pt(mx + 220, my - 70)], xk));
    }
    c.restore();

    // on the band
    const bk = inn(t, this.tCtx + 0.1, 0.45);
    text(c, 'El problema fue el contexto, no la persona.', 960, 962 + (1 - bk) * 30, { w: 700, size: 52, col: C.blanco, align: 'center', alpha: bk });
    return {};
  }
}
