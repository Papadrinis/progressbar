#!/usr/bin/env python3
"""SparkPy · biblioteca: valida biblioteca/clips.py, mide cada clip, genera miniaturas y escribe biblioteca/clips.json.

    python3 scripts/biblioteca.py

clips.json es lo que se sube al Estudio (colección «clips») para que el storyboard proponga clips existentes
antes de generar nada. costo_regenerar = lo que costaría volver a hacerlo (Seedance 2.5 1080p: 16 cr/s;
foto gpt_image_2_5: 2,75), o sea lo que se ahorra cada vez que se reutiliza.
"""
import json
import sys
from pathlib import Path

import cv2

RAIZ = Path(__file__).resolve().parent.parent
PUB = RAIZ / 'public'
BIB = RAIZ / 'biblioteca'
sys.path.insert(0, str(BIB))
from clips import C  # noqa: E402


def medir(ruta):
    if ruta.suffix in ('.png', '.jpg', '.jpeg'):
        im = cv2.imread(str(ruta))
        return 0.0, im
    cap = cv2.VideoCapture(str(ruta))
    n = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * 0.45))
    ok, im = cap.read()
    return round(n / fps, 1), im if ok else None


def main():
    (BIB / 'miniaturas').mkdir(parents=True, exist_ok=True)
    ids, out, errores = set(), [], []
    for c in C:
        if c['id'] in ids:
            errores.append(f'id repetido: {c["id"]}')
        ids.add(c['id'])
        ruta = PUB / c['archivo']
        if not ruta.exists():
            errores.append(f'{c["id"]}: no existe public/{c["archivo"]}')
            continue
        dur, im = medir(ruta)
        if im is None:
            errores.append(f'{c["id"]}: no se pudo leer')
            continue
        h, w = im.shape[:2]
        cv2.imwrite(str(BIB / 'miniaturas' / f'{c["id"]}.jpg'), cv2.resize(im, (270, int(270 * h / w))), [cv2.IMWRITE_JPEG_QUALITY, 82])
        tipo = 'video' if ruta.suffix == '.mp4' else 'foto'
        costo = round(dur * 16) if tipo == 'video' else 2.75
        out.append(dict(c, tipo=tipo, duracion=dur, costo_regenerar=costo, formato='9:16' if h > w else 'otro',
                        reutilizable=('con cualquier voz' if not c['habla'] else 'solo con su frase (o de fondo sin audio)')))
    if errores:
        print('\n'.join('✗ ' + e for e in errores))
        sys.exit(1)
    (BIB / 'clips.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    total = sum(o['costo_regenerar'] for o in out)
    print(f'ok  {len(out)} clips · {total:.0f} créditos de contenido ya pagado · biblioteca/clips.json + miniaturas')


if __name__ == '__main__':
    main()
