const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../db");
const { addHours, buildQrImageUrl, createToken } = require("./qrUtils");

const uploadsDir = path.join(__dirname, "../public/uploads/dishes");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `dish_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  },
});

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

function isoDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function emptyMetrics() {
  return { vistas: 0, domicilios: 0, reservas: 0, qr_usados: 0 };
}

function addEventToMetrics(metrics, tipo) {
  if (tipo === "vista") metrics.vistas += 1;
  if (tipo === "domicilio") metrics.domicilios += 1;
  if (tipo === "reserva") metrics.reservas += 1;
  if (tipo === "qr_usado") metrics.qr_usados += 1;
}

function conversionRate(domicilios, vistas) {
  if (!vistas) return 0;
  return Math.round((domicilios / vistas) * 100);
}

function parseClaudeDishes(data) {
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

async function fetchMenuTextFromUrl(menuUrl) {
  const response = await fetch(menuUrl);
  if (!response.ok) throw new Error(`No se pudo leer la URL del menu: HTTP ${response.status}`);
  const html = await response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);
}

async function callClaudeMenuExtraction({ imageBase64, mediaType, menuText, menuUrl, imageNotes }) {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY no configurada");
  }

  const sourceText = menuUrl ? await fetchMenuTextFromUrl(menuUrl) : menuText;
  const prompt = [
    "Extrae los platos, precios e ingredientes de este menu.",
    "Devuelve SOLO JSON valido con esta forma:",
    '{"platos":[{"nombre":"string","precio":12000,"ingredientes":["string"],"descripcion":"string","categoria":"string"}]}',
    "Si un precio no se ve claro usa 0. No inventes platos que no esten en la imagen.",
    imageNotes ? `Notas de preparacion de imagen: ${imageNotes}` : "",
  ].join("\n");

  const content = [];
  if (imageBase64) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType || "image/jpeg",
        data: imageBase64,
      },
    });
  }
  content.push({
    type: "text",
    text: sourceText ? `${prompt}\n\nMENU:\n${sourceText}` : prompt,
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Claude HTTP ${response.status}`);
  }
  return parseClaudeDishes(data);
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

// GET /partner/analytics
router.get("/analytics", auth, (req, res) => {
  dbAll(
    "SELECT id, nombre FROM dishes WHERE restaurante_id = ? ORDER BY id DESC",
    "SELECT id, nombre FROM dishes WHERE restaurante_id = $1 ORDER BY id DESC",
    [req.partner.restaurante_id],
    (dishErr, dishes) => {
      if (dishErr) return res.status(500).json({ error: dishErr.message });

      dbAll(
        `SELECT plato_id, restaurante_id, tipo_evento, timestamp, created_at
         FROM eventos
         WHERE restaurante_id = ?`,
        `SELECT plato_id, restaurante_id, tipo_evento, timestamp, created_at
         FROM eventos
         WHERE restaurante_id = $1`,
        [req.partner.restaurante_id],
        (eventErr, events) => {
          if (eventErr) return res.status(500).json({ error: eventErr.message });

          const now = new Date();
          const last7Start = new Date(now);
          last7Start.setDate(now.getDate() - 6);
          last7Start.setHours(0, 0, 0, 0);
          const last30Start = new Date(now);
          last30Start.setDate(now.getDate() - 29);
          last30Start.setHours(0, 0, 0, 0);

          const daily30Map = new Map();
          for (let i = 29; i >= 0; i -= 1) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const fecha = isoDateKey(d);
            daily30Map.set(fecha, { fecha, vistas: 0, domicilios: 0, reservas: 0, qr_usados: 0 });
          }

          const byDish = new Map((dishes || []).map((dish) => [
            Number(dish.id),
            {
              id: Number(dish.id),
              nombre: dish.nombre,
              vistas: 0,
              domicilios: 0,
              reservas: 0,
              qr_usados: 0,
              tasa_conversion: 0,
              tendencia_ultimos_7_dias: 0,
              dias_ultimos_7: [],
            },
          ]));
          const daily7ByDish = new Map();
          const resumen = emptyMetrics();

          for (const event of events || []) {
            const tipo = event.tipo_evento;
            const platoId = Number(event.plato_id);
            const date = new Date(event.timestamp || event.created_at || now);
            const dishMetrics = byDish.get(platoId);

            addEventToMetrics(resumen, tipo);
            if (dishMetrics) addEventToMetrics(dishMetrics, tipo);

            if (!Number.isNaN(date.getTime()) && date >= last30Start) {
              const day = daily30Map.get(isoDateKey(date));
              if (day) addEventToMetrics(day, tipo);
            }

            if (tipo === "vista" && dishMetrics && !Number.isNaN(date.getTime()) && date >= last7Start) {
              dishMetrics.tendencia_ultimos_7_dias += 1;
              const dishDaily = daily7ByDish.get(platoId) || new Map();
              const dayKey = isoDateKey(date);
              dishDaily.set(dayKey, (dishDaily.get(dayKey) || 0) + 1);
              daily7ByDish.set(platoId, dishDaily);
            }
          }

          const platos = Array.from(byDish.values()).map((dish) => {
            const days = [];
            const dishDaily = daily7ByDish.get(dish.id) || new Map();
            for (let i = 6; i >= 0; i -= 1) {
              const d = new Date(now);
              d.setDate(now.getDate() - i);
              const fecha = isoDateKey(d);
              days.push({ fecha, vistas: dishDaily.get(fecha) || 0 });
            }
            return {
              ...dish,
              tasa_conversion: conversionRate(dish.domicilios, dish.vistas),
              dias_ultimos_7: days,
            };
          }).sort((a, b) => b.vistas - a.vistas || b.domicilios - a.domicilios);

          const platoMasVisto = platos.reduce((best, dish) =>
            !best || dish.vistas > best.vistas ? dish : best, null);
          const platoMasPedidos = platos.reduce((best, dish) =>
            !best || dish.domicilios > best.domicilios ? dish : best, null);
          const platoMejorConversion = platos.reduce((best, dish) => {
            if (!dish.vistas) return best;
            if (!best) return dish;
            return dish.tasa_conversion > best.tasa_conversion ? dish : best;
          }, null);

          res.json({
            resumen,
            platos,
            destacados: {
              plato_mas_visto: platoMasVisto,
              plato_mas_pedidos: platoMasPedidos,
              plato_mejor_conversion: platoMejorConversion,
            },
            datos_por_dia_30: Array.from(daily30Map.values()),
          });
        }
      );
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

// GET /partner/platos/:id
router.get("/platos/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id inválido" });
  }
  dbGet(
    "SELECT * FROM dishes WHERE id = ? AND restaurante_id = ?",
    "SELECT * FROM dishes WHERE id = $1 AND restaurante_id = $2",
    [id, req.partner.restaurante_id],
    (err, plato) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!plato) return res.status(404).json({ error: "Plato no encontrado" });
      res.json(plato);
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
  const { image_base64, media_type, menu_text, menu_url, image_notes } = req.body || {};
  if (!image_base64 && !menu_text && !menu_url) {
    return res.status(400).json({ error: "image_base64, menu_text o menu_url requerido" });
  }

  try {
    const platos = await callClaudeMenuExtraction({
      imageBase64: image_base64,
      mediaType: media_type || "image/jpeg",
      menuText: menu_text,
      menuUrl: menu_url,
      imageNotes: image_notes,
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

// POST /partner/track-view
router.post("/track-view", (req, res) => {
  const { plato_id } = req.body || {};
  const id = Number(plato_id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "plato_id inválido" });
  }
  dbRun(
    "INSERT INTO dish_views (plato_id) VALUES (?)",
    "INSERT INTO dish_views (plato_id) VALUES ($1)",
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

// GET /partner/analytics/plato/:id
router.get("/analytics/plato/:id", auth, (req, res) => {
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

      dbAll(
        `SELECT DATE(viewed_at) as dia, COUNT(*) as vistas
         FROM dish_views WHERE plato_id = ?
           AND viewed_at >= DATE('now', '-30 days')
         GROUP BY DATE(viewed_at) ORDER BY dia`,
        `SELECT DATE(viewed_at) as dia, COUNT(*) as vistas
         FROM dish_views WHERE plato_id = $1
           AND viewed_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(viewed_at) ORDER BY dia`,
        [id],
        (err2, rows) => {
          if (err2) return res.status(500).json({ error: err2.message });
          const total = (rows || []).reduce((s, r) => s + Number(r.vistas), 0);
          res.json({ plato_id: id, total_vistas: total, por_dia: rows || [] });
        }
      );
    }
  );
});

// POST /partner/platos/:id/imagen
router.post("/platos/:id/imagen", auth, upload.single("imagen"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id inválido" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "Se requiere un archivo de imagen" });
  }

  dbGet(
    "SELECT id FROM dishes WHERE id = ? AND restaurante_id = ?",
    "SELECT id FROM dishes WHERE id = $1 AND restaurante_id = $2",
    [id, req.partner.restaurante_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Plato no encontrado o no autorizado" });

      const imagen_url = `/uploads/dishes/${req.file.filename}`;

      dbRun(
        "UPDATE dishes SET imagen_url = ? WHERE id = ? AND restaurante_id = ?",
        "UPDATE dishes SET imagen_url = $1 WHERE id = $2 AND restaurante_id = $3",
        [imagen_url, id, req.partner.restaurante_id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ ok: true, imagen_url });
        }
      );
    }
  );
});

module.exports = router;
