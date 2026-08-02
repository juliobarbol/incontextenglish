# contenido/ — la sala de espera

Acá va lo que **todavía no puede publicarse**: borradores, textos a revisar,
material a medio hacer. Es parte del repo, se commitea y se pushea como
cualquier otra cosa, pero **no llega al sitio**.

## Por qué es seguro pushear esto

`wrangler.jsonc` declara `assets.directory: "./public"`. Workers publica esa
carpeta y nada más: el resto del repo —`src/`, `scripts/`, `contenido/`— no se
sirve por ninguna URL. Un push que sólo toca `contenido/` dispara un deploy,
sí, pero el sitio queda byte por byte igual.

Esto importa porque en `public/` **no hay borrador**: cualquier push es el sitio
en vivo (ver CLAUDE.md). Esta carpeta es la forma de tener las dos cosas — el
trabajo guardado en GitHub y el sitio sin tocar.

## Por qué no alcanza con «no pushearlo»

Dejar algo sin pushear no lo guarda en ningún lado: vive sólo en la máquina
donde se escribió. Si se trabajó en una sesión remota, eso se pierde cuando se
recicla el contenedor, sin aviso. **Un cambio sin pushear es un cambio que se
puede perder; uno en `contenido/` está a salvo y sigue sin publicarse.**

## Cómo se usa

- **Contenido a revisar** (preguntas, textos, precios): archivo de datos acá,
  con el `_nota` o el encabezado diciendo qué está pendiente y de quién.
- **Borradores de páginas o de código de `public/`**: van en
  `contenido/borradores/`, respetando la ruta que van a tener. Cuando se
  aprueban, se mueven a `public/`, se corre `npm run verificar` y recién ahí se
  pushean.
- **Nunca enlazar a `contenido/` desde el HTML.** Esa URL no existe en
  producción; `npm run check` lo marca como error, porque el archivo no está en
  `public/`.

## Qué hay ahora

| Archivo | Qué es | Espera |
|---|---|---|
| `preguntas-propuestas.json` | Banco de 50 preguntas para el test de nivel, 10 por banda, en contexto conversacional. Reemplazaría a las 20 fijas de `quiz.js`, sorteando 4 por banda. | Revisión de Victoria |
| `_planilla.py` | Arma la planilla de revisión (`.xlsx`) a partir del JSON. Se corre con `python3 contenido/_planilla.py`. | — |

El `.xlsx` que genera no se versiona (está en `.gitignore`): se rearma cuando
haga falta, y la copia que circula es la que se le mandó a Victoria.
