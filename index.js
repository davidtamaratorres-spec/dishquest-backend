const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// ===============================
// Middleware
// ===============================
app.use(express.json());
app.use(cors());

// ===============================
// Health check
// ===============================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "DishQuest backend está vivo",
  });
});

// ===============================
// Datos mock (temporal, controlado)
// ===============================
const dishes = [
  {
    id: "d1",
    name: "Lasaña Vegana",
    description: "Lasaña 100% vegetal con vegetales frescos y salsa de tomate.",
    price: 32000,
    ingredients: JSON.stringify(["Pasta", "Tomate", "Verduras", "Tofu"]),
    restaurantName: "Green House",
    restaurantAddress: "Calle 123 #45-67",
    photo:
      "https://images.unsplash.com/photo-1604908177522-fd8e1f52a0a9?auto=format&w=1200&q=80",
  },
  {
    id: "d2",
    name: "Hamburguesa Veggie BBQ",
    description: "Hamburguesa vegetal con salsa BBQ y pan artesanal.",
    price: 28000,
    ingredients: JSON.stringify(["Pan", "Proteína vegetal", "BBQ", "Lechuga"]),
    restaurantName: "Veggie Street",
    restaurantAddress: "Carrera 45 #10-22",
    photo:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&w=1200&q=80",
  },
  {
    id: "d3",
    name: "Cerveza Roja Artesanal 500ml",
    description: "Cerveza artesanal roja, cuerpo medio y sabor intenso.",
    price: 14000,
    ingredients: JSON.stringify(["Agua", "Malta", "Lúpulo", "Levadura"]),
    restaurantName: "Beer Lab",
    restaurantAddress: "Av. Central #89-10",
    photo:
      "https://images.unsplash.com/photo-156455590571-18256e5bb9ff?auto=format&w=1200&q=80",
  },
];

// ===============================
// GET /dishes (lista)
// ===============================
app.get("/dishes", (req, res) => {
  res.json({
    total: dishes.length,
    data: dishes,
  });
});

// ===============================
// GET /dishes/search?query=...
// ===============================
app.get("/dishes/search", (req, res) => {
  const query = (req.query.query || "").toLowerCase();

  if (!query) {
    return res.json({ total: 0, data: [] });
  }

  const results = dishes.filter((d) => d.name.toLowerCase().includes(query));

  res.json({
    total: results.length,
    data: results,
  });
});

// ===============================
// GET /dishes/:id (detalle)
// ===============================
app.get("/dishes/:id", (req, res) => {
  const { id } = req.params;

  const dish = dishes.find((d) => d.id === id);

  if (!dish) {
    return res.status(404).json({
      error: "Dish not found",
    });
  }

  res.json(dish);
});

// ===============================
// Arranque del servidor
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend DishQuest corriendo en http://0.0.0.0:${PORT}`);
});

