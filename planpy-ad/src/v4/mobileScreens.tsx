import {SANS, UI_LIME} from '../brand';
import {cop} from '../v2/screens';

// El celular es de consulta: ver cómo le fue, cómoda y rápidamente. Datos de ejemplo.
const Frame: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <div style={{position: 'absolute', inset: 0, background: '#faf8f4', fontFamily: SANS, padding: '100px 36px 0'}}>
    <div style={{fontSize: 26, color: '#8a857c', fontWeight: 600}}>Martes 22 de septiembre</div>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30}}>
      <div style={{fontSize: 56, fontWeight: 800, color: '#141414', letterSpacing: -1}}>{title}</div>
      <div style={{fontSize: 20, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '6px 14px'}}>Datos de ejemplo</div>
    </div>
    {children}
  </div>
);

const Card: React.FC<{label: string; value: string; strong?: boolean}> = ({label, value, strong}) => (
  <div style={{borderRadius: 26, padding: '28px 30px', marginBottom: 20, background: strong ? '#171a14' : '#fff', border: strong ? 'none' : '2px solid #eeeae3'}}>
    <div style={{fontSize: 28, fontWeight: 600, color: strong ? '#bbb' : '#8a857c'}}>{label}</div>
    <div style={{fontSize: 60, fontWeight: 800, color: strong ? UI_LIME : '#141414', marginTop: 6}}>{value}</div>
  </div>
);

export const ResumenMobile: React.FC = () => (
  <Frame title="Hoy">
    <Card label="Ventas · 86" value={cop(412750)} />
    <Card label="Ganancia del día" value={cop(73150)} strong />
    <Card label="Caja" value="Cerrada ✓" />
  </Frame>
);

export const StockMobile: React.FC = () => (
  <Frame title="Inventario">
    <div style={{height: 84, borderRadius: 22, border: '3px solid #171a14', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 26px', fontSize: 34, marginBottom: 24}}>aceite</div>
    <Card label="Aceite 1 L" value="3 unidades" strong />
    <Card label="Arroz 500 g" value="43 unidades" />
  </Frame>
);
