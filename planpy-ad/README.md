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
