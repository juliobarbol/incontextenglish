# Reportar un problema de seguridad

Si encontraste algo que compromete el sitio o los datos de quien lo usa,
escribí a **incontextenglish.com.ar** por WhatsApp (+54 9 351 564-5110) o abrí
un *issue* en este repositorio.

**No publiques los detalles en un issue si el problema permite acceder a datos
o modificar el sitio.** Avisá primero, sin el detalle, y lo seguimos por
WhatsApp.

## Qué hay para atacar, realmente

Conviene decirlo para que nadie pierda tiempo: el sitio es estático y no tiene
cuentas, ni login, ni pagos, ni base de datos de alumnos.

- **`public/`** son archivos sueltos que Cloudflare sirve tal cual. No hay
  servidor que ejecute nada.
- **`POST /api/evento`** es el único código de servidor
  (`src/index.js`). Recibe contadores de uso: qué página se abrió, qué botón se
  tocó, hasta dónde se scrolleó, y el nivel que dio el test. Nada más.
- **La base (D1)** guarda esos contadores. No tiene mail, ni nombre, ni IP, ni
  las respuestas del test, ni forma de saber que dos eventos son de la misma
  persona. Se borra sola a los 12 meses.
- **El formulario de contacto no manda nada a ningún servidor**: arma un
  mensaje y abre WhatsApp con el texto escrito. Los datos que alguien escribe
  ahí no pasan por acá.

## Lo que ya está cubierto

- Cabeceras de seguridad y CSP en `public/_headers` — sólo se cargan scripts
  propios; una analítica o un chat de terceros quedan bloqueados hasta que se
  los agregue ahí a mano.
- Todo lo que entra a `/api/evento` se valida contra una lista cerrada de
  valores, y las consultas van con parámetros ligados (no hay SQL armado con
  texto).
- Tope de eventos por IP y por minuto, y rechazo de los pedidos que no vengan
  de una página del propio sitio.
- Lo que sale de `localStorage` en el test se revisa entero antes de usarse:
  cualquiera puede editarlo desde el navegador.

## Lo que sabemos que es un riesgo aceptado

- Las tipografías se cargan desde Google Fonts. Si esa CDN sirviera un CSS
  malicioso, el navegador lo aplicaría: la CSP la tiene permitida. Se acepta a
  cambio de la tipografía; sacarlo implica hospedar las fuentes en `/assets/`.
- Cualquiera puede mandar eventos falsos dentro del tope por minuto y ensuciar
  las estadísticas. No hay dato personal en juego, así que se prefirió eso
  antes que ponerle un identificador a cada visita.
