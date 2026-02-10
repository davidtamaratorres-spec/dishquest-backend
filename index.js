const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

/* =====================================================
   SEED AUTOMÁTICO (solo si la BD está vacía)
===================================================== */

function runSeedIfNeeded() {
  db.get("SELECT COUNT(*) AS count FROM restaurants", (err, row) => {
    if (err) {
      console.error("Error comprobando seed:", err);
      return;
    }

    if (row.count > 0) {
      console.log("Seed ya existe. No se insertan datos.");
      return;
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

    console.log("Seed insertado correctamente.");
  });
}

/* Ejecutar seed al arrancar */
runSeedIfNeeded();

/* =====================================================
   RUTAS
===================================================== */

app.use("/restaurants", require("./routes/restaurants"));
app.use("/dishes", require("./routes/dishes"));
app.use("/promotions", require("./routes/promotions"));

/* =====================================================
   DEBUG DB
===================================================== */

app.get("/__debug/db", (req, res) => {
  const dbPath = path.join(__dirname, "database.sqlite");
  const exists = fs.existsSync(dbPath);

  db.get("SELECT COUNT(*) as c FROM restaurants", (err, r1) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get("SELECT COUNT(*) as c FROM dishes", (err2, r2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      db.get("SELECT COUNT(*) as c FROM promotions", (err3, r3) => {
        if (err3) return res.status(500).json({ error: err3.message });

        res.json({
          dbPath,
          exists,
          fileSizeBytes: exists ? fs.statSync(dbPath).size : 0,
          counts: {
            restaurants: r1.c,
            dishes: r2.c,
            promotions: r3.c,
          },
        });
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DishQuest backend running on port ${PORT}`));
