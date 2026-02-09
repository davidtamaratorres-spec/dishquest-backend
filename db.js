const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "database.sqlite"),
  (err) => {
    if (err) {
      console.error("Error connecting to SQLite", err);
    } else {
      console.log("SQLite connected");
    }
  }
);

db.serialize(() => {
  // Restaurantes
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

  // Platos
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

  // Promociones
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

