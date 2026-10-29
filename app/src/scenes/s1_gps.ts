// ESCENA 1 — El gancho (fondo blanco)
// "Imagina que manejas con un GPS que no se actualiza hace dos años. Te lleva, sí… pero por calles que ya no existen."
// Map seen from above (streets in Gris 2); the blue car advances while the route draws behind it. On
// "existen" a street fades out and an orange "road closed" sign bounces in; the car stops with a small
// rebound and a blue question mark appears. Out: fast zoom into the GPS screen, which fills the frame in blue.
import type { Frame, PostOverrides } from '../engine/scene';
import { C, MAP, Plate, at, glow, burst, ripple, float, drawStreets, ease, hexA, icon, inn, polyAt, pop, strokeTrim, text, clamp, vis, measureText, rrect , tornPaper, tape, scribbleCircle, doodleArrow, pt } from './_icesi';

export default class S1 extends Plate {
  tTitle = 0.3; tNote = 0; tGone = 0; tStop = 0; tZoom = 0;

  override setup() {
    const S = this.S;
    this.prevBg = C.azul; // opens over the cover with a circle reveal
    this.tTitle = this.ctx.start + 0.3;
    this.tNote = S.word('no se actualiza hace', 'hace').start;
    this.tGone = S.word('ya no existen', 'calles').start;
    this.tStop = this.tGone + 0.45;
    this.tZoom = this.ctx.end - 0.42;
  }

  carK(t: number) {
    const t0 = this.ctx.start + 0.35;
    const u = ease.inOutCubic(clamp((t - t0) / (this.tStop - t0)));
    let k = MAP.stopK * u;
    const d = t - this.tStop;
    if (d > 0) k += 0.008 * Math.sin(d * 16) * Math.exp(-d * 7); // small rebound
    return k;
  }

  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    const car = polyAt(MAP.route, this.carK(t));
    // zoom into the GPS screen at the end
    const z = ease.inCubic(clamp((t - this.tZoom) / 0.42));
    c.save();
    if (z > 0) { const s = 1 + z * 4; c.translate(car.x, car.y); c.scale(s, s); c.translate(-car.x, -car.y); }

    // map
    const gone = ease.outCubic(clamp((t - this.tGone) / 0.6));
    const mapIn = inn(t, this.ctx.start, 0.5);
    drawStreets(c, gone, mapIn);
    // planned route (dashed, pale) and the travelled part (solid)
    c.save();
    c.globalAlpha = mapIn;
    c.strokeStyle = hexA(C.azul, 0.35); c.lineWidth = 10; c.setLineDash([2, 26]); c.lineCap = 'round';
    strokeTrim(c, MAP.route, 1);
    c.setLineDash([]);
    c.strokeStyle = C.azul; c.lineWidth = 14;
    glow(c, hexA(C.azul, 0.55), 22, () => strokeTrim(c, MAP.route, this.carK(t)));
    c.restore();
    // destination: bobbing pin with a slow pulse
    const dst = MAP.route[MAP.route.length - 1]!;
    for (let k = 0; k < 4; k++) ripple(c, dst.x, dst.y, t, 0.6 + k * 1.6, hexA(C.azul, 0.6), 16, 70, 1.4);
    at(c, dst.x, dst.y - 40 + float(t, 0, 5, 2.4), { s: pop(t, this.ctx.start + 0.5) }, () => icon.pin(c, 70, C.azul, true));
    // road closed sign on the vanished street
    const g = MAP.gone;
    const gx = (g.x0 + g.x1) / 2;
    ripple(c, gx, g.y, t, this.tGone + 0.3, C.naranja, 40, 140, 0.8);
    at(c, gx, g.y, { s: pop(t, this.tGone + 0.25, 0.5) }, () => glow(c, hexA(C.naranja, 0.6), 24, () => icon.roadClosed(c, 92)));
    // the car, with its headlights
    at(c, car.x, car.y, { r: car.a, s: pop(t, this.ctx.start + 0.15) }, () => {
      const g2 = c.createLinearGradient(40, 0, 210, 0);
      g2.addColorStop(0, hexA(C.amarillo, 0.55)); g2.addColorStop(1, hexA(C.amarillo, 0));
      c.fillStyle = g2; c.beginPath(); c.moveTo(40, -18); c.lineTo(210, -62); c.lineTo(210, 62); c.lineTo(40, 18); c.closePath(); c.fill();
      glow(c, hexA(C.azul, 0.5), 18, () => icon.car(c, 74, C.azul));
    });
    // "?" above the car once it stops
    // marker notes: circle the closed road, arrow from the car
    scribbleCircle(c, gx, g.y, 95, 80, ease.inOutCubic(clamp((t - this.tGone - 0.55) / 0.5)), C.naranja, 7, 2);
    doodleArrow(c, pt(car.x + 70, car.y - 70), pt(car.x + 180, car.y - 160), pt(gx - 110, g.y - 60), ease.inOutCubic(clamp((t - this.tGone - 0.8) / 0.45)), C.naranja, 6);
    const q = pop(t, this.tStop + 0.2, 0.4);
    burst(c, car.x, car.y - 92, t, this.tStop + 0.25, C.amarillo, 64, 10);
    at(c, car.x, car.y - 92 + (q >= 1 ? float(t, 1, 4, 3) : 0), { s: q }, () => text(c, '?', 0, 26, { w: 800, size: 84, col: C.azul, align: 'center' }));
    c.restore();

    // the title and the notification stay in screen space (they leave when the zoom starts)
    const out = 1 - ease.inCubic(clamp((t - this.tZoom) / 0.2));
    const ti = inn(t, this.tTitle, 0.5);
    c.save(); c.globalAlpha = out;
    at(c, 960, 112, { r: -0.006 }, () => tornPaper(c, 1520, 150, '#FFFFFF', 3));
    tape(c, 240, 52, 150, -0.2, undefined, 2); tape(c, 1680, 60, 150, 0.18, undefined, 4);
    void ti;
    {
      // the title is the spoken phrase, each word on its spoken word
      const L = this.S.line('Imagina que manejas');
      const i0 = L.words.findIndex((x) => x.w === 'un');
      const words = L.words.slice(i0), ws = words.map((x, k) => (k === 0 ? 'Un' : x.w)), size = 70;
      const sp = measureText(c, ' ', 700, size), widths = ws.map((w) => measureText(c, w, 700, size));
      let x = 960 - (widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1)) / 2;
      ws.forEach((w, i) => {
        const k = inn(t, words[i]!.start - 0.05, 0.4);
        text(c, w, x, 140 + (1 - k) * 40, { w: 700, size, col: C.azul, alpha: k });
        x += widths[i]! + sp;
      });
    }
    // notification card
    const n = vis(t, this.tNote, Infinity, 0.45);
    if (n > 0) {
      const s = 'Última actualización: hace 2 años', size = 30;
      const w = measureText(c, s, 600, size) + 120, h = 78, x = 1880 - w, y = 236 - (1 - n) * 40;
      c.save(); c.globalAlpha *= n;
      at(c, x + w / 2, y + h / 2, { r: 0.015 }, () => tornPaper(c, w, h, '#FFFDF4', 9));
      tape(c, x + w - 20, y + 4, 90, 0.5, undefined, 6);
      at(c, x + 46, y + h / 2, {}, () => icon.refresh(c, 40, C.gris1));
      text(c, s, x + 84, y + h / 2 + 11, { w: 600, size, col: C.gris1 });
      c.restore();
    }
    c.restore();

    // the GPS screen takes over: a blue screen opens from the car and fills the frame
    if (z > 0) {
      const sw = 4400 * z, sh = 2600 * z;
      c.save();
      rrect(c, car.x - sw / 2, car.y - sh / 2, sw, sh, 60 * (1 - z) + 8);
      c.fillStyle = C.azul; c.fill();
      c.restore();
    }
    return {};
  }
}
