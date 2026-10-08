# Casa Moraira — sitio web

Sitio estático (HTML + CSS + JS), sin dependencias.

## Estructura

```
index.html                  Home
habitaciones/               Listado + una ficha por habitación
paginas/                    lacasa, experiencia, cartagena, recomendaciones, faq
css/
  main.css                  ← GENERADO. Es el único CSS que cargan las páginas
  build-css.sh              Une los módulos de src/ en main.css
  src/
    build-manifest.txt      Orden de los módulos
    base/                   tokens (colores, espaciado, alturas), reset, tipografía
    layout/                 contenedores, utilidades, animación .reveal
    components/             botones, header, footer, banner, cta-band, faq, tarjetas…
    pages/                  estilos propios de home y habitaciones
js/main.js
```

## Editar los estilos

1. Modifica el módulo correspondiente en `css/src/`.
2. Ejecuta `./css/build-css.sh` para regenerar `css/main.css`.
3. **Nunca edites `main.css` a mano**: se sobrescribe.

## Convenciones CSS

- **Tokens primero:** colores, espaciado y alturas viven en `src/base/tokens.css`.
  Los componentes usan tokens semánticos (`--color-accent`, `--color-text-muted`…).
- **Nombres BEM:** `bloque`, `bloque__elemento`, `bloque--modificador`.
- **Sin `!important`** (salvo `reduced-motion` y `.visually-hidden`) ni estilos en línea.
- **Breakpoints:** 1100 (menú), 980 (tablet), 768 (móvil), 520 (móvil pequeño).

## Banner de página (altura única)

La primera sección de todas las páginas interiores es `.page-banner`.
Su altura sale de **una sola variable**: `--banner-h` (escritorio, 40rem) y
`--banner-h-sm` (imagen en móvil, 20rem), en `src/base/tokens.css`.
Para cambiar el tamaño de todos los banners, edita esas dos líneas y reconstruye.

```html
<section class="page-banner">
  <div class="page-banner__media"><img src="…" alt="…" fetchpriority="high"></div>
  <div class="wrap"><div class="page-banner__card reveal"> kicker, h1, texto </div></div>
</section>
```

La home usa `.hero` (pantalla completa con vídeo) y queda fuera de esta regla.

## Franjas de cierre

`.cta-band` + modificador: `--white`, `--plain`, `--terracotta`, `--gold`.
Botón sobre fondos de color: `.btn-gold`.
