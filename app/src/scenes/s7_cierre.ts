// ESCENA 7 — Cierre (fondo blanco → azul Icesi)
// "Porque un modelo que no se actualiza evalúa el presente con el mapa del pasado."
// Back to the GPS of scene 1. An "Actualizando…" bar fills fast, the map redraws with new streets and
// the blue route completes to a green destination pin with a soft pulse. A wipe left to right turns the
// frame blue; the closing line and the logos come in.
import type { Frame, PostOverrides } from '../engine/scene';
import { C, MAP, Plate, at, decor, glow, burst, ripple, float, loadImage, measureText, clamp, drawStreets, ease, hexA, icon, inn, polyAt, pop, rrect, strokeTrim, text } from './_icesi';

export default class S7 extends Plate {
  tBar = 0; tBarEnd = 0; tNew = 0; tRoute = 0; tArrive = 0; tWipe = 0; tL0 = 0; tL1 = 0; tL2 = 0; tLogos = 0;

  logos: (HTMLImageElement | null)[] = [];
  override async load() {
    this.logos = await Promise.all([loadImage('logos/innlab_logo.svg'), loadImage('logos/icesi_logo.svg'), loadImage('logos/ach_logo.svg')]);
  }

  override setup() {
    const S = this.S, L = 'evalúa el presente';
    const t0 = this.ctx.start;
    this.tBar = t0 + 0.2;
    this.tBarEnd = Math.max(this.tBar + 0.8, S.word(L, 'actualiza').start - 0.3);
    this.tNew = this.tBarEnd - 0.1;
    this.tRoute = this.tNew + 0.3;
    this.tWipe = S.word(L, 'evalúa').start + 0.05;
    this.tArrive = Math.min(this.tRoute + 1.0, this.tWipe - 0.15);
    this.tL0 = this.tWipe + 0.3;
    this.tL1 = S.word(L, 'evalúa').start + 0.25;
    this.tL2 = S.word(L, 'mapa').start - 0.2;
    this.tLogos = S.word(L, 'pasado.').end + 0.5;
  }

  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    const t0 = this.ctx.start;
    // the map, old streets first (the vanished one is gone)
    drawStreets(c, 1, inn(t, t0, 0.35));
    // new streets draw in
    const nk = ease.inOutCubic(clamp((t - this.tNew) / 0.5));
    if (nk > 0) {
      c.strokeStyle = C.gris2; c.lineWidth = 46; c.lineCap = 'round';
      for (const seg of MAP.fresh) strokeTrim(c, seg, nk);
    }
    // corrected route + car
    const rk = ease.inOutCubic(clamp((t - this.tRoute) / (this.tArrive - this.tRoute)));
    c.strokeStyle = C.azul; c.lineWidth = 14;
    glow(c, hexA(C.azul, 0.6), 24, () => strokeTrim(c, MAP.route2, rk));
    const car = polyAt(MAP.route2, rk);
    at(c, car.x, car.y, { r: car.a, s: pop(t, t0 + 0.1) }, () => glow(c, hexA(C.azul, 0.5), 18, () => icon.car(c, 74, C.azul)));
    // destination: green pin with a soft pulse
    const dst = MAP.route2[MAP.route2.length - 1]!;
    const pk = clamp((t - this.tArrive) / 0.9);
    if (pk > 0 && pk < 1) { c.strokeStyle = hexA(C.verde, 1 - pk); c.lineWidth = 8; c.beginPath(); c.arc(dst.x, dst.y, 30 + pk * 90, 0, Math.PI * 2); c.stroke(); }
    ripple(c, dst.x, dst.y, t, this.tArrive + 0.3, C.verde, 30, 150, 0.9);
    burst(c, dst.x, dst.y - 50, t, this.tArrive, C.amarillo, 90, 12);
    at(c, dst.x, dst.y - 44, { s: pop(t, t0 + 0.3) * (1 + 0.15 * Math.sin(clamp(pk * 2) * Math.PI)) }, () => glow(c, pk > 0 ? hexA(C.verde, 0.8) : 'transparent', 26, () => icon.pin(c, 80, pk > 0 ? C.verde : C.gris1, true)));

    // "Actualizando…" bar
    const bi = inn(t, this.tBar - 0.1, 0.35) * (1 - ease.inCubic(clamp((t - this.tBarEnd - 0.3) / 0.25)));
    if (bi > 0) {
      at(c, 960, 140, { a: bi, dy: (1 - bi) * -20 }, () => {
        c.fillStyle = C.blanco; rrect(c, -330, -70, 660, 140, 24); c.fill();
        c.strokeStyle = C.gris2; c.lineWidth = 3; c.stroke();
        text(c, 'Actualizando…', -280, -12, { w: 600, size: 34, col: C.azul });
        rrect(c, -280, 16, 560, 22, 11); c.fillStyle = C.gris2; c.fill();
        const f = ease.inOutQuad(clamp((t - this.tBar) / (this.tBarEnd - this.tBar)));
        rrect(c, -280, 16, 560 * f + 0.01, 22, 11); c.fillStyle = C.azul; c.fill();
      });
    }

    // wipe to blue, left to right
    const wk = ease.inOutCubic(clamp((t - this.tWipe) / 0.55));
    if (wk > 0) {
      c.save();
      c.beginPath(); c.rect(0, 0, 1920 * wk, 1080); c.clip();
      c.fillStyle = C.azul; c.fillRect(0, 0, 1920, 1080);
      decor(c, t, true, 7);
      c.restore();
      // a bright edge on the wipe
      if (wk < 1) glow(c, hexA(C.blanco, 0.9), 30, () => { c.fillStyle = hexA(C.blanco, 0.85); c.fillRect(1920 * wk - 6, 0, 6, 1080); });
      const line = (s: string, w: number, size: number, y: number, t1: number) => {
        const ws = s.split(' '), sp = measureText(c, ' ', w, size), widths = ws.map((x) => measureText(c, x, w, size));
        let x = 960 - (widths.reduce((a2, b2) => a2 + b2, 0) + sp * (ws.length - 1)) / 2;
        ws.forEach((wd, i) => {
          const k = inn(t, t1 + i * 0.07, 0.45);
          if (k > 0) { c.save(); c.filter = k < 1 ? `blur(${((1 - k) * 6).toFixed(2)}px)` : 'none'; text(c, wd, x, y + (1 - k) * 40, { w, size, col: C.blanco, alpha: k }); c.restore(); }
          x += widths[i]! + sp;
        });
      };
      line('Un modelo que no se actualiza', 500, 58, 360, this.tL0);
      line('evalúa el presente', 600, 80, 470, this.tL1);
      line('con el mapa del pasado.', 800, 96, 590, this.tL2);
      // underline sweep under "pasado"
      const uk = ease.inOutCubic(clamp((t - this.tL2 - 0.7) / 0.5));
      if (uk > 0) {
        const W2 = measureText(c, 'con el mapa del pasado.', 800, 96), px = 960 - W2 / 2 + measureText(c, 'con el mapa del ', 800, 96), pw = measureText(c, 'pasado', 800, 96);
        glow(c, hexA(C.amarillo, 0.8), 18, () => { c.fillStyle = C.amarillo; rrect(c, px, 618, pw * uk, 12, 6); c.fill(); });
      }

      // logos: InnLab · Icesi · ACH (white on blue)
      const lg = inn(t, this.tLogos, 0.5);
      if (lg > 0) {
        const H = 100, y = 870 + (1 - lg) * 24 + float(t, 0, 2, 1.2);
        const [inn2, ice, ach] = this.logos;
        const wI = inn2 ? (inn2.naturalWidth / inn2.naturalHeight) * H * 0.62 : measureText(c, 'InnLab', 600, 44);
        const wC = ice ? (ice.naturalWidth / ice.naturalHeight) * H * 1.15 : measureText(c, 'Icesi', 600, 44);
        const wA = ach ? (ach.naturalWidth / ach.naturalHeight) * H * 0.95 : measureText(c, 'ACH', 800, 52);
        const gap = 90, total = wI + wC + wA + gap * 2;
        let x = 960 - total / 2;
        c.save(); c.globalAlpha = lg;
        if (inn2) c.drawImage(inn2, x, y - H * 0.31, wI, H * 0.62); else text(c, 'InnLab', x, y + 16, { w: 600, size: 44, col: C.blanco });
        x += wI + gap / 2;
        c.fillStyle = hexA(C.blanco, 0.5); c.fillRect(x - 1.5, y - 40, 3, 80); x += gap / 2;
        if (ice) c.drawImage(ice, x, y - H * 0.575, wC, H * 1.15); else text(c, 'Icesi', x, y + 16, { w: 600, size: 44, col: C.blanco });
        x += wC + gap / 2;
        c.fillStyle = hexA(C.blanco, 0.5); c.fillRect(x - 1.5, y - 40, 3, 80); x += gap / 2;
        if (ach) c.drawImage(ach, x, y - H * 0.475, wA, H * 0.95); else text(c, 'ACH', x, y + 19, { w: 800, size: 52, col: C.blanco, ls: 2 });
        c.restore();
      }
    }
    return {};
  }
}
