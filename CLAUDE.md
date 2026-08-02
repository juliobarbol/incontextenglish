# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sitio de In Context English (incontextenglish.com.ar), la academia de inglés online
de Victoria Rossa. Es un sitio estático servido por Cloudflare Workers.

El repositorio y su documentación están en castellano. Seguí en castellano.

## Comandos

```bash
npm run check    # validador del sitio (rápido, sin dependencias)
npm run shots    # capturas 1440/390 + prueba de humo con Chromium
npm run verificar  # los dos, en orden
npm run dev      # wrangler dev (respeta _headers, útil para probar la CSP)
npm run deploy   # wrangler deploy
```

**No hay build, ni bundler, ni framework.** Lo que está en `public/` es byte por
byte lo que se publica, y eso es deliberado: permite que cualquiera edite un HTML
y publique. No agregues toolchain sin que te lo pidan.

Lo que sí hay es verificación, porque las roturas de este sitio son silenciosas:

- **`npm run check`** (`scripts/check.mjs`) — enlaces y assets que no existen,
  textos sin `data-en`, el número de WhatsApp desincronizado entre archivos, ids
  que `quiz.js` busca y el HTML ya no tiene, orden de los `<script>`, canonical /
  og:url / sitemap. Sale con código 1 si hay errores.
- **`npm run shots`** (`scripts/shots.mjs`) — levanta `public/` aplicando las
  cabeceras de `_headers` (así una CSP mal escrita se nota acá y no en producción),
  abre Chromium y deja capturas en `.shots/`. Además recorre el test de nivel
  entero, comprueba que el resultado se traduzca al cambiar de idioma, y falla si
  hay error de JS o un recurso local que no carga.

**Mirá siempre `.shots/home-mobile.png`**: el sitio nació de un diseño de ancho
fijo y las regresiones de layout aparecen casi siempre en mobile. Las capturas se
sacan sin las tipografías de Google (no hay salida a internet en el sandbox), así
que sirven para layout, no para juzgar la tipografía fina.

Un hook de `.claude/settings.json` corre `check` solo después de cada edición en
`public/`, así que si rompés algo te enterás en el mismo turno.

## Arquitectura

Tres cosas cruzan archivos y no se entienden mirando uno solo:

### 1. El bilingüe vive en atributos, no en archivos separados

No hay `/en/`. Cada nodo traducible lleva el castellano como contenido y el inglés
en un atributo:

- `data-en` → se intercambia por `textContent`
- `data-en-html` → se intercambia por `innerHTML` (para texto con marcado adentro,
  como el `<em>` del titular del hero)

`app.js` recorre el DOM, guarda el castellano original en `data-es` / `data-es-html`
la primera vez, y persiste la elección en `localStorage` bajo `ice-lang`. Funciona
también sobre `<title>` y `<option>`.

**Si agregás texto nuevo, ponele su `data-en` o queda sin traducir.**

### 2. `app.js` y `quiz.js` se hablan por un evento

El test de nivel genera su contenido por JS, así que el barrido de `data-en` no lo
alcanza. `app.js` emite `idiomacambiado` al final de `aplicarIdioma()`, y `quiz.js`
lo escucha para repintar la pantalla activa. Si tocás el orden o el nombre del
evento, el resultado del test deja de traducirse (y el bug es silencioso: la parte
estática sí cambia de idioma, sólo la dinámica queda vieja).

En las páginas los dos scripts van con `defer`, `app.js` primero. Ese orden importa.

### 3. El test es una máquina de estados de tres pantallas

`quiz.js` tiene un solo objeto `estado` (`pantalla`, `i`, `respuestas`) y las tres
secciones conviven en el HTML alternando `hidden`.

La regla de nivel es acumulativa y **no** es un porcentaje: recorre
`["A1","A2","B1","B2","C1"]` en orden y sube mientras la banda tenga 3 o más
aciertos de sus 4 preguntas; corta en la primera que falla. Viene del prototipo
original — está portada tal cual y no hay que "mejorarla" sin pedido explícito.

## Decisiones deliberadas — no son bugs

- **El formulario no manda mails.** Arma el texto y abre `wa.me` con el mensaje
  escrito. El sitio no tiene backend a propósito. Si alguna vez hace falta recibir
  por correo, es sumar Formspree o una Worker Function, no "arreglar" el formulario.
- **El Worker se llama `cronometro`**, por el nombre viejo del repo. Los Workers no
  se renombran: habría que crear uno nuevo y mover los dos custom domains, con
  caída del sitio a cambio de una URL `.workers.dev` que nadie ve. **Dejarlo así.**
- **Las fotos son selfies** y ya están recortadas y convertidas. Los PNG originales
  no están versionados; vinieron del export de Claude Design.

## Trampas conocidas

- **El número de WhatsApp está repetido en varios lugares**: `WA` en `app.js`,
  `WA_TEST` en `quiz.js`, los `href="https://wa.me/..."` de los HTML, y el
  `telephone` del JSON-LD de la home. Se deja repetido a propósito (centralizarlo
  exigiría inyectar los links por JS y perderlos para Google). `npm run check`
  falla si dejan de coincidir, así que cambialo en todos y corré el check.
- **Grillas con imágenes**: los hijos de grid tienen `min-width:auto` y una imagen
  ancha revienta la columna. Hay un bloque en `styles.css` que pone `min-width:0`
  en las grillas existentes; una grilla nueva con imagen adentro necesita lo mismo.
- **Hay una CSP en `public/_headers`.** Sólo permite scripts propios y las
  tipografías de Google. Si sumás analítica, un chat o un píxel, agregá su dominio
  ahí o el navegador lo bloquea sin decir nada. `npm run shots` aplica esas
  cabeceras localmente, así que el bloqueo aparece en la corrida.
- **Los `<button>` traen fondo propio del navegador.** `.btn` fuerza
  `background: transparent` para que las variantes fantasma se vean igual en `<a>`
  y en `<button>`. No lo saques.

## Infraestructura

No se deduce del código, y el procedimiento completo está en el README:

- La zona DNS está en la cuenta de Cloudflare del dueño de este repo, no en la de
  Victoria. **El dominio en cambio sigue registrado a nombre de ella en NIC.ar**, con
  su CUIT, y la renovación anual la paga ella. Cambiar la delegación requiere su
  clave de Mi Argentina.
- Nameservers actuales: `braden.ns.cloudflare.com` y `eleanor.ns.cloudflare.com`.
- El apex y `www` son los dos Custom Domains del mismo Worker; `www` devuelve 301 al
  apex por una Redirect Rule de la zona. Al crearla, Cloudflare avisa que "puede que
  la regla no se aplique" porque no reconoce el Custom Domain como registro proxeado
  — es falsa alarma, la regla funciona.
- Despliegue automático por Workers Builds conectado a este repo.

## Pendientes de contenido

Testimonios de alumnos (no existe la sección), fotos profesionales, y una página de
precios — hoy "Todos los niveles y precios" apunta a WhatsApp.
