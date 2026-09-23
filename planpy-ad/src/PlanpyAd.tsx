import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {z} from 'zod';
import {Caption} from './components/Caption';
import {Celular} from './components/Celular';
import {Cuaderno} from './components/Cuaderno';
import {Tienda} from './components/Tienda';
import {Texture, useHandheld} from './components/Texture';
import {Cierre} from './scenes/Cierre';
import {UI_LIME} from './brand';

export const FPS = 30;
export const AD_DURATION = 25 * FPS;

// Material real opcional (rutas dentro de /public). Si no se pasa, se usa el sustituto en código.
export const planpyAdSchema = z.object({
  hookFootage: z.string().nullable(), // tienda real de noche, 0–8 s
  productFootage: z.string().nullable(), // grabación de pantalla de la cuenta demo, vertical
  voiceover: z.string().nullable(), // locución con acento colombiano
  music: z.string().nullable(),
});

// Beats (planpy-copy/references/formatos.md, pieza de 25 s: producto entra a los 8 s).
const T = {
  hook: [0, 95],
  dolor: [95, 240],
  giro: [240, 450],
  prueba: [450, 540],
  despues: [540, 600],
  cta: [600, AD_DURATION],
} as const;

const len = (b: readonly [number, number]) => b[1] - b[0];

const Escena: React.FC<z.infer<typeof planpyAdSchema>> = ({hookFootage, productFootage}) => {
  const shake = useHandheld(1);
  return (
    <AbsoluteFill style={{transform: shake, transformOrigin: '50% 60%'}}>
      {hookFootage ? (
        <OffthreadVideo src={staticFile(hookFootage)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : (
        <>
          <Tienda lampOffAt={T.despues[0] + 22} />
          <Cuaderno writeStart={6} />
        </>
      )}
      <Sequence from={T.giro[0]} durationInFrames={T.despues[0] - T.giro[0] + 30}>
        <Celular enter={0} closedAt={T.prueba[0] - T.giro[0] + 40} exitAt={T.despues[0] - T.giro[0] - 4} footage={productFootage} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PlanpyAd: React.FC<z.infer<typeof planpyAdSchema>> = (props) => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={T.cta[0]}>
        <Escena {...props} />
        <Texture />
      </Sequence>

      {/* GANCHO — la escena, sin marca ni logo */}
      <Sequence from={T.hook[0]} durationInFrames={48}>
        <Caption duration={48} lines={['Cerró la tienda.', 'Contó la plata.']} />
      </Sequence>
      <Sequence from={48} durationInFrames={T.hook[1] - 48}>
        <Caption duration={T.hook[1] - 48} lines={['Y sigue sin saber', 'si el día le fue bien.']} />
      </Sequence>

      {/* DOLOR — el cuaderno funciona y llega a su límite */}
      <Sequence from={T.dolor[0]} durationInFrames={70}>
        <Caption duration={70} size={72} lines={['La caja le dice cuánto hay.', 'No cuánto ganó.']} />
      </Sequence>
      <Sequence from={T.dolor[0] + 70} durationInFrames={len(T.dolor) - 70}>
        <Caption duration={len(T.dolor) - 70} size={72} lines={['El cuaderno lo guarda todo.', 'Pero no le contesta nada.']} />
      </Sequence>

      {/* GIRO — entra el producto en el celular */}
      <Sequence from={T.giro[0]} durationInFrames={90}>
        <Caption duration={90} top={180} size={76} lines={['Ahora el día', 'se cierra en el celular.']} />
      </Sequence>
      <Sequence from={T.giro[0] + 90} durationInFrames={len(T.giro) - 90}>
        <Caption duration={len(T.giro) - 90} top={180} size={76} lines={['Ventas, gastos y fiados.', 'Y lo que le quedó.']} accent={UI_LIME} />
      </Sequence>

      {/* PRUEBA — una tarea de tres segundos: cerrar la caja */}
      <Sequence from={T.prueba[0]} durationInFrames={len(T.prueba)}>
        <Caption duration={len(T.prueba)} top={180} size={76} lines={['Cierra la caja', 'en unos 10 minutos.']} />
      </Sequence>

      {/* DESPUÉS — misma tienda, mismo desorden. Cambia la postura, no la producción */}
      <Sequence from={T.despues[0]} durationInFrames={len(T.despues)}>
        <Caption duration={len(T.despues)} top={180} size={76} lines={['Apaga la luz.', 'Y se va para la casa.']} />
      </Sequence>

      {/* CTA — cierre de marca */}
      <Sequence from={T.cta[0]} durationInFrames={len(T.cta)}>
        <Cierre />
      </Sequence>

      {props.voiceover ? <Audio src={staticFile(props.voiceover)} /> : null}
      {props.music ? <Audio src={staticFile(props.music)} volume={0.18} /> : null}
    </AbsoluteFill>
  );
};
