const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /dishes  (ya lo tienes, lo dejo robusto y compatible)
router.get("/", (req, res) => {
  // Nota: tus columnas están en español (dishes.nombre, restaurants.ciudad, etc.)
  const sql = `
    SELECT
      d.id,
      d.restaurante_id,
      d.nombre,
      d.descripcion,
      d.precio,
      d.categoria,
      d.imagen_url,
      d.disponible,
      r.ciudad
    FROM dishes d
    LEFT JOIN restaurants r ON r.id = d.restaurante_id
    ORDER BY d.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// POST /dishes  (nuevo)
router.post("/", (req, res) => {
  const {
    restaurante_id,
    nombre,
    descripcion = "",
    precio,
    categoria = "",
    imagen_url = "",
    disponible = 1,
  } = req.body || {};

  // Validaciones mínimas
  if (!restaurante_id || !nombre || precio === undefined || precio === null) {
    return res.status(400).json({
      error:
        "Faltan campos requeridos: restaurante_id, nombre, precio",
    });
  }

  const precioNum = Number(precio);
  if (Number.isNaN(precioNum) || precioNum < 0) {
    return res.status(400).json({ error: "precio inválido" });
  }

  // Verifica que el restaurante exista
  db.get(
    "SELECT id FROM restaurants WHERE id = ?",
    [restaurante_id],
    (err, r) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!r) return res.status(404).json({ error: "Restaurante no existe" });

      const sql = `
        INSERT INTO dishes
          (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
          restaurante_id,
          nombre,
          descripcion,
          precioNum,
          categoria,
          imagen_url,
          disponible ? 1 : 0,
        ],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });

          // Respuesta con id creado
          res.status(201).json({
            id: this.lastID, // en Postgres wrapper no aplica; si es Postgres, igual devolvemos ok sin romper
            ok: true,
          });
        }
      );
    }
  );
});

module.exports = router;
