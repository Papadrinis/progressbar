import {AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {BRAND_GREEN, SANS} from '../brand';
import {Caption} from '../components/Caption';
import {Cuaderno} from '../components/Cuaderno';
import {Texture, useHandheld} from '../components/Texture';
import {Tienda} from '../components/Tienda';
import {Cierre} from '../scenes/Cierre';
import {Billetes} from './Billetes';
import {Phone} from './Phone';
import {Reja, useSlamShake} from './Reja';
import {ChatScreen, CierreScreen, LockScreen, VentaScreen} from './screens';

// PLANPY_CO_VIDA_CIERRE_VIDEO_V2 — Colombia (usted) · VIDA · Don Hernán, tienda de barrio, Bogotá.
// Tres ganchos de respuesta directa sobre el mismo cuerpo: solo cambia 0–2 s (test de una variable).
export const FPS_V2 = 30;
export const DURATION_V2 = 30 * FPS_V2;

export const adV2Schema = z.object({
  hook: z.enum(['h1', 'h2', 'h3']),
  voiceover: z.string().nullable(), // locución con acento colombiano (ver README)
  music: z.string().nullable(),
});

const T = {
  hook: [0, 60],
  vida: [60, 120],
  jornada: [120, 240],
  venta: [240, 450],
  cierre: [450, 630],
  despues: [630, 750],
  cta: [750, DURATION_V2],
} as const;
const len = (b: readonly [number, number]) => b[1] - b[0];

// Zoom de golpe en los cortes: ritmo de respuesta directa, no de spot de marca.
const PUNCHES = [0, 60, 120];
const usePunch = () => {
  const frame = useCurrentFrame();
  return 1 + PUNCHES.reduce((a, p) => a + interpolate(frame, [p, p + 4, p + 45, p + 58], [0, 0.09, 0.05, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), 0);
};

const CuadernoCae: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 11, stiffness: 220}, durationInFrames: 18});
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - s) * -900}px) rotate(${(1 - s) * 8}deg)`, opacity: frame >= at ? 1 : 0}}>
      <Cuaderno writeStart={-200} />
    </AbsoluteFill>
  );
};

const Flashback: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 3, 10], [0, 0.85, 0], {extrapolateRight: 'clamp'});
  const flashOut = interpolate(frame, [len(T.venta) - 8, len(T.venta) - 3, len(T.venta)], [0, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      {/* de día: la misma tienda con la luz de la calle */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, rgba(255,244,222,0.55), rgba(255,236,205,0.18) 70%)', mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', top: 96, left: 80, fontFamily: SANS, fontSize: 30, fontWeight: 600, color: '#1b1b1b', background: 'rgba(255,250,240,0.9)', borderRadius: 999, padding: '10px 24px'}}>
        Más temprano, ese mismo día
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(flash, flashOut)}} />
    </AbsoluteFill>
  );
};

const HookVisual: React.FC<{hook: 'h1' | 'h2' | 'h3'}> = ({hook}) => {
  if (hook === 'h1') {
    return (
      <Sequence durationInFrames={16}>
        <Reja start={0} slam />
      </Sequence>
    );
  }
  if (hook === 'h2') return <Billetes />;
  return (
    <Phone enter={-40} y={760} taps={[28]} thumbAt={{x: 330, y: 1000}}>
      <CierreScreen rowsStart={-100} closedAt={28} />
    </Phone>
  );
};

const HOOK_CAPTION: Record<'h1' | 'h2' | 'h3', {lines: string[]; size: number}> = {
  h1: {lines: ['DEJE DE CERRAR', 'LA CAJA A LAS', '11 P. M.'], size: 100},
  h2: {lines: ['¿Cuánto ganó hoy?', 'No lo que hay en la caja:', 'lo que le quedó.'], size: 80},
  h3: {lines: ['Cierre la caja en', 'unos 10 minutos.', 'Desde el celular.'], size: 80},
};

const Escena: React.FC<{hook: 'h1' | 'h2' | 'h3'}> = ({hook}) => {
  const handheld = useHandheld(1.2);
  const shake = useSlamShake(0);
  const punch = usePunch();
  return (
    <AbsoluteFill style={{transform: `${hook === 'h1' ? shake : ''} ${handheld} scale(${punch})`, transformOrigin: '50% 55%'}}>
      <Tienda lampOffAt={T.despues[0] + 60} />

      <Sequence durationInFrames={len(T.hook)}>
        <HookVisual hook={hook} />
      </Sequence>

      {hook === 'h1' ? (
        <Sequence from={10} durationInFrames={T.venta[0] - 10}>
          <Cuaderno writeStart={0} />
        </Sequence>
      ) : (
        <Sequence from={T.vida[0]} durationInFrames={T.venta[0] - T.vida[0]}>
          <CuadernoCae at={0} />
        </Sequence>
      )}
      <Sequence from={T.cierre[0]} durationInFrames={T.cta[0] - T.cierre[0]}>
        <Cuaderno writeStart={-200} />
      </Sequence>

      {/* el mensaje de la hija: lo mira y lo pone boca abajo */}
      <Sequence from={T.jornada[0]} durationInFrames={len(T.jornada)}>
        <Phone enter={0} x={420} y={640} scale={0.5} rotate={9} flipAt={78}>
          <LockScreen notifAt={16} />
        </Phone>
      </Sequence>

      {/* flashback: registra la venta mientras atiende */}
      <Sequence from={T.venta[0]} durationInFrames={len(T.venta)}>
        <Phone enter={4} exitAt={len(T.venta) - 20} taps={[48, 74, 100, 142]} thumbAt={{x: 330, y: 1010}}>
          <VentaScreen taps={[[1, 48], [2, 74], [3, 100]]} cobrarAt={142} />
        </Phone>
        <Flashback />
      </Sequence>

      {/* de noche: el cierre ya está hecho */}
      <Sequence from={T.cierre[0]} durationInFrames={len(T.cierre)}>
        <Phone enter={0} exitAt={len(T.cierre) - 18} taps={[110]}>
          <CierreScreen rowsStart={16} closedAt={110} />
        </Phone>
      </Sequence>

      {/* el después: contesta, apaga la luz, baja la reja */}
      <Sequence from={T.despues[0]} durationInFrames={len(T.despues)}>
        <Phone enter={0} exitAt={56} taps={[30]} thumbAt={{x: 420, y: 1150}}>
          <ChatScreen replyAt={30} />
        </Phone>
        <Reja start={66} duration={50} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PlanpyAdV2: React.FC<z.infer<typeof adV2Schema>> = ({hook, voiceover, music}) => {
  const hc = HOOK_CAPTION[hook];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={T.cta[0]}>
        <Escena hook={hook} />
        <Texture />
      </Sequence>

      {/* GANCHO — respuesta directa, sin marca */}
      <Sequence durationInFrames={len(T.hook)}>
        <Caption duration={len(T.hook)} top={hook === 'h1' ? 260 : 170} size={hc.size} lines={hc.lines} />
      </Sequence>

      <Sequence from={T.vida[0]} durationInFrames={len(T.vida)}>
        <Caption duration={len(T.vida)} top={200} size={76} lines={['¿Su negocio le está', 'quitando la vida?', 'PlanPy se la devuelve.']} accent={BRAND_GREEN} />
      </Sequence>
      <Sequence from={T.jornada[0]} durationInFrames={len(T.jornada)}>
        <Caption duration={len(T.jornada)} top={200} size={80} lines={['Ahí empieza', 'la otra jornada.']} />
      </Sequence>
      <Sequence from={T.venta[0]} durationInFrames={110}>
        <Caption duration={110} top={190} size={72} lines={['Cada venta, anotada', 'mientras atiende.']} />
      </Sequence>
      <Sequence from={T.venta[0] + 110} durationInFrames={len(T.venta) - 110}>
        <Caption duration={len(T.venta) - 110} top={190} size={72} lines={['Sin instalar nada.']} />
      </Sequence>
      <Sequence from={T.cierre[0]} durationInFrames={len(T.cierre)}>
        <Caption
          duration={len(T.cierre)}
          top={190}
          size={76}
          lines={hook === 'h3' ? ['Y ve lo que', 'le quedó del día.'] : ['Cierre de caja', 'en unos 10 minutos.']}
        />
      </Sequence>
      <Sequence from={T.despues[0]} durationInFrames={len(T.despues)}>
        <Caption duration={len(T.despues)} top={190} size={80} lines={['Y llega a comer', 'con la familia.']} />
      </Sequence>

      <Sequence from={T.cta[0]} durationInFrames={len(T.cta)}>
        <Cierre />
      </Sequence>

      {voiceover ? <Audio src={staticFile(voiceover)} /> : null}
      {music ? <Audio src={staticFile(music)} volume={0.18} /> : null}
    </AbsoluteFill>
  );
};
