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
