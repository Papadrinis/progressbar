import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {LAMP, NIGHT} from '../brand';

// Tienda de barrio cerrada: estantes cargados fuera de foco, una sola luz sobre el mostrador.
// Es un sustituto construido en código. Si hay material real, va por `hookFootage`.
const SHELF_COLORS = ['#7a2f22', '#b58a2e', '#2f4f6b', '#8a3d52', '#4d6b35', '#c2b59b', '#5a3a26', '#a3582a'];

const Shelf: React.FC<{y: number; seed: number}> = ({y, seed}) => {
  const items = Array.from({length: 14}, (_, i) => {
    const h = 70 + ((i * 37 + seed * 13) % 60);
    const w = 48 + ((i * 17 + seed * 7) % 40);
    return {h, w, c: SHELF_COLORS[(i + seed) % SHELF_COLORS.length]};
  });
  return (
    <div style={{position: 'absolute', top: y, left: -40, right: -40, display: 'flex', alignItems: 'flex-end', gap: 10}}>
      {items.map((it, i) => (
        <div key={i} style={{width: it.w, height: it.h, background: it.c, borderRadius: 4}} />
      ))}
      <div style={{position: 'absolute', bottom: -16, left: 0, right: 0, height: 16, background: '#3a2a1c'}} />
    </div>
  );
};

export const Tienda: React.FC<{lampOffAt?: number}> = ({lampOffAt = Infinity}) => {
  const frame = useCurrentFrame();
  // La luz parpadea una vez al apagarse, como un tubo real.
  const lamp =
    frame < lampOffAt
      ? 1
      : interpolate(frame - lampOffAt, [0, 3, 5, 8, 16], [1, 0.3, 0.8, 0.15, 0.06], {extrapolateRight: 'clamp'});
  const push = interpolate(frame, [0, 600], [1, 1.1]);
  return (
    <AbsoluteFill style={{background: NIGHT, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <AbsoluteFill style={{filter: 'blur(9px)', opacity: 0.22 + 0.5 * lamp}}>
          <Shelf y={120} seed={1} />
          <Shelf y={340} seed={4} />
          <Shelf y={560} seed={2} />
          <Shelf y={780} seed={6} />
          {/* tiras de productos colgando, típicas de la tienda de barrio */}
          {[140, 300, 820, 960].map((x, i) => (
            <div key={x} style={{position: 'absolute', left: x, top: 0, width: 34, height: 520 + i * 40, background: `repeating-linear-gradient(${SHELF_COLORS[i]} 0 60px, #2a1d12 60px 66px)`}} />
          ))}
        </AbsoluteFill>
        {/* mostrador de madera */}
        <div
          style={{
            position: 'absolute',
            left: -60,
            right: -60,
            top: 1080,
            bottom: -60,
            background: 'linear-gradient(#5b3b22, #3b2616 40%, #24170d)',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.6)',
          }}
        />
        {/* cono de luz de la bombilla */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 58%, ${LAMP}66 0%, ${LAMP}22 40%, transparent 75%)`,
            opacity: lamp,
            mixBlendMode: 'screen',
          }}
        />
        <AbsoluteFill style={{background: 'rgba(5,4,3,1)', opacity: 0.55 * (1 - lamp)}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
