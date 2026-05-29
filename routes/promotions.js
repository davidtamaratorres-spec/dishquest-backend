const express = require("express");
const router = express.Router();
const db = require("../db");

const isPostgres = !!process.env.DATABASE_URL;

router.get("/", (req, res) => {
  const { restaurant_id } = req.query;

  let query = "SELECT * FROM promotions WHERE activo = 1";
  const params = [];

  if (restaurant_id) {
    const placeholder = isPostgres ? "$1" : "?";
    query += ` AND restaurante_id = ${placeholder}`;
    params.push(restaurant_id);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;