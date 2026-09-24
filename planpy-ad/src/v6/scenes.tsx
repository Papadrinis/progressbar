import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SANS} from '../brand';
import {EMOJI} from './kit';

// ---------- Barbería -----------------------------------------------------------
export const BarberPole: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 70, height: 360}}>
      <div style={{position: 'absolute', top: 0, left: -8, width: 86, height: 30, borderRadius: 14, background: '#c9ccd1'}} />
      <div
        style={{
          position: 'absolute',
          top: 26,
          left: 0,
          width: 70,
          height: 300,
          borderRadius: 30,
          overflow: 'hidden',
          background: `repeating-linear-gradient(-35deg, #d33 0 26px, #fff 26px 52px, #2451b7 52px 78px, #fff 78px 104px)`,
          backgroundPositionY: `${frame * 4}px`,
          boxShadow: 'inset -14px 0 20px rgba(0,0,0,0.25), inset 10px 0 14px rgba(255,255,255,0.4)',
        }}
      />
      <div style={{position: 'absolute', bottom: 0, left: -8, width: 86, height: 30, borderRadius: 14, background: '#c9ccd1'}} />
    </div>
  );
};

export const Bulbs: React.FC<{x: number; y: number; w: number; h: number; round?: boolean}> = ({x, y, w, h, round}) => {
  const n = 14;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: round ? '50%' : 24, background: 'linear-gradient(160deg, #9fb3c2, #56697a 60%, #3c4b58)', border: '14px solid #2a2622'}} />
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const cx = w / 2 + Math.cos(a) * (w / 2 + 6);
        const cy = h / 2 + Math.sin(a) * (h / 2 + 6);
        return <div key={i} style={{position: 'absolute', left: cx - 14, top: cy - 14, width: 28, height: 28, borderRadius: 14, background: '#fff6d8', boxShadow: '0 0 24px 8px rgba(255,220,140,0.55)'}} />;
      })}
    </div>
  );
};

export const Barberia: React.FC = () => (
  <AbsoluteFill style={{background: '#2b2320'}}>
    <AbsoluteFill style={{background: 'linear-gradient(#3b302b, #2b2320 70%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1250, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 120px, transparent 120px 124px)'}} />
    <Bulbs x={250} y={260} w={580} h={620} />
    <BarberPole x={70} y={420} />
    <BarberPole x={940} y={420} />
    {/* piso de ajedrez */}
    <div style={{position: 'absolute', left: -200, right: -200, top: 1250, bottom: 0, transform: 'perspective(700px) rotateX(55deg)', transformOrigin: 'top', backgroundImage: 'conic-gradient(#e9e4da 25%, #1d1b19 0 50%, #e9e4da 0 75%, #1d1b19 0)', backgroundSize: '160px 160px'}} />
  </AbsoluteFill>
);

// Silla de barbero en SVG; `spin` gira fingiendo 3D con scaleX.
export const BarberChair: React.FC<{spin?: number; x?: number; y?: number; scale?: number}> = ({spin = 0, x = 540, y = 1180, scale = 1}) => {
  const frame = useCurrentFrame();
  const sx = spin ? Math.cos((frame * spin * Math.PI) / 180) : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`}}>
      <svg width="520" height="720" viewBox="0 0 520 720" style={{transform: `scaleX(${sx})`, overflow: 'visible'}}>
        <ellipse cx="260" cy="690" rx="200" ry="26" fill="rgba(0,0,0,0.45)" />
        <rect x="120" y="640" width="280" height="40" rx="20" fill="#b9bec5" />
        <rect x="235" y="470" width="50" height="180" fill="#8d939b" />
        <rect x="60" y="420" width="400" height="80" rx="30" fill="#9a1f25" />
        <rect x="110" y="120" width="300" height="320" rx="50" fill="#b3252c" />
        <rect x="170" y="30" width="180" height="110" rx="40" fill="#b3252c" />
        <rect x="150" y="160" width="220" height="240" rx="30" fill="none" stroke="#7e161b" strokeWidth="6" />
        <rect x="30" y="360" width="90" height="26" rx="13" fill="#d9dde2" />
        <rect x="400" y="360" width="90" height="26" rx="13" fill="#d9dde2" />
        <rect x="200" y="520" width="120" height="16" rx="8" fill="#d9dde2" />
      </svg>
    </div>
  );
};

export const WallClock: React.FC<{x: number; y: number; hour?: number; size?: number}> = ({x, y, hour = 4, size = 220}) => {
  const frame = useCurrentFrame();
  const minute = (frame * 6) % 360; // la aguja corre: el tiempo se va
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: '#f4efe6', border: '12px solid #1d1b19', boxShadow: '0 12px 30px rgba(0,0,0,0.5)'}}>
      {Array.from({length: 12}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: '50%', top: 8, width: 6, height: 18, marginLeft: -3, background: '#1d1b19', transformOrigin: `3px ${size / 2 - 20}px`, transform: `rotate(${i * 30}deg)`}} />
      ))}
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 10, height: size * 0.26, marginLeft: -5, background: '#1d1b19', borderRadius: 5, transformOrigin: '5px 0', transform: `rotate(${180 + hour * 30 + minute / 12}deg)`}} />
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 6, height: size * 0.36, marginLeft: -3, background: '#c0392b', borderRadius: 3, transformOrigin: '3px 0', transform: `rotate(${180 + minute}deg)`}} />
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 18, height: 18, margin: -9, borderRadius: 9, background: '#1d1b19'}} />
    </div>
  );
};

// ---------- Salón --------------------------------------------------------------
export const Salon: React.FC = () => (
  <AbsoluteFill style={{background: '#f0d9cf'}}>
    <AbsoluteFill style={{background: 'linear-gradient(#f3ddd3, #e7c4b6 75%)'}} />
    <Bulbs x={290} y={240} w={500} h={560} round />
    {/* repisa con productos */}
    <div style={{position: 'absolute', left: 40, right: 40, top: 930, height: 18, background: '#8b5e45'}} />
    {['#e78fb3', '#6fb3c9', '#f2c14e', '#b57edc', '#7fc98a', '#e97d6b', '#f0a6c4', '#5b8def', '#f2c14e', '#e78fb3'].map((c, i) => (
      <div key={i} style={{position: 'absolute', left: 70 + i * 96, top: 930 - (90 + (i % 3) * 30), width: 60, height: 90 + (i % 3) * 30, borderRadius: '14px 14px 8px 8px', background: c, boxShadow: 'inset -8px 0 10px rgba(0,0,0,0.12)'}} />
    ))}
    <div style={{position: 'absolute', left: 0, right: 0, top: 1300, bottom: 0, background: 'linear-gradient(#d9b3a3, #c49b89)'}} />
    <div style={{position: 'absolute', right: 50, top: 980, fontFamily: EMOJI, fontSize: 160}}>🪴</div>
  </AbsoluteFill>
);

// Secador de pelo que tiembla mientras suena y se detiene en seco.
export const Secador: React.FC<{x: number; y: number; stopAt?: number; size?: number}> = ({x, y, stopAt = Infinity, size = 200}) => {
  const frame = useCurrentFrame();
  const on = frame < stopAt;
  const j = on ? Math.sin(frame * 2.7) * 5 : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${j}px, ${-j}px) rotate(-12deg)`}}>
      <div style={{fontFamily: EMOJI, fontSize: size, transform: 'scaleX(-1)'}}>💨</div>
    </div>
  );
};

// Celular de una clienta mostrando su cita (para el choque de las dos).
export const CitaPhone: React.FC<{name: string; hour: string; tilt?: number}> = ({name, hour, tilt = 0}) => (
  <div style={{width: 380, height: 700, borderRadius: 56, background: '#111', padding: 12, transform: `rotate(${tilt}deg)`, boxShadow: '0 30px 60px rgba(0,0,0,0.45)'}}>
    <div style={{width: '100%', height: '100%', borderRadius: 46, background: '#faf8f4', fontFamily: `${SANS}, ${EMOJI}`, padding: '70px 26px', boxSizing: 'border-box'}}>
      <div style={{fontSize: 24, color: '#8a857c', fontWeight: 600}}>Mi cita</div>
      <div style={{fontSize: 40, fontWeight: 800, color: '#141414', marginTop: 6}}>Hola, {name} 💇‍♀️</div>
      <div style={{marginTop: 40, borderRadius: 24, background: '#171a14', color: '#fff', padding: '26px 22px'}}>
        <div style={{fontSize: 24, color: '#bbb'}}>Jueves</div>
        <div style={{fontSize: 50, fontWeight: 800, color: '#9FE870', whiteSpace: 'nowrap'}}>{hour}</div>
        <div style={{fontSize: 24, marginTop: 6}}>Tinte y corte ✅</div>
      </div>
    </div>
  </div>
);

export const Noche: React.FC = () => (
  <AbsoluteFill style={{background: '#0d1022'}}>
    <div style={{position: 'absolute', left: 90, top: 180, width: 360, height: 440, borderRadius: 16, background: 'linear-gradient(#1c2446, #0f1430)', border: '14px solid #262a3e'}}>
      <div style={{position: 'absolute', right: 60, top: 70, width: 90, height: 90, borderRadius: 45, background: '#f5f0d8', boxShadow: '0 0 60px 20px rgba(245,240,216,0.25)'}} />
    </div>
    <div style={{position: 'absolute', left: -80, right: -80, top: 1250, bottom: -40, borderRadius: '80px 80px 0 0', background: '#2a2f55'}} />
    <div style={{position: 'absolute', left: 120, top: 1180, width: 460, height: 170, borderRadius: 80, background: '#3a4072'}} />
    <div style={{position: 'absolute', right: 80, top: 230, fontFamily: SANS, fontWeight: 800, fontSize: 110, color: '#ff4d4d', textShadow: '0 0 30px rgba(255,77,77,0.7)', letterSpacing: 4}}>11:00</div>
  </AbsoluteFill>
);

// ---------- Mascotas -----------------------------------------------------------
export const PetShop: React.FC = () => (
  <AbsoluteFill style={{background: '#d8ecf2'}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 3px, transparent 3px), linear-gradient(90deg, rgba(255,255,255,0.7) 3px, transparent 3px)', backgroundSize: '120px 120px'}} />
    <div style={{position: 'absolute', left: 40, right: 40, top: 520, height: 16, background: '#7a8f99'}} />
    {['#ffb347', '#77dd77', '#89cff0', '#ff6961', '#fdfd96', '#cba6f7', '#89cff0', '#ffb347'].map((c, i) => (
      <div key={i} style={{position: 'absolute', left: 80 + i * 118, top: 520 - (110 + (i % 2) * 30), width: 66, height: 110 + (i % 2) * 30, borderRadius: '20px 20px 10px 10px', background: c}} />
    ))}
    <div style={{position: 'absolute', left: 0, right: 0, top: 1450, bottom: 0, background: '#b9d3db'}} />
  </AbsoluteFill>
);

export const Dog: React.FC<{color?: string; x: number; y: number; scale?: number; tongue?: boolean; shake?: boolean}> = ({color = '#e8c9a0', x, y, scale = 1, tongue = true, shake}) => {
  const frame = useCurrentFrame();
  const rot = shake ? Math.sin(frame * 1.9) * 16 : Math.sin(frame / 9) * 3;
  const dark = 'rgba(0,0,0,0.18)';
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale}) rotate(${rot}deg)`}}>
      <svg width="420" height="420" viewBox="0 0 420 420" style={{overflow: 'visible'}}>
        <ellipse cx="85" cy="170" rx="55" ry="110" fill={color} transform="rotate(20 85 170)" />
        <ellipse cx="335" cy="170" rx="55" ry="110" fill={color} transform="rotate(-20 335 170)" />
        <ellipse cx="85" cy="185" rx="40" ry="90" fill={dark} transform="rotate(20 85 185)" />
        <ellipse cx="335" cy="185" rx="40" ry="90" fill={dark} transform="rotate(-20 335 185)" />
        <circle cx="210" cy="200" r="150" fill={color} />
        <ellipse cx="210" cy="280" rx="95" ry="70" fill="#fff7ec" />
        <circle cx="155" cy="175" r="22" fill="#1b1b1b" />
        <circle cx="265" cy="175" r="22" fill="#1b1b1b" />
        <circle cx="163" cy="167" r="7" fill="#fff" />
        <circle cx="273" cy="167" r="7" fill="#fff" />
        <ellipse cx="210" cy="245" rx="34" ry="24" fill="#1b1b1b" />
        <path d="M180 285 Q210 305 240 285" stroke="#1b1b1b" strokeWidth="7" fill="none" strokeLinecap="round" />
        {tongue ? <ellipse cx="210" cy="312" rx="22" ry="30" fill="#ff7a8a" /> : null}
      </svg>
    </div>
  );
};

// Espuma: burbujas que tiemblan sobre el perro.
export const Foam: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  const bubbles = Array.from({length: 26}, (_, i) => ({dx: Math.cos(i * 2.4) * (60 + (i % 5) * 28), dy: -120 + Math.sin(i * 1.7) * 60 - (i % 4) * 22, r: 26 + (i % 4) * 12}));
  return (
    <div style={{position: 'absolute', left: x, top: y}}>
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.dx - b.r,
            top: b.dy - b.r + Math.sin((frame + i * 5) / 6) * 4,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fff, #eef6fb 60%, #cfe3ee)',
            boxShadow: 'inset -4px -4px 8px rgba(0,0,0,0.06)',
          }}
        />
      ))}
    </div>
  );
};

export const Tina: React.FC = () => (
  <div style={{position: 'absolute', left: 90, top: 1180, width: 900, height: 360, borderRadius: '30px 30px 180px 180px', background: 'linear-gradient(#f7f9fb, #cfd9df)', boxShadow: '0 30px 60px rgba(0,0,0,0.25)'}}>
    <div style={{position: 'absolute', left: 30, right: 30, top: 18, height: 40, borderRadius: 20, background: '#9dd3ea'}} />
  </div>
);

export const Gotas: React.FC<{x: number; y: number; active?: boolean}> = ({x, y, active = true}) => {
  const frame = useCurrentFrame();
  if (!active) return null;
  return (
    <>
      {Array.from({length: 14}, (_, i) => {
        const f = (frame * 1.4 + i * 9) % 30;
        const a = (i / 14) * Math.PI * 2;
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(a) * (150 + f * 12), top: y + Math.sin(a) * (110 + f * 9), width: 22, height: 30, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#6ec3ea', opacity: 1 - f / 30}} />;
      })}
    </>
  );
};

export const Puerta: React.FC = () => (
  <div style={{position: 'absolute', left: 140, top: 380, width: 800, height: 1070, borderRadius: '24px 24px 0 0', background: 'linear-gradient(#f9fbfc, #dfe9ee)', border: '26px solid #7a8f99', borderBottom: 'none'}}>
    <div style={{position: 'absolute', left: 40, top: 40, right: 40, height: 400, background: 'rgba(137,207,240,0.35)', borderRadius: 12}} />
    <div style={{position: 'absolute', left: 250, top: 70, fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#35505c'}}>ABIERTO 🐾</div>
  </div>
);

export const Correa: React.FC<{x1: number; y1: number; x2: number; y2: number}> = ({x1, y1, x2, y2}) => (
  <svg style={{position: 'absolute', inset: 0, overflow: 'visible'}} width="1080" height="1920">
    <path d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + 120} ${x2} ${y2}`} stroke="#c0392b" strokeWidth="10" fill="none" />
  </svg>
);

// ---------- Compartidos --------------------------------------------------------
export const Busy: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{transform: `translate(${Math.sin(frame * 2.1) * 6}px, ${Math.cos(frame * 1.7) * 4}px)`}}>{children}</AbsoluteFill>;
};

export const clampI = (f: number, a: number[], b: number[]) => interpolate(f, a, b, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
