// seed.js — 32 restaurantes, capitales departamentales de Colombia
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const IMG = {
  sopa:    "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80",
  carne:   "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
  pescado: "https://images.unsplash.com/photo-1551269901-5c40ab1b26ca?w=400&q=80",
  arroz:   "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80",
  tipico:  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3b19?w=400&q=80",
  postre:  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
  tropical:"https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&q=80",
  bandeja: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  snack:   "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  bebida:  "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&q=80",
  mar:     "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
  frito:   "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
};

const RESTAURANTS = [
  {
    nombre: "Cocina Sabanera",
    ciudad: "Bogotá",
    direccion: "Carrera 7 #32-16, La Candelaria",
    whatsapp: "+57 314 2345678",
    email: "partner@cocinasabanera.com",
    dishes: [
      { nombre: "Ajiaco Santafereño", descripcion: "Sopa tradicional bogotana con tres tipos de papa, guasca, pollo desmechado y mazorca. Servida con crema y alcaparras.", precio: 22000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Changua Bogotana", descripcion: "Caldo de leche con huevo escalfado, cilantro fresco y pan de yuca. Desayuno típico bogotano.", precio: 15000, categoria: "Desayunos", imagen_url: IMG.sopa },
      { nombre: "Tamal Bogotano", descripcion: "Masa de maíz rellena de pollo, cerdo, arroz, zanahoria y arveja, envuelta en hoja de plátano y cocida al vapor.", precio: 18000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Cuchuco de Trigo", descripcion: "Sopa espesa de trigo partido con papa, habas, costilla de cerdo y hierbas aromáticas de la sabana.", precio: 20000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Mazamorra Bogotana", descripcion: "Maíz trillado cocinado a fuego lento con leche, panela y un toque de canela. Postre tradicional.", precio: 12000, categoria: "Postres", imagen_url: IMG.postre },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Ajiaco Santafereño de lunes a jueves." },
      { tipo: "PROMO", descripcion: "Tamal Bogotano + Agua de Panela por $20.000." },
    ],
  },
  {
    nombre: "La Fondita Paisa",
    ciudad: "Medellín",
    direccion: "Calle 10 #43-22, El Poblado",
    whatsapp: "+57 300 3456789",
    email: "partner@lafondita.com",
    dishes: [
      { nombre: "Bandeja Paisa Completa", descripcion: "Plato típico antioqueño con fríjoles, chicharrón, carne molida, chorizo, morcilla, arepa, huevo frito, arroz y tajadas de maduro.", precio: 35000, categoria: "Típico", imagen_url: IMG.bandeja },
      { nombre: "Mondongo Antioqueño", descripcion: "Sopa contundente de panza de res con papa, zanahoria, papa criolla, cilantro y un sofrito de hogao antioqueño.", precio: 24000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Fríjoles Paisas", descripcion: "Fríjoles rojos cocinados con hogao, plátano, chicharrón y cilantro. Servidos con arroz blanco y arepa.", precio: 20000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Sancocho de Gallina", descripcion: "Caldo reconfortante de gallina criolla con papa, yuca, plátano verde y mazorca. Tradición de domingo.", precio: 26000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Chicharrón Antioqueño", descripcion: "Piel y carne de cerdo frita hasta quedar crocante. Servida con arepa, hogao y aguacate.", precio: 18000, categoria: "Típico", imagen_url: IMG.frito },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Bandeja Paisa los días martes y miércoles." },
      { tipo: "PROMO", descripcion: "Fríjoles Paisas + Chicharrón + Gaseosa por $30.000." },
    ],
  },
  {
    nombre: "Sabor Vallecaucano",
    ciudad: "Cali",
    direccion: "Avenida 6N #23-45, San Antonio",
    whatsapp: "+57 312 4567890",
    email: "partner@saborvallecaucano.com",
    dishes: [
      { nombre: "Sancocho de Gallina Valluno", descripcion: "Sopa tradicional con gallina criolla, papa, yuca, plátano y chillangua. Acompañada de arroz con coco y ají.", precio: 28000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Champús Caleño", descripcion: "Bebida ancestral de lulo, maíz, piña y panela. Refrescante y espesa, typical de las fiestas caleñas.", precio: 10000, categoria: "Bebidas", imagen_url: IMG.bebida },
      { nombre: "Lulada Artesanal", descripcion: "Jugo de lulo con trozos de pulpa, azúcar y agua helada. La bebida más refrescante del Valle.", precio: 9000, categoria: "Bebidas", imagen_url: IMG.tropical },
      { nombre: "Chuleta Valluna", descripcion: "Chuleta de cerdo apanada con huevo y pan rallado, frita y servida con papas, ensalada y ají valluno.", precio: 30000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Cholado de Cali", descripcion: "Hielo picado con frutas tropicales, jarabes de colores, leche condensada y chantillí. Postre icónico caleño.", precio: 12000, categoria: "Postres", imagen_url: IMG.postre },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "25% de descuento en Chuleta Valluna los viernes." },
      { tipo: "PROMO", descripcion: "Sancocho de Gallina + Lulada por $32.000." },
    ],
  },
  {
    nombre: "El Caribe en Tu Mesa",
    ciudad: "Barranquilla",
    direccion: "Calle 72 #56-12, El Prado",
    whatsapp: "+57 316 5678901",
    email: "partner@caribemesa.com",
    dishes: [
      { nombre: "Arroz con Coco Costeño", descripcion: "Arroz preparado con leche de coco fresco, acompañado de pescado frito y patacones. Sabor del Caribe auténtico.", precio: 22000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Butifarra Barranquillera", descripcion: "Embutido de cerdo sazonado con especias locales, frito y servido con bollo de yuca y suero costeño.", precio: 18000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Arepa de Huevo", descripcion: "Arepa frita rellena de huevo y carne molida, dorada hasta quedar crujiente. Ícono del desayuno barranquillero.", precio: 8000, categoria: "Desayunos", imagen_url: IMG.frito },
      { nombre: "Sancocho de Guandú", descripcion: "Sopa de guandú con carne de res, yuca, ñame y coco. Plato de celebración costeño.", precio: 25000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Patacones con Hogao", descripcion: "Plátano verde aplastado y frito dos veces, servido con hogao de tomate y cebolla. Acompañante infaltable.", precio: 10000, categoria: "Típico", imagen_url: IMG.frito },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "10% de descuento en toda la carta los domingos." },
      { tipo: "PROMO", descripcion: "Arepa de Huevo + Jugo Natural por $14.000." },
    ],
  },
  {
    nombre: "La Heroica Cocina",
    ciudad: "Cartagena",
    direccion: "Calle del Arsenal #8-32, Getsemaní",
    whatsapp: "+57 318 6789012",
    email: "partner@heroicacocina.com",
    dishes: [
      { nombre: "Mote de Queso", descripcion: "Sopa cremosa de ñame con queso costeño, cebolla y ají chombo. Plato emblema de la Costa Caribe.", precio: 22000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Posta Negra Cartagenera", descripcion: "Carne de res braseada en salsa oscura de panela, aliños y especias por horas. Servida con arroz con coco y yuca.", precio: 38000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Carimañola de Pescado", descripcion: "Croqueta de yuca rellena de pescado guisado con cebolla, tomate y ají. Frita y crujiente.", precio: 12000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Ceviche de Camarón", descripcion: "Camarones frescos marinados en limón, con tomate, cebolla morada, cilantro y ají piquín. Servido frío.", precio: 32000, categoria: "Mariscos", imagen_url: IMG.mar },
      { nombre: "Arroz con Coco y Pasas", descripcion: "Arroz de coco dulce con pasas y un toque de panela. Acompañamiento ideal para pescados y mariscos.", precio: 15000, categoria: "Arroz", imagen_url: IMG.arroz },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Ceviche de Camarón de lunes a miércoles." },
      { tipo: "PROMO", descripcion: "Posta Negra + Arroz con Coco + Postre por $48.000." },
    ],
  },
  {
    nombre: "Sabor Nortesantandereano",
    ciudad: "Cúcuta",
    direccion: "Avenida 0 #14-35, Centro",
    whatsapp: "+57 311 7890123",
    email: "partner@sabornortesantandereano.com",
    dishes: [
      { nombre: "Mute Santandereano", descripcion: "Sopa contundente de maíz, trigo, garbanzos, costilla de cerdo, papa y plátano. El plato más representativo de la región.", precio: 26000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Pepitoria de Menudencias", descripcion: "Menudencias de chivo guisadas con maíz, arroz y especias. Receta ancestral de la frontera.", precio: 22000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Carne Oreada Cucuteña", descripcion: "Carne de res marinada y secada al sol con sal, ajo y comino. Asada al carbón y servida con yuca y papa.", precio: 30000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Cabrito a la Brasa", descripcion: "Cabrito joven asado a la leña con hierbas del páramo. Tradición culinaria de Norte de Santander.", precio: 42000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Hayacas Cucuteñas", descripcion: "Tamal de maíz relleno de carne, pollo, tocino y verduras. Envuelto en hoja de plátano y cocido a vapor.", precio: 16000, categoria: "Típico", imagen_url: IMG.tipico },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Cabrito a la Brasa los sábados." },
      { tipo: "PROMO", descripcion: "Mute + Hayaca + Aguapanela fría por $38.000." },
    ],
  },
  {
    nombre: "El Bumangués",
    ciudad: "Bucaramanga",
    direccion: "Carrera 35 #48-40, Cabecera del Llano",
    whatsapp: "+57 317 8901234",
    email: "partner@elbumangues.com",
    dishes: [
      { nombre: "Mute Santandereano Completo", descripcion: "Versión bumanguesa con maíz, garbanzos, fríjol, trigo, costilla y vísceras de cerdo. Adornado con papa amarilla.", precio: 28000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Carne Oreada Santandereana", descripcion: "Carne de res salada y secada al sol, marinada con comino y ajo, servida a la brasa con yuca sancochada.", precio: 32000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Pepitoria Santandereana", descripcion: "Panza, patas y menudencias de cabrito cocinadas con maíz, papa y cilantro. Plato de herencia santandereana.", precio: 24000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Cabro al Palo", descripcion: "Cabrito entero asado a las brasas durante horas. Carne tierna y jugosa, acompañada de papa criolla.", precio: 45000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Arepa Chicharrona", descripcion: "Arepa de maíz rellena de chicharrón triturado y queso blanco. Desayuno típico bumangués.", precio: 12000, categoria: "Desayunos", imagen_url: IMG.snack },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "25% de descuento en Carne Oreada los jueves." },
      { tipo: "PROMO", descripcion: "Arepa Chicharrona + Caldo de Papa por $18.000." },
    ],
  },
  {
    nombre: "Cocina Risaraldense",
    ciudad: "Pereira",
    direccion: "Calle 19 #6-48, Centro",
    whatsapp: "+57 313 9012345",
    email: "partner@cocinarisaraldense.com",
    dishes: [
      { nombre: "Sancocho de Gallina Risaraldense", descripcion: "Gallina criolla cocinada con papa, yuca, plátano y mazorca. Servida con arroz blanco y aguacate del Eje Cafetero.", precio: 27000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Fríjoles Risaraldenses", descripcion: "Fríjoles cargamanto con hogao, chicharrón, plátano maduro y cilantro. Plato embajador del Eje Cafetero.", precio: 21000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Tamal Risaraldense", descripcion: "Tamal de maíz relleno de pollo, cerdo, papa y arroz con achiote. Envuelto en hoja de plátano y bija.", precio: 17000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Bandeja Típica Cafetera", descripcion: "Arroz, fríjoles, chicharrón, carne asada, arepa, huevo y plátano maduro. El almuerzo completo del Eje.", precio: 33000, categoria: "Típico", imagen_url: IMG.bandeja },
      { nombre: "Pandeyuca con Chocolate", descripcion: "Pan de yuca esponjoso y caliente, acompañado de chocolate santafereño con queso.", precio: 10000, categoria: "Desayunos", imagen_url: IMG.snack },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "10% de descuento en Bandeja Típica los lunes." },
      { tipo: "PROMO", descripcion: "Tamal Risaraldense + Chocolate Caliente por $24.000." },
    ],
  },
  {
    nombre: "La Samaria",
    ciudad: "Santa Marta",
    direccion: "Carrera 2 #16-44, El Rodadero",
    whatsapp: "+57 315 0123456",
    email: "partner@lasamaria.com",
    dishes: [
      { nombre: "Viudo de Bocachico", descripcion: "Sopa de bocachico fresco con papa, yuca, plátano y ají dulce. Plato ancestral del río Magdalena.", precio: 28000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Arroz con Coco Samario", descripcion: "Arroz preparado en leche de coco con un toque de panela. Acompañamiento estrella de la Sierra Nevada.", precio: 16000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Ceviche de Camarones del Caribe", descripcion: "Camarones del Mar Caribe marinados en limón tahití, cebolla morada, cilantro y tomate cherry.", precio: 34000, categoria: "Mariscos", imagen_url: IMG.mar },
      { nombre: "Patacones Rellenos", descripcion: "Patacones crocantes rellenos de camarones, hogao, guacamole y queso costeño rallado.", precio: 22000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Sancocho Trifásico", descripcion: "Sancocho de res, cerdo y pollo con papa, yuca, mazorca y plátano. Plato de celebración samario.", precio: 30000, categoria: "Sopas", imagen_url: IMG.sopa },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "30% de descuento en Ceviche de Camarones martes y miércoles." },
      { tipo: "PROMO", descripcion: "Viudo de Bocachico + Arroz con Coco + Limonada por $40.000." },
    ],
  },
  {
    nombre: "Ciudad Musical Tolimense",
    ciudad: "Ibagué",
    direccion: "Carrera 5 #14-30, Centro Histórico",
    whatsapp: "+57 320 1234567",
    email: "partner@ciudadmusical.com",
    dishes: [
      { nombre: "Lechona Tolimense", descripcion: "Cerdo entero relleno de arroz, arveja, cebolla y especias, horneado lentamente por horas. Plato rey del Tolima.", precio: 28000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Tamal Tolimense", descripcion: "El más grande de Colombia: masa de maíz con pollo, cerdo, papa, huevo, zanahoria y arveja en hoja de plátano.", precio: 20000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Viudo de Pescado del Río", descripcion: "Bocachico y bagre del Magdalena cocinados con yuca, papa, plátano y guandú. Sabor del Tolima profundo.", precio: 26000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Bizcocho de Achira", descripcion: "Galleta tradicional tolimense elaborada con almidón de achira y queso. Crujiente y aireada.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Insulso Tolimense", descripcion: "Postre de mazorca tierna molida, cocinada con leche, panela, clavos y canela. Dulce tradicional.", precio: 11000, categoria: "Postres", imagen_url: IMG.postre },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Lechona Tolimense los sábados y domingos." },
      { tipo: "PROMO", descripcion: "Tamal + Bizcocho de Achira + Agua de Panela por $26.000." },
    ],
  },
  {
    nombre: "Cocina Nariñense",
    ciudad: "Pasto",
    direccion: "Calle 19 #24-38, Centro",
    whatsapp: "+57 321 2345678",
    email: "partner@cocinanariniense.com",
    dishes: [
      { nombre: "Cuy Asado Nariñense", descripcion: "Cuy criado en el campo, asado al carbón con sal, comino y ajo. Servido con papa chorreada y maíz tostado.", precio: 45000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Papas Chorreadas", descripcion: "Papas pastusas cocidas y bañadas en hogao de tomate, cebolla, crema de leche y queso campesino.", precio: 16000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Sopa de Mote", descripcion: "Sopa de mote de maíz con queso, cebolla larga, leche y mantequilla. Reconfortante plato de tierras frías.", precio: 18000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Empanada de Pipián", descripcion: "Empanada de maíz rellena de pipián (salsa de maní con papa) y hogao. Tradición del carnaval de Pasto.", precio: 6000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Champús Nariñense", descripcion: "Bebida tradicional de maíz, lulo, piña y panela, servida fría con hojas de naranjo. Patrimonio culinario.", precio: 10000, categoria: "Bebidas", imagen_url: IMG.bebida },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Cuy Asado los viernes y sábados." },
      { tipo: "PROMO", descripcion: "Empanada de Pipián x3 + Champús por $24.000." },
    ],
  },
  {
    nombre: "La Cafetera de Caldas",
    ciudad: "Manizales",
    direccion: "Carrera 22 #20-48, Chipre",
    whatsapp: "+57 322 3456789",
    email: "partner@lacafetera.com",
    dishes: [
      { nombre: "Bandeja Típica Caldense", descripcion: "Arroz, fríjoles rojos, chicharrón, carne asada, arepa, plátano maduro y huevo. La tradición del Eje Cafetero.", precio: 32000, categoria: "Típico", imagen_url: IMG.bandeja },
      { nombre: "Fríjoles Caldenses con Chicharrón", descripcion: "Fríjoles cargamanto cocinados con garra de cerdo, hogao y cilantro. Servidos con arroz y aguacate.", precio: 22000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Mazamorra Caldense", descripcion: "Maíz blanco trillado cocinado en leche con panela. Postre clásico que acompaña la tarde cafetera.", precio: 11000, categoria: "Postres", imagen_url: IMG.postre },
      { nombre: "Arepa de Choclo con Queso", descripcion: "Arepa dulce de choclo fresco, cocinada en comal y rellena de queso campesino fundido.", precio: 9000, categoria: "Desayunos", imagen_url: IMG.snack },
      { nombre: "Pandebono Caliente", descripcion: "Pan de almidón de yuca y queso, horneado al momento. Acompañante perfecto del café de Caldas.", precio: 7000, categoria: "Desayunos", imagen_url: IMG.snack },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "10% de descuento en Bandeja Típica todos los martes." },
      { tipo: "PROMO", descripcion: "Pandebono x4 + Café Especial por $16.000." },
    ],
  },
  {
    nombre: "El Huilense Auténtico",
    ciudad: "Neiva",
    direccion: "Carrera 5 #7-21, Centro",
    whatsapp: "+57 323 4567890",
    email: "partner@huilenseautentico.com",
    dishes: [
      { nombre: "Asado Huilense", descripcion: "Carne de res marinada con achiote, comino y ajo, asada a la brasa. Plato símbolo del Huila, servido con yuca y arepa.", precio: 34000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Bizcocho de Achira Huilense", descripcion: "Galletita aireada de almidón de achira con queso. Patrimonio gastronómico declarado en el Huila.", precio: 7000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Insulso de Maíz", descripcion: "Postre de mazorca verde molida con leche, panela, clavo y canela, cocido hasta espesar.", precio: 11000, categoria: "Postres", imagen_url: IMG.postre },
      { nombre: "Maduro con Queso y Hogao", descripcion: "Plátano maduro asado, abierto y relleno de queso campesino fundido con hogao de tomate.", precio: 13000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Envuelto de Mazorca", descripcion: "Masa de choclo envuelta en la misma hoja y asada. Dulce o salado, con queso o solo con mantequilla.", precio: 9000, categoria: "Snacks", imagen_url: IMG.snack },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Asado Huilense los domingos." },
      { tipo: "PROMO", descripcion: "Asado Huilense + Bizcocho de Achira + Limonada por $42.000." },
    ],
  },
  {
    nombre: "Llanero Legítimo",
    ciudad: "Villavicencio",
    direccion: "Carrera 35 #12-28, Villavicencio",
    whatsapp: "+57 324 5678901",
    email: "partner@llanerole.com",
    dishes: [
      { nombre: "Mamona Llanera", descripcion: "Ternera llanera asada en vara al fuego lento de madera. Carne jugosa y dorada, símbolo de los llanos orientales.", precio: 48000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Cachama Frita del Llano", descripcion: "Cachama fresca del río criada en los llanos, frita entera con sal marina. Servida con yuca frita y arroz.", precio: 32000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Hayacas Llaneras", descripcion: "Tamal de los llanos relleno de carne, pollo, arroz y especias, envuelto en hoja de cachama y amarrado.", precio: 17000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Tungos de Arroz", descripcion: "Arroz con leche condimentado envuelto en hoja de maíz. Postre tradicional de la cocina llanera.", precio: 10000, categoria: "Postres", imagen_url: IMG.postre },
      { nombre: "Masato de Arroz", descripcion: "Bebida fermentada de arroz con azúcar y canela. Refrescante y representativa de la cultura llanera.", precio: 9000, categoria: "Bebidas", imagen_url: IMG.bebida },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Mamona los sábados y domingos." },
      { tipo: "PROMO", descripcion: "Cachama Frita + Yuca + Masato por $40.000." },
    ],
  },
  {
    nombre: "Sabor Quindiano",
    ciudad: "Armenia",
    direccion: "Carrera 14 #15-32, Centro Histórico",
    whatsapp: "+57 325 6789012",
    email: "partner@saborquindiano.com",
    dishes: [
      { nombre: "Fríjoles Quindianos", descripcion: "Fríjoles cargamanto cocinados con garra de cerdo, cebolla y tomillo. La receta de las abuelas quindianas.", precio: 21000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Mazamorra Quindiana", descripcion: "Maíz trillado blanco cocido en leche con panela negra del Quindío. El postre más querido del Eje.", precio: 11000, categoria: "Postres", imagen_url: IMG.postre },
      { nombre: "Empanada Quindiana de Pipián", descripcion: "Empanada frita de maíz rellena de papas con salsa de maní y ají. Snack típico de mercados y ferias.", precio: 6000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Sancocho Quindiano", descripcion: "Caldo de pollo y res con papa, yuca, plátano y mazorca. Servido con arroz y hogao artesanal.", precio: 26000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Bandeja Típica Cafetera Quindiana", descripcion: "Fríjoles, arroz, chicharrón, carne molida, arepa, huevo, aguacate y plátano. El almuerzo completo del Quindío.", precio: 31000, categoria: "Típico", imagen_url: IMG.bandeja },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "25% de descuento en Sancocho Quindiano los lunes." },
      { tipo: "PROMO", descripcion: "Empanada x3 + Limonada de Panela por $22.000." },
    ],
  },
  {
    nombre: "Ritmo Vallenato en Mesa",
    ciudad: "Valledupar",
    direccion: "Calle 15 #6-30, La Esperanza",
    whatsapp: "+57 326 7890123",
    email: "partner@ritmovallenato.com",
    dishes: [
      { nombre: "Arroz con Coco Vallenato", descripcion: "Arroz tradicional cocinado con coco rallado, un poco de panela y sal. Acompañante de toda celebración vallenata.", precio: 16000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Friche de Chivo", descripcion: "Menudencias y carne de chivo guisadas con limón, cebolla, ajo y colorante. Plato festivo del Cesar.", precio: 28000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Sancocho Cesarense", descripcion: "Caldo de gallina criolla con papa, yuca, ñame y plátano. Cocinado a leña en olla grande.", precio: 24000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Bollo de Mazorca", descripcion: "Masa de choclo tierno molido, envuelta en la misma tusa y cocinada al vapor. Dulce y suave.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Carimañola Vallenata", descripcion: "Croqueta de yuca rellena de carne molida guisada, frita hasta quedar dorada. Snack de mercado.", precio: 10000, categoria: "Snacks", imagen_url: IMG.frito },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "10% de descuento en todo el menú los viernes de Festival." },
      { tipo: "PROMO", descripcion: "Friche de Chivo + Arroz con Coco + Jugo por $38.000." },
    ],
  },
  {
    nombre: "Costa Cordobesa",
    ciudad: "Montería",
    direccion: "Avenida Circunvalar #14-52, Montería",
    whatsapp: "+57 327 8901234",
    email: "partner@costacordobesa.com",
    dishes: [
      { nombre: "Mote de Queso Cordobés", descripcion: "Sopa espesa de ñame con queso costeño fresco, cebolla, mantequilla y ají chombo. La receta de Montería.", precio: 23000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Suero Atollabuey", descripcion: "Suero costeño sobre patacón crujiente con queso rallado y hogao. El desayuno cordobés por excelencia.", precio: 14000, categoria: "Desayunos", imagen_url: IMG.tipico },
      { nombre: "Bollo de Yuca", descripcion: "Yuca rallada y condimentada, envuelta en hoja de plátano y hervida. Acompañamiento tradicional.", precio: 7000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Arroz Costeño Cordobés", descripcion: "Arroz con coco, fríjoles cabecita negra y especias. La guarnición infaltable de la costa cordobesa.", precio: 15000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Sancocho Trifásico Cordobés", descripcion: "Sancocho de pollo, res y cerdo con yuca, ñame, mazorca y plátano. Plato de domingo familiar.", precio: 29000, categoria: "Sopas", imagen_url: IMG.sopa },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Mote de Queso los miércoles." },
      { tipo: "PROMO", descripcion: "Bollo x3 + Suero Atollabuey + Jugos por $28.000." },
    ],
  },
  {
    nombre: "La Sucreña Costeña",
    ciudad: "Sincelejo",
    direccion: "Calle 29 #20-45, Sincelejo",
    whatsapp: "+57 328 9012345",
    email: "partner@lasucreniacoste.com",
    dishes: [
      { nombre: "Mote de Queso Sucreño", descripcion: "Sopa de ñame y queso costeño con ahuyama, cebolla y ají chombo. Receta de las abuelas sincelejanas.", precio: 22000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Friche Sucreño", descripcion: "Patas, menudencias y carne de cabra guisadas con limón, pimienta y cebolla. Plato festivo de Sucre.", precio: 26000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Arroz Costeño Sucreño", descripcion: "Arroz con fríjoles cabecita negra y tocineta, guisado con cebolla y ají dulce. Acompañamiento costeño.", precio: 14000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Patacón con Hogao Sincelejano", descripcion: "Plátano verde frito aplastado y frito de nuevo, servido con hogao de tomate y cebolla fresca.", precio: 10000, categoria: "Snacks", imagen_url: IMG.frito },
      { nombre: "Butifarra Sincelejana", descripcion: "Embutido de cerdo y res con especias locales, servido con bollo de yuca y limón. La butifarra más famosa de Colombia.", precio: 18000, categoria: "Típico", imagen_url: IMG.tipico },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Butifarra los sábados." },
      { tipo: "PROMO", descripcion: "Mote de Queso + Patacón + Jugo Natural por $30.000." },
    ],
  },
  {
    nombre: "La Ciudad Blanca Gastro",
    ciudad: "Popayán",
    direccion: "Calle 4 #8-44, Centro Histórico Blanco",
    whatsapp: "+57 329 0123456",
    email: "partner@ciudadblancagastro.com",
    dishes: [
      { nombre: "Pipián de Maní", descripcion: "Salsa espesa de maní tostado con papa, ají y especias caucanas. Plato ancestral de comunidades indígenas.", precio: 20000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Empanadas de Pipián Caucanas", descripcion: "Empanadas de maíz rellenas de papa con salsa de maní y ají colorado. Ganaron reconocimiento mundial.", precio: 6000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Ulluco con Carne", descripcion: "Ulluco (tubérculo andino) cocinado con carne de res, cebolla y hierbas del páramo caucano.", precio: 22000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Sango Caucano", descripcion: "Masa de maíz con queso y chicharrón, cocinada en agua hasta formar una pasta espesa y nutritiva.", precio: 16000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Champús Caucano", descripcion: "Bebida fría de maíz fermentado con lulo, piña, guanábana y hojas de naranjo. Refrescante y ancestral.", precio: 10000, categoria: "Bebidas", imagen_url: IMG.bebida },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "30% de descuento en Empanadas de Pipián (mínimo 6 und) los domingos." },
      { tipo: "PROMO", descripcion: "Pipián de Maní + Sango + Champús por $38.000." },
    ],
  },
  {
    nombre: "Cocina Boyacense",
    ciudad: "Tunja",
    direccion: "Carrera 11 #19-31, Centro Histórico",
    whatsapp: "+57 310 1234567",
    email: "partner@cocinaboyacense.com",
    dishes: [
      { nombre: "Puchero Boyacense", descripcion: "Cocido de garbanzos, papa criolla, papa pastusa, costilla, mazorca, zanahoria y plátano. Plato festivo boyacense.", precio: 27000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Cuchuco de Trigo Boyacense", descripcion: "Sopa de trigo partido con papa, habas, costilla de cerdo y hierbas del altiplano boyacense.", precio: 22000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Mazamorra Chiquita", descripcion: "Sopa espesa de maíz chiquito con papa, fríjol y guiso de cebolla. Tradicional del altiplano.", precio: 19000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Fritanga Boyacense", descripcion: "Mezcla de morcilla, chicharrón, costilla y papa criolla frita. El picoteo más popular de Boyacá.", precio: 25000, categoria: "Típico", imagen_url: IMG.frito },
      { nombre: "Mutis de Papa", descripcion: "Sopa de papas andinas con leche, mantequilla de campo y queso campesino. Plato colonial boyacense.", precio: 17000, categoria: "Sopas", imagen_url: IMG.sopa },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Puchero Boyacense todos los domingos." },
      { tipo: "PROMO", descripcion: "Fritanga + Cuchuco de Trigo + Chicha por $42.000." },
    ],
  },
  {
    nombre: "Sabor Amazónico Caquetá",
    ciudad: "Florencia",
    direccion: "Carrera 13 #15-40, Centro de Florencia",
    whatsapp: "+57 308 2345678",
    email: "partner@saboramazonico.com",
    dishes: [
      { nombre: "Bocachico Frito del Caquetá", descripcion: "Bocachico fresco del río Caquetá, frito entero con sal gruesa. Servido con yuca, patacón y ensalada.", precio: 28000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Yuca Frita con Hogao", descripcion: "Yuca del piedemonte amazónico, hervida y frita hasta quedar dorada. Servida con hogao de cebolla y tomate.", precio: 12000, categoria: "Snacks", imagen_url: IMG.frito },
      { nombre: "Envuelto de Maíz Amazónico", descripcion: "Masa de maíz tierno con panela y canela, envuelta en hoja de bijao y asada a las brasas.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Tacacho con Cecina", descripcion: "Bola de plátano verde aplastado con manteca, acompañada de cecina (carne seca) del Amazonas.", precio: 22000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Jugo de Copoazú", descripcion: "Jugo natural de copoazú, fruta amazónica de sabor único entre guanábana y maracuyá. Refrescante.", precio: 9000, categoria: "Bebidas", imagen_url: IMG.tropical },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Bocachico Frito los viernes y sábados." },
      { tipo: "PROMO", descripcion: "Tacacho con Cecina + Jugo de Copoazú por $28.000." },
    ],
  },
  {
    nombre: "La Cocina del Pacífico",
    ciudad: "Quibdó",
    direccion: "Calle 27 #4-20, Quibdó",
    whatsapp: "+57 307 3456789",
    email: "partner@pacifico.com",
    dishes: [
      { nombre: "Pusandao Chocoano", descripcion: "Sopa de plátano pintón, ñame y carne de res. Plato identitario del Chocó cocinado en olla de barro.", precio: 25000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Encocado de Pescado", descripcion: "Pescado del Pacífico cocinado en leche de coco con ají, cebolla y chillangua. Plato embajador del Chocó.", precio: 32000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Arroz con Bala", descripcion: "Arroz guisado con mariscos del Pacífico: camarones, almejas y calamares. Sazonado con hierbas chocoanas.", precio: 28000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Chontaduro con Miel y Sal", descripcion: "Chontaduro maduro del Pacífico cocinado al vapor, servido con miel de abeja o sal al gusto.", precio: 12000, categoria: "Snacks", imagen_url: IMG.tropical },
      { nombre: "Tumba de Plátano", descripcion: "Plátano maduro majado con queso crema y panela. Postre tradicional chocoano.", precio: 10000, categoria: "Postres", imagen_url: IMG.postre },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "25% de descuento en Encocado de Pescado los jueves." },
      { tipo: "PROMO", descripcion: "Pusandao + Encocado + Arroz con Bala por $68.000 (para 2)." },
    ],
  },
  {
    nombre: "Sabor Guajiro",
    ciudad: "Riohacha",
    direccion: "Calle 1 #7-45, Malecón de Riohacha",
    whatsapp: "+57 306 4567890",
    email: "partner@saborguajiro.com",
    dishes: [
      { nombre: "Friche de Chivo Guajiro", descripcion: "Sangre, menudencias y carne de chivo guisadas con limón, vinagre y especias wayuu. Plato ceremonial.", precio: 30000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Arroz de Fríjol Cabecita Negra", descripcion: "Arroz guisado con fríjoles cabecita negra, chicharrón y coco. El acompañamiento sagrado de La Guajira.", precio: 17000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Mute Guajiro", descripcion: "Sopa de maíz, trigo y chivo con especias desérticas. Plato ancestral de la cultura wayuu.", precio: 26000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Chivo Guisado en Leña", descripcion: "Chivo de la serranía cocinado a fuego lento en olla de barro con ají, cebolla y tomate natural.", precio: 38000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Bollo de Maíz Guajiro", descripcion: "Masa de maíz dulce con especias, envuelta en tusa y cocida al vapor. Bocado tradicional wayuu.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Chivo Guisado los fines de semana." },
      { tipo: "PROMO", descripcion: "Friche + Arroz de Fríjol + Suero por $42.000." },
    ],
  },
  {
    nombre: "Guaviare Natural Cocina",
    ciudad: "San José del Guaviare",
    direccion: "Carrera 22 #8-15, San José del Guaviare",
    whatsapp: "+57 305 5678901",
    email: "partner@guaviarenatural.com",
    dishes: [
      { nombre: "Cachama Asada a la Brasa", descripcion: "Cachama del río Guaviare asada entera con sal y limón, servida con fariña y yuca sancochada.", precio: 30000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Fariña con Sardina Ahumada", descripcion: "Harina de yuca tostada mezclada con sardina del río ahumada y limón. Plato de subsistencia amazónica.", precio: 18000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Casabe Artesanal", descripcion: "Torta crujiente de yuca brava rallada y tostada. Pan ancestral de los indígenas del Guaviare.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Tacacho del Guaviare", descripcion: "Plátano verde aplastado mezclado con manteca de cerdo y sal, frito en sartén de hierro.", precio: 14000, categoria: "Típico", imagen_url: IMG.frito },
      { nombre: "Jugo de Copoazú Natural", descripcion: "Fruta amazónica procesada en jugo con agua y miel de caña. Sabor único de la selva colombiana.", precio: 9000, categoria: "Bebidas", imagen_url: IMG.tropical },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Cachama Asada los sábados." },
      { tipo: "PROMO", descripcion: "Tacacho + Fariña + Jugo de Copoazú por $32.000." },
    ],
  },
  {
    nombre: "Cocina Putumayense",
    ciudad: "Mocoa",
    direccion: "Calle 9 #5-33, Centro de Mocoa",
    whatsapp: "+57 304 6789012",
    email: "partner@cocinaputumayo.com",
    dishes: [
      { nombre: "Maito de Pescado", descripcion: "Pescado fresco del Putumayo envuelto en hoja de bijao y asado a las brasas con sal y ají de monte.", precio: 28000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Chontaduro Amazónico", descripcion: "Chontaduro de la selva putumayense cocinado al vapor, servido con sal o miel según preferencia.", precio: 11000, categoria: "Snacks", imagen_url: IMG.tropical },
      { nombre: "Caldo de Bagre Putumayense", descripcion: "Sopa de bagre del río con papa, yuca, cilantro de monte y ají negro amazónico.", precio: 24000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Fariña de Yuca Amazónica", descripcion: "Harina de yuca tostada en tiesto de barro, lista para acompañar sopas y guisos de la selva.", precio: 9000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Casabe Putumayense", descripcion: "Pan de yuca crujiente elaborado artesanalmente por comunidades indígenas de la ribera del Putumayo.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Maito de Pescado los viernes." },
      { tipo: "PROMO", descripcion: "Maito + Chontaduro + Caldo de Bagre por $58.000 para 2." },
    ],
  },
  {
    nombre: "El Vicharreño",
    ciudad: "Puerto Carreño",
    direccion: "Calle 12 #9-20, Puerto Carreño",
    whatsapp: "+57 303 7890123",
    email: "partner@elvicharreno.com",
    dishes: [
      { nombre: "Palometa Frita del Orinoco", descripcion: "Palometa del río Orinoco frita entera con sal y limón. Pescado carnoso servido con yuca y ensalada.", precio: 26000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Sopa de Bagre del Llano", descripcion: "Sopa con bagre rayado de la Orinoquía, papa, yuca, cilantro y ají del Vichada.", precio: 23000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Yuca con Hogao Vichadeño", descripcion: "Yuca de la selva amazónica sancochada y servida con hogao de cebolla, tomate y mantequilla.", precio: 12000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Fariña del Orinoco", descripcion: "Harina de yuca tostada, el acompañamiento tradicional de los pescados del Vichada.", precio: 8000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Tacacho Vicharreño", descripcion: "Plátano verde majado con manteca y sal, frito en sartén de hierro fundido a las brasas.", precio: 13000, categoria: "Típico", imagen_url: IMG.frito },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "10% de descuento en Palometa Frita todos los días." },
      { tipo: "PROMO", descripcion: "Palometa + Yuca + Fariña + Jugo por $36.000." },
    ],
  },
  {
    nombre: "Sabor del Guainía",
    ciudad: "Inírida",
    direccion: "Carrera 5 #4-15, Inírida",
    whatsapp: "+57 302 8901234",
    email: "partner@saborguainia.com",
    dishes: [
      { nombre: "Bocachico Asado en Bijao", descripcion: "Bocachico del río Guainía envuelto en hoja de bijao y asado a las brasas con sal de monte.", precio: 27000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Casabe Artesanal del Guainía", descripcion: "Pan de yuca brava elaborado por comunidades curripaco. Crujiente y sin gluten, patrimonio indígena.", precio: 9000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Mañoco Amazónico", descripcion: "Yuca granulada y tostada, usada como acompañamiento de sopas y caldos. Conserva el sabor de la selva.", precio: 8000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Caldo de Indio", descripcion: "Sopa de maíz pelado con carne de monte o pollo criollo. Receta ancestral del pueblo indígena del Guainía.", precio: 21000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Chontaduro Natural de la Selva", descripcion: "Chontaduro silvestre recogido en las selvas del Guainía, cocinado al vapor con sal de río.", precio: 11000, categoria: "Snacks", imagen_url: IMG.tropical },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "25% de descuento en Bocachico Asado los jueves." },
      { tipo: "PROMO", descripcion: "Caldo de Indio + Casabe + Chontaduro por $35.000." },
    ],
  },
  {
    nombre: "Cocina Vaupense",
    ciudad: "Mitú",
    direccion: "Calle 7 #3-10, Mitú",
    whatsapp: "+57 301 9012345",
    email: "partner@cociavaupense.com",
    dishes: [
      { nombre: "Pirarucu Asado", descripcion: "El pez más grande del Amazonas asado a las brasas, con sal gruesa y hierbas amazónicas. Manjar del Vaupés.", precio: 42000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Casabe del Vaupés", descripcion: "Tortilla crujiente de yuca brava elaborada por artesanos indígenas del Vaupés. Pan ancestral.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
      { nombre: "Fariña de Yuca Vaupense", descripcion: "Yuca procesada y tostada artesanalmente. Acompañamiento indispensable de los platos del Vaupés.", precio: 9000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Sopa de Tuco", descripcion: "Sopa de maíz con vegetales de la chagra indígena y carne de gallina criolla del Vaupés.", precio: 22000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Piña Amazónica Fresca", descripcion: "Piña cultivada en la selva vaupense, servida fresca con sal y limón. Dulce y extremadamente aromática.", precio: 10000, categoria: "Postres", imagen_url: IMG.tropical },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Pirarucu Asado los sábados." },
      { tipo: "PROMO", descripcion: "Pirarucu + Casabe + Fariña + Jugo Amazónico por $55.000." },
    ],
  },
  {
    nombre: "Amazonas en Mesa",
    ciudad: "Leticia",
    direccion: "Carrera 10 #9-25, Leticia",
    whatsapp: "+57 300 0123456",
    email: "partner@amazonasenmesa.com",
    dishes: [
      { nombre: "Pirarucu al Ajillo", descripcion: "Filete de pirarucu salteado con mantequilla, ajo, limón y hierbas amazónicas. El rey de los peces del Amazonas.", precio: 45000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Tacacho con Cecina Amazónica", descripcion: "Bola de plátano verde con manteca de cerdo, acompañada de cecina de res seca y frita del Amazonas.", precio: 24000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Juane de Gallina", descripcion: "Tamal amazónico de arroz con gallina, aceitunas y huevo, envuelto en hoja de bijao. Plato festivo.", precio: 22000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Ceviche de Río Amazónico", descripcion: "Pescado blanco del Amazonas marinado en limón con cebolla, culantro, ají charapita y tomate.", precio: 28000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Casabe Leticiense", descripcion: "Pan crujiente de yuca brava, elaborado por artesanos tikuna. Acompañante tradicional de toda comida amazónica.", precio: 8000, categoria: "Snacks", imagen_url: IMG.snack },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "30% de descuento en Pirarucu al Ajillo los miércoles." },
      { tipo: "PROMO", descripcion: "Ceviche de Río + Casabe + Jugo Amazónico por $36.000." },
    ],
  },
  {
    nombre: "El Araucano",
    ciudad: "Arauca",
    direccion: "Calle 20 #18-35, Arauca",
    whatsapp: "+57 316 1234567",
    email: "partner@elaraucano.com",
    dishes: [
      { nombre: "Mamona Llanera Araucana", descripcion: "Ternera criada en los llanos araucanos, asada en vara a fuego de madera dura. La mamona más auténtica.", precio: 48000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Palo a Pique Araucano", descripcion: "Carne de res con fríjoles, tomate y cebolla, guisado a fuego lento. Plato llanero de subsistencia.", precio: 26000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Hayacas Llaneras", descripcion: "Tamal de los llanos con carne, arroz y especias, amarrado en hoja de plátano y cocido en agua.", precio: 16000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Cachama a la Plancha", descripcion: "Cachama del río Arauca cocinada a la plancha con mantequilla, ajo y hierbas llaneras.", precio: 32000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Masato de Maíz Llanero", descripcion: "Bebida fermentada de maíz con piña y canela. Refrescante y tradicional de los llanos orientales.", precio: 9000, categoria: "Bebidas", imagen_url: IMG.bebida },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "20% de descuento en Mamona Llanera los domingos." },
      { tipo: "PROMO", descripcion: "Cachama + Palo a Pique + Masato por $55.000 para 2." },
    ],
  },
  {
    nombre: "Sabor Casanareño",
    ciudad: "Yopal",
    direccion: "Carrera 23 #13-30, Yopal",
    whatsapp: "+57 315 2345678",
    email: "partner@saborcasanareno.com",
    dishes: [
      { nombre: "Mamona Casanareña", descripcion: "Ternera criolla de los llanos de Casanare asada en vara durante 6 horas. Tradición ganadera llanera.", precio: 50000, categoria: "Carnes", imagen_url: IMG.carne },
      { nombre: "Hayacas Casanareñas", descripcion: "Tamal llanero de carne y arroz sazonado con comino y pimienta negra, envuelto en hoja de plátano.", precio: 16000, categoria: "Típico", imagen_url: IMG.tipico },
      { nombre: "Tungos Llaneros", descripcion: "Arroz con leche y especias envuelto en hoja de maíz. El postre dulce de la tradición llanera.", precio: 10000, categoria: "Postres", imagen_url: IMG.postre },
      { nombre: "Cachama Frita de Casanare", descripcion: "Cachama criada en los ríos y estanques de Casanare, frita entera con sal y servida con yuca.", precio: 30000, categoria: "Pescados", imagen_url: IMG.pescado },
      { nombre: "Palo a Pique Casanareño", descripcion: "Carne de res con fríjoles negros, hogao y plátano. El plato cotidiano del ganadero llanero.", precio: 25000, categoria: "Típico", imagen_url: IMG.tipico },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "15% de descuento en Mamona los sábados y domingos." },
      { tipo: "PROMO", descripcion: "Hayacas x2 + Masato + Tungos por $38.000." },
    ],
  },
  {
    nombre: "Island Flavors San Andrés",
    ciudad: "San Andrés",
    direccion: "Av. Colombia #1-98, La Loma, San Andrés Isla",
    whatsapp: "+57 314 3456789",
    email: "partner@islandflavors.com",
    dishes: [
      { nombre: "Rondón Isleño", descripcion: "Sopa tradicional de la isla con caracol, rabo de cerdo, yuca, ñame, plátano y leche de coco. Patrimonio culinario.", precio: 45000, categoria: "Sopas", imagen_url: IMG.sopa },
      { nombre: "Cangrejo Guisado Caribeño", descripcion: "Cangrejo de la isla guisado con leche de coco, ají, cebolla y especias isleñas. Sabor auténtico del Caribe.", precio: 38000, categoria: "Mariscos", imagen_url: IMG.mar },
      { nombre: "Arroz con Coco Isleño", descripcion: "Arroz cocinado en leche de coco fresco con pasas y canela. La receta de las abuelas raizales.", precio: 18000, categoria: "Arroz", imagen_url: IMG.arroz },
      { nombre: "Johnny Cake", descripcion: "Pan frito de harina de trigo, levadura y sal, tradicional del desayuno isleño. Crujiente por fuera, suave por dentro.", precio: 9000, categoria: "Desayunos", imagen_url: IMG.snack },
      { nombre: "Stew Fish Sanandresano", descripcion: "Pescado del Caribe guisado en salsa de tomate, leche de coco, pimientos y especias raizales.", precio: 36000, categoria: "Pescados", imagen_url: IMG.pescado },
    ],
    promos: [
      { tipo: "DESCUENTO", descripcion: "25% de descuento en Rondón Isleño los martes." },
      { tipo: "PROMO", descripcion: "Stew Fish + Arroz con Coco + Johnny Cake por $50.000." },
    ],
  },
];

async function seed() {
  console.log("🌱 Iniciando seed de producción...\n");

  const hash = await bcrypt.hash("123456", 10);
  console.log("🔐 Contraseñas hasheadas");

  // Limpiar tablas en orden correcto (FK)
  await pool.query("DELETE FROM promotions");
  await pool.query("DELETE FROM dishes");
  await pool.query("DELETE FROM restaurants");
  await pool.query("DELETE FROM partners");
  await pool.query("DELETE FROM unsatisfied_searches");
  console.log("🗑️  Tablas limpiadas\n");

  // Resetear secuencias
  for (const seq of ["partners_id_seq", "restaurants_id_seq", "dishes_id_seq", "promotions_id_seq"]) {
    await pool.query(`SELECT setval('${seq}', 1, false)`).catch(() => {});
  }

  let totalDishes = 0;
  let totalPromos = 0;

  for (const r of RESTAURANTS) {
    // Partner
    const pRes = await pool.query(
      "INSERT INTO partners (email, password_hash) VALUES ($1, $2) RETURNING id",
      [r.email, hash]
    );
    const partner_id = pRes.rows[0].id;

    // Restaurante
    const rRes = await pool.query(
      "INSERT INTO restaurants (nombre, ciudad, direccion, whatsapp, activo, partner_id) VALUES ($1,$2,$3,$4,1,$5) RETURNING id",
      [r.nombre, r.ciudad, r.direccion, r.whatsapp, partner_id]
    );
    const restaurante_id = rRes.rows[0].id;

    // Platos
    for (const d of r.dishes) {
      await pool.query(
        "INSERT INTO dishes (restaurante_id, nombre, descripcion, precio, categoria, imagen_url, disponible) VALUES ($1,$2,$3,$4,$5,$6,1)",
        [restaurante_id, d.nombre, d.descripcion, d.precio, d.categoria, d.imagen_url]
      );
      totalDishes++;
    }

    // Promociones
    for (const p of r.promos) {
      await pool.query(
        "INSERT INTO promotions (restaurante_id, tipo, descripcion, activo) VALUES ($1,$2,$3,1)",
        [restaurante_id, p.tipo, p.descripcion]
      );
      totalPromos++;
    }

    process.stdout.write(`✅ ${r.ciudad.padEnd(28)} → partner:${partner_id} restaurante:${restaurante_id}\n`);
  }

  // Verificar conteos
  const [p, r, d, pr] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS c FROM partners"),
    pool.query("SELECT COUNT(*)::int AS c FROM restaurants"),
    pool.query("SELECT COUNT(*)::int AS c FROM dishes"),
    pool.query("SELECT COUNT(*)::int AS c FROM promotions"),
  ]);

  console.log("\n📊 TOTALES FINALES:");
  console.log(`  partners:    ${p.rows[0].c}`);
  console.log(`  restaurants: ${r.rows[0].c}`);
  console.log(`  dishes:      ${d.rows[0].c}`);
  console.log(`  promotions:  ${pr.rows[0].c}`);
  console.log("\n✅ Seed completado exitosamente.");

  await pool.end();
}

seed().catch((e) => {
  console.error("❌ Error en seed:", e.message);
  process.exit(1);
});
