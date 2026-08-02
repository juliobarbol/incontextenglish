/* ==========================================================================
   In Context English — único código de servidor del sitio.

   El sitio sigue siendo estático: `run_worker_first` en wrangler.jsonc hace que
   este script sólo corra para /api/*. Todo lo demás lo sirve Workers directo
   desde public/, sin pasar por acá.

   Existe para una sola cosa: anotar cuánta gente empieza el test de nivel y
   cuánta lo termina, y con qué nivel. No guarda nada personal — ni mail, ni
   nombre, ni IP, ni las respuestas. Sólo el agregado que hace falta para saber
   si el test sirve.
   ========================================================================== */

const NIVELES = ["A1", "A2", "B1", "B2", "C1"];
const EVENTOS = ["inicio", "resultado"];

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

    const { evento, nivel = null, puntaje = null, contestadas = null, idioma = null } = cuerpo ?? {};

    if (!EVENTOS.includes(evento)) return new Response("Evento desconocido", { status: 400 });
    if (idioma !== null && idioma !== "es" && idioma !== "en") {
      return new Response("Idioma inválido", { status: 400 });
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
        `INSERT INTO eventos_test (evento, nivel, puntaje, contestadas, idioma, pais)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          evento,
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
