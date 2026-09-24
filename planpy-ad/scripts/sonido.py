"""Genera efectos y música de fondo para los anuncios (síntesis propia, sin licencias de terceros).

    python3 scripts/sonido.py   → public/sfx/*.wav y public/music/cama-112bpm.wav
"""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
from pathlib import Path

SR = 44100
ROOT = Path(__file__).resolve().parent.parent / 'public'
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, d=0.2):
    x = np.arange(n) / SR
    return np.minimum(1, x / a) * np.exp(-x / d)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x)


def save(path, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(path, SR, (np.stack([x, x], 1) * 32767).astype(np.int16))


# --- efectos -----------------------------------------------------------------
def impact():
    tt = t(1.1)
    f = 90 * np.exp(-tt * 6) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 0.35)
    crack = lp(rng.standard_normal(len(tt)), 3000) * env(len(tt), 0.001, 0.05)
    return body + 0.5 * crack


def whoosh(d=0.38):
    n = int(SR * d)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    # barrido de filtro por tramos: sube y baja, como un paso rápido de cámara
    steps = 24
    for i in range(steps):
        a, b = i * n // steps, (i + 1) * n // steps
        c = 400 + 5000 * np.sin(np.pi * i / steps) ** 2
        out[a:b] = bp(noise, c * 0.6, min(c * 1.6, 18000))[a:b]
    shape = np.sin(np.pi * np.arange(n) / n) ** 1.5
    return out * shape


def click():
    tt = t(0.05)
    return hp(rng.standard_normal(len(tt)), 2000) * env(len(tt), 0.0005, 0.006) + 0.4 * np.sin(2 * np.pi * 1800 * tt) * env(len(tt), 0.0005, 0.01)


def ding():
    tt = t(1.0)
    return sum(a * np.sin(2 * np.pi * f * tt) * env(len(tt), 0.002, dd) for f, a, dd in [(1318.5, 1, 0.35), (1975.5, 0.6, 0.3), (2637, 0.25, 0.2)]) + np.concatenate(
        [np.zeros(int(SR * 0.09)), (np.sin(2 * np.pi * 1760 * tt) * env(len(tt), 0.002, 0.4))[: len(tt) - int(SR * 0.09)]]
    )


def notif():
    tt = t(0.55)
    a = np.sin(2 * np.pi * 880 * tt) * env(len(tt), 0.003, 0.12)
    b = np.sin(2 * np.pi * 1320 * tt) * env(len(tt), 0.003, 0.2)
    off = int(SR * 0.12)
    return a + np.concatenate([np.zeros(off), b[:-off]])


def pop():
    tt = t(0.12)
    f = 700 * np.exp(-tt * 30) + 180
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.001, 0.04)


def scribble():
    tt = t(0.6)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt) ** 2
    return bp(rng.standard_normal(len(tt)), 2500, 7000) * am * np.sin(np.pi * tt / 0.6)


def flick():
    tt = t(0.14)
    return bp(rng.standard_normal(len(tt)), 1500, 9000) * env(len(tt), 0.003, 0.03) + 0.3 * lp(rng.standard_normal(len(tt)), 400) * env(len(tt), 0.002, 0.02)


def typing():
    out = np.zeros(int(SR * 0.9))
    for i, at in enumerate([0.0, 0.13, 0.24, 0.39, 0.5, 0.63]):
        c = click() * (0.7 + 0.3 * (i % 2))
        s = int(SR * at)
        out[s : s + len(c)] += c
    return out


def riser():
    tt = t(0.9)
    f = 200 + 1400 * (tt / 0.9) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
    noise = hp(rng.standard_normal(len(tt)), 3000) * 0.5
    return (tone + noise) * (tt / 0.9) ** 2


SFX = dict(impact=impact, whoosh=whoosh, click=click, ding=ding, notif=notif, pop=pop, scribble=scribble, flick=flick, typing=typing, riser=riser)

# --- música: cama pop/lo-fi a 112 BPM, C–G–Am–F ---------------------------------
BPM = 112
BEAT = 60 / BPM
BARS = 12
LEN = BARS * 4 * BEAT + 1.5


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


def music():
    n = int(SR * LEN)
    mix = np.zeros(n)

    def add(x, at, g=1.0):
        s = int(SR * at)
        e = min(n, s + len(x))
        mix[s:e] += g * x[: e - s]

    kick_t = t(0.35)
    kick = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-kick_t * 25) + 45) / SR) * env(len(kick_t), 0.001, 0.12)
    clap_t = t(0.25)
    clap = bp(rng.standard_normal(len(clap_t)), 900, 5000) * env(len(clap_t), 0.001, 0.07)
    hat_t = t(0.06)
    hat = hp(rng.standard_normal(len(hat_t)), 7000) * env(len(hat_t), 0.0005, 0.015)

    chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]  # C G Am F
    roots = [36, 43, 45, 41]
    for bar in range(BARS):
        b0 = bar * 4 * BEAT
        ch = chords[bar % 4]
        for beat in range(4):
            at = b0 + beat * BEAT
            add(kick, at, 0.9 if beat in (0, 2) else 0.0)
            if beat in (1, 3):
                add(clap, at, 0.45)
            for h in (0, 0.5):
                add(hat, at + h * BEAT, 0.22 if h else 0.14)
            # bajo en corcheas con salto de octava
            for h, oct_ in ((0, 0), (0.5, 12)):
                bt = t(BEAT * 0.45)
                f = note(roots[bar % 4] + oct_)
                bass = (np.sin(2 * np.pi * f * bt) + 0.3 * np.sin(4 * np.pi * f * bt)) * env(len(bt), 0.004, 0.12)
                add(bass, at + h * BEAT, 0.5)
            # plucks de acorde en los contratiempos
            pt = t(BEAT * 0.9)
            pl = sum(lp(np.sign(np.sin(2 * np.pi * note(m + 12) * pt)) * 0.5 + np.sin(2 * np.pi * note(m + 12) * pt), 2200) for m in ch)
            add(pl * env(len(pt), 0.003, 0.14), at + 0.5 * BEAT, 0.12)
        # pad suave por compás
        padt = t(4 * BEAT)
        pad = sum(np.sin(2 * np.pi * note(m) * padt) + 0.5 * np.sin(2 * np.pi * note(m) * 1.003 * padt) for m in ch)
        add(pad * np.minimum(1, padt / 0.3) * np.minimum(1, (4 * BEAT - padt) / 0.3), b0, 0.05)
    fade = np.ones(n)
    fade[-int(SR * 1.5):] = np.linspace(1, 0, int(SR * 1.5))
    return lp(mix, 12000) * fade


if __name__ == '__main__':
    for name, fn in SFX.items():
        save(ROOT / 'sfx' / f'{name}.wav', fn())
    save(ROOT / 'music' / 'cama-112bpm.wav', music(), peak=0.8)
    print('ok')
