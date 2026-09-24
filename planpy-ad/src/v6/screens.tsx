import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND_GREEN, PAPER, SANS, UI_LIME} from '../brand';
import {Texture} from '../components/Texture';
import {EMOJI, usePop} from './kit';

// Sustitutos en código con datos de ejemplo. Los chats son "estilo WhatsApp" genéricos: sin logo ni interfaz calcada.
const CHAT_GREEN = '#25a55f';

// Pantalla bloqueada que se llena de mensajes, con contador.
export const NotifStack: React.FC<{msgs: {from: string; text: string}[]; every?: number; start?: number}> = ({msgs, every = 8, start = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shown = msgs.filter((_, i) => frame >= start + i * every).length;
  return (
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(170deg,#3a2b22,#16110d)', fontFamily: `${SANS}, ${EMOJI}`, color: '#fff', padding: '120px 26px 0'}}>
      <div style={{textAlign: 'center', fontSize: 130, fontWeight: 600, letterSpacing: -3}}>3:52</div>
      <div style={{position: 'absolute', top: 70, right: 40, minWidth: 64, height: 64, borderRadius: 32, background: '#ff3b30', fontSize: 34, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', transform: `scale(${1 + 0.15 * Math.max(0, 1 - ((frame - start) % every) / 4)})`}}>
        {shown * 3 + 2}
      </div>
      <div style={{display: 'flex', flexDirection: 'column-reverse', gap: 14, marginTop: 30}}>
        {msgs.map((m, i) => {
          const at = start + i * every;
          if (frame < at) return null;
          const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 240}, durationInFrames: 14});
          return (
            <div key={i} style={{display: 'flex', gap: 16, alignItems: 'center', padding: '20px 22px', borderRadius: 30, background: 'rgba(255,255,255,0.2)', transform: `translateY(${(1 - s) * -80}px) scale(${0.8 + 0.2 * s})`, opacity: s}}>
              <div style={{width: 64, height: 64, borderRadius: 16, background: CHAT_GREEN, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34}}>💬</div>
              <div>
                <div style={{fontSize: 26, fontWeight: 800}}>{m.from}</div>
                <div style={{fontSize: 30}}>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Celular del cliente: le llega el recordatorio de la cita.
export const ReminderScreen: React.FC<{business: string; text: string; at?: number}> = ({business, text, at = 6}) => {
  const s = usePop(at, 11);
  return (
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(170deg,#28435a,#0f1b26)', fontFamily: `${SANS}, ${EMOJI}`, color: '#fff', padding: '140px 26px 0'}}>
      <div style={{textAlign: 'center', fontSize: 28, opacity: 0.8}}>miércoles 25 de septiembre</div>
      <div style={{textAlign: 'center', fontSize: 150, fontWeight: 600, letterSpacing: -4}}>7:30</div>
      <div style={{marginTop: 50, padding: '26px 26px', borderRadius: 34, background: 'rgba(255,255,255,0.95)', color: '#141414', transform: `translateY(${(1 - s) * -120}px) scale(${0.85 + 0.15 * s})`, opacity: s}}>
        <div style={{display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10}}>
          <div style={{width: 54, height: 54, borderRadius: 14, background: CHAT_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28}}>💬</div>
          <div style={{fontSize: 26, fontWeight: 800}}>{business}</div>
          <div style={{marginLeft: 'auto', fontSize: 22, color: '#8a857c'}}>ahora</div>
        </div>
        <div style={{fontSize: 34, lineHeight: 1.25}}>{text}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center', fontSize: 20, color: 'rgba(255,255,255,0.6)'}}>Datos de ejemplo</div>
    </div>
  );
};

// Agenda en el computador: los bloques entran solos, rebotando.
export type Cita = {col: number; row: number; len?: number; t: string; at: number; online?: boolean; color: string};

export const AgendaDesktop: React.FC<{cols: string[]; hours: string[]; citas: Cita[]}> = ({cols, hours, citas}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rowH = 58;
  const top = 96;
  const left = 110;
  const colW = (940 - left - 30) / cols.length;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#faf8f4', fontFamily: `${SANS}, ${EMOJI}`}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 26px'}}>
        <div>
          <div style={{fontSize: 15, color: '#8a857c', fontWeight: 600}}>Jueves 26 de septiembre</div>
          <div style={{fontSize: 30, fontWeight: 800, color: '#141414'}}>Agenda</div>
        </div>
        <div style={{fontSize: 14, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '5px 12px'}}>Datos de ejemplo</div>
      </div>
      {cols.map((c, i) => (
        <div key={c} style={{position: 'absolute', top: top - 30, left: left + i * colW, width: colW, textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#141414'}}>
          {c}
        </div>
      ))}
      {hours.map((h, r) => (
        <div key={h} style={{position: 'absolute', top: top + r * rowH, left: 20, right: 20, height: rowH, borderTop: '2px solid #eeeae3', fontSize: 15, color: '#8a857c', fontWeight: 600, paddingTop: 4}}>
          {h}
        </div>
      ))}
      {citas.map((c, i) => {
        if (frame < c.at) return null;
        const s = spring({frame: frame - c.at, fps, config: {damping: 10, stiffness: 240, mass: 0.6}, durationInFrames: 16});
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: left + c.col * colW + 6,
              top: top + c.row * rowH + 4,
              width: colW - 12,
              height: (c.len ?? 1) * rowH - 8,
              borderRadius: 12,
              background: c.color,
              padding: '6px 12px',
              boxSizing: 'border-box',
              transform: `translateY(${(1 - s) * -90}px) scale(${0.7 + 0.3 * s})`,
              opacity: Math.min(1, s * 1.5),
              boxShadow: c.online ? `0 0 0 3px ${UI_LIME}` : 'none',
            }}
          >
            <div style={{fontSize: 17, fontWeight: 800, color: '#141414'}}>{c.t}</div>
            {c.online ? <div style={{fontSize: 12, fontWeight: 800, color: '#10240f', background: UI_LIME, display: 'inline-block', borderRadius: 999, padding: '1px 8px', marginTop: 2}}>Reserva en línea</div> : null}
          </div>
        );
      })}
    </div>
  );
};

// Cierre de marca: SIEMPRE el precio más barato ("desde"), por decisión del dueño de marca.
export const CierreDesde: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const up = (d: number) => {
    const s = spring({frame: frame - d, fps, config: {damping: 11, stiffness: 200}, durationInFrames: 16});
    return {opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + 0.1 * s})`};
  };
  return (
    <div style={{position: 'absolute', inset: 0, background: PAPER, fontFamily: `${SANS}, ${EMOJI}`, color: '#141414', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 90px 260px'}}>
      <div style={up(2)}>
        <Img src={staticFile('logo-horizontal.png')} style={{width: 520}} />
      </div>
      <div style={{...up(10), marginTop: 80, fontSize: 108, fontWeight: 800, letterSpacing: -3, lineHeight: 1}}>15 días gratis.</div>
      <div style={{...up(20), marginTop: 50, fontSize: 52, fontWeight: 600, lineHeight: 1.2}}>
        Desde <b>$46.500 al mes</b>
        <br />
        con el plan anual.
      </div>
      <div style={{...up(26), marginTop: 14, fontSize: 34, color: '#5c574f'}}>Plan mensual: desde $62.000 al mes.</div>
      <div style={{...up(32), marginTop: 50, fontSize: 36, color: '#2b2824'}}>En computador y celular, sin instalar nada.</div>
      <div style={{...up(40), marginTop: 70, height: 130, borderRadius: 30, background: '#141414', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 800}}>
        Pruébelo en <span style={{color: BRAND_GREEN, marginLeft: 14}}>planpy.io</span>
      </div>
      <Texture strength={0.3} />
    </div>
  );
};

export const fade = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
