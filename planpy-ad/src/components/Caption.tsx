import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS, TEXT} from '../brand';

// Texto en pantalla: lleva el mensaje entero sin sonido.
export const Caption: React.FC<{
  lines: string[];
  duration: number;
  top?: number;
  size?: number;
  accent?: string;
}> = ({lines, duration, top = 250, size = 84, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  let wordIndex = 0;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: -1.5,
        color: TEXT,
        textShadow: '0 4px 24px rgba(0,0,0,0.65)',
        opacity: out,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{marginBottom: size * 0.22}}>
          {line.split(' ').map((word, wi) => {
            const delay = wordIndex++ * 3 + li * 10;
            const s = spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 12});
            const isAccent = accent && li === lines.length - 1;
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  marginRight: size * 0.24,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 22}px)`,
                  color: isAccent ? accent : undefined,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
