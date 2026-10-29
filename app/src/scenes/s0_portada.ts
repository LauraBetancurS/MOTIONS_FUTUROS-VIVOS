// PORTADA — Carátula de inicio (fondo azul): Capítulo X · Insight X · "El mapa del pasado".
// Plays in the silence before the voice starts; scene 1 opens over it with a circle reveal.
import type { Frame, PostOverrides } from '../engine/scene';
import { Plate } from './_icesi';
import { caratula } from './_caratula';

export default class S0 extends Plate {
  override footer = false;
  draw(c: CanvasRenderingContext2D, t: number, _f: Frame): PostOverrides {
    caratula(c, t, this.ctx.start, true);
    return {};
  }
}
