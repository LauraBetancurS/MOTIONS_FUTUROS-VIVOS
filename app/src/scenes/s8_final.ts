// FINAL — Carátula de cierre (papel blanco sobre el azul del cierre): Capítulo X · Insight X · título.
// Plays in the silence after the closing line and the logos.
import type { Frame, PostOverrides } from '../engine/scene';
import { C, Plate } from './_icesi';
import { caratula } from './_caratula';

export default class S8 extends Plate {
  override footer = false;
  override setup() { this.prevBg = C.azul; }
  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    caratula(c, t, this.ctx.start + 0.25, false);
    return {};
  }
}
