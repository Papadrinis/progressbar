#!/usr/bin/env python3
"""SparkPy · croma: quita el fondo verde de una toma y la exporta como WebM VP9 con transparencia.

    python3 scripts/croma.py public/v18b/verde1.mp4 public/v18b/verde1.webm [--desde 0.0] [--hasta 10.0] [--ancho 720]

La toma tiene que venir sobre verde croma liso (#00B140). La clave es «cuánto más verde que rojo y azul» es
cada píxel; el borde se suaviza y se le quita el reflejo verde (despill). Remotion la monta con
<OffthreadVideo transparent>. La de .mp4 con verde se conserva: maquetar la usa para ubicar la cara.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np


def clave(f, t0=0.08, t1=0.22):
    b, g, r = [c.astype(np.float32) / 255 for c in cv2.split(f)]
    dom = g - np.maximum(r, b)
    a = 1 - np.clip((dom - t0) / (t1 - t0), 0, 1)
    a = cv2.GaussianBlur(a, (5, 5), 0)
    a = cv2.erode(a, np.ones((3, 3), np.uint8))
    g2 = np.where(dom > 0, np.maximum(r, b) + np.clip(dom, 0, 0.02), g)  # despill
    rgba = np.dstack([r, g2, b, a])
    return (np.clip(rgba, 0, 1) * 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('entrada')
    ap.add_argument('salida')
    ap.add_argument('--desde', type=float, default=0)
    ap.add_argument('--hasta', type=float, default=None)
    ap.add_argument('--ancho', type=int, default=720)
    o = ap.parse_args()
    if o.entrada.lower().endswith(('.png', '.jpg', '.jpeg')):
        f = cv2.imread(o.entrada)
        cv2.imwrite(o.salida, cv2.cvtColor(clave(f), cv2.COLOR_RGBA2BGRA))
        return
    cap = cv2.VideoCapture(o.entrada)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w0, h0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    w = o.ancho - o.ancho % 2
    h = int(h0 * w / w0) // 2 * 2
    cap.set(cv2.CAP_PROP_POS_MSEC, o.desde * 1000)
    # El ffmpeg de Remotion no lee video crudo por tubería: se escriben PNG con alfa y se codifican.
    tmp = Path(tempfile.mkdtemp(prefix='croma-'))
    n = 0
    while True:
        ok, f = cap.read()
        if not ok or (o.hasta is not None and n / fps >= o.hasta - o.desde):
            break
        cv2.imwrite(str(tmp / f'{n:05d}.png'), cv2.cvtColor(clave(cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA)), cv2.COLOR_RGBA2BGRA))
        n += 1
    cmd = ['npx', 'remotion', 'ffmpeg', '-y', '-v', 'error', '-framerate', str(fps), '-i', str(tmp / '%05d.png'),
           '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '5M', '-auto-alt-ref', '0', str(Path(o.salida).resolve())]
    r = subprocess.run(cmd, cwd=Path(__file__).resolve().parent.parent)
    shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(r.returncode)


if __name__ == '__main__':
    main()
