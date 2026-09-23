import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Grano y viñeta: registro documental, no publicitario. Lo pulido es el error.
export const Texture: React.FC<{strength?: number}> = ({strength = 1}) => {
  const frame = useCurrentFrame();
  const seed = frame % 8;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.16 * strength, mixBlendMode: 'overlay'}}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
          opacity: strength,
        }}
      />
    </AbsoluteFill>
  );
};

// Cámara en mano: deriva lenta, nunca trípode.
export const useHandheld = (amount = 1) => {
  const f = useCurrentFrame();
  const x = (Math.sin(f / 23) * 6 + Math.sin(f / 7.3) * 1.5) * amount;
  const y = (Math.cos(f / 29) * 5 + Math.sin(f / 9.1) * 1.2) * amount;
  const r = Math.sin(f / 41) * 0.35 * amount;
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
};
