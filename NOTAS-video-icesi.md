# El mapa del pasado — notas del proyecto

Video de 1:19 (voz de Lina, ElevenLabs) con la identidad Icesi: azul #5454E9, Plus Jakarta Sans, motion graphics flat.

## Ver el video
    cd app
    bunx vite
Abre http://localhost:5173 y presiona espacio. `[` / `]` saltan entre escenas, `l` repite la escena actual.

## Escenas (app/src/scenes/)
| Archivo | Escena |
|---|---|
| s1_gps.ts | 1 — El gancho (GPS desactualizado) |
| s2_insight.ts | 2 — El insight (tablero de crédito) |
| s3_drift.ts | 3 — Qué es el model drift (gráfica) |
| s4_ejemplo.ts | 4 — Ejemplo (inflación, sello RIESGOSO) |
| s5_importa.ts | 5 — Por qué te importa |
| s6_reunion.ts | 6 — Llamada a la acción (notas adhesivas) |
| s7_cierre.ts | 7 — Cierre (mapa actualizado + logos) |
| _icesi.ts | paleta, tipografía, íconos y mapa compartidos |

Cada animación está anclada a una palabra de la voz (data/lyrics.json), no a un segundo fijo.

## Si cambias la voz en off
1. Reemplaza audio/voiceover.mp3 (se le agregaron 3,5 s de silencio al final para el cierre; el original está en audio/voiceover_lina_original.mp3).
2. Si cambias el texto, edita SCRIPT en analysis/align_vo.py.
3. Corre:
       python -m uv run --no-project --with onnxruntime --with numpy python analysis/align_vo.py
       python -m uv run --no-project --with numpy python analysis/audio_vo.py

## Exportar el MP4 (30 fps, 1920x1080)
    cd app
    bun scripts/render.ts video --fps 30 --samples 4 --crf 17 --out ../out/mapa-del-pasado.mp4

## Pendiente
- Logos reales de InnLab, Icesi y ACH (hoy son texto en s7_cierre.ts).
- Música de fondo.

El demo original del kit quedó respaldado en _demo_original/.

## Estilo scrapbook
Papel con textura, líneas de marcador que tiemblan, cinta, grapas, clips y movimiento tipo stop-motion (12 pasos por segundo).
Para volver al estilo limpio: en `app/src/scenes/_icesi.ts` cambia `SCRAP = { on: true, ...` por `on: false`.

## Personaje ilustrado (escena 4)
Poses y expresiones en `app/public/personaje/` (sacadas del kit en `assets/personaje-fuente/`, de Freepik: revisar licencia/atribución).
