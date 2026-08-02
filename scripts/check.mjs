#!/usr/bin/env node
/* ==========================================================================
   npm run check — validador del sitio, sin dependencias.

   El repo no tiene build ni tests: lo que está en public/ es lo que se publica.
   Este script ocupa ese lugar. Revisa las cosas que se rompen en silencio,
   las mismas que están anotadas como trampas en CLAUDE.md.

   Sale con código 1 si hay errores. Los avisos no cortan.
   ========================================================================== */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(RAIZ, "public");
const DOMINIO = "https://incontextenglish.com.ar";

const errores = [];
const avisos = [];
const error = (archivo, msg) => errores.push({ archivo, msg });
const aviso = (archivo, msg) => avisos.push({ archivo, msg });

/* ---------- utilidades ---------------------------------------------------- */

function archivosDe(dir, filtro) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivosDe(ruta, filtro));
    else if (filtro(ruta)) salida.push(ruta);
  }
  return salida;
}

const rel = (ruta) => relative(RAIZ, ruta);
const leer = (ruta) => readFileSync(ruta, "utf8");

/** Quita <script>, <style> y comentarios: su contenido no es texto visible. */
const sinCodigo = (html) =>
  html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

/** Todos los atributos de una etiqueta de apertura, como objeto. */
function atributos(etiqueta) {
  const attrs = {};
  for (const m of etiqueta.matchAll(/([a-zA-Z_:][-\w:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s">]+))?/g)) {
    if (m.index === 0) continue; // el nombre de la etiqueta
    const valor = m[2] ?? "";
    attrs[m[1].toLowerCase()] = valor.replace(/^["']|["']$/g, "");
  }
  return attrs;
}

const paginas = archivosDe(PUBLIC, (r) => r.endsWith(".html"));
const scripts = archivosDe(PUBLIC, (r) => r.endsWith(".js"));

/** Ruta pública ("/", "/test-de-nivel/") de un index.html. */
function rutaPublica(archivo) {
  const r = "/" + relative(PUBLIC, archivo).split(/[\\/]/).join("/");
  return r.endsWith("/index.html") ? r.slice(0, -"index.html".length) : r;
}

/* ==========================================================================
   1. Referencias locales: todo lo que el HTML pide tiene que existir
   ========================================================================== */

const referenciados = new Set();

function resolverLocal(url, desde) {
  const limpia = url.split("#")[0].split("?")[0];
  if (!limpia || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(limpia)) return null;
  const absoluta = limpia.startsWith("/")
    ? limpia
    : posix.resolve(posix.dirname(rutaPublica(desde)), limpia);
  return absoluta;
}

function verificarRuta(rutaAbs, archivo, contexto) {
  const destino = join(PUBLIC, rutaAbs);
  if (existsSync(destino) && statSync(destino).isDirectory()) {
    if (!existsSync(join(destino, "index.html"))) {
      error(rel(archivo), `${contexto} apunta a "${rutaAbs}" y esa carpeta no tiene index.html`);
      return;
    }
    referenciados.add(posix.join(rutaAbs, "index.html"));
    return;
  }
  if (!existsSync(destino)) {
    error(rel(archivo), `${contexto} apunta a "${rutaAbs}" y ese archivo no existe`);
    return;
  }
  referenciados.add(rutaAbs);
}

for (const archivo of paginas) {
  const html = leer(archivo);

  // href / src
  for (const m of html.matchAll(/\b(href|src)\s*=\s*"([^"]*)"/g)) {
    const abs = resolverLocal(m[2], archivo);
    if (abs) verificarRuta(abs, archivo, `${m[1]}="${m[2]}"`);
  }

  // srcset: "imagen.webp 480w, otra.webp 800w"
  for (const m of html.matchAll(/\bsrcset\s*=\s*"([^"]*)"/g)) {
    for (const parte of m[1].split(",")) {
      const url = parte.trim().split(/\s+/)[0];
      const abs = resolverLocal(url, archivo);
      if (abs) verificarRuta(abs, archivo, `srcset "${url}"`);
    }
  }

  // URLs absolutas al propio dominio (og:image, logo del JSON-LD, canonical…)
  for (const m of html.matchAll(new RegExp(`${DOMINIO}([^"'\\s]*)`, "g"))) {
    const ruta = m[1] || "/";
    if (/\.(webp|jpe?g|png|svg|css|js|xml|txt)$/i.test(ruta)) verificarRuta(ruta, archivo, `URL "${ruta}"`);
  }
}

/* Assets versionados que ya nadie usa */
for (const asset of archivosDe(join(PUBLIC, "assets"), () => true)) {
  const ruta = "/" + relative(PUBLIC, asset).split(/[\\/]/).join("/");
  if (!referenciados.has(ruta)) aviso(rel(asset), "no lo referencia ningún HTML");
}

/* ==========================================================================
   2. El número de WhatsApp está repetido: que sea siempre el mismo
   ========================================================================== */

const numeros = new Map(); // número -> [dónde]
const anotar = (num, donde) => {
  if (!numeros.has(num)) numeros.set(num, []);
  if (!numeros.get(num).includes(donde)) numeros.get(num).push(donde);
};

for (const archivo of [...paginas, ...scripts]) {
  const texto = leer(archivo);
  for (const m of texto.matchAll(/wa\.me\/(\d+)/g)) anotar(m[1], rel(archivo));
  for (const m of texto.matchAll(/\bWA(?:_\w+)?\s*=\s*"(\d+)"/g)) anotar(m[1], rel(archivo));
  // teléfono del JSON-LD: +54-9-351-564-5110
  for (const m of texto.matchAll(/"telephone"\s*:\s*"([+\d\s()-]+)"/g)) {
    anotar(m[1].replace(/\D/g, ""), rel(archivo) + " (JSON-LD)");
  }
  // texto visible del teléfono: +54 9 351 564-5110
  for (const m of texto.matchAll(/>\s*(\+54[\d\s()-]{8,})\s*</g)) {
    anotar(m[1].replace(/\D/g, ""), rel(archivo) + " (texto visible)");
  }
}

if (numeros.size > 1) {
  const detalle = [...numeros.entries()]
    .map(([num, donde]) => `        ${num} → ${donde.join(", ")}`)
    .join("\n");
  error("todo el repo", `hay ${numeros.size} números de WhatsApp distintos:\n${detalle}`);
}

/* ==========================================================================
   3. Bilingüe: texto en castellano sin su data-en
   ========================================================================== */

const PISTAS_ES = /[áéíóúñ¿¡]|\b(el|la|los|las|un|una|de|del|que|con|para|por|tu|tus|más|sin|como)\b/i;

for (const archivo of paginas) {
  const html = sinCodigo(leer(archivo));

  // <title> tiene que llevar data-en
  const title = html.match(/<title\b([^>]*)>([\s\S]*?)<\/title>/i);
  if (title && !/\bdata-en\b/.test(title[1])) {
    error(rel(archivo), "el <title> no tiene data-en: la pestaña queda en castellano en modo EN");
  }

  // Elementos hoja con texto: si el texto parece castellano, exigimos data-en
  const hojas = html.matchAll(/<(p|h1|h2|h3|h4|li|span|b|a|button|option|dd|dt|label|td|th)\b([^>]*)>([^<]*)<\/\1>/gi);
  for (const m of hojas) {
    const attrs = atributos("x " + m[2]);
    const texto = m[3].replace(/\s+/g, " ").trim();
    if (!texto || texto.length < 4) continue;
    if ("data-en" in attrs || "data-en-html" in attrs) {
      if (!attrs["data-en"] && !attrs["data-en-html"]) {
        error(rel(archivo), `data-en vacío en «${texto.slice(0, 45)}…»`);
      }
      continue;
    }
    if (!PISTAS_ES.test(texto)) continue;
    // Si un ancestro cercano ya traduce por innerHTML, no hace falta
    const antes = html.slice(0, m.index);
    const aperturaPadre = antes.lastIndexOf("<");
    if (aperturaPadre !== -1 && /data-en-html/.test(antes.slice(aperturaPadre))) continue;
    error(rel(archivo), `sin data-en: «${texto.slice(0, 60)}${texto.length > 60 ? "…" : ""}»`);
  }
}

/* ==========================================================================
   4. Los IDs que busca quiz.js tienen que existir en la página del test
   ========================================================================== */

const idsDe = (html) => new Set([...html.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map((m) => m[1]));

const paginaTest = paginas.find((p) => rutaPublica(p) === "/test-de-nivel/");
const quiz = scripts.find((s) => s.endsWith("quiz.js"));

if (paginaTest && quiz) {
  const disponibles = idsDe(leer(paginaTest));
  const js = leer(quiz);
  const buscados = new Set([
    ...[...js.matchAll(/\$\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]),
    ...[...js.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]),
  ]);
  for (const id of buscados) {
    if (!disponibles.has(id)) {
      error(rel(quiz), `busca #${id} y no existe en ${rel(paginaTest)} — el test rompe al abrirlo`);
    }
  }
}

/* ==========================================================================
   4 bis. Etiquetas de medición: únicas por página y con el formato que acepta
   el Worker. Dos elementos con la misma etiqueta se suman sin que se note, y
   una etiqueta con mayúsculas o acentos la rechaza el endpoint en silencio.
   ========================================================================== */

const FORMATO_ETIQUETA = /^[a-z0-9/-]{1,40}$/;

for (const archivo of paginas) {
  const vistas = new Map();
  for (const m of leer(archivo).matchAll(/\bdata-evento\s*=\s*"([^"]*)"/g)) {
    vistas.set(m[1], (vistas.get(m[1]) ?? 0) + 1);
  }
  for (const [etiqueta, veces] of vistas) {
    if (!FORMATO_ETIQUETA.test(etiqueta)) {
      error(rel(archivo), `data-evento="${etiqueta}" no lo acepta el endpoint (minúsculas, números y guiones, hasta 40)`);
    }
    if (veces > 1) {
      error(rel(archivo), `data-evento="${etiqueta}" está ${veces} veces: los clics de los dos se van a sumar juntos`);
    }
  }
}

/* ==========================================================================
   5. Orden de scripts: app.js antes que quiz.js, los dos con defer
   ========================================================================== */

for (const archivo of paginas) {
  const html = leer(archivo);
  const tags = [...html.matchAll(/<script\b([^>]*)\bsrc\s*=\s*"([^"]+)"([^>]*)>/g)].map((m) => ({
    src: m[2],
    defer: /\bdefer\b/.test(m[1] + m[3]),
    pos: m.index,
  }));

  for (const t of tags) {
    if (!t.defer && t.src.startsWith("/")) {
      error(rel(archivo), `<script src="${t.src}"> sin defer: bloquea el render`);
    }
  }

  const app = tags.find((t) => t.src.endsWith("app.js"));
  const q = tags.find((t) => t.src.endsWith("quiz.js"));
  if (q && !app) {
    error(rel(archivo), "carga quiz.js sin app.js: el test no se traduce");
  } else if (q && app && app.pos > q.pos) {
    error(rel(archivo), "quiz.js se carga antes que app.js — ese orden importa (ver CLAUDE.md)");
  }
}

/* ==========================================================================
   6. SEO: canonical, og:url y sitemap coherentes con las páginas reales
   ========================================================================== */

const rutasReales = paginas.map(rutaPublica).filter((r) => !r.endsWith("404.html"));

for (const archivo of paginas) {
  const ruta = rutaPublica(archivo);
  if (ruta.endsWith("404.html")) continue;
  const html = leer(archivo);
  const esperado = DOMINIO + ruta;

  const canonical = html.match(/<link\b[^>]*rel\s*=\s*"canonical"[^>]*href\s*=\s*"([^"]+)"/i);
  if (!canonical) error(rel(archivo), "no tiene <link rel=canonical>");
  else if (canonical[1] !== esperado) {
    error(rel(archivo), `canonical dice "${canonical[1]}" y la página vive en "${esperado}"`);
  }

  const ogUrl = html.match(/<meta\b[^>]*property\s*=\s*"og:url"[^>]*content\s*=\s*"([^"]+)"/i);
  if (ogUrl && ogUrl[1] !== esperado) {
    error(rel(archivo), `og:url dice "${ogUrl[1]}" y la página vive en "${esperado}"`);
  }

  const desc = html.match(/<meta\b[^>]*name\s*=\s*"description"[^>]*content\s*=\s*"([^"]*)"/i);
  if (!desc || desc[1].trim().length < 50) {
    aviso(rel(archivo), "meta description ausente o muy corta (menos de 50 caracteres)");
  }
}

const sitemap = join(PUBLIC, "sitemap.xml");
if (existsSync(sitemap)) {
  const locs = [...leer(sitemap).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) {
    const ruta = loc.replace(DOMINIO, "");
    if (!rutasReales.includes(ruta)) error("public/sitemap.xml", `lista "${loc}" y esa página no existe`);
  }
  for (const ruta of rutasReales) {
    if (!locs.includes(DOMINIO + ruta)) {
      aviso("public/sitemap.xml", `falta "${DOMINIO + ruta}" — Google no la va a encontrar sola`);
    }
  }
}

/* ==========================================================================
   Informe
   ========================================================================== */

const agrupar = (lista) => {
  const porArchivo = new Map();
  for (const { archivo, msg } of lista) {
    if (!porArchivo.has(archivo)) porArchivo.set(archivo, []);
    porArchivo.get(archivo).push(msg);
  }
  return porArchivo;
};

const imprimir = (titulo, lista, marca) => {
  if (!lista.length) return;
  console.log(`\n${titulo}\n`);
  for (const [archivo, msgs] of agrupar(lista)) {
    console.log(`  ${archivo}`);
    for (const m of msgs) console.log(`    ${marca} ${m}`);
    console.log("");
  }
};

imprimir("AVISOS", avisos, "·");
imprimir("ERRORES", errores, "✕");

const total = `${errores.length} ${errores.length === 1 ? "error" : "errores"}, ${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"}`;

if (errores.length) {
  console.log(`✕ ${total}\n`);
  process.exit(1);
}
console.log(`✓ Sitio consistente — ${total}\n`);
