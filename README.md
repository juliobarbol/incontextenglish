# In Context English — incontextenglish.com.ar

Sitio de la academia de inglés online de Victoria Rossa. Es un sitio **estático**
(HTML, CSS y JavaScript sin dependencias) servido por **Cloudflare Workers**.
No hay build: lo que está en `public/` es exactamente lo que se publica.

Partió del diseño hecho en Claude Design (dirección «1a — editorial cálida») y se
reescribió para producción: layout responsive, sin el runtime del prototipo,
con SEO y con el formulario funcionando.

## Estructura

```
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

## Pendientes

- Fotos: las actuales son selfies. Con fotos hechas para la web el hero gana mucho.
- Testimonios de alumnos: la sección no existe todavía y es lo que más convierte.
- Precios: hoy «Todos los niveles y precios» lleva a WhatsApp; si se publican,
  conviene una página propia.
