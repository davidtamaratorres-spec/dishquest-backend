const db = require("./db");

db.serialize(() => {
  db.get("SELECT COUNT(*) AS count FROM restaurants", (err, row) => {
    if (err) {
      console.error("Error comprobando seed:", err);
      process.exit(1);
    }

    if (row.count > 0) {
      console.log("Seed ya existe. No se insertan datos.");
      return process.exit(0);
    }

    console.log("Insertando datos seed...");

    db.run(
      `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
       VALUES (?, ?, ?, ?)`,
      ["La Vegana", "Bogota", "Calle 45 #12-34", "573001112233"]
    );

    db.run(
      `INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp)
       VALUES (?, ?, ?, ?)`,
      ["Burger House", "Medellin", "Carrera 70 #30-20", "573004445566"]
    );

    db.run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, "Lasaña Vegana", "Lasaña con vegetales y queso vegetal", 28000, "Vegano", ""]
    );

    db.run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, "Hamburguesa Vegana", "Hamburguesa de lentejas con papas", 24000, "Vegano", ""]
    );

    db.run(
      `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [2, "Hamburguesa Clásica", "Carne Angus, queso y tocineta", 32000, "Hamburguesas", ""]
    );

    db.run(
      `INSERT INTO promotions (restaurante_id, tipo, descripcion)
       VALUES (?, ?, ?)`,
      [1, "descuento", "10% de descuento pagando en efectivo"]
    );

    // ⚠️ Cierre correcto: esperar a que SQLite termine
    db.close(() => {
      console.log("Seed ejecutado y guardado correctamente.");
      process.exit(0);
    });
  });
});

