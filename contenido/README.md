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

| Archivo | Qué es |
|---|---|
| `_planilla.py` | Arma la planilla de revisión del banco de preguntas del test. Se corre con `python3 contenido/_planilla.py` (necesita `openpyxl`). |

El `.xlsx` que genera no se versiona (está en `.gitignore`): se rearma cuando
haga falta.

## Revisar el banco de preguntas del test

El banco vive en **`public/quiz.js`** (`const BANCO`), que es lo que se publica,
y `_planilla.py` **lo lee de ahí**. No hay copia en `contenido/` a propósito: dos
copias se desincronizan sin que nadie lo note, y la que quedaría vieja es
justamente la que se manda a revisar.

El circuito es:

1. `python3 contenido/_planilla.py` → genera el `.xlsx` con lo que está en vivo.
2. Se lo manda a Victoria. Ella completa dos columnas: **¿Va?** (Sí / Cambiar /
   Sacar) y **Comentario**.
3. Vuelve el archivo, se aplican los cambios sobre `BANCO` en `public/quiz.js`,
   `npm run verificar`, y a publicar.

Revisado por Victoria el 6/8/2026: 46 preguntas aprobadas sin cambios y 4
corregidas. Ninguna descartada.
