import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS} from '../brand';
import {Texture} from '../components/Texture';
import {EMOJI, FlyAway, Sticker, Whip, WordPop} from '../v6/kit';
import {AgendaDesktop, CierreDesde, Cita} from '../v6/screens';

// PLANPY_CO_VIDA_AGENDA_BARBERIA_V7_H1 — misma estructura que la H1 de barbería (V6),
// con tomas realistas generadas en Higgsfield (GPT Image 2.5 → Seedance 2.5, 1080p, sin audio).
// Voz, subtítulos, stickers, efectos, música, interfaz y CTA se montan aquí.
export const FPS_V7 = 30;
const RATE = 1.1;

const BEATS = [
  {clip: 'barberia-h1', d: 4.833, shot: 1, lines: ['Barbero:', 'cada silla vacía', 'a las 4 de la tarde', 'es plata que no vuelve.'], keys: ['vacía', 'plata']},
  {clip: 'barberia-a1', d: 2.508, shot: 2, lines: ['Mientras atiende,', 'el WhatsApp no para.'], keys: ['whatsapp']},
  {clip: 'barberia-a2', d: 4.206, shot: 3, lines: ['Y al final del día:', 'dos que no llegaron', 'y tres que se fueron.'], keys: ['dos', 'tres']},
  {clip: 'barberia-s1', d: 4.441, shot: 4, lines: ['Con PlanPy, sus clientes', 'reservan solos,', 'las 24 horas.'], keys: ['solos', '24']},
  {clip: 'recordatorio-s2', d: 2.116, shot: 5, lines: ['Y el recordatorio', 'les llega por WhatsApp.'], keys: ['whatsapp']},
  {clip: 'barberia-d', d: 1.802, shot: 6, lines: ['Y usted,', 'a lo suyo.'], keys: ['suyo'], tail: 18},
  {clip: 'cta', d: 3.474, shot: 0, lines: [], keys: [], tail: 50},
];

export const timelineV7 = () => {
  let from = 0;
  return BEATS.map((b, i) => {
    const vf = Math.ceil((b.d / RATE) * FPS_V7);
    const lead = b.clip === 'cta' ? 8 : 3;
    const len = lead + vf + (b.tail ?? (i === 0 ? 10 : 6));
    const t = {...b, i, from, len, lead, vf};
    from += len;
    return t;
  });
};
export const DURATION_V7 = timelineV7().reduce((a, b) => a + b.len, 0);

const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 0.6}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const Shot: React.FC<{n: number; blur?: number}> = ({n, blur = 0}) => (
  <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined, transform: blur ? 'scale(1.06)' : undefined}}>
    <OffthreadVideo src={staticFile(`v7/shot${n}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    {/* sombra superior para que el subtítulo siempre se lea sobre el video */}
    <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0) 38%)'}} />
  </AbsoluteFill>
);

// Notificaciones que aparecen junto al celular del mesón.
const Burbujas: React.FC<{msgs: string[]; start: number; every: number}> = ({msgs, start, every}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1080, display: 'flex', flexDirection: 'column-reverse', gap: 12}}>
      {msgs.map((m, i) => {
        const at = start + i * every;
        if (frame < at) return null;
        const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 240}, durationInFrames: 14});
        return (
          <div key={i} style={{alignSelf: i % 2 ? 'flex-end' : 'flex-start', display: 'flex', gap: 14, alignItems: 'center', padding: '16px 22px', borderRadius: 26, background: 'rgba(255,255,255,0.95)', fontFamily: `${SANS}, ${EMOJI}`, fontSize: 32, fontWeight: 600, color: '#141414', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', transform: `scale(${s}) rotate(${i % 2 ? 2 : -2}deg)`}}>
            <div style={{width: 46, height: 46, borderRadius: 12, background: '#25a55f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24}}>💬</div>
            {m}
          </div>
        );
      })}
    </div>
  );
};

// Tarjeta de la agenda (la interfaz es nuestra, no generada).
const AgendaCard: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 13, stiffness: 180}, durationInFrames: 18});
  const pastel = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6'];
  const fixed = ['Andrés · corte', 'Juan · barba', 'Felipe · corte', 'Mateo · fade'];
  const online = ['Santi · corte', 'Camilo · barba', 'Nico · corte', 'Leo · fade'];
  const citas: Cita[] = [
    ...fixed.map((t, i) => ({col: i % 2, row: [0, 1, 3, 4][i], t, at: -1, color: pastel[i]})),
    ...online.map((t, i) => ({col: (i + 1) % 2, row: [2, 5, 6, 7][i], t, at: at + 12 + i * 11, online: true, color: pastel[(i + 3) % 6]})),
  ];
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: 60, top: 1060, width: 940, height: 600, transform: `scale(${0.96 * s}) rotate(${(1 - s) * -6}deg)`, transformOrigin: '50% 50%', borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.55)', border: '10px solid #1d1f22'}}>
      <div style={{height: 34, background: '#e8e3da', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px'}}>
        {['#e06c5a', '#e5b54a', '#68b36b'].map((c) => (
          <div key={c} style={{width: 11, height: 11, borderRadius: 6, background: c}} />
        ))}
        <div style={{marginLeft: 14, flex: 1, height: 22, borderRadius: 11, background: '#fff', fontFamily: SANS, fontSize: 14, color: '#6b665e', display: 'flex', alignItems: 'center', paddingLeft: 12}}>planpy.io</div>
      </div>
      <div style={{position: 'absolute', top: 34, left: 0, right: 0, bottom: 0}}>
        <AgendaDesktop cols={['Silla 1', 'Silla 2']} hours={['9 a. m.', '10 a. m.', '11 a. m.', '12 m.', '2 p. m.', '3 p. m.', '4 p. m.', '5 p. m.']} citas={citas} />
      </div>
    </div>
  );
};

// Banner de notificación que le llega al cliente.
const Banner: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 200}, durationInFrames: 16});
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1240, padding: '24px 26px', borderRadius: 34, background: 'rgba(255,255,255,0.96)', fontFamily: `${SANS}, ${EMOJI}`, color: '#141414', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', transform: `translateY(${(1 - s) * 200}px) scale(${0.9 + 0.1 * s})`, opacity: s}}>
      <div style={{display: 'flex', gap: 14, alignItems: 'center', marginBottom: 8}}>
        <div style={{width: 54, height: 54, borderRadius: 14, background: '#25a55f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28}}>💬</div>
        <div style={{fontSize: 28, fontWeight: 800}}>Barbería El Parche</div>
        <div style={{marginLeft: 'auto', fontSize: 22, color: '#8a857c'}}>ahora</div>
      </div>
      <div style={{fontSize: 36, lineHeight: 1.25}}>Recordatorio: su corte es mañana a las 5:00 p. m. ✂️</div>
      <div style={{fontSize: 18, color: '#8a857c', marginTop: 8}}>Datos de ejemplo</div>
    </div>
  );
};

const Overlay: React.FC<{i: number; lead: number; vf: number}> = ({i, lead, vf}) => {
  const w = (f: number) => Math.round(lead + vf * f);
  switch (i) {
    case 0:
      return (
        <>
          <Sticker at={w(0.5)} x={800} y={760} rot={6} size={62} bg="#ffd400">
            4:00 p. m. 🕓
          </Sticker>
          <FlyAway at={w(0.8)} emoji="💸" x={540} y={1300} count={8} />
          <Sfx at={4} name="tick" volume={0.5} />
          <Sfx at={w(0.8)} name="cash" volume={0.55} />
        </>
      );
    case 1:
      return (
        <>
          <Burbujas start={4} every={10} msgs={['¿Tiene cupo hoy? ✂️', '¿A qué hora abre?', 'Parce, ¿mañana a las 5?', '¿Me guarda un cupo? 🙏']} />
          <Sfx at={0} name="vibrate" volume={0.45} />
          {[4, 14, 24, 34].map((a) => (
            <Sfx key={a} at={a} name="ping" volume={0.35} />
          ))}
        </>
      );
    case 2:
      return (
        <>
          <Sticker at={w(0.42)} x={330} y={900} rot={-6} size={60} bg="#ff4d4d" color="#fff">
            ❌ 2 no llegaron
          </Sticker>
          <Sticker at={w(0.78)} x={700} y={1020} rot={5} size={60} bg="#ffd400">
            🏃 3 se fueron
          </Sticker>
          <Sfx at={w(0.42)} name="boing" volume={0.45} />
          <Sfx at={w(0.78)} name="boing" volume={0.45} />
        </>
      );
    case 3:
      return (
        <>
          <AgendaCard at={30} />
          {[0, 1, 2, 3].map((k) => (
            <Sfx key={k} at={42 + k * 11} name="pop" volume={0.45} />
          ))}
          <Sfx at={30} name="whoosh" volume={0.35} />
          <Sfx at={88} name="ding" volume={0.4} />
          <Sticker at={w(0.8)} x={900} y={1010} rot={8} size={70} bg="#3DB55C" color="#fff">
            24/7
          </Sticker>
        </>
      );
    case 4:
      return (
        <>
          <Banner at={10} />
          <Sfx at={10} name="ping" volume={0.5} />
        </>
      );
    case 5:
      return (
        <>
          <Sticker at={14} x={540} y={1650} rot={-4} size={70}>
            Cero afán 😎
          </Sticker>
          <Sfx at={14} name="pop" volume={0.5} />
        </>
      );
    default:
      return null;
  }
};

export const PlanpyAdV7: React.FC = () => {
  const tl = timelineV7();
  const total = DURATION_V7;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.map((b) => (
        <Sequence key={b.i} from={b.from} durationInFrames={b.len}>
          {b.clip === 'cta' ? (
            <Whip>
              <CierreDesde />
              {[2, 10, 20, 40].map((a) => (
                <Sfx key={a} at={a} name="pop" volume={0.4} />
              ))}
            </Whip>
          ) : (
            <>
              <Whip dir={b.i % 2 ? -1 : 1} flash={b.i === 0}>
                <Shot n={b.shot} blur={b.i === 3 ? 0 : 0} />
                <Texture strength={0.25} />
              </Whip>
              <Overlay i={b.i} lead={b.lead} vf={b.vf} />
              <WordPop lines={b.lines} keys={b.keys} start={b.lead} voFrames={b.vf} size={b.i === 0 ? 80 : 72} top={b.i === 0 ? 130 : 150} />
            </>
          )}
          <Sfx at={0} name={b.i === 0 ? 'impact' : 'whoosh'} volume={b.i === 0 ? 0.7 : 0.4} />
          <Sequence from={b.lead} layout="none">
            <Audio src={staticFile(b.clip === 'cta' ? 'voz/cta.mp3' : `voz/v6/${b.clip}.mp3`)} playbackRate={RATE} />
          </Sequence>
        </Sequence>
      ))}
      <Audio
        src={staticFile('music/alegre-124bpm.wav')}
        volume={(f) => {
          const speaking = tl.some((b) => f >= b.from + b.lead - 3 && f <= b.from + b.lead + b.vf + 3);
          const out = interpolate(f, [total - 24, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (speaking ? 0.12 : 0.3) * out;
        }}
      />
    </AbsoluteFill>
  );
};
