# In Context English — incontextenglish.com.ar

Sitio de la academia de inglés online de Victoria Rossa. Es un sitio **estático**
(HTML, CSS y JavaScript sin dependencias) servido por **Cloudflare Workers**.
No hay build: lo que está en `public/` es exactamente lo que se publica.

Partió del diseño hecho en Claude Design (dirección «1a — editorial cálida») y se
reescribió para producción: layout responsive, sin el runtime del prototipo,
con SEO y con el formulario funcionando.

## Estructura

```
scripts/
  check.mjs               validador del sitio (npm run check)
  shots.mjs               capturas + prueba de humo (npm run shots)
.claude/                  configuración de Claude Code: comandos y verificación automática
public/
  index.html              home
  test-de-nivel/          test de nivel (20 preguntas, resultado A1–C1)
  styles.css              hoja de estilos única
  app.js                  idioma ES/EN, menú mobile, formulario → WhatsApp
  quiz.js                 lógica del test
  assets/                 logo, fotos en WebP, favicon, imagen para compartir
  _headers                cabeceras de caché y seguridad
  404.html  robots.txt  sitemap.xml
wrangler.jsonc            configuración de Cloudflare Workers
```

## Desarrollo local

```bash
npm install
npm run dev          # wrangler dev
```

O sin instalar nada:

```bash
cd public && python3 -m http.server 8788
```

## Verificar antes de publicar

```bash
npm run verificar    # = npm run check && npm run shots
```

- `npm run check` revisa que el sitio sea consistente: enlaces y assets que no
  existen, textos nuevos sin su traducción `data-en`, el número de WhatsApp
  desincronizado entre archivos, referencias del test que ya no están en el HTML,
  canonical y sitemap. Tarda menos de un segundo y no instala nada.
- `npm run shots` abre el sitio en Chromium, deja capturas a 1440px y 390px en
  `.shots/`, hace el test de nivel completo y avisa si hay algún error de
  JavaScript o un archivo que no carga.

Si `check` falla, el sitio tiene un problema real: no publiques hasta arreglarlo.

## Publicar

### Opción A — conectando el repo (recomendada)

En el panel de Cloudflare, dentro de la cuenta donde está la zona del dominio:

1. **Compute (Workers) → Create → Import a repository**
2. Elegir este repositorio y autorizar la app de Cloudflare **sólo sobre él**
3. Build command: *(vacío)* · Deploy command: `npx wrangler deploy`

Desde ahí, cada push a la rama principal se publica solo.

### Opción B — desde la terminal

```bash
npx wrangler deploy
```

## Conectar el dominio

Con el Worker ya desplegado:

1. **Worker → Settings → Domains & Routes → Add → Custom Domain**
2. Agregar `incontextenglish.com.ar`
3. Agregar también `www.incontextenglish.com.ar`

Cloudflare crea los registros DNS y emite el certificado SSL solo.

### Redirección de www

Para que `www` redirija al dominio sin www (y no queden dos versiones del sitio
compitiendo en Google), crear una **Redirect Rule** en el panel de la zona:

- **Rules → Redirect Rules → Create rule**
- Si: `Hostname` `equals` `www.incontextenglish.com.ar`
- Entonces: `Dynamic` → URL de destino `concat("https://incontextenglish.com.ar", http.request.uri.path)`
- Código: **301** · Preservar query string: sí

## Cosas que se cambian seguido

| Qué | Dónde |
| --- | --- |
| Número de WhatsApp | `WA` en `public/app.js`, `WA_TEST` en `public/quiz.js`, y los `href="https://wa.me/..."` de los HTML |
| Textos de la home | `public/index.html` |
| Traducción al inglés | atributo `data-en` de cada elemento |
| Preguntas del test | `PREGUNTAS` en `public/quiz.js` |
| Textos por nivel | `NIVELES` en `public/quiz.js` |
| Colores y tipografías | bloque `:root` de `public/styles.css` |

El selector ES/EN funciona con atributos `data-en` (y `data-en-html` cuando el
texto lleva marcado adentro, como el `<em>` del titular). Si agregás un texto
nuevo y querés que se traduzca, alcanza con ponerle su `data-en`.

## Formulario de contacto

No manda mails: al enviarlo arma el mensaje y abre WhatsApp con todo escrito.
Así el sitio no necesita backend ni servicio de correo, y la consulta le llega a
Vicky por el canal que ya usa. Si en algún momento se quiere recibir por mail,
hay que sumar un servicio tipo Formspree o una Worker Function.

## Trabajar con Claude Code

El repo trae comandos propios (se escriben con `/` en Claude Code):

| Comando | Qué hace |
| --- | --- |
| `/revisar` | Corre las dos verificaciones y mira las capturas, incluida la de mobile |
| `/texto` | Cambia textos del sitio manteniendo el `data-en` en sincronía |
| `/publicar` | Verifica, commitea y hace push (el deploy sale solo) |

Además, `.claude/settings.json` deja corriendo el validador después de cada
edición en `public/`, así un `data-en` olvidado o un enlace roto se detectan en el
momento y no cuando alguien abre la página.

## Qué se mide

Antes no quedaba rastro de nada: si alguien terminaba el test y no apretaba
enviar en WhatsApp, no había forma de saber que había existido. Hoy el sitio
anota, de forma anónima:

| Qué | Para qué sirve |
| --- | --- |
| Visitas a cada página | Es el denominador: sin esto, «diez clics» no dice nada |
| Clic en cada botón, por separado | Hay ocho links a WhatsApp; importa saber *cuál* convierte |
| Envío del formulario | Hoy no se sabe si alguien lo usa |
| Hasta dónde se scrollea (25/50/75/100 %) | Si no llegan a «Cursos», el problema es el hero |
| Cambio a inglés | Dice si el trabajo bilingüe le sirve a alguien |
| Test empezado y terminado, con nivel | Si el test convierte, y en qué nivel está la gente |

**No se guarda nada personal**: ni mail, ni nombre, ni IP, ni las respuestas. Y
los eventos **no se correlacionan entre sí** — no hay identificador de visita, así
que se puede saber «hubo 200 visitas y 30 clics a WhatsApp», pero no seguir a una
persona por el sitio. Por eso no hace falta cartel de cookies.

Vive en `src/index.js` (un endpoint, `POST /api/evento`) y en una base D1 llamada
`incontextenglish`, con el esquema en `schema.sql`. El registro es descartable a
propósito: si falla, la persona no se entera de nada.

Para empezar a contar un botón nuevo alcanza con ponerle `data-evento="etiqueta"`
en el HTML.

Para desarrollo local hay que crear la tabla una vez:

```bash
npx wrangler d1 execute incontextenglish --local --file=schema.sql
```

## Cabeceras y seguridad

`public/_headers` define caché y seguridad. Incluye una **Content-Security-Policy**
que sólo permite scripts propios y tipografías de Google. Si alguna vez se suma un
script externo (analítica, chat, píxel), hay que agregarlo ahí o el navegador lo va
a bloquear en silencio. `npm run shots` aplica estas mismas cabeceras localmente,
así que una CSP mal escrita se detecta antes de publicar.

## Pendientes

- Fotos: las actuales son selfies. Con fotos hechas para la web el hero gana mucho.
- Precios: hoy «Todos los niveles y precios» lleva a WhatsApp; si se publican,
  conviene una página propia.
- Testimonios: la sección ya está (`#testimonios`, tres citas). Para sumar más,
  ver la nota de CLAUDE.md: nombre de pila y permiso del alumno.
