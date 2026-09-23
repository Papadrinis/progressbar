import {interpolate, useCurrentFrame} from 'remotion';
import {HAND, INK, PAPER} from '../brand';

// El cuaderno de fiados: personaje visual, tratado con respeto documental.
// Funciona y llega a su límite. Nunca es el chiste.
const LINES = [
  {t: 'Martes 22', bold: true},
  {t: 'Venta mañana ....... 184.300'},
  {t: 'Venta tarde ........ 228.450'},
  {t: 'Pagó proveedor ..... -96.000'},
  {t: 'Fiado Doña Marta ... 18.300'},
  {t: 'Fiado Julián ....... 9.700'},
  {t: 'Gas ................ -21.400'},
  {t: 'Caja ............... 316.450 ?'},
];

export const Cuaderno: React.FC<{writeStart?: number}> = ({writeStart = 0}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        top: 1040,
        width: 860,
        height: 800,
        transform: 'rotate(-4deg)',
        background: PAPER,
        backgroundImage:
          'linear-gradient(90deg, transparent 88px, #d98c8c 88px, #d98c8c 91px, transparent 91px), repeating-linear-gradient(transparent 0 71px, #a9c1d9 71px 73px)',
        borderRadius: 10,
        boxShadow: '0 30px 60px rgba(0,0,0,0.55), inset 0 0 80px rgba(120,90,40,0.25)',
        padding: '44px 40px 0 112px',
        fontFamily: HAND,
        fontSize: 50,
        lineHeight: '73px',
        color: INK,
      }}
    >
      {LINES.map((l, i) => {
        const start = writeStart + i * 12;
        const chars = Math.floor(interpolate(frame, [start, start + 14], [0, l.t.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
        return (
          <div key={i} style={{fontWeight: l.bold ? 700 : 500, whiteSpace: 'pre', height: 73}}>
            {l.t.slice(0, chars)}
          </div>
        );
      })}
    </div>
  );
};
