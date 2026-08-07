#!/usr/bin/env node
/* ==========================================================================
   npm run shots — capturas y prueba de humo del sitio.

   Levanta public/ en un servidor propio (sin dependencias), abre el sitio con
   Chromium y saca capturas a 1440px y 390px. El sitio nació de un diseño de
   ancho fijo: las regresiones aparecen casi siempre en mobile.

   Además hace de test: recorre el test de nivel entero, cambia de idioma, y
   falla si aparece un error de JavaScript o un archivo local que no carga.

   Las capturas van a .shots/ (ignorado por git).
   ========================================================================== */

import { createServer } from "node:http";
import { readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(RAIZ, "public");
const SALIDA = join(RAIZ, ".shots");

/* ---------- Playwright: local o el global del entorno -------------------- */

async function abrirChromium() {
  const require = createRequire(import.meta.url);
  const candidatos = [];
  try {
    candidatos.push(execSync("npm root -g", { encoding: "utf8" }).trim());
  } catch {
    /* npm puede no estar: seguimos con el resto */
  }
  candidatos.push("/opt/node22/lib/node_modules");

  let playwright;
  try {
    playwright = require("playwright");
  } catch {
    for (const base of candidatos) {
      const ruta = join(base, "playwright");
      if (existsSync(ruta)) {
        playwright = require(ruta);
        break;
      }
    }
  }
  if (!playwright) {
    console.error(
      "No encontré Playwright.\n" +
        "  En este entorno viene instalado; en tu máquina: npm i -g playwright && npx playwright install chromium\n"
    );
    process.exit(1);
  }
  return playwright.chromium.launch();
}

/* ---------- Servidor estático mínimo ------------------------------------- */

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

/** Lee public/_headers para servir las mismas cabeceras que Cloudflare.
    Sin esto, una Content-Security-Policy mal escrita rompe en producción y acá
    no se nota. */
async function reglasDeCabeceras() {
  const archivo = join(PUBLIC, "_headers");
  if (!existsSync(archivo)) return [];
  const reglas = [];
  for (const linea of (await readFile(archivo, "utf8")).split("\n")) {
    if (!linea.trim() || linea.trim().startsWith("#")) continue;
    if (!/^\s/.test(linea)) {
      reglas.push({ patron: new RegExp("^" + linea.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"), cabeceras: {} });
    } else if (reglas.length) {
      const i = linea.indexOf(":");
      if (i > 0) reglas.at(-1).cabeceras[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
    }
  }
  return reglas;
}

/* Eventos que el sitio manda a /api/evento durante la corrida. En producción
   los recibe el Worker (src/index.js); acá los juntamos para comprobar que el
   registro anónimo del test se dispara de verdad. */
const eventosRecibidos = [];

async function levantarServidor() {
  const reglas = await reglasDeCabeceras();
  const server = createServer(async (req, res) => {
    let ruta = decodeURIComponent(req.url.split("?")[0]);

    if (ruta === "/api/evento") {
      const trozos = [];
      for await (const t of req) trozos.push(t);
      try {
        eventosRecibidos.push(JSON.parse(Buffer.concat(trozos).toString()));
      } catch {
        eventosRecibidos.push({ evento: "(cuerpo ilegible)" });
      }
      res.statusCode = 204;
      res.end();
      return;
    }

    if (ruta.endsWith("/")) ruta += "index.html";
    let archivo = join(PUBLIC, ruta);
    if (!existsSync(archivo)) {
      archivo = join(PUBLIC, "404.html");
      res.statusCode = 404;
    }
    try {
      const cuerpo = await readFile(archivo);
      res.setHeader("Content-Type", TIPOS[extname(archivo)] ?? "application/octet-stream");
      for (const regla of reglas) {
        if (regla.patron.test(ruta)) {
          for (const [k, v] of Object.entries(regla.cabeceras)) res.setHeader(k, v);
        }
      }
      res.end(cuerpo);
    } catch {
      res.statusCode = 500;
      res.end("error");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, puerto: server.address().port }));
  });
}

/* ---------- Corrida ------------------------------------------------------- */

const problemas = [];
const ANCHOS = [
  { nombre: "escritorio", width: 1440, height: 900 },
  { nombre: "mobile", width: 390, height: 844 },
];

const { server, puerto } = await levantarServidor();
const base = `http://127.0.0.1:${puerto}`;
const navegador = await abrirChromium();

await rm(SALIDA, { recursive: true, force: true });
await mkdir(SALIDA, { recursive: true });

async function nuevaPagina(viewport, donde) {
  const ctx = await navegador.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problemas.push(`${donde}: error de JS — ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // Los recursos externos (tipografías de Google) y el 404 que probamos a
    // propósito también escriben en consola: eso no es una regresión del sitio.
    const origen = m.location()?.url ?? "";
    if (origen && !origen.startsWith(base)) return;
    if (origen.includes("/no-existe")) return;
    problemas.push(`${donde}: consola — ${m.text()}`);
  });
  page.on("requestfailed", (r) => {
    const url = r.url();
    const fallo = r.failure()?.errorText ?? "falló";
    // Los envíos a /api/* van con keepalive: Chromium los da por abortados
    // aunque el cuerpo llegue. Que llegan se comprueba con eventosRecibidos.
    if (url.startsWith(base + "/api/")) return;
    if (url.startsWith(base)) problemas.push(`${donde}: no carga ${url.replace(base, "")} — ${fallo}`);
    else console.log(`  · recurso externo no disponible (normal sin red): ${new URL(url).host}`);
  });
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400 && !r.url().includes("/no-existe")) {
      problemas.push(`${donde}: ${r.status()} en ${r.url().replace(base, "")}`);
    }
  });
  return { ctx, page };
}

const capturar = async (page, nombre) => {
  await page.screenshot({ path: join(SALIDA, `${nombre}.png`), fullPage: true });
  console.log(`  ✓ .shots/${nombre}.png`);
};

/* Home, test y páginas de contenido, en los dos anchos */
for (const vp of ANCHOS) {
  const { ctx, page } = await nuevaPagina(vp, vp.nombre);

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await capturar(page, `home-${vp.nombre}`);

  await page.goto(`${base}/test-de-nivel/`, { waitUntil: "networkidle" });
  await capturar(page, `test-intro-${vp.nombre}`);

  await page.goto(`${base}/examenes/`, { waitUntil: "networkidle" });
  await capturar(page, `examenes-${vp.nombre}`);

  // Una de las tres páginas de examen alcanza: las tres comparten plantilla.
  await page.goto(`${base}/examenes/ielts/`, { waitUntil: "networkidle" });
  await capturar(page, `examen-ielts-${vp.nombre}`);

  await ctx.close();
}

/* El test de punta a punta: 20 respuestas y pantalla de resultado */
{
  const { ctx, page } = await nuevaPagina(ANCHOS[0], "test completo");
  await page.goto(`${base}/test-de-nivel/`, { waitUntil: "networkidle" });
  await page.click("#btn-empezar");

  const total = await page.evaluate(() => PREGUNTAS.length);
  await capturar(page, "test-pregunta");
  for (let i = 0; i < total; i++) {
    await page.click(".opcion >> nth=0");
  }

  const visible = await page.isVisible("#pantalla-resultado");
  if (!visible) problemas.push("test completo: contesté las 20 preguntas y no apareció el resultado");

  const nivel = (await page.textContent("#res-nivel"))?.trim();
  if (!nivel) problemas.push("test completo: la pantalla de resultado quedó sin nivel");
  else console.log(`  · el test terminó y dio nivel ${nivel}`);

  await capturar(page, "test-resultado");

  /* El resultado se genera por JS: comprobamos que el cambio de idioma lo repinta */
  const antes = await page.textContent("#res-blurb");
  await page.evaluate(() => aplicarIdioma("en"));
  const despues = await page.textContent("#res-blurb");
  if (antes === despues) {
    problemas.push(
      "el resultado del test no se tradujo al pasar a inglés — se rompió el evento «idiomacambiado» (ver CLAUDE.md)"
    );
  } else {
    console.log("  · el resultado del test se traduce al cambiar de idioma");
  }
  await capturar(page, "test-resultado-en");

  /* El registro anónimo: un "inicio" al empezar y un "resultado" al terminar */
  await page.waitForTimeout(300);
  const inicio = eventosRecibidos.find((e) => e.evento === "inicio");
  const resultado = eventosRecibidos.find((e) => e.evento === "resultado");
  if (!inicio) problemas.push("no llegó el evento «inicio» a /api/evento");
  if (!resultado) {
    problemas.push("no llegó el evento «resultado» a /api/evento");
  } else if (resultado.nivel !== nivel || typeof resultado.puntaje !== "number") {
    problemas.push(`el evento «resultado» llegó mal: ${JSON.stringify(resultado)}`);
  } else {
    console.log(`  · se registraron los eventos del test (resultado: ${resultado.nivel}, ${resultado.puntaje}/20)`);
  }

  /* El resultado queda en el hash: recargar (o abrir el link) tiene que
     devolver el mismo nivel, no la pantalla de inicio. */
  const hash = new URL(page.url()).hash;
  if (!/^#resultado=[a-z]\d-\d+$/.test(hash)) {
    problemas.push(`el resultado no quedó en la URL para compartir (hash: "${hash}")`);
  } else {
    await page.reload({ waitUntil: "networkidle" });
    const recargado = (await page.textContent("#res-nivel"))?.trim();
    if (recargado !== nivel) {
      problemas.push(`al recargar el resultado se perdió: daba ${nivel} y ahora dice "${recargado}"`);
    } else {
      console.log(`  · el resultado se recupera al recargar (${hash})`);
    }
  }

  await ctx.close();
}

/* La regla de nivel, contra patrones de respuestas armados a mano. Es lo único
   del test que no se ve mirando la pantalla: un cambio acá sale mal en silencio,
   mandando gente al curso equivocado. Cada caso es «aciertos por banda». */
{
  const { ctx, page } = await nuevaPagina(ANCHOS[0], "regla de nivel");
  await page.goto(`${base}/test-de-nivel/`, { waitUntil: "networkidle" });

  const casos = [
    { por: [4, 4, 4, 4, 4], nivel: "C1", nota: "todo bien" },
    { por: [3, 3, 3, 3, 3], nivel: "C1", nota: "3 de 4 en todas" },
    { por: [4, 4, 0, 0, 0], nivel: "A2", nota: "se frena en A2" },
    { por: [4, 2, 4, 4, 4], nivel: "C1", nota: "18/20 con un tropiezo en A2" },
    { por: [2, 4, 4, 4, 4], nivel: "C1", nota: "18/20 con un tropiezo en A1" },
    { por: [4, 4, 4, 4, 2], nivel: "B2", nota: "no domina C1" },
    { por: [0, 0, 0, 0, 4], nivel: "A1", nota: "sólo las difíciles: no se sostiene" },
    { por: [0, 0, 0, 0, 0], nivel: "A1", nota: "ninguna" },
  ];

  for (const caso of casos) {
    const dio = await page.evaluate((porBanda) => {
      const restantes = { A1: porBanda[0], A2: porBanda[1], B1: porBanda[2], B2: porBanda[3], C1: porBanda[4] };
      // Acierta las primeras N de cada banda y falla el resto a propósito.
      const respuestas = PREGUNTAS.map((q) => (restantes[q.banda]-- > 0 ? q.a : (q.a + 1) % q.opts.length));
      return calcular(respuestas).nivel;
    }, caso.por);

    if (dio !== caso.nivel) {
      problemas.push(`regla de nivel: [${caso.por}] (${caso.nota}) tendría que dar ${caso.nivel} y dio ${dio}`);
    }
  }

  console.log(`  · la regla de nivel pasa los ${casos.length} casos`);
  await ctx.close();
}

/* El sorteo: 4 de cada banda, sin repetir, y distinto en cada visita. Si esto
   se rompe, el test sigue andando —por eso hay que comprobarlo— pero deja de
   tener sentido tener banco. */
{
  const { ctx, page } = await nuevaPagina(ANCHOS[0], "sorteo de preguntas");
  await page.goto(`${base}/test-de-nivel/`, { waitUntil: "networkidle" });

  const forma = await page.evaluate(() => ({
    banco: BANCO.length,
    tomadas: PREGUNTAS.length,
    bandas: PREGUNTAS.map((q) => q.banda),
    repetidas: PREGUNTAS.length - new Set(estado.ids).size,
    ids: estado.ids.join(","),
  }));

  const esperado = ["A1", "A2", "B1", "B2", "C1"].flatMap((b) => Array(4).fill(b));
  if (forma.bandas.join(",") !== esperado.join(",")) {
    problemas.push(`el sorteo no dio 4 por banda en orden: ${forma.bandas.join(",")}`);
  }
  if (forma.repetidas) problemas.push(`el sorteo repitió ${forma.repetidas} pregunta(s)`);

  /* Dos visitas seguidas no deberían recibir el mismo test. Con 10 por banda,
     que coincidan las 20 por azar es 1 en 10^5 largos: si pasa, no es suerte. */
  await page.reload({ waitUntil: "networkidle" });
  const otros = await page.evaluate(() => estado.ids.join(","));
  if (otros === forma.ids) problemas.push("dos visitas seguidas recibieron exactamente las mismas preguntas");
  else console.log(`  · el sorteo da 4 por banda de un banco de ${forma.banco} y cambia en cada visita`);

  await ctx.close();
}

/* El progreso a medio camino: son 20 preguntas y casi siempre en el teléfono */
{
  const { ctx, page } = await nuevaPagina(ANCHOS[1], "test a medias");
  await page.goto(`${base}/test-de-nivel/`, { waitUntil: "networkidle" });
  await page.click("#btn-empezar");
  for (let i = 0; i < 5; i++) await page.click(".opcion >> nth=0");

  /* Con banco y sorteo, retomar tiene que devolver LAS MISMAS preguntas: si
     vuelven otras, las respuestas ya dadas quedan apuntando a preguntas que
     esa persona nunca vio, y el nivel sale de cualquier lado. */
  const mias = await page.evaluate(() => estado.ids.join(","));
  const enPantalla = (await page.textContent("#quiz-pregunta"))?.trim();

  await page.reload({ waitUntil: "networkidle" });
  if (!(await page.isVisible("#btn-continuar"))) {
    problemas.push("contesté 5 preguntas, recargué y no se puede retomar: se perdió el progreso");
  } else {
    await page.click("#btn-continuar");
    const donde = (await page.textContent("#quiz-progreso"))?.trim();
    const ahora = await page.evaluate(() => estado.ids.join(","));
    const pregunta = (await page.textContent("#quiz-pregunta"))?.trim();

    if (!/\b6\s*\/\s*20\b/.test(donde ?? "")) {
      problemas.push(`al retomar el test no volvió a la pregunta 6 (dice "${donde}")`);
    } else if (ahora !== mias) {
      problemas.push("al retomar cambiaron las preguntas: las respuestas ya dadas quedan sobre otras");
    } else if (pregunta !== enPantalla) {
      problemas.push(`al retomar cambió la pregunta en pantalla: era «${enPantalla}» y ahora dice «${pregunta}»`);
    } else {
      console.log("  · el test se retoma donde quedó, con las mismas preguntas");
    }
  }

  await ctx.close();
}

/* Home en inglés — y de paso, que la medición de visitas y clics funcione */
{
  const { ctx, page } = await nuevaPagina(ANCHOS[0], "home EN");
  const antes = eventosRecibidos.length;
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const visita = eventosRecibidos.slice(antes).find((e) => e.evento === "pagina");
  if (!visita) problemas.push("la home no registró la visita");
  else if (visita.detalle !== "/") problemas.push(`la visita se registró como "${visita.detalle}"`);

  await page.click("[data-lang-btn]");
  const h1 = await page.textContent("h1");
  if (!/Speak English/i.test(h1 ?? "")) problemas.push(`home EN: el titular quedó en «${h1?.trim()}»`);
  await capturar(page, "home-en");

  await page.waitForTimeout(300);
  const clic = eventosRecibidos.slice(antes).find((e) => e.evento === "clic");
  if (!clic) problemas.push("el clic al botón de idioma no se registró");
  else if (clic.detalle !== "idioma") problemas.push(`el clic se registró como "${clic.detalle}"`);
  else console.log("  · se registran las visitas y los clics");

  await ctx.close();
}

/* 404 */
{
  const { ctx, page } = await nuevaPagina(ANCHOS[0], "404");
  await page.goto(`${base}/no-existe`, { waitUntil: "networkidle" });
  await capturar(page, "404");
  await ctx.close();
}

await navegador.close();
server.close();

/* ---------- Informe ------------------------------------------------------- */

if (problemas.length) {
  console.log("\nPROBLEMAS\n");
  for (const p of problemas) console.log(`  ✕ ${p}`);
  console.log(`\n✕ ${problemas.length} ${problemas.length === 1 ? "problema" : "problemas"}. Capturas en .shots/\n`);
  process.exit(1);
}
console.log("\n✓ Sin errores de JS ni recursos rotos. Capturas en .shots/\n");
