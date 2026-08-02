/* ==========================================================================
   In Context English — único código de servidor del sitio.

   El sitio sigue siendo estático: `run_worker_first` en wrangler.jsonc hace que
   este script sólo corra para /api/*. Todo lo demás lo sirve Workers directo
   desde public/, sin pasar por acá.

   Existe para anotar el uso del sitio: visitas, qué se toca, hasta dónde se
   scrollea, y cuánta gente empieza y termina el test de nivel. No guarda nada
   personal — ni mail, ni nombre, ni IP, ni las respuestas — y los eventos no se
   correlacionan entre sí: se cuentan sueltos, no hay identificador de visita.
   ========================================================================== */

const NIVELES = ["A1", "A2", "B1", "B2", "C1"];
const EVENTOS = ["pagina", "clic", "scroll", "inicio", "resultado"];

/* Etiquetas y rutas: sólo lo que puede salir del propio sitio. Sin esto, el
   endpoint es una invitación a llenar la base de basura. */
const DETALLE_OK = /^[a-z0-9/-]{1,40}$/;

const entero = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/evento") return new Response("No existe", { status: 404 });
    if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });

    // El formulario es del propio sitio: nadie de afuera necesita escribir acá.
    const origen = request.headers.get("Origin");
    if (origen && new URL(origen).host !== url.host) {
      return new Response("Origen no permitido", { status: 403 });
    }

    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return new Response("JSON inválido", { status: 400 });
    }

    const {
      evento,
      detalle = null,
      nivel = null,
      puntaje = null,
      contestadas = null,
      idioma = null,
    } = cuerpo ?? {};

    if (!EVENTOS.includes(evento)) return new Response("Evento desconocido", { status: 400 });
    if (idioma !== null && idioma !== "es" && idioma !== "en") {
      return new Response("Idioma inválido", { status: 400 });
    }
    if (detalle !== null && (typeof detalle !== "string" || !DETALLE_OK.test(detalle))) {
      return new Response("Detalle inválido", { status: 400 });
    }
    if ((evento === "pagina" || evento === "clic" || evento === "scroll") && !detalle) {
      return new Response("Falta el detalle", { status: 400 });
    }

    if (evento === "resultado") {
      if (!NIVELES.includes(nivel)) return new Response("Nivel inválido", { status: 400 });
      if (!entero(puntaje, 20)) return new Response("Puntaje inválido", { status: 400 });
      if (contestadas !== null && !entero(contestadas, 20)) {
        return new Response("Contestadas inválido", { status: 400 });
      }
    }

    try {
      await env.DB.prepare(
        `INSERT INTO eventos (evento, detalle, nivel, puntaje, contestadas, idioma, pais)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          evento,
          detalle,
          evento === "resultado" ? nivel : null,
          evento === "resultado" ? puntaje : null,
          evento === "resultado" ? contestadas : null,
          idioma,
          request.headers.get("CF-IPCountry") ?? null
        )
        .run();
    } catch (e) {
      // Que falle el registro no puede afectar a quien está haciendo el test:
      // el cliente ignora la respuesta igual. Queda en los logs del Worker.
      console.error("no pude registrar el evento:", e.message);
      return new Response("Error al registrar", { status: 500 });
    }

    return new Response(null, { status: 204 });
  },
};
