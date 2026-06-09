const express = require("express");
const router = express.Router();
const db = require("../db");
const { addHours, buildQrImageUrl, createToken } = require("./qrUtils");

const isPostgres = !!db._pool; // en tu wrapper pg exportas _pool

function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helpers para ejecutar queries en ambos motores
function dbGet(sqliteSql, pgSql, params, cb) {
  const sql = isPostgres ? pgSql : sqliteSql;
  db.get(sql, params, cb);
}
function dbAll(sqliteSql, pgSql, params, cb) {
  const sql = isPostgres ? pgSql : sqliteSql;
  db.all(sql, params, cb);
}
function dbRun(sqliteSql, pgSql, params, cb) {
  const sql = isPostgres ? pgSql : sqliteSql;
  db.run(sql, params, cb);
}

// GET /dishes (lista)
router.get("/", (req, res) => {
  const sql = `
    SELECT
      d.id, d.restaurante_id, d.nombre, d.descripcion, d.precio, d.categoria,
      d.imagen_url, d.disponible,
      d.tiene_descuento, d.porcentaje_descuento, d.acepta_domicilio, d.acepta_reserva,
      r.ciudad, r.nombre AS restaurante_nombre
    FROM dishes d
    LEFT JOIN restaurants r ON r.id = d.restaurante_id
    ORDER BY d.id DESC
  `;

  dbAll(sql, sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// GET /dishes/search?q=&lat=&lng=
router.get("/search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  const sqliteSql = `
    SELECT
      d.id, d.restaurante_id, d.nombre, d.descripcion, d.precio, d.categoria, d.imagen_url, d.disponible,
      r.nombre AS restaurante_nombre, r.ciudad, r.latitud, r.longitud
    FROM dishes d
    LEFT JOIN restaurants r ON r.id = d.restaurante_id
    WHERE LOWER(d.nombre) LIKE LOWER(?)
    ORDER BY d.precio ASC
  `;
  const pgSql = `
    SELECT
      d.id, d.restaurante_id, d.nombre, d.descripcion, d.precio, d.categoria, d.imagen_url, d.disponible,
      r.nombre AS restaurante_nombre, r.ciudad, r.latitud, r.longitud
    FROM dishes d
    LEFT JOIN restaurants r ON r.id = d.restaurante_id
    WHERE d.nombre ILIKE $1
    ORDER BY d.precio ASC
  `;

  dbAll(sqliteSql, pgSql, [`%${q}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!rows || rows.length === 0) {
      const sqliteLog = "INSERT INTO unsatisfied_searches (query) VALUES (?)";
      const pgLog = "INSERT INTO unsatisfied_searches (query) VALUES ($1)";
      dbRun(sqliteLog, pgLog, [q], () => {});
      return res.json([]);
    }

    if (hasCoords) {
      rows = rows.map(dish => ({
        ...dish,
        distancia_km: (dish.latitud != null && dish.longitud != null)
          ? distanciaKm(lat, lng, dish.latitud, dish.longitud)
          : null,
      }));
      rows.sort((a, b) => {
        if (a.distancia_km === null) return 1;
        if (b.distancia_km === null) return -1;
        return a.distancia_km - b.distancia_km;
      });
    }

    res.json(rows);
  });
});

// GET /dishes/:id/qr (QR publico para clientes)
router.get("/:id/qr", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id invalido" });
  }

  dbGet(
    `SELECT id, restaurante_id, tiene_descuento, porcentaje_descuento
     FROM dishes
     WHERE id = ? AND disponible = 1
     LIMIT 1`,
    `SELECT id, restaurante_id, tiene_descuento, porcentaje_descuento
     FROM dishes
     WHERE id = $1 AND disponible = 1
     LIMIT 1`,
    [id],
    (err, dish) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!dish) return res.status(404).json({ error: "Plato no encontrado" });

      const porcentaje = Number(dish.porcentaje_descuento) || 0;
      if (!dish.tiene_descuento || porcentaje <= 0) {
        return res.status(400).json({ error: "Este plato no tiene descuento QR activo" });
      }

      const token = createToken();
      const expiresAt = addHours(new Date(), 24).toISOString();
      dbRun(
        `INSERT INTO qr_codigos (token, plato_id, restaurante_id, porcentaje_descuento, fecha_expiracion)
         VALUES (?, ?, ?, ?, ?)`,
        `INSERT INTO qr_codigos (token, plato_id, restaurante_id, porcentaje_descuento, fecha_expiracion)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [token, dish.id, dish.restaurante_id, porcentaje, expiresAt],
        function (insertErr, result) {
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          const qrId = isPostgres ? result?.rows?.[0]?.id : this.lastID;
          res.json({
            ok: true,
            id: qrId ?? null,
            token,
            plato_id: dish.id,
            restaurante_id: dish.restaurante_id,
            porcentaje_descuento: porcentaje,
            fecha_expiracion: expiresAt,
            qr_image_url: buildQrImageUrl(token),
          });
        }
      );
    }
  );
});

// GET /dishes/:id (detalle)
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id inválido" });
  }

  const sqliteSql = `
    SELECT
      d.id, d.restaurante_id, d.nombre, d.descripcion, d.precio, d.categoria,
      d.imagen_url, d.disponible,
      d.tiene_descuento, d.porcentaje_descuento, d.acepta_domicilio, d.acepta_reserva,
      r.nombre AS restaurante_nombre, r.ciudad, r.direccion, r.whatsapp,
      r.latitud, r.longitud,
      p.email AS restaurante_email
    FROM dishes d
    LEFT JOIN restaurants r ON r.id = d.restaurante_id
    LEFT JOIN partners p ON p.id = r.partner_id
    WHERE d.id = ?
    LIMIT 1
  `;

  const pgSql = `
    SELECT
      d.id, d.restaurante_id, d.nombre, d.descripcion, d.precio, d.categoria,
      d.imagen_url, d.disponible,
      d.tiene_descuento, d.porcentaje_descuento, d.acepta_domicilio, d.acepta_reserva,
      r.nombre AS restaurante_nombre, r.ciudad, r.direccion, r.whatsapp,
      r.latitud, r.longitud,
      p.email AS restaurante_email
    FROM dishes d
    LEFT JOIN restaurants r ON r.id = d.restaurante_id
    LEFT JOIN partners p ON p.id = r.partner_id
    WHERE d.id = $1
    LIMIT 1
  `;

  dbGet(sqliteSql, pgSql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Plato no encontrado" });
    res.json(row);
  });
});

// POST /dishes
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

  if (!restaurante_id || !nombre || precio === undefined || precio === null) {
    return res.status(400).json({
      error: "Faltan campos requeridos: restaurante_id, nombre, precio",
    });
  }

  const precioNum = Number(precio);
  if (Number.isNaN(precioNum) || precioNum < 0) {
    return res.status(400).json({ error: "precio inválido" });
  }

  // 1) Verificar restaurante existe
  const sqliteCheck = "SELECT id FROM restaurants WHERE id = ?";
  const pgCheck = "SELECT id FROM restaurants WHERE id = $1";

  dbGet(sqliteCheck, pgCheck, [restaurante_id], (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!r) return res.status(404).json({ error: "Restaurante no existe" });

    // 2) Insertar dish
    const sqliteInsert = `
      INSERT INTO dishes
        (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // En Postgres devolvemos id con RETURNING
    const pgInsert = `
      INSERT INTO dishes
        (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    dbRun(
      sqliteInsert,
      pgInsert,
      [
        restaurante_id,
        nombre,
        descripcion,
        precioNum,
        categoria,
        imagen_url,
        disponible ? 1 : 0,
      ],
      function (err2, result) {
        if (err2) return res.status(500).json({ error: err2.message });

        const newId = isPostgres ? result?.rows?.[0]?.id : this.lastID;
        res.status(201).json({ ok: true, id: newId ?? null });
      }
    );
  });
});

module.exports = router;
