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

La regla de nivel **no** es un porcentaje del total. El nivel es la banda más
alta que cumple las dos cosas a la vez:

1. **domina esa banda**: al menos 3 aciertos de sus 4 preguntas, y
2. **sostiene el acumulado**: desde A1 hasta esa banda inclusive, al menos el
   75% de aciertos.

La segunda condición es la que impide que un golpe de suerte en las difíciles
levante el nivel; la primera, que un buen acumulado lo levante sin dominar la
banda. Se recorren las cinco bandas y gana la más alta que califica: **no se
corta en la primera que falla**.

La regla anterior venía del prototipo —subir mientras la banda tuviera 3 de 4,
cortando en la primera que fallara— y **daba resultados falsos**: fallar dos
preguntas de A2 por distracción tapaba todo lo demás, así que se podía terminar
con 18 de 20 correctas y la pantalla diciendo «A1 · Principiante». Cambiada el
2/8/2026. Los umbrales van como proporción (`UMBRAL = 0.75`) y no como «3», para
que sigan valiendo si alguna banda deja de tener cuatro preguntas.

**Saltar cuenta igual que errar**, y es a propósito: quien saltea no sabía la
respuesta. Lo que evita saltear es inflar el nivel adivinando, que con cuatro
opciones acierta una de cada cuatro veces. El resultado sí las muestra aparte
(«14/20 correctas · 3 sin contestar») porque si no parece que erró seis.

**La regla no se ve mirando la pantalla: un cambio acá sale mal en silencio y
manda gente al curso equivocado.** Por eso `npm run shots` la corre contra ocho
patrones de respuestas armados a mano. Si la tocás, ampliá esos casos.

### 4. Hay exactamente un endpoint, y es opcional

`src/index.js` es todo el código de servidor. `run_worker_first: ["/api/*"]` en
`wrangler.jsonc` lo limita a esa ruta: cualquier otra la sirve Workers directo
desde `public/`, sin pasar por el script. El sitio sigue siendo estático.

Recibe `POST /api/evento` y anota en D1 (binding `DB`, tabla `eventos`, esquema
en `schema.sql`) el uso del sitio: `pagina`, `clic`, `scroll`, `inicio` y
`resultado`. **No guarda nada personal** —ni mail, ni nombre, ni IP, ni las
respuestas— y **los eventos no se correlacionan entre sí**: no hay identificador
de visita, así que se puede contar «200 visitas y 30 clics» pero no seguir a
nadie por el sitio. Eso es deliberado; no le agregues un id de sesión.

Del lado del cliente es `registrar()` en **`app.js`** (lo cargan todas las
páginas; `quiz.js` la usa para los eventos del test). Es deliberadamente
descartable: va con `keepalive`, ignora la respuesta y se traga cualquier error.
**Si el registro falla, el sitio tiene que seguir funcionando igual.** No lo
conviertas en `await` ni le pongas manejo de errores visible.

**Para contar un elemento nuevo, ponele `data-evento="etiqueta"` en el HTML** y
listo: hay un listener delegado. Es explícito a propósito, porque hay ocho links
a WhatsApp con el mismo `href` y lo que interesa es saber cuál se toca. Las
etiquetas van en minúsculas, con números y guiones, hasta 40 caracteres — el
Worker rechaza cualquier otra cosa y `npm run check` avisa si una se repite en la
misma página (si no, los clics de los dos elementos se suman sin que se note).

Para consultar los datos no hace falta panel: el conector de Cloudflare permite
`d1_database_query` sobre la base `incontextenglish`.

## Decisiones deliberadas — no son bugs

- **El formulario no manda mails.** Arma el texto y abre `wa.me` con el mensaje
  escrito. El sitio no tiene backend a propósito — el endpoint de `/api/evento` es
  la única excepción, y no recibe datos de contacto. Si alguna vez hace falta
  recibir por correo, es sumar Formspree o una Worker Function, no "arreglar" el
  formulario.
- **El Worker se llama `cronometro`**, por el nombre viejo del repo del que salió
  éste. Los Workers no se renombran: habría que crear uno nuevo y mover los dos
  custom domains, con caída del sitio a cambio de una URL `.workers.dev` que nadie
  ve. **Dejarlo así**, y que `name` en `wrangler.jsonc` diga `cronometro`: Workers
  Builds ignora ese campo y despliega igual, pero un `npm run deploy` desde una
  máquina sí lo usa, y con otro nombre crearía un Worker paralelo sin dominios.
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

### Comprobar si un push llegó a publicarse

Está el conector **Cloudflare Developer Platform** (MCP). El Worker se llama
`cronometro`: mirá su `modified_on` con `workers_list` antes y después del push.
Si no cambió, el deploy no corrió o falló.

**Hacelo siempre, porque el build puede morir sin que nadie se entere.** El
20/8/2026 se fusionó a `main` y el sitio quedó **diez días sin publicar** sin
ninguna señal: `main` impecable en GitHub, el sitio en vivo intacto y viejo. El
log de ese build tiene dos líneas y ninguna es del repo:

```
15:48:41  Initializing build environment...
15:54:24  Build failed to initialize and was timed out
```

Nunca llegó a clonar ni a correr `npm`: se colgó aprovisionando el entorno y
Cloudflare lo dio por vencido a los seis minutos. **No fue el código, ni el
comando de deploy, ni los permisos del build token** —el mismo token y el mismo
`npx wrangler deploy` desplegaron bien el 30/8—, y **Workers Builds no
reintenta solo**. Si vuelve a pasar, alcanza con relanzar el build desde el
panel o pushear de nuevo; no hay nada que arreglar.

### Leer los builds sin entrar al panel

La [Builds API](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/)
sí cuenta lo que el conector MCP no. Necesita un token **de usuario** (los de
cuenta dan «Invalid token») con *Configuración de Workers Builds: Editar* y
*Scripts de Workers: Leer*, y el `tag` del Worker, no su nombre —el de
`cronometro` es `bd91e0fa7ba64360896b1c337c45223f`:

```
GET /accounts/{acct}/builds/workers/{tag}/builds      # estado de cada build
GET /accounts/{acct}/builds/builds/{build_uuid}/logs  # el log, que es lo que importa
```

### Publicar a mano cuando el build no publica

Dos caminos, los dos comprobados el 30/8/2026:

- **Con un API token de Cloudflare** (lo crea el dueño en Tokens de API):
  `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… npx wrangler deploy`. Sale bien
  porque `name` en `wrangler.jsonc` dice `cronometro`; con otro nombre crearía un
  Worker paralelo sin los custom domains. El token es del dueño: usalo como
  variable de entorno del comando, **nunca lo escribas en un archivo ni lo
  commitees**, y avisale que conviene borrarlo después de usarlo.
- **Sin token, desde el panel**: cada push a una rama deja una versión subida
  («Historial de versiones»). Si su contenido es el mismo que el de `main`
  —comprobalo con `git diff <commit> origin/main`, tiene que salir vacío—, se la
  puede implementar desde ahí y publica exactamente lo mismo.

Los dos publican lo mismo que habría publicado el build.

### Qué rama publica: sólo `main`

**Publica `main` y nada más.** Un push a una rama de trabajo se construye igual,
pero queda como versión con URL de vista previa, sin tocar el sitio.

Son dos comandos distintos en Workers Builds, y conviene saber cuál es cuál
porque de eso depende que un push salga o no en vivo:

| Campo | Cuándo corre | Valor |
|---|---|---|
| Implementar comando | rama de producción (`main`) | `npx wrangler deploy` → publica |
| Comando de rama no de producción | las demás ramas | `npx wrangler versions upload` → sube sin publicar |

Están en Compute (Workers) → `cronometro` → Configuración → Configuración de
compilación. Hasta el 2/8/2026 el segundo también decía `wrangler deploy`, y por
eso cualquier rama salía a producción; se cambió ese día al valor por defecto de
Cloudflare. **Si alguna vez un push a una rama de trabajo aparece en vivo, mirá
ahí primero.**

Comprobado el 2/8/2026 con las dos mitades del hecho: el push subió una versión
nueva (cambió `modified_on` del Worker) y el contenido en vivo quedó idéntico
(mismo md5 de `quiz.js` antes y después). Comprobarlo con una sola de las dos
engaña: si mirás nada más que el contenido, no distinguís «no publicó» de «el
build todavía no corrió».

**Por lo tanto, para publicar hay que fusionar a `main` y pushear `main`.** El
flujo es: trabajar en la rama → `npm run verificar` → commit → push (queda en
vista previa) → fusionar a `main` y pushear cuando esté aprobado.

Eso no relaja la regla de siempre: `npm run verificar` va antes del commit, no
después. La vista previa avisa de lo que se ve; no avisa de un `data-en` que
falta ni de una etiqueta de medición repetida.

Lo que todavía no puede publicarse **no se deja sin pushear: se guarda fuera de
`public/`**, en `contenido/` (ver `contenido/README.md`). Workers sirve
únicamente `public/` —`assets.directory` en `wrangler.jsonc`—, así que un push
que sólo toca `contenido/` corre el deploy y deja el sitio byte por byte igual.
Dejarlo sin pushear es peor que pushearlo: el trabajo queda sólo en la máquina
donde se hizo, y en una sesión remota eso se pierde con el contenedor.

**Terminar un cambio incluye pushearlo.** Pedido explícito del dueño (2/8/2026):
no dejes trabajo terminado sólo commiteado en local esperando confirmación. El
orden es siempre el mismo: `npm run verificar` → commit → `git push -u origin
<rama>`. Pushear la rama de trabajo **no publica nada**, así que no hay motivo
para retenerlo: lo único que no se pushea es lo que está a medio hacer.

Fusionar a `main` es otra cosa, porque eso sí publica. Salvo que el dueño haya
dicho lo contrario, preguntá antes de fusionar.

Ese conector **no trae** el estado ni los logs de Workers Builds, ni analítica, ni
purga de caché, ni DNS: para saber *por qué* falló un build hay que ir al panel de
Cloudflare. Sí permite leer el código y los assets que están efectivamente en
producción, útil para distinguir «no se desplegó» de «es caché».

## Pendientes de contenido

Fotos profesionales (las actuales son selfies).

**Los precios no van en el sitio.** Lo decidió Victoria el 17/8/2026: cambian
según el plan, el grupo y la época, y prefiere pasarlos por WhatsApp. Por eso
`/informacion/` explica todo lo demás —modalidad, duración, planes,
reprogramaciones, feriados, cuándo y en qué moneda se abona— y para los valores
manda a WhatsApp. Si alguna vez se agrega una lista, hay que preguntarle antes.

Los **datos de cobro** (alias, Revolut, PayPal) tampoco van en el sitio, y no por
olvido: un alias publicado es una invitación a que alguien cobre en nombre de
In Context English. Viven en `contenido/bases-y-condiciones.md`, que es la
versión que Victoria le manda a cada alumno antes de empezar.

Los **cursos de 12 clases** (`A1.1`, `A1.2`…) que ella quiere armar están
propuestos en `contenido/cursos-por-nivel.md` y esperan que apruebe los objetivos
de cada uno. Ahí está anotado lo que hay que resolver antes, empezando por que 12
clases son tres meses con una clase semanal pero mes y medio con dos.

### Lo que hay que revisar se manda como archivo

Pedido explícito del dueño (18/8/2026): **no lo mandes a leer el repo.** No es
programador y no entra a GitHub, así que un texto que espera su decisión —o la de
Victoria— apuntado como «está en `contenido/`» no lo lee nadie.

- Textos y propuestas → `node contenido/_documentos.mjs` deja los PDF en
  `contenido/salida/` (ver `contenido/README.md`). El `.md` sigue siendo la
  fuente: si vuelve con cambios se edita el `.md` y se rearma.
- Páginas del sitio → las capturas de `npm run shots`.

En los dos casos: generarlos y adjuntarlos en la respuesta, no describirlos.

Los testimonios ya tienen sección (`#testimonios` en la home, 6/8/2026). Salieron
de capturas de WhatsApp que pasó Victoria, y por eso hay dos reglas:

- **Van con nombre de pila o inicial, nunca con el apellido completo.** Son
  mensajes privados; el alumno mandó eso a su profesora, no al sitio.
- **Antes de publicar un testimonio nuevo hay que tener el permiso del alumno.**
  Si no consta que lo dio, el texto va a `contenido/`, no a `public/`.

Las citas están editadas para que se lean: se unieron mensajes seguidos de la
misma persona y se sacaron los emojis, sin cambiar lo que dijeron.
