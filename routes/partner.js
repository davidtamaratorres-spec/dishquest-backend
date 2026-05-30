const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db");
const { addHours, buildQrImageUrl, createToken } = require("./qrUtils");

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

async function callClaudeMenuVision({ imageBase64, mediaType }) {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY no configurada");
  }

  const prompt = [
    "Extrae los platos visibles de este menu.",
    "Devuelve SOLO JSON valido con esta forma:",
    '{"platos":[{"nombre":"string","precio":12000,"ingredientes":["string"],"descripcion":"string","categoria":"string"}]}',
    "Si un precio no se ve claro usa 0. No inventes platos que no esten en la imagen.",
  ].join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Claude HTTP ${response.status}`);
  }

  const text = (data.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude no devolvio JSON");

  const parsed = JSON.parse(match[0]);
  const platos = Array.isArray(parsed.platos) ? parsed.platos : [];
  return platos.map((plato) => ({
    nombre: String(plato.nombre || "").trim(),
    precio: Number(plato.precio) || 0,
    ingredientes: Array.isArray(plato.ingredientes)
      ? plato.ingredientes.map((i) => String(i).trim()).filter(Boolean)
      : [],
    descripcion: String(plato.descripcion || "").trim(),
    categoria: String(plato.categoria || "Menu").trim() || "Menu",
  })).filter((plato) => plato.nombre);
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

// GET /partner/platos/:id/qr
router.get("/platos/:id/qr", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id invalido" });
  }

  dbGet(
    "SELECT id, restaurante_id, porcentaje_descuento FROM dishes WHERE id = ? AND restaurante_id = ?",
    "SELECT id, restaurante_id, porcentaje_descuento FROM dishes WHERE id = $1 AND restaurante_id = $2",
    [id, req.partner.restaurante_id],
    (err, dish) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!dish) return res.status(404).json({ error: "Plato no encontrado o no autorizado" });

      const token = createToken();
      const expiresAt = addHours(new Date(), 24).toISOString();
      const porcentaje = Number(dish.porcentaje_descuento) || 0;

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

// POST /partner/menu-ia
router.post("/menu-ia", auth, async (req, res) => {
  const { image_base64, media_type } = req.body || {};
  if (!image_base64) {
    return res.status(400).json({ error: "image_base64 requerido" });
  }

  try {
    const platos = await callClaudeMenuVision({
      imageBase64: image_base64,
      mediaType: media_type || "image/jpeg",
    });
    res.json({ ok: true, platos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
