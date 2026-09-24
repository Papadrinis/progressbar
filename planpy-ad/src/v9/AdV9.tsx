import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND_GREEN, SANS, UI_LIME} from '../brand';
import {Texture} from '../components/Texture';
import {EMOJI, Sticker, Whip, WordPop} from '../v6/kit';
import {CierreDesde} from '../v6/screens';

// PLANPY_CO_VIDA_PROVEEDORES_V9_{C|A} — el proveedor llama en la noche / en la cena.
// Tomas realistas (GPT Image 2.5 → Seedance 2.5, 1080p). Gestión en el computador de la tienda;
// de noche, la respuesta se consulta en el celular. CTA siempre con el precio más barato.
export const FPS_V9 = 30;
const RATE = 1.08;

type Version = 'C' | 'A' | 'RA' | 'RE';
type Beat = {clip: string; d: number; shot: number | null; lines: string[]; keys: string[]; tail?: number; overlay?: string; still?: boolean};

const BEATS: Record<Version, Beat[]> = {
  C: [
    {clip: 'c-h', d: 6.348, shot: 1, lines: ['Si el proveedor lo llama', 'a las 9 de la noche', 'y tiene que ir a la tienda', 'a revisar…'], keys: ['proveedor', '9'], overlay: 'call-gaseosas', tail: 10},
    {clip: 'c-p', d: 1.959, shot: 2, lines: ['Su negocio', 'le quita las noches.'], keys: ['noches'], overlay: 'clock', tail: 8},
    {clip: 'c-a', d: 1.881, shot: 3, lines: ['Y a su familia,', 'la cena.'], keys: ['cena'], overlay: 'empty', tail: 10},
    {clip: 'c-s1', d: 4.833, shot: 4, lines: ['Con PlanPy, de día lleva', 'inventario, proveedores', 'y pedidos en el computador.'], keys: ['inventario', 'proveedores', 'pedidos'], overlay: 'desktop'},
    {clip: 'c-s2', d: 2.691, shot: 5, lines: ['De noche, la respuesta', 'está en su bolsillo.'], keys: ['bolsillo'], overlay: 'consulta', tail: 12},
    {clip: 'c-d', d: 3.239, shot: 6, lines: ['Que el negocio le dé una vida.', 'No que se la quite.'], keys: ['vida'], tail: 16},
    {clip: 'cta', d: 3.474, shot: null, lines: [], keys: [], tail: 50},
  ],
  A: [
    {clip: 'a-h', d: 5.564, shot: 20, lines: ['Son las 9 de la noche.', 'Está comiendo con su familia…', 'y suena el proveedor.'], keys: ['familia', 'proveedor'], overlay: 'call-lacteos', tail: 8},
    {clip: 'a-prov', d: 5.721, shot: 7, lines: ['—¿Cuántas canastas de leche', 'le dejo mañana?', '¿Y lo que me debe?'], keys: ['canastas', 'debe'], overlay: 'phonevoice', tail: 6},
    {clip: 'a-a1', d: 4.833, shot: 8, lines: ['Y usted no sabe. Porque la', 'respuesta está en el cuaderno…', 'en la tienda.'], keys: ['cuaderno', 'tienda'], overlay: 'closed'},
    {clip: 'a-a2', d: 1.489, shot: 3, lines: ['Otra cena', 'que se enfría.'], keys: ['enfría'], overlay: 'empty', tail: 14},
    {clip: 'a-s1', d: 4.833, shot: 4, lines: ['Con PlanPy, de día registra', 'su mercancía, sus proveedores', 'y sus pedidos.'], keys: ['mercancía', 'proveedores', 'pedidos'], overlay: 'desktop'},
    {clip: 'a-s2', d: 3.474, shot: 5, lines: ['Y en la noche, lo mira', 'en el celular y contesta', 'en segundos.'], keys: ['segundos'], overlay: 'consulta', tail: 16},
    {clip: 'cta', d: 3.474, shot: null, lines: [], keys: [], tail: 50},
  ],
  // V10 — tienda de ropa, ángulo «bad solution» (cuaderno). Tomas en public/v10/.
  RA: [
    {clip: 'v10/a-h', d: 5.878, shot: 1, lines: ['Una clienta pregunta si le', 'queda la blusa en talla M…', 'y usted va a buscar', 'en el cuaderno.'], keys: ['talla', 'cuaderno'], overlay: 'talla', tail: 8},
    {clip: 'v10/a-p', d: 3.709, shot: 2, lines: ['El cuaderno lo guarda todo.', 'Pero no le contesta nada.'], keys: ['todo', 'nada'], overlay: 'nocontesta', tail: 8},
    {clip: 'v10/a-a', d: 2.351, shot: 3, lines: ['Y mientras busca,', 'la clienta se va.'], keys: ['va'], overlay: 'sefue', tail: 12},
    {clip: 'v10/a-s1', d: 5.564, shot: 4, lines: ['Con PlanPy, su mercancía', 'queda en el computador.', 'La busca y sabe qué tiene.'], keys: ['mercancía', 'sabe'], overlay: 'ropa-desktop'},
    {clip: 'v10/a-s2', d: 3.161, shot: 5, lines: ['Y desde el celular la consulta', 'cuando quiera,', 'a cualquier hora.'], keys: ['celular', 'cualquier'], overlay: 'ropa-consulta', tail: 16},
    {clip: 'cta', d: 3.474, shot: null, lines: [], keys: [], tail: 50},
  ],
  RE: [
    {clip: 'v10/e-h', d: 5.721, shot: 6, lines: ['Sábado, 8 de la noche.', 'Cerró la tienda…', 'y ahora le toca', 'sumar el cuaderno.'], keys: ['sábado', 'sumar'], overlay: 'sabado', tail: 8},
    {clip: 'v10/e-p', d: 4.284, shot: 7, lines: ['Efectivo, transferencias,', 'lo que fió…', 'y la cuenta no le da.'], keys: ['cuenta'], overlay: 'nocuadra', tail: 8},
    {clip: 'v10/e-a', d: 3.004, shot: 8, lines: ['Mientras sus amigas ya salieron,', 'usted sigue sumando.'], keys: ['amigas', 'sumando'], overlay: 'amigas', tail: 10},
    {clip: 'v10/e-s1', d: 3.239, shot: 4, lines: ['Con PlanPy, cada venta', 'queda registrada', 'en el momento.'], keys: ['venta', 'momento'], overlay: 'ropa-ventas'},
    {clip: 'v10/e-s2', d: 3.161, shot: 9, lines: ['Y el cierre lo ve en el celular,', 'en unos 10 minutos.'], keys: ['10'], overlay: 'ropa-cierre', tail: 16},
    {clip: 'cta', d: 3.474, shot: null, lines: [], keys: [], tail: 50},
  ],
};

export const timelineV9 = (v: Version) => {
  let from = 0;
  return BEATS[v].map((b, i) => {
    const vf = Math.ceil((b.d / RATE) * FPS_V9);
    const lead = b.clip === 'cta' ? 8 : 3;
    const len = lead + vf + (b.tail ?? 6);
    const t = {...b, i, from, len, lead, vf};
    from += len;
    return t;
  });
};
export const durationV9 = (v: Version) => timelineV9(v).reduce((a, b) => a + b.len, 0);

const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 0.6}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const STILLS: number[] = [];
const Shot: React.FC<{n: number; dir: string}> = ({n, dir}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {STILLS.includes(n) ? (
        <Img src={staticFile(`${dir}/shot${n}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(frame, [0, 150], [1.02, 1.1])})`}} />
      ) : (
        <OffthreadVideo src={staticFile(`${dir}/shot${n}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      )}
      <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0) 40%)'}} />
    </AbsoluteFill>
  );
};

const usePop = (at: number, damping = 12) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping, stiffness: 200}, durationInFrames: 16});
};

// Llamada entrante (sobre el celular real de la toma).
const Llamada: React.FC<{name: string; at?: number}> = ({name, at = 4}) => {
  const frame = useCurrentFrame();
  const s = usePop(at);
  if (frame < at) return null;
  const pulse = 1 + 0.06 * Math.sin((frame - at) / 3);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1260, padding: '26px 28px', borderRadius: 40, background: 'rgba(20,20,22,0.92)', color: '#fff', fontFamily: `${SANS}, ${EMOJI}`, display: 'flex', alignItems: 'center', gap: 22, transform: `translateY(${(1 - s) * 200}px)`, opacity: s, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
      <div style={{width: 84, height: 84, borderRadius: 42, background: '#5b8def', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>🚚</div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 24, color: '#aaa'}}>Llamada entrante · 9:07 p. m.</div>
        <div style={{fontSize: 40, fontWeight: 800}}>{name}</div>
      </div>
      <div style={{width: 80, height: 80, borderRadius: 40, background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36}}>✕</div>
      <div style={{width: 80, height: 80, borderRadius: 40, background: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, transform: `scale(${pulse})`}}>📞</div>
    </div>
  );
};

// Tarjeta del computador: proveedores + inventario (datos de ejemplo, interfaz nuestra).
const CardDesktop: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const s = usePop(at, 13);
  if (frame < at) return null;
  const row = (a: string, b: string, i: number, strong?: boolean) => {
    const rs = interpolate(frame, [at + 10 + i * 6, at + 18 + i * 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div key={a} style={{display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '2px solid #eeeae3', fontSize: 22, opacity: rs, transform: `translateX(${(1 - rs) * 20}px)`, background: strong ? 'rgba(159,232,112,0.35)' : 'transparent', borderRadius: strong ? 10 : 0}}>
        <span style={{fontWeight: 600}}>{a}</span>
        <span style={{fontWeight: 800}}>{b}</span>
      </div>
    );
  };
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
          {['Ventas', 'Inventario', 'Proveedores', 'Pedidos', 'Reportes'].map((m) => (
            <div key={m} style={{fontSize: 17, fontWeight: 600, padding: '8px 12px', borderRadius: 10, color: m === 'Proveedores' ? '#10240f' : '#c9c6bf', background: m === 'Proveedores' ? UI_LIME : 'transparent'}}>{m}</div>
          ))}
        </div>
        <div style={{flex: 1, padding: '16px 20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <div style={{fontSize: 28, fontWeight: 800}}>Lácteos Don Jairo</div>
            <div style={{fontSize: 13, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '4px 10px'}}>Datos de ejemplo</div>
          </div>
          {row('Leche 1 L · en tienda', '14 unid.', 0)}
          {row('Último pedido', '6 canastas · martes', 1)}
          {row('Pedido de mañana', '5 canastas', 2, true)}
          {row('Saldo pendiente', '$186.300', 3)}
        </div>
      </div>
    </div>
  );
};

// Consulta en el celular: la respuesta, en el bolsillo.
const CardConsulta: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const s = usePop(at, 12);
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: 250, top: 1020, width: 580, height: 760, borderRadius: 60, background: '#111', padding: 12, transform: `translateY(${(1 - s) * 500}px) rotate(${-4 + (1 - s) * 8}deg)`, boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
      <div style={{width: '100%', height: '100%', borderRadius: 50, background: '#faf8f4', fontFamily: `${SANS}, ${EMOJI}`, padding: '64px 28px', boxSizing: 'border-box', color: '#141414'}}>
        <div style={{fontSize: 22, color: '#8a857c', fontWeight: 600}}>Proveedores</div>
        <div style={{fontSize: 38, fontWeight: 800, marginBottom: 20}}>Lácteos Don Jairo</div>
        {[
          ['Leche en tienda', '14 unid.'],
          ['Pedido de mañana', '5 canastas'],
          ['Saldo pendiente', '$186.300'],
        ].map(([a, b], i) => (
          <div key={a} style={{borderRadius: 20, padding: '16px 20px', marginBottom: 12, background: i === 1 ? '#171a14' : '#fff', color: i === 1 ? '#fff' : '#141414', border: i === 1 ? 'none' : '2px solid #eeeae3'}}>
            <div style={{fontSize: 20, color: i === 1 ? '#bbb' : '#8a857c'}}>{a}</div>
            <div style={{fontSize: 36, fontWeight: 800, color: i === 1 ? UI_LIME : undefined}}>{b}</div>
          </div>
        ))}
        <div style={{fontSize: 16, color: '#8a857c', textAlign: 'center', marginTop: 8}}>Datos de ejemplo</div>
      </div>
    </div>
  );
};


// Tarjetas genéricas para ropa (interfaz nuestra, datos de ejemplo, COP).
const DataCard: React.FC<{at: number; title: string; active: string; rows: [string, string][]; hi?: number; phone?: boolean; done?: string}> = ({at, title, active, rows, hi, phone, done}) => {
  const frame = useCurrentFrame();
  const s = usePop(at, 13);
  if (frame < at) return null;
  const rowEls = rows.map(([a, b], i) => {
    const rs = interpolate(frame, [at + 10 + i * 6, at + 18 + i * 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const strong = i === hi;
    return (
      <div key={a} style={{display: 'flex', justifyContent: 'space-between', padding: phone ? '14px 16px' : '12px 18px', margin: phone ? '0 0 10px' : 0, borderBottom: phone ? 'none' : '2px solid #eeeae3', borderRadius: phone ? 18 : strong ? 10 : 0, fontSize: phone ? 26 : 22, opacity: rs, background: strong ? (phone ? '#171a14' : 'rgba(159,232,112,0.35)') : phone ? '#fff' : 'transparent', color: strong && phone ? '#fff' : '#141414', border: phone && !strong ? '2px solid #eeeae3' : undefined}}>
        <span style={{fontWeight: 600}}>{a}</span>
        <span style={{fontWeight: 800, color: strong && phone ? UI_LIME : undefined}}>{b}</span>
      </div>
    );
  });
  if (phone) {
    return (
      <div style={{position: 'absolute', left: 250, top: 1000, width: 580, height: 780, borderRadius: 60, background: '#111', padding: 12, transform: `translateY(${(1 - s) * 500}px) rotate(${-4 + (1 - s) * 8}deg)`, boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
        <div style={{width: '100%', height: '100%', borderRadius: 50, background: '#faf8f4', fontFamily: `${SANS}, ${EMOJI}`, padding: '60px 24px', boxSizing: 'border-box', color: '#141414'}}>
          <div style={{fontSize: 22, color: '#8a857c', fontWeight: 600}}>{active}</div>
          <div style={{fontSize: 36, fontWeight: 800, marginBottom: 18}}>{title}</div>
          {rowEls}
          {done ? <div style={{marginTop: 8, borderRadius: 18, padding: '14px 16px', background: '#171a14', color: UI_LIME, fontSize: 26, fontWeight: 800, textAlign: 'center'}}>{done}</div> : null}
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
          {['Ventas', 'Inventario', 'Clientes', 'Caja', 'Reportes'].map((m) => (
            <div key={m} style={{fontSize: 17, fontWeight: 600, padding: '8px 12px', borderRadius: 10, color: m === active ? '#10240f' : '#c9c6bf', background: m === active ? UI_LIME : 'transparent'}}>{m}</div>
          ))}
        </div>
        <div style={{flex: 1, padding: '16px 20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <div style={{fontSize: 28, fontWeight: 800}}>{title}</div>
            <div style={{fontSize: 13, fontWeight: 600, color: '#6b665e', border: '2px dashed #c9c2b6', borderRadius: 999, padding: '4px 10px'}}>Datos de ejemplo</div>
          </div>
          {rowEls}
        </div>
      </div>
    </div>
  );
};

const Overlay: React.FC<{kind?: string; lead: number; vf: number}> = ({kind, lead, vf}) => {
  const w = (f: number) => Math.round(lead + vf * f);
  switch (kind) {
    case 'call-gaseosas':
    case 'call-lacteos':
      return (
        <>
          <Llamada name={kind === 'call-gaseosas' ? 'Proveedor Gaseosas' : 'Don Jairo · Lácteos'} />
          {[4, 34, 64, 94].map((a) => (
            <Sfx key={a} at={a} name="vibrate" volume={0.45} />
          ))}
        </>
      );
    case 'clock':
      return (
        <>
          <Sticker at={w(0.3)} x={800} y={1500} rot={6} size={66} bg="#ff4d4d" color="#fff">
            🕘 9:07 p. m.
          </Sticker>
          <Sfx at={2} name="tick" volume={0.45} />
        </>
      );
    case 'empty':
      return (
        <>
          <Sticker at={w(0.5)} x={300} y={1450} rot={-6} size={60} bg="#ffd400">
            🍽️ Se enfría
          </Sticker>
          <Sfx at={w(0.5)} name="boing" volume={0.35} />
        </>
      );
    case 'phonevoice':
      return (
        <>
          <Sticker at={6} x={780} y={1480} rot={5} size={56} bg="#ffffff">
            📞 El proveedor
          </Sticker>
          <Sfx at={2} name="scratch" volume={0.35} />
        </>
      );
    case 'closed':
      return (
        <>
          <Sticker at={w(0.55)} x={330} y={1300} rot={-5} size={62} bg="#ffd400">
            📒 Está en la tienda
          </Sticker>
          <Sticker at={w(0.85)} x={760} y={1460} rot={6} size={62} bg="#ff4d4d" color="#fff">
            🔒 Cerrada
          </Sticker>
          <Sfx at={w(0.55)} name="boing" volume={0.4} />
          <Sfx at={w(0.85)} name="impact" volume={0.35} />
        </>
      );
    case 'desktop':
      return (
        <>
          <CardDesktop at={22} />
          <Sfx at={22} name="whoosh" volume={0.35} />
          {[0, 1, 2, 3].map((k) => (
            <Sfx key={k} at={32 + k * 6} name="pop" volume={0.35} />
          ))}
          <Sfx at={60} name="ding" volume={0.4} />
        </>
      );
    case 'consulta':
      return (
        <>
          <CardConsulta at={8} />
          <Sfx at={8} name="whoosh" volume={0.35} />
          <Sfx at={22} name="ping" volume={0.45} />
          <Sticker at={w(0.9)} x={860} y={980} rot={8} size={60} bg={BRAND_GREEN} color="#fff">
            ⏱️ 10 s
          </Sticker>
        </>
      );
    case 'talla':
      return (
        <>
          <Sticker at={w(0.35)} x={760} y={1500} rot={6} size={66} bg="#ffd400">
            ¿Talla M? 🤔
          </Sticker>
          <Sfx at={w(0.35)} name="boing" volume={0.4} />
          <Sfx at={4} name="scribble" volume={0.35} />
        </>
      );
    case 'nocontesta':
      return (
        <>
          <Sticker at={w(0.6)} x={540} y={1560} rot={-4} size={62} bg="#ff4d4d" color="#fff">
            📒 … 🤷‍♀️
          </Sticker>
          <Sfx at={w(0.6)} name="boing" volume={0.35} />
        </>
      );
    case 'sefue':
      return (
        <>
          <Sticker at={w(0.55)} x={760} y={1300} rot={6} size={66} bg="#ffffff">
            👋 Se fue
          </Sticker>
          <Sfx at={w(0.5)} name="ding" volume={0.3} />
        </>
      );
    case 'ropa-desktop':
      return (
        <>
          <DataCard at={22} title="Blusa verde de lino" active="Inventario" rows={[['Talla S', '2 unid.'], ['Talla M', '3 unid.'], ['Talla L', '0 unid.'], ['Precio', '$89.900']]} hi={1} />
          <Sfx at={22} name="whoosh" volume={0.35} />
          {[0, 1, 2, 3].map((k) => (
            <Sfx key={k} at={32 + k * 6} name="pop" volume={0.35} />
          ))}
          <Sfx at={60} name="ding" volume={0.4} />
        </>
      );
    case 'ropa-consulta':
      return (
        <>
          <DataCard at={8} phone title="Blusa verde de lino" active="Inventario" rows={[['Talla M', '3 unid.'], ['Talla L', '0 unid.'], ['Vendidas hoy', '4']]} hi={0} />
          <Sfx at={8} name="whoosh" volume={0.35} />
          <Sfx at={22} name="ping" volume={0.45} />
        </>
      );
    case 'sabado':
      return (
        <>
          <Sticker at={w(0.25)} x={780} y={1500} rot={6} size={66} bg="#ff4d4d" color="#fff">
            🕗 Sábado 8 p. m.
          </Sticker>
          <Sfx at={2} name="tick" volume={0.45} />
        </>
      );
    case 'nocuadra':
      return (
        <>
          <Sticker at={w(0.3)} x={300} y={1400} rot={-6} size={54} bg="#ffffff">
            💵 Efectivo
          </Sticker>
          <Sticker at={w(0.45)} x={760} y={1500} rot={5} size={54} bg="#ffffff">
            📲 Transferencias
          </Sticker>
          <Sticker at={w(0.85)} x={540} y={1650} rot={-3} size={70} bg="#ff4d4d" color="#fff">
            ≠ No cuadra
          </Sticker>
          <Sfx at={w(0.3)} name="pop" volume={0.35} />
          <Sfx at={w(0.45)} name="pop" volume={0.35} />
          <Sfx at={w(0.85)} name="boing" volume={0.45} />
        </>
      );
    case 'amigas':
      return (
        <>
          <div style={{position: 'absolute', left: 60, right: 60, top: 1180}}>
            <Sticker at={4} x={480} y={0} rot={-2} size={50} bg="#ffffff">
              💬 Las amigas: ¿Vienes? 🎉
            </Sticker>
          </div>
          <Sfx at={4} name="ping" volume={0.45} />
        </>
      );
    case 'ropa-ventas':
      return (
        <>
          <DataCard at={18} title="Ventas de hoy" active="Ventas" rows={[['10:42 a. m. · Blusa verde M', '$89.900'], ['12:15 p. m. · Jean azul 30', '$119.900'], ['3:08 p. m. · Vestido flores S', '$134.500'], ['Total', '$344.300']]} hi={3} />
          <Sfx at={18} name="whoosh" volume={0.35} />
          {[0, 1, 2, 3].map((k) => (
            <Sfx key={k} at={28 + k * 6} name="pop" volume={0.35} />
          ))}
        </>
      );
    case 'ropa-cierre':
      return (
        <>
          <DataCard at={8} phone title="Cierre del sábado" active="Caja" rows={[['Efectivo', '$212.400'], ['Transferencias', '$131.900'], ['Total del día', '$344.300']]} hi={2} done="Caja cerrada ✓" />
          <Sfx at={8} name="whoosh" volume={0.35} />
          <Sfx at={30} name="ding" volume={0.45} />
        </>
      );
    default:
      return null;
  }
};

export const PlanpyAdV9: React.FC<{version: Version}> = ({version}) => {
  const tl = timelineV9(version);
  const total = durationV9(version);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.map((b) => (
        <Sequence key={b.i} from={b.from} durationInFrames={b.len}>
          {b.shot === null ? (
            <Whip>
              <CierreDesde />
              {[2, 10, 20, 40].map((a) => (
                <Sfx key={a} at={a} name="pop" volume={0.4} />
              ))}
            </Whip>
          ) : (
            <>
              <Whip dir={b.i % 2 ? -1 : 1} flash={b.i === 0}>
                <Shot n={b.shot} dir={version === 'RA' || version === 'RE' ? 'v10' : 'v9'} />
                <Texture strength={0.25} />
              </Whip>
              <Overlay kind={b.overlay} lead={b.lead} vf={b.vf} />
              <WordPop lines={b.lines} keys={b.keys} start={b.lead} voFrames={b.vf} size={b.i === 0 ? 76 : 70} top={b.i === 0 ? 120 : 140} />
            </>
          )}
          <Sfx at={0} name={b.i === 0 ? 'impact' : 'whoosh'} volume={b.i === 0 ? 0.6 : 0.35} />
          <Sequence from={b.lead} layout="none">
            <Audio src={staticFile(b.clip === 'cta' ? 'voz/cta.mp3' : (b.clip.startsWith('v10/') ? `voz/${b.clip}.mp3` : `voz/v9/${b.clip}.mp3`))} playbackRate={RATE} volume={b.clip === 'a-prov' ? 0.85 : 1} />
          </Sequence>
        </Sequence>
      ))}
      <Audio
        src={staticFile('music/cama-112bpm.wav')}
        volume={(f) => {
          const speaking = tl.some((b) => f >= b.from + b.lead - 3 && f <= b.from + b.lead + b.vf + 3);
          const out = interpolate(f, [total - 24, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (speaking ? 0.1 : 0.28) * out;
        }}
      />
    </AbsoluteFill>
  );
};
