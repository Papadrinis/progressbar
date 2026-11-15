#!/usr/bin/env python3
"""Extrae la voz de una toma que habla (Veo/Seedance con audio) sin cortar palabras.

Uso: python3 scripts/voz_toma.py <toma.mp4> <salida.wav> [--desde S] [--hasta S]

Busca dónde empieza y termina la voz mirando el volumen cada 20 ms y deja margen
(150 ms antes de la primera sílaba, 250 ms después de la última). --desde/--hasta
acotan la búsqueda a un tramo (p. ej. para quedarse con una sola frase de la toma).
Imprime `tomaDesde` y la duración: en el JSON, el bloque usa ese tomaDesde para que
el video arranque en el mismo punto que la voz.
"""
import argparse, math, struct, subprocess, sys, tempfile, wave
from pathlib import Path

PASO = 0.02          # 20 ms
VOZ_DB = -32         # por encima de esto hay voz
SILENCIO_DB = -40    # por debajo, silencio o ambiente
ANTES, DESPUES = 0.15, 0.25

def ffmpeg(*args):
    r = subprocess.run(['npx', 'remotion', 'ffmpeg', '-loglevel', 'error', '-y', *args], capture_output=True, text=True)
    if r.returncode: sys.exit(r.stderr)

def envolvente(ruta):
    with tempfile.TemporaryDirectory() as t:
        w = Path(t) / 'e.wav'
        ffmpeg('-i', str(ruta), '-vn', '-ac', '1', '-ar', '16000', str(w))
        with wave.open(str(w)) as f:
            fr = f.getframerate(); a = f.readframes(f.getnframes())
    x = struct.unpack('<%dh' % (len(a) // 2), a)
    st = int(fr * PASO)
    env = [20 * math.log10(math.sqrt(sum(v * v for v in x[i:i + st]) / st) / 32768 + 1e-9) for i in range(0, len(x) - st, st)]
    return env, len(x) / fr

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('toma'); ap.add_argument('salida')
    ap.add_argument('--desde', type=float, default=0.0); ap.add_argument('--hasta', type=float, default=None)
    a = ap.parse_args()
    env, dur = envolvente(a.toma)
    i0, i1 = int(a.desde / PASO), int((a.hasta or dur) / PASO)
    voz = [i for i in range(i0, min(i1, len(env))) if env[i] > VOZ_DB]
    if not voz:
        sys.exit('no se encontró voz en ese tramo')
    ini, fin = voz[0], voz[-1]
    # retroceder hasta el silencio real antes de la primera sílaba y avanzar hasta el final de la cola de la última
    while ini > i0 and env[ini - 1] > SILENCIO_DB: ini -= 1
    while fin + 1 < len(env) and fin + 1 < i1 and env[fin + 1] > SILENCIO_DB: fin += 1
    t0 = max(0.0, ini * PASO - ANTES)
    t1 = min(dur, (fin + 1) * PASO + DESPUES)
    ffmpeg('-ss', f'{t0:.2f}', '-i', a.toma, '-vn', '-t', f'{t1 - t0:.2f}', '-ar', '48000', a.salida)
    print(f'{Path(a.salida).name}: tomaDesde {t0:.2f} · voz {t1 - t0:.2f} s (habla de {ini * PASO:.2f} a {(fin + 1) * PASO:.2f})')

if __name__ == '__main__':
    main()
