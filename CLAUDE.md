# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sitio de In Context English (incontextenglish.com.ar), la academia de inglés online
de Victoria Rossa. Es un sitio estático servido por Cloudflare Workers.

El repositorio y su documentación están en castellano. Seguí en castellano.

## Comandos

```bash
npm run dev      # wrangler dev
npm run deploy   # wrangler deploy
cd public && python3 -m http.server 8788   # alternativa sin instalar nada
```

**No hay build, ni tests, ni linter.** Lo que está en `public/` es byte por byte lo
que se publica. No agregues un bundler ni un framework sin que te lo pidan: la
ausencia de toolchain es deliberada, permite que cualquiera edite un HTML y publique.

Para verificar cambios visuales hay Chromium con Playwright en el entorno
(`/opt/node22/lib/node_modules/playwright`). Levantá el server local y sacá
capturas a 1440px y 390px — el sitio nació de un diseño de ancho fijo y las
regresiones de layout aparecen casi siempre en mobile.

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

- **El número de WhatsApp está repetido en cuatro lugares**: `WA` en `app.js`,
  `WA_TEST` en `quiz.js`, y los `href="https://wa.me/..."` de los dos HTML. Si lo
  cambian, cambialo en todos.
- **Grillas con imágenes**: los hijos de grid tienen `min-width:auto` y una imagen
  ancha revienta la columna. Hay un bloque en `styles.css` que pone `min-width:0`
  en las grillas existentes; una grilla nueva con imagen adentro necesita lo mismo.
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
