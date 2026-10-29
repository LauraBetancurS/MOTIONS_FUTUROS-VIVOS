// Carátula (title card) shared by the cover (s0_portada) and the end card (s8_final):
// "Capítulo X" on a torn paper strip, "Insight X" on a yellow one, the video title with a marker underline.
// The texts live in CARATULA (_icesi.ts).
import { C, CARATULA, at, clamp, decor, doodle, ease, float, hexA, inn, measureText, pop, pt, strokeTrim, tape, text, tornPaper } from './_icesi';

/** Draws the card; t0 is when it starts building. onBlue: blue background (cover) or white paper (end). */
export function caratula(c: CanvasRenderingContext2D, t: number, t0: number, onBlue: boolean) {
  const ink = onBlue ? C.blanco : C.azul;
  c.fillStyle = onBlue ? C.azul : C.blanco; c.fillRect(0, 0, 1920, 1080);
  decor(c, t, onBlue, onBlue ? 11 : 12, inn(t, t0, 0.6));

  // kicker
  const ki = inn(t, t0 + 0.1, 0.45);
  at(c, 960, 205, { a: ki, dy: (1 - ki) * -18 }, () => {
    text(c, 'FORESIGHT  ·  FUTUROS VIVOS', 0, 0, { w: 800, size: 28, col: hexA(ink, 0.9), align: 'center', ls: 6 });
    text(c, CARATULA.cliente, 0, 50, { w: 600, size: 26, col: hexA(ink, 0.7), align: 'center' });
  });

  // "Capítulo X" strip
  const capW = measureText(c, CARATULA.capitulo, 800, 104) + 150;
  at(c, 930, 430 + float(t, 0, 5, 1.1), { s: pop(t, t0 + 0.3), r: -0.035 }, () => {
    tornPaper(c, capW, 164, onBlue ? C.blanco : C.azul, 3, { tear: 9 });
    text(c, CARATULA.capitulo, 0, 37, { w: 800, size: 104, col: onBlue ? C.azul : C.blanco, align: 'center' });
    tape(c, -capW / 2 + 30, -70, 140, -0.5, undefined, 2);
  });

  // "Insight X" strip
  const insW = measureText(c, CARATULA.insight, 800, 104) + 150;
  at(c, 1010, 628 + float(t, 2, 5, 1.2), { s: pop(t, t0 + 0.6), r: 0.028 }, () => {
    tornPaper(c, insW, 164, C.amarillo, 5, { tear: 9 });
    text(c, CARATULA.insight, 0, 37, { w: 800, size: 104, col: C.azul, align: 'center' });
    tape(c, insW / 2 - 26, 66, 130, -0.45, undefined, 4);
  });

  // title + marker underline
  const ti = inn(t, t0 + 0.95, 0.5);
  const tw = measureText(c, CARATULA.titulo, 700, 60);
  at(c, 960, 840, { a: ti, dy: (1 - ti) * 24 }, () => {
    text(c, CARATULA.titulo, 0, 0, { w: 700, size: 60, col: ink, align: 'center' });
  });
  const uk = ease.inOutCubic(clamp((t - t0 - 1.2) / 0.5));
  if (uk > 0) {
    c.save(); c.strokeStyle = C.amarillo; c.lineWidth = 9;
    strokeTrim(c, [pt(960 - tw / 2 - 10, 868), pt(960, 874), pt(960 + tw / 2 + 12, 866)], uk);
    c.restore();
  }

  // doodles
  doodle(c, 'star', 560 + float(t, 4, 4), 330, 30, onBlue ? C.amarillo : C.azul, inn(t, t0 + 0.8, 0.5));
  doodle(c, 'spark', 1440, 560 + float(t, 5, 4), 26, onBlue ? C.blanco : C.morado, inn(t, t0 + 1.0, 0.4));
}
