-- Base D1 del sitio (binding DB, base "incontextenglish").
--
-- Una sola tabla: cuántas personas empiezan el test y cuántas lo terminan, con
-- qué nivel y desde qué país. Nada personal: ni mail, ni nombre, ni IP, ni las
-- respuestas dadas.
--
-- En producción ya está aplicada. Para desarrollo local:
--   npx wrangler d1 execute incontextenglish --local --file=schema.sql

CREATE TABLE IF NOT EXISTS eventos_test (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evento TEXT NOT NULL CHECK (evento IN ('inicio','resultado')),
  nivel TEXT CHECK (nivel IN ('A1','A2','B1','B2','C1')),
  puntaje INTEGER CHECK (puntaje BETWEEN 0 AND 20),
  contestadas INTEGER CHECK (contestadas BETWEEN 0 AND 20),
  idioma TEXT CHECK (idioma IN ('es','en')),
  pais TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
