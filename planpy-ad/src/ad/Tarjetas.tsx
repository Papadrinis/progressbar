import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS, UI_LIME} from '../brand';
import {EMOJI} from '../v6/kit';

// Interfaz de PlanPy dibujada por nosotros (el modelo de video nunca genera pantallas).
// Siempre con "Datos de ejemplo" y montos en COP.

const usePop = (at: number, damping = 12) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping, stiffness: 200}, durationInFrames: 16});
};

const MENU = ['Ventas', 'Inventario', 'Clientes', 'Caja', 'Reportes'];

export const Tarjeta: React.FC<{
  at: number;
  formato: 'computador' | 'celular';
  titulo: string;
  seccion: string;
  menu?: string[];
  filas: [string, string][];
  resaltar?: number;
  listo?: string;
}> = ({at, formato, titulo, seccion, menu = MENU, filas, resaltar, listo}) => {
  const frame = useCurrentFrame();
  const s = usePop(at, formato === 'celular' ? 12 : 13);
  if (frame < at) return null;
  const phone = formato === 'celular';
  const rowEls = filas.map(([a, b], i) => {
    const rs = interpolate(frame, [at + 10 + i * 6, at + 18 + i * 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const strong = i === resaltar;
    return (
      <div
        key={`${a}-${i}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: phone ? '14px 16px' : '12px 18px',
          margin: phone ? '0 0 10px' : 0,
          borderBottom: phone ? 'none' : '2px solid #eeeae3',
          borderRadius: phone ? 18 : strong ? 10 : 0,
          fontSize: phone ? 26 : 22,
          opacity: rs,
          transform: phone ? undefined : `translateX(${(1 - rs) * 20}px)`,
          background: strong ? (phone ? '#171a14' : 'rgba(159,232,112,0.35)') : phone ? '#fff' : 'transparent',
          color: strong && phone ? '#fff' : '#141414',
          border: phone && !strong ? '2px solid #eeeae3' : undefined,
        }}
      >
        <span style={{fontWeight: 600}}>{a}</span>
        <span style={{fontWeight: 800, color: strong && phone ? UI_LIME : undefined}}>{b}</span>
      </div>
    );
  });
  if (phone) {
    return (
      <div style={{position: 'absolute', left: 250, top: 1000, width: 580, height: 780, borderRadius: 60, background: '#111', padding: 12, transform: `translateY(${(1 - s) * 500}px) rotate(${-4 + (1 - s) * 8}deg)`, boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
        <div style={{width: '100%', height: '100%', borderRadius: 50, background: '#faf8f4', fontFamily: `${SANS}, ${EMOJI}`, padding: '60px 24px', boxSizing: 'border-box', color: '#141414'}}>
          <div style={{fontSize: 22, color: '#8a857c', fontWeight: 600}}>{seccion}</div>
          <div style={{fontSize: 36, fontWeight: 800, marginBottom: 18}}>{titulo}</div>
          {rowEls}
          {listo ? <div style={{marginTop: 8, borderRadius: 18, padding: '14px 16px', background: '#171a14', color: UI_LIME, fontSize: 26, fontWeight: 800, textAlign: 'center'}}>{listo}</div> : null}
          <div style={{fontSize: 16, color: '#8a857c', textAlign: 'center', marginTop: 8}}>Datos de ejemplo</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', left: 60, top: 1080, width: 960, transform: `scale(${0.96 * s}) rotate(${(1 - s) * -5}deg)`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.55)', border: '10px solid #1d1f22', background: '#faf8f4', fontFamily: SANS, color: '#141414'}}>
      <div style={{height: 34, background: '#e8e3da', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px'}}>
        {['#e06c5a', '#e5b54a', '#68b36b'].map((c) => (
          <div key={c} style={{width: 11, height: 11, borderRadius: 6, background: c}} />
        ))}
        <div style={{marginLeft: 14, flex: 1, height: 22, borderRadius: 11, background: '#fff', fontSize: 14, color: '#6b665e', display: 'flex', alignItems: 'center', paddingLeft: 12}}>planpy.io</div>
      </div>
      <div style={{display: 'flex'}}>
        <div style={{width: 170, background: '#171a14', padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 6}}>
          {menu.map((m) => (
            <div key={m} style={{fontSize: 17, fontWeight: 600, padding: '8px 12px', borderRadius: 10, color: m === seccion ? '#10240f' : '#c9c6bf', background: m === seccion ? UI_LIME : 'transparent'}}>
              {m}
            </div>
          ))}
        </div>
        <div style={{flex: 1, padding: '16px 20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <div style={{fontSize: 28, fontWeight: 800}}>{titulo}</div>
            <div style={{fontSize: 13, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '4px 10px'}}>Datos de ejemplo</div>
          </div>
          {rowEls}
        </div>
      </div>
    </div>
  );
};

// Llamada entrante, sobre el celular real de la toma.
export const Llamada: React.FC<{nombre: string; hora?: string; icono?: string; at?: number}> = ({nombre, hora = '9:07 p. m.', icono = '📞', at = 4}) => {
  const frame = useCurrentFrame();
  const s = usePop(at);
  if (frame < at) return null;
  const pulse = 1 + 0.06 * Math.sin((frame - at) / 3);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1260, padding: '26px 28px', borderRadius: 40, background: 'rgba(20,20,22,0.92)', color: '#fff', fontFamily: `${SANS}, ${EMOJI}`, display: 'flex', alignItems: 'center', gap: 22, transform: `translateY(${(1 - s) * 200}px)`, opacity: s, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
      <div style={{width: 84, height: 84, borderRadius: 42, background: '#5b8def', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>{icono}</div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 24, color: '#aaa'}}>Llamada entrante · {hora}</div>
        <div style={{fontSize: 40, fontWeight: 800}}>{nombre}</div>
      </div>
      <div style={{width: 80, height: 80, borderRadius: 40, background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36}}>✕</div>
      <div style={{width: 80, height: 80, borderRadius: 40, background: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, transform: `scale(${pulse})`}}>📞</div>
    </div>
  );
};
