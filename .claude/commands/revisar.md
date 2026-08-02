---
description: Valida el sitio y saca capturas a 1440px y 390px para revisar el resultado
allowed-tools: Bash(npm run check), Bash(npm run shots), Read, Glob
---

Revisá el estado del sitio:

1. Corré `npm run check` (consistencia: enlaces rotos, textos sin `data-en`,
   número de WhatsApp desincronizado, ids que el JS busca y no existen, SEO).
2. Corré `npm run shots` (prueba de humo con Chromium: errores de JS, recursos
   que no cargan, el test de nivel de punta a punta, cambio de idioma).
3. Mirá las capturas de `.shots/` — **siempre incluí `home-mobile.png` y
   `test-intro-mobile.png`**: el diseño nació de un ancho fijo y las regresiones
   de layout aparecen casi siempre en mobile.

Contame en dos o tres líneas qué encontraste. Si algo está roto, arreglalo y
volvé a correr los dos comandos. Si está todo bien, decilo y no toques nada.

$ARGUMENTS
