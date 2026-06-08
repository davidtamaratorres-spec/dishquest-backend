const express = require('express');
const router = express.Router();

router.post('/analyze-menu', async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }
            },
            {
              type: 'text',
              text: 'Analiza este menú de restaurante colombiano. Extrae cada plato y devuelve SOLO un JSON array sin texto adicional: [{"nombre":"nombre del plato","descripcion":"descripcion breve","precio":0,"categoria":"Entradas|Platos fuertes|Bebidas|Postres|Sopas"}]. Si el precio no está claro usa 0.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const platos = JSON.parse(clean);
    res.json({ ok: true, platos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
