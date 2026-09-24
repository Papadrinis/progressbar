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

type Version = 'C' | 'A';
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
const Shot: React.FC<{n: number}> = ({n}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {STILLS.includes(n) ? (
        <Img src={staticFile(`v9/shot${n}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(frame, [0, 150], [1.02, 1.1])})`}} />
      ) : (
        <OffthreadVideo src={staticFile(`v9/shot${n}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
                <Shot n={b.shot} />
                <Texture strength={0.25} />
              </Whip>
              <Overlay kind={b.overlay} lead={b.lead} vf={b.vf} />
              <WordPop lines={b.lines} keys={b.keys} start={b.lead} voFrames={b.vf} size={b.i === 0 ? 76 : 70} top={b.i === 0 ? 120 : 140} />
            </>
          )}
          <Sfx at={0} name={b.i === 0 ? 'impact' : 'whoosh'} volume={b.i === 0 ? 0.6 : 0.35} />
          <Sequence from={b.lead} layout="none">
            <Audio src={staticFile(b.clip === 'cta' ? 'voz/cta.mp3' : `voz/v9/${b.clip}.mp3`)} playbackRate={RATE} volume={b.clip === 'a-prov' ? 0.85 : 1} />
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
