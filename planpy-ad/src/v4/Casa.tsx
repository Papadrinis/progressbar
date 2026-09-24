import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

// La casa, a la hora de comer. Luz cálida, mesa puesta. Nada de producción de catálogo.
export const Casa: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 150], [1.04, 1.1]);
  return (
    <AbsoluteFill style={{background: '#1a100a', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 50% at 50% 30%, #7a4a26 0%, #3a2314 50%, #1a100a 100%)'}} />
        <AbsoluteFill style={{filter: 'blur(18px)'}}>
          {[{x: 140, y: 260, r: 90, c: '#ffcf8a'}, {x: 860, y: 180, r: 70, c: '#ffe0b0'}, {x: 620, y: 420, r: 50, c: '#ffb870'}, {x: 300, y: 620, r: 120, c: '#a8623a'}, {x: 900, y: 700, r: 140, c: '#5b3a24'}].map((b, i) => (
            <div key={i} style={{position: 'absolute', left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2, borderRadius: b.r, background: b.c, opacity: 0.55}} />
          ))}
        </AbsoluteFill>
        {/* mesa */}
        <div style={{position: 'absolute', left: -60, right: -60, top: 1150, bottom: -60, background: 'linear-gradient(#8a5d38, #5e3d22)'}} />
        <div style={{position: 'absolute', left: -60, right: -60, top: 1150, height: 10, background: 'rgba(255,220,170,0.3)'}} />
        {/* plato y vaso */}
        <div style={{position: 'absolute', left: -120, top: 1420, width: 520, height: 300, borderRadius: '50%', background: '#f2ede4', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'}}>
          <div style={{position: 'absolute', left: 90, top: 50, width: 340, height: 190, borderRadius: '50%', background: 'radial-gradient(circle at 40% 45%, #e8c35a 0 22%, #7a4a2a 23% 48%, #6f9a44 49% 62%, #efe7d8 63%)'}} />
        </div>
        <div style={{position: 'absolute', left: 820, top: 1300, width: 150, height: 240, borderRadius: '10px 10px 24px 24px', background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))', border: '3px solid rgba(255,255,255,0.25)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const DayLight: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, rgba(255,244,222,0.55), rgba(255,236,205,0.18) 70%)', mixBlendMode: 'screen'}} />
);
