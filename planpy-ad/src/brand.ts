import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Colores confirmados (planpy-marca/references/identidad.md).
// #3DB55C manda en marca gráfica; #9FE870 solo en interfaz. No comparten plano.
export const BRAND_GREEN = '#3DB55C';
export const BRAND_GREEN_DARK = '#0D7C39';
export const UI_LIME = '#9FE870';

// El resto de la paleta sale de la escena: madera, papel, luz de tubo.
export const NIGHT = '#120e0a';
export const LAMP = '#ffcf8a';
export const PAPER = '#f3ecdf';
export const INK = '#1d2a4a';
export const TEXT = '#fffaf2';

// Tipografía de PlanPy SIN CONFIRMAR: Inter es un neutro de trabajo, no la fuente de marca.
// Las fuentes van locales en /public/fonts (OFL) para que el render no dependa de la red.
export const SANS = 'Inter';
export const HAND = 'Caveat';

for (const weight of ['400', '600', '800']) {
  loadFont({family: SANS, url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight});
}
for (const weight of ['500', '700']) {
  loadFont({family: HAND, url: staticFile(`fonts/caveat-latin-${weight}-normal.woff2`), weight});
}
