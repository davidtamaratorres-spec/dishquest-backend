// db.js
// Objetivo: usar Postgres en Render (DATABASE_URL) y SQLite en local (fallback)

const fs = require("fs");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL;

// ====== POSTGRES (Render / Producción) ======
if (DATABASE_URL) {
  const { Pool } = require("pg");

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render Postgres
  });

  console.log("PostgreSQL mode (DATABASE_URL detectado)");

  // API compatible con lo que usa tu código (db.all / db.get / db.run)
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

    // helper opcional
    _pool: pool,
  };

  return;
}

// ====== SQLITE (Local / Desarrollo) ======
const sqlite3 = require("sqlite3").verbose();

const sqlitePath = path.join(__dirname, "database.sqlite");

// Asegura que el archivo exista
if (!fs.existsSync(sqlitePath)) {
  fs.writeFileSync(sqlitePath, "");
}

const db = new sqlite3.Database(sqlitePath, (err) => {
  if (err) console.error("Error connecting to SQLite", err);
  else console.log("SQLite connected");
});

// Tablas locales (igual a lo que ya tenías)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      ciudad TEXT NOT NULL,
      direccion TEXT,
      whatsapp TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurante_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      categoria TEXT,
      imagen_url TEXT,
      disponible INTEGER DEFAULT 1,
      FOREIGN KEY (restaurante_id) REFERENCES restaurants(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurante_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY (restaurante_id) REFERENCES restaurants(id)
    )
  `);
});

module.exports = db;
