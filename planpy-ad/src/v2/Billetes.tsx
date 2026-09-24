import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Billetes contados a mano sobre el mostrador. Formas abstractas: no se reproduce moneda real.
const TONES = ['#8a6fb0', '#d98b3f', '#c65454', '#6b9a57', '#8a6fb0', '#d98b3f', '#6b9a57', '#c65454'];

export const Billetes: React.FC<{every?: number}> = ({every = 7}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 170, top: 1180, width: 740, height: 400}}>
      {TONES.map((c, i) => {
        const s = spring({frame: frame - i * every, fps, config: {damping: 16}, durationInFrames: 12});
        const x = interpolate(s, [0, 1], [700, (i % 3) * 8]);
        const r = -6 + ((i * 7) % 11);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 60 - i * 5,
              width: 700,
              height: 300,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${c}, ${c}cc)`,
              border: '10px solid rgba(255,255,255,0.25)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
              transform: `translateX(${x}px) rotate(${r}deg)`,
              opacity: s > 0.01 ? 1 : 0,
            }}
          >
            <div style={{position: 'absolute', right: 40, top: 60, width: 150, height: 150, borderRadius: 75, background: 'rgba(255,255,255,0.18)'}} />
          </div>
        );
      })}
    </div>
  );
};
