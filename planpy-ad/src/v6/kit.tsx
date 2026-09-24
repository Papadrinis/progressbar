import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND_GREEN, SANS} from '../brand';

export const EMOJI = '"Noto Color Emoji", "Apple Color Emoji", sans-serif';

export const usePop = (at: number, damping = 9) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping, stiffness: 220, mass: 0.6}, durationInFrames: 18});
};

// Sticker con borde blanco que entra rebotando y se queda moviéndose un poco.
export const Sticker: React.FC<{at: number; x: number; y: number; rot?: number; size?: number; children: React.ReactNode; bg?: string; color?: string}> = ({
  at,
  x,
  y,
  rot = -6,
  size = 64,
  children,
  bg = '#fff',
  color = '#141414',
}) => {
  const frame = useCurrentFrame();
  const s = usePop(at);
  if (frame < at) return null;
  const wob = Math.sin((frame - at) / 7) * 3;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${rot + wob}deg)`,
        background: bg,
        color,
        fontFamily: `${SANS}, ${EMOJI}`,
        fontWeight: 800,
        fontSize: size,
        padding: `${size * 0.18}px ${size * 0.36}px`,
        borderRadius: size * 0.4,
        boxShadow: '0 10px 0 rgba(0,0,0,0.18), 0 18px 40px rgba(0,0,0,0.35)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

// Emoji suelto que salta.
export const Emoji: React.FC<{at: number; x: number; y: number; size?: number; children: string; spin?: number}> = ({at, x, y, size = 120, children, spin = 0}) => {
  const frame = useCurrentFrame();
  const s = usePop(at, 7);
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: EMOJI, fontSize: size, transform: `translate(-50%, -50%) scale(${s}) rotate(${spin * (frame - at)}deg)`}}>{children}</div>
  );
};

// Emojis que salen volando hacia arriba (p. ej. plata que se va).
export const FlyAway: React.FC<{at: number; emoji: string; count?: number; x?: number; y?: number}> = ({at, emoji, count = 7, x = 540, y = 1100}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const f = frame - at - i * 2;
        if (f < 0) return null;
        const dx = (i - count / 2) * 70 + Math.sin(i * 3) * 40;
        const dy = -f * (14 + (i % 3) * 4) + f * f * 0.12;
        return (
          <div key={i} style={{position: 'absolute', left: x + dx + f * (i % 2 ? 2 : -2), top: y + dy, fontFamily: EMOJI, fontSize: 90, opacity: interpolate(f, [30, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), transform: `rotate(${f * (i % 2 ? 6 : -6)}deg)`}}>
            {emoji}
          </div>
        );
      })}
    </>
  );
};

// Subtítulo dinámico: cada palabra aparece rebotando cuando se dice; las palabras clave
// van en píldora verde de marca, ligeramente inclinada.
export const WordPop: React.FC<{lines: string[]; keys?: string[]; start: number; voFrames: number; size?: number; top?: number}> = ({
  lines,
  keys = [],
  start,
  voFrames,
  size = 74,
  top = 170,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = lines.flatMap((l, li) => l.split(' ').map((w) => ({w, li})));
  const weights = words.map(({w}) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const starts = weights.map((wt) => {
    const s = start + (acc / total) * voFrames * 0.92;
    acc += wt;
    return s;
  });
  const isKey = (w: string) => keys.some((k) => w.toLowerCase().replace(/[¿?¡!,.:]/g, '').includes(k));
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: -1.5}}>
      {lines.map((_, li) => (
        <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.22}px`}}>
          {words.map((wd, i) => {
            if (wd.li !== li) return null;
            const s = spring({frame: frame - starts[i], fps, config: {damping: 10, stiffness: 260, mass: 0.5}, durationInFrames: 12});
            const key = isKey(wd.w);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: frame >= starts[i] ? 1 : 0,
                  transform: `scale(${s}) rotate(${key ? -3 : 0}deg)`,
                  color: '#fff',
                  background: key ? BRAND_GREEN : 'transparent',
                  padding: key ? `0 ${size * 0.18}px` : 0,
                  borderRadius: size * 0.18,
                  textShadow: key ? 'none' : '0 4px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.6)',
                  WebkitTextStroke: key ? undefined : '2px rgba(0,0,0,0.35)',
                }}
              >
                {wd.w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Transición de barrido: el bloque entra deslizándose con desenfoque de movimiento.
export const Whip: React.FC<{children: React.ReactNode; dir?: 1 | -1; flash?: boolean}> = ({children, dir = 1, flash}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 6], [dir * 100, 0], {extrapolateRight: 'clamp'});
  const blur = interpolate(frame, [0, 6], [22, 0], {extrapolateRight: 'clamp'});
  const push = interpolate(frame, [6, 150], [1, 1.07], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fl = flash ? interpolate(frame, [0, 3, 8], [1, 0.9, 0], {extrapolateRight: 'clamp'}) : 0;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}%) scale(${push})`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
      {children}
      {fl > 0 ? <AbsoluteFill style={{background: '#fff', opacity: fl}} /> : null}
    </AbsoluteFill>
  );
};

export const useShake = (at: number, dur = 12, amp = 20) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 2, at + dur], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return `translate(${Math.sin(frame * 3.3) * amp * k}px, ${Math.cos(frame * 2.9) * amp * k}px)`;
};
