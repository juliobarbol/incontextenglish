#!/usr/bin/env node
/* ==========================================================================
   contenido/_documentos.mjs — arma los PDF de lo que hay que revisar.

   Julio no entra a GitHub a revisar, así que lo que espera una decisión —de él
   o de Victoria— se le manda como archivo. Este script convierte los .md de
   contenido/ en PDF: se leen en el teléfono y se reenvían por WhatsApp, que es
   por donde Victoria contesta.

       node contenido/_documentos.mjs                     # todos
       node contenido/_documentos.mjs bases-y-condiciones # uno

   Sale en contenido/salida/, que no se versiona: se rearma cuando haga falta,
   igual que la planilla del banco de preguntas. **La fuente es el .md**: si
   Victoria pide un cambio, se toca el .md y se vuelve a correr esto. No hay
   versión editable dando vueltas justamente para que no haya dos textos.

   Convierte un subconjunto de Markdown —encabezados, párrafos, listas, tablas,
   negrita, cursiva y `código`— porque es lo único que usan estos archivos.

   **Las líneas de cita («> …») son notas internas y no entran al PDF.** Ahí va
   lo que le sirve a quien edita el .md pero no a quien recibe el documento.

   Usa el Chromium de Playwright, el mismo que `npm run shots`.
   ========================================================================== */

import { readFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, "salida");

/* ---------- Markdown -> HTML --------------------------------------------- */

const escapar = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Negrita, cursiva y código. Lo que falta completar va resaltado en amarillo:
    es lo único del documento que le pide algo a quien lo lee. */
const enLinea = (s) =>
  escapar(s)
    .replace(/`([^`]+)`/g, (_, txt) =>
      /^\[COMPLETAR/i.test(txt)
        ? `<span class="completar">${txt}</span>`
        : `<span class="marca">${txt}</span>`
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

const celdas = (linea) =>
  linea.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function aHtml(md) {
  const lineas = md.split("\n").filter((l) => !/^\s*>/.test(l)); // notas internas
  const salida = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    if (!linea.trim()) { i++; continue; }

    if (/^---+\s*$/.test(linea)) { salida.push("<hr>"); i++; continue; }

    const enc = linea.match(/^(#{1,3})\s+(.*)$/);
    if (enc) {
      const n = enc[1].length;
      salida.push(`<h${n}>${enLinea(enc[2])}</h${n}>`);
      i++;
      continue;
    }

    // Tabla: | a | b |  con la fila de guiones debajo
    if (linea.trim().startsWith("|") && /^\s*\|[\s:|-]+\|\s*$/.test(lineas[i + 1] ?? "")) {
      const cabecera = celdas(linea);
      i += 2;
      const filas = [];
      while (i < lineas.length && lineas[i].trim().startsWith("|")) {
        filas.push(celdas(lineas[i]));
        i++;
      }
      salida.push(
        "<table>",
        "<tr>" + cabecera.map((c) => `<th>${enLinea(c)}</th>`).join("") + "</tr>",
        ...filas.map((f) => "<tr>" + f.map((c) => `<td>${enLinea(c)}</td>`).join("") + "</tr>"),
        "</table>"
      );
      continue;
    }

    // Listas: "- " y "1. ", con las continuaciones indentadas del ítem
    const vinieta = linea.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (vinieta) {
      const ordenada = /\d/.test(vinieta[2]);
      const items = [];
      while (i < lineas.length) {
        const m = lineas[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (m) {
          items.push(m[3]);
          i++;
        } else if (lineas[i].startsWith("  ") && lineas[i].trim() && items.length) {
          items[items.length - 1] += " " + lineas[i].trim();
          i++;
        } else break;
      }
      const t = ordenada ? "ol" : "ul";
      salida.push(`<${t}>`, ...items.map((x) => `<li>${enLinea(x)}</li>`), `</${t}>`);
      continue;
    }

    // Párrafo: hasta la próxima línea en blanco
    const parrafo = [];
    while (i < lineas.length && lineas[i].trim() && !/^(#{1,3}\s|---+\s*$|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lineas[i])) {
      parrafo.push(lineas[i].trim());
      i++;
    }
    if (parrafo.length) salida.push(`<p>${enLinea(parrafo.join(" "))}</p>`);
    else i++;
  }

  return salida.join("\n");
}

/* Los colores son los del sitio. Las tipografías no: acá no hay salida a
   internet, así que se usan las del sistema. Importa que se lea. */
const ESTILO = `
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #2b1414; line-height: 1.55; margin: 0; }
  h1 { font-size: 25pt; color: #6e1112; margin: 0 0 2pt; line-height: 1.15; }
  h2 { font-size: 14pt; color: #6e1112; margin: 22pt 0 6pt; page-break-after: avoid; }
  h3 { font-size: 12pt; color: #05795a; margin: 16pt 0 4pt; page-break-after: avoid; }
  h1 + h2 { margin-top: 10pt; color: #05795a; font-size: 12.5pt; font-weight: 600; }
  p { margin: 8pt 0; }
  ul, ol { margin: 8pt 0; padding-left: 18pt; }
  li { margin-bottom: 5pt; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; page-break-inside: avoid; }
  th { background: #f7f1e6; color: #6e1112; text-align: left; }
  th, td { border: 1px solid #d8cdb8; padding: 7pt 9pt; font-size: 10.5pt; vertical-align: top; }
  .marca { background: #f0eae0; font-family: 'Courier New', monospace; font-size: 9.5pt; padding: 1pt 3pt; }
  .completar { background: #fbc93e; font-family: 'Courier New', monospace; font-size: 9.5pt; font-weight: bold; padding: 1pt 4pt; }
  strong { color: #6e1112; }
  hr { border: none; border-top: 1px solid #d8cdb8; margin: 20pt 0; }
`;

/* ---------- Chromium ------------------------------------------------------ */

function abrirChromium() {
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
      try {
        playwright = require(join(base, "playwright"));
        break;
      } catch {
        /* probamos el siguiente */
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

/* ---------- Conversión ---------------------------------------------------- */

const pedidos = process.argv.slice(2);
const fuentes = readdirSync(AQUI)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .filter((f) => !pedidos.length || pedidos.includes(basename(f, ".md")));

if (!fuentes.length) {
  console.error("No encontré ningún .md para convertir.");
  process.exit(1);
}

mkdirSync(SALIDA, { recursive: true });

const navegador = await abrirChromium();
const page = await navegador.newPage();

for (const fuente of fuentes) {
  const nombre = basename(fuente, ".md");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${nombre}</title><style>${ESTILO}</style></head>
<body>${aHtml(readFileSync(join(AQUI, fuente), "utf8"))}</body></html>`;

  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: join(SALIDA, `${nombre}.pdf`),
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "18mm", left: "18mm", right: "18mm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      '<div style="width:100%;font-size:8pt;color:#8a7d70;font-family:Arial,sans-serif;padding:0 18mm;text-align:right">' +
      'In Context English · <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
  });

  console.log(`  ✓ contenido/salida/${nombre}.pdf`);
}

await navegador.close();
