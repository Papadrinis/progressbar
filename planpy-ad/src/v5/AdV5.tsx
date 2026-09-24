import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Phone} from '../v2/Phone';
import {LockScreen} from '../v2/screens';
import {Cuaderno, CuadernoLine} from '../components/Cuaderno';
import {Texture, useHandheld} from '../components/Texture';
import {Tienda} from '../components/Tienda';
import {Cierre} from '../scenes/Cierre';
import {Casa, DayLight} from '../v4/Casa';
import {Desktop} from '../v4/Desktop';
import {CierreDesktop, InventarioDesktop, MovimientosDesktop} from '../v4/desktopScreens';
import {ResumenMobile, StockMobile} from '../v4/mobileScreens';
import {BilletesCO} from './BilletesCO';
import {Karaoke} from './Karaoke';

// PLANPY_CO_VIDA_PAS_*_V5 — misma estructura PAS que V4, pero montada sobre la voz:
// cada bloque dura lo que dura su frase (+ respiro), subtítulos sincronizados,
// entrada de cada bloque con punch + whoosh, efectos de sonido y cama musical con ducking.
export const FPS_V5 = 30;
const RATE = 1.07; // voz un 7 % más ágil, sin cambiar el tono
const LEAD = 3;
const TAIL = 5;

type Angle = 'cierre' | 'caja' | 'inventario';
type BeatId = 'p' | 'a1' | 'a2' | 's1' | 's2' | 'cta';

// Duraciones medidas de cada clip (s) y su texto (= subtítulo).
const VO: Record<string, {d: number; lines: string[]}> = {
  'cierre-p': {d: 3.631, lines: ['¿Cuánto ganó hoy?', 'De verdad,', '¿cuánto le quedó?']},
  'cierre-a1': {d: 2.038, lines: ['El cuaderno', 'no le responde eso.']},
  'cierre-a2': {d: 2.429, lines: ['Y otra noche,', 'llega tarde a comer.']},
  'cierre-s1': {d: 3.004, lines: ['Con PlanPy, cierra la caja', 'en unos diez minutos.']},
  'casa-s2': {d: 2.508, lines: ['Y desde la casa,', 'mira cómo le fue.']},
  'caja-p': {d: 2.508, lines: ['La caja no cuadró.', 'Otra vez.']},
  'caja-a1': {d: 3.239, lines: ['¿Un cambio mal dado?', '¿Un gasto sin anotar?']},
  'caja-a2': {d: 2.116, lines: ['Y usted, recontando', 'a las once.']},
  'caja-s1': {d: 3.709, lines: ['Con PlanPy, cada venta', 'y cada gasto', 'quedan registrados.']},
  'inventario-p': {d: 3.004, lines: ['¿Tiene aceite?', 'Déjeme mirar atrás…']},
  'inventario-a1': {d: 2.116, lines: ['Ir a mirar:', 'ese es su inventario.']},
  'inventario-a2': {d: 1.881, lines: ['Y se entera', 'cuando ya se acabó.']},
  'inventario-s1': {d: 3.082, lines: ['Con PlanPy, lo busca', 'y sabe cuánto le queda.']},
  'inventario-s2': {d: 2.351, lines: ['Y desde el celular,', 'consulta lo que tiene.']},
  cta: {d: 3.474, lines: []},
};

const clipOf = (angle: Angle, beat: BeatId) => (beat === 'cta' ? 'cta' : beat === 's2' && angle !== 'inventario' ? 'casa-s2' : `${angle}-${beat}`);
const voFrames = (clip: string) => Math.ceil((VO[clip].d / RATE) * FPS_V5);

const BEATS: BeatId[] = ['p', 'a1', 'a2', 's1', 's2', 'cta'];
export const timeline = (angle: Angle) => {
  let from = 0;
  return BEATS.map((beat) => {
    const clip = clipOf(angle, beat);
    const vf = voFrames(clip);
    const lead = beat === 'cta' ? 10 : LEAD;
    const len = lead + vf + (beat === 'cta' ? 42 : TAIL);
    const b = {beat, clip, from, len, lead, vf};
    from += len;
    return b;
  });
};
export const durationV5 = (angle: Angle) => timeline(angle).reduce((a, b) => a + b.len, 0);

export const adV5Schema = z.object({angle: z.enum(['cierre', 'caja', 'inventario'])});

const PEDIDO: CuadernoLine[] = [
  {t: 'Pedido proveedor', bold: true},
  {t: 'Arroz ........... 2 pacas'},
  {t: 'Panela .......... 1 caja'},
  {t: 'Leche ........... ¿cuánta?'},
  {t: 'Aceite .......... ¿?'},
];

const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 0.6}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// Entrada de cada bloque: punch-in con desenfoque que se resuelve en 6 frames.
const Punch: React.FC<{children: React.ReactNode; strong?: boolean}> = ({children, strong}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 7], [strong ? 1.3 : 1.14, 1], {extrapolateRight: 'clamp'});
  const blur = interpolate(frame, [0, 5], [8, 0], {extrapolateRight: 'clamp'});
  const push = interpolate(frame, [7, 120], [1, 1.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flash = strong ? interpolate(frame, [0, 2, 6], [0.9, 0.9, 0], {extrapolateRight: 'clamp'}) : 0;
  return (
    <AbsoluteFill style={{transform: `scale(${s * push})`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined}}>
      {children}
      {flash > 0 ? <AbsoluteFill style={{background: '#fff', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

const Scene: React.FC<{children?: React.ReactNode; day?: boolean; shelves?: boolean}> = ({children, day, shelves}) => {
  const handheld = useHandheld(0.6);
  const frame = useCurrentFrame();
  const pan = shelves ? `translateX(${interpolate(frame, [0, 90], [60, -60])}px) scale(1.12)` : '';
  return (
    <AbsoluteFill style={{transform: `${handheld} ${pan}`}}>
      <Tienda blur={shelves ? 3 : 9} />
      {day ? <DayLight /> : null}
      {children}
    </AbsoluteFill>
  );
};

// Visual + efectos de cada bloque. `ui` es el frame clave de la acción en pantalla.
const Beat: React.FC<{angle: Angle; beat: BeatId; lead: number; vf: number}> = ({angle, beat, lead, vf}) => {
  const inv = angle === 'inventario';
  if (beat === 's2') {
    return (
      <>
        <Casa />
        <Phone enter={-4} y={600} scale={0.82} rotate={-4}>
          {inv ? <StockMobile /> : <ResumenMobile />}
        </Phone>
        <Sfx at={2} name="pop" volume={0.5} />
        <Sfx at={lead + vf + TAIL - 26} name="riser" volume={0.35} />
      </>
    );
  }
  if (beat === 's1') {
    const act = Math.round(lead + vf * 0.62);
    return (
      <Scene day={inv}>
        <Desktop zoom={{at: 2, to: 1.35, x: 930, y: 960}}>
          {angle === 'cierre' ? <CierreDesktop clickAt={act} /> : angle === 'caja' ? <MovimientosDesktop clickAt={act} /> : <InventarioDesktop typeAt={24} />}
        </Desktop>
        {inv ? (
          <>
            <Sfx at={16} name="click" />
            <Sfx at={24} name="typing" volume={0.5} />
            <Sfx at={50} name="ding" volume={0.45} />
          </>
        ) : (
          <>
            <Sfx at={act} name="click" />
            <Sfx at={act + 2} name="ding" volume={0.45} />
          </>
        )}
      </Scene>
    );
  }
  if (inv) {
    if (beat === 'a2') {
      return (
        <Scene day>
          <Cuaderno writeStart={-200} lines={PEDIDO} circleAt={8} />
          <Sfx at={8} name="scribble" volume={0.5} />
        </Scene>
      );
    }
    return <Scene day shelves />;
  }
  if (beat === 'p' || (beat === 'a2' && angle === 'caja')) {
    return (
      <Scene>
        <BilletesCO every={5} />
        {Array.from({length: 8}, (_, i) => (
          <Sfx key={i} at={i * 5 + 3} name="flick" volume={0.35} />
        ))}
      </Scene>
    );
  }
  if (beat === 'a1') {
    return (
      <Scene>
        <Cuaderno writeStart={-200} circleAt={8} />
        <Sfx at={8} name="scribble" volume={0.5} />
      </Scene>
    );
  }
  return (
    <Scene>
      <Phone enter={-6} x={190} y={560} scale={0.8} rotate={4}>
        <LockScreen notifAt={6} />
      </Phone>
      <Sfx at={6} name="notif" volume={0.55} />
    </Scene>
  );
};

const Music: React.FC<{angle: Angle; total: number}> = ({angle, total}) => {
  const tl = timeline(angle);
  return (
    <Audio
      src={staticFile('music/cama-112bpm.wav')}
      volume={(f) => {
        // ducking: la música baja mientras habla la voz
        const speaking = tl.some((b) => f >= b.from + b.lead - 4 && f <= b.from + b.lead + b.vf + 4);
        const fadeOut = interpolate(f, [total - 24, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (speaking ? 0.12 : 0.3) * fadeOut;
      }}
    />
  );
};

export const PlanpyAdV5: React.FC<z.infer<typeof adV5Schema>> = ({angle}) => {
  const tl = timeline(angle);
  const total = durationV5(angle);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.map(({beat, clip, from, len, lead, vf}, i) => (
        <Sequence key={beat} from={from} durationInFrames={len}>
          {beat === 'cta' ? (
            <>
              <Cierre devices="En computador y celular, sin instalar nada." />
              {[4, 14, 24, 52].map((a) => (
                <Sfx key={a} at={a} name="pop" volume={0.4} />
              ))}
            </>
          ) : (
            <>
              <Punch strong={i === 0}>
                <Beat angle={angle} beat={beat} lead={lead} vf={vf} />
                <Texture strength={0.7} />
              </Punch>
              <Karaoke lines={VO[clip].lines} start={lead} voFrames={vf} duration={len} size={beat === 'p' ? 76 : 66} top={beat === 'p' ? 260 : 200} />
            </>
          )}
          <Sfx at={0} name={i === 0 ? 'impact' : 'whoosh'} volume={i === 0 ? 0.8 : 0.35} />
          <Sequence from={lead} layout="none">
            <Audio src={staticFile(`voz/${clip}.mp3`)} playbackRate={RATE} />
          </Sequence>
        </Sequence>
      ))}
      <Music angle={angle} total={total} />
    </AbsoluteFill>
  );
};
