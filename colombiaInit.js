// colombiaInit.js
// Crea tablas del proyecto Colombia en Postgres (Render) si no existen.
// No afecta las tablas de DishQuest.

const { Pool } = require("pg");

async function initColombia() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.log("ColombiaInit: No hay DATABASE_URL, no se crea nada.");
    return;
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔵 Colombia: creando tablas si no existen...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS municipios (
        dane_municipio VARCHAR(5) PRIMARY KEY,
        dep_code VARCHAR(2) NOT NULL,
        mun_code3 VARCHAR(3) NOT NULL,
        dep_name VARCHAR(120) NOT NULL,
        mun_name VARCHAR(160) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fiestas (
        id BIGSERIAL PRIMARY KEY,
        dane_municipio VARCHAR(5) NOT NULL REFERENCES municipios(dane_municipio) ON DELETE CASCADE,
        festival_nombre TEXT,
        fecha_text TEXT,
        fuente TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Colombia: tablas listas.");
  } catch (error) {
    console.error("❌ Error creando tablas Colombia:", error);
  } finally {
    await pool.end();
  }
}

module.exports = initColombia;
