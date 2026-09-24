import {Composition} from 'remotion';
import {PlanpyAd, planpyAdSchema, AD_DURATION, FPS} from './PlanpyAd';
import {PlanpyAdV2, adV2Schema, DURATION_V2, FPS_V2} from './v2/AdV2';
import {PlanpyAdV4, adV4Schema, DURATION_V4, FPS_V4} from './v4/AdV4';
import {PlanpyAdV5, adV5Schema, durationV5, FPS_V5} from './v5/AdV5';
import {PlanpyAdV6, adV6Schema, durationV6, FPS_V6} from './v6/AdV6';
import {PlanpyAdV7, DURATION_V7, durationV7, FPS_V7} from './v7/AdV7';
import {PlanpyAdV9, durationV9, FPS_V9} from './v9/AdV9';

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
      {/* V6 — servicios (agenda + WhatsApp), H1 de cada rubro. */}
      {(['barberia', 'salon', 'mascotas'] as const).map((rubro) => (
        <Composition
          key={`v6-${rubro}`}
          id={`PLANPY-CO-VIDA-AGENDA-${rubro.toUpperCase()}-V6-H1`}
          component={PlanpyAdV6}
          durationInFrames={durationV6(rubro)}
          fps={FPS_V6}
          width={1080}
          height={1920}
          schema={adV6Schema}
          defaultProps={{rubro}}
        />
      ))}
      {/* V7 — barbería H1 con tomas realistas de Higgsfield. */}
      <Composition id="PLANPY-CO-VIDA-AGENDA-BARBERIA-V7-H1" component={PlanpyAdV7} durationInFrames={DURATION_V7} fps={FPS_V7} width={1080} height={1920} defaultProps={{rubro: 'barberia' as const}} />
      <Composition id="PLANPY-CO-VIDA-AGENDA-MASCOTAS-V8-H1" component={PlanpyAdV7} durationInFrames={durationV7('mascotas')} fps={FPS_V7} width={1080} height={1920} defaultProps={{rubro: 'mascotas' as const}} />
      {/* V9 — proveedores que llaman en la noche (VIDA), versiones C y A. */}
      <Composition id="PLANPY-CO-VIDA-PROVEEDORES-V9-C" component={PlanpyAdV9} durationInFrames={durationV9('C')} fps={FPS_V9} width={1080} height={1920} defaultProps={{version: 'C' as const}} />
      <Composition id="PLANPY-CO-VIDA-PROVEEDORES-V9-A" component={PlanpyAdV9} durationInFrames={durationV9('A')} fps={FPS_V9} width={1080} height={1920} defaultProps={{version: 'A' as const}} />
    </>
  );
};
