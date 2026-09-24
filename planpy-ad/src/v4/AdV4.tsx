import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Billetes} from '../v2/Billetes';
import {Phone} from '../v2/Phone';
import {LockScreen} from '../v2/screens';
import {Cuaderno, CuadernoLine} from '../components/Cuaderno';
import {Texture, useHandheld} from '../components/Texture';
import {Tienda} from '../components/Tienda';
import {Cierre} from '../scenes/Cierre';
import {CaptionBox} from './CaptionBox';
import {Casa, DayLight} from './Casa';
import {Desktop} from './Desktop';
import {CierreDesktop, InventarioDesktop, MovimientosDesktop} from './desktopScreens';
import {ResumenMobile, StockMobile} from './mobileScreens';

// PLANPY_CO_VIDA_PAS_VIDEO_V4 — Colombia (usted) · eje VIDA · Don Hernán, tienda de barrio.
// Estructura PAS: Problema → Agitación → Solución (computador = gestión, celular = consulta) → CTA.
// Tres problemas distintos sobre el mismo esqueleto: test de ángulo.
export const FPS_V4 = 30;

// Cada tarjeta dura al menos (palabras ÷ 3) + 1 s.
const B = {
  p: [0, 110],
  a1: [110, 230],
  a2: [230, 335],
  s1: [335, 485],
  s2: [485, 600],
  cta: [600, 780],
} as const;
export const DURATION_V4 = B.cta[1];
const len = (b: readonly [number, number]) => b[1] - b[0];

export const adV4Schema = z.object({
  angle: z.enum(['cierre', 'caja', 'inventario']),
  voiceover: z.string().nullable(),
  music: z.string().nullable(),
});
type Angle = z.infer<typeof adV4Schema>['angle'];

const PEDIDO: CuadernoLine[] = [
  {t: 'Pedido proveedor', bold: true},
  {t: 'Arroz ........... 2 pacas'},
  {t: 'Panela .......... 1 caja'},
  {t: 'Leche ........... ¿cuánta?'},
  {t: 'Aceite .......... ¿?'},
];

const COPY: Record<Angle, {p: string[]; a1: string[]; a2: string[]; s1: string[]; s2: string[]}> = {
  cierre: {
    p: ['¿Cuánto ganó hoy?'],
    a1: ['El cuaderno', 'no le responde eso.'],
    a2: ['Y otra noche,', 'llega tarde a comer.'],
    s1: ['Con *PlanPy*, cierra la caja', 'en unos 10 minutos.'],
    s2: ['Y desde la casa,', 'mira cómo le fue.'],
  },
  caja: {
    p: ['La caja no cuadró.', 'Otra vez.'],
    a1: ['¿Un cambio mal dado?', '¿Un gasto sin anotar?'],
    a2: ['Y usted, recontando', 'a las 11 p. m.'],
    s1: ['Con *PlanPy*, cada venta', 'y cada gasto, registrados.'],
    s2: ['Y desde la casa,', 'mira cómo le fue.'],
  },
  inventario: {
    p: ['—¿Tiene aceite?', '—Déjeme mirar atrás…'],
    a1: ['Ir a mirar:', 'ese es su inventario.'],
    a2: ['Y se entera', 'cuando ya se acabó.'],
    s1: ['Con *PlanPy*, lo busca', 'y sabe cuánto le queda.'],
    s2: ['Y desde el celular,', 'consulta lo que tiene.'],
  },
};

const Scene: React.FC<{children?: React.ReactNode; day?: boolean; shelves?: boolean}> = ({children, day, shelves}) => {
  const handheld = useHandheld(0.5);
  const frame = useCurrentFrame();
  // en los planos de estantería la cámara recorre despacio, como buscando el producto
  const pan = shelves ? `translateX(${interpolate(frame, [0, 120], [40, -40])}px) scale(1.12)` : '';
  return (
    <AbsoluteFill style={{transform: `${handheld} ${pan}`}}>
      <Tienda blur={shelves ? 3 : 9} />
      {day ? <DayLight /> : null}
      {children}
    </AbsoluteFill>
  );
};

const Visual: React.FC<{angle: Angle; beat: 'p' | 'a1' | 'a2' | 's1' | 's2'}> = ({angle, beat}) => {
  if (beat === 's2') {
    return (
      <AbsoluteFill>
        <Casa />
        <Phone enter={0} y={600} scale={0.82} rotate={-4}>
          {angle === 'inventario' ? <StockMobile /> : <ResumenMobile />}
        </Phone>
      </AbsoluteFill>
    );
  }
  if (beat === 's1') {
    const zoom = {at: 30, to: 1.35, x: 930, y: 960};
    return (
      <Scene day={angle === 'inventario'}>
        <Desktop zoom={zoom}>
          {angle === 'cierre' ? <CierreDesktop clickAt={100} /> : angle === 'caja' ? <MovimientosDesktop clickAt={95} /> : <InventarioDesktop typeAt={70} />}
        </Desktop>
      </Scene>
    );
  }
  if (angle === 'inventario') {
    if (beat === 'a2') {
      return (
        <Scene day>
          <Cuaderno writeStart={-200} lines={PEDIDO} circleAt={30} />
        </Scene>
      );
    }
    return <Scene day shelves />;
  }
  if (beat === 'p') {
    return (
      <Scene>
        <Billetes every={9} />
      </Scene>
    );
  }
  if (beat === 'a1') {
    return (
      <Scene>
        <Cuaderno writeStart={-200} circleAt={30} />
      </Scene>
    );
  }
  // a2
  if (angle === 'caja') {
    return (
      <Scene>
        <Billetes every={9} />
      </Scene>
    );
  }
  return (
    <Scene>
      <Phone enter={0} x={190} y={560} scale={0.8} rotate={4}>
        <LockScreen notifAt={12} />
      </Phone>
    </Scene>
  );
};

export const PlanpyAdV4: React.FC<z.infer<typeof adV4Schema>> = ({angle, voiceover, music}) => {
  const c = COPY[angle];
  const beats = ['p', 'a1', 'a2', 's1', 's2'] as const;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {beats.map((beat) => (
        <Sequence key={beat} from={B[beat][0]} durationInFrames={len(B[beat])}>
          <Visual angle={angle} beat={beat} />
          <Texture strength={0.8} />
          <CaptionBox
            duration={len(B[beat])}
            lines={c[beat]}
            size={beat === 'p' ? (angle === 'inventario' ? 72 : 84) : 66}
            top={beat === 'p' ? 300 : 200}
            pop={beat === 'p'}
          />
        </Sequence>
      ))}
      <Sequence from={B.cta[0]} durationInFrames={len(B.cta)}>
        <Cierre devices="En computador y celular, sin instalar nada." />
      </Sequence>
      {voiceover ? <Audio src={staticFile(voiceover)} /> : null}
      {music ? <Audio src={staticFile(music)} volume={0.18} /> : null}
    </AbsoluteFill>
  );
};
