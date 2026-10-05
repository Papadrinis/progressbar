import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS} from '../brand';
import {EMOJI} from '../v6/kit';
import {Salon} from '../v6/scenes';

// Escenas 2D planas dibujadas en código (estilo «Ilustración 2D animada en código»).
// Un bloque las usa con `"toma": "escena:<nombre>"`. Sin pantallas legibles: los celulares
// muestran la interfaz con las tarjetas de SparkPy, que llevan «Datos de ejemplo».

const cl = (f: number, a: number[], b: number[]) => interpolate(f, a, b, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const PIEL = '#c98d6a';
const PIEL_SOMBRA = '#b07656';
const PELO = '#3a2418';
const MECHAS = '#a86a3c';

type Gesto = 'neutral' | 'duda' | 'sonrisa';

// Valentina: mujer colombiana ~30, pelo largo ondulado castaño oscuro con mechas caramelo, raya al medio.
export const Valentina: React.FC<{x: number; y: number; scale?: number; ropa?: 'blazer' | 'delantal'; gesto?: Gesto; mano?: 'nada' | 'celular' | 'pluma'; mira?: number}> = ({
  x,
  y,
  scale = 1,
  ropa = 'blazer',
  gesto = 'neutral',
  mano = 'nada',
  mira = 0,
}) => {
  const frame = useCurrentFrame();
  const resp = Math.sin(frame / 22) * 4;
  const parpadeo = frame % 96 > 90 ? 0.1 : 1;
  const torso = ropa === 'blazer' ? '#2f3a56' : '#1f1f1f';
  const blusa = ropa === 'blazer' ? '#f4efe6' : '#f4efe6';
  const boca =
    gesto === 'sonrisa' ? 'M176 214 Q200 238 224 214 Q200 226 176 214 Z' : gesto === 'duda' ? 'M182 222 Q200 214 218 224' : 'M184 218 Q200 226 216 218';
  const ceja = gesto === 'duda' ? -6 : 0;
  return (
    <svg style={{position: 'absolute', left: x, top: y + resp, overflow: 'visible'}} width={400 * scale} height={760 * scale} viewBox="0 0 400 760">
      {/* pelo de atrás, largo y ondulado */}
      <path d="M92 150 Q70 330 110 470 Q130 520 120 560 L280 560 Q270 520 290 470 Q330 330 308 150 Q300 60 200 52 Q100 60 92 150 Z" fill={PELO} />
      <path d="M110 300 Q100 380 128 450" stroke={MECHAS} strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M292 300 Q302 380 272 450" stroke={MECHAS} strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* cuello y torso */}
      <rect x="176" y="250" width="48" height="60" rx="16" fill={PIEL_SOMBRA} />
      <path d="M70 760 Q74 360 200 320 Q326 360 330 760 Z" fill={torso} />
      <path d="M168 318 L200 400 L232 318 Q216 306 200 306 Q184 306 168 318 Z" fill={blusa} />
      {ropa === 'blazer' ? (
        <>
          <path d="M168 318 L200 420 L150 520 Z" fill="#26304a" />
          <path d="M232 318 L200 420 L250 520 Z" fill="#26304a" />
        </>
      ) : (
        <rect x="120" y="430" width="160" height="330" rx="18" fill="#2b2b2b" />
      )}
      <circle cx="200" cy="350" r="6" fill="#e9c46a" />
      {/* cara */}
      <ellipse cx="200" cy="170" rx="74" ry="92" fill={PIEL} />
      <g transform={`translate(${mira * 6} 0)`}>
        <ellipse cx="172" cy="168" rx="9" ry={9 * parpadeo} fill="#2a1a12" />
        <ellipse cx="228" cy="168" rx="9" ry={9 * parpadeo} fill="#2a1a12" />
      </g>
      <path d={`M156 ${146 + ceja} Q172 ${136 + ceja} 188 146`} stroke="#2a1a12" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d={`M212 146 Q228 ${136 + ceja} 244 ${146 + ceja}`} stroke="#2a1a12" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M200 176 Q194 196 204 198" stroke={PIEL_SOMBRA} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={boca} fill={gesto === 'sonrisa' ? '#fff' : 'none'} stroke="#9c3f3f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="160" cy="200" r="12" fill="#e08a7a" opacity="0.35" />
      <circle cx="240" cy="200" r="12" fill="#e08a7a" opacity="0.35" />
      {/* pelo de adelante con raya al medio */}
      <path d="M200 64 Q150 66 126 120 Q116 160 122 210 Q134 140 200 92 Z" fill={PELO} />
      <path d="M200 64 Q250 66 274 120 Q284 160 278 210 Q266 140 200 92 Z" fill={PELO} />
      <path d="M150 100 Q130 140 132 190" stroke={MECHAS} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M250 100 Q270 140 268 190" stroke={MECHAS} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="128" cy="196" r="7" fill="#e9c46a" />
      <circle cx="272" cy="196" r="7" fill="#e9c46a" />
      {/* mano */}
      {mano === 'celular' ? (
        <g transform="translate(250 430) rotate(-12)">
          <rect x="0" y="0" width="92" height="170" rx="16" fill="#151515" />
          <rect x="8" y="12" width="76" height="146" rx="10" fill="#2d3340" />
          <ellipse cx="46" cy="160" rx="40" ry="22" fill={PIEL} />
        </g>
      ) : mano === 'pluma' ? (
        <g transform={`translate(${236 + Math.sin(frame / 3) * 14} ${600 + Math.cos(frame / 4) * 4}) rotate(30)`}>
          <rect x="0" y="-70" width="10" height="90" rx="4" fill="#1d3557" />
          <ellipse cx="6" cy="22" rx="26" ry="18" fill={PIEL} />
        </g>
      ) : null}
    </svg>
  );
};

// Asesor del banco: camisa, corbata, gafas, carpeta.
const Asesor: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  const resp = Math.sin(frame / 25 + 1) * 3;
  return (
    <svg style={{position: 'absolute', left: x, top: y + resp, overflow: 'visible'}} width={380} height={720} viewBox="0 0 380 720">
      <path d="M50 720 Q56 330 190 300 Q324 330 330 720 Z" fill="#dfe6ee" />
      <path d="M180 306 L190 470 L200 306 Z" fill="#9b2c2c" />
      <rect x="166" y="230" width="48" height="70" rx="16" fill="#a8775a" />
      <ellipse cx="190" cy="160" rx="70" ry="86" fill="#b98463" />
      <path d="M120 140 Q130 70 190 66 Q252 70 262 140 Q240 104 190 102 Q140 104 120 140 Z" fill="#1d1a18" />
      <circle cx="164" cy="166" r="22" fill="none" stroke="#222" strokeWidth="5" />
      <circle cx="218" cy="166" r="22" fill="none" stroke="#222" strokeWidth="5" />
      <path d="M186 166 L196 166" stroke="#222" strokeWidth="5" />
      <circle cx="164" cy="166" r="6" fill="#222" />
      <circle cx="218" cy="166" r="6" fill="#222" />
      <path d="M170 214 Q190 222 210 214" stroke="#6b2e2e" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* carpeta */}
      <g transform="translate(40 470) rotate(-8)">
        <rect width="190" height="140" rx="10" fill="#e9b949" />
        <rect x="16" y="22" width="120" height="10" rx="5" fill="#fff" opacity="0.7" />
        <rect x="16" y="42" width="90" height="10" rx="5" fill="#fff" opacity="0.7" />
      </g>
    </svg>
  );
};

const Banco: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(#dfe9f2, #c7d6e3 70%)'}}>
    {/* ventanales y logo genérico, sin texto */}
    {[0, 1, 2].map((i) => (
      <div key={i} style={{position: 'absolute', left: 80 + i * 320, top: 470, width: 280, height: 520, borderRadius: 18, background: 'linear-gradient(#f6fbff, #d5e5f2)', border: '10px solid #b4c4d3'}} />
    ))}
    <div style={{position: 'absolute', left: 0, right: 0, top: 1340, bottom: 0, background: '#9fb1c1'}} />
  </AbsoluteFill>
);

const Escritorio: React.FC<{y?: number}> = ({y = 1340}) => (
  <>
    <div style={{position: 'absolute', left: -20, right: -20, top: y, height: 60, background: '#7b5a43', borderRadius: 10, boxShadow: '0 20px 30px rgba(0,0,0,0.2)'}} />
    <div style={{position: 'absolute', left: 40, right: 40, top: y + 60, bottom: 0, background: '#6a4b37'}} />
  </>
);

const Burbuja: React.FC<{at: number; x: number; y: number; children: React.ReactNode}> = ({at, x, y, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 10}});
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s})`, transformOrigin: 'bottom left', background: '#fff', borderRadius: 40, padding: '26px 38px', fontFamily: `${SANS}, ${EMOJI}`, fontSize: 84, fontWeight: 800, color: '#171a14', boxShadow: '0 16px 40px rgba(0,0,0,0.18)'}}>
      {children}
    </div>
  );
};

// 1 · En el banco: el asesor pregunta, Valentina se queda pensando.
export const EscenaBanco: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Banco />
      <Asesor x={630 + cl(frame, [0, 40], [60, 0])} y={680} />
      <Valentina x={20} y={640} scale={1.05} gesto={frame > 70 ? 'duda' : 'neutral'} mira={1} />
      <Escritorio />
      <Burbuja at={20} x={600} y={480}>¿ 🔁 👥 ?</Burbuja>
    </AbsoluteFill>
  );
};

// 2 · El cuaderno: nombres tachados y flechas; aparece un «?» grande.
export const EscenaCuaderno: React.FC = () => {
  const frame = useCurrentFrame();
  const nombres = ['Laura M.', 'Camila', 'Sra. Rosa', 'Diana ✂︎', 'Laura?', 'Paola', 'Andrea', 'Camila (otra)', 'Rosa — tinte', 'Mónica', 'Juliana', '¿Diana?'];
  const zoom = cl(frame, [0, 150], [1, 1.08]);
  return (
    <AbsoluteFill style={{background: '#7b5a43'}}>
      <AbsoluteFill style={{transform: `scale(${zoom}) rotate(-3deg)`}}>
        <div style={{position: 'absolute', left: 90, top: 470, width: 900, height: 1180, background: '#fbf7ec', borderRadius: 18, boxShadow: '0 30px 60px rgba(0,0,0,0.35)', backgroundImage: 'repeating-linear-gradient(transparent 0 78px, #b9d0e6 78px 80px)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 90, top: 0, bottom: 0, width: 3, background: '#e7a3a3'}} />
          {nombres.map((n, i) => {
            const o = cl(frame, [i * 4, i * 4 + 8], [0, 1]);
            const tachado = i % 3 === 1;
            return (
              <div key={n} style={{position: 'absolute', left: 130 + (i % 2) * 360, top: 30 + Math.floor(i / 2) * 160 + (i % 2) * 40, opacity: o, fontFamily: '"Comic Sans MS", "Segoe Print", cursive', fontSize: 52, color: '#2b3a67', transform: `rotate(${(i % 4) - 2}deg)`, textDecoration: tachado ? 'line-through' : 'none', textDecorationColor: '#c0392b', textDecorationThickness: 5}}>
                {n}
              </div>
            );
          })}
          <svg style={{position: 'absolute', inset: 0}} width="900" height="1180">
            <path d="M300 120 Q520 260 360 420" stroke="#c0392b" strokeWidth="6" fill="none" strokeDasharray="900" strokeDashoffset={cl(frame, [40, 80], [900, 0])} />
            <path d="M640 300 Q420 520 640 760" stroke="#c0392b" strokeWidth="6" fill="none" strokeDasharray="900" strokeDashoffset={cl(frame, [60, 100], [900, 0])} />
          </svg>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 420, color: '#e63946', opacity: cl(frame, [95, 110], [0, 0.92]), transform: `scale(${cl(frame, [95, 112], [0.4, 1])})`, textShadow: '0 12px 30px rgba(0,0,0,0.3)'}}>?</div>
    </AbsoluteFill>
  );
};

// 3 · Semanas después, en el salón: Valentina muestra el celular, segura.
export const EscenaSalonCelular: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Salon />
      <Valentina x={330 + cl(frame, [0, 20], [-80, 0])} y={760} scale={1.08} ropa="delantal" gesto="sonrisa" mano="celular" />
      <div style={{position: 'absolute', left: 50, top: 1500, fontFamily: EMOJI, fontSize: 120, transform: `rotate(${Math.sin(frame / 8) * 6}deg)`}}>💇‍♀️</div>
    </AbsoluteFill>
  );
};

// 4 · De vuelta en el banco: firma tranquila, carpeta cerrada.
export const EscenaFirma: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Banco />
      <Asesor x={660} y={700} />
      <Valentina x={120} y={640} scale={1.05} gesto="sonrisa" mano="pluma" />
      <Escritorio />
      <div style={{position: 'absolute', left: 300, top: 1290, width: 360, height: 90, background: '#fff', borderRadius: 8, transform: 'rotate(-4deg)', boxShadow: '0 6px 16px rgba(0,0,0,0.2)'}}>
        <svg width="360" height="90">
          <path d="M40 60 Q80 20 110 55 T180 50 T260 45" stroke="#1d3557" strokeWidth="5" fill="none" strokeDasharray="400" strokeDashoffset={cl(frame, [10, 70], [400, 0])} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const ESCENAS: Record<string, React.FC> = {
  banco: EscenaBanco,
  cuaderno: EscenaCuaderno,
  'salon-celular': EscenaSalonCelular,
  firma: EscenaFirma,
};
