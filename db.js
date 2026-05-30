// db.js
// Objetivo: usar Postgres en Render (DATABASE_URL) y SQLite en local (fallback)
// + Seed automático si la BD está vacía (en ambos motores)

const fs = require("fs");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL;

// =========================
// POSTGRES (Render / Prod)
// =========================
if (DATABASE_URL) {
  const { Pool } = require("pg");

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("✅ PostgreSQL mode (DATABASE_URL detectado)");

  async function pgMigrateAndSeed() {
    try {
      // 1) Tablas (Postgres)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS partners (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id SERIAL PRIMARY KEY,
          partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
          nombre TEXT NOT NULL,
          ciudad TEXT NOT NULL,
          direccion TEXT,
          whatsapp TEXT NOT NULL,
          activo INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS dishes (
          id SERIAL PRIMARY KEY,
          restaurante_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          precio NUMERIC NOT NULL,
          categoria TEXT,
          imagen_url TEXT,
          disponible INTEGER DEFAULT 1,
          tiene_descuento INTEGER DEFAULT 0,
          porcentaje_descuento INTEGER DEFAULT 0,
          acepta_domicilio INTEGER DEFAULT 0,
          acepta_reserva INTEGER DEFAULT 0
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS promotions (
          id SERIAL PRIMARY KEY,
          restaurante_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          tipo TEXT NOT NULL,
          descripcion TEXT,
          activo INTEGER DEFAULT 1
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS unsatisfied_searches (
          id SERIAL PRIMARY KEY,
          query TEXT NOT NULL,
          fecha TIMESTAMP DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS eventos (
          id SERIAL PRIMARY KEY,
          plato_id INTEGER,
          restaurante_id INTEGER,
          tipo_evento TEXT NOT NULL,
          ciudad_usuario TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Migración: nuevos campos en dishes
      for (const col of [
        "ALTER TABLE dishes ADD COLUMN IF NOT EXISTS tiene_descuento INTEGER DEFAULT 0",
        "ALTER TABLE dishes ADD COLUMN IF NOT EXISTS porcentaje_descuento INTEGER DEFAULT 0",
        "ALTER TABLE dishes ADD COLUMN IF NOT EXISTS acepta_domicilio INTEGER DEFAULT 0",
        "ALTER TABLE dishes ADD COLUMN IF NOT EXISTS acepta_reserva INTEGER DEFAULT 0",
      ]) {
        await pool.query(col).catch(() => {});
      }

      // Migración: latitud/longitud en restaurants
      await pool.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitud REAL;`).catch(() => {});
      await pool.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitud REAL;`).catch(() => {});

      // Migración: añade partner_id si restaurants ya existía sin esa columna
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'restaurants' AND column_name = 'partner_id'
          ) THEN
            ALTER TABLE restaurants ADD COLUMN partner_id INTEGER;
          END IF;
        END $$;
      `);

      // 2) ¿Vacío?
      const r = await pool.query(`SELECT COUNT(*)::int AS c FROM restaurants;`);
      const count = r.rows?.[0]?.c ?? 0;

      if (count > 0) {
        console.log(`✅ PG seed NO necesario: restaurants=${count}`);
        return;
      }

      // 3) Seed mínimo
      console.log("🌱 PG seed automático: BD vacía -> insertando datos iniciales...");

      const insR1 = await pool.query(
        `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
         VALUES ($1,$2,$3,$4) RETURNING id;`,
        ["La Pasta Bogotá", "Bogotá", "Chapinero", "+57 300 000 0001"]
      );
      const r1 = insR1.rows[0].id;

      const insR2 = await pool.query(
        `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
         VALUES ($1,$2,$3,$4) RETURNING id;`,
        ["Arepas Premium", "Medellín", "El Poblado", "+57 300 000 0002"]
      );
      const r2 = insR2.rows[0].id;

      const insR3 = await pool.query(
        `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
         VALUES ($1,$2,$3,$4) RETURNING id;`,
        ["Sabores de Sincelejo", "Sincelejo", "Centro", "+57 300 000 0003"]
      );
      const r3 = insR3.rows[0].id;

      await pool.query(
        `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
         VALUES
         ($1,$2,$3,$4,$5,$6,$7),
         ($1,$8,$9,$10,$11,$12,$13),
         ($14,$15,$16,$17,$18,$19,$20),
         ($14,$21,$22,$23,$24,$25,$26),
         ($27,$28,$29,$30,$31,$32,$33);`,
        [
          r1, "Lasaña clásica", "Porción generosa.", 28000, "Pasta", "", 1,
          "Spaghetti carbonara", "Tocineta, crema, parmesano.", 30000, "Pasta", "", 1,
          r2, "Arepa rellena mixta", "Carne + pollo + queso.", 18000, "Arepas", "", 1,
          "Arepa vegana", "Champiñones, aguacate, hogao.", 20000, "Arepas", "", 1,
          r3, "Mote de queso", "Tradicional costeño.", 22000, "Sopas", "", 1,
        ]
      );

      await pool.query(
        `INSERT INTO promotions (restaurante_id, tipo, descripcion, activo)
         VALUES
         ($1,$2,$3,$4),
         ($5,$6,$7,$8);`,
        [
          r1, "DESCUENTO", "10% en pastas (lun-jue).", 1,
          r2, "PROMO", "2x1 Arepa rellena mixta.", 1,
        ]
      );

      const rr = await pool.query(`SELECT COUNT(*)::int AS c FROM restaurants;`);
      const dd = await pool.query(`SELECT COUNT(*)::int AS c FROM dishes;`);
      const pp = await pool.query(`SELECT COUNT(*)::int AS c FROM promotions;`);
      console.log(
        `✅ PG seed listo. restaurants=${rr.rows[0].c}, dishes=${dd.rows[0].c}, promotions=${pp.rows[0].c}`
      );
    } catch (e) {
      console.error("❌ Error en pgMigrateAndSeed():", e);
    }
  }

  // Ejecuta al cargar
  pgMigrateAndSeed();

  // API compatible con db.all / db.get / db.run
  module.exports = {
    all: (sql, params, cb) => {
      if (typeof params === "function") {
        cb = params;
        params = [];
      }
      pool
        .query(sql, params)
        .then((r) => cb(null, r.rows))
        .catch((e) => cb(e));
    },

    get: (sql, params, cb) => {
      if (typeof params === "function") {
        cb = params;
        params = [];
      }
      pool
        .query(sql, params)
        .then((r) => cb(null, r.rows[0] ?? null))
        .catch((e) => cb(e));
    },

    run: (sql, params, cb) => {
      if (typeof params === "function") {
        cb = params;
        params = [];
      }
      pool
        .query(sql, params)
        .then((r) => cb && cb(null, r))
        .catch((e) => cb && cb(e));
    },

    _pool: pool,
  };

  return;
}

// =========================
// SQLITE (Local / Dev)
// =========================
let sqlite3;
try {
  sqlite3 = require("sqlite3").verbose();
} catch (e) {
  console.error("❌ sqlite3 no disponible (entorno sin compilación nativa):", e.message);
  process.exit(1);
}

const sqlitePath = path.join(__dirname, "database.sqlite");

// Asegura que el archivo exista
if (!fs.existsSync(sqlitePath)) {
  fs.writeFileSync(sqlitePath, "");
}

const db = new sqlite3.Database(sqlitePath, (err) => {
  if (err) console.error("❌ Error connecting to SQLite", err);
  else console.log("✅ SQLite connected:", sqlitePath);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function sqliteMigrateAndSeed() {
  try {
    await run("PRAGMA foreign_keys = ON;");

    // Tablas locales
    await run(`
      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
        nombre TEXT NOT NULL,
        ciudad TEXT NOT NULL,
        direccion TEXT,
        whatsapp TEXT NOT NULL,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migración: añade partner_id y coordenadas si ya existían sin esas columnas
    await run(`ALTER TABLE restaurants ADD COLUMN partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL`).catch(() => {});
    await run(`ALTER TABLE restaurants ADD COLUMN latitud REAL`).catch(() => {});
    await run(`ALTER TABLE restaurants ADD COLUMN longitud REAL`).catch(() => {});

    await run(`
      CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurante_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio REAL NOT NULL,
        categoria TEXT,
        imagen_url TEXT,
        disponible INTEGER DEFAULT 1,
        tiene_descuento INTEGER DEFAULT 0,
        porcentaje_descuento INTEGER DEFAULT 0,
        acepta_domicilio INTEGER DEFAULT 0,
        acepta_reserva INTEGER DEFAULT 0,
        FOREIGN KEY (restaurante_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);

    // Migración: nuevos campos en dishes para BD SQLite existente
    for (const col of [
      "ALTER TABLE dishes ADD COLUMN tiene_descuento INTEGER DEFAULT 0",
      "ALTER TABLE dishes ADD COLUMN porcentaje_descuento INTEGER DEFAULT 0",
      "ALTER TABLE dishes ADD COLUMN acepta_domicilio INTEGER DEFAULT 0",
      "ALTER TABLE dishes ADD COLUMN acepta_reserva INTEGER DEFAULT 0",
    ]) {
      await run(col).catch(() => {});
    }

    await run(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurante_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        descripcion TEXT,
        activo INTEGER DEFAULT 1,
        FOREIGN KEY (restaurante_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS unsatisfied_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plato_id INTEGER,
        restaurante_id INTEGER,
        tipo_evento TEXT NOT NULL,
        ciudad_usuario TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const r = await get("SELECT COUNT(*) AS c FROM restaurants;");
    const count = Number(r?.c || 0);

    if (count > 0) {
      console.log(`✅ SQLite seed NO necesario: restaurants=${count}`);
      return;
    }

    console.log("🌱 SQLite seed automático: BD vacía -> insertando datos iniciales...");

    const insR1 = await run(
      `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
       VALUES (?, ?, ?, ?);`,
      ["La Pasta Bogotá", "Bogotá", "Chapinero", "+57 300 000 0001"]
    );
    const r1 = insR1.lastID;

    const insR2 = await run(
      `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
       VALUES (?, ?, ?, ?);`,
      ["Arepas Premium", "Medellín", "El Poblado", "+57 300 000 0002"]
    );
    const r2 = insR2.lastID;

    const insR3 = await run(
      `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
       VALUES (?, ?, ?, ?);`,
      ["Sabores de Sincelejo", "Sincelejo", "Centro", "+57 300 000 0003"]
    );
    const r3 = insR3.lastID;

    await run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [r1, "Lasaña clásica", "Porción generosa.", 28000, "Pasta", "", 1]
    );
    await run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [r1, "Spaghetti carbonara", "Tocineta, crema, parmesano.", 30000, "Pasta", "", 1]
    );
    await run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [r2, "Arepa rellena mixta", "Carne + pollo + queso.", 18000, "Arepas", "", 1]
    );
    await run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [r2, "Arepa vegana", "Champiñones, aguacate, hogao.", 20000, "Arepas", "", 1]
    );
    await run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [r3, "Mote de queso", "Tradicional costeño.", 22000, "Sopas", "", 1]
    );

    await run(
      `INSERT INTO promotions (restaurante_id, tipo, descripcion, activo)
       VALUES (?, ?, ?, ?);`,
      [r1, "DESCUENTO", "10% en pastas (lun-jue).", 1]
    );
    await run(
      `INSERT INTO promotions (restaurante_id, tipo, descripcion, activo)
       VALUES (?, ?, ?, ?);`,
      [r2, "PROMO", "2x1 Arepa rellena mixta.", 1]
    );

    const rr = await get("SELECT COUNT(*) AS c FROM restaurants;");
    const dd = await get("SELECT COUNT(*) AS c FROM dishes;");
    const pp = await get("SELECT COUNT(*) AS c FROM promotions;");
    console.log(`✅ SQLite seed listo. restaurants=${rr.c}, dishes=${dd.c}, promotions=${pp.c}`);
  } catch (e) {
    console.error("❌ Error en sqliteMigrateAndSeed():", e);
  }
}

// Ejecuta al cargar
db.serialize(() => {
  sqliteMigrateAndSeed();
});

module.exports = db;
module.exports.SQLITE_PATH = sqlitePath;
