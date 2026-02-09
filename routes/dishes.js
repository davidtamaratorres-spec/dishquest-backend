const express = require("express");
const router = express.Router();
const db = require("../db");

// Listar platos (opcional por ciudad)
router.get("/", (req, res) => {
  const { city } = req.query;

  let query = `
    SELECT dishes.*, restaurants.ciudad
    FROM dishes
    JOIN restaurants ON dishes.restaurante_id = restaurants.id
    WHERE dishes.disponible = 1
  `;

  const params = [];

  if (city) {
    query += " AND restaurants.ciudad = ?";
    params.push(city);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Detalle plato (incluye ciudad desde restaurants)
router.get("/:id", (req, res) => {
  const query = `
    SELECT dishes.*, restaurants.ciudad
    FROM dishes
    JOIN restaurants ON dishes.restaurante_id = restaurants.id
    WHERE dishes.id = ?
    LIMIT 1
  `;

  db.get(query, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Plato no encontrado" });
    res.json(row);
  });
});

module.exports = router;


