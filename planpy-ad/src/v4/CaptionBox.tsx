import {interpolate, useCurrentFrame} from 'remotion';
import {SANS} from '../brand';

// Texto que se alcanza a leer: entra completo, se queda quieto, sale suave.
// Regla de duración: (palabras ÷ 3) + 1 s como mínimo. Máx. 2 líneas.
// Lo que va entre *asteriscos* sale en color de acento.
const Segments: React.FC<{text: string; accent: string}> = ({text, accent}) => (
  <>
    {text.split('*').map((part, i) => (
      <span key={i} style={{color: i % 2 ? accent : undefined}}>
        {part}
      </span>
    ))}
  </>
);

export const CaptionBox: React.FC<{lines: string[]; duration: number; size?: number; top?: number; accent?: string; pop?: boolean}> = ({
  lines,
  duration,
  size = 66,
  top = 230,
  accent = '#3DB55C',
  pop,
}) => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const out = interpolate(frame, [duration - 6, duration], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scale = pop ? interpolate(frame, [0, 5, 10], [1.25, 0.97, 1], {extrapolateRight: 'clamp'}) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 60,
        right: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity: Math.min(inn, out),
        transform: `translateY(${(1 - inn) * 24}px) scale(${scale})`,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: -1,
        textAlign: 'center',
        color: '#fffaf2',
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={{background: 'rgba(12,10,8,0.78)', padding: `${size * 0.14}px ${size * 0.34}px`, borderRadius: size * 0.22}}>
          <Segments text={l} accent={accent} />
        </div>
      ))}
    </div>
  );
};
