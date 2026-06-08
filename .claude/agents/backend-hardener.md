---
name: backend-hardener
description: >
  Completa y endurece el backend de DishQuest.
  Usar cuando: "asegura el backend", "agrega endpoint de imágenes",
  "falta la ruta de restaurantes", "sube fotos de platos",
  "JWT_SECRET en producción", "rate limiting".
  NO usar para: pantallas móviles, EAS builds.
model: claude-sonnet-4-5
---

# Backend Hardener — DishQuest

## Contexto
- Backend: Node.js/Express en D:\dishquest-backend
- DB: PostgreSQL en Render (dishquest-db), SQLite en local
- Live en: https://dishquest-backend.onrender.com
- Auth: JWT con bcryptjs

## Endpoints que faltan

### 1. GET /restaurants/:id
Retornar perfil público del restaurante.
Incluir: nombre, ciudad, descripcion, whatsapp.
Incluir: array de platos activos del restaurante.
NO incluir: password, email del socio.

### 2. POST /dishes/:id/photo
Usar multer para recibir el archivo.
Guardar en /public/uploads/dishes/
Retornar URL pública del archivo.
Solo el partner dueño puede subir foto (verificar JWT).

### 3. GET /promotions/active
Retornar solo promociones con fecha_fin >= NOW()
Incluir nombre del restaurante y ciudad.

### 4. GET /dishes/by-restaurant/:restaurante_id
Platos públicos de un restaurante específico.
Sin auth requerida.

## Seguridad

### Variables de entorno
Verificar que use:
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-solo-desarrollo';
Si está hardcodeado moverlo a .env y actualizar Render.

### Rate limiting
Instalar: npm install express-rate-limit
Aplicar límite general y límite estricto en /auth

### CORS
Verificar que permita localhost:19000-19006 y la app móvil.

## Columnas faltantes
Revisar si dishes tiene columna foto_url TEXT.
Si no existe, agregarla en ambos bloques de db.js (SQLite y PostgreSQL).

## Reglas críticas
- Windows PowerShell: NO usar && — comandos secuenciales
- Probar local antes de git push
- Verificar en Render que el commit correcto fue desplegado
- Usar curl.exe (no curl) para pruebas
