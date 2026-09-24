import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS, UI_LIME} from '../brand';

// Pantallas sustitutas con datos de ejemplo (tienda de barrio, pesos colombianos, números feos).
// Para pauta se reemplazan por grabaciones reales de la cuenta demo.
export const cop = (n: number) => '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.');

const useIn = (start: number, dur = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - start, fps, config: {damping: 200}, durationInFrames: dur});
};

const Tag: React.FC = () => (
  <div style={{fontSize: 19, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '6px 14px'}}>Datos de ejemplo</div>
);

const ActionButton: React.FC<{label: string; doneLabel: string; at: number}> = ({label, doneLabel, at}) => {
  const frame = useCurrentFrame();
  const done = frame >= at;
  const tick = useIn(at, 16);
  return (
    <div
      style={{
        height: 104,
        borderRadius: 26,
        background: done ? '#171a14' : UI_LIME,
        color: done ? UI_LIME : '#10240f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        fontSize: 34,
        fontWeight: 800,
        transform: `scale(${frame >= at - 6 && frame < at ? 0.96 : 1})`,
      }}
    >
      {done ? (
        <>
          <svg width="40" height="40" viewBox="0 0 24 24" style={{transform: `scale(${tick})`}}>
            <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={UI_LIME} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {doneLabel}
        </>
      ) : (
        label
      )}
    </div>
  );
};

// --- Cierre del día -------------------------------------------------------
const Row: React.FC<{label: string; value: number; sub?: string; sign?: string; start: number; strong?: boolean}> = ({label, value, sub, sign = '', start, strong}) => {
  const frame = useCurrentFrame();
  const s = useIn(start);
  const count = interpolate(frame, [start, start + 18], [0, value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: strong ? '26px 24px' : '22px 4px',
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
        <div style={{fontSize: 30, fontWeight: 600}}>{label}</div>
        {sub ? <div style={{fontSize: 22, color: strong ? '#bbb' : '#8a857c', marginTop: 4}}>{sub}</div> : null}
      </div>
      <div style={{fontSize: strong ? 48 : 34, fontWeight: 800, color: strong ? UI_LIME : undefined, fontVariantNumeric: 'tabular-nums'}}>
        {sign}
        {cop(count)}
      </div>
    </div>
  );
};

export const CierreScreen: React.FC<{rowsStart: number; closedAt: number}> = ({rowsStart, closedAt}) => (
  <div style={{position: 'absolute', inset: 0, background: '#faf8f4', fontFamily: SANS, padding: '90px 34px 0'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div>
        <div style={{fontSize: 24, color: '#8a857c', fontWeight: 600}}>Martes 22 de septiembre</div>
        <div style={{fontSize: 46, fontWeight: 800, color: '#141414', letterSpacing: -1}}>Cierre del día</div>
      </div>
      <Tag />
    </div>
    <div style={{marginTop: 30}}>
      <Row label="Ventas" sub="86 ventas" value={412750} start={rowsStart} />
      <Row label="Costo de mercancía" value={318200} sign="−" start={rowsStart + 12} />
      <Row label="Gastos" sub="Gas" value={21400} sign="−" start={rowsStart + 24} />
      <Row label="Ganancia del día" value={73150} start={rowsStart + 44} strong />
    </div>
    <div style={{marginTop: 40}}>
      <ActionButton label="Cerrar caja" doneLabel="Caja cerrada" at={closedAt} />
    </div>
  </div>
);

// --- Nueva venta ------------------------------------------------------------
const PRODUCTS = [
  {n: 'Arroz 500 g', p: 2900},
  {n: 'Leche 1 L', p: 4350},
  {n: 'Huevos x 6', p: 5700},
  {n: 'Panela', p: 3200},
  {n: 'Gaseosa 400 ml', p: 2500},
  {n: 'Jabón en barra', p: 3400},
];

// taps: [índice de producto, frame] en orden; cobrarAt registra la venta.
export const VentaScreen: React.FC<{taps: [number, number][]; cobrarAt: number}> = ({taps, cobrarAt}) => {
  const frame = useCurrentFrame();
  const done = taps.filter(([, t]) => frame >= t);
  const total = done.reduce((a, [i]) => a + PRODUCTS[i].p, 0);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#faf8f4', fontFamily: SANS, padding: '90px 34px 0'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: 46, fontWeight: 800, color: '#141414', letterSpacing: -1}}>Nueva venta</div>
        <Tag />
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 30}}>
        {PRODUCTS.map((p, i) => {
          const picked = done.some(([j]) => j === i);
          return (
            <div
              key={p.n}
              style={{
                height: 170,
                borderRadius: 24,
                background: '#fff',
                border: picked ? `4px solid #171a14` : '4px solid #eeeae3',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div style={{fontSize: 28, fontWeight: 600, color: '#1b1b1b'}}>{p.n}</div>
              <div style={{fontSize: 30, fontWeight: 800}}>{cop(p.p)}</div>
              {picked ? (
                <div style={{position: 'absolute', top: 14, right: 14, width: 44, height: 44, borderRadius: 22, background: UI_LIME, color: '#10240f', fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>1</div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', margin: '34px 6px 22px', fontSize: 30, color: '#1b1b1b'}}>
        <span>{done.length} productos</span>
        <span style={{fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{cop(total)}</span>
      </div>
      <ActionButton label={`Cobrar ${cop(total)}`} doneLabel="Venta registrada" at={cobrarAt} />
    </div>
  );
};

// --- Pantalla bloqueada con el mensaje de la hija ---------------------------
export const LockScreen: React.FC<{notifAt: number}> = ({notifAt}) => {
  const s = useIn(notifAt, 16);
  return (
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(170deg,#3a2b22,#16110d)', fontFamily: SANS, color: '#fff', textAlign: 'center', paddingTop: 150}}>
      <div style={{fontSize: 30, opacity: 0.8}}>martes 22 de septiembre</div>
      <div style={{fontSize: 170, fontWeight: 600, letterSpacing: -4, lineHeight: 1.1}}>10:52</div>
      <div
        style={{
          margin: '60px 30px 0',
          padding: '26px 28px',
          borderRadius: 34,
          background: 'rgba(255,255,255,0.18)',
          textAlign: 'left',
          display: 'flex',
          gap: 22,
          alignItems: 'center',
          opacity: s,
          transform: `translateY(${(1 - s) * -60}px)`,
        }}
      >
        <div style={{width: 72, height: 72, borderRadius: 18, background: '#5b8def', flexShrink: 0}} />
        <div>
          <div style={{fontSize: 30, fontWeight: 800}}>Valentina 💛</div>
          <div style={{fontSize: 32, marginTop: 4}}>Pa, ¿ya viene a comer?</div>
        </div>
      </div>
    </div>
  );
};

// --- Chat: la respuesta del después ------------------------------------------
export const ChatScreen: React.FC<{replyAt: number}> = ({replyAt}) => {
  const frame = useCurrentFrame();
  const s = useIn(replyAt, 12);
  const typed = 'Ya voy'.slice(0, Math.floor(interpolate(frame, [replyAt - 22, replyAt - 8], [0, 6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
  const bubble = (mine: boolean): React.CSSProperties => ({
    alignSelf: mine ? 'flex-end' : 'flex-start',
    background: mine ? '#d9f7c2' : '#fff',
    color: '#141414',
    fontSize: 36,
    padding: '22px 28px',
    borderRadius: 30,
    maxWidth: '78%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  });
  return (
    <div style={{position: 'absolute', inset: 0, background: '#efe9e0', fontFamily: SANS, display: 'flex', flexDirection: 'column'}}>
      <div style={{padding: '90px 34px 24px', background: '#faf8f4', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '2px solid #e4ddd2'}}>
        <div style={{width: 76, height: 76, borderRadius: 38, background: '#5b8def'}} />
        <div style={{fontSize: 38, fontWeight: 800}}>Valentina 💛</div>
      </div>
      <div style={{flex: 1, padding: 34, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'flex-end'}}>
        <div style={bubble(false)}>Pa, ¿ya viene a comer?</div>
        {frame >= replyAt ? <div style={{...bubble(true), opacity: s, transform: `scale(${0.8 + 0.2 * s})`, transformOrigin: 'right bottom'}}>Ya voy 👍</div> : null}
      </div>
      <div style={{margin: '0 24px 60px', height: 96, borderRadius: 48, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 34px', fontSize: 34, color: frame >= replyAt ? '#aaa' : '#141414'}}>
        {frame >= replyAt ? 'Mensaje' : typed || 'Mensaje'}
      </div>
    </div>
  );
};
