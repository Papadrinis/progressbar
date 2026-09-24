import {interpolate, useCurrentFrame} from 'remotion';
import {BRAND_GREEN, SANS} from '../brand';

// Subtítulo sincronizado con la voz: la frase entra completa y la palabra que se dice se resalta.
// Los tiempos por palabra se reparten sobre la duración del clip, pesados por su largo.
export const Karaoke: React.FC<{lines: string[]; start: number; voFrames: number; duration: number; size?: number; top?: number}> = ({
  lines,
  start,
  voFrames,
  duration,
  size = 70,
  top = 200,
}) => {
  const frame = useCurrentFrame();
  const words = lines.flatMap((l, li) => l.split(' ').map((w) => ({w, li})));
  const weights = words.map(({w}) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const starts = weights.map((wt) => {
    const s = start + (acc / total) * voFrames;
    acc += wt;
    return s;
  });
  let active = -1;
  starts.forEach((s, i) => {
    if (frame >= s) active = i;
  });
  const inn = interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'});
  const out = interpolate(frame, [duration - 4, duration], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 50,
        right: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity: Math.min(inn, out),
        transform: `scale(${interpolate(inn, [0, 1], [0.9, 1])})`,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: -1,
        color: '#fffaf2',
      }}
    >
      {lines.map((_, li) => (
        <div key={li} style={{background: 'rgba(12,10,8,0.8)', padding: `${size * 0.12}px ${size * 0.3}px`, borderRadius: size * 0.2, textAlign: 'center'}}>
          {words.map((wd, i) =>
            wd.li === li ? (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  marginRight: size * 0.22,
                  color: i === active ? BRAND_GREEN : undefined,
                  transform: `scale(${i === active ? 1.08 : 1})`,
                }}
              >
                {wd.w}
              </span>
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
};
