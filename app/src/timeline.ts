// "El mapa del pasado": which plate plays when. Every cut sits in the pause before the first line of
// its scene, found by content in the aligned script (data/lyrics.json).
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  /** Cut in the pause before the line containing q: 0.18 s before its first word (less if the pause is short). */
  const cut = (q: string) => {
    const l = ly.get(q);
    const prev = ly.lines[l.i - 1];
    const gap = prev ? l.start - prev.end : 1;
    return l.start - Math.min(0.18, Math.max(0.04, gap * 0.45));
  };
  const b = {
    insight: cut('Lo mismo le puede'),
    drift: cut('Un modelo puede ser'),
    ejemplo: cut('Un ejemplo'),
    importa: cut('te importa'),
    reunion: cut('Lleva dos preguntas'),
    cierre: cut('Porque un modelo'),
    end: au.duration,
  };
  const E = (id: string, start: number, end: number): TimelineEntry => ({ id, load: scene(id), start, end });
  return [
    E('s1_gps', 0, b.insight),
    E('s2_insight', b.insight, b.drift),
    E('s3_drift', b.drift, b.ejemplo),
    E('s4_ejemplo', b.ejemplo, b.importa),
    E('s5_importa', b.importa, b.reunion),
    E('s6_reunion', b.reunion, b.cierre),
    E('s7_cierre', b.cierre, b.end),
  ];
}
