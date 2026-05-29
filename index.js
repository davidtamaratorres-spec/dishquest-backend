// index.js
const express = require("express");
const cors = require("cors");

// ✅ init del proyecto Colombia (tablas municipios/fiestas)
// - NO afecta DishQuest porque solo corre si COLOMBIA_INIT=1
// - y usa DATABASE_URL (Postgres)
const initColombia = require("./colombiaInit");

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// ✅ DishQuest routes (OJO: en este repo la carpeta es "routes")
// =========================
app.use("/auth", require("./routes/auth"));
app.use("/partner", require("./routes/partner"));
app.use("/restaurants", require("./routes/restaurants"));
app.use("/dishes", require("./routes/dishes"));
app.use("/promotions", require("./routes/promotions"));

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
