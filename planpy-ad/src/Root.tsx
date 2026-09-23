import {Composition} from 'remotion';
import {PlanpyAd, planpyAdSchema, AD_DURATION, FPS} from './PlanpyAd';

// PLANPY_CO_VIDA_CIERRE_VIDEO_V1 — persona: Don Hernán (El Encerrado), tienda de barrio, Bogotá.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PLANPY-CO-VIDA-CIERRE-VIDEO-V1"
      component={PlanpyAd}
      durationInFrames={AD_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      schema={planpyAdSchema}
      defaultProps={{
        hookFootage: null,
        productFootage: null,
        voiceover: null,
        music: null,
      }}
    />
  );
};
