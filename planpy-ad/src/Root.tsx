import {Composition} from 'remotion';
import {PlanpyAd, planpyAdSchema, AD_DURATION, FPS} from './PlanpyAd';
import {PlanpyAdV2, adV2Schema, DURATION_V2, FPS_V2} from './v2/AdV2';

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
    </>
  );
};
