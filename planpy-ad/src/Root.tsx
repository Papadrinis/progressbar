import {Composition} from 'remotion';
import {PlanpyAd, planpyAdSchema, AD_DURATION, FPS} from './PlanpyAd';
import {PlanpyAdV2, adV2Schema, DURATION_V2, FPS_V2} from './v2/AdV2';
import {PlanpyAdV4, adV4Schema, DURATION_V4, FPS_V4} from './v4/AdV4';
import {PlanpyAdV5, adV5Schema, durationV5, FPS_V5} from './v5/AdV5';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* V1 — Don Hernán, tienda de barrio, Bogotá. Spot de marca, 25 s. */}
      <Composition
        id="PLANPY-CO-VIDA-CIERRE-VIDEO-V1"
        component={PlanpyAd}
        durationInFrames={AD_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        schema={planpyAdSchema}
        defaultProps={{hookFootage: null, productFootage: null, voiceover: null, music: null}}
      />
      {/* V2 — mismo cuerpo, tres ganchos de respuesta directa. 30 s. */}
      {(['h1', 'h2', 'h3'] as const).map((hook) => (
        <Composition
          key={hook}
          id={`PLANPY-CO-VIDA-CIERRE-VIDEO-V2-${hook.toUpperCase()}`}
          component={PlanpyAdV2}
          durationInFrames={DURATION_V2}
          fps={FPS_V2}
          width={1080}
          height={1920}
          schema={adV2Schema}
          defaultProps={{hook, voiceover: null, music: null}}
        />
      ))}
      {/* V4 — PAS, 26 s. Computador = gestión, celular = consulta. Un ángulo por video. */}
      {(['cierre', 'caja', 'inventario'] as const).map((angle) => (
        <Composition
          key={angle}
          id={`PLANPY-CO-VIDA-PAS-${angle.toUpperCase()}-V4`}
          component={PlanpyAdV4}
          durationInFrames={DURATION_V4}
          fps={FPS_V4}
          width={1080}
          height={1920}
          schema={adV4Schema}
          defaultProps={{angle, voz: false, voiceover: null, music: null}}
        />
      ))}
      {/* V5 — PAS montado sobre la voz: ~19 s, música, efectos, subtítulos sincronizados. */}
      {(['cierre', 'caja', 'inventario'] as const).map((angle) => (
        <Composition
          key={`v5-${angle}`}
          id={`PLANPY-CO-VIDA-PAS-${angle.toUpperCase()}-V5`}
          component={PlanpyAdV5}
          durationInFrames={durationV5(angle)}
          fps={FPS_V5}
          width={1080}
          height={1920}
          schema={adV5Schema}
          defaultProps={{angle}}
        />
      ))}
    </>
  );
};
