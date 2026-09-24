import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Celular sostenido en la tienda: funda gastada, pulgar real que entra a tocar.
// Toda pantalla que va adentro es un SUSTITUTO en código con datos de ejemplo.
export const Phone: React.FC<{
  children: React.ReactNode;
  enter?: number;
  exitAt?: number;
  taps?: number[];
  thumbAt?: {x: number; y: number};
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  flipAt?: number;
}> = ({children, enter = 0, exitAt = Infinity, taps = [], thumbAt = {x: 330, y: 1110}, x = 190, y = 560, scale = 1, rotate = -3, flipAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - enter, fps, config: {damping: 18, mass: 0.9}, durationInFrames: 30});
  const out = Number.isFinite(exitAt) ? spring({frame: frame - exitAt, fps, config: {damping: 200}, durationInFrames: 24}) : 0;
  const ty = interpolate(s, [0, 1], [1500, 0]) + out * 1700;
  const tilt = interpolate(s, [0, 1], [rotate + 12, rotate]);
  const flip = flipAt === undefined ? 0 : interpolate(frame, [flipAt, flipAt + 12], [0, 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const showBack = flip > 90;
  const thumb = Math.min(
    300,
    ...taps.map((t) => interpolate(frame, [t - 16, t - 4, t + 6, t + 22], [300, 0, 0, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 700,
        height: 1440,
        transformOrigin: '50% 50%',
        transform: `translateY(${ty}px) rotate(${tilt}deg) scale(${scale}) perspective(2400px) rotateY(${flip}deg)`,
      }}
    >
      <div style={{position: 'absolute', inset: -14, borderRadius: 96, background: 'linear-gradient(160deg,#3b3f45,#1d1f22 60%)', boxShadow: '0 50px 90px rgba(0,0,0,0.7)'}} />
      {showBack ? (
        <div style={{position: 'absolute', inset: 0, borderRadius: 84, background: 'linear-gradient(200deg,#2c3036,#15171a)', transform: 'scaleX(-1)'}}>
          <div style={{position: 'absolute', top: 40, left: 40, width: 190, height: 190, borderRadius: 50, background: '#0b0c0e'}} />
        </div>
      ) : (
        <div style={{position: 'absolute', inset: 0, borderRadius: 84, background: '#050505', padding: 16}}>
          <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 70, overflow: 'hidden'}}>
            {children}
            <div style={{position: 'absolute', top: 22, left: '50%', width: 150, height: 40, marginLeft: -75, borderRadius: 20, background: '#050505'}} />
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.10), transparent 35%)', pointerEvents: 'none'}} />
          </div>
        </div>
      )}
      {taps.length ? (
        <div
          style={{
            position: 'absolute',
            left: thumbAt.x,
            top: thumbAt.y,
            width: 190,
            height: 330,
            borderRadius: '95px 95px 60px 60px',
            background: 'linear-gradient(170deg,#b27c5c,#8a5a3e)',
            transform: `translate(${thumb * 0.4}px, ${thumb}px) rotate(-18deg)`,
            boxShadow: '0 -6px 24px rgba(0,0,0,0.35)',
          }}
        />
      ) : null}
    </div>
  );
};
