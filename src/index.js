/* ==========================================================================
   In Context English — único código de servidor del sitio.

   El sitio sigue siendo estático: `run_worker_first` en wrangler.jsonc hace que
   este script sólo corra para /api/*. Todo lo demás lo sirve Workers directo
   desde public/, sin pasar por acá.

   Existe para anotar el uso del sitio: visitas, qué se toca, hasta dónde se
   scrollea, y cuánta gente empieza y termina el test de nivel. No guarda nada
   personal — ni mail, ni nombre, ni IP, ni las respuestas — y los eventos no se
   correlacionan entre sí: se cuentan sueltos, no hay identificador de visita.

   Además del fetch hay un `scheduled`: una vez por semana borra los eventos
   viejos. Ver el bloque de retención al final.
   ========================================================================== */

const NIVELES = ["A1", "A2", "B1", "B2", "C1"];
const EVENTOS = ["pagina", "clic", "scroll", "inicio", "resultado"];

/* Etiquetas y rutas: sólo lo que puede salir del propio sitio. Sin esto, el
   endpoint es una invitación a llenar la base de basura. */
const DETALLE_OK = /^[a-z0-9/-]{1,40}$/;

/* Un evento válido pesa unos 100 bytes. Con 2 KB sobra de acá a que el sitio
   tenga el doble de páginas, y evita gastar CPU parseando un JSON gigante que
   igual íbamos a rechazar. */
const CUERPO_MAX = 2048;

const entero = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;

/* Las respuestas del Worker no pasan por public/_headers —esas cabeceras son
   sólo para los archivos estáticos—, así que las suyas van acá. Son respuestas
   de una línea, pero un `nosniff` de más nunca sobra y `no-store` evita que
   una capa intermedia se guarde un 429 y lo repita. */
const CABECERAS = {
  "Content-Type": "text/plain; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
};

const responder = (texto, status) =>
  new Response(texto, { status, headers: CABECERAS });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/evento") return responder("No existe", 404);
    if (request.method !== "POST") return responder("Método no permitido", 405);

    /* El registro sale siempre de una página del propio sitio. Los navegadores
       mandan Origin en todo POST, también en los del mismo origen, así que se
       puede exigir: lo que queda afuera es un script llamando al endpoint desde
       una consola o un servidor. `new URL()` de un Origin inventado tira, y sin
       el try el Worker devolvía un 500 en vez de un 403. */
    const origen = request.headers.get("Origin");
    let origenOk = false;
    try {
      origenOk = Boolean(origen) && new URL(origen).host === url.host;
    } catch {
      origenOk = false;
    }
    if (!origenOk) return responder("Origen no permitido", 403);

    /* Exigir Origin frena al que no se molesta en falsificarlo; el límite por
       IP frena al que sí. La IP se usa acá y no se guarda en ningún lado: es la
       clave del contador que vive en el borde de Cloudflare, no una columna de
       la base. Si el binding no está (dev local, por ejemplo), se sigue de
       largo: el registro nunca puede ser el motivo de que el sitio falle. */
    if (env.LIMITE) {
      const ip = request.headers.get("CF-Connecting-IP") ?? "sin-ip";
      const { success } = await env.LIMITE.limit({ key: ip });
      if (!success) return responder("Demasiados eventos", 429);
    }

    const largo = Number(request.headers.get("Content-Length"));
    if (Number.isFinite(largo) && largo > CUERPO_MAX) {
      return responder("Cuerpo demasiado grande", 413);
    }

    let cuerpo;
    try {
      const texto = await request.text();
      if (texto.length > CUERPO_MAX) return responder("Cuerpo demasiado grande", 413);
      cuerpo = JSON.parse(texto);
    } catch {
      return responder("JSON inválido", 400);
    }

    const {
      evento,
      detalle = null,
      nivel = null,
      puntaje = null,
      contestadas = null,
      idioma = null,
    } = cuerpo ?? {};

    if (!EVENTOS.includes(evento)) return responder("Evento desconocido", 400);
    if (idioma !== null && idioma !== "es" && idioma !== "en") {
      return responder("Idioma inválido", 400);
    }
    if (detalle !== null && (typeof detalle !== "string" || !DETALLE_OK.test(detalle))) {
      return responder("Detalle inválido", 400);
    }
    if ((evento === "pagina" || evento === "clic" || evento === "scroll") && !detalle) {
      return responder("Falta el detalle", 400);
    }

    if (evento === "resultado") {
      if (!NIVELES.includes(nivel)) return responder("Nivel inválido", 400);
      if (!entero(puntaje, 20)) return responder("Puntaje inválido", 400);
      if (contestadas !== null && !entero(contestadas, 20)) {
        return responder("Contestadas inválido", 400);
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
      return responder("Error al registrar", 500);
    }

    return new Response(null, { status: 204, headers: CABECERAS });
  },

  /* ---------- Retención ---------------------------------------------------
     Los datos que no se guardan no se pueden perder ni filtrar. Estos eventos
     sirven para ver tendencias del año, no para consultar 2027 desde 2031: se
     borran solos al cumplir MESES. El cron está en wrangler.jsonc.

     Es la única escritura destructiva de todo el repo. Va por meses enteros y
     no por cantidad de filas a propósito: si algún día el sitio recibe diez
     veces más visitas, sigue borrando lo mismo —lo viejo— y no se lleva puesto
     el mes en curso. */
  async scheduled(evento, env, ctx) {
    const MESES = 12;
    ctx.waitUntil(
      env.DB.prepare(`DELETE FROM eventos WHERE creado_en < datetime('now', ?)`)
        .bind(`-${MESES} months`)
        .run()
        .then((r) => console.log("eventos borrados por antigüedad:", r.meta?.changes ?? 0))
        .catch((e) => console.error("no pude limpiar eventos viejos:", e.message))
    );
  },
};
