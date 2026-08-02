---
description: Verifica, commitea y publica los cambios pendientes
argument-hint: [descripción corta del cambio]
allowed-tools: Bash(npm run check), Bash(npm run shots), Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Read
---

Publicá lo que está pendiente. En orden y sin saltear pasos:

1. `git status` y `git diff` para ver qué cambió realmente.
2. `npm run check` y `npm run shots`. **Si alguno falla, pará acá**, contame qué
   rompió y no commitees nada.
3. Mirá la captura mobile de lo que hayas tocado.
4. Commit en castellano, en imperativo, describiendo el cambio de cara al sitio
   (no el archivo tocado). Ejemplo: «Suma la sección de testimonios».
5. `git push -u origin <rama actual>`.

Recordá que el despliegue es automático: Workers Builds publica solo cuando
llega el push a la rama de producción. No corras `wrangler deploy` a mano.

Contexto del cambio: $ARGUMENTS
