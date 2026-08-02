#!/usr/bin/env node
/* ==========================================================================
   Hook PostToolUse: después de tocar cualquier archivo de public/, corre el
   validador y devuelve los errores en el momento.

   Existe porque las roturas de este sitio son silenciosas: un texto sin
   data-en, un id que quiz.js ya no encuentra o un número de WhatsApp cambiado
   a medias no se ven hasta que alguien abre la página. Mejor enterarse en el
   mismo turno que lo rompimos.

   Sale con código 2 para que el error vuelva a Claude. Nunca bloquea otra cosa.
   ========================================================================== */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

let entrada = "";
try {
  entrada = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let ruta = "";
try {
  ruta = JSON.parse(entrada)?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
}

// Sólo nos importa lo que se publica.
if (!/[\\/]public[\\/].*\.(html|js|css)$/.test(ruta)) process.exit(0);

try {
  execFileSync("node", [join(RAIZ, "scripts", "check.mjs")], { cwd: RAIZ, encoding: "utf8" });
} catch (e) {
  const salida = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
  console.error(`El validador del sitio encontró errores (npm run check):\n\n${salida}`);
  process.exit(2);
}
