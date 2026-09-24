import {AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {Phone} from '../v2/Phone';
import {Cuaderno} from '../components/Cuaderno';
import {Texture} from '../components/Texture';
import {Desktop} from '../v4/Desktop';
import {Emoji, FlyAway, Sticker, Whip, WordPop, useShake} from './kit';
import {AgendaDesktop, Cita, CierrePyme, NotifStack, ReminderScreen} from './screens';
import {BarberChair, Barberia, Busy, CitaPhone, Dog, Foam, Gotas, Noche, Puerta, PetShop, Salon, Secador, Tina, WallClock} from './scenes';

// PLANPY_CO_VIDA_AGENDA_{BARBERIA|SALON|MASCOTAS}_V6_H1 — servicios: agenda 24/7 + recordatorio por WhatsApp.
// PAS + CTA montado sobre la voz; subtítulo palabra por palabra, stickers, efectos y música alegre.
export const FPS_V6 = 30;
const RATE = 1.1;

type Rubro = 'barberia' | 'salon' | 'mascotas';
type Ctx = {lead: number; vf: number; w: (frac: number) => number};
type BeatDef = {clip: string; lines: string[]; keys: string[]; visual: (c: Ctx) => React.ReactNode; tail?: number};

const DUR: Record<string, number> = {
  'barberia-h1': 4.833, 'barberia-a1': 2.508, 'barberia-a2': 4.206, 'barberia-s1': 4.441, 'recordatorio-s2': 2.116, 'barberia-d': 1.802,
  'salon-h1': 3.971, 'salon-a1': 3.239, 'salon-a2': 2.769, 'salon-s1': 5.564, 'salon-s2': 2.691, 'salon-d': 2.273,
  'mascotas-h1': 4.519, 'mascotas-a1': 2.769, 'mascotas-a2': 4.519, 'mascotas-s1': 4.127, 'mascotas-d': 2.273,
  cta: 3.474,
};
const vfOf = (clip: string) => Math.ceil((DUR[clip] / RATE) * FPS_V6);
const clipSrc = (clip: string) => (clip === 'cta' ? 'voz/cta.mp3' : `voz/v6/${clip}.mp3`);

const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 0.6}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const Center: React.FC<{children: React.ReactNode; y?: number; scale?: number; shakeAt?: number}> = ({children, y = 520, scale = 0.82, shakeAt}) => {
  const shake = useShake(shakeAt ?? -99, 60, 8);
  return (
    <div style={{position: 'absolute', inset: 0, transform: shakeAt !== undefined ? shake : undefined}}>
      <Phone enter={-8} y={y} scale={scale} rotate={-3}>
        {children}
      </Phone>
    </div>
  );
};

const Blur: React.FC<{children: React.ReactNode; px?: number}> = ({children, px = 10}) => <AbsoluteFill style={{filter: `blur(${px}px)`, transform: 'scale(1.05)'}}>{children}</AbsoluteFill>;

const pings = (start: number, every: number, n: number) => Array.from({length: n}, (_, i) => <Sfx key={i} at={start + i * every} name="ping" volume={0.35} />);

const citas = (names: string[], online: string[], at0: number): Cita[] => {
  const pastel = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6'];
  const base: Cita[] = names.map((t, i) => ({col: i % 2, row: [0, 1, 3, 4][i] ?? i, t, at: -1, color: pastel[i % pastel.length]}));
  const nuevos: Cita[] = online.map((t, i) => ({col: (i + 1) % 2, row: [2, 5, 6, 7, 2][i] ?? i + 2, t, at: at0 + i * 11, online: true, color: pastel[(i + 3) % pastel.length]}));
  return [...base, ...nuevos];
};
const HOURS = ['9 a. m.', '10 a. m.', '11 a. m.', '12 m.', '2 p. m.', '3 p. m.', '4 p. m.', '5 p. m.'];

const AgendaBeat: React.FC<{bg: React.ReactNode; cols: string[]; fixed: string[]; online: string[]; c: Ctx}> = ({bg, cols, fixed, online, c}) => (
  <>
    <Blur px={6}>{bg}</Blur>
    <Desktop zoom={{at: 2, to: 1.1, x: 540, y: 960}}>
      <AgendaDesktop cols={cols} hours={HOURS} citas={citas(fixed, online, 14)} />
    </Desktop>
    {online.map((_, i) => (
      <Sfx key={i} at={14 + i * 11} name="pop" volume={0.45} />
    ))}
    <Sfx at={14 + online.length * 11 + 2} name="ding" volume={0.4} />
    <Sticker at={c.w(0.78)} x={880} y={600} rot={8} size={70} bg="#3DB55C" color="#fff">
      24/7
    </Sticker>
  </>
);

const Reminder: React.FC<{bg: React.ReactNode; business: string; text: string}> = ({bg, business, text}) => (
  <>
    <Blur>{bg}</Blur>
    <Center>
      <ReminderScreen business={business} text={text} at={6} />
    </Center>
    <Sfx at={6} name="ping" volume={0.5} />
    <Sticker at={30} x={820} y={1650} rot={-8} size={60} bg="#3DB55C" color="#fff">
      💬 WhatsApp
    </Sticker>
  </>
);

// Choque de las dos citas (salón).
const Choque: React.FC<{c: Ctx}> = ({c}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hit = c.w(0.42);
  const s = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 120}, durationInFrames: Math.max(10, hit - 4)});
  const shake = useShake(hit, 14, 26);
  return (
    <div style={{position: 'absolute', inset: 0, transform: shake}}>
      <Salon />
      <Secador x={640} y={380} stopAt={hit} size={170} />
      <div style={{position: 'absolute', left: interpolate(s, [0, 1], [-420, 150]), top: 820}}>
        <CitaPhone name="Paola" hour="3:00 p. m." tilt={-8} />
      </div>
      <div style={{position: 'absolute', left: interpolate(s, [0, 1], [1100, 550]), top: 860}}>
        <CitaPhone name="Camila" hour="3:00 p. m." tilt={8} />
      </div>
      <Sticker at={hit} x={540} y={1640} rot={-5} size={84} bg="#ff4d4d" color="#fff">
        3:00 p. m. × 2
      </Sticker>
      <Emoji at={c.w(0.8)} x={880} y={720} size={150}>
        😅
      </Emoji>
    </div>
  );
};

// ¿Al perro o al celular? (mascotas).
const Dilema: React.FC<{c: Ctx}> = ({c}) => {
  const frame = useCurrentFrame();
  const q = c.w(0.7);
  const side = frame >= q ? Math.floor((frame - q) / 9) % 2 : -1;
  const vib = frame >= 18 ? Math.sin(frame * 3.1) * 6 : 0;
  return (
    <>
      <PetShop />
      <Tina />
      <Dog x={430} y={1130} scale={1.05} />
      <Foam x={430} y={1060} />
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${vib}px, 0) rotate(${vib}deg)`}}>
        <Phone enter={-8} x={520} y={380} scale={0.33} rotate={8}>
          <NotifStack msgs={[{from: 'Clienta', text: '¿Hay cupo hoy? 🐶'}]} />
        </Phone>
        {/* bolsa plástica */}
        <div style={{position: 'absolute', left: 750, top: 830, width: 300, height: 560, borderRadius: 40, background: 'rgba(255,255,255,0.28)', border: '3px solid rgba(255,255,255,0.6)', transform: 'rotate(8deg)'}} />
      </div>
      {side >= 0 ? (
        <div style={{position: 'absolute', left: side === 0 ? 430 : 890, top: side === 0 ? 1100 : 1120, width: side === 0 ? 480 : 320, height: side === 0 ? 480 : 560, marginLeft: side === 0 ? -240 : -160, marginTop: side === 0 ? -240 : -280, borderRadius: '50%', border: '10px solid #ffd400', boxShadow: '0 0 30px rgba(255,212,0,0.8)'}} />
      ) : null}
      <Sticker at={q} x={540} y={1650} rot={-4} size={90} bg="#ffd400">
        ¿A CUÁL? 🤔
      </Sticker>
    </>
  );
};

const RUBROS: Record<Rubro, BeatDef[]> = {
  barberia: [
    {
      clip: 'barberia-h1',
      lines: ['Barbero:', 'cada silla vacía', 'a las 4 de la tarde', 'es plata que no vuelve.'],
      keys: ['vacía', 'plata'],
      visual: (c) => (
        <>
          <Barberia />
          <BarberChair spin={5} y={1260} />
          <WallClock x={880} y={700} hour={4} size={200} />
          <Sticker at={c.w(0.5)} x={860} y={880} rot={6} size={58} bg="#ffd400">
            4:00 p. m.
          </Sticker>
          <FlyAway at={c.w(0.8)} emoji="💸" x={540} y={1150} count={8} />
          <Sfx at={4} name="tick" volume={0.5} />
          <Sfx at={c.w(0.8)} name="cash" volume={0.55} />
        </>
      ),
    },
    {
      clip: 'barberia-a1',
      lines: ['Mientras atiende,', 'el WhatsApp no para.'],
      keys: ['whatsapp'],
      visual: () => (
        <>
          <Blur>
            <Barberia />
          </Blur>
          <Center shakeAt={0}>
            <NotifStack
              every={7}
              start={3}
              msgs={[
                {from: 'Andrés', text: '¿Tiene cupo hoy? ✂️'},
                {from: 'Felipe', text: '¿A qué hora abre?'},
                {from: 'Mateo', text: 'Parce, ¿mañana a las 5?'},
                {from: 'Juan', text: '¿Hay turno ya?'},
                {from: 'Santi', text: '¿Me guarda un cupo? 🙏'},
                {from: 'Camilo', text: '¿Barba y corte cuánto?'},
              ]}
            />
          </Center>
          <Emoji at={10} x={170} y={1560} size={130}>
            🧼
          </Emoji>
          <Sfx at={0} name="vibrate" volume={0.45} />
          {pings(3, 7, 6)}
        </>
      ),
    },
    {
      clip: 'barberia-a2',
      lines: ['Y al final del día:', 'dos que no llegaron', 'y tres que se fueron.'],
      keys: ['dos', 'tres'],
      visual: (c) => (
        <>
          <Blur>
            <Barberia />
          </Blur>
          <Cuaderno
            writeStart={-200}
            lines={[
              {t: 'Jueves', bold: true},
              {t: '10:00 ..... Andrés'},
              {t: '11:30 ..... Felipe', strikeAt: c.w(0.3)},
              {t: '2:00 ....... Mateo', strikeAt: c.w(0.38)},
              {t: '4:00 ....... '},
              {t: '5:30 ....... Juan'},
            ]}
          />
          <Sticker at={c.w(0.42)} x={330} y={860} rot={-6} size={60} bg="#ff4d4d" color="#fff">
            ❌ 2 no llegaron
          </Sticker>
          <Sticker at={c.w(0.78)} x={700} y={960} rot={5} size={60} bg="#ffd400">
            🏃 3 se fueron
          </Sticker>
          <Sfx at={c.w(0.3)} name="scribble" volume={0.5} />
          <Sfx at={c.w(0.42)} name="boing" volume={0.45} />
          <Sfx at={c.w(0.78)} name="boing" volume={0.45} />
        </>
      ),
    },
    {
      clip: 'barberia-s1',
      lines: ['Con PlanPy, sus clientes', 'reservan solos,', 'las 24 horas.'],
      keys: ['solos', '24'],
      visual: (c) => (
        <AgendaBeat bg={<Barberia />} cols={['Silla 1', 'Silla 2']} fixed={['Andrés · corte', 'Juan · barba', 'Felipe · corte', 'Mateo · fade']} online={['Santi · corte', 'Camilo · barba', 'Nico · corte', 'Leo · fade']} c={c} />
      ),
    },
    {
      clip: 'recordatorio-s2',
      lines: ['Y el recordatorio', 'les llega por WhatsApp.'],
      keys: ['whatsapp'],
      visual: () => <Reminder bg={<Barberia />} business="Barbería El Parche" text="Recordatorio: su corte es mañana a las 5:00 p. m. ✂️" />,
    },
    {
      clip: 'barberia-d',
      lines: ['Y usted,', 'a lo suyo.'],
      keys: ['suyo'],
      tail: 16,
      visual: () => (
        <>
          <Barberia />
          <BarberChair y={1260} />
          <Emoji at={4} x={540} y={900} size={200}>
            ✂️
          </Emoji>
          <Sticker at={14} x={540} y={1650} rot={-4} size={70}>
            Cero afán 😎
          </Sticker>
          <Sfx at={14} name="pop" volume={0.5} />
        </>
      ),
    },
  ],
  salon: [
    {
      clip: 'salon-h1',
      lines: ['Dos clientas llegaron', 'a la misma hora.', 'Y las dos tenían razón.'],
      keys: ['misma', 'razón'],
      visual: (c) => (
        <>
          <Choque c={c} />
          <Sfx at={2} name="dryer" volume={0.35} />
          <Sfx at={c.w(0.42)} name="scratch" volume={0.6} />
          <Sfx at={c.w(0.42)} name="impact" volume={0.5} />
          <Sfx at={c.w(0.8)} name="boing" volume={0.4} />
        </>
      ),
    },
    {
      clip: 'salon-a1',
      lines: ['Atiende con', 'las manos ocupadas', 'y el celular sonando.'],
      keys: ['ocupadas', 'sonando'],
      visual: () => (
        <>
          <Blur>
            <Salon />
          </Blur>
          <Center shakeAt={0}>
            <NotifStack
              every={8}
              start={3}
              msgs={[
                {from: 'Paola', text: '¿Tiene cita hoy para uñas? 💅'},
                {from: 'Camila', text: '¿Cuánto vale el tinte?'},
                {from: 'Laura', text: '¿Me cambia para las 4?'},
                {from: 'Vale', text: '¿Hay cupo el sábado? 🙏'},
                {from: 'Diana', text: '¿Ya abrió?'},
              ]}
            />
          </Center>
          <Emoji at={8} x={170} y={1560} size={130}>
            🧤
          </Emoji>
          <Emoji at={16} x={910} y={1580} size={120}>
            💇‍♀️
          </Emoji>
          <Sfx at={0} name="vibrate" volume={0.45} />
          {pings(3, 8, 5)}
        </>
      ),
    },
    {
      clip: 'salon-a2',
      lines: ['Y contesta los mensajes', 'a las 11 de la noche.'],
      keys: ['11'],
      visual: () => (
        <>
          <Noche />
          <Center y={560} scale={0.72}>
            <NotifStack
              every={10}
              start={4}
              msgs={[
                {from: 'Usted', text: 'Sí, mañana a las 10 ✅'},
                {from: 'Usted', text: 'Perdón la demora 🙈'},
                {from: 'Usted', text: 'Le guardo el de las 3'},
              ]}
            />
          </Center>
          <div style={{position: 'absolute', left: 190, top: 700, width: 700, height: 900, background: 'radial-gradient(ellipse, rgba(180,210,255,0.25), transparent 70%)'}} />
          <Emoji at={20} x={880} y={1560} size={140}>
            🥱
          </Emoji>
          <Sfx at={0} name="tick" volume={0.4} />
          {pings(4, 10, 3)}
        </>
      ),
    },
    {
      clip: 'salon-s1',
      lines: ['Con PlanPy, una sola agenda.', 'Y sus clientas reservan solas,', 'las 24 horas.'],
      keys: ['una', 'solas', '24'],
      visual: (c) => (
        <AgendaBeat bg={<Salon />} cols={['Laura', 'Dani']} fixed={['Paola · tinte', 'Vale · uñas', 'Diana · corte', 'Sara · cejas']} online={['Camila · tinte', 'Luisa · uñas', 'Ana · peinado', 'Mari · corte']} c={c} />
      ),
    },
    {
      clip: 'salon-s2',
      lines: ['Y a cada una le llega', 'el recordatorio por WhatsApp.'],
      keys: ['whatsapp'],
      visual: () => <Reminder bg={<Salon />} business="Salón Dani & Laura" text="Recordatorio: su cita es mañana a las 3:30 p. m. 💇‍♀️" />,
    },
    {
      clip: 'salon-d',
      lines: ['Y usted, con las manos', 'en lo suyo.'],
      keys: ['suyo'],
      tail: 14,
      visual: () => (
        <>
          <Salon />
          <Secador x={420} y={900} size={220} />
          <Emoji at={6} x={760} y={1150} size={160}>
            ✨
          </Emoji>
          <Sticker at={14} x={540} y={1650} rot={-4} size={70}>
            Manos en lo suyo 💅
          </Sticker>
          <Sfx at={0} name="dryer" volume={0.25} />
          <Sfx at={14} name="pop" volume={0.5} />
        </>
      ),
    },
  ],
  mascotas: [
    {
      clip: 'mascotas-h1',
      lines: ['Tiene un perro enjabonado', 'y el celular sonando.', '¿A cuál atiende?'],
      keys: ['enjabonado', 'cuál'],
      visual: (c) => (
        <>
          <Dilema c={c} />
          <Sfx at={0} name="splash" volume={0.5} />
          <Sfx at={10} name="bark" volume={0.5} />
          <Sfx at={18} name="vibrate" volume={0.45} />
          <Sfx at={c.w(0.7)} name="boing" volume={0.4} />
          <Sfx at={c.w(0.7) + 9} name="boing" volume={0.35} />
          <Sfx at={c.w(0.7) + 18} name="boing" volume={0.35} />
        </>
      ),
    },
    {
      clip: 'mascotas-a1',
      lines: ['Con las manos mojadas,', 'no puede contestar.'],
      keys: ['mojadas'],
      visual: () => (
        <>
          <Blur>
            <PetShop />
          </Blur>
          <Center shakeAt={0}>
            <NotifStack
              every={8}
              start={3}
              msgs={[
                {from: 'Dueña de Lola', text: '¿Cupo para Lola el sábado? 🐩'},
                {from: 'Carlos', text: '¿Cuánto el baño?'},
                {from: 'Dueño de Toby', text: '¿Me lo motilan también? 🐕'},
                {from: 'Ana', text: '¿Hay turno mañana?'},
              ]}
            />
          </Center>
          <Gotas x={540} y={1000} />
          <Emoji at={6} x={170} y={1560} size={130}>
            💦
          </Emoji>
          <Sfx at={0} name="vibrate" volume={0.45} />
          {pings(3, 8, 4)}
        </>
      ),
    },
    {
      clip: 'mascotas-a2',
      lines: ['Y el sábado: tres perros', 'a la misma hora,', 'y uno que nadie anotó.'],
      keys: ['tres', 'nadie'],
      visual: (c) => (
        <>
          <PetShop />
          <Puerta />
          {[
            {x: 280, color: '#e8c9a0', at: c.w(0.25)},
            {x: 560, color: '#8a6a4f', at: c.w(0.33)},
            {x: 830, color: '#f2f2f2', at: c.w(0.41)},
          ].map((d, i) => (
            <Sequence key={i} from={Math.round(d.at)} layout="none">
              <Dog x={d.x} y={1330} scale={0.62} color={d.color} />
            </Sequence>
          ))}
          <Sticker at={c.w(0.45)} x={540} y={820} rot={-4} size={62} bg="#ffd400">
            Sábado 10:00 × 3 🐾
          </Sticker>
          <Sticker at={c.w(0.78)} x={830} y={1050} rot={8} size={56} bg="#ff4d4d" color="#fff">
            ¿Y este? 🤔
          </Sticker>
          <Sfx at={c.w(0.25)} name="bark" volume={0.45} />
          <Sfx at={c.w(0.33)} name="bark" volume={0.4} />
          <Sfx at={c.w(0.41)} name="bark" volume={0.45} />
          <Sfx at={c.w(0.78)} name="boing" volume={0.45} />
        </>
      ),
    },
    {
      clip: 'mascotas-s1',
      lines: ['Con PlanPy, los dueños', 'reservan solos,', 'las 24 horas.'],
      keys: ['solos', '24'],
      visual: (c) => (
        <AgendaBeat bg={<PetShop />} cols={['Baño', 'Corte']} fixed={['Toby · baño', 'Max · corte', 'Kira · baño', 'Coco · corte']} online={['Lola · baño y corte', 'Rocky · baño', 'Luna · corte', 'Simón · baño']} c={c} />
      ),
    },
    {
      clip: 'recordatorio-s2',
      lines: ['Y el recordatorio', 'les llega por WhatsApp.'],
      keys: ['whatsapp'],
      visual: () => <Reminder bg={<PetShop />} business="Spa Patitas" text="Recordatorio: el baño de Lola es mañana a las 10:00 a. m. 🐾" />,
    },
    {
      clip: 'mascotas-d',
      lines: ['Y usted, dedicado', 'a los peludos.'],
      keys: ['peludos'],
      tail: 14,
      visual: () => (
        <>
          <PetShop />
          <Dog x={540} y={1200} scale={1.1} shake />
          <Gotas x={540} y={1200} />
          <Sticker at={16} x={540} y={1650} rot={-4} size={70}>
            Puro amor peludo 🐶
          </Sticker>
          <Sfx at={2} name="shake" volume={0.55} />
          <Sfx at={16} name="bark" volume={0.4} />
        </>
      ),
    },
  ],
};

export const timelineV6 = (rubro: Rubro) => {
  let from = 0;
  const beats = [...RUBROS[rubro], {clip: 'cta', lines: [], keys: [], visual: () => null, tail: 50} as BeatDef];
  return beats.map((b, i) => {
    const vf = vfOf(b.clip);
    const lead = b.clip === 'cta' ? 8 : 3;
    const len = lead + vf + (b.tail ?? (i === 0 ? 10 : 6));
    const t = {...b, i, from, len, lead, vf};
    from += len;
    return t;
  });
};
export const durationV6 = (rubro: Rubro) => timelineV6(rubro).reduce((a, b) => a + b.len, 0);
export const adV6Schema = z.object({rubro: z.enum(['barberia', 'salon', 'mascotas'])});

const Music: React.FC<{rubro: Rubro; total: number}> = ({rubro, total}) => {
  const tl = timelineV6(rubro);
  return (
    <Audio
      src={staticFile('music/alegre-124bpm.wav')}
      volume={(f) => {
        const speaking = tl.some((b) => f >= b.from + b.lead - 3 && f <= b.from + b.lead + b.vf + 3);
        const out = interpolate(f, [total - 24, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (speaking ? 0.14 : 0.36) * out;
      }}
    />
  );
};

export const PlanpyAdV6: React.FC<z.infer<typeof adV6Schema>> = ({rubro}) => {
  const tl = timelineV6(rubro);
  const total = durationV6(rubro);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.map((b) => {
        const ctx: Ctx = {lead: b.lead, vf: b.vf, w: (frac) => Math.round(b.lead + b.vf * frac)};
        return (
          <Sequence key={b.i} from={b.from} durationInFrames={b.len}>
            {b.clip === 'cta' ? (
              <Whip dir={1}>
                <CierrePyme />
                {[2, 10, 22, 40].map((a) => (
                  <Sfx key={a} at={a} name="pop" volume={0.4} />
                ))}
              </Whip>
            ) : (
              <>
                <Whip dir={b.i % 2 ? -1 : 1} flash={b.i === 0}>
                  {b.visual(ctx)}
                  <Texture strength={0.45} />
                </Whip>
                <WordPop lines={b.lines} keys={b.keys} start={b.lead} voFrames={b.vf} size={b.i === 0 ? 80 : 72} top={b.i === 0 ? 150 : 170} />
              </>
            )}
            <Sfx at={0} name={b.i === 0 ? 'impact' : 'whoosh'} volume={b.i === 0 ? 0.7 : 0.4} />
            <Sequence from={b.lead} layout="none">
              <Audio src={staticFile(clipSrc(b.clip))} playbackRate={RATE} />
            </Sequence>
          </Sequence>
        );
      })}
      <Music rubro={rubro} total={total} />
    </AbsoluteFill>
  );
};
