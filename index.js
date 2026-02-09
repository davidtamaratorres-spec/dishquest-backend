const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas del Bloque A
app.use("/restaurants", require("./routes/restaurants"));
app.use("/dishes", require("./routes/dishes"));
app.use("/promotions", require("./routes/promotions"));

// ✅ Diagnóstico: muestra exactamente qué DB está usando el backend
app.get("/__debug/db", (req, res) => {
  const dbPath = path.join(__dirname, "database.sqlite");
  const exists = fs.existsSync(dbPath);

  db.get("SELECT COUNT(*) as c FROM restaurants", (err, r1) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get("SELECT COUNT(*) as c FROM dishes", (err2, r2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      db.get("SELECT COUNT(*) as c FROM promotions", (err3, r3) => {
        if (err3) return res.status(500).json({ error: err3.message });

        res.json({
          dbPath,
          exists,
          fileSizeBytes: exists ? fs.statSync(dbPath).size : 0,
          counts: {
            restaurants: r1.c,
            dishes: r2.c,
            promotions: r3.c,
          },
        });
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DishQuest backend running on port ${PORT}`));

