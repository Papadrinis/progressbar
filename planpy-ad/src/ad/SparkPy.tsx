import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {AbsoluteFill, Audio, CalculateMetadataFunction, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Texture} from '../components/Texture';
import {Emoji, Sticker, Whip, WordPop} from '../v6/kit';
import {CierreDesde} from '../v6/screens';
import {anuncio, Anuncio, Extra, Momento} from './schema';
import {Llamada, Tarjeta} from './Tarjetas';

// SparkPy — una sola composición que monta cualquier anuncio a partir de public/ads/<ad>.json.
// Cada bloque dura lo que dura su voz (a velocidadVoz) + entrada + cola; el cierre (CTA) va siempre al final.
export const FPS_SPARKPY = 30;

export type SparkPyProps = {ad: string; datos?: Anuncio | null; duraciones?: number[] | null};

type Tramo = {i: number; from: number; len: number; lead: number; vf: number};

export const lineaDeTiempo = (datos: Anuncio, duraciones: number[]) => {
  let from = 0;
  const tramos: Tramo[] = [];
  const pasos = [...datos.bloques.map((b) => ({cola: b.cola ?? 6, lead: 3})), {cola: datos.cierre.cola, lead: 8}];
  pasos.forEach((p, i) => {
    const vf = Math.ceil((duraciones[i] / datos.velocidadVoz) * FPS_SPARKPY);
    const len = p.lead + vf + p.cola;
    tramos.push({i, from, len, lead: p.lead, vf});
    from += len;
  });
  return {tramos, total: from};
};

export const calcularSparkPy: CalculateMetadataFunction<SparkPyProps> = async ({props}) => {
  const res = await fetch(staticFile(`ads/${props.ad}.json`));
  if (!res.ok) throw new Error(`SparkPy: no encuentro public/ads/${props.ad}.json`);
  const parsed = anuncio.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error(`SparkPy: ads/${props.ad}.json no es válido — ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  const datos = parsed.data;
  const voces = [...datos.bloques.map((b) => ({voz: b.voz, duracion: b.duracion})), datos.cierre];
  const duraciones = await Promise.all(voces.map((v) => v.duracion ?? getAudioDurationInSeconds(staticFile(v.voz))));
  const {total} = lineaDeTiempo(datos, duraciones);
  return {durationInFrames: total, props: {...props, datos, duraciones}};
};

const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 0.6}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const esFoto = (src: string) => /\.(png|jpe?g|webp)$/i.test(src);

const Toma: React.FC<{src: string}> = ({src}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {esFoto(src) ? (
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(frame, [0, 150], [1.02, 1.1])})`}} />
      ) : (
        <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      )}
      <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0) 40%)'}} />
    </AbsoluteFill>
  );
};

const aFrame = (m: Momento, lead: number, vf: number) => (typeof m === 'number' ? m : Math.round(lead + (vf * parseFloat(m)) / 100));

const ExtraEl: React.FC<{x: Extra; lead: number; vf: number}> = ({x, lead, vf}) => {
  switch (x.tipo) {
    case 'sfx':
      return <Sfx at={aFrame(x.en, lead, vf)} name={x.nombre} volume={x.volumen ?? 0.4} />;
    case 'sticker': {
      const at = aFrame(x.en, lead, vf);
      return (
        <>
          <Sticker at={at} x={x.x} y={x.y} rot={x.giro ?? -6} size={x.tamano ?? 62} bg={x.fondo ?? '#fff'} color={x.color ?? '#141414'}>
            {x.texto}
          </Sticker>
          {x.sfx ? <Sfx at={at} name={x.sfx} volume={x.volumenSfx ?? 0.4} /> : null}
        </>
      );
    }
    case 'emoji':
      return (
        <Emoji at={aFrame(x.en, lead, vf)} x={x.x} y={x.y} size={x.tamano ?? 120} spin={x.giro ?? 0}>
          {x.texto}
        </Emoji>
      );
    case 'tarjeta': {
      const at = aFrame(x.en, lead, vf);
      const sonido = x.sonido ?? true;
      const celular = x.formato === 'celular';
      return (
        <>
          <Tarjeta at={at} formato={x.formato} titulo={x.titulo} seccion={x.seccion} menu={x.menu} filas={x.filas} resaltar={x.resaltar} listo={x.listo} />
          {sonido ? (
            <>
              <Sfx at={at} name="whoosh" volume={0.35} />
              {celular ? <Sfx at={at + 14} name="ping" volume={0.45} /> : x.filas.map((_, k) => <Sfx key={k} at={at + 10 + k * 6} name="pop" volume={0.35} />)}
              {!celular || x.listo ? <Sfx at={at + (celular ? 22 : 38)} name="ding" volume={0.4} /> : null}
            </>
          ) : null}
        </>
      );
    }
    case 'llamada': {
      const at = x.en === undefined ? 4 : aFrame(x.en, lead, vf);
      return (
        <>
          <Llamada nombre={x.nombre} hora={x.hora} icono={x.icono} at={at} />
          {x.vibrar === false ? null : [0, 30, 60, 90].map((d) => <Sfx key={d} at={at + d} name="vibrate" volume={0.45} />)}
        </>
      );
    }
  }
};

export const SparkPy: React.FC<SparkPyProps> = ({datos, duraciones}) => {
  if (!datos || !duraciones) return <AbsoluteFill style={{background: '#000'}} />;
  const {tramos, total} = lineaDeTiempo(datos, duraciones);
  const cta = tramos[tramos.length - 1];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {datos.bloques.map((b, i) => {
        const t = tramos[i];
        return (
          <Sequence key={b.id} name={b.id} from={t.from} durationInFrames={t.len}>
            <Whip dir={i % 2 ? -1 : 1} flash={i === 0}>
              <Toma src={b.toma} />
              <Texture strength={0.25} />
            </Whip>
            {b.extras.map((x, k) => (
              <ExtraEl key={k} x={x} lead={t.lead} vf={t.vf} />
            ))}
            <WordPop lines={b.lineas} keys={b.claves.map((k) => k.toLowerCase())} start={t.lead} voFrames={t.vf} size={i === 0 ? 76 : 70} top={i === 0 ? 120 : 140} />
            <Sfx at={0} name={i === 0 ? 'impact' : 'whoosh'} volume={i === 0 ? 0.6 : 0.35} />
            <Sequence from={t.lead} layout="none">
              <Audio src={staticFile(b.voz)} playbackRate={datos.velocidadVoz} volume={b.volumenVoz ?? 1} />
            </Sequence>
          </Sequence>
        );
      })}
      <Sequence name="cierre" from={cta.from} durationInFrames={cta.len}>
        <Whip>
          <CierreDesde />
          {[2, 10, 20, 40].map((a) => (
            <Sfx key={a} at={a} name="pop" volume={0.4} />
          ))}
        </Whip>
        <Sfx at={0} name="whoosh" volume={0.35} />
        <Sequence from={cta.lead} layout="none">
          <Audio src={staticFile(datos.cierre.voz)} playbackRate={datos.velocidadVoz} />
        </Sequence>
      </Sequence>
      {datos.musica ? (
        <Audio
          src={staticFile(datos.musica.src)}
          volume={(f) => {
            const m = datos.musica!;
            const hablando = tramos.some((t) => f >= t.from + t.lead - 3 && f <= t.from + t.lead + t.vf + 3);
            const salida = interpolate(f, [total - 24, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (hablando ? m.bajo : m.volumen) * salida;
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
