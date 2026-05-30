const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db");

const isPostgres = !!db._pool;
const JWT_SECRET = process.env.JWT_SECRET || "dishquest_secret_dev";

// Middleware JWT
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }
  try {
    req.partner = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function dbGet(sqliteSql, pgSql, params, cb) {
  db.get(isPostgres ? pgSql : sqliteSql, params, cb);
}
function dbAll(sqliteSql, pgSql, params, cb) {
  db.all(isPostgres ? pgSql : sqliteSql, params, cb);
}
function dbRun(sqliteSql, pgSql, params, cb) {
  db.run(isPostgres ? pgSql : sqliteSql, params, cb);
}

// GET /partner/me
router.get("/me", auth, (req, res) => {
  dbGet(
    "SELECT * FROM restaurants WHERE partner_id = ?",
    "SELECT * FROM restaurants WHERE partner_id = $1",
    [req.partner.partner_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Restaurante no encontrado" });
      res.json(row);
    }
  );
});

// PUT /partner/restaurante
router.put("/restaurante", auth, (req, res) => {
  const { nombre, ciudad, direccion, whatsapp } = req.body || {};
  if (!nombre || !ciudad || !whatsapp) {
    return res.status(400).json({ error: "nombre, ciudad y whatsapp son obligatorios" });
  }

  dbRun(
    "UPDATE restaurants SET nombre = ?, ciudad = ?, direccion = ?, whatsapp = ? WHERE partner_id = ?",
    "UPDATE restaurants SET nombre = $1, ciudad = $2, direccion = $3, whatsapp = $4 WHERE partner_id = $5",
    [nombre, ciudad, direccion || "", whatsapp, req.partner.partner_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

// GET /partner/platos
router.get("/platos", auth, (req, res) => {
  dbAll(
    "SELECT * FROM dishes WHERE restaurante_id = ? ORDER BY id DESC",
    "SELECT * FROM dishes WHERE restaurante_id = $1 ORDER BY id DESC",
    [req.partner.restaurante_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// POST /partner/platos
router.post("/platos", auth, (req, res) => {
  const {
    nombre,
    descripcion = "",
    precio,
    categoria = "",
    imagen_url = "",
    disponible = 1,
    tiene_descuento = 0,
    porcentaje_descuento = 0,
    acepta_domicilio = 0,
    acepta_reserva = 0,
  } = req.body || {};

  if (!nombre || precio === undefined || precio === null) {
    return res.status(400).json({ error: "nombre y precio son obligatorios" });
  }

  const precioNum = Number(precio);
  if (Number.isNaN(precioNum) || precioNum < 0) {
    return res.status(400).json({ error: "precio inválido" });
  }

  dbRun(
    `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible, tiene_descuento, porcentaje_descuento, acepta_domicilio, acepta_reserva)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    `INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible, tiene_descuento, porcentaje_descuento, acepta_domicilio, acepta_reserva)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [
      req.partner.restaurante_id, nombre, descripcion, precioNum, categoria, imagen_url,
      disponible ? 1 : 0,
      tiene_descuento ? 1 : 0,
      Number(porcentaje_descuento) || 0,
      acepta_domicilio ? 1 : 0,
      acepta_reserva ? 1 : 0,
    ],
    function (err, result) {
      if (err) return res.status(500).json({ error: err.message });
      const newId = isPostgres ? result?.rows?.[0]?.id : this.lastID;
      res.status(201).json({ ok: true, id: newId ?? null });
    }
  );
});

// PUT /partner/platos/:id
router.put("/platos/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id inválido" });
  }

  const {
    nombre,
    descripcion = "",
    precio,
    categoria = "",
    imagen_url = "",
    disponible = 1,
    tiene_descuento = 0,
    porcentaje_descuento = 0,
    acepta_domicilio = 0,
    acepta_reserva = 0,
  } = req.body || {};

  if (!nombre || precio === undefined || precio === null) {
    return res.status(400).json({ error: "nombre y precio son obligatorios" });
  }

  const precioNum = Number(precio);
  if (Number.isNaN(precioNum) || precioNum < 0) {
    return res.status(400).json({ error: "precio inválido" });
  }

  dbGet(
    "SELECT id FROM dishes WHERE id = ? AND restaurante_id = ?",
    "SELECT id FROM dishes WHERE id = $1 AND restaurante_id = $2",
    [id, req.partner.restaurante_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Plato no encontrado o no autorizado" });

      dbRun(
        `UPDATE dishes SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, imagen_url = ?, disponible = ?,
         tiene_descuento = ?, porcentaje_descuento = ?, acepta_domicilio = ?, acepta_reserva = ?
         WHERE id = ? AND restaurante_id = ?`,
        `UPDATE dishes SET nombre = $1, descripcion = $2, precio = $3, categoria = $4, imagen_url = $5, disponible = $6,
         tiene_descuento = $7, porcentaje_descuento = $8, acepta_domicilio = $9, acepta_reserva = $10
         WHERE id = $11 AND restaurante_id = $12`,
        [
          nombre, descripcion, precioNum, categoria, imagen_url, disponible ? 1 : 0,
          tiene_descuento ? 1 : 0,
          Number(porcentaje_descuento) || 0,
          acepta_domicilio ? 1 : 0,
          acepta_reserva ? 1 : 0,
          id, req.partner.restaurante_id,
        ],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ ok: true });
        }
      );
    }
  );
});

// DELETE /partner/platos/:id
router.delete("/platos/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id inválido" });
  }

  dbGet(
    "SELECT id FROM dishes WHERE id = ? AND restaurante_id = ?",
    "SELECT id FROM dishes WHERE id = $1 AND restaurante_id = $2",
    [id, req.partner.restaurante_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Plato no encontrado o no autorizado" });

      dbRun(
        "DELETE FROM dishes WHERE id = ? AND restaurante_id = ?",
        "DELETE FROM dishes WHERE id = $1 AND restaurante_id = $2",
        [id, req.partner.restaurante_id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ ok: true });
        }
      );
    }
  );
});

module.exports = router;
