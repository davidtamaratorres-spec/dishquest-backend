const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const isPostgres = !!db._pool;
const JWT_SECRET = process.env.JWT_SECRET || "dishquest_secret_dev";

// POST /auth/register
router.post("/register", async (req, res) => {
  const { email, password, nombre_restaurante, ciudad, direccion, whatsapp } = req.body;

  if (!email || !password || !nombre_restaurante || !ciudad || !whatsapp) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    let partner;
    if (isPostgres) {
      const r = await db._pool.query(
        "INSERT INTO partners (email, password_hash) VALUES ($1, $2) RETURNING id",
        [email, hash]
      );
      partner = r.rows[0];
    } else {
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO partners (email, password_hash) VALUES (?, ?)",
          [email, hash],
          function (err) {
            if (err) reject(err);
            else { partner = { id: this.lastID }; resolve(); }
          }
        );
      });
    }

    let restaurante;
    if (isPostgres) {
      const r = await db._pool.query(
        "INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp, partner_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [nombre_restaurante, ciudad, direccion || "", whatsapp, partner.id]
      );
      restaurante = r.rows[0];
    } else {
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp, partner_id) VALUES (?, ?, ?, ?, ?)",
          [nombre_restaurante, ciudad, direccion || "", whatsapp, partner.id],
          function (err) {
            if (err) reject(err);
            else { restaurante = { id: this.lastID }; resolve(); }
          }
        );
      });
    }

    const token = jwt.sign(
      { partner_id: partner.id, restaurante_id: restaurante.id },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({ ok: true, token, restaurante_id: restaurante.id });
  } catch (err) {
    if (err.message && (err.message.includes("unique") || err.message.includes("duplicate key"))) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  try {
    let partner;
    if (isPostgres) {
      const r = await db._pool.query("SELECT * FROM partners WHERE email = $1", [email]);
      partner = r.rows[0];
    } else {
      partner = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM partners WHERE email = ?", [email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    if (!partner) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, partner.password_hash);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

    let restaurante;
    if (isPostgres) {
      const r = await db._pool.query("SELECT id FROM restaurants WHERE partner_id = $1", [partner.id]);
      restaurante = r.rows[0];
    } else {
      restaurante = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM restaurants WHERE partner_id = ?", [partner.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    const token = jwt.sign(
      { partner_id: partner.id, restaurante_id: restaurante?.id },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ ok: true, token, restaurante_id: restaurante?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
