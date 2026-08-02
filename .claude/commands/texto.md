---
description: Cambia textos del sitio manteniendo el bilingüe ES/EN
argument-hint: [qué texto cambiar y por cuál]
allowed-tools: Edit, Read, Grep, Glob, Bash(npm run check)
---

Cambiá el texto que te pido, respetando cómo funciona el bilingüe de este sitio:

- El **castellano va como contenido** del elemento y el **inglés en `data-en`**.
  Si el texto lleva marcado adentro (por ejemplo un `<em>`), el atributo es
  `data-en-html` y guarda el HTML completo.
- Si cambiás el castellano, **cambiá también su `data-en`**: si no, la versión
  en inglés queda diciendo otra cosa.
- Si el texto es nuevo y no tiene `data-en`, ponéselo. Sin eso queda sin traducir
  y `npm run check` lo va a marcar como error.
- El inglés es británico y de registro cercano, igual que el resto del sitio.
  No traduzcas literal: el sitio está escrito, no traducido.
- Si el texto aparece repetido en varias páginas, cambialo en todas (buscá con
  Grep antes de editar).

Al terminar corré `npm run check` y decime en una línea qué cambiaste.

Pedido: $ARGUMENTS
