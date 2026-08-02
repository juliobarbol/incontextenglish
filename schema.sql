-- Base D1 del sitio (binding DB, base "incontextenglish").
--
-- Una sola tabla con el uso del sitio: visitas, qué se toca, hasta dónde se
-- scrollea, y cuánta gente empieza y termina el test de nivel.
--
-- Nada personal: ni mail, ni nombre, ni IP, ni las respuestas dadas. Y los
-- eventos no se correlacionan entre sí — no hay identificador de visita, así
-- que se puede contar «200 visitas y 30 clics» pero no seguir a nadie.
--
--   evento     detalle
--   pagina     la ruta ("/", "/test-de-nivel/")
--   clic       la etiqueta del data-evento del HTML ("wa-hero", "test-nav"…)
--   scroll     el umbral alcanzado ("25", "50", "75", "100")
--   inicio     — (empezó el test)
--   resultado  — (lo terminó; ahí van nivel, puntaje y contestadas)
--
-- En producción ya está aplicada. Para desarrollo local:
--   npx wrangler d1 execute incontextenglish --local --file=schema.sql

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evento TEXT NOT NULL CHECK (evento IN ('pagina','clic','scroll','inicio','resultado')),
  detalle TEXT,
  nivel TEXT CHECK (nivel IN ('A1','A2','B1','B2','C1')),
  puntaje INTEGER CHECK (puntaje BETWEEN 0 AND 20),
  contestadas INTEGER CHECK (contestadas BETWEEN 0 AND 20),
  idioma TEXT CHECK (idioma IN ('es','en')),
  pais TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos (creado_en);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos (evento, detalle);
