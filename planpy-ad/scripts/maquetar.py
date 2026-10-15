#!/usr/bin/env python3
"""SparkPy · maquetar: ubica subtítulos, tarjetas y stickers sin tapar a las personas ni el producto.

Lee public/ads/<ad>.json y, en cada bloque, mira la toma a lo largo de TODO el bloque (no un solo cuadro):
  - caras (YuNet, con ojos y boca; todas las caras, no solo la más grande),
  - personas sin cara visible (de espaldas, de perfil fuerte, cuerpo entero: detector HOG de OpenCV),
  - zonas que el JSON marca a mano en "proteger" (el detalle del producto en una demo o un try-on).
Con eso escribe en el bloque:
  "cara":   caja de la cara principal en el lienzo (px)
  "obstaculos": [{"tipo": "cara"|"persona"|"producto", "x0","y0","x1","y1"}]
  "layout": {"subtitulo": {"base"|"tope"}, "extras": [{"x","y"} | {"omitido": "motivo"}], "avisos": [...]}

Reglas (references/meta-creativos.md): todo dentro de la zona protegida del formato y nada sobre una cara, una
persona ni el producto. Subtítulos debajo de la boca; tarjetas y stickers donde haya lugar libre. Si algo no
entra sin tapar, se omite y se avisa; si hay una persona pero no se ve su cara, el bloque queda NEEDS REVIEW
(✗ en revisar) hasta que alguien marque a mano qué proteger.

Uso: python3 scripts/maquetar.py <ad>
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / 'public'
MODELO_CARAS = ROOT / 'scripts' / 'modelos' / 'yunet.onnx'

# Mismos números que src/ad/zonas.ts.
ZONAS = {
    '9:16': {'ancho': 1080, 'alto': 1920, 'arriba': 346, 'abajo': 1152, 'izq': 87, 'der': 918, 'sub': 52, 'encuadre': 50},
    '4:5': {'ancho': 1080, 'alto': 1350, 'arriba': 81, 'abajo': 1269, 'izq': 65, 'der': 1015, 'sub': 50, 'encuadre': 30},
}
MARGEN = 24  # aire alrededor de caras, personas y producto
SEP = 14  # aire entre elementos


# ---------- medidas de los elementos (mismas fórmulas que la composición) ----------
def medida_sticker(texto, tamano):
    return len(texto) * tamano * 0.58 + tamano * 0.72 + 20, tamano * 1.5 + 20


def medida_extra(x, z, compacta=False):
    t = x['tipo']
    if t == 'sticker':
        return medida_sticker(x['texto'], x.get('tamano', 62))
    if t == 'emoji':
        s = x.get('tamano', 120) * 1.3
        return s, s
    if t == 'tarjeta':
        if x['formato'] == 'celular':
            if compacta:
                return z['der'] - z['izq'], 146
            h = 20 + 34 + 10 + 44 + 18 + (36 if len(x['filas']) > 1 else 0) + (62 if x.get('listo') else 0)
            return z['der'] - z['izq'], h
        return z['der'] - z['izq'], 520
    if t == 'llamada':
        return z['der'] - z['izq'], 136
    return None


def alto_subtitulo(z, lineas=2):
    return lineas * z['sub'] * 1.12 + 4 + 30


# ---------- detección ----------
def cuadros_de(ruta, dur):
    suf = ruta.suffix.lower()
    if suf in ('.png', '.jpg', '.jpeg', '.webp'):
        img = cv2.imread(str(ruta))
        return [img] if img is not None else []
    if suf not in ('.mp4', '.mov', '.webm'):
        return []
    cap = cv2.VideoCapture(str(ruta))
    out, t = [], 0.0
    while t < dur:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, f = cap.read()
        if ok:
            out.append(f)
        t += 0.33
    return out


def cuadros_de_desde(ruta, desde, dur):
    if not ruta.exists():
        return []
    cap = cv2.VideoCapture(str(ruta))
    out, t = [], 0.0
    while t < dur:
        cap.set(cv2.CAP_PROP_POS_MSEC, (desde + t) * 1000)
        ok, f = cap.read()
        if ok:
            out.append(f)
        t += 0.33
    return out


def caras_en(f):
    h, w = f.shape[:2]
    esc = 640 / max(w, h)
    p = cv2.resize(f, (int(w * esc), int(h * esc)))
    det = cv2.FaceDetectorYN.create(str(MODELO_CARAS), '', (p.shape[1], p.shape[0]), 0.7, 0.3, 50)
    _, res = det.detect(p)
    out = []
    for r in res if res is not None else []:
        x, y, ww, hh = r[:4] / esc
        if ww < w * 0.05:
            continue  # caras diminutas del fondo
        boca_y = max(r[11], r[13]) / esc  # comisuras
        out.append({'caja': [x, y, x + ww, y + hh], 'boca': boca_y})
    return out


HOG = cv2.HOGDescriptor()
HOG.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())


def personas_en(f):
    h, w = f.shape[:2]
    esc = 480 / max(w, h)
    p = cv2.resize(f, (int(w * esc), int(h * esc)))
    rects, pesos = HOG.detectMultiScale(p, winStride=(8, 8), padding=(8, 8), scale=1.05)
    return [[x / esc, y / esc, (x + rw) / esc, (y + rh) / esc] for (x, y, rw, rh), s in zip(rects, np.ravel(pesos)) if s > 0.6]


def agrupar(cajas, min_frac):
    """Junta detecciones de la misma persona a lo largo de la toma (tracks por solapamiento)."""
    tracks = []
    for c in cajas:
        for t in tracks:
            u = t['u']
            ix = max(0, min(u[2], c[2]) - max(u[0], c[0]))
            iy = max(0, min(u[3], c[3]) - max(u[1], c[1]))
            if ix * iy > 0.3 * min((c[2] - c[0]) * (c[3] - c[1]), (u[2] - u[0]) * (u[3] - u[1])):
                t['n'] += 1
                t['u'] = [min(u[0], c[0]), min(u[1], c[1]), max(u[2], c[2]), max(u[3], c[3])]
                break
        else:
            tracks.append({'u': list(c), 'n': 1})
    return [t for t in tracks if t['n'] >= min_frac]


def a_lienzo(c, ws, hs, z, enc, fondo=None):
    esc = max(z['ancho'] / ws, z['alto'] / hs)
    ox = (z['ancho'] - ws * esc) * 0.5
    oy = (z['alto'] - hs * esc) * (enc / 100)
    r = [c[0] * esc + ox, c[1] * esc + oy, c[2] * esc + ox, c[3] * esc + oy]
    if fondo:  # toma de atrás agrandada desde el centro y corrida (green screen)
        s, tx, ty = fondo.get('escala', 1), fondo.get('x', 0), fondo.get('y', 0)
        cx, cy = z['ancho'] / 2, z['alto'] / 2
        r = [(r[0] - cx) * s + cx + tx, (r[1] - cy) * s + cy + ty, (r[2] - cx) * s + cx + tx, (r[3] - cy) * s + cy + ty]
    return r


def analizar(b, z):
    enc = b.get('encuadre', z['encuadre'])
    fondo = (b.get('verde') or {}).get('fondo')
    _al = a_lienzo
    a_lienzo_b = lambda c, ws, hs, z, enc: _al(c, ws, hs, z, enc, fondo)
    cuadros = cuadros_de(PUB / b['toma'], ((b.get('duracion') or 6) + 0.3) * b.get('velocidadToma', 1))
    if not cuadros:
        return [], None, 0, []  # escena 2D, interfaz, etc.
    hs, ws = cuadros[0].shape[:2]
    det_caras, det_personas, caras_t = [], [], []
    for i, f in enumerate(cuadros):
        cs = caras_en(f)
        det_caras += cs
        for c in cs:
            k = a_lienzo_b(c['caja'], ws, hs, z, enc)
            k[3] += (k[3] - k[1]) * 0.06
            caras_t.append((i * 0.33, k))
        if not cs:
            det_personas += personas_en(f)
    n = len(cuadros)
    obst = []
    boca = None
    for t in agrupar([c['caja'] for c in det_caras], max(1, n // 5)):
        caja = a_lienzo_b(t['u'], ws, hs, z, enc)
        caja[3] += (caja[3] - caja[1]) * 0.06  # la caja de YuNet corta la barbilla
        obst.append({'tipo': 'cara', 'caja': caja})
    if det_caras:
        bocas = [c['boca'] for c in det_caras]
        boca = a_lienzo_b([0, max(bocas), 0, max(bocas)], ws, hs, z, enc)[1]
    personas_sin_cara = 0
    for t in agrupar(det_personas, max(1, n // 3)):
        caja = a_lienzo_b(t['u'], ws, hs, z, enc)
        # Si ya hay una cara dentro de esa persona, la cara manda.
        if any(o['caja'][0] < caja[2] and o['caja'][2] > caja[0] and o['caja'][1] < caja[3] and o['caja'][3] > caja[1] for o in obst):
            continue
        personas_sin_cara += 1
        # Se protege la mitad de arriba del cuerpo (cabeza y torso).
        obst.append({'tipo': 'persona', 'caja': [caja[0], caja[1], caja[2], caja[1] + (caja[3] - caja[1]) * 0.55]})
    # Green screen: la persona recortada encima. Se busca su cara en la toma con verde y se lleva al lienzo
    # según dónde y de qué tamaño va la miniatura. Es quien habla: su boca manda para los subtítulos.
    v = b.get('verde')
    if v:
        src = PUB / (v.get('deteccion') or v['miniatura'].rsplit('.', 1)[0] + '.mp4')
        mini = cuadros_de_desde(src, v.get('desde', 0), (b.get('duracion') or 6) + 0.3)
        if mini:
            hm, wm = mini[0].shape[:2]
            k = v['ancho'] / wm
            lleva = lambda c: [v['x'] + c[0] * k, v['y'] + c[1] * k, v['x'] + c[2] * k, v['y'] + c[3] * k]
            dm = []
            for i, f in enumerate(mini):
                for c in caras_en(f):
                    cj = lleva(c['caja'])
                    cj[3] += (cj[3] - cj[1]) * 0.06
                    dm.append(dict(c, caja=cj))
                    caras_t.append((i * 0.33, cj))
            for t in agrupar([c['caja'] for c in dm], max(1, len(mini) // 5)):
                obst.append({'tipo': 'cara', 'caja': t['u']})
            if dm:
                boca = v['y'] + max(c['boca'] for c in dm) * k
    for p in b.get('proteger', []):
        obst.append({'tipo': 'producto', 'caja': [p['x0'], p['y0'], p['x1'], p['y1']]})
    return obst, boca, personas_sin_cara, caras_t


def inicio_de(x, dur):
    """Segundo del bloque en que aparece un extra («30%» o frames a 30 fps)."""
    en = x.get('en', 0)
    if isinstance(en, str) and en.strip().endswith('%'):
        return float(en.strip()[:-1]) / 100 * dur
    try:
        return float(en) / 30
    except (TypeError, ValueError):
        return 0.0


def bloqueos_desde(obst, caras_t, t0):
    """Obstáculos mientras el extra está en pantalla: la cara medida solo desde t0 (no antes), el resto igual."""
    resto = [o['caja'] for o in obst if o['tipo'] != 'cara']
    vistas = [c for t, c in caras_t if t >= t0 - 0.2]
    if not vistas:
        return [o['caja'] for o in obst]
    return resto + [t['u'] for t in agrupar(vistas, 1)]


# ---------- ubicación ----------
def choca(r, cajas, margen=MARGEN):
    return any(r[0] < c[2] + margen and r[2] > c[0] - margen and r[1] < c[3] + margen and r[3] > c[1] - margen for c in cajas)


def dentro(r, z):
    return r[0] >= z['izq'] and r[2] <= z['der'] and r[1] >= z['arriba'] and r[3] <= z['abajo']


def panel_angosto(z, h, bloqueos, min_w=480):
    """Panel de subtítulos más angosto que la zona: el más ancho y más bajo que no toque ninguna cara."""
    for w in range(int(z['der'] - z['izq']) - 40, min_w - 1, -40):
        y1 = z['abajo'] - 6
        while y1 - h >= z['arriba']:
            for x0 in range(int(z['izq']), int(z['der'] - w) + 1, 20):
                r = [x0, y1 - h, x0 + w, y1]
                if not choca(r, bloqueos):
                    return r
            y1 -= 20
    return None


def buscar(w, h, pref_x, z, bloqueos, ocupados):
    """Primer lugar libre para un elemento w×h: de abajo hacia arriba, cerca del x preferido."""
    xs = sorted({min(max(px, z['izq'] + w / 2), z['der'] - w / 2) for px in (pref_x, (z['izq'] + z['der']) / 2, z['izq'] + w / 2, z['der'] - w / 2)}, key=lambda v: abs(v - pref_x))
    y = z['abajo'] - h / 2
    while y >= z['arriba'] + h / 2:
        for cx in xs:
            r = [cx - w / 2, y - h / 2, cx + w / 2, y + h / 2]
            if dentro(r, z) and not choca(r, bloqueos) and not choca(r, ocupados, SEP):
                return cx, y, r
        y -= 8
    return None


def maquetar(ad):
    ruta = PUB / 'ads' / f'{ad}.json'
    a = json.loads(ruta.read_text())
    z = ZONAS[a.get('formato', '9:16')]
    hsub = alto_subtitulo(z)
    anchosub = z['der'] - z['izq']
    for b in a['bloques']:
        obst, boca, sin_cara, caras_t = analizar(b, z)
        avisos = []
        lay = {'extras': [], 'avisos': avisos}
        caras = [o for o in obst if o['tipo'] == 'cara']
        principal = max(caras, key=lambda o: (o['caja'][2] - o['caja'][0]) * (o['caja'][3] - o['caja'][1])) if caras else None
        if principal:
            b['cara'] = dict(zip(('x0', 'y0', 'x1', 'y1'), [round(v) for v in principal['caja']]))
        else:
            b.pop('cara', None)
        b['obstaculos'] = [{'tipo': o['tipo'], **dict(zip(('x0', 'y0', 'x1', 'y1'), [round(v) for v in o['caja']]))} for o in obst]
        if sin_cara:
            avisos.append(f'✗ NEEDS REVIEW: hay {sin_cara} persona(s) sin cara visible; se protegió la cabeza y el torso detectados. Revise la muestra y, si hace falta, marque "proteger" en el bloque')
        duras = [o['caja'] for o in obst]
        # 1. Subtítulos: abajo de la zona sin tocar ninguna cara/persona/producto…
        ocupados = []
        r_abajo = [z['izq'], z['abajo'] - 6 - hsub, z['der'], z['abajo'] - 6]
        r_arriba = [z['izq'], z['arriba'] + 6, z['der'], z['arriba'] + 6 + hsub]
        # …o tapando solo la barbilla (debajo de la boca) en primeros planos.
        sin_barbilla = [[c[0], c[1], c[2], min(c[3], boca + 12)] if (o['tipo'] == 'cara' and boca) else c for o, c in zip(obst, duras)]
        if not choca(r_abajo, duras):
            lay['subtitulo'] = {'base': z['abajo'] - 6}
            ocupados.append(r_abajo)
        elif (ang := panel_angosto(z, hsub, duras)):
            lay['subtitulo'] = {'base': round(ang[3]), 'x0': round(ang[0]), 'x1': round(ang[2])}
            ocupados.append(ang)
            avisos.append('subtítulos en panel angosto para no tapar ninguna cara (green screen o dos personas)')
        elif (ang := panel_angosto(z, alto_subtitulo(z, 1), duras)):
            lay['subtitulo'] = {'base': round(ang[3]), 'x0': round(ang[0]), 'x1': round(ang[2]), 'lineas': 1}
            ocupados.append(ang)
            avisos.append('subtítulos de 1 línea en panel angosto para no tapar ninguna cara')
        elif not choca(r_abajo, sin_barbilla, 8):
            lay['subtitulo'] = {'base': z['abajo'] - 6}
            ocupados.append(r_abajo)
            avisos.append('subtítulos sobre la barbilla (debajo de la boca): toma muy cerrada; para la próxima, encuadre con aire bajo el mentón')
        elif not choca(r_arriba, duras):
            lay['subtitulo'] = {'tope': z['arriba'] + 6}
            ocupados.append(r_arriba)
        else:
            lay['subtitulo'] = {'base': z['abajo'] - 6}
            ocupados.append(r_abajo)
            avisos.append('✗ no hay lugar para los subtítulos sin tapar la boca o el producto: reencuadre la toma')
        # 2. Tarjetas y llamadas primero (llevan información), después stickers y emojis.
        def ubicar(ocupados):
            ocupados = list(ocupados)
            avisos = []
            extras = b.get('extras', [])
            res = [{} for _ in extras]
            for i in sorted(range(len(extras)), key=lambda i: 0 if extras[i]['tipo'] in ('tarjeta', 'llamada') else 1):
                x = extras[i]
                m = medida_extra(x, z)
                if m is None:
                    continue
                w, h = m
                bloq = bloqueos_desde(obst, caras_t, inicio_de(x, b.get('duracion') or 6))
                hallado = buscar(w, h, x.get('x', 540), z, bloq, ocupados)
                compacta = False
                if not hallado and x['tipo'] == 'tarjeta' and x['formato'] == 'celular':
                    w, h = medida_extra(x, z, compacta=True)
                    hallado = buscar(w, h, 540, z, bloq, ocupados)
                    compacta = bool(hallado)
                a_camara = b.get('a_camara', b.get('entrada') == 0)
                if not hallado and x['tipo'] == 'tarjeta' and not a_camara:
                    # Toma de apoyo (nadie habla a cámara): corte a pantalla. La tarjeta ocupa la zona sobre la toma
                    # desenfocada, así no tapa una cara y la demo del producto se ve completa.
                    res[i] = {'inserto': True, 'y': z['arriba'] + 10}
                    avisos.append(f'tarjeta «{x["titulo"]}» como corte a pantalla (la toma se desenfoca detrás): no entraba sin tapar a la persona')
                    continue
                if not hallado:
                    nombre = x.get('texto') or x.get('titulo') or x.get('nombre')
                    res[i] = {'omitido': f'no entra sin tapar ({round(w)}×{round(h)} px)'}
                    avisos.append(f'{x["tipo"]} «{nombre}» omitido: no hay lugar libre sin tapar a la persona o el producto; muévalo a otra toma o reencuadre')
                    continue
                cx, cy, r = hallado
                ocupados.append(r)
                if x['tipo'] in ('tarjeta', 'llamada'):
                    res[i] = {'y': round(r[1])}
                    if compacta:
                        res[i]['compacta'] = True
                        avisos.append(f'tarjeta «{x["titulo"]}» en versión compacta (2 líneas) para no tapar a la persona')
                else:
                    res[i] = {'x': round(cx), 'y': round(cy)}

            malos = sum(1 for r in res if r.get('omitido') or r.get('inserto'))
            return res, avisos, malos
        res, av_extras, malos = ubicar(ocupados)
        # Si algo no entra con subtítulos de 2 líneas, se prueba con 1 línea (más aire entre el mentón y el texto).
        if malos and 'base' in lay['subtitulo'] and 'x0' not in lay['subtitulo']:
            h1 = alto_subtitulo(z, 1)
            r1 = [z['izq'], z['abajo'] - 2 - h1, z['der'], z['abajo'] - 2]
            res1, av1, malos1 = ubicar([r1 if o is ocupados[0] else o for o in ocupados] if ocupados else [r1])
            if malos1 < malos:
                res, av_extras = res1, av1 + ['subtítulos de 1 línea para que entren tarjetas/stickers sin tapar la cara']
                lay['subtitulo'] = {'base': z['abajo'] - 2, 'lineas': 1}
        avisos.extend(av_extras)
        lay['extras'] = res
        b['layout'] = lay
    ruta.write_text(json.dumps(a, ensure_ascii=False, indent=2) + '\n')
    for b in a['bloques']:
        ob = ', '.join(f"{o['tipo']} ({o['x0']},{o['y0']},{o['x1']},{o['y1']})" for o in b['obstaculos']) or 'sin personas'
        print(f"{b['id']:<6} {ob}  subt {b['layout']['subtitulo']}")
        for av in b['layout']['avisos']:
            print(f'       ! {av}')


if __name__ == '__main__':
    maquetar(sys.argv[1])
