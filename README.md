# Casa Moraira — Sitio web boutique

Web estática (HTML5 + CSS3 + JavaScript, sin frameworks) para el hotel boutique
**Casa Moraira**: página de inicio completa con las 11 secciones solicitadas y
una página de detalle para cada una de las 5 habitaciones.

## 1. Estructura de carpetas

```
casa-moraira/
├── index.html                 # Página de inicio (todas las secciones)
├── habitaciones/
│   ├── sol.html                # Página de detalle — Habitación Sol
│   ├── arena.html              # Página de detalle — Habitación Arena
│   ├── luna.html                # Página de detalle — Habitación Luna
│   ├── agua.html                # Página de detalle — Habitación Agua
│   └── mar.html                 # Página de detalle — Habitación Mar
├── css/
│   └── styles.css              # Toda la hoja de estilos del sitio
├── js/
│   └── main.js                 # Menú móvil, scroll, animaciones y simulador de reservas
├── assets/
│   └── img/                    # Imágenes de ejemplo (placeholders), ver sección 4
└── README.md
```

Cada habitación vive en su propia URL relativa, tal y como pedía el encargo:

```
/habitaciones/sol.html    → pensada para servirse como /habitaciones/sol
/habitaciones/arena.html  → /habitaciones/arena
/habitaciones/luna.html   → /habitaciones/luna
/habitaciones/agua.html   → /habitaciones/agua
/habitaciones/mar.html    → /habitaciones/mar
```
(Al subir el sitio a un servidor con URLs "limpias", o al convertirlo a WordPress,
estas rutas pueden quedar exactamente como `/habitaciones/sol/`, etc.)

## 2. Cómo ejecutar el proyecto

Es un sitio 100% estático: no necesita `build`, ni Node, ni dependencias.

**Opción A — abrir directamente**
Haz doble clic en `index.html` y se abrirá en el navegador. (Algunas rutas
relativas funcionan mejor con un servidor local, ver Opción B.)

**Opción B — servidor local (recomendado)**
Desde la carpeta `casa-moraira/`:

```bash
# Con Python 3
python3 -m http.server 8000

# o con Node
npx serve .
```

Luego visita `http://localhost:8000` en el navegador.

## 3. Qué incluye cada sección de `index.html`

1. **Header** — navegación fija, menú hamburguesa en móvil, botón "Reservar" en terracota.
2. **Hero** — pantalla completa, imagen de ejemplo, título, eslogan y CTA "Reservar estancia".
3. **Presentación** ("Un lugar para bajar el ritmo") — texto + imagen, 5 habitaciones / alberca / cocina / mediterráneo.
4. **Habitaciones** — las 5 habitaciones (Sol, Arena, Luna, Agua, Mar) en filas editoriales alternadas (no cards genéricas de SaaS), cada una con imagen, nombre, descripción, capacidad, características y botón "Ver habitación".
5. **Alberca** — sección visual de pantalla ancha con foto y frase "Días de sol, agua y calma."
6. **Cocina** — "Cocina para compartir", galería + texto.
7. **Experiencia** — "La experiencia Casa Moraira": macramé, troncos de mar, cerámica, textiles.
8. **Reservas** — formulario con check-in, check-out, huéspedes y habitación; al enviarlo, un script de ejemplo simula la disponibilidad y muestra tarjetas de resultado (ver sección 5).
9. **Ubicación** — mapa placeholder, cómo llegar y distancias de ejemplo.
10. **Footer** — enlaces, contacto, redes sociales y derechos reservados.

Cada habitación tiene además su propia página de detalle en `/habitaciones/`
con galería, descripción, capacidad, cama, baño, servicios, precio,
disponibilidad y botón "Reservar".

## 4. Cómo sustituir las imágenes

Todas las imágenes están en `assets/img/` y son **fotografías de ejemplo**
(no son fotos reales del hotel). Para sustituirlas basta con reemplazar el
archivo manteniendo el mismo nombre, o cambiar la ruta en el HTML/CSS:

| Archivo                          | Dónde se usa                          |
|-----------------------------------|----------------------------------------|
| `hero-villa.jpg`                  | Fondo del Hero (en `css/styles.css`, clase `.hero`) |
| `presentacion.jpg`                | Sección "Un lugar para bajar el ritmo" |
| `pool.jpg`                        | Fondo de la sección Alberca (en `css/styles.css`, clase `.full-bleed.pool`) |
| `cocina-1.jpg` / `-2` / `-3`      | Galería de la sección Cocina |
| `exp-macrame.jpg`, `exp-troncos.jpg`, `exp-ceramica.jpg`, `exp-textiles.jpg` | Sección Experiencia |
| `room-<id>.jpg`                   | Imagen principal de cada habitación (portada en la lista y en su página de detalle) |
| `room-<id>-2.jpg` / `-3` / `-4`   | Galería de cada página de detalle |

`<id>` es uno de: `sol`, `arena`, `luna`, `agua`, `mar`.

Recomendaciones:
- Usa imágenes horizontales de al menos 1600 px de ancho para el Hero y la Alberca.
- Usa fotos en formato 4:3 o 3:2 para las habitaciones.
- Comprime las imágenes (JPEG calidad 70–80 o WebP) antes de subirlas, para no penalizar la velocidad de carga.
- Actualiza también el texto `alt="..."` de cada imagen para que describa la fotografía real.

## 5. Cómo sustituir los textos y datos de ejemplo

Todo dato que **no fue proporcionado** en el encargo original está marcado
claramente en el propio texto con un asterisco (`*`) y acompañado de una nota
en cursiva del tipo:

> *Datos de ejemplo. Sustituir por la información real…*

Esto incluye:
- Precios por noche de cada habitación (`120 €`, `110 €`, etc., en `js/main.js` dentro de `ROOMS_DEMO`, y en cada `habitaciones/<id>.html`).
- Capacidad, tipo de cama, baño y servicios de cada habitación.
- Dirección exacta y distancias en la sección Ubicación.
- Teléfono, email y enlaces de redes sociales en el footer.
- El mapa de la sección Ubicación es un marcador de posición (`div` con texto), pendiente de sustituir por un iframe de Google Maps / OpenStreetMap con la dirección real.

Para editar un texto, busca directamente la palabra en el `.html` correspondiente:
todos los archivos están comentados por secciones (`<!-- === NOMBRE === -->`)
para facilitar la localización.

## 6. El formulario de reservas

El formulario de la sección "Reservas" (`index.html`) y el botón "Reservar"
de cada página de habitación **no están conectados a un sistema de reservas
real.** El archivo `js/main.js` incluye una simulación (`ROOMS_DEMO`) que:

1. Calcula el número de noches entre el check-in y el check-out.
2. Filtra las habitaciones de ejemplo según la habitación elegida.
3. Muestra tarjetas de resultado con precio y un botón "Ver / Reservar".

Para conectarlo a un sistema real (PMS, Channel Manager, o una API propia):
- Sustituye el array `ROOMS_DEMO` por una llamada `fetch()` a tu API, enviando `checkin`, `checkout`, `guests` y `room`.
- Sustituye la función `renderResults` para pintar la respuesta real (disponibilidad, precio dinámico, moneda, impuestos, etc.).
- El HTML y los estilos ya están preparados: no hace falta tocar el CSS.

## 7. Conversión a tema de WordPress

La estructura se ha mantenido intencionadamente simple para facilitar una
futura conversión a un tema personalizado:

- `index.html` → `front-page.php` / `home.php` (cada sección puede convertirse en un `get_template_part()`).
- `habitaciones/<id>.html` → `single-habitacion.php` (custom post type `habitacion` con campos personalizados para precio, capacidad, cama, baño y servicios — ideal con Advanced Custom Fields).
- `css/styles.css` → puede copiarse casi tal cual como hoja de estilos del tema (cabecera de tema de WordPress aparte).
- `js/main.js` → encolar con `wp_enqueue_script`.
- El formulario de reservas puede sustituirse por un plugin de reservas (ej. un motor de channel manager) o por un formulario conectado vía AJAX/REST API de WordPress.

## 8. Accesibilidad y rendimiento

- Foco de teclado visible en todos los elementos interactivos.
- Respeta `prefers-reduced-motion` (desactiva animaciones si el usuario lo prefiere).
- Enlace "Saltar al contenido" para lectores de pantalla.
- Imágenes con `loading="lazy"` y textos `alt` descriptivos.
- Sin dependencias externas salvo Google Fonts (Cormorant Garamond + Lato).
# casamorairaboutique
