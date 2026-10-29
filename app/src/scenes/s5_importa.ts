// ESCENA 5 — Por qué te importa (fondo azul Icesi)
// "¿Por qué te importa? Si tu equipo usa o supervisa estos modelos, no basta con saber cuánto aciertan en
// promedio. Hay que saber dónde fallan, con quién y en qué momentos. Y poder explicarle a un cliente por
// qué se tomó una decisión."
// A manager (purple and white avatar) faces a white screen with one green bar, almost full, with a check:
// "everything looks fine", no numbers. A magnifier passes over it and opens it into 6 segment bars of
// different lengths, green and orange. Three questions come in from the right, each with a yellow icon.
// Then the manager turns to a client and a white speech bubble appears.
import type { Frame, PostOverrides } from '../engine/scene';
import { C, Plate, at, person, type Mood, decor, glow, burst, float, hexA, pt, clamp, ease, icon, inn, lerp, pop, rrect, text, vis , tape, strokeTrim, measureText } from './_icesi';

const SCR = { x: 640, y: 250, w: 620, h: 470 };
const SEG = [
  { k: 0.92, c: C.verde }, { k: 0.38, c: C.naranja }, { k: 0.84, c: C.verde },
  { k: 0.55, c: C.naranja }, { k: 0.96, c: C.verde }, { k: 0.3, c: C.naranja },
];

export default class S5 extends Plate {
  tTitle = 0; tEq = 0; tLupa = 0; tQ: number[] = []; tTurn = 0; tCli = 0; tDec = 0;

  override setup() {
    const S = this.S;
    this.prevBg = C.blanco; this.revealFrom = pt(960, 1000); this.revealDur = 0.5;
    this.tTitle = this.ctx.start + 0.12;
    this.tEq = S.word('Si tu equipo', 'equipo').start;
    this.tLupa = S.word('Hay que saber', 'Hay').start;
    this.tQ = [S.word('Hay que saber', 'dónde').start, S.word('Hay que saber', 'quién').start, S.word('Hay que saber', 'momentos.').start];
    this.tTurn = S.word('poder explicarle', 'poder').start;
    this.tCli = S.word('poder explicarle', 'cliente').start;
    this.tDec = S.word('poder explicarle', 'decisión.').end;
  }

  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    c.fillStyle = C.azul; c.fillRect(0, 0, 1920, 1080);
    decor(c, t, true, 5);

    // title: in and out within 2 s
    const tk = vis(t, this.tTitle, this.tTitle + 1.75, 0.4);
    if (tk > 0) {
      c.save(); c.filter = tk < 1 ? `blur(${((1 - tk) * 6).toFixed(2)}px)` : 'none';
      text(c, '¿Por qué te importa?', 960, 570 + (1 - tk) * 30, { w: 800, size: 96, col: C.blanco, align: 'center', alpha: tk });
      c.restore();
    }
    const t1 = this.tTitle + 1.9; // the scene proper

    // the manager, turning towards the client
    const turn = ease.inOutCubic(clamp((t - this.tTurn) / 0.35));
    const facing = Math.cos(turn * Math.PI); // 1 → -1
    const point = t > this.tEq && t < this.tTurn ? ease.outBack(clamp((t - this.tEq) / 0.5)) * (1 - clamp((t - this.tTurn + 0.3) / 0.3)) : 0;
    at(c, 450, 880, { s: pop(t, t1, 0.5) }, () => {
      c.save(); c.scale(Math.sign(facing) * Math.max(0.2, Math.abs(facing)), 1);
      // confident → surprised when the bar opens → thinking over the questions → explaining → smiling
      const split0 = this.tLupa + 0.7;
      const mood: Mood = t > this.tDec + 0.1 ? 'smile' : t > this.tTurn + 0.2 ? 'talk' : t > this.tQ[0]! ? 'think' : t > split0 ? 'surprised' : 'smile';
      const think = mood === 'think' ? ease.outCubic(clamp((t - this.tQ[0]!) / 0.4)) * (1 - clamp((t - this.tTurn) / 0.3)) : 0;
      const talk = mood === 'talk' ? ease.outCubic(clamp((t - this.tTurn - 0.2) / 0.4)) : 0;
      const hop = t > split0 && t < split0 + 0.5 ? 12 * Math.sin(((t - split0) / 0.5) * Math.PI) : 0;
      person(c, 0, 0, 380, t, {
        shirt: C.morado, collar: C.blanco, pants: '#2E2A6B', look: 0.9, mood, seed: 3, hop,
        armR: 0.1 + point * 1.15 + think * 1.0 + talk * (0.9 + 0.35 * Math.sin(t * 4.5)), elbowR: 0.1 + think * 2.2 + talk * (0.8 + 0.3 * Math.sin(t * 4.5 + 1)),
        armL: 0.1 + Math.sin(t * 1.6) * 0.05 + talk * (0.5 + 0.25 * Math.sin(t * 3.7 + 2)), elbowL: 0.1 + talk * 0.9,
      });
      c.restore();
    });

    // the screen
    const si = pop(t, t1 + 0.1, 0.5);
    at(c, SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, { s: si }, () => {
      const L = -SCR.w / 2, T = -SCR.h / 2;
      c.fillStyle = C.blanco; rrect(c, L, T, SCR.w, SCR.h, 10); c.fill();
      tape(c, L + 30, T + 4, 120, -0.6, undefined, 31); tape(c, -L - 30, T + 4, 120, 0.6, undefined, 32);
      c.fillRect(-14, SCR.h / 2, 28, 80); rrect(c, -110, SCR.h / 2 + 70, 220, 22, 11); c.fill();

      const split = ease.inOutCubic(clamp((t - this.tLupa - 0.75) / 0.6));
      const bx = L + 60, bw = SCR.w - 120;
      if (split < 1) {
        // the single "everything is fine" bar
        const g = inn(t, this.tEq - 0.1, 0.7);
        c.save(); c.globalAlpha = 1 - split;
        text(c, 'Cuánto aciertan en promedio', bx, -54, { w: 600, size: 34, col: C.azul, alpha: inn(t, this.tEq + 0.2) });
        rrect(c, bx, -20, bw, 64, 32); c.fillStyle = '#EEF0F3'; c.fill();
        rrect(c, bx, -20, bw * 0.9 * g + 0.01, 64, 32); c.fillStyle = C.verde; c.fill();
        burst(c, bx + bw * 0.9 - 36, 12, t, this.tEq + 0.75, C.verde, 50, 8);
        at(c, bx + bw * 0.9 - 36, 12, { s: pop(t, this.tEq + 0.7) }, () => icon.check(c, 22, C.blanco, C.verde));
        c.restore();
      }
      if (split > 0) {
        SEG.forEach((s, i) => {
          const y = lerp(-20 + 14, T + 56 + i * 64, split);
          const h = lerp(36, 40, split);
          rrect(c, bx, y, bw * lerp(0.9, s.k, split), h, h / 2);
          c.fillStyle = s.c; c.globalAlpha = clamp(split * 2); c.fill(); c.globalAlpha = 1;
        });
      }
      // the magnifier passes over
      const m = clamp((t - this.tLupa) / 1.1);
      if (m > 0 && m < 1) {
        const mx = lerp(L - 40, -L + 40, ease.inOutQuad(m)), my = 10 + Math.sin(m * Math.PI) * -20;
        c.save(); c.globalAlpha = Math.sin(m * Math.PI) * 1.4;
        at(c, mx, my, {}, () => icon.magnifier(c, 170, C.azul));
        c.restore();
      }
    });

    // the questions
    const Q = [
      { s: '¿Dónde fallan?', ic: icon.pin },
      { s: '¿Con quién?', ic: icon.group },
      { s: '¿En qué momentos?', ic: icon.clock },
    ];
    Q.forEach((q, i) => {
      const k = inn(t, this.tQ[i]! - 0.05, 0.45);
      if (k <= 0) return;
      const y = 360 + i * 140;
      burst(c, 1325, y - 18, t, this.tQ[i]! + 0.2, C.amarillo, 58, 8, i);
      at(c, 1285 + (1 - k) * 160, y, { a: k }, () => {
        at(c, 40, -18 + float(t, i, 4, 2), {}, () => glow(c, hexA(C.amarillo, 0.7), 18, () => q.ic(c, 76, C.amarillo)));
        text(c, q.s, 104, 0, { w: 700, size: 50, col: C.blanco });
        const uw = measureText(c, q.s, 700, 50);
        c.save(); c.strokeStyle = C.amarillo; c.lineWidth = 6; strokeTrim(c, [pt(100, 16), pt(104 + uw, 12)], ease.inOutCubic(clamp((t - this.tQ[i]! - 0.3) / 0.4))); c.restore();
      });
    });

    // the client and the explanation
    const cl = inn(t, this.tTurn + 0.1, 0.5);
    if (cl > 0) {
      at(c, 170 - (1 - cl) * 280, 880, {}, () => person(c, 0, 0, 345, t, {
        style: 'long', shirt: C.blanco, collar: C.amarillo, pants: '#3F3A8C', hair: '#4A2C2A', look: 0.9, seed: 7,
        mood: t > this.tDec + 0.1 ? 'happy' : t > this.tCli + 0.3 ? 'smile' : 'neutral',
        nod: t > this.tCli && t < this.tDec ? 1 : 0,
        armL: 0.1 + Math.sin(t * 1.5) * 0.05, armR: t > this.tDec + 0.1 ? 0.3 + 0.5 * ease.outBack(clamp((t - this.tDec - 0.1) / 0.4)) : 0.1 + Math.sin(t * 1.5 + 1) * 0.05,
        elbowR: t > this.tDec + 0.1 ? 1.9 : 0.1,
      }));
      const by = 330 + float(t, 4, 6, 1.6);
      at(c, 300, by, { s: pop(t, this.tCli, 0.45) }, () => glow(c, 'rgba(255,255,255,0.5)', 24, () => icon.bubble(c, 230, C.blanco, C.blanco)));
      at(c, 300, by, { a: inn(t, this.tCli + 0.2) }, () => {
        c.fillStyle = C.gris2;
        rrect(c, -78, -58, 156, 16, 8); c.fill(); rrect(c, -78, -24, 104, 16, 8); c.fill();
      });
      const ek = inn(t, this.tCli + 0.35, 0.45);
      at(c, 640, 975, { a: ek, dy: (1 - ek) * 24 }, () => {
        at(c, 40, -16, {}, () => icon.bubble(c, 78, C.amarillo));
        text(c, 'Explicar por qué se tomó una decisión', 110, 0, { w: 500, size: 44, col: C.blanco });
      });
    }
    return {};
  }
}
