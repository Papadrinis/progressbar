# PlanPy — anuncio en Remotion

`PLANPY_CO_VIDA_CIERRE_VIDEO_V1` · 1080×1920 · 25 s · 30 fps

**Mercado:** Colombia (usted) · **Eje:** VIDA · **Persona:** Don Hernán, El Encerrado (tienda de barrio, Bogotá)
· **Ángulo:** 1, el cierre · **Plan de aterrizaje:** Emprendedor.

```bash
npm install
npm run studio   # previsualizar y editar
npm run render   # exporta out/PLANPY_CO_VIDA_CIERRE_VIDEO_V1.mp4
```

## Guión

| Tiempo | Visual | Texto en pantalla |
|---|---|---|
| 0–3 s · Gancho | Tienda cerrada, una sola luz sobre el mostrador, el cuaderno escribiéndose. Sin marca | Cerró la tienda. Contó la plata. / Y sigue sin saber si el día le fue bien. |
| 3–8 s · Dolor | El cuaderno completo; la caja termina en "316.450 ?" | La caja le dice cuánto hay. No cuánto ganó. / El cuaderno lo guarda todo. Pero no le contesta nada. |
| 8–15 s · Giro | Entra el celular con el cierre del día | Ahora el día se cierra en el celular. / Ventas, gastos y fiados. Y lo que le quedó. |
| 15–18 s · Prueba | El pulgar toca "Cerrar caja" → "Caja cerrada" | Cierra la caja en unos 10 minutos. |
| 18–20 s · Después | Misma tienda, se apaga la luz | Apaga la luz. Y se va para la casa. |
| 20–25 s · CTA | Logo, oferta y precio en el mismo plano | 15 días gratis. Desde $46.500 al mes con el plan anual. Plan mensual: $62.000 al mes. Funciona en el celular, sin instalar nada. Más de 1.000 comercios ya lo usan. Pruébelo en planpy.io |

Todos los claims salen del inventario (`direccion-creativa.md` §10–11). Ninguna cifra de resultado.

## Antes de pautar

- **La pantalla del celular es un sustituto en código.** La guía pide grabación real de una cuenta demo.
  Deje el video en `public/` y páselo como `productFootage` (Studio → props). Lo mismo para la tienda
  real con `hookFootage`.
- **Sin locución.** El texto lleva el mensaje sin sonido. Si se agrega voz (`voiceover`), que sea con
  acento colombiano.
- **Tipografía sin confirmar.** Inter es un neutro de trabajo, no la fuente de PlanPy.
- Verde: `#3DB55C` en el cierre (logo en cuadro, el CTA no lleva lima); `#9FE870` solo en la interfaz.

---

# V2 — respuesta directa, tres ganchos

`PLANPY_CO_VIDA_CIERRE_VIDEO_V2_H1 / _H2 / _H3` · 1080×1920 · 30 s · `npm run render:v2`

Mismo cuerpo en las tres; solo cambia 0–2 s (test limpio de una variable).

| Variante | Gancho |
|---|---|
| **H1** | Reja que cae de golpe · "Si tiene tienda de barrio, deje de cerrar la caja a las once de la noche." |
| **H2** | Billetes contados · "¿Cuánto ganó hoy? No lo que hay en la caja: lo que le quedó." |
| **H3** | Producto desde el segundo cero · "Cierre la caja en unos diez minutos. Desde el celular. Sin instalar nada." |

| Tiempo | Visual | Voz en off | Texto en pantalla |
|---|---|---|---|
| 2–4 s | Zoom de golpe, cuaderno | ¿Su negocio le está quitando la vida? PlanPy se la devuelve. | ¿Su negocio le está quitando la vida? / PlanPy se la devuelve. |
| 4–8 s | Llega "Pa, ¿ya viene a comer?"; pone el celular boca abajo | Porque la jornada no termina cuando cierra. Ahí empieza la otra. | Ahí empieza la otra jornada. |
| 8–15 s | Flashback de día: registra una venta en el celular | Con PlanPy, cada venta queda anotada en el celular mientras atiende. | Cada venta, anotada mientras atiende. / Sin instalar nada. |
| 15–21 s | De noche: cierre del día → "Caja cerrada" | Por la noche, cierra la caja en unos diez minutos. *(H3: Y ve lo que le quedó del día.)* | Cierre de caja en unos 10 minutos. |
| 21–25 s | Contesta "Ya voy", se apaga la luz, baja la reja | Y llega a comer con la familia. | Y llega a comer con la familia. |
| 25–30 s | Cierre de marca | Pruébelo quince días gratis. Desde cuarenta y seis mil quinientos pesos al mes con el plan anual. | 15 días gratis · Desde $46.500 al mes con el plan anual · Plan mensual: $62.000 · planpy.io |

Locución: acento colombiano, ~78 palabras (ritmo rápido). Se pasa como prop `voiceover` (archivo en `public/`).
El panel ya no muestra "Fiados pendientes": el control de fiados no está confirmado como función.

---

# V4 — PAS, 26 s, un ángulo por video (la versión vigente)

`PLANPY_CO_VIDA_PAS_{CIERRE|CAJA|INVENTARIO}_V4` · 1080×1920 · 26 s · `npm run render:v4`

**Cambios de producto:** la gestión se hace en el **computador del mostrador** (PlanPy en el navegador);
el **celular es de consulta** (ver cómo le fue, desde la casa). Esto actualiza el no negociable #1 de
`planpy-marca`, que decía "siempre en un celular".

**Reglas de edición:** cada tarjeta dura al menos (palabras ÷ 3) + 1 s, máx. 2 líneas, texto sobre caja
oscura; una acción por plano de interfaz, cursor lento, resultado sostenido; acercamiento al área que
importa del monitor; temblor de cámara a la mitad.

| Bloque | Tiempo | CIERRE | CAJA | INVENTARIO |
|---|---|---|---|---|
| **P** Problema | 0–3,7 s | ¿Cuánto ganó hoy? | La caja no cuadró. Otra vez. | —¿Tiene aceite? —Déjeme mirar atrás… |
| **A** Agitación | 3,7–7,7 s | El cuaderno no le responde eso. | ¿Un cambio mal dado? ¿Un gasto sin anotar? | Ir a mirar: ese es su inventario. |
| **A** | 7,7–11,2 s | Y otra noche, llega tarde a comer. | Y usted, recontando a las 11 p. m. | Y se entera cuando ya se acabó. |
| **S** Computador | 11,2–16,2 s | Con PlanPy, cierra la caja en unos 10 minutos. | Con PlanPy, cada venta y cada gasto, registrados. | Con PlanPy, lo busca y sabe cuánto le queda. |
| **S** Celular | 16,2–20 s | Y desde la casa, mira cómo le fue. | Y desde la casa, mira cómo le fue. | Y desde el celular, consulta lo que tiene. |
| **CTA** | 20–26 s | 15 días gratis · Desde $46.500 al mes con el plan anual · Plan mensual $62.000 · En computador y celular, sin instalar nada · planpy.io | ← igual | ← igual |

**Locución sugerida (acento colombiano, ~55 palabras):**

- *CIERRE:* ¿Cuánto ganó hoy? No lo que hay en la caja: lo que le quedó. El cuaderno no le responde eso. Y otra noche, llega tarde a comer. Con PlanPy, maneja la tienda desde el computador y cierra la caja en unos diez minutos. Y desde la casa, mira cómo le fue en el celular. Pruébelo quince días gratis en planpy.io.
- *CAJA:* La caja no cuadró. Otra vez. ¿Un cambio mal dado? ¿Un gasto que no anotó? Sin registro, no hay cómo saberlo. Con PlanPy, cada venta y cada gasto quedan registrados en el computador. Y desde la casa, mira cómo le fue en el celular. Pruébelo quince días gratis en planpy.io.
- *INVENTARIO:* —¿Tiene aceite? —Déjeme mirar atrás. Si para saber qué le queda tiene que ir a mirar, ese es su inventario. Y se entera cuando ya se acabó. Con PlanPy, lo busca en el computador y sabe cuánto le queda. Y desde el celular, lo consulta donde esté. Pruébelo quince días gratis en planpy.io.

### Locución V4 (voz Xavier)

Generada en Higgsfield (ElevenLabs, voz preset "Xavier"), un clip por bloque PAS para que cada frase
caiga sobre su texto. `npm run voz` descarga los 15 clips a `public/voz/` y `npm run render:v4:voz`
exporta las tres versiones con voz (`*_V4_VOZ.mp4`).

| Clip | Texto |
|---|---|
| cierre-p | ¿Cuánto ganó hoy? De verdad, ¿cuánto le quedó? |
| cierre-a1 | El cuaderno no le responde eso. |
| cierre-a2 | Y otra noche, llega tarde a comer. |
| cierre-s1 | Con PlanPy, cierra la caja en unos diez minutos. |
| casa-s2 | Y desde la casa, mira cómo le fue. |
| caja-p | La caja no cuadró. Otra vez. |
| caja-a1 | ¿Un cambio mal dado? ¿Un gasto sin anotar? |
| caja-a2 | Y usted, recontando a las once. |
| caja-s1 | Con PlanPy, cada venta y cada gasto quedan registrados. |
| inventario-p | ¿Tiene aceite? Déjeme mirar atrás... |
| inventario-a1 | Ir a mirar: ese es su inventario. |
| inventario-a2 | Y se entera cuando ya se acabó. |
| inventario-s1 | Con PlanPy, lo busca y sabe cuánto le queda. |
| inventario-s2 | Y desde el celular, consulta lo que tiene. |
| cta | Pruébelo quince días gratis, en PlanPy punto io. |

---

# V5 — PAS montado sobre la voz (la versión vigente)

`PLANPY_CO_VIDA_PAS_{CIERRE|CAJA|INVENTARIO}_V5` · 18–20 s · `npm run render:v5`

- **Ritmo:** cada bloque dura lo que dura su frase + un respiro (3 frames antes, 5 después). La voz va
  al 107 % (`playbackRate`, sin cambiar el tono). Resultado: 18–20 s en vez de 26 s.
- **Subtítulos sincronizados:** la frase entra completa y la palabra que se dice se resalta en verde de marca.
- **Entrada de cada bloque:** punch-in con desenfoque (6 frames) + whoosh; el primero con destello e impacto.
- **Efectos:** billetes que caen (flick), círculo en el cuaderno (scribble), notificación, clic + ding en
  el computador, tecleo en el inventario, pop del celular, riser antes del CTA y pops en el cierre.
- **Música:** cama pop/lo-fi a 112 BPM con ducking (baja mientras habla la voz) y fade out.
- **Billetes colombianos estilizados:** colores y denominaciones de la serie actual, sin retratos,
  textos oficiales ni elementos de seguridad.
- **Pronunciación:** los clips con el nombre se generaron escribiendo "Planpi"; en pantalla se escribe PlanPy.

Efectos y música son síntesis propia (`npm run sonido` → `scripts/sonido.py`), sin licencias de terceros.
Para pauta, se puede reemplazar `public/music/cama-112bpm.wav` por una pista de la Sound Collection de Meta
(gratis para anuncios de Facebook e Instagram) con el mismo nombre.
