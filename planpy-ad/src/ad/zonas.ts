// Zonas seguras de Meta para 9:16 (1080×1920), Reels y Stories de Instagram/Facebook.
// Meta pide dejar libre de texto y logos el 14 % de arriba, el 35 % de abajo y el 6 % de cada lado
// (perfil, caption, botón CTA, íconos). En el Feed, el 9:16 se recorta a 4:5 (~285 px arriba y abajo).
// Fuente: facebook.com/business/ads-guide (Instagram Reels / Instagram Stories), revisado 2026-10-14.
export const LIENZO = {ancho: 1080, alto: 1920} as const;

// Caja donde puede ir todo lo importante (texto, stickers, tarjetas, logo).
export const ZONA = {
  arriba: 285, // máx(14 % = 269, recorte del Feed 4:5 = 285)
  abajo: 1248, // 1920 − 35 %
  izq: 65, // 6 %
  der: 1015, // 1080 − 6 %
} as const;

// Diagrama de un vertical:
//   285–450  franja alta: stickers cortos, notificaciones (llamada)
//   300–950  la cara del personaje (los fotogramas se encuadran así)
//   400–950  tarjetas de interfaz, a un costado
//   ~980–1240 subtítulos, anclados abajo de la zona
export const SUBTITULO_BASE = ZONA.abajo - 8; // borde inferior del bloque de subtítulos
export const FRANJA_ALTA = 360; // y por defecto de stickers
export const TARJETA = {celular: {x: 555, y: 300, escala: 0.78}, computador: {x: 156, y: 420, escala: 0.8}} as const;

export const dentro = (y: number, alto = 0) => y - alto / 2 >= ZONA.arriba && y + alto / 2 <= ZONA.abajo;
