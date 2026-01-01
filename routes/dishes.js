const express = require("express");
const router = express.Router();

/*
  Datos simulados (mock)
  Esto representa lo que luego vendrá de base de datos real
*/
const dishes = [
  {
    id: "d1",
    name: "Lasaña Vegana",
    price: 32000,
    restaurant: "La Mesa Vegana",
    city: "Medellín"
  },
  {
    id: "d2",
    name: "Hamburguesa Veggie BBQ",
    price: 28000,
    restaurant: "La Mesa Vegana",
    city: "Medellín"
  },
  {
    id: "d3",
    name: "Cerveza Roja Artesanal",
    price: 14000,
    restaurant: "La Cervecería Roja",
    city: "Bogotá"
  }
];

// GET /dishes → devuelve todos los platos
router.get("/", (req, res) => {
  res.json({
    total: dishes.length,
    data: dishes
  });
});

// GET /dishes/search?query=texto
router.get("/search", (req, res) => {
  const query = (req.query.query || "").toLowerCase();

  if (!query) {
    return res.json({ total: 0, data: [] });
  }

  const results = dishes.filter(d =>
    d.name.toLowerCase().includes(query) ||
    d.restaurant.toLowerCase().includes(query) ||
    d.city.toLowerCase().includes(query)
  );

  res.json({
    total: results.length,
    data: results
  });
});

module.exports = router;


