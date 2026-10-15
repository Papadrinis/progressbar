#!/usr/bin/env python3
"""SparkPy · maquetar: ubica subtítulos, tarjetas y stickers sin tapar la cara del que habla.

Lee public/ads/<ad>.json, detecta la cara en cada toma a lo largo de todo el bloque (no solo un cuadro)
y escribe en cada bloque:
  "cara":   {"x0","y0","x1","y1"}  caja de la cara en el lienzo (unión de los cuadros, px)
  "layout": {"subtitulo": {"base"|"tope"}, "extras": [{"x","y"} | {"omitido": "motivo"}], "avisos": [...]}

Reglas (references/meta-creativos.md): todo dentro de la zona protegida del formato y nunca sobre la cara
(ojos, boca, rostro). Los subtítulos van debajo de la boca; tarjetas y stickers en el espacio libre alrededor
de la cara (abajo apilados sobre los subtítulos, arriba, o a un costado). Si un elemento no entra sin tapar
la cara, se omite y se avisa: la solución es reencuadrar la toma, no achicar ni tapar.

Uso: python3 scripts/maquetar.py <ad>
"""
import json
import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / 'public'

# Mismos números que src/ad/zonas.ts.
ZONAS = {
    '9:16': {'ancho': 1080, 'alto': 1920, 'arriba': 346, 'abajo': 1152, 'izq': 87, 'der': 918, 'sub': 52, 'encuadre': 50},
    '4:5': {'ancho': 1080, 'alto': 1350, 'arriba': 81, 'abajo': 1269, 'izq': 65, 'der': 1015, 'sub': 50, 'encuadre': 30},
}
MARGEN = 24  # aire entre la cara y cualquier elemento
SEP = 14  # aire entre elementos apilados


def medida_sticker(texto, tamano):
    return len(texto) * tamano * 0.58 + tamano * 0.72 + 20, tamano * 1.5 + 20


def medida_extra(x, z):
    t = x['tipo']
    if t == 'sticker':
        return medida_sticker(x['texto'], x.get('tamano', 62))
    if t == 'emoji':
        s = x.get('tamano', 120) * 1.3
        return s, s
    if t == 'tarjeta':
        if x['formato'] == 'celular':
            h = 20 + 34 + 10 + 44 + 18
            if len(x['filas']) > 1:
                h += 36
            if x.get('listo'):
                h += 62
            return z['der'] - z['izq'], h
        return z['der'] - z['izq'], 520  # computador: grande, casi siempre se omite en tomas a cámara
    if t == 'llamada':
        return z['der'] - z['izq'], 136
    return None


def alto_subtitulo(z):
    s = z['sub']
    return 2 * s * 1.12 + 4 + 30


def caras_en_toma(ruta, inicio, dur, z, encuadre):
    """Caja de la cara (unión robusta de los cuadros) en coordenadas del lienzo."""
    if not ruta.suffix.lower() in ('.mp4', '.mov', '.webm', '.png', '.jpg', '.jpeg', '.webp'):
        return None
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    cuadros = []
    if ruta.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'):
        img = cv2.imread(str(ruta))
        cuadros = [img] if img is not None else []
    else:
        cap = cv2.VideoCapture(str(ruta))
        t = inicio
        while t < inicio + dur:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, f = cap.read()
            if ok:
                cuadros.append(f)
            t += 0.33
    if not cuadros:
        return None
    hs, ws = cuadros[0].shape[:2]
    cajas = []
    for f in cuadros:
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        fs = casc.detectMultiScale(g, 1.1, 6, minSize=(int(ws * 0.15), int(ws * 0.15)))
        if len(fs):
            cajas.append(max(fs, key=lambda r: r[2] * r[3]))
    if len(cajas) < max(1, len(cuadros) // 4):
        return None
    # Descarta detecciones sueltas: se queda con las cercanas a la mediana.
    med = sorted(cajas, key=lambda r: r[2] * r[3])[len(cajas) // 2]
    mcx, mcy = med[0] + med[2] / 2, med[1] + med[3] / 2
    buenas = [r for r in cajas if abs(r[0] + r[2] / 2 - mcx) < med[2] * 0.35 and abs(r[1] + r[3] / 2 - mcy) < med[3] * 0.35 and 0.6 < (r[2] * r[3]) / (med[2] * med[3]) < 1.6]
    x0 = min(r[0] for r in buenas)
    y0 = min(r[1] for r in buenas)
    x1 = max(r[0] + r[2] for r in buenas)
    y1 = max(r[1] + r[3] for r in buenas)
    # Fuente → lienzo (object-fit: cover, object-position 50% encuadre%).
    esc = max(z['ancho'] / ws, z['alto'] / hs)
    ox = (z['ancho'] - ws * esc) * 0.5
    oy = (z['alto'] - hs * esc) * (encuadre / 100)
    caja = [x0 * esc + ox, y0 * esc + oy, x1 * esc + ox, y1 * esc + oy]
    # El detector corta la barbilla: se extiende un 8 % hacia abajo.
    caja[3] += (caja[3] - caja[1]) * 0.08
    return [round(v) for v in caja]


def maquetar(ad):
    ruta = PUB / 'ads' / f'{ad}.json'
    a = json.loads(ruta.read_text())
    z = ZONAS[a.get('formato', '9:16')]
    hsub = alto_subtitulo(z)
    for b in a['bloques']:
        enc = b.get('encuadre', z['encuadre'])
        inicio = 0
        dur = (b.get('duracion') or 6) + 0.3
        cara = caras_en_toma(PUB / b['toma'], inicio, dur, z, enc)
        avisos = []
        lay = {'extras': [], 'avisos': avisos}
        if cara:
            b['cara'] = dict(zip(('x0', 'y0', 'x1', 'y1'), cara))
            fx0, fy0, fx1, fy1 = cara[0] - MARGEN, cara[1] - MARGEN, cara[2] + MARGEN, cara[3] + MARGEN
            boca = cara[1] + (cara[3] - cara[1]) * 0.86  # parte baja de la boca
        else:
            b.pop('cara', None)
            fx0 = fy0 = fx1 = fy1 = None
        # 1. Subtítulos: debajo de la cara; si no hay lugar, debajo de la boca (sobre la barbilla); si no, arriba.
        libre_abajo_tope = max(z['arriba'], fy1) if cara else z['arriba']
        if not cara or z['abajo'] - libre_abajo_tope >= hsub:
            lay['subtitulo'] = {'base': z['abajo'] - 6}
            tope_abajo = z['abajo'] - 6 - hsub - SEP  # lo que queda libre sobre los subtítulos
        elif z['abajo'] - (boca + 12) >= hsub:
            lay['subtitulo'] = {'base': z['abajo'] - 6}
            tope_abajo = None
            avisos.append('subtítulos sobre la barbilla (debajo de la boca): toma muy cerrada; reencuadre para dejar aire bajo la cara')
        elif fy0 - z['arriba'] >= hsub:
            lay['subtitulo'] = {'tope': z['arriba'] + 6}
            tope_abajo = None
        else:
            lay['subtitulo'] = {'base': z['abajo'] - 6}
            tope_abajo = None
            avisos.append('✗ no hay lugar para los subtítulos sin tapar la boca: reencuadre la toma (cara más arriba o más chica)')
        # Espacios libres para el resto.
        abajo = [libre_abajo_tope, tope_abajo] if (tope_abajo is not None and cara) else ([z['arriba'], tope_abajo] if tope_abajo is not None else None)
        arriba = [z['arriba'], fy0] if cara else None
        if arriba and 'tope' in lay['subtitulo']:
            arriba[0] = z['arriba'] + 6 + hsub + SEP
        izq = [z['izq'], fx0] if cara else None
        der = [fx1, z['der']] if cara else None
        orden = sorted(range(len(b.get('extras', []))), key=lambda i: 0 if b['extras'][i]['tipo'] in ('tarjeta', 'llamada') else 1)
        res = [None] * len(b.get('extras', []))
        for i in orden:
            x = b['extras'][i]
            m = medida_extra(x, z)
            if m is None:
                continue  # sfx
            w, h = m
            compacta = False
            # La tarjeta celular tiene versión compacta (2 líneas) si la completa no entra.
            if x['tipo'] == 'tarjeta' and x['formato'] == 'celular':
                cabe = lambda hh: (abajo and abajo[1] - abajo[0] >= hh) or (arriba and arriba[1] - arriba[0] >= hh)
                if not cabe(h) and cabe(146):
                    h, compacta = 146, True
            pos = None
            # a) abajo, apilado sobre los subtítulos (crece hacia arriba)
            if abajo and abajo[1] - abajo[0] >= h:
                cy = abajo[1] - h / 2
                abajo[1] -= h + SEP
                pos = (cy, 'abajo')
            # b) arriba de la cara (crece hacia abajo)
            elif arriba and arriba[1] - arriba[0] >= h:
                cy = arriba[0] + h / 2
                arriba[0] += h + SEP
                pos = (cy, 'arriba')
            # c) a un costado de la cara (solo elementos angostos)
            else:
                for lado in (izq, der) if x.get('x', 540) < 540 else (der, izq):
                    if lado and lado[1] - lado[0] >= w:
                        cy = min(max(x.get('y', 700), z['arriba'] + h / 2), z['abajo'] - hsub - SEP - h / 2)
                        pos = (cy, 'costado', (lado[0] + lado[1]) / 2)
                        break
            if pos is None:
                res[i] = {'omitido': f'no entra sin tapar la cara ({round(w)}×{round(h)} px)'}
                avisos.append(f'{x["tipo"]} «{x.get("texto") or x.get("titulo") or x.get("nombre")}» omitido: no hay espacio libre sin tapar la cara; muévalo a otra toma o reencuadre')
                continue
            cy = pos[0]
            if x['tipo'] in ('tarjeta', 'llamada'):
                res[i] = {'y': round(cy - h / 2)}
                if compacta:
                    res[i]['compacta'] = True
                    avisos.append(f'tarjeta «{x["titulo"]}» en versión compacta (2 líneas) para no tapar la cara')
            else:
                if pos[1] == 'costado':
                    cx = pos[2]
                else:
                    pref = x.get('x', 540)
                    cx = min(max(pref, z['izq'] + w / 2), z['der'] - w / 2)
                res[i] = {'x': round(cx), 'y': round(cy)}
        lay['extras'] = [r or {} for r in res]
        b['layout'] = lay
    ruta.write_text(json.dumps(a, ensure_ascii=False, indent=2) + '\n')
    for b in a['bloques']:
        c = b.get('cara')
        print(f"{b['id']:<6} cara {'—' if not c else (c['x0'], c['y0'], c['x1'], c['y1'])}  subt {b['layout']['subtitulo']}")
        for av in b['layout']['avisos']:
            print(f'       ! {av}')


if __name__ == '__main__':
    maquetar(sys.argv[1])
