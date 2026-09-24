import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Reja metálica de la tienda. `slam`: cae de golpe con rebote; si no, baja despacio.
export const Reja: React.FC<{start: number; slam?: boolean; duration?: number}> = ({start, slam, duration = 50}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = slam
    ? spring({frame: frame - start, fps, config: {damping: 9, stiffness: 260, mass: 0.6}, durationInFrames: 14})
    : interpolate(frame, [start, start + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `translateY(${(p - 1) * 100}%)`}}>
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(180deg, #8d9197 0 18px, #5b5f64 18px 26px, #b3b7bc 26px 30px, #6c7075 30px 44px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0.35), transparent 30%, transparent 70%, rgba(0,0,0,0.35))'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: '#3e4146'}} />
      <div style={{position: 'absolute', bottom: 14, left: '50%', width: 120, height: 30, marginLeft: -60, borderRadius: 6, background: '#1f2124'}} />
    </AbsoluteFill>
  );
};

export const useSlamShake = (at: number) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at + 6, at + 9, at + 20], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return `translate(${Math.sin(frame * 3.1) * 18 * k}px, ${Math.cos(frame * 2.7) * 22 * k}px)`;
};
