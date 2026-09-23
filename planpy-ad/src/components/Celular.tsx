import {interpolate, spring, useCurrentFrame, useVideoConfig, OffthreadVideo, staticFile} from 'remotion';
import {SANS, UI_LIME} from '../brand';

// El producto siempre en un celular, en la mano, en la tienda.
// La pantalla de abajo es un SUSTITUTO en código con datos de ejemplo.
// Para salir a pauta se reemplaza por una grabación real de la cuenta demo (`productFootage`).
const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.');

const Row: React.FC<{label: string; value: number; sub?: string; sign?: string; start: number; strong?: boolean}> = ({
  label,
  value,
  sub,
  sign = '',
  start,
  strong,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 200}, durationInFrames: 14});
  const count = interpolate(frame, [start, start + 18], [0, value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: strong ? '26px 24px' : '20px 4px',
        borderBottom: strong ? 'none' : '2px solid #eeeae3',
        background: strong ? '#171a14' : 'transparent',
        color: strong ? '#fff' : '#1b1b1b',
        borderRadius: strong ? 22 : 0,
        marginTop: strong ? 18 : 0,
        opacity: s,
        transform: `translateY(${(1 - s) * 16}px)`,
      }}
    >
      <div>
        <div style={{fontSize: strong ? 30 : 29, fontWeight: 600}}>{label}</div>
        {sub ? <div style={{fontSize: 22, color: strong ? '#bbb' : '#8a857c', marginTop: 4}}>{sub}</div> : null}
      </div>
      <div style={{fontSize: strong ? 48 : 34, fontWeight: 800, color: strong ? UI_LIME : undefined, fontVariantNumeric: 'tabular-nums'}}>
        {sign}
        {fmt(count)}
      </div>
    </div>
  );
};

const Pantalla: React.FC<{closedAt: number}> = ({closedAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tap = spring({frame: frame - closedAt, fps, config: {damping: 14}, durationInFrames: 16});
  const pressed = frame >= closedAt - 6 && frame < closedAt;
  const closed = frame >= closedAt;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#faf8f4', fontFamily: SANS, padding: '90px 34px 0'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div style={{fontSize: 24, color: '#8a857c', fontWeight: 600}}>Martes 22 de septiembre</div>
          <div style={{fontSize: 46, fontWeight: 800, color: '#141414', letterSpacing: -1}}>Cierre del día</div>
        </div>
        <div style={{fontSize: 19, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '6px 14px'}}>
          Datos de ejemplo
        </div>
      </div>
      <div style={{marginTop: 26}}>
        <Row label="Ventas" sub="86 ventas" value={412750} start={20} />
        <Row label="Costo de mercancía" value={318200} sign="−" start={32} />
        <Row label="Gastos" sub="Gas" value={21400} sign="−" start={44} />
        <Row label="Fiados pendientes" sub="4 clientes" value={58900} start={56} />
        <Row label="Ganancia del día" value={73150} start={84} strong />
      </div>
      <div
        style={{
          marginTop: 34,
          height: 104,
          borderRadius: 26,
          background: closed ? '#171a14' : UI_LIME,
          color: closed ? UI_LIME : '#10240f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          fontSize: 34,
          fontWeight: 800,
          transform: `scale(${pressed ? 0.96 : 1})`,
        }}
      >
        {closed ? (
          <>
            <svg width="40" height="40" viewBox="0 0 24 24" style={{transform: `scale(${tap})`}}>
              <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={UI_LIME} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Caja cerrada
          </>
        ) : (
          'Cerrar caja'
        )}
      </div>
    </div>
  );
};

export const Celular: React.FC<{enter: number; closedAt: number; exitAt: number; footage?: string | null}> = ({enter, closedAt, exitAt, footage}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - enter, fps, config: {damping: 18, mass: 0.9}, durationInFrames: 30});
  const out = spring({frame: frame - exitAt, fps, config: {damping: 200}, durationInFrames: 24});
  const y = interpolate(s, [0, 1], [1500, 0]) + out * 1600;
  const tilt = interpolate(s, [0, 1], [9, -3]);
  // pulgar que entra a tocar "Cerrar caja"
  const thumb = interpolate(frame, [closedAt - 22, closedAt - 6, closedAt + 8, closedAt + 26], [260, 0, 0, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', left: 190, top: 560, width: 700, height: 1440, transform: `translateY(${y}px) rotate(${tilt}deg)`}}>
      {/* funda gastada */}
      <div style={{position: 'absolute', inset: -14, borderRadius: 96, background: 'linear-gradient(160deg,#3b3f45,#1d1f22 60%)', boxShadow: '0 50px 90px rgba(0,0,0,0.7)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 84, background: '#050505', padding: 16}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 70, overflow: 'hidden'}}>
          {footage ? (
            <OffthreadVideo src={staticFile(footage)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <Pantalla closedAt={closedAt} />
          )}
          <div style={{position: 'absolute', top: 22, left: '50%', width: 150, height: 40, marginLeft: -75, borderRadius: 20, background: '#050505'}} />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.10), transparent 35%)'}} />
        </div>
      </div>
      {!footage ? (
        <div
          style={{
            position: 'absolute',
            left: 330,
            top: 1110,
            width: 190,
            height: 330,
            borderRadius: '95px 95px 60px 60px',
            background: 'linear-gradient(170deg,#b27c5c,#8a5a3e)',
            transform: `translate(${thumb * 0.4}px, ${thumb}px) rotate(-18deg)`,
            boxShadow: '0 -6px 24px rgba(0,0,0,0.35)',
          }}
        />
      ) : null}
    </div>
  );
};
