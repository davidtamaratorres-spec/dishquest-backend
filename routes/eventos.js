const express = require("express");
const router = express.Router();
const db = require("../db");

const isPostgres = !!db._pool;

// POST /eventos — registra un evento de usuario
router.post("/", (req, res) => {
  const { plato_id, restaurante_id, tipo_evento, ciudad_usuario } = req.body || {};

  if (!tipo_evento) {
    return res.status(400).json({ error: "tipo_evento requerido" });
  }

  const tipos = ["vista", "domicilio", "reserva", "descuento", "mapa"];
  if (!tipos.includes(tipo_evento)) {
    return res.status(400).json({ error: `tipo_evento inválido. Valores: ${tipos.join(", ")}` });
  }

  const timestamp = new Date().toISOString();
  const sqliteSql = `INSERT INTO eventos (plato_id, restaurante_id, tipo_evento, ciudad_usuario, timestamp) VALUES (?, ?, ?, ?, ?)`;
  const pgSql = `INSERT INTO eventos (plato_id, restaurante_id, tipo_evento, ciudad_usuario, timestamp) VALUES ($1, $2, $3, $4, $5)`;

  const sql = isPostgres ? pgSql : sqliteSql;
  db.run(sql, [plato_id || null, restaurante_id || null, tipo_evento, ciudad_usuario || null, timestamp], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, timestamp });
  });
});

// GET /eventos/restaurante/:id — métricas agrupadas por tipo para el panel partner
router.get("/restaurante/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id inválido" });
  }

  const sqliteSql = `
    SELECT tipo_evento, COUNT(*) AS total
    FROM eventos
    WHERE restaurante_id = ?
    GROUP BY tipo_evento
  `;
  const pgSql = `
    SELECT tipo_evento, COUNT(*)::int AS total
    FROM eventos
    WHERE restaurante_id = $1
    GROUP BY tipo_evento
  `;

  const sql = isPostgres ? pgSql : sqliteSql;
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const result = { vistas: 0, domicilios: 0, reservas: 0, mapas: 0, descuentos: 0 };
    for (const row of rows || []) {
      if (row.tipo_evento === "vista") result.vistas = Number(row.total);
      if (row.tipo_evento === "domicilio") result.domicilios = Number(row.total);
      if (row.tipo_evento === "reserva") result.reservas = Number(row.total);
      if (row.tipo_evento === "mapa") result.mapas = Number(row.total);
      if (row.tipo_evento === "descuento") result.descuentos = Number(row.total);
    }
    res.json(result);
  });
});

module.exports = router;
