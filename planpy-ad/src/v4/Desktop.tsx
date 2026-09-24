import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {SANS} from '../brand';

// El computador de la tienda: monitor viejo sobre el mostrador, entre la mercancía.
// Nunca oficina, nunca laptop flotando. PlanPy corre en el navegador (planpy.io).
export const SCREEN = {left: 70, top: 660, width: 940, height: 600};

export const Desktop: React.FC<{children: React.ReactNode; zoom?: {at: number; to: number; x: number; y: number}}> = ({children, zoom}) => {
  const frame = useCurrentFrame();
  const z = zoom
    ? interpolate(frame, [zoom.at, zoom.at + 22], [1, zoom.to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)})
    : 1;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: zoom ? `${zoom.x}px ${zoom.y}px` : '50% 50%'}}>
      {/* pie y base */}
      <div style={{position: 'absolute', left: 500, top: SCREEN.top + SCREEN.height + 20, width: 80, height: 110, background: 'linear-gradient(90deg,#26282b,#3a3d41,#26282b)'}} />
      <div style={{position: 'absolute', left: 380, top: SCREEN.top + SCREEN.height + 122, width: 320, height: 26, borderRadius: 8, background: '#2b2d30', boxShadow: '0 10px 20px rgba(0,0,0,0.5)'}} />
      {/* teclado y mouse */}
      <div style={{position: 'absolute', left: 170, top: 1470, width: 640, height: 120, borderRadius: 14, background: '#d9d4c9', boxShadow: '0 14px 26px rgba(0,0,0,0.5)', transform: 'perspective(800px) rotateX(35deg)', backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 44px, rgba(0,0,0,0.12) 44px 48px), repeating-linear-gradient(0deg, transparent 0 26px, rgba(0,0,0,0.12) 26px 30px)'}} />
      <div style={{position: 'absolute', left: 850, top: 1475, width: 80, height: 120, borderRadius: 40, background: '#d9d4c9', boxShadow: '0 10px 20px rgba(0,0,0,0.5)'}} />
      {/* monitor */}
      <div style={{position: 'absolute', left: SCREEN.left - 22, top: SCREEN.top - 22, width: SCREEN.width + 44, height: SCREEN.height + 44, borderRadius: 18, background: '#1d1f22', boxShadow: '0 40px 80px rgba(0,0,0,0.65)'}} />
      <div style={{position: 'absolute', ...SCREEN, overflow: 'hidden', background: '#faf8f4', fontFamily: SANS}}>
        <div style={{height: 38, background: '#e8e3da', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px'}}>
          {['#e06c5a', '#e5b54a', '#68b36b'].map((c) => (
            <div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c}} />
          ))}
          <div style={{marginLeft: 16, flex: 1, height: 24, borderRadius: 12, background: '#fff', fontSize: 15, color: '#6b665e', display: 'flex', alignItems: 'center', paddingLeft: 14}}>planpy.io</div>
        </div>
        <div style={{position: 'absolute', top: 38, left: 0, right: 0, bottom: 0}}>{children}</div>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.08), transparent 40%)', pointerEvents: 'none'}} />
      </div>
    </div>
  );
};
