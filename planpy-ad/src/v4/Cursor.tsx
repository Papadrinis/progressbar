import {interpolate, useCurrentFrame, Easing} from 'remotion';

// Cursor lento y deliberado: se mueve, se detiene, hace clic.
export type CursorKey = {f: number; x: number; y: number};

export const Cursor: React.FC<{path: CursorKey[]; clicks?: number[]}> = ({path, clicks = []}) => {
  const frame = useCurrentFrame();
  const opt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)} as const;
  const fs = path.map((p) => p.f);
  const x = path.length > 1 ? interpolate(frame, fs, path.map((p) => p.x), opt) : path[0].x;
  const y = path.length > 1 ? interpolate(frame, fs, path.map((p) => p.y), opt) : path[0].y;
  const ripple = Math.max(0, ...clicks.map((c) => (frame >= c && frame < c + 14 ? 1 - (frame - c) / 14 : 0)));
  const press = clicks.some((c) => frame >= c - 3 && frame < c + 3);
  return (
    <div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none'}}>
      {ripple > 0 ? (
        <div style={{position: 'absolute', left: -30, top: -30, width: 60, height: 60, borderRadius: 30, border: '4px solid rgba(20,20,20,0.6)', opacity: ripple, transform: `scale(${1.6 - ripple * 0.6})`}} />
      ) : null}
      <svg width="30" height="40" viewBox="0 0 24 32" style={{transform: `scale(${press ? 0.88 : 1})`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))'}}>
        <path d="M2 2 L2 26 L8 20 L12 30 L16 28 L12 18 L20 18 Z" fill="#fff" stroke="#111" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
