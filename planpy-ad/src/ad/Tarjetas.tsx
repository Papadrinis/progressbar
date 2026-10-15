import {Zona} from './zonas';
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
  zona: Zona;
  y?: number;
  compacta?: boolean;
}> = ({at, formato, titulo, seccion, menu = MENU, filas, resaltar, listo, zona, y, compacta}) => {
  const frame = useCurrentFrame();
  const s = usePop(at, formato === 'celular' ? 12 : 13);
  if (frame < at) return null;
  const phone = formato === 'celular';
  // Celular: notificación ancha en la parte alta de la zona protegida. Se lee a tamaño de teléfono y no
  // tapa la boca del que habla (la directiva prohíbe achicar la interfaz hasta volverla ilegible).
  if (phone) {
    const fila = resaltar !== undefined ? filas[resaltar] : filas[filas.length - 1];
    const resto = filas.filter((f) => f !== fila).map(([a, b]) => `${a}: ${b}`).join(' · ');
    if (compacta) {
      // Dos líneas: lo esencial de la reserva, para tomas cerradas donde la completa taparía la cara.
      return (
        <div style={{position: 'absolute', left: zona.izq, width: zona.der - zona.izq, top: y ?? zona.arriba + 8, height: 146, boxSizing: 'border-box', borderRadius: 30, background: 'rgba(250,248,244,0.97)', color: '#141414', fontFamily: `${SANS}, ${EMOJI}`, padding: '16px 24px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', transform: `translateY(${(1 - s) * 60}px)`, opacity: Math.min(1, s * 1.4), display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 64, height: 64, flex: 'none', borderRadius: 16, background: '#171a14', color: UI_LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900}}>P</div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 36, fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
              {titulo}
              {fila ? <span style={{color: '#2f8a43'}}> · {fila[1]}</span> : null}
            </div>
            <div style={{fontSize: 26, fontWeight: 600, color: '#3a3631', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{listo ?? resto}</div>
            <div style={{fontSize: 16, color: '#8a857c', marginTop: 2}}>Datos de ejemplo</div>
          </div>
        </div>
      );
    }
    return (
      <div style={{position: 'absolute', left: zona.izq, width: zona.der - zona.izq, top: y ?? zona.arriba + 8, borderRadius: 34, background: 'rgba(250,248,244,0.97)', color: '#141414', fontFamily: `${SANS}, ${EMOJI}`, padding: '20px 26px 18px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', transform: `translateY(${(1 - s) * -140}px)`, opacity: Math.min(1, s * 1.4)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, color: '#6b665e', fontWeight: 700}}>
          <div style={{width: 34, height: 34, borderRadius: 9, background: '#171a14', color: UI_LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900}}>P</div>
          PlanPy · {seccion}
          <span style={{marginLeft: 'auto', fontSize: 20, fontWeight: 600}}>Datos de ejemplo</span>
        </div>
        <div style={{fontSize: 38, fontWeight: 800, marginTop: 10, lineHeight: 1.15}}>
          {titulo}
          {fila ? <span style={{color: '#2f8a43'}}> · {fila[1]}</span> : null}
        </div>
        {resto ? <div style={{fontSize: 28, fontWeight: 600, marginTop: 4, color: '#3a3631', lineHeight: 1.2}}>{resto}</div> : null}
        {listo ? <div style={{marginTop: 12, borderRadius: 16, padding: '10px 16px', background: '#171a14', color: UI_LIME, fontSize: 28, fontWeight: 800, textAlign: 'center'}}>{listo}</div> : null}
      </div>
    );
  }
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
  return (
    // Computador: ancho de la zona, arriba de ella. Tapa la cara: usar en tomas de apoyo, no a cámara.
    <div style={{position: 'absolute', left: zona.izq, top: y ?? zona.arriba + 10, width: 960, transformOrigin: 'top left', transform: `scale(${((zona.der - zona.izq) / 960) * s}) rotate(${(1 - s) * -5}deg)`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.55)', border: '10px solid #1d1f22', background: '#faf8f4', fontFamily: SANS, color: '#141414'}}>
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
export const Llamada: React.FC<{nombre: string; hora?: string; icono?: string; at?: number; zona: Zona; y?: number}> = ({nombre, hora = '9:07 p. m.', icono = '📞', at = 4, zona, y}) => {
  const frame = useCurrentFrame();
  const s = usePop(at);
  if (frame < at) return null;
  const pulse = 1 + 0.06 * Math.sin((frame - at) / 3);
  return (
    <div style={{position: 'absolute', left: zona.izq, width: zona.der - zona.izq, boxSizing: 'border-box', top: y ?? zona.arriba + 8, padding: '26px 28px', borderRadius: 40, background: 'rgba(20,20,22,0.92)', color: '#fff', fontFamily: `${SANS}, ${EMOJI}`, display: 'flex', alignItems: 'center', gap: 22, transform: `translateY(${(1 - s) * -200}px)`, opacity: s, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
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
