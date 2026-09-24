import {interpolate, useCurrentFrame} from 'remotion';
import {UI_LIME} from '../brand';
import {cop} from '../v2/screens';
import {Cursor} from './Cursor';

// Pantallas de escritorio: SUSTITUTOS en código con datos de ejemplo (tienda de barrio, COP).
// Para pauta se reemplazan por grabaciones reales de la cuenta demo.
// Coordenadas dentro del área de la app (940 × 562, debajo de la barra del navegador).

const MODULES = ['Ventas', 'Caja', 'Inventario', 'Clientes', 'Proveedores', 'Reportes'];

const Shell: React.FC<{active: string; title: string; action?: React.ReactNode; children: React.ReactNode}> = ({active, title, action, children}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex'}}>
    <div style={{width: 176, background: '#171a14', padding: '26px 14px', display: 'flex', flexDirection: 'column', gap: 6}}>
      {MODULES.map((m) => (
        <div key={m} style={{fontSize: 18, fontWeight: 600, padding: '10px 14px', borderRadius: 10, color: m === active ? '#10240f' : '#c9c6bf', background: m === active ? UI_LIME : 'transparent'}}>
          {m}
        </div>
      ))}
    </div>
    <div style={{flex: 1, padding: '24px 28px', position: 'relative'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18}}>
        <div>
          <div style={{fontSize: 15, color: '#8a857c', fontWeight: 600}}>Martes 22 de septiembre</div>
          <div style={{fontSize: 32, fontWeight: 800, color: '#141414', letterSpacing: -0.5}}>{title}</div>
        </div>
        <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '5px 12px'}}>Datos de ejemplo</div>
          {action}
        </div>
      </div>
      {children}
    </div>
  </div>
);

const Done: React.FC<{label: string}> = ({label}) => (
  <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={UI_LIME} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {label}
  </span>
);

// --- Cierre del día -----------------------------------------------------------
export const CierreDesktop: React.FC<{clickAt: number}> = ({clickAt}) => {
  const frame = useCurrentFrame();
  const closed = frame >= clickAt;
  const card = (label: string, value: string, strong?: boolean) => (
    <div style={{flex: 1, borderRadius: 16, padding: '16px 18px', background: strong ? '#171a14' : '#fff', border: strong ? 'none' : '2px solid #eeeae3'}}>
      <div style={{fontSize: 16, fontWeight: 600, color: strong ? '#bbb' : '#8a857c'}}>{label}</div>
      <div style={{fontSize: 34, fontWeight: 800, marginTop: 6, color: strong ? UI_LIME : '#141414', fontVariantNumeric: 'tabular-nums'}}>{value}</div>
    </div>
  );
  return (
    <>
      <Shell active="Caja" title="Cierre del día">
        <div style={{display: 'flex', gap: 14}}>
          {card('Ventas · 86', cop(412750))}
          {card('Costo de mercancía', '−' + cop(318200))}
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 14}}>
          {card('Gastos', '−' + cop(21400))}
          {card('Ganancia del día', cop(73150), true)}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 28,
            bottom: 34,
            width: 330,
            height: 70,
            borderRadius: 18,
            background: closed ? '#171a14' : UI_LIME,
            color: closed ? UI_LIME : '#10240f',
            fontSize: 24,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {closed ? <Done label="Caja cerrada" /> : 'Cerrar caja'}
        </div>
      </Shell>
      <Cursor path={[{f: 0, x: 420, y: 250}, {f: 30, x: 420, y: 250}, {f: clickAt - 10, x: 700, y: 490}]} clicks={[clickAt]} />
    </>
  );
};

// --- Movimientos: cada venta y cada gasto, registrados -----------------------------
const MOVS = [
  {h: '8:14 a. m.', c: 'Venta · 5 productos', v: 23700},
  {h: '9:02 a. m.', c: 'Pago a proveedor', v: -96000},
  {h: '10:41 a. m.', c: 'Venta · 3 productos', v: 13250},
  {h: '11:05 a. m.', c: 'Gasto · Gas', v: -21400},
];

export const MovimientosDesktop: React.FC<{clickAt: number}> = ({clickAt}) => {
  const frame = useCurrentFrame();
  const inRow = interpolate(frame, [clickAt, clickAt + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = interpolate(frame, [clickAt + 10, clickAt + 60], [1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const row = (m: {h: string; c: string; v: number}, highlight = 0) => (
    <div
      key={m.h}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '15px 16px',
        borderBottom: '2px solid #eeeae3',
        fontSize: 21,
        background: highlight ? `rgba(159,232,112,${0.55 * highlight})` : 'transparent',
        borderRadius: highlight ? 12 : 0,
      }}
    >
      <div style={{width: 150, color: '#8a857c', fontWeight: 600}}>{m.h}</div>
      <div style={{flex: 1, fontWeight: 600, color: '#1b1b1b'}}>{m.c}</div>
      <div style={{fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{(m.v < 0 ? '−' : '') + cop(Math.abs(m.v))}</div>
    </div>
  );
  return (
    <>
      <Shell
        active="Caja"
        title="Movimientos de hoy"
        action={<div style={{fontSize: 17, fontWeight: 800, background: frame >= clickAt ? '#171a14' : UI_LIME, color: frame >= clickAt ? UI_LIME : '#10240f', borderRadius: 12, padding: '10px 16px'}}>{frame >= clickAt ? <Done label="Guardado" /> : '+ Guardar gasto'}</div>}
      >
        {MOVS.map((m) => row(m))}
        {frame >= clickAt ? (
          <div style={{opacity: inRow, transform: `translateY(${(1 - inRow) * 16}px)`}}>{row({h: '11:32 a. m.', c: 'Gasto · Bolsas', v: -6800}, glow)}</div>
        ) : null}
      </Shell>
      <Cursor path={[{f: 0, x: 400, y: 330}, {f: 30, x: 400, y: 330}, {f: clickAt - 10, x: 810, y: 64}]} clicks={[clickAt]} />
    </>
  );
};

// --- Inventario: lo busca y sabe cuánto le queda ---------------------------------
const STOCK = [
  {n: 'Arroz 500 g', q: 43},
  {n: 'Leche 1 L', q: 18},
  {n: 'Huevos x 30', q: 7},
  {n: 'Panela', q: 26},
  {n: 'Aceite 1 L', q: 3},
  {n: 'Gaseosa 400 ml', q: 31},
];

export const InventarioDesktop: React.FC<{typeAt: number}> = ({typeAt}) => {
  const frame = useCurrentFrame();
  const q = 'aceite'.slice(0, Math.floor(interpolate(frame, [typeAt, typeAt + 24], [0, 6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
  const filtered = q.length === 6;
  const list = filtered ? STOCK.filter((s) => s.n.startsWith('Aceite')) : STOCK;
  return (
    <>
      <Shell active="Inventario" title="Inventario">
        <div style={{height: 54, borderRadius: 14, border: `3px solid ${frame >= typeAt - 4 ? '#171a14' : '#e4ddd2'}`, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 22, color: q ? '#141414' : '#aaa', marginBottom: 10}}>
          {q || 'Buscar producto…'}
          {frame >= typeAt - 4 && !filtered && frame % 20 < 10 ? <span style={{width: 2, height: 26, background: '#141414', marginLeft: 2}} /> : null}
        </div>
        {list.map((s) => (
          <div
            key={s.n}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: filtered ? '22px 20px' : '10px 16px',
              borderBottom: '2px solid #eeeae3',
              fontSize: filtered ? 30 : 20,
              fontWeight: 600,
              background: filtered ? 'rgba(159,232,112,0.35)' : 'transparent',
              borderRadius: filtered ? 14 : 0,
            }}
          >
            <span>{s.n}</span>
            <span style={{fontWeight: 800}}>{s.q} unidades</span>
          </div>
        ))}
      </Shell>
      <Cursor path={[{f: 0, x: 500, y: 330}, {f: typeAt - 16, x: 420, y: 118}]} clicks={[typeAt - 8]} />
    </>
  );
};
