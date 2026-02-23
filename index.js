// index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const db = require("./db");

// ✅ init del proyecto Colombia (tablas municipios/fiestas)
// - NO afecta DishQuest porque solo corre si COLOMBIA_INIT=1
// - y usa DATABASE_URL (Postgres)
const initColombia = require("./colombiaInit");

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// ✅ DishQuest routes
// =========================
app.use("/restaurants", require("./rutas/restaurantes")); // ✅ ESTA era la que fallaba
app.use("/dishes", require("./rutas/dishes"));
app.use("/promotions", require("./rutas/promotions"));

// =========================
// ✅ Debug DB (DishQuest)
// =========================
app.get("/__debug/db", (req, res) => {
  const dbPath = path.join(__dirname, "database.sqlite");
  const exists = fs.existsSync(dbPath);

  db.get("SELECT COUNT(*) as c FROM restaurants", (err, r1) => {
    if (err) return res.status(500).json({ error: String(err) });

    db.get("SELECT COUNT(*) as c FROM dishes", (err2, r2) => {
      if (err2) return res.status(500).json({ error: String(err2) });

      db.get("SELECT COUNT(*) as c FROM promotions", (err3, r3) => {
        if (err3) return res.status(500).json({ error: String(err3) });

        const fileSizeBytes = exists ? fs.statSync(dbPath).size : 0;

        res.json({
          dbPath,
          exists,
          fileSizeBytes,
          counts: {
            restaurants: r1?.c ?? 0,
            dishes: r2?.c ?? 0,
            promotions: r3?.c ?? 0,
          },
        });
      });
    });
  });
});

// =========================
// ✅ Colombia init trigger (opcional)
// =========================
async function maybeInitColombia() {
  if (process.env.COLOMBIA_INIT !== "1") {
    console.log("ℹ️ ColombiaInit: COLOMBIA_INIT != 1, no se ejecuta.");
    return;
  }

  try {
    console.log("🚀 ColombiaInit: COLOMBIA_INIT=1, ejecutando init...");
    await initColombia();
    console.log("✅ ColombiaInit: terminado.");
  } catch (e) {
    console.error("❌ ColombiaInit: error:", e);
  }
}

maybeInitColombia();

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});
