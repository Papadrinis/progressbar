import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND_GREEN, PAPER, SANS} from '../brand';
import {Texture} from '../components/Texture';

// Cierre de marca. El logo está en cuadro, así que manda #3DB55C y el CTA NO lleva lima.
// Precio CO (hechos-verificados.md, 2026-09-08): 15 días gratis por delante del precio;
// cuota con plan anual y recurrente mensual en el mismo plano.
export const Cierre: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = (d: number) => spring({frame: frame - d, fps, config: {damping: 200}, durationInFrames: 16});
  const up = (d: number) => ({opacity: at(d), transform: `translateY(${(1 - at(d)) * 30}px)`});
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: PAPER, fontFamily: SANS, color: '#141414', opacity: fadeIn}}>
      <AbsoluteFill style={{padding: '0 90px 260px', justifyContent: 'center'}}>
        <div style={{...up(4)}}>
          <Img src={staticFile('logo-horizontal.png')} style={{width: 560}} />
        </div>
        <div style={{...up(14), marginTop: 90, fontSize: 104, fontWeight: 800, letterSpacing: -3, lineHeight: 1}}>
          15 días gratis.
        </div>
        <div style={{...up(24), marginTop: 50, fontSize: 52, fontWeight: 600, lineHeight: 1.2}}>
          Desde <span style={{fontWeight: 800}}>$46.500 al mes</span>
          <br />
          con el plan anual.
        </div>
        <div style={{...up(30), marginTop: 18, fontSize: 36, color: '#5c574f'}}>Plan mensual: $62.000 al mes.</div>
        <div style={{...up(40), marginTop: 70, fontSize: 38, lineHeight: 1.45, color: '#2b2824'}}>
          Funciona en el celular, sin instalar nada.
          <br />
          Más de 1.000 comercios ya lo usan.
        </div>
        <div
          style={{
            ...up(52),
            marginTop: 90,
            height: 132,
            borderRadius: 30,
            background: '#141414',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 46,
            fontWeight: 800,
          }}
        >
          Pruébelo en <span style={{color: BRAND_GREEN, marginLeft: 14}}>planpy.io</span>
        </div>
      </AbsoluteFill>
      <Texture strength={0.35} />
    </AbsoluteFill>
  );
};
