const express = require("express");
const router = express.Router();
const db = require("../db");

const isPostgres = !!db._pool;

function dbGet(sqliteSql, pgSql, params, cb) {
  db.get(isPostgres ? pgSql : sqliteSql, params, cb);
}

function dbRun(sqliteSql, pgSql, params, cb) {
  db.run(isPostgres ? pgSql : sqliteSql, params, cb);
}

// POST /qr/validar
router.post("/validar", (req, res) => {
  let { token, ciudad_usuario } = req.body || {};
  if (typeof token === "string" && token.trim().startsWith("{")) {
    try {
      token = JSON.parse(token).token;
    } catch {}
  } else if (token && typeof token === "object") {
    token = token.token;
  }
  if (!token) return res.status(400).json({ error: "token requerido" });

  dbGet(
    `SELECT * FROM qr_codigos WHERE token = ? LIMIT 1`,
    `SELECT * FROM qr_codigos WHERE token = $1 LIMIT 1`,
    [token],
    (err, qr) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!qr) return res.status(404).json({ valid: false, error: "QR no encontrado" });
      if (qr.usado_at) return res.status(409).json({ valid: false, error: "QR ya fue usado" });

      const expiresAt = new Date(qr.fecha_expiracion);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        return res.status(410).json({ valid: false, error: "QR expirado" });
      }

      const usedAt = new Date().toISOString();
      dbRun(
        `UPDATE qr_codigos SET usado_at = ? WHERE token = ?`,
        `UPDATE qr_codigos SET usado_at = $1 WHERE token = $2`,
        [usedAt, token],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });

          dbRun(
            `INSERT INTO eventos (plato_id, restaurante_id, tipo_evento, ciudad_usuario, timestamp)
             VALUES (?, ?, ?, ?, ?)`,
            `INSERT INTO eventos (plato_id, restaurante_id, tipo_evento, ciudad_usuario, timestamp)
             VALUES ($1, $2, $3, $4, $5)`,
            [qr.plato_id, qr.restaurante_id, "qr_usado", ciudad_usuario || null, usedAt],
            (eventErr) => {
              if (eventErr) return res.status(500).json({ error: eventErr.message });
              res.json({
                ok: true,
                valid: true,
                plato_id: qr.plato_id,
                restaurante_id: qr.restaurante_id,
                porcentaje_descuento: Number(qr.porcentaje_descuento) || 0,
                usado_at: usedAt,
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
