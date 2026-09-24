import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS} from '../brand';

// Billetes colombianos ESTILIZADOS: color y denominación de la serie actual, sin retrato,
// sin textos oficiales ni elementos de seguridad. Se leen como pesos sin imitar un billete real.
export const BILLS = [
  {v: '50.000', c: '#8e3f8a', c2: '#c77dbb'},
  {v: '20.000', c: '#d9722b', c2: '#f2b27a'},
  {v: '10.000', c: '#b93a45', c2: '#e3868c'},
  {v: '100.000', c: '#3d7f55', c2: '#8cc4a0'},
  {v: '5.000', c: '#a47a2e', c2: '#dcc07e'},
  {v: '2.000', c: '#2f6ea8', c2: '#86b4dd'},
  {v: '50.000', c: '#8e3f8a', c2: '#c77dbb'},
  {v: '20.000', c: '#d9722b', c2: '#f2b27a'},
];

export const Billete: React.FC<{v: string; c: string; c2: string}> = ({v, c, c2}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 14,
      overflow: 'hidden',
      background: `linear-gradient(115deg, ${c} 0%, ${c2} 55%, ${c} 100%)`,
      boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
      fontFamily: SANS,
      color: 'rgba(255,255,255,0.92)',
    }}
  >
    {/* textura de guilloche abstracta */}
    <div style={{position: 'absolute', inset: 0, opacity: 0.25, background: `repeating-radial-gradient(circle at 70% 50%, transparent 0 6px, rgba(255,255,255,0.5) 6px 7px)`}} />
    <div style={{position: 'absolute', inset: 14, border: '3px solid rgba(255,255,255,0.35)', borderRadius: 10}} />
    {/* ventana de marca de agua, vacía */}
    <div style={{position: 'absolute', right: 70, top: 55, width: 170, height: 190, borderRadius: '50%', background: 'rgba(255,255,255,0.22)'}} />
    <div style={{position: 'absolute', left: 40, top: 30, fontSize: 64, fontWeight: 800, letterSpacing: -1}}>{v}</div>
    <div style={{position: 'absolute', left: 44, top: 108, fontSize: 24, fontWeight: 600, letterSpacing: 3}}>PESOS</div>
    <div style={{position: 'absolute', left: 40, bottom: 26, fontSize: 40, fontWeight: 800, opacity: 0.8}}>{v}</div>
  </div>
);

// Billetes que caen uno a uno sobre el mostrador (cada caída suena: ver sfx "flick").
export const BilletesCO: React.FC<{every?: number; count?: number}> = ({every = 6, count = 8}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 150, top: 1150, width: 780, height: 420}}>
      {BILLS.slice(0, count).map((b, i) => {
        const s = spring({frame: frame - i * every, fps, config: {damping: 15, stiffness: 180}, durationInFrames: 12});
        const x = interpolate(s, [0, 1], [760, (i % 3) * 10 - 10]);
        const y = interpolate(s, [0, 1], [-120, 70 - i * 6]);
        const r = -7 + ((i * 7) % 13);
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: 0, width: 720, height: 320, transform: `translate(${x}px, ${y}px) rotate(${r + (1 - s) * 18}deg)`, opacity: s > 0.01 ? 1 : 0}}>
            <Billete {...b} />
          </div>
        );
      })}
    </div>
  );
};
